#!/usr/bin/env python3
"""Final mix: voice (unchanged) + ducked music bed + SFX cues aligned to their impact frames.
Usage: mix_sfx.py voice.wav music.wav sfx_dir cues.json duration out.wav report.md
- Each cue {sfx, at, gain} places the sound so its `hit` sample (library.json) lands exactly on `at` (frame-rounded to 30 fps).
- Same-sound cues closer than 0.30 s are merged (keeps the louder) to avoid stacking.
- SFX under speech are pulled down 4 dB (voice stays dominant); music ducked 11 dB under speech.
- Writes a timing report (frame of each cue, sound, reason)."""
import sys, json, wave, subprocess, numpy as np
voice, music, sdir, cuesf, D, out, rep = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], float(sys.argv[5]), sys.argv[6], sys.argv[7]
SR = 48000; N = int(D * SR); FPS = 30
def load(p, ch):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', str(ch), '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, ch).astype(np.float64)
V = np.zeros(N); v = load(voice, 1)[:, 0]; V[:min(N, len(v))] = v[:N]
M = np.zeros((N, 2)); m = load(music, 2); M[:min(N, len(m))] = m[:N]
lib = json.load(open(f'{sdir}/library.json')); cache = {}
# speech activity (10 ms)
hop = 480; n = N // hop
act = (20 * np.log10(np.sqrt((V[:n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-9) > -42).astype(float)
act = np.maximum(act, np.concatenate([act[15:], np.zeros(15)]))
g = np.zeros(n); y = 0.0
for k in range(n):
    a = np.exp(-1 / 6) if act[k] > y else np.exp(-1 / 45); y = a * y + (1 - a) * act[k]; g[k] = y
gm = np.interp(np.arange(N), np.arange(n) * hop + hop / 2, 10 ** ((-3.5 - 11 * g) / 20))
mus = M * gm[:, None]
cues = sorted(json.load(open(cuesf)), key=lambda c: c['at'])
kept = []
for c in cues:
    dup = [k for k in kept if k['sfx'] == c['sfx'] and abs(k['at'] - c['at']) < 0.30]
    if dup:
        if c['gain'] > dup[0]['gain']: kept.remove(dup[0]); kept.append(c)
        continue
    kept.append(c)
kept.sort(key=lambda c: c['at'])
S = np.zeros((N, 2)); rows = []
for c in kept:
    L = lib[c['sfx']]
    if c['sfx'] not in cache: cache[c['sfx']] = load(f"{sdir}/{L['file']}", 2)
    s = cache[c['sfx']]; fr = round(c['at'] * FPS); at = fr / FPS
    i0 = int(round((at - L['hit']) * SR)); a0 = max(0, -i0); i0 = max(0, i0)
    seg = s[a0:a0 + max(0, N - i0)]
    talk = act[min(n - 1, int(at * 100))] > 0.5
    gain = 10 ** ((c['gain'] - (4 if talk else 0)) / 20)
    S[i0:i0 + len(seg)] += seg * gain
    rows.append(f"| {at:7.3f} | {fr:5d} | {c['sfx']} | {c['gain'] - (4 if talk else 0):+.0f} dB{' (under speech)' if talk else ''} | {c.get('why', '')} |")
mix = np.stack([V, V], 1) + mus + S
pk = np.abs(mix).max()
if pk > 0.89: mix *= 0.89 / pk
sp = np.pad(np.repeat(act, hop), (0, max(0, N - n * hop)))[:N] > 0.5
db = lambda x: 10 * np.log10((x ** 2).mean() + 1e-12)
sep = db(V[sp]) - db((mus + S)[sp].mean(1))
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
with open(rep, 'w') as f:
    f.write("# SFX timing report\n\nEvery cue is frame-aligned: the sound's impact sample (library `hit`) lands on the listed frame (30 fps).\n"
            f"{len(kept)} cues after de-duplication ({len(cues)} requested). Voice vs music+SFX during speech: **{sep:.1f} dB**.\n\n"
            "| Time (s) | Frame | Sound | Level | Visual it accompanies |\n|---|---|---|---|---|\n" + "\n".join(rows) + "\n")
print(f'{len(kept)} cues mixed; voice vs (music+sfx) during speech {sep:.1f} dB')
