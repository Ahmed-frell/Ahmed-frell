# Timing rules + transition language

## Edit rhythm (from the reference)
- One visual change every **1.5–3 s**; a caption beat every **0.25–0.6 s**; a pattern interrupt (B&W snap, colour field, card, graphic) every 3–6 s.
- A new A-roll shot starts on every transcript line. Long lines are split at breaths into 1.6–3.2 s shots.
- Framing per shot: W 100 % / M 132 % / C 165 %, centred on the tracked head (`face_track.py`), plus a +4 % drift.
  A jump cut always changes framing by ≥ 0.3 zoom. Close-ups go on the hook, section headers and payoff lines.
- Hard cuts dominate. Movement transitions last **2–7 frames** and always carry an audio accent.

## Transitions (component → when → frames)
| Component | Use when | Frames | Details |
|---|---|---|---|
| `SilhouetteFlash` (X1/X4) | Opening frame; into each numbered section header | 2 f Holly silhouette + 3 f ivory glow silhouette, then cut | Needs the presenter matte at those frames; SFX `flash_hit` on frame 0 |
| B&W snap (X2) | First 0.9 s of a section header | ramp in 3 f, hold, ramp out over 0.35 s | grayscale + contrast ×1.2 |
| Punch (X3) | Header starts, opening, payoff | scale +9 % → 0 over 0.35 s | |
| `Whip` (X5) | Presenter → B-roll image entries (alternate L/R) | 5 f | translateX 100 %→0 with `CameraMotionBlur` samples 10, shutter 300°; SFX `whoosh_whip` +2 f |
| `Doors` | Architectural reveals (facades, aerials, interiors) | 7 f | centre-seam clip opening + ivory seam lines, scale 1.08→1; SFX `reveal_arch` |
| `ImageText` | Brand-name moment ("Blue Zone Habitat") | letters type on 1.5 f apart, fly-through 0.55–0.95 s | Holly plane with letter-shaped holes (SVG mask) over the render; then full frame |
| `Tear` (X6 adapted) | Plan → detail reveal (master plan → plot layout) | 12 f | jagged blueprint edge, ivory paper edges; SFX `tear` |
| Defocus + card push (X7) | Presenter → "card on a Holly field" statement | 3 f blur 0→22 px, card 110 %→100 % over 6 f | giant outline word behind the card |
| `Pip` | Supporting B-roll while the presenter keeps talking | 8 f in, 6 f out | tilted card, ivory border |
| Particles → logo (X10) | Outro | 45 f converge, logo at +35 f | SFX `riser` + `logo_signature` on the logo frame |
| 2.5D still | Any still render or photo | whole shot | two layers of the same image, foreground mask from 38–66 % height, scale difference ≤ 3.5 %; plus perspective rotateY 5°→0 for interiors |

## Picking a transition for a B-roll insert
1. Brand / name → `ImageText`. 2. Plan or data reveal → `Tear`. 3. Architecture (facade, aerial, interior) → `Doors`.
4. Fast list or montage of 3+ images → hard cuts, with the text morphing on each cut. 5. Everything else → `Whip`, alternating direction.
Never apply two movement transitions within 1.2 s.
