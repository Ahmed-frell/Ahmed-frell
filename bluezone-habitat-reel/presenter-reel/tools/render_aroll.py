#!/usr/bin/env python3
"""Render the graded A-roll master at full resolution from the ORIGINAL 4K takes, following a rough-cut EDL
(same frames, framing and drift as the rough cut). Usage: render_aroll.py edl.json grade.json out.mp4 [jobs]"""
import json, subprocess, sys, os
from concurrent.futures import ThreadPoolExecutor
edl, gradef, out = sys.argv[1:4]; jobs = int(sys.argv[4]) if len(sys.argv) > 4 else 4
E = json.load(open(edl)); G = json.load(open(gradef)); FPS = E['fps']; root = E['config']['root']
tmp = out + '_shots'; os.makedirs(tmp, exist_ok=True)
def one(i_s):
    i, s = i_s; N = s['frames']; iw, ih = 2160, 3840
    src = f"{root}/media/talking/IMG_{s['take']}.mov"
    zx = f"({s['z0']}+({s['z1']}-{s['z0']})*on/{max(1, N - 1)})"
    xc, yc = s['cx'] * iw, s['cy'] * ih
    vf = (f"fps={FPS},zoompan=z='{zx}':x='max(0,min(iw-iw/zoom,{xc}-iw/zoom/2))':y='max(0,min(ih-ih/zoom,{yc}-0.30*ih/zoom))'"
          f":d=1:s=1080x1920:fps={FPS},setsar=1,{G['aroll']},format=yuv420p")
    o = f"{tmp}/s{i:03d}.mp4"
    subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-ss', f"{s['in_f'] / FPS:.4f}", '-i', src, '-map', '0:v:0', '-frames:v', str(N),
                    '-vf', vf, '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-r', str(FPS), o], check=True)
    return o
with ThreadPoolExecutor(jobs) as ex: files = list(ex.map(one, enumerate(E['shots'])))
with open(f"{tmp}/list.txt", 'w') as f:
    for o in files: f.write(f"file '{os.path.abspath(o)}'\n")
subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', f"{tmp}/list.txt", '-c', 'copy', out], check=True)
print('wrote', out)
