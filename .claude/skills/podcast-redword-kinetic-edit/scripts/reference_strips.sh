#!/usr/bin/env bash
# Deconstruct a reference reel: contact sheet (2 fps), timecoded 15 fps strips around chosen moments, loudness timeline.
# Usage: reference_strips.sh reference.mp4 outdir "0-1.2" "1.2-2.6" ...
set -e; ref="$1"; out="$2"; shift 2; mkdir -p "$out"
ffprobe -v error -show_entries format=duration:stream=codec_type,width,height,r_frame_rate -of compact "$ref" | tee "$out/probe.txt"
ffmpeg -v error -y -i "$ref" -vf "fps=2,scale=320:-1,tile=5x8" -frames:v 1 "$out/contact.jpg"
for r in "$@"; do a=${r%-*}; b=${r#*-}; d=$(python3 -c "print($b-$a)")
  ffmpeg -v error -y -ss "$a" -t "$d" -i "$ref" -vf "fps=15,scale=240:-1,drawtext=text='%{pts\:flt}':x=4:y=4:fontsize=14:fontcolor=yellow:box=1,tile=6x5" -frames:v 1 "$out/strip_$a.jpg"; done
ffmpeg -v error -y -i "$ref" -vn -ac 1 -ar 16000 "$out/a.wav"
python3 -I - "$out/a.wav" > "$out/loudness.txt" <<'PY'
import sys,wave,struct,math
w=wave.open(sys.argv[1]);n=w.getnframes();d=struct.unpack('<%dh'%n,w.readframes(n));s=4000
for i in range(0,n,s):
  c=d[i:i+s];r=math.sqrt(sum(x*x for x in c)/len(c));z=sum(1 for a,b in zip(c,c[1:]) if (a<0)!=(b<0))/len(c)
  print(f'{i/16000:6.2f}s rms={20*math.log10(r/32768+1e-9):6.1f}dB zcr={z:.3f}')
PY
echo "wrote $out (contact.jpg, strip_*.jpg, loudness.txt: high zcr = noise/whoosh, low zcr + loud = sub boom)"
