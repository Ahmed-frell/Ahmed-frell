#!/usr/bin/env python3
"""Person cut-outs (RGBA PNG per frame) so red words / captions can sit BEHIND the speaker.
Usage: fg_matte.py u2net_human_seg.onnx work/aroll.mov work/matte FPS a-b [a-b ...]
  times are seconds on the edit timeline (only the spans that carry a red word or a behind caption).
Files are f<frame:05d>.png at the A-roll's own size, which render_reel.py looks up by frame index.
Model: u2net_human_seg.onnx (rembg release on GitHub). Needs: pip install onnxruntime."""
import sys, os, subprocess, numpy as np, onnxruntime as ort
from PIL import Image, ImageFilter
model, vid, out, fps = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]); os.makedirs(out, exist_ok=True)
W, H = map(int, subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height',
                               '-of', 'csv=p=0', vid], capture_output=True, text=True).stdout.strip().split(',')[:2])
sess = ort.InferenceSession(model, providers=['CPUExecutionProvider']); inp = sess.get_inputs()[0].name
for r in sys.argv[5:]:
    a, b = map(float, r.split('-')); f0, f1 = round(a * fps), round(b * fps)
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{f0 / fps:.4f}', '-i', vid, '-frames:v', str(f1 - f0),
                          '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    frames = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
    for k, fr in enumerate(frames):
        im = Image.fromarray(fr); x = np.asarray(im.resize((320, 320), Image.BILINEAR)).astype(np.float32) / 255.0
        x = ((x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]).transpose(2, 0, 1)[None].astype(np.float32)
        m = sess.run(None, {inp: x})[0][0, 0]; m = (m - m.min()) / (m.max() - m.min() + 1e-8)
        m = np.clip((m - 0.35) / 0.3, 0, 1)
        mask = Image.fromarray((m * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(2.0))
        rgba = im.convert('RGBA'); rgba.putalpha(mask); rgba.save(f'{out}/f{f0 + k:05d}.png', compress_level=1)
    print(r, f1 - f0, 'frames')
