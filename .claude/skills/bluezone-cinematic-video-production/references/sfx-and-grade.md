# SFX mapping + colour grading

## SFX library (`scripts/sfx_library.py`, original synthesis, no licence needed)
Each sound has a `hit` time. The mixer places it so the hit sample lands on the cue frame.
| Sound | Hit | Peak | Use on |
|---|---|---|---|
| `whoosh_whip` | 0.26 s | −14 dB | Whip transitions (cue at insert start + 2 f) |
| `swish_text` | 0.10 s | −22 dB | Headline / emphasis text reveals (not every word) |
| `whoosh_reverse` | 0.30 s | −20 dB | Occasional text exit |
| `tick` | 0 | −30 dB | Start of a typewriter headline (one tick, not per letter) |
| `impact_soft` | 0 | −11 dB | Giant numeral / headline landing (+0.1 s after header start) |
| `riser` | 1.2 s (end) | −20 dB | Into section headers and the logo |
| `sweep_tonal` | 0.28 s | −24 dB | Text-to-text morphs |
| `accent_num` | 0 | −16 dB | Counter landing, icon pops, pin drop |
| `airy` | 0.45 s | −28 dB | Tracking-expansion labels |
| `tear` | 0.22 s | −16 dB | Blueprint tear |
| `reveal_arch` | 0.45 s | −18 dB | Door-mask architectural reveals, image-through-text fly-through |
| `flash_hit` | 0 | −13 dB | Silhouette flash |
| `logo_signature` | 0 | −12 dB | Logo resolve |
| `marker` | 0.05 s | −27 dB | Marker ellipse drawing |

**Density rule:** about 1 cue per 1.5–2.5 s overall. Caption swishes only on emphasis beats ≥ 1.6 s from any other cue, never inside designed-text windows.
Same-sound cues < 0.30 s apart are merged. SFX under speech −4 dB. Music ducked 11 dB under speech.
Targets: voice ≥ 15 dB above music + SFX during speech, −13.5 LUFS ±1, true peak ≤ −1 dBFS.

## Colour: GREEN IS THE BRAND, NOT A FILTER
- **Footage stays natural.** Neutral whites and greys, warm accurate skin, true architectural colours, natural foliage and sky.
- Green (Holly, forest, olive, pistachio) appears only in typography, boxes, backgrounds, giant numerals, transitions and the outro.
- Scene-specific correction (`scripts/grade.json`), no LUT:
  - **Presenter:** measure a neutral wall patch. Remove about 2/3 of the cast with `colorchannelmixer` (here R×0.965, B×1.045 for mixed daylight + warm practical).
    Keep skin warm, gentle S-curve with highlight roll-off (0.94→0.93), gamma 1.04, saturation 1.04, a very soft vignette (PI/8).
  - **Renders:** no hue change. Contrast 1.04, highlight roll-off, light sharpen, so they sit next to the presenter in exposure and contrast.
- QC: wall patch R≈G≈B within ±6 %, faces not green or grey, and render whites stay white. Compare original / previous / new side by side.
