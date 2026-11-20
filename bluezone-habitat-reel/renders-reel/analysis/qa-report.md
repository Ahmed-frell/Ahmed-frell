# QA report: `output/bluezone-renders-reel-v1.mp4` (2026-11-13)

## Technical (measured)
| Check | Result |
|---|---|
| Container / codecs | MP4 (faststart) · H.264 High · AAC 48 kHz stereo 256 kbps · 81.3 MB |
| Resolution / frame rate | 1080×1920 (9:16) · 30 fps · 2,850 frames |
| Colour | yuv420p, Rec.709, video range |
| Duration | 95.0 s (voice 0.6–90.2 s, logo card 90.8–95.0 s) |
| Decode | Clean, no errors |
| Black frames | None |
| Frozen picture | Only the logo card hold (from 91.8 s) |
| Voice sync | 0.0 ms at 5 s, 45 s and 82 s (against `work/vo/vo_clean.wav`) |
| Loudness | −13.4 LUFS integrated, peak −2.9 dBFS; voice 18.4 dB above music + SFX during speech |
| SFX | 33 frame-aligned cues (`work/audio/sfx-timing-report.md`, list in `tools/sfx_cues.json`) |

## Visual (`qa-contact-sheet.jpg` every 2.5 s, `qa-spot-frames.jpg` for each effect)
| Check | Result |
|---|---|
| Seven scenes follow the brief's moves: push-in, L→R pan, pull-back, tilt-up, diagonal pan, forward track, slight pulse | PASS |
| On-screen text matches `script.md` (safe wording); planned items carry a PLANNED pill | PASS |
| Every render carries "Artist's impression"; the interior frame says "villa interior" | PASS |
| Titles inside the Reels safe area (y 520–1500), legible on every background | PASS |
| Renders keep their own colours (contrast 1.04 and light sharpening only); green only in pin, pills and logo card | PASS |
| Contact details: +91 73565 23534 (client-confirmed 2026-11-06), bluezonehabitat.com | PASS |

## Voice
- AI4Bharat Indic-TTS Malayalam, male speaker, generated offline (ElevenLabs free tier was busy; the client asked for another generator).
- Measured: median pitch 136–147 Hz, steady pace (14–16 characters/s), no clipping, no dropouts, sentence pauses 0.6 s.
- **Not verified by ear:** pronunciation and naturalness cannot be judged in this environment. English loanwords written in Malayalam script
  (ലോഞ്ചിവിറ്റി, ക്ലൗഡ് കിച്ചൺ, ജെൻ സി) and the brand name are the lines to listen to first.

## Known limitations
- Renders are landscape (about 1536×1024); the vertical crop shows roughly 40 % of the width at about 2× enlargement, so they are softer than native vertical renders.
- No cloud-kitchen, kitchen-only or solar close-up render exists. Scene 4 uses a villa-interior walkthrough frame (kitchen counter and dining);
  scene 5 uses a top-down walkthrough frame that shows the roof solar panels; scene 6 uses the clubhouse office render.
- The TTS voice is less expressive than a studio or ElevenLabs voice; the same timeline can be re-voiced by replacing the seven scene clips.
