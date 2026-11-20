#!/usr/bin/env python3
"""Deterministic picture track for the 90-s Bluezone brand film (1080x1920, 30 fps).
Usage: brand_bg.py timeline.json img_dir clip_dir out.mp4
Shot types
  still : full-bleed photo/render, eased push/pan (same maths as renders-reel render_bg.py)
  card  : brochure image shown at native size as a framed card over a blurred, darkened copy of itself, slow push
  video : pre-cut 1080x1920 clip (genuine walkthrough footage)
  reveal: card of a plan, then a soft diagonal wipe to the full-bleed render of the same villa
Scene boundaries marked xin dissolve over 12 frames. Grade is applied afterwards with FFmpeg."""
import sys, json, math, subprocess
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

W, H, FPS = 1080, 1920, 30
tl = json.load(open(sys.argv[1])); IMG, CLIP, OUT = sys.argv[2], sys.argv[3], sys.argv[4]
shots = tl['shots']; total = round(tl['picture_end'] * FPS)
fr = lambda s: round(s * FPS)

def bez(x1, y1, x2, y2):
    def f(x):
        lo, hi = 0.0, 1.0
        for _ in range(40):
            m = (lo + hi) / 2
            bx = 3 * (1 - m) ** 2 * m * x1 + 3 * (1 - m) * m ** 2 * x2 + m ** 3
            lo, hi = (m, hi) if bx < x else (lo, m)
        t = (lo + hi) / 2
        return 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t ** 2 * y2 + t ** 3
    return f
ease = bez(0.33, 0, 0.67, 1)
lerp = lambda a, b, p: a + (b - a) * p

cache = {}
def load(name):
    if name not in cache:
        if len(cache) > 6: cache.clear()
        cache[name] = Image.open(f'{IMG}/{name}.jpg').convert('RGB')
    return cache[name]

def still(name, mv, p):
    im = load(name); iw, ih = im.size
    s = lerp(mv['s'][0], mv['s'][1], p)
    sc = (H / ih) * s; sc = max(sc, W / iw * 1.0001)
    dw, dh = iw * sc, ih * sc
    left = min(0, max(W - dw, W / 2 - lerp(mv['x'][0], mv['x'][1], p) * dw))
    top = min(0, max(H - dh, H / 2 - lerp(mv['y'][0], mv['y'][1], p) * dh))
    k = 1 / sc
    return im.transform((W, H), Image.AFFINE, (k, 0, -left * k, 0, k, -top * k), resample=Image.BICUBIC)

card_cache = {}
def card_parts(name, width):
    key = (name, width)
    if key not in card_cache:
        if len(card_cache) > 4: card_cache.clear()
        im = load(name); iw, ih = im.size
        cs = max(W / iw, H / ih) * 1.08
        bg = im.resize((int(iw * cs), int(ih * cs)), Image.LANCZOS)
        bg = bg.crop(((bg.width - W) // 2, (bg.height - H) // 2, (bg.width - W) // 2 + W, (bg.height - H) // 2 + H))
        bg = bg.filter(ImageFilter.GaussianBlur(38))
        bg = Image.blend(bg, Image.new('RGB', (W, H), (12, 18, 14)), 0.45)
        fh = int(ih * width / iw)
        fg = im.resize((width, fh), Image.LANCZOS)
        mask = Image.new('L', (width, fh), 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, width - 1, fh - 1), 22, fill=255)
        sh = Image.new('L', (width + 160, fh + 160), 0); ImageDraw.Draw(sh).rounded_rectangle((80, 95, width + 80, fh + 95), 26, fill=150)
        sh = sh.filter(ImageFilter.GaussianBlur(28))
        card_cache[key] = (bg, fg, mask, sh)
    return card_cache[key]

def card(name, mv, p):
    width = mv.get('w', 1000)
    bg, fg, mask, sh = card_parts(name, width)
    s = lerp(mv['s'][0], mv['s'][1], p)
    out = bg.copy()
    cy = mv.get('cy', 0.47) * H
    fw, fh = int(fg.width * s), int(fg.height * s)
    f2 = fg.resize((fw, fh), Image.BICUBIC); m2 = mask.resize((fw, fh), Image.BICUBIC)
    s2 = sh.resize((int(sh.width * s), int(sh.height * s)), Image.BICUBIC)
    x = int(W / 2 - fw / 2 + lerp(mv.get('dx', [0, 0])[0], mv.get('dx', [0, 0])[1], p)); y = int(cy - fh / 2)
    out.paste((0, 0, 0), (x - int(80 * s), y - int(80 * s)), s2)
    out.paste(f2, (x, y), m2)
    return out

vids = {}
def video(name, local):
    if name not in vids:
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'{CLIP}/{name}.mp4', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
        vids.clear(); vids[name] = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
    a = vids[name]; return Image.fromarray(a[min(local, len(a) - 1)])

def render(s, local, dur):
    p = ease(min(1, max(0, local / max(1, dur - 1))))
    t, mv = s['type'], s.get('move', {})
    if t == 'still': return still(s['src'], mv, p)
    if t == 'card': return card(s['src'], mv, p)
    if t == 'video': return video(s['src'], local + fr(s.get('offset', 0)))
    if t == 'reveal':
        a0, a1 = fr(s['wipe'][0]) - fr(s['from']), fr(s['wipe'][1]) - fr(s['from'])
        A = card(s['src'], mv, min(1, local / max(1, a1)) * 0.5)
        if local < a0: return A
        pb = ease(min(1, max(0, (local - a0) / max(1, dur - a0 - 1))))
        Bm = still(s['src2'], s['move2'], pb)
        q = min(1, (local - a0) / max(1, a1 - a0))
        yy, xx = np.mgrid[0:H, 0:W]
        edge = (xx / W * 0.35 + (1 - yy / H) * 0.65)  # sweeps from bottom-left to top-right
        m = np.clip((q * 1.3 - edge) / 0.12, 0, 1)[..., None]
        return Image.fromarray((np.asarray(A, np.float32) * (1 - m) + np.asarray(Bm, np.float32) * m).astype(np.uint8))
    raise ValueError(t)

spans = []
for i, s in enumerate(shots):
    nxt = shots[i + 1] if i + 1 < len(shots) else None
    pre = 6 if s.get('xin') else 0
    post = 6 if nxt and nxt.get('xin') else 0
    st = fr(s['from']) - pre
    spans.append((st, fr(s['to']) + post - st, pre))

enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                        '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '13',
                        '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', OUT], stdin=subprocess.PIPE)
for k in range(total):
    frame = None
    for i, s in enumerate(shots):
        st, dur, pre = spans[i]
        if not (st <= k < st + dur): continue
        img = np.asarray(render(s, k - st, dur), np.float32)
        if frame is None: frame = img; continue
        a = min(1.0, max(0.0, (k - (fr(s['from']) - 6)) / 12)) if s.get('xin') else 1.0
        frame = frame * (1 - a) + img * a
    if frame is None: frame = np.zeros((H, W, 3), np.float32)
    enc.stdin.write(np.clip(frame + 0.5, 0, 255).astype(np.uint8).tobytes())
    if k % 300 == 0: print('frame', k, '/', total, flush=True)
enc.stdin.close(); enc.wait(); print('wrote', OUT, total)
