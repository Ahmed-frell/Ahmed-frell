# BLUEZONE HABITAT · Cinematic architecture reel · Storyboard v1 (for approval)

28 s · 9:16 · 1080×1920 (4K-vertical upscale option) · 30 fps. Image-to-video from the client's own renders only.

## 1. Reference analysis: NOT DONE YET
The reference reel (instagram.com/reel/Df1uFhwtnUx) cannot be opened from this environment: Instagram is blocked by the network.
The Drive folder has no copy of it. The screenshot in that folder (`Screenshot 2026-11-17 at 10.36.40 PM.png`) is an aerial of a
Kerala river town, not a frame of the reel. **Please upload the reel as an MP4 to the Drive folder.** I will then measure its cuts,
camera moves, speed ramps, grade and music sync, and revise this storyboard to match before generating anything.

Until then the plan below follows standard luxury-architecture film grammar: slow stabilised moves, 2.2–3.5 s shots, cuts on the beat,
one speed-ramp transition per section, warm highlights with clean neutral whites.

## 2. Asset check (renders in folder 11Gi76…, same 11 renders used in earlier reels)
| Asset | Content | Use |
|---|---|---|
| r03 | Signature curved villa, wet driveway, warm interior glow | **Hero / opening** |
| r04 | Same villa, daylight | Not used (duplicate design of r03) |
| r06 | Curved-glass villa (second type) | Showcase |
| r02 | Dusk villa street, car | Showcase, low angle |
| r07 | Sculpture roundabout | Community |
| r01 | Zen garden wall, Buddha, gravel | Landscape |
| r08 | Tree-lined villa street | Environment |
| r05 | Clubhouse reception | Lifestyle (clubhouse) |
| r11 | Living room with two women | Lifestyle (risk: people animate badly; alternative r05 only) |
| r09 | Dusk aerial, roofs with solar panels, tower | **Final reveal** |
| r10 | Villa street at night | Behind the brand card |
| Logo | Green leaf + BLUE ZONE HABITAT on #F5F3E6 | End card |

Frames are crops of the original renders (no outpainting), so no architecture is invented to fill the vertical frame.
See `analysis/storyboard-frames.jpg` for each shot's start frame.

## 3. Shot list
| # | Time | Render | Move | Why |
|---|---|---|---|---|
| 1 | 0.0–3.5 | r03 | Low dolly-in toward the entrance, wet-paver reflections, slight rise | Strongest image, immediate scale |
| 2 | 3.5–6.0 | r06 | Lateral track left→right across the curved glass facade | Second villa type |
| 3 | 6.0–8.5 | r02 | Low-angle push down the dusk street past the car | Depth, evening mood |
| 4 | 8.5–11.0 | r07 | Slow orbit right around the sculpture (≤10°) | Community centre |
| 5 | 11.0–13.5 | r01 | Push-in through the foreground fence toward the Buddha garden | Calm, wellness |
| 6 | 13.5–16.0 | r08 | Forward walk-through dolly under the trees | Green streets |
| 7 | 16.0–18.5 | r05 | Slow lateral glide past the reception desk | Clubhouse |
| 8 | 18.5–21.0 | r11 | Gentle push-in, people almost still | Living |
| 9 | 21.0–25.5 | r09 | Drone rise and pull-back over the dusk community | Final reveal |
| 10 | 25.5–28.0 | r10 + logo | Slow push behind a soft blur, then the logo card | Brand ending |

Transitions: hard cuts on the beat; one speed-ramp whip at 8.5 s (into the community section) and at 21.0 s (into the aerial);
a 12-frame dissolve into the brand card. Text only on the end card.

## 4. Image-to-video prompts (one per shot; model: Kling 3.0 Pro or Veo 3.1, 9:16, 1080p, 5 s, audio off)
Shared suffix on every prompt:
> Keep the building exactly as in the image: same shape, proportions, roof, windows, doors, balconies, materials and landscaping.
> No new structures, no morphing, walls and roofs perfectly rigid. Stabilised professional camera, realistic lens, natural motion blur.
> Photorealistic architectural cinematography, warm highlights, clean white facade, rich but natural contrast, subtle film grain.

1. Slow low-angle dolly forward toward the villa entrance, camera rising slightly; reflections on the wet driveway shift naturally; interior lights glow steadily; leaves move gently in a light breeze.
2. Smooth lateral tracking shot from left to right along the curved glass facade at constant speed; parallax between the front plants and the building.
3. Low-angle forward push along the dusk street past the parked car; street lamps steady; clouds drift slowly.
4. Slow orbit to the right around the sculpture in the roundabout, about ten degrees; the villas behind keep their shape; soft sunlight.
5. Gentle push-in over the wooden fence toward the zen garden and Buddha statue; ivy sways slightly; a small lamp flickers softly.
6. Slow forward walking-dolly down the tree-lined street; leaves sway; dappled light moves on the road; no people, no cars moving.
7. Slow lateral glide past the curved reception desk; pendant lights steady; polished floor reflections shift with the camera.
8. Very slow push-in toward the living room; the two women stay seated with only subtle natural movement; curtains move slightly.
9. Drone rising and pulling back over the community at dusk; house lights on; rooftops and solar panels stay exactly as shown; distant city lights twinkle.
10. Very slow push along the night street; lamps steady; calm.

## 5. Editing timeline and specs
- **Music:** original instrumental generated for the edit (ElevenLabs Music, licensed to you), 28 s, warm ambient piano and strings with a low pulse at 96 BPM. Cuts land on beats (one bar = 2.5 s); a lift at 21.0 s for the aerial.
- **SFX:** soft whooshes on the two speed ramps, a low swell into the aerial, a gentle chime on the logo.
- **Grade:** match the reference once measured. Default: neutral whites, warm highlights (+3 % orange in highlights only), lifted blacks 2 %, soft highlight roll-off, grain 3 %, light vignette. No green cast; green only in the logo.
- **End card (25.5–28.0):** ivory #F5F3E6 field, official logo, then
  `Live Better. Live Longer.` · `Anakkayam, Manjeri` · `+91 73565 23534`. Small "Artist's impression" tag on all render shots.
- **Export:** H.264 High, 1080×1920, 30 fps, 16 Mbps, AAC 320k, Rec.709; optional 2160×3840 upscale (Topaz) and a < 5 MB WhatsApp version.

## 6. QC plan for every generated clip
Compare the first, middle and last frame against the source render: rooflines, window counts, door positions, balcony edges.
Reject any clip with morphing, flicker in foliage, moving walls or new objects; regenerate or fall back to a stabilised 2.5D move
from the same render. Generation cost and credits will be confirmed before the run.
