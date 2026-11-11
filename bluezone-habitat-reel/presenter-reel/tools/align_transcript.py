#!/usr/bin/env python3
"""Align a client-supplied transcript (timestamps on a rough-cut timeline) back to the source takes.

Usage: align_transcript.py transcript_input.json edl.json root out.json out.md
transcript_input.json: {"timeline": "roughcut-v1", "lines": [{"rec": [a, b], "text": "...", "flag": "retake"|null}, ...]}

For each line: rough-cut time -> (take, source time) through the EDL, then every boundary is snapped to the nearest real pause
in the cleaned source audio (energy dip within +-1.0 s, or the take edge). Word times inside a line are ESTIMATED: proportional to
word length and snapped to dips (no word-level ASR is available for Malayalam offline).
"""
import json, subprocess, sys, re, numpy as np
tin, edlf, root, outj, outm = sys.argv[1:6]
T = json.load(open(tin)); E = json.load(open(edlf)); F = E['fps']

def src(t, prefer_next=False):
    for s in E['shots']:
        a = s['rec_in_f'] / F; b = a + s['frames'] / F
        if a <= t < b or (not prefer_next and abs(t - b) < 1e-6):
            return s['take'], s['in_f'] / F + (t - a)
    s = E['shots'][-1]; return s['take'], s['out_f'] / F

env = {}
def envelope(take):
    if take not in env:
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'{root}/work/audio/th_{take}_clean.wav', '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout
        a = np.frombuffer(raw, np.float32); n = len(a) // 160
        e = 20 * np.log10(np.sqrt((a[:n * 160].reshape(n, 160) ** 2).mean(1)) + 1e-9)
        env[take] = np.convolve(e, np.ones(7) / 7, 'same')
    return env[take]

def gaps(take):
    return [tuple(map(float, l.split())) for l in open(f'{root}/work/sil/th_{take}.txt') if l.strip()]

def snap(take, t, win=1.0):
    # 1) prefer a real silence gap (>=0.30 s at -42 dB) whose midpoint is within 1.2 s
    cand = [((a + b) / 2) for a, b in gaps(take) if abs((a + b) / 2 - t) <= 1.2]
    if cand: return min(cand, key=lambda m: abs(m - t))
    # 2) otherwise the quietest point nearby (a breath inside continuous speech)
    e = envelope(take); i0 = max(0, int((t - win) * 100)); i1 = min(len(e), int((t + win) * 100))
    seg = e[i0:i1]
    if len(seg) < 5: return t
    # prefer the quietest point; penalise distance a little
    cost = seg + 6 * np.abs(np.arange(i0, i1) / 100 - t)
    return (i0 + int(np.argmin(cost))) / 100

lines = []
for i, L in enumerate(T['lines'], 1):
    a, b = L['rec']
    ta, sa = src(a, prefer_next=True); tb, sb = src(max(a, b - 0.02))
    lines.append({'n': i, 'text': L['text'], 'flag': L.get('flag'), 'rec_v1': [a, b], 'take_in': ta, 'take_out': tb, 'src_in': sa, 'src_out': sb})
# lines whose rough-cut span crosses a take change: keep the take holding most of the line, bounded by that take's speech
def take_speech(take):
    sil = [tuple(map(float, l.split())) for l in open(f'{root}/work/sil/th_{take}.txt') if l.strip()]
    dur = float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f'{root}/work/proxy/th_{take}.mp4'],capture_output=True,text=True).stdout)
    segs, t = [], 0.0
    for a_, b_ in sil:
        if a_ - t > 0.25: segs.append((t, a_))
        t = b_
    if dur - t > 0.25: segs.append((t, dur))
    return segs, dur
for L in lines:
    if L['take_in'] == L['take_out']: continue
    a, b = L['rec_v1']; part = {}
    for s in E['shots']:
        sa = s['rec_in_f'] / F; sb = sa + s['frames'] / F
        ov = max(0, min(b, sb) - max(a, sa))
        if ov > 0: part[s['take']] = part.get(s['take'], 0) + ov
    best = max(part, key=part.get); segs, dur = take_speech(best)
    if best == L['take_out'] and best != L['take_in']:      # line belongs to the later take: starts at its first kept speech
        L['src_in'] = max(0, min(x[0] for x in segs if x[0] >= E['config']['takes'][[t['id'] for t in E['config']['takes']].index(best)].get('start', 0)) - 0.08)
    if best == L['take_in'] and best != L['take_out']:      # line belongs to the earlier take: runs to its last speech
        L['src_out'] = min(dur, max(x[1] for x in segs) + 0.12)
    L['take_in'] = L['take_out'] = best; L['fixed_take_span'] = part
# snap boundaries: shared boundary between consecutive lines in the same take -> same snapped point
for k, L in enumerate(lines):
    if 'fixed_take_span' in L and L['src_in'] != L.get('_orig_in'):
        pass
    elif k == 0 or lines[k - 1]['take_out'] != L['take_in']:
        L['src_in'] = snap(L['take_in'], L['src_in'], 0.6)
    else:
        L['src_in'] = lines[k - 1]['src_out']
    if k + 1 < len(lines) and lines[k + 1]['take_in'] == L['take_out']:
        L['src_out'] = snap(L['take_out'], L['src_out'], 1.0)
    else:
        L['src_out'] = round(L['src_out'], 2)
    L['src_in'] = round(L['src_in'], 2); L['src_out'] = round(L['src_out'], 2)
# explicit editor overrides from the input file: "src": [take, in, out] (audited boundary fixes)
for L, Lin in zip(lines, T['lines']):
    if Lin.get('src'):
        L['take_in'] = L['take_out'] = Lin['src'][0]; L['src_in'], L['src_out'] = Lin['src'][1], Lin['src'][2]; L['override'] = True
# word estimates
def weight(w): return max(1, len(re.sub(r'[\W_]', '', w))) + 1.5
for L in lines:
    if L['take_in'] != L['take_out']: L['words'] = []; continue
    ws = L['text'].split(); W = np.array([weight(w) for w in ws]); cum = np.concatenate([[0], np.cumsum(W)]) / W.sum()
    a, b = L['src_in'], L['src_out']
    L['words'] = [{'w': w, 'start_est': round(a + (b - a) * cum[j], 2), 'end_est': round(a + (b - a) * cum[j + 1], 2)} for j, w in enumerate(ws)]
json.dump({'source': tin, 'note': 'Line boundaries snapped to real pauses; word times are estimates (proportional + pause-snapped).', 'lines': lines},
          open(outj, 'w'), ensure_ascii=False, indent=1)
md = ['# Blue Zone presenter reel: aligned transcript', '',
      'Text supplied by the client (2026-11-11), verbatim. Times are **source take times**, snapped to real pauses. Lines flagged by the client as retakes are marked ✂.',
      'Word-level times in `transcript_aligned.json` are estimates (no word-level Malayalam ASR offline).', '',
      '| # | Take | Source in–out (s) | Rough cut v1 | Line |', '|---|---|---|---|---|']
for L in lines:
    take = L['take_in'] if L['take_in'] == L['take_out'] else f"{L['take_in']}→{L['take_out']}"
    md.append(f"| {L['n']}{' ✂' if L['flag'] else ''} | {take} | {L['src_in']:.2f}–{L['src_out']:.2f} | {L['rec_v1'][0]:g}–{L['rec_v1'][1]:g} | {L['text']} |")
open(outm, 'w').write('\n'.join(md) + '\n')
for L in lines: print(f"L{L['n']:2d} {L['take_in']}{'' if L['take_in'] == L['take_out'] else '->' + L['take_out']} {L['src_in']:6.2f}-{L['src_out']:6.2f} {'RETAKE' if L['flag'] else ''}")
