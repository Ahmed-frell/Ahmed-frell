#!/usr/bin/env python3
"""Render a labelled 360x640 preview of every B-roll pick in a plan. Usage: broll_preview.py plan.json drive_dir still_dir out.mp4"""
import json, subprocess, sys, os
plan, drive, stills, out = sys.argv[1:5]
d = json.load(open(plan)); tmp = os.path.join(os.path.dirname(os.path.abspath(out)), '_broll_preview'); os.makedirs(tmp, exist_ok=True)
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'; FONT2 = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def esc(t): return t.replace("\\", "\\\\").replace(":", "\\:").replace("'", "’").replace(",", "\\,")
lst = open(f'{tmp}/list.txt', 'w')
for p in d['picks']:
    src = p['src']; o = f"{tmp}/{p['id']}.mp4"; m, s = divmod(p['rec'][0], 60); still = src.endswith(('png', 'jpg'))
    lab = (f"drawtext=fontfile={FONT}:text='{esc(f'{chr(32).join([p[chr(105)+chr(100)], chr(183), f'{int(m)}:{s:04.1f}', chr(183), f'line {p[chr(108)+chr(105)+chr(110)+chr(101)]}'])}')}':x=12:y=14:fontsize=19:fontcolor=white:box=1:boxcolor=0x1d3a12@0.85:boxborderw=8,"
           f"drawtext=fontfile={FONT}:text='{esc(chr(8220) + p['phrase'] + chr(8221))}':x=12:y=54:fontsize=17:fontcolor=0xD9EBB4:box=1:boxcolor=black@0.6:boxborderw=6,"
           f"drawtext=fontfile={FONT2}:text='{esc(p['what'][:44])}':x=12:y=566:fontsize=14:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=6,"
           f"drawtext=fontfile={FONT2}:text='{esc(src + (' (still)' if still else f' {p[chr(105)+chr(110)]:.1f}-{p[chr(105)+chr(110)]+p[chr(100)+chr(117)+chr(114)]:.1f}s'))}':x=12:y=598:fontsize=13:fontcolor=0xFFD27A:box=1:boxcolor=black@0.6:boxborderw=6")
    if still:
        N = int(p['dur'] * 30)
        base = ("scale=360:-2,pad=360:640:0:(oh-ih)/2:color=0xE6EADF" if 'plot_plan' in src else
                "scale=2160:-2,crop='min(iw,ih*9/16)':ih,scale=1080:1920")
        vf = f"{base},zoompan=z='1+0.06*on/{N}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=360x640:fps=30,{lab},format=yuv420p"
        cmd = ['ffmpeg', '-nostdin', '-v', 'error', '-y', '-loop', '1', '-framerate', '30', '-t', str(p['dur']), '-i', os.path.join(stills, src), '-vf', vf, '-frames:v', str(N), '-c:v', 'libx264', '-crf', '23', '-preset', 'veryfast', '-an', o]
    else:
        vf = f"scale=-2:640,crop=360:640:'(iw-360)*{p['x']}':0,fps=30,{lab},format=yuv420p"
        cmd = ['ffmpeg', '-nostdin', '-v', 'error', '-y', '-ss', str(p['in']), '-t', str(p['dur']), '-i', os.path.join(drive, src), '-vf', vf, '-c:v', 'libx264', '-crf', '23', '-preset', 'veryfast', '-an', o]
    subprocess.run(cmd, check=True); lst.write(f"file '{o}'\n")
lst.close()
subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', f'{tmp}/list.txt', '-c', 'copy', out], check=True)
print('wrote', out)
