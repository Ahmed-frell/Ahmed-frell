#!/usr/bin/env python3
"""Original cinematic ambient score for the Blue Zone Habitat reel (no third-party audio).
Usage: compose_score.py timeline.json out_music.wav
timeline.json: {"duration": s, "rhythm": [start,end], "breakdown": [start,end],
                "impacts": [t,...], "whooshes": [t,...], "final_chord": t}
B minor / D major, 84 BPM: Bm - G - D - A pads, soft piano arpeggio, sub pulse, shaker,
reverse swells into impacts, filtered-noise whooshes on transitions, synthetic hall reverb."""
import sys, json, numpy as np
cfg = json.load(open(sys.argv[1])); out = sys.argv[2]
SR = 48000; D = cfg['duration']; N = int(D*SR)
rng = np.random.default_rng(7)
t = np.arange(N)/SR
L = np.zeros(N); R = np.zeros(N)
BPM = cfg.get('bpm', 84); beat = 60/BPM; bar = 4*beat
def hz(m): return 440*2**((m-69)/12)
# chord tones (MIDI)
CH = {'Bm': [47, 54, 59, 62, 66], 'G': [43, 50, 55, 59, 62], 'D': [50, 54, 57, 62, 66], 'A': [45, 52, 57, 61, 64]}
PROG = ['Bm', 'G', 'D', 'A']
def add(sig, start, pan=0.0, gain=1.0):
    i = int(start*SR); 
    if i >= N: return
    s = sig[:N-i]*gain
    L[i:i+len(s)] += s*np.cos((pan+1)*np.pi/4); R[i:i+len(s)] += s*np.sin((pan+1)*np.pi/4)
def saw_pad(f, dur, bright=6):
    n = int(dur*SR); tt = np.arange(n)/SR; y = np.zeros(n)
    for det in (-0.004, 0.0, 0.0045):
        ph = rng.random()*2*np.pi
        for k in range(1, bright+1):
            y += np.sin(2*np.pi*f*(1+det)*k*tt + ph*k)/k**1.35
    att = min(1.2, dur/3); rel = min(1.6, dur/2.5)
    env = np.minimum(1, tt/att) * np.minimum(1, (dur-tt)/rel).clip(0)
    return y*env/12
def pluck(f, dur=2.2):
    n = int(dur*SR); tt = np.arange(n)/SR
    y = sum(np.sin(2*np.pi*f*k*tt)*np.exp(-tt*(2.2+1.6*k))/k**1.2 for k in range(1, 6))
    return y*np.minimum(1, tt/0.004)
def kick():
    n = int(0.45*SR); tt = np.arange(n)/SR
    f = 42+38*np.exp(-tt*28); ph = 2*np.pi*np.cumsum(f)/SR
    return np.sin(ph)*np.exp(-tt*7.5)
def shaker():
    n = int(0.09*SR); x = rng.standard_normal(n); x = np.diff(np.concatenate([[0], x]))
    return x*np.exp(-np.arange(n)/SR*55)
def onepole_lp(x, fc):
    y = np.zeros_like(x); a = np.exp(-2*np.pi*np.asarray(fc)/SR) if np.ndim(fc) else None
    acc = 0.0
    if a is None:
        aa = np.exp(-2*np.pi*fc/SR)
        for i in range(len(x)): acc = (1-aa)*x[i]+aa*acc; y[i] = acc
    else:
        for i in range(len(x)): acc = (1-a[i])*x[i]+a[i]*acc; y[i] = acc
    return y
def whoosh(dur=0.9):
    n = int(dur*SR); tt = np.arange(n)/SR; x = rng.standard_normal(n)
    fc = 300+5200*np.sin(np.pi*tt/dur)**2
    hp = x - onepole_lp(x, 250.0)
    y = onepole_lp(hp, fc)
    return y*np.sin(np.pi*tt/dur)**2.2
def swell(dur=1.4):
    n = int(dur*SR); tt = np.arange(n)/SR; x = rng.standard_normal(n)
    y = onepole_lp(x, 200+3000*(tt/dur)**2)
    return y*(tt/dur)**3
def impact():
    n = int(2.8*SR); tt = np.arange(n)/SR
    boom = np.sin(2*np.pi*(38+30*np.exp(-tt*9))*tt)*np.exp(-tt*2.2)
    noise = onepole_lp(rng.standard_normal(n), 900.0)*np.exp(-tt*6)
    return boom*0.9 + noise*0.5
# ---- pads (whole piece, darker in intro, brighter after title) ----
nb = int(np.ceil(D/bar))+1
final = cfg['final_chord']
for b in range(nb):
    st = b*bar
    if st >= final: break
    ch = PROG[b % 4]; dur = min(bar+1.0, final-st+1.2)
    bright = 4 if st < cfg['rhythm'][0] else 7
    for m in CH[ch][1:]:
        add(saw_pad(hz(m), dur, bright), st, pan=rng.uniform(-0.5, 0.5), gain=0.55)
    add(saw_pad(hz(CH[ch][0]-12), dur, 3), st, gain=0.8)        # sub root
# final sustained D major chord
for m in [38, 50, 57, 62, 66, 69, 74]:
    add(saw_pad(hz(m), D-final, 5), final, pan=rng.uniform(-0.6, 0.6), gain=0.6)
# ---- piano arpeggio (8ths, sparse), skips during breakdown ----
bd0, bd1 = cfg['breakdown']
for i in range(int(D/(beat/2))):
    st = i*beat/2
    if st >= final - 0.2 or (bd0 <= st < bd1 and i % 4): continue
    if st < 2.0 and i % 2: continue
    ch = PROG[int(st//bar) % 4]; tones = CH[ch][1:]
    pat = [0, 2, 3, 1, 2, 3, 1, 3][i % 8]
    add(pluck(hz(tones[pat]+12)), st, pan=[-0.35, 0.35][i % 2], gain=0.16 if i % 2 else 0.22)
# piano motif on final chord
for k, m in enumerate([74, 78, 81, 86]):
    add(pluck(hz(m), 3.5), final+0.15+k*beat/2, pan=0.2*(k-1.5), gain=0.24)
# ---- rhythm: kick on 1 and 3, shaker 8ths ----
r0, r1 = cfg['rhythm']
for i in range(int(D/beat)+1):
    st = i*beat
    if r0 <= st < r1 and not (bd0 <= st < bd1):
        if i % 2 == 0: add(kick(), st, gain=0.55)
        add(shaker(), st, pan=0.3, gain=0.05); add(shaker(), st+beat/2, pan=-0.3, gain=0.035)
# ---- transition FX ----
for w in cfg['whooshes']: add(whoosh(), w-0.45, pan=rng.uniform(-0.3, 0.3), gain=0.10)
for im in cfg['impacts']:
    add(swell(), im-1.4, gain=0.12); add(impact(), im, gain=0.55)
# ---- synthetic hall reverb (exponential noise IR), FFT convolution ----
irn = int(2.6*SR); it = np.arange(irn)/SR
def ir():
    x = rng.standard_normal(irn)*np.exp(-it*2.4); x = onepole_lp(x, 5000.0); x[:int(0.012*SR)] = 0; return x/np.sqrt((x**2).sum())
M = 1 << int(np.ceil(np.log2(N+irn)))
def conv(x, h): return np.fft.irfft(np.fft.rfft(x, M)*np.fft.rfft(h, M), M)[:N]
wetL, wetR = conv(L, ir()), conv(R, ir())
L2 = L*0.75 + wetL*0.55; R2 = R*0.75 + wetR*0.55
# fades
fade = np.minimum(1, t/0.6) * np.clip((D-t)/2.5, 0, 1)**1.5
st = np.stack([L2*fade, R2*fade], 1)
st /= np.abs(st).max()*1.12
import wave
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st*32767).astype('<i2').tobytes())
print('wrote', out, D, 's')
