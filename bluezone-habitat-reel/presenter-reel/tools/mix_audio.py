#!/usr/bin/env python3
"""Mix: original VO (cleaned, untouched timing) placed at vo_offset + original score, ducked under speech.
Usage: mix_audio.py vo.wav music.wav vo_offset duration out_mix.wav [music_gain_db] [duck_db]
Reports voice-to-music separation during speech (target >= 13 dB)."""
import sys, subprocess, numpy as np, wave
vo_p, mu_p, off, D, out = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), sys.argv[5]
mg = float(sys.argv[6]) if len(sys.argv) > 6 else -9.0
duck = float(sys.argv[7]) if len(sys.argv) > 7 else -10.0
SR = 48000; N = int(D*SR)
def load(p, ch):
    raw = subprocess.run(['ffmpeg','-v','error','-i',p,'-ac',str(ch),'-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, ch).astype(np.float64)
vo = load(vo_p, 1)[:, 0]; mu = load(mu_p, 2)
V = np.zeros(N); i = int(off*SR); V[i:i+len(vo)] = vo[:N-i]
M = np.zeros((N, 2)); M[:min(N, len(mu))] = mu[:N]
# speech envelope -> ducking gain (attack 60 ms, release 450 ms, 150 ms look-ahead)
hop = 480; n = N//hop
rms = np.sqrt((V[:n*hop].reshape(n, hop)**2).mean(1)); act = (20*np.log10(rms+1e-9) > -42).astype(float)
la = 15; act = np.maximum(act, np.concatenate([act[la:], np.zeros(la)]))   # look-ahead
g = np.zeros(n); a_att, a_rel = np.exp(-1/6), np.exp(-1/45); y = 0
for k in range(n):
    a = a_att if act[k] > y else a_rel; y = a*y + (1-a)*act[k]; g[k] = y
gain_db = mg + duck*g
gs = np.interp(np.arange(N), np.arange(n)*hop + hop/2, 10**(gain_db/20))
Mx = M*gs[:, None]
mix = np.stack([V, V], 1)*1.0 + Mx
# measure separation during speech
sp = np.pad(np.repeat(act, hop), (0, max(0, N - len(act) * hop)))[:N] > 0.5
def db(x): return 10*np.log10((x**2).mean()+1e-12)
sep = db(V[sp]) - db(Mx[sp].mean(1))
gap = (~sp) & (np.arange(N) > SR)
print(f"voice vs music during speech: {sep:.1f} dB  (music in gaps {db(Mx[gap].mean(1)):.1f} dBFS rms)")
peak = np.abs(mix).max()
if peak > 0.89: mix *= 0.89/peak
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix*32767).astype('<i2').tobytes())
# stems for the editable project
with wave.open(out.replace('.wav', '_music_ducked.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(Mx,-1,1)*32767).astype('<i2').tobytes())
