# Phase 1: asset verification (2026-11-11)

All five Drive folders are accessible. Every file was downloaded with HTTP 200, and the byte sizes match Drive's metadata.
Local copies are in `presenter-reel/media/` (not committed: private client media).

| Folder | Files | Verified details |
|---|---|---|
| Talking-head (`1ZAMSN3j…`) | `IMG_0035.mov` 43.5 s · `IMG_0036.mov` 23.1 s · `IMG_0037.mov` 45.0 s · `IMG_0038.mov` 10.2 s · `IMG_0043.mov` 46.4 s (**168 s total**) | iPhone HEVC 3840×2160, rotated −90° → **2160×3840 portrait**, 29.97 fps, AAC voice track (+ Apple metadata tracks). Voice level −27 to −29 LUFS (needs about +12 dB). One setup: presenter seated, mid-shot, Blue Zone Habitat poster on a white wall, soft daylight. IMG_0035 31–36 s: presenter looks away (reset/outtake). |
| Reference (`1nuw0kVr…`) | `VID_20261111_103723_016.mp4` | 33.10 s, 1080×1920, 30 fps, HEVC, AAC 44.1 kHz stereo |
| Brand assets (`11Gi76Gm…`) | `12226844141949657376.jpg.jpeg` | 500×500 Blue Zone Habitat logo (green leaf + wordmark on cream). **Only one brand file.** No font files, colour codes or logo vector were supplied |
| Additional (`1Xz0drnb…`) | 18 PNG + `Bluezone is a forward-thinking real estate (2).pdf` (36 pp, 65 MB) | 13 landscape renders (1448–1672 px wide) named "ChatGPT Image…": the brochure renders (villa streets, Quantra/Aurexa/Lynora facades, clubhouse, Zen garden, office, rooftop pool, interior). 3 portrait posters (Quantra 4 BHK, Lynora 5 BHK, combined). `file_…65b0.png` is duplicated (identical MD5). 1 amenities poster |
| Renders (`1HMWlZLq…`) | Downloaded and verified on 2026-11-06 | `walkthrough_1.mp4`, `clubhouse.mp4`, `villa_interior.mp4`, master plan, 51-plot plan |

## Notes and risks
- **"ChatGPT Image" files:** these are AI-generated or AI-enhanced renders. They match the client's brochure, so they'll be used as *Artist's impression*, never as photographs of built work.
- **Fonts:** none were supplied. Typography uses licensed open fonts already in the project: Cormorant Garamond, Montserrat, Noto Serif Malayalam, Manjari (all OFL).
- **Environment:** FFmpeg 6, Remotion 4 + Chrome headless shell, Python 3.13, Node 22, offline Whisper large-v3-turbo. **Not available:** Blender, After Effects, Premiere, Resolve, GPU. No person-segmentation model is installed yet (needed for "text behind presenter"; can be added from a public model release).
- **Transcription blocker:** offline Whisper transcribes the English reference perfectly, but **fails on the Malayalam/Manglish talking-head audio** (repeated syllables, hallucinated English). A word-level transcript cannot honestly be produced locally. See the options in the reply.
