import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G, FONT, FPS, isML, TEXT_SHADOW } from './theme';
import data from './data/beats.json';

type Word = { w: string; t0: number; t1: number; style: 'pri' | 'em' | 'script'; line: number };
type Beat = { line: number; t0: number; t1: number; words: Word[] };
const BEATS = data.beats as Beat[];

// words that get a hand-drawn marker ellipse (reference: red marker circles), here in Green Apple
const MARK = /^(51|USP\.|privacy|morning|cloud)$/i;
const backOut = Easing.bezier(0.34, 1.56, 0.64, 1);

/** Word-synced kinetic captions in the reference's grammar: 1–3 words per beat, words pop in as spoken
 *  (overshoot scale), mixed typefaces, alternating stacked/inline layouts, occasional vertical emphasis words,
 *  marker ellipses. `hidden` = time windows where a full graphic replaces captions. */
export const Captions: React.FC<{ hidden: [number, number][] }> = ({ hidden }) => {
  const f = useCurrentFrame(); const t = f / FPS;
  if (hidden.some(([a, b]) => t >= a && t < b)) return null;
  const idx = BEATS.findIndex((b) => t >= b.t0 - 0.03 && t < b.t1);
  if (idx < 0) return null;
  const beat = BEATS[idx];
  const outP = interpolate(t, [beat.t1 - 0.12, beat.t1], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const single = beat.words.length === 1;
  const vertical = single && beat.words[0].style === 'em' && !isML(beat.words[0].w) && beat.words[0].w.length <= 12 && idx % 4 === 1;
  const layout = vertical ? 'vertical' : ['left', 'center', 'right', 'center'][idx % 4];
  const stacked = !vertical && beat.words.length > 1 && beat.words.map((w) => w.w).join(' ').length > 9;
  const y = 1160 + ((idx * 37) % 3) * 40;

  const wordEl = (w: Word, k: number) => {
    const ap = interpolate(t, [w.t0 - 0.02, w.t0 + 0.2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: backOut });
    const op = interpolate(t, [w.t0 - 0.03, w.t0 + 0.05], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const ml = isML(w.w);
    const style: React.CSSProperties =
      w.style === 'em'
        ? { fontFamily: ml ? FONT.ml : FONT.em, fontWeight: ml ? 900 : 400, fontSize: ml ? 74 : 124, color: G.apple, letterSpacing: ml ? 0 : 1, textTransform: ml ? 'none' : 'uppercase', WebkitTextStroke: ml ? undefined : `2px ${G.holly}`, lineHeight: ml ? 1.25 : 0.92 }
        : w.style === 'script'
          ? { fontFamily: FONT.script, fontSize: 112, color: G.pistachio, lineHeight: 0.9 }
          : { fontFamily: ml ? FONT.ml : FONT.pri, fontWeight: 800, fontSize: ml ? 58 : 70, color: G.pistachio, lineHeight: 1.18 };
    const rot = ((k + idx) % 3 - 1) * 2.2;
    return (
      <span key={k} style={{ position: 'relative', display: 'inline-block', whiteSpace: 'nowrap', opacity: op,
        transform: `translateY(${(1 - ap) * 26}px) scale(${0.55 + 0.45 * ap}) rotate(${rot}deg)`, textShadow: TEXT_SHADOW,
        marginLeft: stacked ? ((k % 3) * 46) : 0, ...style }}>
        {w.w}
        {MARK.test(w.w.replace(/[.,]$/, '') ) && <Marker start={w.t0 + 0.12} t={t} />}
      </span>
    );
  };

  if (layout === 'vertical') {
    return (
      <div style={{ position: 'absolute', left: 150, top: 1000, transform: 'rotate(-90deg)', transformOrigin: 'left top', opacity: outP }}>
        {wordEl(beat.words[0], 0)}
      </div>
    );
  }
  return (
    <div style={{ position: 'absolute', top: y, left: 90, width: 900, display: 'flex', flexDirection: stacked ? 'column' : 'row', flexWrap: 'wrap',
      gap: stacked ? 0 : 18, alignItems: layout === 'left' ? 'flex-start' : layout === 'right' ? 'flex-end' : 'center',
      justifyContent: layout === 'left' ? 'flex-start' : layout === 'right' ? 'flex-end' : 'center', opacity: outP,
      transform: `scale(${0.96 + 0.04 * outP})` }}>
      {beat.words.map(wordEl)}
    </div>
  );
};

/** Hand-drawn marker ellipse that draws itself around a word. */
const Marker: React.FC<{ start: number; t: number }> = ({ start, t }) => {
  const p = interpolate(t, [start, start + 0.35], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });
  return (
    <svg viewBox="0 0 200 100" preserveAspectRatio="none" style={{ position: 'absolute', left: '-22%', top: '-20%', width: '144%', height: '140%', overflow: 'visible', pointerEvents: 'none' }}>
      <path d="M 100 8 C 175 6, 196 40, 188 62 C 178 92, 40 96, 14 70 C -6 46, 30 10, 112 12" fill="none" stroke={G.apple} strokeWidth={5}
        strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} style={{ filter: `drop-shadow(0 2px 0 ${G.holly})` }} />
    </svg>
  );
};
