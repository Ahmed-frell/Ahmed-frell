# QC report: bluezone-draft-v2.mp4

**Overall: PASS**

| Check | Result | Detail |
|---|---|---|
| Video codec / pixel format | PASS | h264 yuv420p High |
| Resolution 1080×1920 (9:16) | PASS | 1080×1920 |
| Frame rate | PASS | 30/1 |
| Audio AAC stereo 48 kHz | PASS | aac 2ch 48000 Hz 269 kbps |
| Duration | PASS | 92.700 s |
| Full decode without errors | PASS | clean |
| No unintended black frames | PASS | black ranges [('0', '0.166667')] (allowed: fade-in <0.45 s, fade-out >91.9 s) |
| No frozen video > 1.6 s (outside title/end cards) | PASS | none |
| Voice-over sync (vs original take) | PASS | offset error +0.0 ms (VO placed at 0.40 s) |
| Loudness (Instagram ≈ −14 LUFS) | PASS | -13.4 LUFS integrated, true peak -1.1 dBFS |
| No clipping | PASS | -1.1 dBFS |
| Subtitles ordered, no overlaps, readable duration | PASS | 41 chunks, min 0.85 s |
| Subtitles cover the narration | PASS | 86.2 s of subtitles for 89.8 s VO |

## Manual review (frame-by-frame contact sheets of the final MP4: `work/qa_final/`, `work/qa_fix/`)
| Check | Result |
|---|---|
| Every scene shows the intended Blue Zone footage/asset; no missing media or blank frames | PASS |
| Transitions land on the voice pauses (bloom on 8.8 / 31.95 / 83.1, wipes and pushes elsewhere) | PASS |
| Text within the Instagram safe area (y 230–1540, x 90–990); subtitles clear of the plot plan and panels | PASS |
| Architecture unchanged: clips only cropped/panned and lightly graded (contrast +4 %, saturation −7 %, warm highlights) | PASS |
| Renders labelled "Artist's impression"; master plan and villa layout labelled "indicative" | PASS |
| Branding: Blue Zone Habitat logo (title, end card, corner logo), Mission Malappuram 2050 and Genius Infravision logos from the brochure; no D'Homz assets | PASS |
| Contact: +91 73565 23534 (confirmed by client 2026-11-06) and bluezonehabitat.com | PASS |
| Splice points (frames 1000, 1211, 2480) show no jump | PASS |

## Claims check (against the knowledge base)
- Spoken lines are the client-approved transcript. On-screen text adds only qualified facts: 51 villas, 3/4/5 BHK (Neura / Quantra · Aurexa / Lynora), **"~43% planned open space · approx. · as per current plan"**, Garden Ethen and Garden Elara, "office space planned in the clubhouse", Anakkayam · Manjeri · Malappuram.
- Shown because the approved script says it (flagged earlier, approved by the client): "Incubated at IIT Madras Research Park" (text only, no IIT logo).
- Not shown anywhere: prices, dates, distances, RERA, "Kerala's First", "second largest clubhouse", 50+ amenities, energy or health claims.

## Known limitations
- 16:9 source renders are cropped to 9:16 (1.78× scale), so full-bleed scenes are slightly softer than native 1080×1920. Wide shots use rounded panels to keep detail.
- Some walkthrough frames show the bright-green screen wall present in the original render (S02, S06). It is left as delivered (no alteration of the design).
- Music is an original score generated for this draft. It can be swapped for a licensed track if you prefer.
