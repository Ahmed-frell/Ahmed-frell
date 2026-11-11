# Reference reel: frame-accurate motion, typography, transition and SFX analysis

Source: `media/reference/reference.mp4` (30 fps). Measured from 30 fps strips in `analysis/reference_strips/`
(frame numbers are absolute; frame / 30 = seconds). "f" = frames.

## A. Text animation map
| # | Frames (time) | Text | Unit | Entrance | Duration | Exit | Layering | Sync |
|---|---|---|---|---|---|---|---|---|
| T1 | 6–9 (0.20–0.30) | "I'm" | word | pop-on (2 f fade + scale 0.9→1) | 2–3 f | cut at shot change | in front | speech onset |
| T2 | 7–15 (0.23–0.50) | "gonna hold" | **letter** | typewriter, 1 letter / 1–2 f, each letter fades 2 f | 6–8 f | holds, stacks | in front | syllables |
| T3 | 13–23 (0.43–0.77) | "your hand" | word on a **rotated baseline** (~−40°) | slides along its baseline from off-axis, motion-blurred | 4–6 f | stays as a cluster | in front | word onset |
| T4 | 21–26 (0.70–0.87) | "when" | word, vertical (90°) | slides up along the vertical path | 5 f | n/a | in front | word onset |
| T5 | 30–33 (1.00–1.10) | "say" | word, rotated 180° | slide-in from the left with blur | 4 f | n/a | over B&W | on the B&W snap |
| T6 | 37–54 (1.23–1.80) | "this" | word + **marker scribble** | word pops 2 f; red marker strokes draw over it | 10–17 f | strike line wipes left→right (6 f) | in front | stressed word |
| T7 | 60–80 (2.0–2.7) | "nobody cares about your logo" | cluster | words pop 2–3 f, **corner brackets** animate around "logo" (6 f) | — | cut | in front | word onsets |
| T8 | 139–152 (4.63–5.07) | "Companies spend" | letters on an **arc path** | typewriter along the arc, about 1 letter / 1.3 f | 13 f | n/a | in front | phrase |
| T9 | 171–181 (5.70–6.03) | "ten grand" | letters | "ten" typewriter (4 f); "grand" letters fly in individually from the right with blur, staggered 1 f | 10 f | compresses up (6 f) at the tear | over a colour field | word onset |
| T10 | 400–416 (13.33–13.87) | "and that people" | script letters + **highlight box** | script "writes" (4 f); white box wipes L→R (5 f); "people" knocked out of the box | 16 f | cut | over the 3D card | word onsets |
| T11 | 620–637 (20.67–21.23) | "We turn what" | giant word + vertical words | "We": scale 0.3→1.08→1 with blur (3 f, overshoot); "turn" slides along the vertical; "what" fades up per letter (3 f) | 3–6 f | n/a | in front | word onsets |
| Rule | | | | 1–3 words on screen; a new beat every 0.25–0.6 s; one emphasis word per beat in the accent colour/weight; script for one soft word per sentence | | | | |

## B. Transition map
| # | Frames | From → to | Technique | Duration | Easing | Audio |
|---|---|---|---|---|---|---|
| X1 | 0–6 | (open) → presenter | **Subject silhouette filled with brand colour** (2 f) → **white glowing silhouette** (4 f) → hard cut | 6 f | stepped | hit at f1 |
| X2 | 29–31 | colour → B&W, same shot | saturation 1→0 + brightness −15 % | 3 f | linear | n/a |
| X3 | 55 | B&W wide → colour close-up | hard cut + shallow-focus close-up (punch-in) | 0 f | — | n/a |
| X4 | 132–137 | sticker graphic → wide shot | **red silhouette fill (2 f) → white silhouette (1 f)** → cut | 5 f | stepped | whoosh 4.50 s (f135) |
| X5 | 168–171 | wide → red field | **whip** with heavy horizontal motion blur, image streaks out | 2–3 f | ease-in | whoosh/hit 5.09 s |
| X6 | 178–190 | red field → money image | **paper-tear** edge appears (f178), tears open (f184–190) | 12 f | ease-out | tear SFX |
| X7 | 393–398 | presenter → presenter-in-card | **defocus** blur ramp (2 f) → card frame pushes in from 110 % to 100 % | 5 f | ease-out | n/a |
| X8 | 617–620 | cluster → wide | blur cut (2 f) then the giant word scales in | 3 f | ease-out-back | hit 20.46 s |
| X9 | 690–720 | presenter → neon logo shot | cut; neon logo glow pulses in (8 f) | — | — | n/a |
| X10 | 720–800 | → black | light particles drift and **converge into the logo**, short glitch | about 60 f | ease-in-out | swell + sting 29.44 s |
| Rule | | | Hard cuts dominate. Movement transitions are **2–5 frames** with strong motion blur. Every transition coincides with an audio accent. | | | |

## C. Sound effects (measured transients) → role
0.03 (open hit) · 4.50 (whoosh, silhouette transition) · 5.09 (whip hit) · 7.26 / 7.81 / 8.40 (pops on the collage tiles) ·
9.74 (cut to B-roll) · 11.39 / 11.71 / 12.16 (word accents on "real", "deliver") · 17.89 (impact on "PROOF") ·
19.30 (accent) · 20.46 / 20.94 / 21.62 (blur cut, giant "We", word slide) · 29.44 / 29.78 (logo sting).
**Pattern:** about 1 SFX per 1.5–2 s, placed on (a) transitions, (b) the single emphasis word of a beat, (c) graphic pops.
Never on every word. Voice always dominant.

## D. Applied to Blue Zone Habitat (what was rebuilt)
| Reference technique | Blue Zone use (time in our reel) | Component |
|---|---|---|
| X1 silhouette open | 0.00–0.20: Holly-filled silhouette (2 f) → ivory glow silhouette (4 f) → cut | `SilhouetteFlash` |
| X4 silhouette transition | Into each USP header (9.86, 45.43, 87.13) | `SilhouetteFlash` |
| X2 B&W snap | On each USP header (3 f ramp) | A-roll filter ramp |
| X5 whip + motion blur | Presenter → B-roll entries (alternating directions) | `Whip` (multi-sample motion blur) |
| X6 paper tear | → **architectural blueprint tear**: the master-plan card tears open to the 51-plot layout | `TearReveal` |
| X7 defocus + card push | Into the "USP" card (43.98) | `DefocusIn` + card |
| T2/T8/T9 letter typewriter / fly-in | Headlines (USP titles, labels) letter-staggered 1 f | `TextFx` entrance `type` / `fly` |
| T3/T4/T5 rotated baselines | Selected English emphasis words slide along a rotated/vertical path | caption layout `vertical` / `angled` |
| T6/T7 marker / brackets | Pistachio marker ellipse / architectural corner brackets on key words | `Marker`, `Brackets` |
| T10 highlight box | Holly box wipes L→R and the word appears knocked out in ivory | entrance `box` |
| T11 giant word overshoot | Giant 01/02/03 and "3" behind the presenter (scale 0.3→1.08→1, 3 f) | `Giant` |
| Image through text | "BLUE ZONE" lettering filled with the gate render, which then expands to full frame | `ImageText` |
| X10 particles → logo | Outro | `Outro` |
