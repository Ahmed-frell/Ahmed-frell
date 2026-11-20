import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G, FONT, FPS, isML, SHADOW } from './theme';
import { Marker } from './TextFx';
import data from './data/beats.json';

type Word = { w: string; t0: number; t1: number; style: 'pri' | 'em' | 'script'; line: number };
type Beat = { line: number; t0: number; t1: number; words: Word[] };
const BEATS = data.beats as Beat[];
const MARK = /^(51|USP\.?|morning|cloud)$/i;
const expo = Easing.bezier(0.16, 1, 0.3, 1);
const back = Easing.bezier(0.34, 1.56, 0.64, 1);
const C = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

/** Speech-synced kinetic captions in the reference's grammar (analysis/08 §A), Blue Zone typography:
 *  primary = Montserrat 700 ivory, masked rise per word (T1/T2 timing: 5 f);
 *  emphasis = Cormorant Garamond 700 pistachio, letters fly in with motion blur, 1 f stagger (T9) - or a vertical
 *  baseline slide (T4) every few beats; accent = Cormorant italic champagne, typewriter (T2);
 *  Malayalam = Manjari 700 (emphasis: Noto Serif Malayalam) animated per word.
 *  Beat-to-beat continuity: the outgoing beat rises out through its mask while the next rises in (text-to-text). */
export const Captions: React.FC<{ hidden: number[][] }> = ({ hidden }) => {
  const f = useCurrentFrame(); const t = f / FPS;
  if (hidden.some(([a, b]) => t >= a && t < b)) return null;
  const idx = BEATS.findIndex((b, i) => t >= b.t0 - 0.03 && t < (BEATS[i + 1] ? Math.min(b.t1, BEATS[i + 1].t0) + 0.14 : b.t1));
  if (idx < 0) return null;
  const beat = BEATS[idx]; const next = BEATS[idx + 1];
  const exitAt = next && next.t0 < beat.t1 + 0.01 ? next.t0 : beat.t1 - 0.14;
  const xo = interpolate(t, [exitAt, exitAt + 0.14], [0, 1], C);
  const single = beat.words.length === 1;
  const vertical = single && beat.words[0].style === 'em' && !isML(beat.words[0].w) && beat.words[0].w.length <= 11 && idx % 5 === 2;
  const align = ['flex-start', 'center', 'flex-end', 'center'][idx % 4] as 'flex-start' | 'center' | 'flex-end';
  const stacked = !vertical && beat.words.length > 1 && beat.words.map((w) => w.w).join(' ').length > 11;
  const y = 1150 + (idx % 3) * 36;

  const wordEl = (w: Word, k: number) => {
    const lf = (t - w.t0) * FPS + 1;
    const ml = isML(w.w);
    const em = w.style === 'em', sc = w.style === 'script';
    const style: React.CSSProperties = em
      ? { fontFamily: ml ? FONT.mlSerif : FONT.serif, fontWeight: 700, fontSize: ml ? 70 : 118, color: G.pistachio, lineHeight: ml ? 1.3 : 0.95, textTransform: ml ? 'none' : 'uppercase' }
      : sc ? { fontFamily: FONT.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 104, color: G.gold, lineHeight: 0.95 }
        : { fontFamily: ml ? FONT.mlSans : FONT.sans, fontWeight: 700, fontSize: ml ? 64 : 60, color: G.ivory, lineHeight: 1.25 };
    let body: React.ReactNode;
    if (em && !ml) {         // letters fly in with directional blur (T9)
      body = [...w.w].map((ch, i) => {
        const p = back(interpolate(lf - i, [0, 7], [0, 1], C)); const v = 1 - interpolate(lf - i, [0, 7], [0, 1], C);
        return <span key={i} style={{ display: 'inline-block', opacity: Math.min(1, (1 - v) * 3), transform: `translateX(${(1 - p) * 120}px) scaleX(${1 + 0.4 * v})`, filter: `blur(${v * 6}px)` }}>{ch}</span>;
      });
    } else if (sc && !ml) {  // typewriter (T2)
      body = [...w.w].map((ch, i) => <span key={i} style={{ opacity: interpolate(lf - i * 1.2, [0, 2], [0, 1], C) }}>{ch}</span>);
    } else {                 // masked rise (per word)
      const p = expo(interpolate(lf, [0, 5], [0, 1], C));
      body = <span style={{ display: 'inline-block', transform: `translateY(${(1 - p) * 105}%)` }}>{w.w}</span>;
    }
    const visible = lf > -0.5;
    return (
      <span key={k} style={{ position: 'relative', display: 'inline-block', overflow: 'hidden', paddingBottom: '0.1em', whiteSpace: 'nowrap', opacity: visible ? 1 : 0,
        marginLeft: stacked ? (k % 3) * 40 : 0, textShadow: SHADOW, ...style }}>
        <span style={{ display: 'inline-block', transform: `translateY(${-expo(xo) * 105}%)` }}>{body}</span>
        {MARK.test(w.w.replace(/[.,…]$/, '')) && <Marker lf={lf - 4} />}
      </span>
    );
  };

  if (vertical) {
    const w = beat.words[0]; const lf = (t - w.t0) * FPS; const p = expo(interpolate(lf, [0, 6], [0, 1], C));
    return (
      <div style={{ position: 'absolute', left: 140, top: 1500, transform: 'rotate(-90deg)', transformOrigin: 'left top', opacity: 1 - xo }}>
        <div style={{ transform: `translateX(${(1 - p) * -300}px)`, filter: `blur(${(1 - p) * 8}px)`, fontFamily: FONT.serif, fontWeight: 700, fontSize: 150,
          color: G.pistachio, textShadow: SHADOW, textTransform: 'uppercase', letterSpacing: 2 }}>{w.w}</div>
      </div>
    );
  }
  return (
    <div style={{ position: 'absolute', top: y, left: 90, width: 900, display: 'flex', flexDirection: stacked ? 'column' : 'row', flexWrap: 'wrap',
      columnGap: 18, alignItems: align, justifyContent: align }}>
      {beat.words.map(wordEl)}
    </div>
  );
};
