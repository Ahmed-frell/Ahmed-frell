#!/usr/bin/env python3
"""Original SFX library for Blue Zone reels (synthesised: no third-party audio, no licence needed).
Usage: sfx_library.py out_dir    -> 48 kHz stereo WAVs + library.json (name, duration, peak offset = the 'impact frame')
Each sound has a defined `hit` time (seconds from file start) so cues can align the audible peak to the visual impact frame."""
import sys, os, json, wave, numpy as np
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
SR = 48000; rng = np.random.default_rng(11)

def lp(x, fc):
    fc = np.broadcast_to(np.asarray(fc, float), x.shape); a = np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); acc = 0.0
    for i in range(len(x)): acc = (1 - a[i]) * x[i] + a[i] * acc; y[i] = acc
    return y
def hp(x, fc): return x - lp(x, fc)
def bp(x, lo, hi): return lp(hp(x, lo), hi)
def env_ar(n, a, r, curve=2.0):
    t = np.arange(n) / SR; e = np.minimum(1, t / max(a, 1e-4)); dec = np.clip((t - a) / max(r, 1e-4), 0, 1)
    return e * (1 - dec) ** curve
def stereo(x, width=0.25, delay_ms=6):
    d = int(delay_ms * SR / 1000); r = np.concatenate([np.zeros(d), x[:-d]]) if d else x
    return np.stack([x * (1 - width / 2) + r * width / 2, r * (1 - width / 2) + x * width / 2], 1)
def norm(x, peak): return x / (np.abs(x).max() + 1e-9) * peak
LIB = {}
def save(name, x, hit, peak_db, desc):
    x = norm(x, 10 ** (peak_db / 20)); x = stereo(x) if x.ndim == 1 else x
    fade = int(0.004 * SR); x[:fade] *= np.linspace(0, 1, fade)[:, None]; x[-fade:] *= np.linspace(1, 0, fade)[:, None]
    with wave.open(f'{out}/{name}.wav', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype('<i2').tobytes())
    LIB[name] = {'file': f'{name}.wav', 'dur': round(len(x) / SR, 3), 'hit': hit, 'peak_db': peak_db, 'desc': desc}

def whoosh(dur, f0, f1, peak_pos=0.55, air=0.0):
    n = int(dur * SR); t = np.arange(n) / SR; x = rng.standard_normal(n)
    shape = np.where(t < dur * peak_pos, (t / (dur * peak_pos)) ** 2.2, ((dur - t) / (dur * (1 - peak_pos))) ** 1.6)
    fc = f0 + (f1 - f0) * shape
    y = lp(hp(x, 180.0), fc) * shape
    if air: y += air * hp(x, 4000.0) * shape ** 3
    return y

# 1. transition whoosh (whips, image entries)
save('whoosh_whip', whoosh(0.42, 300, 6500, 0.62, 0.25), 0.26, -14, 'Fast whip / image entry sweep')
# 2. soft text swish (word/headline reveal)
save('swish_text', whoosh(0.22, 1500, 9000, 0.45, 0.6), 0.10, -22, 'Subtle typography swish')
# 3. reverse whoosh (text exit, sparing)
save('whoosh_reverse', whoosh(0.35, 400, 5000, 0.85, 0.2), 0.30, -20, 'Light reverse whoosh for exits')
# 4. typewriter tick (letter reveals): tiny filtered click
n = int(0.03 * SR); t = np.arange(n) / SR
tick = bp(rng.standard_normal(n), 2500, 7000) * np.exp(-t * 260) + 0.3 * np.sin(2 * np.pi * 3200 * t) * np.exp(-t * 400)
save('tick', tick, 0.0, -30, 'Very subtle letter tick')
# 5. restrained cinematic impact (headlines)
n = int(1.6 * SR); t = np.arange(n) / SR
boom = np.sin(2 * np.pi * (44 + 36 * np.exp(-t * 14)) * t) * np.exp(-t * 3.2)
body = lp(rng.standard_normal(n), 900.0) * np.exp(-t * 11) * 0.35
click = hp(rng.standard_normal(n), 3000.0) * np.exp(-t * 90) * 0.12
save('impact_soft', boom + body + click, 0.0, -11, 'Restrained low-frequency headline impact')
# 6. riser (into major reveals): 1.2 s, ends at hit
n = int(1.2 * SR); t = np.arange(n) / SR
r = lp(rng.standard_normal(n), 300 + 7000 * (t / 1.2) ** 2.5) * (t / 1.2) ** 2.6
r += 0.25 * np.sin(2 * np.pi * (220 + 660 * (t / 1.2) ** 2) * t) * (t / 1.2) ** 3
save('riser', r, 1.2, -20, 'Subtle riser into a reveal (hit = end of file)')
# 7. tonal sweep (text-to-text morph)
n = int(0.5 * SR); t = np.arange(n) / SR; f = 500 * (2 ** (t / 0.5 * 1.3))
sw = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.5) ** 2 * 0.6 + lp(rng.standard_normal(n), 3000.0) * np.sin(np.pi * t / 0.5) ** 2 * 0.3
save('sweep_tonal', sw, 0.28, -24, 'Smooth tonal sweep for text morphs')
# 8. numeric accent (counter landing): pitched thump + soft click
n = int(0.5 * SR); t = np.arange(n) / SR
na = np.sin(2 * np.pi * (120 + 160 * np.exp(-t * 30)) * t) * np.exp(-t * 9) + 0.25 * hp(rng.standard_normal(n), 2500.0) * np.exp(-t * 70)
save('accent_num', na, 0.0, -16, 'Subtle impact accent for numbers / pops')
# 9. airy (tracking expansion)
n = int(0.9 * SR); t = np.arange(n) / SR
air = bp(rng.standard_normal(n), 2500, 11000) * np.sin(np.pi * t / 0.9) ** 2
save('airy', air, 0.45, -28, 'Gentle airy movement for tracking expansion')
# 10. blueprint tear (paper rip): crackle bursts with a body
n = int(0.55 * SR); t = np.arange(n) / SR; crack = np.zeros(n)
for k in range(70):
    c = int(rng.uniform(0, 0.45) * SR); L = int(rng.uniform(0.002, 0.012) * SR)
    crack[c:c + L] += rng.standard_normal(min(L, n - c)) * rng.uniform(0.3, 1.0)
tear = bp(crack, 900, 7000) * (0.3 + 0.7 * np.sin(np.pi * t / 0.55)) + 0.3 * lp(rng.standard_normal(n), 600.0) * np.sin(np.pi * t / 0.55)
save('tear', tear, 0.22, -16, 'Paper / blueprint tear')
# 11. architectural reveal (soft airy whoosh + low swell) for photo reveals
save('reveal_arch', whoosh(0.9, 200, 3500, 0.5, 0.15) + 0.3 * np.sin(2 * np.pi * 70 * np.arange(int(0.9 * SR)) / SR) * np.sin(np.pi * np.arange(int(0.9 * SR)) / (0.9 * SR)) ** 2, 0.45, -18, 'Elegant architectural photo reveal')
# 12. silhouette flash hit (open + USP headers): short bright transient + sub
n = int(0.7 * SR); t = np.arange(n) / SR
fl = hp(rng.standard_normal(n), 1500.0) * np.exp(-t * 28) * 0.6 + np.sin(2 * np.pi * (60 + 80 * np.exp(-t * 25)) * t) * np.exp(-t * 6)
save('flash_hit', fl, 0.0, -13, 'Flash-frame hit')
# 13. logo signature: bell chord (D maj add9) + soft impact + shimmer
n = int(3.2 * SR); t = np.arange(n) / SR; sig = np.zeros(n)
for i, (f, a) in enumerate([(293.66, 1), (369.99, .7), (440, .8), (587.33, .6), (659.25, .45), (880, .3)]):
    d = int(i * 0.045 * SR); tt = t[:n - d]
    sig[d:] += a * (np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 3)) * np.exp(-tt * 1.3)
sig += 0.5 * np.sin(2 * np.pi * (48 + 30 * np.exp(-t * 10)) * t) * np.exp(-t * 3.5)
sig += 0.12 * bp(rng.standard_normal(n), 5000, 12000) * np.exp(-t * 1.8)
save('logo_signature', sig, 0.0, -12, 'Premium logo sonic signature')
# 14. marker draw (pen stroke)
n = int(0.32 * SR); t = np.arange(n) / SR
mk = bp(rng.standard_normal(n), 1800, 6000) * (0.5 + 0.5 * np.sin(2 * np.pi * 18 * t)) * np.sin(np.pi * t / 0.32)
save('marker', mk, 0.05, -27, 'Marker / pen stroke for annotations')
json.dump(LIB, open(f'{out}/library.json', 'w'), indent=1)
print(len(LIB), 'sounds ->', out)
