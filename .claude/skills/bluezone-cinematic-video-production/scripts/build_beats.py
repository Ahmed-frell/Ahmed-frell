#!/usr/bin/env python3
"""Word-timed caption beats on the edit timeline.
Usage: build_beats.py transcript_aligned.json edl.json voice.wav out.json
- Word times: transcript word estimates (source time) -> edit time via the EDL; then each onset is snapped to the nearest
  syllable gap in the edited voice within +-0.18 s (they remain estimates: no word-level Malayalam ASR offline).
- Beats: 1-3 words, <= 18 characters, break after punctuation; emphasis words get their own beat.
- Style per word: 'em' (heavy display, accent), 'script' (one accent word per sentence), 'pri' (primary)."""
import json, sys, re, subprocess, numpy as np
T, E, wav, out = sys.argv[1:5]
L = json.load(open(T))['lines']; ed = json.load(open(E)); F = ed['fps']
a = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', wav, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout, np.float32)
n = len(a) // 160; env = 20 * np.log10(np.sqrt((a[:n * 160].reshape(n, 160) ** 2).mean(1)) + 1e-9); env = np.convolve(env, np.ones(3) / 3, 'same')

def to_rec(take, t):
    best = None
    for s in ed['shots']:
        if s['take'] != take: continue
        a_, b_ = s['in_f'] / F, s['out_f'] / F
        if a_ <= t < b_: return s['rec_in_f'] / F + (t - a_)
        d = min(abs(t - a_), abs(t - b_))
        if best is None or d < best[0]: best = (d, s['rec_in_f'] / F + (min(max(t, a_), b_ - 0.01) - a_))
    return best[1] if best else None

def snap(t, w=0.18):
    i0, i1 = int((t - w) * 100), int((t + w) * 100); seg = env[max(0, i0):i1]
    if len(seg) < 3: return t
    return (max(0, i0) + int(np.argmin(seg + 8 * np.abs(np.arange(len(seg)) - (t * 100 - max(0, i0))) / 100))) / 100

EM = re.compile(r'^(Blue|Zone|Habitat|USP|USPs|key|first|second|third|Gen|Z|Alpha|Beta|51|villas|workspaces|workspace|Work|Nature|Office|culture|privacy|maid|maids|quarters|clubhouse|Internal|Cloud|cloud|Kitchen|kitchen|morning|food|model|productive|private|entrepreneurship|business|mandatory|project|മൂന്ന്|മലപ്പുറം|മലബാർ|രാവിലെ|രണ്ടോ|മൂന്നോ|ഒരു maid)', re.I)
SCRIPT_OK = re.compile(r'^(better|healthier|future|living|nature|share|private|specifically|still|own|trouble|hectic|association|collaborate)', re.I)
DISPLAY = [('threeG', '3G')]
words = []
for l in L:
    if l['flag'] or not l.get('words'): continue
    for w in l['words']:
        t0 = to_rec(l['take_in'], w['start_est']); t1 = to_rec(l['take_in'], w['end_est'])
        if t0 is None: continue
        txt = w['w']
        for x, y in DISPLAY: txt = txt.replace(x, y)
        words.append({'line': l['n'], 'w': txt, 't0': snap(t0), 't1': t1})
for i in range(len(words) - 1):                     # monotonic, no overlaps
    words[i + 1]['t0'] = max(words[i + 1]['t0'], words[i]['t0'] + 0.08)
    words[i]['t1'] = min(max(words[i]['t1'], words[i]['t0'] + 0.12), words[i + 1]['t0'])
beats, cur = [], []
def flush():
    if cur: beats.append({'line': cur[0]['line'], 't0': round(cur[0]['t0'], 3), 't1': round(cur[-1]['t1'], 3), 'words': [dict(w) for w in cur]}); cur.clear()
script_used = set()
for w in words:
    clean = re.sub(r'[.,!?…]+$', '', w['w'])
    w['style'] = 'em' if EM.match(clean) else ('script' if SCRIPT_OK.match(clean) and w['line'] not in script_used else 'pri')
    if w['style'] == 'script': script_used.add(w['line'])
    if cur and (cur[0]['line'] != w['line'] or len(cur) >= 3 or len(' '.join(x['w'] for x in cur + [w])) > 18
                or (w['style'] == 'em' and len(cur) >= 2)):
        flush()
    cur.append(w)
    if re.search(r'[.,!?…]$', w['w']): flush()
flush()
for i in range(len(beats) - 1):
    beats[i]['t1'] = round(min(beats[i]['t1'] + 0.25, beats[i + 1]['t0']), 3)
beats[-1]['t1'] = round(beats[-1]['t1'] + 0.4, 3)
json.dump({'note': 'Word times are estimates snapped to syllable gaps.', 'beats': beats, 'words': words}, open(out, 'w'), ensure_ascii=False, indent=1)
print(len(words), 'words', len(beats), 'beats')
for b in beats[:12]: print(f"{b['t0']:7.2f}-{b['t1']:7.2f} L{b['line']:2d} " + ' '.join(f"{w['w']}[{w['style']}]" for w in b['words']))
