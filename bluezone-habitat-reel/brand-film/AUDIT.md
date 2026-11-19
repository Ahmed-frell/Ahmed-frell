# Bluezone Habitat 90-s brand film: Phase 1 audit (2026-11-19)

Status: **audit complete; production blocked on 4 inputs (section 5).** No film has been rendered.

## 1. Reference: OKE Builders film (Drive 11ZLo…)
Verified: 1276×718 (16:9, not vertical), 30 fps, 32.83 s, H.264 + AAC. 20 cuts (avg 1.6 s).

| Time | Beat | Notes |
|---|---|---|
| 0–2 | Hook: Kerala landscape at dawn, bold title "MALAPPURAM IS GROWING" | Text baked over aerial |
| 2–6 | Growth montage: town road, cranes, skyline at sunrise | "Dreams are growing / the future is calling…" |
| 6–14 | Family on sofa looking at a house on a tablet; close-ups of mother, child | Emotional core, 8 s, AI-generated people |
| 14–17 | Architect drawing at a desk, pen on plan | Transition to "building" |
| 17–20 | Toy-like villa layout, aerial whip | "thoughtfully planned communities" |
| 20–24 | Family walking in a park at golden hour; township at blue hour | "A new approach. A better way of living" |
| 24–29 | Founder walking through wireframe villas, logo build | Brand moment |
| 29–33 | Purple end card: logo, "Building the next chapter", "Coming soon" | |
Tone: hope → family → planning → community → brand. Small serif subtitles at the bottom; warm sunrise grade; soft cinematic score.
Take from it: emotional order, sunrise warmth, slow pacing in the family section. Do not copy: shots, wording, purple end card, founder walk.

## 2. Tools (checked, nothing exposed)
| Capability | Status |
|---|---|
| FFmpeg / ffprobe, Python 3, Node 22, Remotion 4.0.242 | Installed and working (used for the last four reels) |
| Fonts | Montserrat, Noto Sans/Serif Malayalam, Manjari installed. **Bodoni Moda not installed**; `@fontsource/bodoni-moda` (SIL OFL) can be installed from npm. Malayalam shaping via Chromium/HarfBuzz is verified from earlier reels |
| ElevenLabs connector (voice, music, transcription) | **Signed out**: the reconnect attempt this session was refused. Needs sign-in in claude.ai connector settings |
| AI video generation | **None available.** ElevenLabs refused video on the free plan twice (no charge). No other video API is connected |
| Licensed stock footage (Pexels, Pixabay) | **Blocked** by this environment's network policy |
| Offline Malayalam TTS (AI4Bharat) | Installed, but you rejected its quality earlier, so I won't use it for the final |
| GitHub push | Still blocked (needs GitHub reconnect) |

## 3. Verified facts (project knowledge base 2026-11-05, brochure PDF)
- 51 villas: Neura (20, 3 BHK), Quantra (15, 4 BHK), Aurexa (11, 4 BHK), Lynora (5, 5 BHK); Anakkayam (Pulliyilangadi), near Manjeri.
- 43% open/green space is the current marketing figure (a storyboard uses 42.6%); label it *planned*.
- **Garden Ethen** (calm, healing-inspired, contains the Zen Garden) and **Garden Elara** (children and family activity garden): both names verified. Planned.
- Clubhouse: website name **EVOLURA**; spelling still unconfirmed, so it isn't named on screen.
- Website bluezonehabitat.com and +91 73565 23534: observed on the live site (Nov 2026).
- Avoid: "Kerala's first Blue Zone…" (brochure headline, an unverified ranking); "second largest clubhouse" (unverified); 30% energy saving (unverified); dates; health/longevity promises.

## 4. Asset manifest (actual files; brochure pages rendered at 150 dpi in `media/brochure/`)
| Scene | Need | Verified asset | Gap |
|---|---|---|---|
| 01 Malappuram growth, drone | Real aerial | Brochure p05 Manjeri aerial (small); 783×400 brochure aerial; river-town screenshot (location unconfirmed) | **No usable full-HD real aerial. Needs AI clip or licensed drone footage** |
| 02 Kerala urban progress | Licensed footage | none | **No licensed footage reachable** |
| 03 Family looking at a home image | People | none (must not fake as real) | **AI clip required** |
| 04 Elevation → render reveal | Elevation drawing + render | No elevation drawings in the package. Available: Aurexa floor plan (p29) + Aurexa render (r03/r04); Neura, Quantra and Lynora plans and renders (p25–31) | Elevation drawings missing; plan-to-render reveal possible with genuine files |
| 05 Master plan, entrance, 51 villas | Plan + entrance | Master plan PNG 4357×3375; p11 master-plan overview; p12 Grand Entrance render; walkthrough aerials | OK |
| 06 Garden Ethen / Elara | Garden designs | p18 "Garden Experiences" (Ethen + Elara), p19 outdoor amenities, r01 zen garden | OK (brochure images ~1500 px, enough for slow moves) |
| 07 Clubhouse, work-from-nature | Approved clubhouse visuals | p16 clubhouse exterior, p17 interior, p22 work-from-nature office, clubhouse walkthrough video, office render | OK |
| 08 Family in landscape | People | none | **AI clip required** |
| 09 Hero render + logo | Hero + logo | r03/r04 Aurexa hero renders; official logo PNG (green), logo JPEG | OK |

## 5. What blocks the full film
1. **The voiceover script.** The brief says "use the exact full timed voiceover provided in the storyboard", but no nine-scene script exists anywhere in our conversation or in the three Drive folders (the PDF is the sales brochure). I won't invent a script and present it as yours. Send the script (or approve the draft I can write).
2. **Voice.** ElevenLabs needs sign-in again. Then I generate one clip per scene with JIJO (or a voice you pick), or you generate the nine clips and upload them as before.
3. **Three AI clips (scenes 01, 03, 08).** No video generation is available here. Generate them externally (prompts in section 6) at 9:16, 1080×1920, 10 s each, no text or logos, and upload.
4. **Scene 02 footage.** Stock sites are blocked here. Either upload licensed clips (Kerala town growth, construction, skyline) or I replace scene 02 with genuine project material (walkthrough aerials + master plan growth graphic).
Also needed: confirm the website, and whether a plan-to-render reveal is acceptable for scene 04 (no elevation drawings exist in the package).

## 6. Prompts for the three external AI clips (9:16, 10 s, photoreal, no text/logos/watermarks)
**01 (0–10 s):** Slow cinematic drone push at sunrise over green Malappuram hills and coconut palms; mist in the valleys; a growing small Kerala town with low-rise buildings and new construction in the distance; warm golden light; steady stabilised flight; natural colours; no text.
**03 (20–30 s):** Warm, genuine Kerala Muslim/Malayali family in a softly lit living room: father, mother (in a light dupatta) and a 7-year-old child sitting close on a sofa, looking at a modern white villa on a tablet; the child points and smiles, the parents exchange a hopeful look; natural skin tones, shallow depth of field, slow push-in; the tablet image is a generic modern villa, not readable; no text.
**08 (70–80 s):** The same family walking and laughing along a landscaped garden path at golden hour; lush tropical planting, a lawn, a child running ahead; slow tracking shot from the side; warm backlight; natural, unhurried motion; no buildings in sharp focus (avoids inventing architecture); no text.
