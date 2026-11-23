#!/usr/bin/env python3
"""Force-align a known transcript to a video's audio (offline, CPU) -> words.json for words_to_chunks.py.

usage: align_words.py VIDEO transcript.txt words.json [--start S --end E]

Uses PocketSphinx (pip install pocketsphinx; the English model ships inside the wheel), so it needs no
model download. Speech is band-passed (300-3400 Hz) first to push music down. English only.
Alignment is reliable on clear speech. Under heavy music it can stretch a word across a pause: check the
result against the speech-band energy printout (--energy) and fix those words by hand.
"""
import argparse, json, re, subprocess, tempfile, os, wave
import numpy as np


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video"); ap.add_argument("transcript"); ap.add_argument("out")
    ap.add_argument("--start", type=float, default=0.0)
    ap.add_argument("--end", type=float, default=None)
    ap.add_argument("--energy", action="store_true", help="also print speech-band energy (dB) every 50 ms")
    a = ap.parse_args()
    from pocketsphinx import Decoder

    text = open(a.transcript).read().lower()
    text = re.sub(r"[^a-z0-9' ]+", " ", text)
    text = " ".join(text.split())

    tmp = tempfile.mkdtemp()
    wav = os.path.join(tmp, "a.wav")
    seg = ["-ss", str(a.start)] + (["-to", str(a.end)] if a.end else [])
    subprocess.run(["ffmpeg", "-v", "error", "-y"] + seg + ["-i", a.video, "-ac", "1", "-ar", "16000",
                    "-af", "highpass=f=300,lowpass=f=3400", wav], check=True)
    w = wave.open(wav)
    buf = w.readframes(w.getnframes())

    d = Decoder(samprate=16000)
    d.set_align_text(text)
    d.start_utt(); d.process_raw(buf, full_utt=True); d.end_utt()
    words = []
    for s in d.seg():
        word = re.sub(r"\(\d+\)$", "", s.word)
        if word.startswith("<") or word.startswith("["):
            continue
        st, en = a.start + s.start_frame / 100, a.start + (s.end_frame + 1) / 100
        words.append({"word": word, "start": round(st, 2), "end": round(en, 2)})
        flag = "   <-- long, check" if en - st > 0.9 else ""
        print(f"{word:14s} {st:6.2f} {en:6.2f}{flag}")
    json.dump(words, open(a.out, "w"), indent=1)
    print(f"{len(words)} words -> {a.out}")

    if a.energy:
        x = np.frombuffer(buf, np.int16).astype(float) / 32768
        hop = 800
        e = [20 * np.log10(np.sqrt(np.mean(x[i:i + hop] ** 2)) + 1e-9) for i in range(0, len(x), hop)]
        print("speech-band energy, 50 ms bins (word onsets = jumps of ~8 dB or more):")
        for i in range(0, len(e), 20):
            print(f"{a.start + i * 0.05:6.2f} " + " ".join(f"{v:4.0f}" for v in e[i:i + 20]))


if __name__ == "__main__":
    main()
