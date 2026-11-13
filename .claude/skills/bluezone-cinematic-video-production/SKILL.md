---
name: bluezone-cinematic-video-production
description: Produce a premium Blue Zone Habitat presenter reel (9:16, 1080x1920 MP4) from raw talking-head takes, a reference reel and approved project renders, in the approved Blue Zone style - speech-synced kinetic typography (Cormorant Garamond / Montserrat / Malayalam), reference-matched transitions (silhouette flash, whip with motion blur, image-through-text, blueprint tear, door reveals), text behind the presenter, natural cinematic grade with GREEN as branding only, frame-aligned original SFX and a particle logo outro. Use whenever the user wants a Blue Zone Habitat / Bluezone video, reel or presenter edit "like the reference", a talking-head edit with B-roll from Blue Zone renders, or revisions to such an edit, even without naming this skill.
---

# Blue Zone Habitat: cinematic presenter reel production

Turns **raw takes + transcript + approved assets** into a finished reel. It re-analyses each new video. Nothing about a previous
video's words or timestamps is reused, only the **system**: workflow, design rules, components, timing grammar, SFX mapping and QA.

Read before designing:
- `references/reference-motion-grammar.md`: how to deconstruct a reference reel (frame-accurate) and the measured grammar of the approved reference
- `references/typography-system.md`: fonts, colour roles, the `TextFx` parameter model, entrance/exit catalogue, text rules
- `references/timing-and-transitions.md`: edit rhythm, framing, transition components and when to use each
- `references/sfx-and-grade.md`: SFX library and cue rules, loudness targets, the natural-grade method

## Hard rules
1. Never alter or replace the speaker's voice; never generate replacement speech. Cuts only, with the speaker's approval of the transcript.
2. Never invent a transcript. If offline ASR fails (Malayalam usually does), send the speaker `broll`-free raw takes with burned-in timecode
   and a phrase template, and align their text (`align_transcript.py`).
3. Green is branding, not a colour cast: footage keeps natural skin, whites, materials, sky and foliage.
4. Only genuine Blue Zone assets. Renders carry "Artist's impression"; plans "indicative"; planned facilities `PLANNED` / `CONCEPT`.
   No prices, dates, approvals, health or distance claims on screen unless verified.
5. Don't render the full video before the speaker has seen a short comparison segment of any new look.
6. Never push to GitHub without permission.

## Pipeline (project folder `<reel>/`; scripts in `scripts/`)
1. **Ingest:** download every asset and verify sizes, durations, rotation (iPhone MOV −90°), fps, audio. Write `analysis/01-asset-verification.md`.
2. **Reference:** scene detection (thresholds 0.30/0.12), 4 fps contact sheets, then **30 fps strips around every text animation and transition**.
   Measure frames for entrances, exits and transitions. Transients give the SFX positions. Write the text map, transition map and SFX map (template: `references/reference-motion-grammar.md`).
3. **Takes:** 1440×2560 working copies, voice clean (`highpass 80, afftdn, presence EQ, 2.2:1 comp, loudnorm −16`),
   silence map (−42 dB ≥ 0.3 s), head tracking `face_track.py` (U2-Net human-seg ONNX).
4. **Rough cut v1** (`roughcut.py config.json out --render 360x640`): pauses tightened into jump cuts, framing pattern. Send it for review.
5. **Transcript:** the speaker supplies the text on the v1 timeline. Then `align_transcript.py` → line boundaries snapped to real pauses; overrides `src`/`spill_to_next` for edge cases; retakes flagged and removed.
6. **Rough cut v2** (`roughcut.py` with `transcript` + `line_frames`): a new shot per line, close-ups on hooks and headers.
7. **B-roll plan:** pick the real asset that matches each phrase. Preview with `broll_preview.py` (labelled 360×640) and get approval.
8. **Grade:** measure neutral patches, then scene-specific `grade.json`. Comparison still (original / previous / new).
   `render_aroll.py edl grade out` renders the full-res A-roll from the original 4K. B-roll is re-cut with the `broll` grade (renders: no hue change).
9. **Beats + fx:** `build_beats.py` gives word-timed caption beats. Then write the video's own `build_fx.py`, using
   `templates/build_fx.example.py` as the pattern: designed `TextFx` elements on spoken words, transitions per insert, SFX cues, hidden caption windows.
10. **Mattes:** `fg_matte.py` for every window that has text behind the presenter or a silhouette flash.
11. **Compose:** copy `templates/remotion/` (hard-link media into `public/`: Remotion does not follow symlinks), adapt
    `Reel.example.tsx` (the time constants at the top come from this video's words). Check stills with `scripts/stills.mjs`.
12. **Audio:** `sfx_library.py`, `compose_score.py` (bed only, `whooshes: [] impacts: []`), then `mix_sfx.py` (frame-aligned cues + timing report).
13. **Segment → full render:** render the comparison segment, then `npx remotion render … --concurrency 3` (about 0.5 fps on 4 CPU cores).
    Mux with `scale=in_range=full:out_range=tv,format=yuv420p` and Rec.709 tags, AAC 256k, `+faststart`.
14. **QC:**
    - frames = EDL; no decode errors; black only at the fade; voice sync 0 ms; −13.5 LUFS; peak ≤ −1 dBFS
    - contact sheet every 2.5 s, plus spot frames for every effect
    - QA report covering grade, claims and limitations
    - WhatsApp version: 540×960 two-pass with the bitrate computed for < 5 MB

## Variant: renders-only reel (still renders + voiceover, no presenter)
Used for the Blue Zone renders reel (`bluezone-habitat-reel/renders-reel/`, reference 2 = a villa Story ad).
1. **Script:** apply safe wording (planned / inspired by) before generating any voice; on-screen text carries `PLANNED` where needed.
2. **Voice:** ElevenLabs if available. Offline fallback: AI4Bharat Indic-TTS Malayalam (FastPitch + HiFi-GAN, MIT) on coqui-tts
   (`scripts/indic_tts_scenes.py model_dir scenes.json out_dir male 0.8`). Its vocabulary is Malayalam letters only, so write numbers
   as words and spell out acronyms. Use `length_scale` (0.8 = ×1.25) for pace instead of time-stretching. One clip per scene, so scene
   lengths are known; then trim, light EQ and compression, scene gaps of 0.5 s, loudnorm −16.
3. **Shots:** one or two shots per scene, cut at the sentence pause; 10-frame dissolve between scenes, hard cuts inside.
   Moves per shot in `shots.json` (`s` zoom where 1 = image height fills the frame, `x`/`y` focus point, optional `pulse`).
   Pre-upscale renders to 2500 px tall (Lanczos, contrast 1.04, light unsharp; no hue change).
4. **Background:** `scripts/render_bg.py shots.json img_dir bg.mp4` renders every camera move in Python (sub-pixel affine, antialiased),
   about 8 min for 95 s. Remotion then draws only text and graphics over `<OffthreadVideo src="bg.mp4">`.
5. **Typography (reference 2):** white Playfair Display italic over Anton in a cream gradient (`background-clip: text`, shadow via a parent
   `filter: drop-shadow`), scattered letter fade with blur; Cormorant caps and numerals for labels and counters; map-pin drop + location card;
   typewriter "Contact For Site Visit"; motion-blur logo slide on the logo's own paper colour (#F5F3E6).

## Components (templates/remotion/src)
`TextFx` (data-driven text: rise · type · fly · overshoot · box · track · morph; exits rise · fade · morph; marker; leader) ·
`Captions` (speech-synced beats, masked rise, letter fly with motion blur, typewriter accent, per-word Malayalam, beat-to-beat continuity) ·
in `Reel.example.tsx`: `SilhouetteFlash`/`HollySilhouette`, `Giant` (numeral behind the presenter), `BehindPresenter`, `Whip` (CameraMotionBlur),
`Doors`, `ImageText` (SVG mask), `Tear`, `Counter51` pattern, `Pip`, `UspCard` (defocus + card push), `MaidIcons`, `Pin`, `LogoGlow`, `Outro`.

## Lessons
- Chrome's CSS `clip-path: url(#svgClipPath)` with `<text>` did not render. Use an inline SVG `<mask>` plane with letter holes.
- Remotion `public/` must contain real files (hard links), not symlinks.
- Remotion outputs full-range yuvj420p; convert to video range when muxing.
- Offline Whisper is fine for English but hallucinates on Malayalam/Manglish, so ask for the text.
- A green LUT over footage was rejected by the client. Keep the footage natural and the branding green.
- Rendering speed: Chrome scaling 3750 px stills every frame ran at ~5 s/frame. Pre-render the moves (`render_bg.py`) and use
  `setChromiumOpenGlRenderer('angle')`: ~0.35 s/frame on 4 cores (swangle was 3–5× slower for the same frames).
- Every `bundle()` call (stills, benchmarks, renders) leaves a `/tmp/remotion-webpack-bundle-*` copy of `public/`. They are never
  cleaned up and filled the disk (12 GB), which slowed the render 4×. Delete stale ones before a full render.
