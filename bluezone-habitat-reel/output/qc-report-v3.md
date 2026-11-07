# QC report: bluezone-draft-v3.mp4

**Overall: PASS**

| Check | Result | Detail |
|---|---|---|
| Video codec / pixel format | PASS | h264 yuv420p High |
| Resolution 1080×1920 (9:16) | PASS | 1080×1920 |
| Frame rate | PASS | 30/1 |
| Audio AAC stereo 48 kHz | PASS | aac 2ch 48000 Hz 272 kbps |
| Duration | PASS | 100.000 s |
| Full decode without errors | PASS | clean |
| No unintended black frames | PASS | black ranges [('0', '0.166667')] (allowed: fade-in <0.45 s, final fade-out) |
| No frozen video > 1.6 s (outside title/end cards) | PASS | none |
| Voice-over sync (vs original take) | PASS | offset error +0.0 ms (VO placed at 0.40 s) |
| Loudness (Instagram ≈ −14 LUFS) | PASS | -13.6 LUFS integrated, true peak -1.1 dBFS |
| No clipping | PASS | -1.1 dBFS |
| Subtitles ordered, no overlaps, readable duration | PASS | 47 chunks, min 0.81 s |
| Subtitles cover the narration | PASS | 93.6 s of subtitles |

## Manual review
- Full contact sheet of the final MP4 (`work/qa_v3final/contact.jpg`): every scene present, text inside the safe area, no blank frames. PASS
- Changed sections verified by the client in `bluezone-v3-preview-changed-parts.mp4` ("Preview approved"). PASS
- Colour range: Remotion's full-range output converted to standard yuv420p; logo-card luma matches V2 (YAVG 171.2 vs 171.2). PASS
- Voice: client-supplied AI voice (ElevenLabs), used unchanged except loudness; voice 16.8 dB above the music. PASS
- Claims: on-screen text limited to approved facts; "Part of a planned township" (no "world-class" on screen); "Longevity science" without health promises. PASS
