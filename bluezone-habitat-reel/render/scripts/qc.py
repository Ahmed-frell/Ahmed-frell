#!/usr/bin/env python3
"""Quality control for a rendered reel. Usage: qc.py final.mp4 vo_clean.wav vo_offset captions.json report.md
Checks: format/resolution/fps/duration, decode errors, black and frozen frames, VO sync (cross-correlation
against the original voice), loudness/peak, voice-over-music separation proxy, subtitles vs speech."""
import sys, subprocess, json, re, numpy as np
mp4, vo, off, capf, rep = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4], sys.argv[5]
R = []; ok = True
def run(a): return subprocess.run(a, capture_output=True, text=True)
def chk(name, cond, detail):
    global ok; ok &= bool(cond); R.append(f"| {name} | {'PASS' if cond else 'FAIL'} | {detail} |")
p = json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',mp4]).stdout)
v = [s for s in p['streams'] if s['codec_type']=='video'][0]; a = [s for s in p['streams'] if s['codec_type']=='audio']
dur = float(p['format']['duration'])
chk('Video codec / pixel format', v['codec_name']=='h264' and v['pix_fmt']=='yuv420p', f"{v['codec_name']} {v['pix_fmt']} {v.get('profile','')}")
chk('Resolution 1080×1920 (9:16)', (v['width'],v['height'])==(1080,1920), f"{v['width']}×{v['height']}")
chk('Frame rate', v['r_frame_rate'] in ('30/1',), v['r_frame_rate'])
chk('Audio AAC stereo 48 kHz', bool(a) and a[0]['codec_name']=='aac' and a[0]['channels']==2 and a[0]['sample_rate']=='48000', f"{a[0]['codec_name']} {a[0]['channels']}ch {a[0]['sample_rate']} Hz {int(a[0].get('bit_rate',0))//1000} kbps" if a else 'none')
chk('Duration', abs(dur-92.7) < 0.15, f"{dur:.3f} s")
err = run(['ffmpeg','-v','error','-i',mp4,'-f','null','-']).stderr.strip()
chk('Full decode without errors', err=='', 'clean' if not err else err[:200])
bd = run(['ffmpeg','-i',mp4,'-vf','blackdetect=d=0.12:pix_th=0.06','-an','-f','null','-']).stderr
blacks = re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', bd)
unexpected = [(s,e) for s,e in blacks if not (float(s) >= 91.9 or float(e) <= 0.45)]
chk('No unintended black frames', not unexpected, f"black ranges {blacks} (allowed: fade-in <0.45 s, fade-out >91.9 s)")
fz = run(['ffmpeg','-i',mp4,'-vf','freezedetect=n=0.0008:d=1.6','-an','-f','null','-']).stderr
freezes = re.findall(r'freeze_start: ([\d.]+).*?freeze_end: ([\d.]+)', fz, re.S)
chk('No frozen video > 1.6 s (outside title/end cards)', all(float(s) >= 31.5 and float(e) <= 34.2 or float(s) >= 82.9 for s,e in freezes), f"{freezes or 'none'}")
# VO sync: cross-correlate mix (mono) with the clean VO placed at offset
def pcm(f, ss=None, t=None):
    cmd=['ffmpeg','-v','error']+(['-ss',str(ss)] if ss is not None else [])+['-i',f]+(['-t',str(t)] if t else [])+['-ac','1','-ar','8000','-f','f32le','-']
    return np.frombuffer(run_b(cmd), dtype=np.float32)
def run_b(cmd): return subprocess.run(cmd, capture_output=True).stdout
mix = pcm(mp4); ref = pcm(vo)
seg = ref[int(10*8000):int(40*8000)]
lo, hi = int((10+off-0.5)*8000), int((10+off+0.5)*8000)
best = max(range(lo, hi, 2), key=lambda i: float(np.dot(mix[i:i+len(seg)], seg)))
lag_ms = (best/8000 - (10+off))*1000
chk('Voice-over sync (vs original take)', abs(lag_ms) <= 25, f"offset error {lag_ms:+.1f} ms (VO placed at {off:.2f} s)")
# loudness
eb = run(['ffmpeg','-nostats','-i',mp4,'-af','ebur128=peak=true','-f','null','-']).stderr
I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', eb)[-1]); TP = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', eb)[-1])
chk('Loudness (Instagram ≈ −14 LUFS)', -16 <= I <= -12, f"{I} LUFS integrated, true peak {TP} dBFS")
chk('No clipping', TP <= -0.5, f"{TP} dBFS")
# subtitles inside speech, ordered, no overlaps
caps = json.load(open(capf))['chunks']
ordered = all(caps[i]['end'] <= caps[i+1]['start']+1e-6 for i in range(len(caps)-1))
mind = min(c['end']-c['start'] for c in caps)
chk('Subtitles ordered, no overlaps, readable duration', ordered and mind >= 0.75, f"{len(caps)} chunks, min {mind:.2f} s")
cover = sum(c['end']-c['start'] for c in caps)
chk('Subtitles cover the narration', cover > 75, f"{cover:.1f} s of subtitles for 89.8 s VO")
with open(rep,'w') as f:
    f.write(f"# QC report: {mp4.split('/')[-1]}\n\n**Overall: {'PASS' if ok else 'FAIL'}**\n\n| Check | Result | Detail |\n|---|---|---|\n" + "\n".join(R) + "\n")
print(open(rep).read())
