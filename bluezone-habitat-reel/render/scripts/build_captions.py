#!/usr/bin/env python3
"""Build Malayalam subtitle chunks from locked transcript line timings + the VO waveform.
Usage: build_captions.py line_timings.json vo.wav vo_offset_s out_captions.json out.srt
Line timings come from silence detection (verified 1:1 with the approved transcript).
Inside each line, word times are estimated by character length and chunk breaks are snapped
to the nearest real energy dip (pause) within +-0.4 s, so subtitles change when the voice pauses."""
import sys, json, subprocess, re, numpy as np
lt, wav, off, outj, outs = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4], sys.argv[5]
lines = json.load(open(lt))
a = np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',wav,'-ac','1','-ar','16000','-f','f32le','-'],
                  capture_output=True, check=True).stdout, dtype=np.float32)
hop = 160  # 10 ms
n = len(a)//hop
e = 20*np.log10(np.sqrt((a[:n*hop].reshape(n,hop)**2).mean(1))+1e-9)
e = np.convolve(e, np.ones(5)/5, mode='same')
def dip_near(t, lo, hi, win=0.4):
    i0, i1 = int(max(lo, t-win)*100), int(min(hi, t+win)*100)
    if i1 <= i0+2: return t
    seg = e[i0:i1]; j = int(np.argmin(seg))
    # only snap if the dip is a real dip (at least 8 dB under the local median)
    return (i0+j)/100 if np.median(seg)-seg[j] > 8 else t
def weight(w): return max(1, len(re.sub(r'[\W_]', '', w))) + 1.5
MAXC, MAXW = 34, 5
MINDUR = 0.75
# never break right after these words (keeps names and phrases together)
GLUE = {'Gen','Blue','Zone','Mission','Malappuram','IIT','Madras','Research','Where','Peace','Meets','Project','open','premium','dedicated','office','design','3,','4,','ഒരു','ആ'}
chunks = []; words_out = []
def expand(lines):
    out = []
    for L in lines:
        ws_all = L['text'].split()
        parts = L.get('parts') or [{'start': L['start'], 'end': L['end'], 'w0': 0}]
        for k, p in enumerate(parts):
            w1 = parts[k+1]['w0'] if k+1 < len(parts) else len(ws_all)
            out.append({'n': L['n'], 'start': p['start'], 'end': p['end'], 'text': ' '.join(ws_all[p['w0']:w1])})
    return out
lines = expand(lines)
for L in lines:
    text = L['text'].replace('**', '').replace('threeG', '3G').replace('three, four , five', '3, 4, 5').replace('three, four, five', '3, 4, 5')
    ws = text.split()
    s, en = L['start'], L['end']
    W = np.array([weight(w) for w in ws]); cum = np.concatenate([[0], np.cumsum(W)])/W.sum()
    wt = [(s+(en-s)*cum[i], s+(en-s)*cum[i+1]) for i in range(len(ws))]
    words_out += [{'line': L['n'], 'w': w, 'start': round(a_+off,3), 'end': round(b_+off,3)} for w,(a_,b_) in zip(ws, wt)]
    groups, cur = [], []
    for i, w in enumerate(ws):
        if cur and ws[cur[-1]] not in GLUE and (len(' '.join([ws[k] for k in cur]+[w])) > MAXC or len(cur) >= MAXW):
            groups.append(cur); cur = []
        cur.append(i)
    groups.append(cur)
    # balance a dangling one-word tail
    if len(groups) > 1 and len(groups[-1]) == 1 and len(groups[-2]) > 2:
        groups[-1].insert(0, groups[-2].pop())
    def make_bounds(groups):
        bs = [s]
        for g in groups[1:]:
            bs.append(dip_near(wt[g[0]][0], s, en))
        bs.append(en)
        return bs
    while True:
        bounds = make_bounds(groups)
        durs = [bounds[i+1]-bounds[i] for i in range(len(groups))]
        bad = [i for i, d in enumerate(durs) if d < MINDUR]
        if not bad or len(groups) == 1: break
        i = bad[0]
        # merge the short chunk with its shorter neighbour
        if i == 0: j = 0
        elif i == len(groups)-1: j = i-1
        else: j = i-1 if durs[i-1] <= durs[i+1] else i
        groups[j] = groups[j] + groups[j+1]; del groups[j+1]
    for gi, g in enumerate(groups):
        chunks.append({'line': L['n'], 'text': ' '.join(ws[k] for k in g),
                       'start': round(bounds[gi]+off, 3), 'end': round(bounds[gi+1]+off + (0.25 if gi == len(groups)-1 else 0), 3)})
# no overlaps
for i in range(len(chunks)-1):
    chunks[i]['end'] = min(chunks[i]['end'], chunks[i+1]['start'])
json.dump({'vo_offset': off, 'chunks': chunks, 'words': words_out}, open(outj,'w'), ensure_ascii=False, indent=1)
def ts(t):
    ms = int(round(t*1000)); return f"{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d},{ms%1000:03d}"
with open(outs,'w') as f:
    for i, c in enumerate(chunks, 1):
        f.write(f"{i}\n{ts(c['start'])} --> {ts(c['end'])}\n{c['text']}\n\n")
print(len(chunks), 'chunks')
for c in chunks: print(f"{c['start']:6.2f}-{c['end']:6.2f} L{c['line']:>2} {c['text']}")
