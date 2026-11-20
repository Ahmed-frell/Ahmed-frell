# Blue Zone Habitat reel: editable render project (Remotion + FFmpeg)

Everything in the reel is code. To revise a scene, edit one entry in `src/Reel.tsx` (`SCENES`) and re-render.
The voiceover, subtitles and music are separate steps, so a visual change never touches the audio.

```
render/
├── src/
│   ├── Reel.tsx         ← the timeline: 22 scenes with start/end, transition, tag and sync times (absolute seconds)
│   ├── components.tsx   ← FullClip (16:9 → 9:16 pan), KenBurns, Panel, Kinetic text, Chip, Counter, tags, end cards
│   ├── transitions.tsx  ← fade, zoomBlur, push, wipeUp/Down, leaf sweep, warm bloom
│   ├── Subtitles.tsx    ← Malayalam subtitles from src/data/captions.json
│   └── theme.ts         ← brand colours, fonts, safe area, VO offset
├── public/clips/        ← graded shots cut from the Drive footage (see scripts/shots.tsv)
├── public/img, brand/   ← renders, plans, logos
└── scripts/
    ├── shots.tsv            ← every shot: source file, in-point, duration (the cut list)
    ├── build_captions.py    ← line timings + VO → caption chunks + .srt
    ├── compose_score.py     ← original score (no third-party audio) from score_timeline.json
    ├── mix_audio.py         ← VO + ducked score → mix
    ├── stills.mjs           ← QA stills at chosen seconds
    └── qc.py                ← automated QC report
```

## Rebuild (from `bluezone-habitat-reel/`)
```bash
# 1. shots (only if shots.tsv changed)
cd render && grep -v '^#' scripts/shots.tsv | while IFS=$'\t' read id src in dur desc; do ffmpeg -nostdin -v error -y -ss $in -t $dur -i ../media/drive/$src -an -vf "eq=contrast=1.04:saturation=0.93:gamma=0.985,colorbalance=rh=0.025:gh=0.005:bh=-0.02:rs=-0.01:bs=0.015,unsharp=5:5:0.35" -c:v libx264 -crf 16 -g 15 -pix_fmt yuv420p public/clips/$id.mp4; done; cd ..
# 2. subtitles (only if timing/text changed)
python3 render/scripts/build_captions.py work/v2_line_timings.json audio/processed/vo_v2_clean.wav 0.4 render/public/captions.json output/bluezone-subtitles.srt && cp render/public/captions.json render/src/data/captions.json
# 3. music + mix (only if music changed)
python3 render/scripts/compose_score.py render/scripts/score_timeline.json audio/processed/music_v2_original.wav
python3 render/scripts/mix_audio.py audio/processed/vo_v2_clean.wav audio/processed/music_v2_original.wav 0.4 92.7 audio/processed/mix_v2.wav -3.5 -11
# 4. video + mux
cd render && npx remotion render BlueZoneReel out/video_silent.mp4 --muted --codec=h264 --crf=16 --concurrency=4 && cd ..
ffmpeg -i render/out/video_silent.mp4 -i audio/processed/mix_v2.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest output/bluezone-draft-vN.mp4
python3 render/scripts/qc.py output/bluezone-draft-vN.mp4 audio/processed/vo_v2_clean.wav 0.4 render/public/captions.json output/qc-report-vN.md
```
Preview interactively with `npx remotion studio`.
