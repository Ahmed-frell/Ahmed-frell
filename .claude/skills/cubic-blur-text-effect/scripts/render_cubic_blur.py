#!/usr/bin/env python3
"""Render "cubic blur" kinetic captions onto a video.

usage: render_cubic_blur.py IN.mp4 captions.json OUT.mp4 [--start S] [--duration D]
                            [--crf 18] [--no-auto-overlap] [--still T OUT.png]

Look: white heavy-sans text, Overlay blend, cubic fade-in, Gaussian-blur + fade-out,
chunks overlapping. See ../SKILL.md for the captions.json schema.
Needs: ffmpeg/ffprobe, numpy, Pillow.
"""
import argparse, json, math, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

DEFAULTS = {
    "font": "/usr/share/fonts/opentype/inter/InterDisplay-ExtraBold.otf",
    "key_size": 0.19, "small_ratio": 0.42, "tracking": -0.03, "line_gap": 0.03,
    "blend": "overlay", "opacity": 1.0,
    "in_frames": 8, "out_frames": 10, "overlap_frames": 4, "blur_px": 35,
    "max_pause_bridge": 0.6,   # don't auto-extend a chunk across a pause longer than this (s)
    "behind": False,           # True: people occlude the text (needs --matte-model)
    "safe_rect": None,         # [x0, y0, x1, y1] (0-1): text is clipped to this box, e.g. the picture inside letterbox bars
}


class PersonMatte:
    """Person mask per frame using a MediaPipe image-segmenter .tflite (selfie_multiclass_256x256 or selfie_segmenter)."""
    def __init__(self, model, rect_px, smooth=0.35):
        import mediapipe as mp
        from mediapipe.tasks import python as mpt
        from mediapipe.tasks.python import vision
        self.mp = mp
        opts = vision.ImageSegmenterOptions(base_options=mpt.BaseOptions(model_asset_path=model),
                                            output_confidence_masks=True)
        self.seg = vision.ImageSegmenter.create_from_options(opts)
        self.rect = rect_px          # (x0, y0, x1, y1) region to segment
        self.smooth = smooth         # temporal smoothing (0 = none)
        self.prev = None
        self.cache_t = None
        self.cache = None

    def get(self, frame_u8, t):
        if self.cache_t == t:
            return self.cache
        x0, y0, x1, y1 = self.rect
        crop = np.ascontiguousarray(frame_u8[y0:y1, x0:x1])
        r = self.seg.segment(self.mp.Image(image_format=self.mp.ImageFormat.SRGB, data=crop))
        cm = r.confidence_masks
        m = np.squeeze(cm[0].numpy_view()).astype(np.float32)
        m = m if len(cm) == 1 else 1.0 - m          # multiclass: mask 0 = background
        m = np.clip((m - 0.35) / 0.3, 0, 1)          # firm up the edge
        im = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))
        m = np.asarray(im, dtype=np.float32) / 255.0
        if self.prev is not None and self.smooth > 0 and np.abs(m - self.prev).mean() < 0.08:
            m = self.smooth * self.prev + (1 - self.smooth) * m   # no smoothing across cuts
        self.prev = m
        full = np.zeros(frame_u8.shape[:2], np.float32)
        full[y0:y1, x0:x1] = m
        self.cache_t, self.cache = t, full
        return full


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height,r_frame_rate:stream_side_data=rotation:format=duration",
                          "-of", "json", path], capture_output=True, text=True, check=True).stdout
    j = json.loads(out)
    s = j["streams"][0]
    num, den = s["r_frame_rate"].split("/")
    w, h = int(s["width"]), int(s["height"])
    rot = 0
    for sd in s.get("side_data_list", []) or []:
        rot = int(sd.get("rotation", 0) or 0)
    if abs(rot) in (90, 270):
        w, h = h, w
    return w, h, float(num) / float(den), float(j["format"]["duration"])


# ---------- easing ----------
def clamp01(x):
    return 0.0 if x < 0 else 1.0 if x > 1 else x

def cubic_out(t):
    return 1 - (1 - t) ** 3

def quad_in(t):
    return t * t

def quad_out(t):
    return 1 - (1 - t) ** 2


# ---------- text rasterising ----------
_font_cache = {}

def get_font(path, px):
    key = (path, px)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(path, px)
    return _font_cache[key]


def render_line(text, font_path, px, tracking_em):
    """Return an L-mode image of the line cropped to ink, keeping kerning, with tracking."""
    font = get_font(font_path, px)
    track = tracking_em * px
    width = int(font.getlength(text) + abs(track) * len(text) + px * 2)
    canvas = Image.new("L", (width, int(px * 2.0)), 0)
    d = ImageDraw.Draw(canvas)
    baseline = int(px * 1.3)
    x0 = px * 0.5
    for i, ch in enumerate(text):
        x = x0 + font.getlength(text[:i]) + track * i   # prefix length keeps pair kerning
        d.text((x, baseline), ch, font=font, fill=255, anchor="ls")
    bbox = canvas.getbbox()
    if not bbox:
        return Image.new("L", (1, 1), 0)
    return canvas.crop(bbox)


def build_chunk(chunk, cfg, W):
    """Lay out a chunk's lines. Returns list of (mask_np, x, y, delay) in frame pixels."""
    key_px = cfg["key_size"] * W
    small_px = key_px * cfg["small_ratio"]
    gap = cfg["line_gap"] * key_px
    imgs = []
    for line in chunk["lines"]:
        text = line["text"]
        if not line.get("keep_case"):
            text = " ".join(w if w == "I" or w.startswith("I'") else w.lower() for w in text.split())
        if "size" in line:
            px = line["size"] * W
        else:
            px = key_px if line.get("key") else small_px
        imgs.append((render_line(text, cfg["font"], max(8, int(round(px))), cfg["tracking"]),
                     float(line.get("delay", 0.0))))
    stack_w = max(im.width for im, _ in imgs)
    align = chunk.get("align", "left")
    ax, ay = chunk.get("x", 0.5) * W, chunk.get("y", 0.15) * cfg["_H"]
    if align == "right":
        left = ax - stack_w
    elif align == "center":
        left = ax - stack_w / 2
    else:
        left = ax
    out, cy = [], ay
    for im, delay in imgs:
        if align == "right":
            lx = left + stack_w - im.width
        elif align == "center":
            lx = left + (stack_w - im.width) / 2
        else:
            lx = left
        out.append((im, int(round(lx)), int(round(cy)), delay))
        cy += im.height + gap
    return out


# ---------- compositing ----------
def blend_into(frame, mask_img, x, y, alpha, blend, blur_r, clip=None, occluder=None):
    """frame: float32 HxWx3 in 0..1 (modified in place). clip = (x0,y0,x1,y1) px; occluder = HxW person mask."""
    if alpha <= 0.002:
        return
    pad = int(math.ceil(blur_r * 3)) + 2 if blur_r > 0.05 else 0
    m = mask_img
    if pad:
        big = Image.new("L", (m.width + 2 * pad, m.height + 2 * pad), 0)
        big.paste(m, (pad, pad))
        m = big.filter(ImageFilter.GaussianBlur(blur_r))
    x -= pad
    y -= pad
    H, W = frame.shape[:2]
    cx0, cy0, cx1, cy1 = clip if clip else (0, 0, W, H)
    x0, y0 = max(cx0, x), max(cy0, y)
    x1, y1 = min(cx1, x + m.width), min(cy1, y + m.height)
    if x1 <= x0 or y1 <= y0:
        return
    a = np.asarray(m, dtype=np.float32)[y0 - y:y1 - y, x0 - x:x1 - x, None] * (alpha / 255.0)
    if occluder is not None:
        a = a * (1.0 - occluder[y0:y1, x0:x1, None])
    b = frame[y0:y1, x0:x1]
    if blend == "overlay":
        top = np.where(b < 0.5, 2 * b, 1.0)
    elif blend == "soft_light":
        top = 2 * b - b * b
    elif blend == "screen":
        top = np.ones_like(b)  # screen with white = white
    else:  # normal
        top = np.ones_like(b)
    frame[y0:y1, x0:x1] = b + a * (top - b)


def line_state(t, start, end, delay, fps, c):
    """Return (opacity 0..1, blur radius px at source scale) for a line at time t."""
    t_in = start + delay
    if t < t_in:
        return 0.0, 0.0
    a_in = cubic_out(clamp01((t - t_in) / (c["in_frames"] / fps)))
    p = clamp01((t - end) / (c["out_frames"] / fps)) if t >= end else 0.0
    if p >= 1:
        return 0.0, 0.0
    a_out = 1 - quad_in(p)
    blur = c["_blur_scale"] * c["blur_px"] * quad_out(p)
    return a_in * a_out, blur


def prepare(cfg_raw, W, H, fps, auto_overlap):
    cfg = dict(DEFAULTS)
    cfg.update({k: v for k, v in cfg_raw.items() if k != "chunks"})
    cfg["_H"] = H
    chunks = sorted(cfg_raw["chunks"], key=lambda c: c["start"])
    prepared = []
    for i, ch in enumerate(chunks):
        c = dict(cfg)
        c.update({k: v for k, v in ch.items() if k in DEFAULTS})
        # AE "blurriness" ~ 2*sigma; PIL GaussianBlur radius ~ sigma. blur_px defined at 1080 width.
        c["_blur_scale"] = (W / 1080.0) * 0.5
        end = float(ch["end"])
        if auto_overlap and i + 1 < len(chunks):
            nxt = float(chunks[i + 1]["start"])
            if nxt - end <= cfg["max_pause_bridge"]:
                end = max(end, nxt + c["overlap_frames"] / fps)
        lines = build_chunk(ch, c, W)
        prepared.append({"start": float(ch["start"]), "end": end, "cfg": c, "lines": lines,
                         "t_last": end + c["out_frames"] / fps})
    return prepared


def composite(frame_u8, t, prepared, fps, matte=None):
    f = frame_u8.astype(np.float32) / 255.0
    H, W = f.shape[:2]
    for ch in prepared:
        if t < ch["start"] or t > ch["t_last"]:
            continue
        c = ch["cfg"]
        sr = c.get("safe_rect")
        clip = (int(sr[0] * W), int(sr[1] * H), int(sr[2] * W), int(sr[3] * H)) if sr else None
        occ = None
        if c.get("behind"):
            if matte is None:
                sys.exit("chunk has \"behind\": true but no --matte-model was given")
            occ = matte.get(frame_u8, t)
        for im, x, y, delay in ch["lines"]:
            a, blur = line_state(t, ch["start"], ch["end"], delay, fps, c)
            blend_into(f, im, x, y, a * c["opacity"], c["blend"], blur, clip, occ)
    return (np.clip(f, 0, 1) * 255 + 0.5).astype(np.uint8)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("inp"); ap.add_argument("captions"); ap.add_argument("out")
    ap.add_argument("--start", type=float, default=0.0)
    ap.add_argument("--duration", type=float, default=None)
    ap.add_argument("--crf", type=int, default=18)
    ap.add_argument("--preset", default="medium")
    ap.add_argument("--no-auto-overlap", action="store_true")
    ap.add_argument("--matte-model", default=None,
                    help="MediaPipe image-segmenter .tflite, needed for chunks with \"behind\": true")
    ap.add_argument("--still", type=float, default=None,
                    help="render only the frame at this time (s) to OUT as PNG")
    a = ap.parse_args()

    W, H, fps, dur = probe(a.inp)
    cfg_raw = json.load(open(a.captions))
    prepared = prepare(cfg_raw, W, H, fps, not a.no_auto_overlap)
    matte = None
    if a.matte_model:
        sr = cfg_raw.get("safe_rect") or [0, 0, 1, 1]
        matte = PersonMatte(a.matte_model, (int(sr[0] * W), int(sr[1] * H), int(sr[2] * W), int(sr[3] * H)))

    if a.still is not None:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(a.still), "-i", a.inp, "-frames:v", "1",
                              "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
        fr = np.frombuffer(raw, np.uint8)[:W * H * 3].reshape(H, W, 3)
        Image.fromarray(composite(fr, a.still, prepared, fps, matte)).save(a.out)
        print(f"still {a.still:.2f}s -> {a.out}")
        if matte:
            matte.seg.close()
        return

    seg = ["-ss", str(a.start)] + (["-t", str(a.duration)] if a.duration else [])
    dec = subprocess.Popen(["ffmpeg", "-v", "error"] + seg + ["-i", a.inp, "-f", "rawvideo",
                            "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
                            "-s", f"{W}x{H}", "-r", f"{fps:.6f}", "-i", "-"] + seg + ["-i", a.inp,
                            "-map", "0:v", "-map", "1:a?", "-c:v", "libx264", "-preset", a.preset,
                            "-crf", str(a.crf), "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
                            "-shortest", "-movflags", "+faststart", a.out], stdin=subprocess.PIPE)
    size = W * H * 3
    n = 0
    total = int(((a.duration or (dur - a.start))) * fps)
    while True:
        buf = dec.stdout.read(size)
        if len(buf) < size:
            break
        t = a.start + n / fps
        fr = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
        enc.stdin.write(composite(fr, t, prepared, fps, matte).tobytes())
        n += 1
        if n % 60 == 0:
            print(f"\r{n}/{total} frames", end="", file=sys.stderr)
    enc.stdin.close()
    if matte:
        matte.seg.close()
    dec.wait(); rc = enc.wait()
    print(f"\nwrote {n} frames -> {a.out}" + ("" if rc == 0 else f" (encoder exit {rc})"))
    sys.exit(rc)


if __name__ == "__main__":
    main()
