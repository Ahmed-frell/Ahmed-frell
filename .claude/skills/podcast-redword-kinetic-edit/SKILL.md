---
name: podcast-redword-kinetic-edit
description: Edit a podcast or talking-head clip into a punchy social clip in the "red-word kinetic" style analysed from the reference reel (VID_20261127_200232_220). The style has a letterbox-open intro, wide-spaced word-by-word captions, giant condensed RED key words placed behind the speaker with an outline on top, a chrome script hero word, an editorial stacked type block, a tracking-data HUD overlay, a cut-in guest with bold centre captions, a grunge title card with whoosh-impact and a social end card with sub boom. Renders a real MP4 with PIL + ffmpeg. Use whenever the user wants a podcast clip, founder or interview reel "like this reference", red big-word captions, text behind the speaker, or a "Figured Out"-style edit, even without naming this skill.
---

# Podcast red-word kinetic edit

Turns **raw podcast takes + the spoken words with timings** into a finished clip in the reference style. Every new clip is re-timed
from its own speech. Only the **system** carries over: layer grammar, typography, rhythm, tail cards and SFX.

Read first:
- `references/reference-breakdown.md` has the measured shot/text/SFX map of the reference, its rhythm rules and the layer order.
- `templates/edit.example.json` is the reference rebuilt event-by-event. Copy it and re-time it.
- `assets/reference-contact-sheet.jpg` shows the reference at 2 fps.

## Hard rules
1. **No watermark:** do NOT put an Instagram (or any social) icon/handle watermark on the clip or the title card, even though the
   reference has one. The handle appears only on the closing end card.
2. **Branding:** never reuse the reference channel's handle, show name or logo. Ask the user for *their* handle and show title.
   The end-card glyph is a generic camera icon, not a platform logo file.
3. **Words:** never invent the transcript. Use offline ASR if it works. If it doesn't (the network here blocks Hugging Face
   models), read the captions or ask the user for the line. Confirm the key words before rendering.
4. Never alter or regenerate the speaker's voice. Cuts only.
5. Key-word discipline: **one red word per clause**, the noun that carries the idea (TEAM, MONEY, DISTRIBUTIONS). Use 1 script hero word
   at the hook ("One,") and 1 editorial stack for the thesis sentence. Side words show the stressed words only.
6. Show a `--preview` segment of any new look before the full render.
7. Push to GitHub only with permission.

## Pipeline
1. **Ingest:** probe every take (size, fps, rotation, audio). Pick the output size. The reference is 1280×768. For Reels/Shorts use
   1080×1920 and re-place the elements (see "9:16 adaptation").
2. **Reference (if a new one is given):** `scripts/reference_strips.sh ref.mp4 work/ref "0-1.2" "1.2-2.6" ...` produces a contact sheet,
   timecoded 15 fps strips and a loudness timeline. Update `references/reference-breakdown.md` for that reference.
3. **Words + times:** get word timestamps (ASR or a manual tap-through). Mark clauses, pick the red word per clause, the hook word and
   the thesis stack.
4. **Edit JSON:** copy `templates/edit.example.json` next to the takes. Fill `segments` (host then guest cut-ins), `handle`, `title` and
   `events`. Event types:
   - `caption` with `style` `line` (words spread across a baseline), `side` (one word at a time, right of the face) or `center`
     (bold, on the chest; add `"behind": true` to tuck it behind the speaker).
   - `red_word`: `text`, `t`, `end`, optional `y`, `height`, `max_width` (long words are squashed to fit), `flash` (1-frame white
     letter-spaced flash, default on).
   - `script_word`: chrome script hero word with a 1-frame red outline flash.
   - `stack`: lines of `[word, "script"|"caps", t, x_offset]`. Caps wipe right→left, script fades.
   - `zoom`: camera move on the footage only, `{t, end, from, to, ramp, cx, cy}`. Use `ramp` 0.15 s for a punch-in on a red
     word and ramp = span for a slow push or pull. Overlays don't move.
   - Top-level `grade`: `"reference_warm"` (matches the reference) or any ffmpeg filter chain. It's applied to the footage before the text.
   - Top-level `end_clip`: `{src, fit: contain|cover}` ends the video on the user's own logo animation instead of the generic end card.
     Set `"title_card": null` to skip the title card. A sub boom lands on the first frame of whatever closes the video.
   - Small output heights (e.g. 1080×566): raise `size` on line/side captions to ~0.055–0.065 so they stay readable.
   - Top-level `music`: `{src, start, gain_db (-16..-20), duck_db (~8), fade_in, fade_out}`. This is a bed under the dialogue that dips
     automatically while the speaker talks and runs on under the closing logo. **The track must be a file the user supplies and is licensed
     to use. Never download commercial music.** To use "the same portion as the reference", run
     `scripts/find_music_offset.py song.m4a reference.mp4` and use the best song time as `start`.
   - `sfx`: extra cues `{kind: whoosh_impact|sub_boom|tick, t, gain_db}`. The tail cues are added automatically.
5. **Matte (for text behind the speaker):** run `scripts/fg_matte.py u2net_human_seg.onnx work/aroll.mov work/matte 30 5.9-11.6 ...`
   over the red-word and behind-caption spans, then set `"matte_dir": "work/matte"`. Without a matte, red words render in front.
6. **Preview:** run `python3 scripts/render_reel.py edit.json --preview 1.0-6.0`, check the frames, then get approval.
7. **Render:** run `python3 scripts/render_reel.py edit.json`. The output is H.264 CRF 17 + AAC 192k, −14 LUFS / −1 dBTP, faststart.
8. **QA:** contact sheet of the output at 2 fps, compare it with the reference sheet, check that no text crosses the face, that the
   handle is the user's own, that the audio has no clipping and that the duration is right.

## Style constants (from the reference)
- Red `#D70C12`, Anton (condensed heavy grotesk), top-anchored, ~42–56 % of frame height, hard cuts between words.
- The captions use Inter Regular (line/side) and Inter Bold (centre). The stack uses Inter Black Italic for caps and Great Vibes for script.
  The title card uses Michroma with wide tracking, and the handle uses Bebas Neue. All of these fonts are SIL OFL and bundled in `assets/` (Inter is a system font).
- Chrome gradient (top→bottom): `#EBF5FF → #96BEF0 → #FFFFFF → #78A0D7 → #F0F8FF`, plus a soft shadow.
- HUD: 5 drifting points with mono `x: ### y: ###` readouts, dashed links and 2 thin red boxes (alpha ~0.6).
- The intro is a letterbox slit opening over 1.1 s. The tail is a 2.4 s grunge title card (fade out) and a 4.3 s end card.

## 9:16 adaptation
Keep the grammar. Red words go to ~30 % H, and the stack starts at y 0.12. Side words go below the chin (y ~0.58), and centre captions go to y ~0.62. Keep text out of the top 8 % and bottom 18 %.
