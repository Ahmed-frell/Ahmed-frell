# Blue Zone Habitat reel: change log

## WhatsApp version of V3 (2026-11-09)
- `output/bluezone-v3-whatsapp.mp4`: **4.72 MB** (under 5 MB) for WhatsApp bulk sending. Made from the V3 master; no content changes.
- 540×960, 30 fps, H.264 High (two-pass, 320 kbps); AAC mono 48 kbps, 44.1 kHz, −15.3 LUFS, peak −0.9 dBFS (limited to avoid clipping).
- 540×960 chosen over 720×1280 at the same size: higher fidelity to the master (SSIM 0.923 vs 0.913), fewer compression blocks.
  Subtitles, name card and phone number checked for legibility. Voice sync 0.0 ms.

## Draft V3 (2026-11-07): rendered — `output/bluezone-draft-v3.mp4` (preview approved by client; QC PASS)
- **Client corrections:** (1) the research line now names Dr. Sahid Cholayil (founder, 3G IRPS) and longevity science;
  (2) the villa line now says Blue Zone Habitat is a residential project within a township in the heart of Malappuram.
- **Transcript v4** (`approved-transcript-v4.md`, locked; lines 4, 8 and 9 changed vs v3; v2 and v3 kept, marked superseded).
- **New voiceover supplied by the client:** `audio/original/v4/bluezone_v4_elevenlabs.mp3`, 96.84 s, **AI-generated** (ElevenLabs "Roger"),
  used as supplied (loudness only). Measured 26 speech segments → 22 lines (lines 2, 4 and 8 have internal pauses).
- **Length:** 100.0 s (set by the new recording).
- **Timeline:** V2 scenes follow the new voice through a line-anchored time map (`render/src/data/timemap_v3.json`).
  New or re-timed scenes (V3 times):
  - S04a IIT Madras / 3G IRPS (blueprint)
  - **S04b1** "Dr. Sahid Cholayil · Founder, 3G IRPS" name card on "Dr. Sahid" (18.17 s) + "Research-driven vision" (walkthrough 130.2 s arbour garden)
  - **S04b2** "Based on Longevity science" (22.44 s) + "A movement for Malappuram" (walkthrough 139.5 s amphitheatre with residents)
  - **S08a** township aerial (walkthrough 186.0–194.1 s) with "Heart of Malappuram · Anakkayam · Manjeri" and a card
    "Part of a planned township · Residential project" on "ടൗൺഷിപ്പിന്റെ" (42.1 s)
  - S08b 51 counter lands on "51" (45.58 s); S09 BHK panels on "three / four / five" (48.43 / 48.8 / 49.3 s)
  - S19 now uses the clubhouse roof (clubhouse 56.2 s), because the aerial moved to the township scene
- Subtitles rebuilt from the new voice (47 chunks; "threeG" → "3G", "three, four, five" → "3, 4, 5" for readability).
- Score regenerated for the new timing; voice 16.8 dB above the music; mix −13.6 LUFS.
- On-screen wording is kept factual: "Part of a planned township" (the voiceover says ലോകോത്തര നിലവാരമുള്ള), and "Longevity science" with no health promise.

## Draft V2 (2026-11-06): first rendered draft
- **New creative direction** (client brief 2026-11-06): Mission Malappuram 2050 → 3G IRPS vision → Blue Zone Habitat →
  51 villas → Gen Z / Gen Alpha → work-from-home, nature-first design, ~43% planned open space, gardens, clubhouse → brand reveal + CTA.
- Script: `approved-transcript-v2.md` (locked). Voice: `audio/original/v2/bluezone_2.mp3` (89.81 s, unchanged; light cleanup + loudness only).
- Length set by the recording: **92.7 s**. The voice is not sped up.
- Frame rate **30 fps**, matching the 30 fps source renders (24 fps would drop every 5th frame and cause judder).
- Footage: all from the client's Drive (`footage-inventory.md`). The presenter clips (`amal_*.mov`) are excluded because they are a different audio take, so lip-sync would not match.
- Music: original score composed in code for this reel (no third-party licence needed), ducked under the voice.
- Contact on the end card: **+91 73565 23534** (confirmed by client, 2026-11-06). The draft tag was removed.
- Polish before delivery: 51-villa plan resized to clear two-line subtitles; logo glides into the end-card position (no double logo during the crossfade).
- QC: `output/qc-report-v2.md` (all automated checks PASS; VO sync error 0.0 ms; −13.4 LUFS).
- There was no V1 render: the project moved to the V2 direction before production. The V1 script is kept in `approved-transcript.md` (superseded).
