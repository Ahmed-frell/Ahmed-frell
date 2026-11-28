# JOIN CID: value-selling clip (1080×566)

- `edit.json`: the full edit plan from the user's transcript. Rough cut = source 00:12–00:31 of `IMG_2376.MOV` (the main take).
  The word times inside each line are estimates; snap them to the real audio once the take is in.
- `join-cid-logo-end.mp4`: closing logo (contain-fit, sub boom on its first frame).
- `BRIEF.md`: original brief.

Render (with `IMG_2376.MOV` from Drive saved in this folder; it is git-ignored):

    python3 ../../.claude/skills/podcast-redword-kinetic-edit/scripts/render_reel.py edit.json --preview 0-8   # look check
    python3 ../../.claude/skills/podcast-redword-kinetic-edit/scripts/render_reel.py edit.json                # full

Rough cut only (no grade/text/effects):

    ffmpeg -ss 12 -to 31 -i IMG_2376.MOV -vf "scale=1080:566:force_original_aspect_ratio=increase,crop=1080:566,fps=30" -c:v libx264 -crf 18 -c:a aac -b:a 192k roughcut_1080x566.mp4

## Background music: "São Paulo" (user's request)
The user must supply the audio file (a licensed copy, MP3/M4A/WAV); it is not downloaded from the web. Save it here as `sao_paulo.m4a`, then:

    python3 ../../.claude/skills/podcast-redword-kinetic-edit/scripts/find_music_offset.py sao_paulo.m4a reference.mp4

(`reference.mp4` = the reference video from Drive.) Put the "best" time into `edit.json`:

    "music": {"src": "sao_paulo.m4a", "start": <best>, "gain_db": -16, "duck_db": 8, "fade_in": 0.6, "fade_out": 3.0}
