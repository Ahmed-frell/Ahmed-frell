#!/usr/bin/env python3
"""Rough cut (cuts + zooms only) for the Blue Zone presenter reel.

Usage: roughcut.py config.json out_dir [--render WxH]

1. Speech segments per take come from silence detection (work/sil/th_<id>.txt, -42 dB, >=0.30 s).
2. Pauses longer than `max_pause` become jump cuts (keep 0.08 s before speech and 0.12 s after).
3. Excluded ranges (outtakes, pre-roll) are removed.
4. Long continuous stretches are split into shots of 1.6-3.2 s at breath dips (no time removed).
5. Every shot gets a framing: W (100 %), M (~132 %) or C (~165 %), centred on the tracked head. A jump cut always changes
   framing so the jump reads as an intentional punch (reference grammar). Each shot also drifts in slightly (+4 %).
Writes edl.json (frame-accurate, reusable by the Remotion assembly) and renders a rough-cut MP4 with the cleaned voice.
"""
import json, subprocess, sys, os, numpy as np, wave

cfg = json.load(open(sys.argv[1])); out_dir = sys.argv[2]; os.makedirs(out_dir, exist_ok=True)
render = '--render' in sys.argv
RW, RH = (map(int, sys.argv[sys.argv.index('--render') + 1].split('x')) if render else (360, 640))
FPS = 30; SR = 48000
ROOT = cfg['root']
ZOOM = {'W': 1.0, 'M': 1.32, 'C': 1.65}

def load_pcm(p, sr):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32)

def speech_segments(silfile, dur):
    sil = [tuple(map(float, l.split())) for l in open(silfile) if l.strip()]
    segs, t = [], 0.0
    for s, e in sil:
        if s - t > 0.25: segs.append([t, s])
        t = e
    if dur - t > 0.25: segs.append([t, dur])
    return segs

def breath_points(env, a, b):
    """local energy minima (10 ms frames) at least 14 dB below the stretch median"""
    i0, i1 = int(a * 100), int(b * 100); seg = env[i0:i1]
    if len(seg) < 30: return []
    med = np.median(seg); pts = []
    for i in range(8, len(seg) - 8):
        if seg[i] == seg[i - 8:i + 9].min() and med - seg[i] > 14: pts.append((i0 + i) / 100)
    return pts

shots = []
for take in cfg['takes']:
    tid = take['id']; src = f"{ROOT}/work/proxy/th_{tid}.mp4"
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src], capture_output=True, text=True).stdout)
    segs = speech_segments(f"{ROOT}/work/sil/th_{tid}.txt", dur)
    ex = [tuple(r) for r in take.get('exclude', [])]
    segs = [s for s in segs if s[0] >= take.get('start', 0) and s[1] <= take.get('end', dur)
            and not any(s[0] < e and s[1] > a for a, e in ex)]
    # keep-intervals with handles; merge short natural pauses
    keep = []
    for a, b in segs:
        a2, b2 = max(0, a - 0.08), min(dur, b + 0.12)
        if keep and a2 - keep[-1][1] < cfg.get('max_pause', 0.28):
            keep[-1][1] = b2; keep[-1][2] = keep[-1][2]
        else:
            keep.append([a2, b2, bool(keep)])          # third field: starts after a jump cut
    # drop an isolated fragment shorter than min_tail at the end of a take (stray word/breath after the last line)
    while len(keep) > 1 and keep[-1][2] and keep[-1][1] - keep[-1][0] < cfg.get('min_tail', 0.6):
        print(f"  dropped tail fragment {tid} {keep[-1][0]:.2f}-{keep[-1][1]:.2f}"); keep.pop()
    pcm = load_pcm(f"{ROOT}/work/audio/th_{tid}_clean.wav", 16000)
    n = len(pcm) // 160; env = 20 * np.log10(np.sqrt((pcm[:n * 160].reshape(n, 160) ** 2).mean(1)) + 1e-9)
    env = np.convolve(env, np.ones(5) / 5, 'same')
    track = json.load(open(f"{ROOT}/work/track/th_{tid}.json"))
    for k, (a, b, jump) in enumerate(keep):
        # split long stretches at breaths into 1.6-3.2 s shots
        bps = breath_points(env, a + 1.6, b - 1.2); cuts = [a]
        for p in bps:
            if p - cuts[-1] >= 1.6 and (p - cuts[-1] >= 2.4 or b - p < 3.2): cuts.append(p)
        cuts.append(b)
        for j in range(len(cuts) - 1):
            s = {'take': tid, 'src': src, 'in': cuts[j], 'out': cuts[j + 1],
                 'after': 'take-start' if (k == 0 and j == 0) else ('jump' if (jump and j == 0) else 'breath')}
            near = min(track['samples'], key=lambda q: abs(q['t'] - (s['in'] + s['out']) / 2))
            s['cx'] = float(np.median([q['cx'] for q in track['samples'] if abs(q['t'] - near['t']) <= 4]))
            s['cy'] = float(np.median([q['cy'] for q in track['samples'] if abs(q['t'] - near['t']) <= 4]))
            shots.append(s)

# framing pattern; force a change on jump cuts and take changes
pattern = ['W', 'M', 'C', 'M', 'W', 'C', 'M', 'C']
prev = None
for i, s in enumerate(shots):
    f = pattern[i % len(pattern)]
    if prev is not None and f == prev: f = 'M' if prev != 'M' else 'C'
    if s['after'] in ('jump', 'take-start') and prev is not None and abs(ZOOM[f] - ZOOM[prev]) < 0.3:
        f = 'W' if prev != 'W' else 'C'
    s['frame'] = f; prev = f

# frame-accurate timeline
t = 0
for s in shots:
    fin, fout = round(s['in'] * FPS), round(s['out'] * FPS)
    s['in_f'], s['out_f'] = fin, fout; s['frames'] = fout - fin
    s['rec_in_f'] = t; t += s['frames']
    s['z0'] = ZOOM[s['frame']]; s['z1'] = round(s['z0'] * 1.04, 4)
total_f = t
json.dump({'fps': FPS, 'total_frames': total_f, 'duration_s': round(total_f / FPS, 3), 'shots': shots,
           'config': cfg}, open(f"{out_dir}/edl.json", 'w'), indent=1)
print(f"{len(shots)} shots, {total_f / FPS:.2f} s (source speech kept from {len(cfg['takes'])} takes)")
for i, s in enumerate(shots):
    print(f"{i + 1:3d} rec {s['rec_in_f'] / FPS:6.2f}  {s['take']} {s['in']:6.2f}-{s['out']:6.2f} ({s['frames'] / FPS:4.2f}s) {s['frame']} after={s['after']}")
if not render: sys.exit()

# ---- render: per-shot video at RWxRH, then concat; audio assembled sample-accurately with 6 ms fades
tmp = f"{out_dir}/shots"; os.makedirs(tmp, exist_ok=True)
lst = open(f"{tmp}/list.txt", 'w')
for i, s in enumerate(shots):
    N = s['frames']; iw, ih = 1440, 2560
    zx = f"({s['z0']}+({s['z1']}-{s['z0']})*on/{max(1, N - 1)})"
    # crop centre: x on the head; y puts the head ~30 % from the top of the crop (W = full frame)
    xc, yc = s['cx'] * iw, s['cy'] * ih
    x = f"max(0,min(iw-iw/zoom,{xc}-iw/zoom/2))"
    y = f"max(0,min(ih-ih/zoom,{yc}-0.30*ih/zoom))"
    vf = f"zoompan=z='{zx}':x='{x}':y='{y}':d=1:s={RW}x{RH}:fps={FPS},setsar=1,format=yuv420p"
    of = f"{tmp}/s{i:03d}.mp4"
    subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-ss', f"{s['in_f'] / FPS:.4f}", '-i', s['src'], '-frames:v', str(N),
                    '-vf', vf, '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-r', str(FPS), of], check=True)
    lst.write(f"file '{os.path.abspath(of)}'\n")
lst.close()
subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', f"{tmp}/list.txt", '-c', 'copy', f"{out_dir}/video_silent.mp4"], check=True)
audio = np.zeros(total_f * (SR // FPS), np.float32); fade = int(0.006 * SR)
cache = {}
for s in shots:
    if s['take'] not in cache: cache[s['take']] = load_pcm(f"{ROOT}/work/audio/th_{s['take']}_clean.wav", SR)
    a = cache[s['take']][s['in_f'] * (SR // FPS): s['out_f'] * (SR // FPS)].copy()
    a = np.pad(a, (0, max(0, s['frames'] * (SR // FPS) - len(a))))
    a[:fade] *= np.linspace(0, 1, fade); a[-fade:] *= np.linspace(1, 0, fade)
    o = s['rec_in_f'] * (SR // FPS); audio[o:o + len(a)] = a
with wave.open(f"{out_dir}/voice.wav", 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(audio, -1, 1) * 32767).astype('<i2').tobytes())
print('rendered shots + voice')
