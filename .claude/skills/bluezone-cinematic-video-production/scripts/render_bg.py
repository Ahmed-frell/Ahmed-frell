#!/usr/bin/env python3
"""Pre-render the camera moves on still renders (Ken Burns push / pan / tilt / pull-back / pulse) into one background video.
Usage: render_bg.py shots.json img_dir out.mp4
Same maths as the Remotion `Still` component: zoom s (1 = image height fills the frame), focus point (x, y) in image fractions,
eased with cubic-bezier(0.33, 0, 0.67, 1), clamped so the image always covers the frame; `pulse` adds a slow 2.4 s breathing zoom.
Each shot's image is first Lanczos-downscaled to its smallest on-screen size, so the per-frame affine resample only ever
magnifies (no aliasing or shimmer on fine detail). Shots with xin=true dissolve in over 10 frames."""
import sys, json, math, subprocess
import numpy as np
from PIL import Image

W, H, FPS = 1080, 1920, 30
cfg = json.load(open(sys.argv[1])); IMG = sys.argv[2]; OUT = sys.argv[3]
shots = cfg['shots']; total = round(cfg['outroFrom'] * FPS)
fr = lambda s: round(s * FPS)

def bezier(x1, y1, x2, y2):
    def bx(t): return 3 * (1 - t) ** 2 * t * x1 + 3 * (1 - t) * t ** 2 * x2 + t ** 3
    def by(t): return 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t ** 2 * y2 + t ** 3
    def f(x):
        lo, hi = 0.0, 1.0
        for _ in range(40):
            mid = (lo + hi) / 2
            if bx(mid) < x: lo = mid
            else: hi = mid
        return by((lo + hi) / 2)
    return f
smooth = bezier(0.33, 0, 0.67, 1)
lerp = lambda a, b, p: a + (b - a) * p

# shot spans incl. dissolve handles (same as the old Remotion Sequence layout)
spans = []
for i, s in enumerate(shots):
    nxt = shots[i + 1] if i + 1 < len(shots) else None
    pre = 5 if s.get('xin') else 0
    post = 5 if nxt and nxt.get('xin') else 0
    st = fr(s['from']) - pre
    spans.append((st, fr(s['to']) + post - st))

cache = {}
def base(i):
    """Image downscaled (Lanczos) to this shot's smallest on-screen scale."""
    if i in cache: return cache[i]
    s = shots[i]; im = Image.open(f"{IMG}/{s['src']}.jpg").convert('RGB')
    smin = min(s['move']['s'])
    b = (H / im.height) * smin
    bi = im.resize((round(im.width * b), round(im.height * b)), Image.LANCZOS) if b < 1 else im
    while len(cache) >= 2: del cache[min(cache)]  # shots run in order; keep the two needed for a dissolve
    cache[i] = (bi, im.width, im.height, bi.width / im.width)
    return cache[i]

def render(i, local):
    s = shots[i]; mv = s['move']; st, dur = spans[i]
    bi, iw, ih, b = base(i)
    p = smooth(min(1, max(0, local / dur)))
    sc_s = lerp(mv['s'][0], mv['s'][1], p)
    if mv.get('pulse'): sc_s *= 1 + mv['pulse'] * (0.5 - 0.5 * math.cos(2 * math.pi * local / 72))
    sc = (H / ih) * sc_s
    dw, dh = iw * sc, ih * sc
    left = W / 2 - lerp(mv['x'][0], mv['x'][1], p) * dw
    top = H / 2 - lerp(mv['y'][0], mv['y'][1], p) * dh
    left = min(0, max(W - dw, left)); top = min(0, max(H - dh, top))
    k = b / sc  # output px -> base-image px
    return bi.transform((W, H), Image.AFFINE, (k, 0, -left * k, 0, k, -top * k), resample=Image.BICUBIC)

enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                        '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '12',
                        '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-movflags', '+faststart', OUT],
                       stdin=subprocess.PIPE)
order = sorted(range(len(shots)), key=lambda i: spans[i][0])
for k in range(total):
    act = [i for i in order if spans[i][0] <= k < spans[i][0] + spans[i][1]]
    frame = None
    for i in act:  # later shot on top
        img = np.asarray(render(i, k - spans[i][0]), dtype=np.float32)
        if frame is None: frame = img; continue
        a = min(1.0, max(0.0, (k - (fr(shots[i]['from']) - 5)) / 10)) if shots[i].get('xin') else 1.0
        frame = frame * (1 - a) + img * a
    enc.stdin.write(np.clip(frame + 0.5, 0, 255).astype(np.uint8).tobytes())
    if k % 150 == 0: print('frame', k, '/', total, flush=True)
enc.stdin.close(); enc.wait()
print('wrote', OUT, total, 'frames')
