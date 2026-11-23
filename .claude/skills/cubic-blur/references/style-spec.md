# Cubic Blur: measured style spec

Source: After Effects caption tutorial reel, 720×1280, 30 fps, 43 s. The first 17 s are the finished look on B-roll, and the rest is the
AE tutorial (Animation Composer 3 panel visible). Measured from 10 fps strips and full-res stills.

## 1. Observed caption sequence (first 10 s)

| t (s) | Chunk (key in CAPS) | Stack | Placement |
|---|---|---|---|
| 0.1 | ONE / of the most | key above, filler below, right-aligned | upper-right wall |
| 0.6 | ASKED / question | key above, filler below right | upper-right |
| 1.2 | on my / PAGE | filler above, key below | upper-centre |
| 1.8 | is how I make / THIS | filler above, key below | upper-centre |
| 2.4 | CAPTIONS | single key word | upper-right |
| 3.4 | I have been / trying to | two small lines, no key | centre (wide shot, on desk) |
| 4.3 | find a simple | single small-medium line | centre |
| 4.8 | way to | medium | centre |
| 5.2 | break it / DOWN | filler above, key below, overlapping lines | right |
| 6.3 | how do I / TELL / YOU | filler, then 2 key lines | cabinet front |
| 7.3 | I use / AFTER EFFECTS | small, then medium two-line | cabinet front |
| 8.0 | JUST / for this | key above, filler below | cabinet front |
| 10–17 | or that / YOU NEED · PLUGIN / called · ANIMATION / composer · just to add · BLUR · how do I / MAKE · all that / SOUND · SIMPLE | | wall beside the subject |

## 2. Typography
- Heavy neo-grotesque display sans. Signs: single-storey look at heavy weight, round bowls, tall `t`, short descenders, very tight spacing.
  The closest match is Helvetica Now Display Bold or ExtraBold. Neue Haas Grotesk Display 75 is also close.
- Free and local: Inter Display ExtraBold (installed here at `/usr/share/fonts/opentype/inter/`), Archivo Black, Manrope ExtraBold.
- Lowercase only. No punctuation. The pronoun "I" stays capital (seen: "how do I", "is how I make").
- Sizes at 720 px width: key ≈ 110–130 px cap-to-baseline font size (0.15–0.18 W); filler ≈ 45–55 px (0.06–0.075 W).
  Ratio about 2.2–2.6. There are a few mid-size words ("after effects", "way to") at about 0.10 W.
- Tracking about −30/1000 em. Leading: line boxes touch or overlap slightly ("break it" over "down" overlaps by ~10% of the small size).

## 3. Colour and blend
- Fill #FFFFFF, Blending Mode **Overlay**, layer opacity 100%.
- Result: over the teal wall the text reads pale cyan, over warm tungsten walls it reads cream or yellow ("simple" turns saturated yellow),
  and over near-black clothing it almost disappears. This colour pick-up IS the style, so don't "fix" it with a solid colour unless the area is too dark.
- Overlay formula (base b, blend s = 1): `b < 0.5 ? 2b : 1` per channel. Soft Light is a gentler alternative for bright footage.

## 4. Motion (Animation Composer 3 presets, 30 fps)
**In: `Fade Cubic In`**
- opacity 0 → 100, 8 frames, easing cubic-out: `o(t) = 1 − (1 − t)^3`
- no position, scale or blur
- seen in strips: frame 1 ≈ 30%, frame 3 ≈ 70%, full at about frame 6–8

**Out: `Gaussian Blur & Fade Eased`**
- blur 0 → ~35 px at 1080 width (≈ 23 px at 720), opacity 100 → 0, 10 frames
- easing: blur builds fast (ease-out, `b(t) = 1 − (1 − t)^2`), while opacity holds then drops (ease-in, `o(t) = 1 − t^2`).
  So blur is visibly soft by frame 3, the word is a soft cloud by frame 6, and it's gone by frame 10.
- blur is isotropic (both directions), repeat edge pixels off (the glyph edges spread)

**Overlap and stagger**
- Chunk N+1 begins its In while chunk N is in its Out. Measured overlap is 3–5 frames, so 4 is the default.
- Inside a chunk the first-spoken line appears first; the second line follows 3–6 frames later on the next word's onset.
- No chunk is held after the speech ends beyond ~6 frames, except the last chunk before a pause (hold until the next cut or 0.5 s).

## 5. Chunking rules (speech → chunks)
1. Split speech into phrases at pauses ≥ 120 ms and at punctuation.
2. Inside a phrase, find **key words**: content words carrying stress (nouns, main verbs, adjectives with emphasis, numbers, names, the
   punchline word). One key per chunk.
3. Attach 1–3 function words to the nearest key (preceding ones go above, following ones go below): "on my / PAGE", "ONE / of the most".
4. A run of ≥ 3 function words with no key becomes its own small chunk ("is how I make", "I have been / trying to").
5. Target 0.4–1.0 s per chunk. Split anything above 1.3 s, and merge anything below 0.25 s into a neighbour.
6. Two-word key ideas ("after effects", "tell you", "you need") can be two key lines, sized at about 0.6× key size each.

## 6. Placement guide
- Look for the largest mid-tone, low-detail area: walls, doors, cabinet fronts, curtains. Avoid faces, hands doing the action, and pure black.
- Close shot with the subject low in frame: upper third, aligned away from the bright practical light.
- Wide shot with the subject to one side: the opposite half, at the vertical centre of an object (cabinet or desk front).
- Standing subject: the wall beside the head/shoulders, partly overlapping the body is fine.
- Keep one anchor (`x, y, align`) for all chunks in a shot. Vary only the stack order. Re-anchor on every cut.
- Safe area for Reels/Shorts: y between 0.08 and 0.78, x ≤ 0.88 on the right edge.

## 7. Footage that suits it
Darker, moody, low-contrast B-roll with coloured practicals (teal/orange), slow or locked-off camera, cuts every 2–4 s.
On bright, busy footage, use `soft_light`, or `normal` at 0.9 opacity, and pick plainer areas.
