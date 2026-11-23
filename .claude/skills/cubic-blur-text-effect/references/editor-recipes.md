# Editor recipes: Cubic Blur Text Effect

All timings at 30 fps. At 24 fps use In 6 f / Out 8 f / overlap 3 f. At 60 fps double them.

## After Effects + Animation Composer 3 (exact reference method)
1. Composition at the footage size and fps. Drop the clip in.
2. Text: one text layer per chunk line (or per chunk with a line break and per-line font sizes). Font Helvetica Now Display Bold
   (or Inter Display ExtraBold), white, tracking −30, leading tight, lowercase.
3. Trim each layer to its spoken words: in-point on the first syllable, out-point at the end of the chunk plus overlap.
   Shortcut: `Alt+[` / `Alt+]`.
4. Open Window › Animation Composer 3 › Browse › Starter Presets › Transitions – 2D Layer.
   - Select all text layers, click **Fade Cubic In**, then **Animate: In**.
   - Click **Gaussian Blur & Fade Eased**, then **Animate: Out**.
   - The Edit tab shows `In: Fade Cubic In` and `Out: Gaussian Blur & Fade Eased`. Adjust durations there (8 f in / 10 f out) or by dragging the
     In/Out markers on the layer bar.
5. With all text layers selected: Layer › Blending Mode › **Overlay** (or press `Shift+=` until it reads Overlay).
6. Size the key words up (≈ 2.4× filler) and arrange the stacks in empty space.
7. Stagger the layers so the next chunk's in-point is 4 frames before the previous layer's out-animation starts.

## After Effects without the plugin
Run `scripts/cubic_blur_ae.jsx` (File › Scripts › Run Script File…) with the text layers selected. Per layer it:
- sets Overlay blend
- adds opacity keys: in-point 0 → +8 f 100 (cubic ease-out: out-influence 85%, in-influence 15%), and out-point −10 f 100 → out-point 0
- adds a Gaussian Blur (Repeat Edge Pixels off) keyed 0 → 35 × (comp width / 1080) over the last 10 frames, ease-in (in-influence 85%)

Manual equivalent: the same keys with Graph Editor › speed graph shaped like a cubic. Ease-out on the fade-in, ease-in on the fade-out.

## Premiere Pro
1. Essential Graphics text per chunk, same font settings. Stack layers on V2+, staggered with a 4-frame overlap.
2. Effect Controls › Opacity: keyframe 0 → 100 over 8 f; right-click › Temporal Interpolation › Ease Out, then pull the speed handle to about 85%.
3. Add **Gaussian Blur** (Blurriness 0 → 35, Repeat Edge Pixels off) and opacity 100 → 0 over the last 10 f, Ease In.
4. Opacity › Blend Mode › **Overlay**.
5. Save as a preset ("Cubic Blur Caption") and drop it onto every text clip; adjust key positions for each clip length.

## CapCut (desktop / mobile)
1. Text › add text per chunk. Font: closest heavy grotesque (CapCut "Helvetica Bold" / "Inter Bold" / "Montserrat ExtraBold"). Lowercase,
   letter spacing −1 to −2, line spacing minimum.
2. Animation › In: **Fade in** (0.3 s). Animation › Out: **Blur** or **Fade out + blur** (0.3–0.4 s).
   If your version has no blur-out, keyframe opacity 100 → 0 and use Effects › Blur on an adjustment of that text, keyed 0 → 35.
3. Text › Blend (or Overlay mode in the layer's blend menu): **Overlay**.
4. Put each chunk on its own text track and overlap clips by about 4 frames (0.13 s).
5. Use Auto captions to get timings, then split each auto caption into chunks by hand.

## DaVinci Resolve
- Fusion Text+ per chunk. Opacity spline 0 → 1 over 8 f (select keys, `Shift+S` then reshape to ease-out). A Blur node keyed 0 → 35
  over the last 10 f. Merge node › Apply Mode **Overlay**.
- On the Edit page: Text+ clip, Composite Mode **Overlay**, plus the Inspector opacity keys and the Gaussian Blur Open-FX keys.
