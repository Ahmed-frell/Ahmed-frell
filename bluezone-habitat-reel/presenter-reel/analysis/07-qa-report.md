# QA report: `bluezone-presenter-reel-final-v1.mp4` (2026-11-12)

## Technical (measured)
| Check | Result |
|---|---|
| Container / codecs | MP4 · H.264 High · AAC 48 kHz stereo 256 kbps |
| Resolution / frame rate | 1080×1920 (9:16) · 30 fps · **4,087 frames** (= EDL) |
| Colour | yuv420p, Rec.709 tagged (Remotion full-range output converted to video range) |
| Duration | 136.23 s (131.73 s dialogue + 4.5 s outro) |
| Decode | Clean, no errors |
| Black frames | Only the intended final fade (135.97–136.2 s) |
| Frozen picture | Only the outro logo hold (from 134.0 s) |
| Voice sync | **0.0 ms** offset vs the edited dialogue |
| Loudness | −13.5 LUFS integrated, true peak −1.0 dBFS; voice 16.2 dB above the music |
| WhatsApp version | 540×960, 4.8 MB, voice-synced, peak −0.9 dBFS |

## Visual (contact sheet every 2.5 s + spot frames: `work/final_contact.jpg`, `work/spot.jpg`)
| Check | Result |
|---|---|
| Every spoken phrase has the intended visual (EDL `05-edl.md`) | PASS |
| Project visuals are authentic client assets; renders carry "Artist's impression"; the Manjeri aerial is marked as a photo; the villa layout is "indicative" | PASS |
| Malayalam renders with correct shaping (Noto Sans Malayalam via Chromium/HarfBuzz) | PASS |
| Captions readable on mobile, inside the safe area, not over the face | PASS |
| Text behind the presenter (cut-out mattes) clean at the hair edges | PASS |
| No distorted renders (crop/scale only), no missing logos or media, no foreign watermarks | PASS |
| Transitions: whip / zoom-blur / flash entries, hard cuts back; B&W snaps on USP headers | PASS |
| Grade: green look G2 on presenter and renders, natural skin | PASS |

## Claims check
- Spoken words are the client's own recording, unedited except for cuts (retakes L5 and L15 removed at the client's direction).
- On-screen text adds only qualified facts: "51 workspaces · **planned**", "Shared maid quarters · **planned** · inside the clubhouse",
  "Internal cloud kitchen · **planned** · association-run", "Breakfast to every villa · **concept**", "2–3 villas · 1 shared maid" (as spoken).
- Not shown: prices, dates, approvals, health claims, distances.

## Known limitations
- Word timings for captions are **estimates**: line boundaries are exact (snapped to real pauses), but words within a line are spaced by length and snapped to syllable gaps. A word-level Malayalam recogniser was not available offline. Expect captions to be occasionally a few frames early or late inside long sentences.
- Full-bleed B-roll is cropped from 16:9 1080p renders (about 1.8× scale), so it is slightly softer than native vertical footage.
- No cloud-kitchen or morning-routine footage exists; villa kitchen, dining and rooftop-dining renders stand in.


---
# QA: `bluezone-presenter-reel-final-v2.mp4` (revision 2, 2026-11-12)
| Check | Result |
|---|---|
| Format | H.264 High · 1080×1920 · 30 fps · yuv420p Rec.709 · AAC 48 kHz stereo 256 kbps · 186.7 MB |
| Frames / duration | 4,087 / 136.23 s (= EDL + outro) |
| Decode | Clean |
| Black / freeze | Only the intended final fade (135.93–136.2 s) and the outro logo hold (from 134.0 s) |
| Voice sync | 0.0 ms at 20 s, 70 s and 115 s |
| Loudness | −13.3 LUFS, true peak −1.0 dBFS; voice 16.8 dB above music + SFX |
| Grade | Natural: neutral whites, warm skin, true render colours; green only in design elements (`09-colour-grading-comparison.jpg`) |
| Motion / text / transitions | Contact sheet every 2.5 s, plus spot frames of every effect; matches the approved 22 s segment (`11-reference-vs-final-motion.jpg`, `12-text-animation-map.md`) |
| SFX | 70 frame-aligned cues (`10-sfx-timing-report.md`) |
