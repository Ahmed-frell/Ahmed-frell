#!/usr/bin/env python3
"""Estimate the presenter's head position per take from a human-segmentation matte (U2-Net human seg, ONNX).
Usage: face_track.py model.onnx video.mp4 out.json [step_s]
Output: samples [{t, head_top, cx, cy}] normalised 0..1, plus the median. Used to centre punch-in crops on the face."""
import sys, json, subprocess, numpy as np, onnxruntime as ort
model, vid, out = sys.argv[1], sys.argv[2], sys.argv[3]
step = float(sys.argv[4]) if len(sys.argv) > 4 else 2.0
dur = float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',vid],capture_output=True,text=True).stdout)
sess = ort.InferenceSession(model, providers=['CPUExecutionProvider']); inp = sess.get_inputs()[0].name
W, H = 320, 320
samples = []
t = 0.5
while t < dur - 0.2:
    raw = subprocess.run(['ffmpeg','-v','error','-ss',f'{t:.2f}','-i',vid,'-frames:v','1','-vf',f'scale={W}:{H}','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout
    x = np.frombuffer(raw, np.uint8).reshape(H, W, 3).astype(np.float32) / 255.0
    x = ((x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]).transpose(2, 0, 1)[None].astype(np.float32)
    m = sess.run(None, {inp: x})[0][0, 0]; m = (m - m.min()) / (m.max() - m.min() + 1e-8) > 0.5
    rows = np.where(m.any(1))[0]
    if len(rows):
        top = rows[0]; band = m[top:top + int(0.11 * H)]
        cols = np.where(band.any(0))[0]
        cx = (cols.min() + cols.max()) / 2 / W if len(cols) else 0.5
        samples.append({'t': round(t, 2), 'head_top': round(top / H, 4), 'cx': round(float(cx), 4), 'cy': round(top / H + 0.075, 4)})
    t += step
med = {k: float(np.median([s[k] for s in samples])) for k in ('head_top', 'cx', 'cy')}
json.dump({'video': vid, 'samples': samples, 'median': med}, open(out, 'w'), indent=1)
print(vid.split('/')[-1], 'samples', len(samples), 'median', {k: round(v, 3) for k, v in med.items()})
