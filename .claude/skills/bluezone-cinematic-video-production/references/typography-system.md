# Typography + text-animation system (Blue Zone Habitat)

## Fonts (OFL, bundled via @fontsource, no licence fees)
| Role | Font | Weight / style | Default size @1080×1920 | Colour |
|---|---|---|---|---|
| Editorial headline | Cormorant Garamond | 700, or 600 italic for soft words | 84–170 px | Ivory `#FFF8EC` |
| Accent word (headline) | Cormorant Garamond italic | 600 | 96–150 px | Pistachio `#B4F4A5` or champagne `#E3C98F` |
| Supporting / labels | Montserrat | 600–700, tracking 6–24 px, UPPERCASE | 26–54 px | Ivory or pistachio |
| Caption primary | Montserrat | 700 | 60 px | Ivory |
| Caption emphasis | Cormorant Garamond | 700 UPPERCASE | 118 px | Pistachio |
| Caption accent | Cormorant Garamond italic | 600 | 104 px | Champagne |
| Malayalam caption | Manjari | 700 | 64 px | Ivory |
| Malayalam headline / emphasis | Noto Serif Malayalam | 700 | 70–80 px | Ivory / pistachio |
| Giant numerals behind the presenter | Cormorant Garamond | 700, lining numerals | 980–1250 px | Holly fill + 3 px pistachio stroke |

Legibility shadow on footage: `0 2px 3px rgba(0,0,0,.45), 0 6px 26px rgba(1,52,8,.55)`. Boxes: Holly `#013408` with a 5 px pistachio left rule.
Safe area: text between y = 230 and y = 1540, x = 90–990 (Instagram UI).

## `TextFx` element: every parameter is data
`text · font (serif|sans|mlSerif|mlSans) · size · weight · italic · color · tracking · x · y · w · align · start (s) · dur (s) ·
enter · exit · stagger (frames) · enterDur / exitDur (frames) · ease (expo|back|cubic) · blur · box · marker · leader · sfx · sfxAt · sfxGain`

### Entrances (measured in the reference, analysis frames at 30 fps)
| `enter` | What moves | Unit | Duration | Easing | Reference |
|---|---|---|---|---|---|
| `rise` | each word rises out of an invisible mask (overflow hidden), +110 % → 0 | word | 8–9 f, stagger 2–4 f | expo-out `(0.16,1,0.3,1)` | masked reveal |
| `type` | letters appear, 2 f fade each | letter (Latin only) | stagger 1–1.2 f | linear | T2 "gonna hold" |
| `fly` | letters fly in from +140 px with scaleX stretch 1.45→1 and blur 7→0 (directional motion blur) | letter | 7–8 f, stagger 1 f | back-out `(0.34,1.56,0.64,1)` | T9 "grand" |
| `overshoot` | whole word 0.3 → 1.08 → 1 with blur 10→0 | word | 3–4 f | back-out | T11 "We" |
| `box` | Holly box wipes L→R; text revealed by the same wipe | block | 6 f | expo-out | T10 highlight box |
| `track` | tracking +22 px → target, blur 6→0, fade | block | 10–14 f | expo-out | premium headline (airy) |
| `morph` | scaleY 0.55→1, blur 12→0, fade (pairs with the outgoing `morph` exit) | word | 8 f | expo-out | text-to-text |

### Exits
`rise` (words leave upward through the mask, 5 f) · `fade` · `morph` (scaleY 1→1.5, blur 0→12, fade, 5 f) · `none` (hard cut with the shot).
**Text-to-text:** schedule the next element to start on the next spoken word with `enter: morph` while the previous one exits with `exit: morph`.

### Rules
1. **Malayalam is animated per WORD**, never per letter: splitting code points breaks conjunct shaping.
2. Text appears on its spoken word (from `beats.json`). No anticipation except the 1-frame lead built into the caption renderer.
3. One emphasis per beat. A script/italic accent at most once per sentence. 1–3 words per caption beat (≤ 18 characters).
4. Captions are hidden wherever a designed `TextFx` headline says the same words (`hidden` windows), so text never duplicates.
5. Text behind the presenter: render the element, then the presenter matte (`fg_matte.py` PNG per frame) on top.
6. Numbers count up and land on the spoken number (+0.5–0.8 s), with lining numerals and an `accent_num` SFX on the landing frame.
7. Planned or concept facilities are labelled `PLANNED` / `CONCEPT`. Renders carry an "Artist's impression" tag; photos are labelled as photographs.
