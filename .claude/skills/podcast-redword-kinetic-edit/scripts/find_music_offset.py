#!/usr/bin/env python3
"""Find which part of a song plays under a reference video, so the same portion can be used as the bed.

Usage: find_music_offset.py song.(mp3|m4a|wav) reference.mp4 [ref_start ref_end]
Prints the top matches as: song time that lines up with reference time 0 (or ref_start), plus a score.
Method: both signals -> 8 kHz mono -> log-mel-ish band energies at 100 frames/s -> onset (spectral flux) envelope
and a chroma-like band profile; normalised cross-correlation over every song offset. Dialogue on the reference
lowers the score but the music's rhythm still peaks. Check the winner by ear with --listen output.
"""
import subprocess, sys
import numpy as np

SR, HOP = 8000, 80  # 100 frames/s


def load(path, ss=None, to=None):
    cmd = ['ffmpeg', '-v', 'error']
    if ss is not None:
        cmd += ['-ss', str(ss)]
    if to is not None:
        cmd += ['-to', str(to)]
    cmd += ['-i', path, '-vn', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32)


def features(x):
    n = 512; win = np.hanning(n)
    frames = np.lib.stride_tricks.sliding_window_view(np.pad(x, (0, n)), n)[::HOP]
    spec = np.abs(np.fft.rfft(frames * win, axis=1))
    freqs = np.fft.rfftfreq(n, 1 / SR)
    edges = np.geomspace(40, 3800, 25)
    bands = np.stack([spec[:, (freqs >= a) & (freqs < b)].sum(1) for a, b in zip(edges, edges[1:])], 1)
    lb = np.log1p(bands * 10)
    flux = np.maximum(np.diff(lb, axis=0, prepend=lb[:1]), 0).sum(1)
    low = lb[:, :8].mean(1)  # bass/kick band: dialogue is weak here
    f = np.stack([flux, low], 1)
    return (f - f.mean(0)) / (f.std(0) + 1e-6)


def xcorr(song_f, ref_f):
    n = len(song_f) + len(ref_f)
    N = 1 << (n - 1).bit_length(); score = np.zeros(len(song_f) - len(ref_f) + 1)
    for c, w in ((0, 1.0), (1, 0.7)):
        S = np.fft.rfft(song_f[:, c], N); R = np.fft.rfft(ref_f[::-1, c], N)
        full = np.fft.irfft(S * R, N)[len(ref_f) - 1:len(song_f)]
        score += w * full[:len(score)] / len(ref_f)
    return score


def main():
    song, ref = sys.argv[1], sys.argv[2]
    rs = float(sys.argv[3]) if len(sys.argv) > 3 else None; re_ = float(sys.argv[4]) if len(sys.argv) > 4 else None
    s = features(load(song)); r = features(load(ref, rs, re_))
    if len(r) >= len(s):
        sys.exit('reference excerpt is longer than the song')
    sc = xcorr(s, r); order = np.argsort(sc)[::-1]; picked = []
    for i in order:
        if all(abs(i - j) > 150 for j in picked):
            picked.append(i)
        if len(picked) == 5:
            break
    z = (sc - sc.mean()) / (sc.std() + 1e-9)
    base = rs or 0.0
    for i in picked:
        print(f'song {i / 100:7.2f}s  <->  reference {base:.2f}s   score {sc[i]:.3f}  (z {z[i]:.1f})')
    print('best:', f'{picked[0] / 100 - base:.2f}', '= song time at reference 0.00 s (use as music.start, adjusted for any trim)')


if __name__ == '__main__':
    main()
