# Sound design list

All audio is original or the client's voice; no third-party music or sound effects.

| Element | Source | Placement |
|---|---|---|
| Dialogue | Client takes IMG_0035/36/37/43, high-pass 80 Hz, de-noise, presence EQ +2 dB @3.2 kHz, compression 2.2:1, loudness −16 LUFS, 6 ms fades on every cut | Whole reel |
| Score | `tools/compose_score.py` (original): Bm–G–D–A pads, piano arpeggio, sub, kick + shaker, **104 BPM**, D-major resolve | 0–136.2 s, ducked 11 dB under speech (voice 16.2 dB above music) |
| Whooshes (filtered noise sweeps) | synthesised | 0.86, 3.37, 4.33, 5.64, 9.86, 13.18, 18.57, 19.68, 25.91, 28.33, 31.43, 41.46, 43.98, 45.43, 49.5, 54.88, 62.5, 76.0, 77.6, 80.76, 87.13, 97.05, 98.99, 108.27, 116.23, 121.85, 129.99, 131.73 s (every B-roll entry, header punches, outro) |
| Impacts (sub boom + noise, reverse swell into it) | synthesised | 9.86 (USP 01), 45.43 (USP 02), 87.13 (USP 03), 132.9 (logo) |
| Final mix | `tools/mix_audio.py` | −13.5 LUFS integrated, peak −1.0 dBFS, AAC 256 kbps |
