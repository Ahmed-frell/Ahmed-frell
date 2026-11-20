# Bluezone Habitat · 90-s brand film · edit-ready version (v1)

**Status:** full 90.00-s timeline built and exported with genuine project visuals, a DRAFT script, a TEMPORARY guide voice and three clearly tagged stand-in shots.
Not final until: (1) the script is approved, (2) the guide voice is replaced by the final narration, (3) AI clips 01, 03, 08 are supplied.

## Why it isn't final
- No nine-scene voiceover script was supplied; the script below is my draft.
- ElevenLabs is signed out, so the guide voice is offline AI4Bharat Indic-TTS (MIT licence), used only to set timing.
- No video generation is available here (ElevenLabs refused video on the free plan); stock sites are blocked.

## Draft script (Malayalam-English, one line per 10-s scene)
| Scene | Line |
|---|---|
| 01 | മലപ്പുറം വളരുകയാണ്. പുതിയ സ്വപ്നങ്ങളും, പുതിയ സാധ്യതകളുമായി. |
| 02 | Every city grows. പക്ഷേ, നമ്മുടെ കുടുംബം ജീവിക്കുന്ന ഇടം എങ്ങനെയായിരിക്കണം? |
| 03 | ഓരോ കുടുംബത്തിന്റെയും സ്വപ്നം ഒന്നാണ്. ആരോഗ്യത്തോടെ, ഒരുമിച്ച്, സമാധാനത്തോടെ ജീവിക്കാൻ ഒരിടം. |
| 04 | Every line, carefully designed. ഓരോ വില്ലയും പ്രകൃതിയോടും വെളിച്ചത്തോടും ചേർന്ന് രൂപകൽപ്പന ചെയ്തത്. |
| 05 | ആനക്കയത്ത്, 51 പ്രീമിയം വില്ലകൾ. 43% പ്ലാൻ ചെയ്ത ഓപ്പൺ ഗ്രീൻ സ്പേസ്. |
| 06 | Garden Ethen-ലെ ശാന്തത. Garden Elara-യിലെ കുട്ടികളുടെ ചിരി. |
| 07 | പ്ലാൻ ചെയ്ത ക്ലബ്ഹൗസ്. പ്രകൃതിയോട് ചേർന്ന work-from-nature office. |
| 08 | Where peace meets luxury. നിങ്ങൾക്കും, നിങ്ങളുടെ കുടുംബത്തിനും. |
| 09 | Bluezone Habitat. Live Better. Live Longer. |
For ElevenLabs, English words are written in Malayalam script in `work/vo/tts_scenes.json`. Record one clip per scene; each line is 5–8.5 s.

## Shot manifest (`timeline.json` is the source of truth)
| Time | Scene | Visual (verified source) | Treatment |
|---|---|---|---|
| 0–10 | 01 | Manjeri aerial photo (brochure) — **STAND-IN for AI clip 01** | Framed card, slow push |
| 10–20 | 02 | Walkthrough_1.mp4 175–185 s, genuine project aerial animation (replaces stock footage) | 9:16 crop, real motion |
| 20–30 | 03 | r11 living-room render — **STAND-IN for AI clip 03** | Push-in |
| 30–40 | 04 | Aurexa floor plans (brochure p29) → Aurexa render r04 | Card, diagonal wipe reveal at 34.4 s, push |
| 40–43.6 | 05 | Grand Entrance render (brochure p12) | Card |
| 43.6–50 | 05 | Master plan (Drive master_plan.png, villa area) | Push, "51 Premium Villas / 43% planned open & green" |
| 50–55 | 06 | Garden Elara + Garden Ethen visual (brochure p18) | Card |
| 55–60 | 06 | r01 zen garden render (Zen Garden is inside Garden Ethen) | Push |
| 60–66.4 | 07 | Clubhouse exterior (p16), clubhouse interior/library (p17) | Cards |
| 66.4–70 | 07 | Clubhouse.mp4 32.65–36.4 s office (work-from-nature) | 9:16 crop, real motion |
| 70–80 | 08 | r08 villa street — **STAND-IN for AI clip 08** | Push |
| 80–85.6 | 09 | r03 Aurexa hero render | Push |
| 85.6–90 | 09 | End card: official logo, Live Better. Live Longer., Anakkayam · Manjeri, +91 73565 23534, disclaimer | |

## AI clips to generate externally (9:16, 1080×1920, 10 s, no text, no logos)
- **01:** sunrise drone over green Malappuram hills, coconut palms, valley mist, a growing low-rise town in the distance.
- **03:** Malayali family (father, mother, child) on a sofa looking at a modern villa on a tablet; warm window light; slow push-in.
- **08:** the same family walking along a landscaped garden path at golden hour; child running ahead; slow side tracking.
Drop them into `work/clips/` as `ai01.mp4`, `ai03.mp4`, `ai08.mp4`, change those three shots in `timeline.json` to `"type": "video"`, and re-run the build (section "Rebuild").

## Licences
| Element | Licence |
|---|---|
| Renders, brochure, master plan, walkthrough/clubhouse videos, logo | Client-owned project assets |
| Music + SFX | Original, synthesised in code (`presenter-reel/tools/compose_score.py`, `sfx_library.py`), no third-party audio |
| Guide voice | AI4Bharat Indic-TTS, MIT licence (temporary) |
| Fonts | Bodoni Moda, Montserrat, Noto Sans Malayalam: SIL Open Font License 1.1 |

## Rebuild
```
python3 tools/brand_bg.py timeline.json work/img work/clips work/bg_raw.mp4
(grade) → render/public/bg.mp4 ; audio mix → render/public/mix.wav
cd render && npx remotion render BrandFilm out/raw.mp4 --concurrency 4 --crf 14
ffmpeg … range/Rec.709 conversion → output/bluezone-brand-film-v1.mp4
```

## Validation (output/bluezone-brand-film-v1-editready.mp4)
| Check | Result |
|---|---|
| Container / codecs | MP4 (faststart), H.264 High, AAC-LC 48 kHz stereo 256 kbps, 164 MB |
| Duration / frames | 90.000 s, 2,700 frames at 30 fps, 1080×1920 |
| Decode | Clean, no errors |
| Black frames | None |
| Audio silence > 1.5 s | None |
| Loudness | −14.0 LUFS integrated, peak −1.5 dBFS; voice 17.2 dB above music during speech |
| Subtitles | 18 cues, no overlaps, all within 0–90 s; text matches the narration lines exactly (guide voice reads the same script) |
| Safe areas | Hero copy y 330–630, subtitles y 1330–1450, disclaimer y 1520: clear of the Reels top bar and caption/button zone |
| Malayalam shaping | Rendered by Chromium/HarfBuzz with Noto Sans Malayalam; checked on contact sheet |
| Claims | Only 51 villas, 43% planned open/green, Garden Ethen/Elara (planned), planned clubhouse; disclaimer on every project visual |
