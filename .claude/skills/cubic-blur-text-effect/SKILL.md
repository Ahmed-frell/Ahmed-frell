---
name: cubic-blur-text-effect
description: Add "cubic blur" kinetic captions to a talking-head or B-roll video - big lowercase heavy-sans key words stacked with small filler words, white text in OVERLAY blend so it takes the colour of the wall behind it, cubic fade-in and Gaussian-blur-plus-fade-out, each chunk overlapping the previous one, placed in empty space in the shot and synced word by word to speech. Renders a finished MP4 with the bundled Python renderer, or gives exact After Effects (JSX script / Animation Composer presets "Fade Cubic In" + "Gaussian Blur & Fade Eased"), Premiere or CapCut steps. Use whenever the user asks for the cubic blur text effect, "blur captions", "overlay captions", "Animation Composer caption style", captions "like the After Effects tutorial reference", aesthetic/moody/minimal kinetic captions, or wants this look on their own footage, even without naming this skill.
---

# Cubic Blur Text Effect

A minimal, premium caption style. Words appear on screen as they're spoken. They don't sit in a fixed caption bar: they float
in the empty parts of the frame (walls, cabinet fronts, sky), take on the colour of what's behind them, and dissolve into
blur as the next words arrive.

Reference: an After Effects tutorial reel (720×1280, 30 fps, 43 s) that builds the look with **Animation Composer 3**:
In = `Transitions – 2D Layer › Fade Cubic In`, Out = `Transitions – 2D Layer › Gaussian Blur & Fade Eased`,
then every text layer set to **Blending Mode › Overlay**. Measured details are in `references/style-spec.md`.

## The look in one screen

| Element | Rule |
|---|---|
| Font | Heavy neo-grotesque sans: Helvetica Now Display Bold / Neue Haas Grotesk Display Bold. Free stand-in: **Inter Display ExtraBold** (default here), Archivo Black. |
| Case | **all lowercase**, always (the pronoun "I" stays capital). |
| Tracking / leading | Tight: tracking about −30 (−0.03 em). Lines in a stack nearly touch (gap about 3% of the key word size). |
| Colour | Pure white with **Overlay** blend. No stroke, shadow, box, emoji or colour highlight. |
| Hierarchy | Each chunk = 1 **key word** (big) + 0–1 line of **filler** words (small). Key word ≈ 2.4× filler size; key word width ≈ 40–60% of frame width. |
| Stacks | Filler line can sit above *or* below the key word. Alignment varies (left / right / centre), anchored to the empty area. |
| Placement | In negative space for the current shot: upper wall in close shots, cabinet/desk front in wide shots, wall beside a standing subject. Changes per camera setup; consistent within one shot. Text goes over the subject, not masked behind. |
| In | Opacity 0→100 %, **cubic ease-out**, 8 frames at 30 fps (≈ 0.27 s). No movement, no scale. |
| Out | Gaussian blur 0→35 px (at 1080 wide, builds fast) **+** opacity 100→0 % (holds, then drops), 10 frames (≈ 0.33 s). |
| Overlap | The next chunk starts fading in **4 frames before** the previous one starts fading out. The screen is never empty mid-sentence, and there are no hard cuts between captions. |
| Stagger | Inside a chunk, the line spoken first appears first ("one" → "of the most" ≈ 3–5 frames later). |
| Sync | Each chunk's start = first syllable of its first word; its end = end of its last spoken word (+ hold, see below). |
| Footage | Works best on a moody, darker grade (teal and tungsten in the reference). Overlay text nearly disappears on near-black areas, so place it on mid-tones. |

## Workflow

1. **Probe** the video: `ffprobe` for size, fps, duration and rotation. Pull a contact sheet (`fps=1,scale=360:-1,tile=6x4`) to see
   the shots and where the empty space is in each.
2. **Words with timings.** Use the user's transcript plus word timestamps. If `faster-whisper` / `whisper` is installed, run it with
   word timestamps. If not, ask the user for the script and align it by listening for silences (`silencedetect`). Never invent words.
3. **Chunk the speech** (rules in `references/style-spec.md` › Chunking):
   - one chunk = one key word + the small words around it, 1–4 words, 0.4–1.2 s on screen
   - the key word = the word carrying meaning or emphasis (noun, verb, number, the punch word); small = articles, prepositions, pronouns, connectors
   - a long stretch of small words can be its own chunk with no key word ("is how I make")
4. **Place** each chunk: pick `x, y, align` per shot from the contact sheet (normalised 0–1). Keep the same anchor within a shot. Alternate the
   filler line above/below to keep it lively.
5. **Write `captions.json`** (schema below; example in `templates/captions.example.json`).
6. **Preview** a 5–8 s segment first: `python3 scripts/render_cubic_blur.py in.mp4 captions.json preview.mp4 --start 0 --duration 6`,
   then extract 3–4 stills and check them before the full render.
7. **Render** the full video, then QC (below).
8. If the user edits in After Effects / Premiere / CapCut, give them `references/editor-recipes.md` steps instead of, or as well as, the render.
   `scripts/cubic_blur_ae.jsx` applies the effect to selected text layers in After Effects without Animation Composer.

## captions.json

```json
{
  "font": "/usr/share/fonts/opentype/inter/InterDisplay-ExtraBold.otf",
  "key_size": 0.19,          // key word font size as a fraction of video width
  "small_ratio": 0.42,       // filler size = key size × this
  "tracking": -0.03,         // em
  "line_gap": 0.03,          // gap between lines, × key size (can be negative)
  "blend": "overlay",        // overlay | soft_light | normal
  "opacity": 1.0,
  "in_frames": 8, "out_frames": 10, "overlap_frames": 4,
  "blur_px": 35,             // max out-blur at 1080 px width (scaled to the video)
  "chunks": [
    {"start": 0.10, "end": 0.95, "x": 0.92, "y": 0.10, "align": "right",
     "lines": [{"text": "one", "key": true},
               {"text": "of the most", "delay": 0.15}]}
  ]
}
```
- `start` / `end` are seconds on the input video. `end` is when the fade-out *starts*. The renderer automatically extends each `end`
  so the out-fade overlaps the next chunk's in-fade by `overlap_frames` (turn this off with `--no-auto-overlap`).
- `x` is the alignment edge (left edge for `left`, right edge for `right`, centre for `center`). `y` is the top of the stack.
- A line may set `"size"` (fraction of width) to override, `"delay"` (s) for staggered entry, `"key": true` for the big size.
- Any chunk may override `blend`, `opacity`, `blur_px`, `in_frames`, `out_frames`, `behind`, `safe_rect`.
- `"extend": false` on the **last chunk before a cut** stops the auto-overlap from stretching it into the next shot, where it would show
  as a blurred ghost after the cut. Set its `end` about 10 frames before the cut so the blur-out finishes on the cut.
- `"safe_rect": [x0, y0, x1, y1]` (0–1, top level or per chunk) clips all text to that box. Use it for **letterboxed footage**
  (a 16:9 picture inside a 9:16 frame) so no text lands in the black bars. Find the box with a row/column mean > 6 on a frame.
- `"behind": true` on a chunk puts the text **behind the people**: a person mask is computed per frame and cuts the text out where
  someone is in front. Render with `--matte-model selfie_multiclass_256x256.tflite`
  (from `https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite`;
  needs `pip install mediapipe` and `apt-get install libegl1 libgles2`). The mask is computed only inside `safe_rect` and smoothed over time,
  but not across cuts.
  Design rules for behind-words: one big word (size 0.28–0.40 W), placed so the head or shoulders cover part of it at mid-height. Keep
  at least ~60% of the letters visible so it still reads. Put it on a darker wall: Overlay washes out over bright areas, so use
  `"blend": "normal", "opacity": 0.85` there. Use one or two per shot at most, on the punch words.

## Renderer

`scripts/render_cubic_blur.py IN.mp4 captions.json OUT.mp4 [--start S --duration D] [--crf 18] [--no-auto-overlap] [--matte-model M.tflite] [--still T]`
- Python 3 + numpy + Pillow + ffmpeg. No GPU needed. Decodes frames through a pipe, composites, and re-encodes H.264 (yuv420p, +faststart),
  copying the source audio.
- Text is rasterised once per line, with glyph-by-glyph tracking and kerning kept. Blur and opacity are applied per frame.
- Blend maths (per channel, 0–1): overlay with white `= base < .5 ? 2·base : 1`, mixed by alpha × opacity. This is what makes the text pick up
  the wall colour.

## QC checklist
- [ ] Every caption word matches the audio. Chunk starts land on syllable onsets (±1 frame).
- [ ] No frame with two fully opaque chunks, and no empty gaps mid-sentence (overlap working).
- [ ] Key words readable: check stills on the darkest and brightest shots. If overlay vanishes on a dark area, move the chunk or set that chunk
      to `"blend": "normal", "opacity": 0.85`.
- [ ] Nothing in the platform UI zones: top 8%, bottom 20%, right 12% (Reels / Shorts buttons).
- [ ] All lowercase, no punctuation, no stray full stops.
- [ ] Output: same fps and resolution as input, audio in sync, plays in a browser (yuv420p).

## Files
- `references/style-spec.md`: measured frame data from the reference, the chunking rules, a placement guide, easing curves
- `references/editor-recipes.md`: After Effects (with and without Animation Composer), Premiere Pro, CapCut, DaVinci Resolve steps
- `scripts/render_cubic_blur.py`: renderer
- `scripts/cubic_blur_ae.jsx`: After Effects ScriptUI-free script; select text layers, run it, and it adds the in/out keyframes, blur and Overlay
- `scripts/words_to_chunks.py`: turns word timestamps (whisper-style JSON) into a starter `captions.json` that you then refine by hand
- `templates/captions.example.json`: the reference's opening lines rebuilt as captions
