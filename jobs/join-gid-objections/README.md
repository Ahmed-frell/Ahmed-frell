# JOIN GID: objection handling (1080×566, 41.2 s)

- Source `IMG_2391.MOV` (Drive folder 1CEn-3jeh7cRYs5HE2MUURPHWTO_pkzPI): 4K60 HDR, 40.8 s. Not committed.
- Cut: 6.90–17.65 | 17.98–31.70 (0.33 s pause tightened) | 32.40–38.60. Removed: pre-take chatter (0–6.9), the end clap (39.0).
- **In-camera zoom removed:** the phone zooms from wide to close-up at 32.2–32.9. The audio runs from 32.40; the video starts at 32.88
  (settled close-up) with its first frame held for 0.48 s under a white flash, a shake and the red JOIN GID slam (`video_in` in edit.json).
- Word timing: sherpa-onnx English ASR on the cut. Grade `reference_moody_light`. Text behind the speaker via u2net mattes.
- SFX on the text: whoosh on every red word, pop on every stacked word, soft ticks on side words, flash hits on "signals." and JOIN GID.
  Camera: pushes, punch-ins on REJECTION / BETTER QUESTIONS / HANDLE OBJECTIONS / SELL, shakes on the slams.
- Music: user's "EL CONTROL (super slowed)" from 0:45 of the track, under the whole video, ducked under the voice, fading over the logo. (Earlier version used "São Paulo".)
- No HUD (geometric boxes and lines removed at the user's request).
- Ends on `join-cid-logo-end.mp4` (from ../join-cid-podcast).

Render: `python3 ../../.claude/skills/podcast-redword-kinetic-edit/scripts/render_reel.py edit.json`, then a gain-plus-limiter pass to −14 LUFS.
