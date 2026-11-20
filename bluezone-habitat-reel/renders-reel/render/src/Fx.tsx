import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import { CREAM, FONT, G, H, IMG, SHADOW, W } from './theme';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const smooth = Easing.bezier(0.33, 0, 0.67, 1);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

// ---------- camera on a still (Ken Burns / 2.5D-style moves) ----------
export type Move = { s: [number, number]; x: [number, number]; y: [number, number]; pulse?: number };
export const Still: React.FC<{ src: string; dur: number; move: Move }> = ({ src, dur, move }) => {
  const fr = useCurrentFrame();
  const [iw, ih] = IMG[src];
  const p = smooth(Math.min(1, Math.max(0, fr / dur)));
  let s = lerp(move.s[0], move.s[1], p);
  if (move.pulse) s *= 1 + move.pulse * (0.5 - 0.5 * Math.cos((2 * Math.PI * fr) / 72)); // slow 2.4 s breathing
  const sc = (H / ih) * s;
  const dw = iw * sc, dh = ih * sc;
  let left = W / 2 - lerp(move.x[0], move.x[1], p) * dw;
  let top = H / 2 - lerp(move.y[0], move.y[1], p) * dh;
  left = Math.min(0, Math.max(W - dw, left));
  top = Math.min(0, Math.max(H - dh, top));
  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#000' }}>
      <Img src={staticFile(`img/${src}.jpg`)}
        style={{ position: 'absolute', left: 0, top: 0, width: iw, height: ih, transformOrigin: '0 0',
          transform: `translate(${left}px, ${top}px) scale(${sc})` }} />
    </AbsoluteFill>
  );
};

// ---------- scattered letter reveal (reference 2) ----------
type LineKind = 'italic' | 'bold' | 'white' | 'caps' | 'num';
export type Line = { text: string; kind: LineKind; size: number; delay?: number; track?: number };
const lineStyle = (l: Line): React.CSSProperties => {
  switch (l.kind) {
    case 'italic': return { fontFamily: FONT.italic, fontStyle: 'italic', fontWeight: 600, color: '#FFFFFF', letterSpacing: 0.5 };
    case 'bold': return { fontFamily: FONT.bold, fontWeight: 400, letterSpacing: 1.5, textTransform: 'uppercase' };
    case 'white': return { fontFamily: FONT.sans, fontWeight: 800, color: '#FFFFFF', letterSpacing: 3 };
    case 'caps': return { fontFamily: FONT.serif, fontWeight: 700, color: G.ivory, letterSpacing: l.track ?? 9, textTransform: 'uppercase' };
    case 'num': return { fontFamily: FONT.serif, fontWeight: 700, color: G.ivory, fontFeatureSettings: '"lnum" 1', letterSpacing: 2 };
  }
};
export const Scatter: React.FC<{ line: Line; start: number; end: number; seed: string }> = ({ line, start, end, seed }) => {
  const fr = useCurrentFrame();
  const cream = line.kind === 'bold';
  return (
    <div style={{ ...lineStyle(line), fontSize: line.size, lineHeight: 1.08, whiteSpace: 'pre', textAlign: 'center' }}>
      {[...line.text].map((ch, i) => {
        const d = Math.floor(random(`${seed}-in-${i}`) * 14);
        const de = Math.floor(random(`${seed}-out-${i}`) * 7);
        const a = start + d;
        const o = interpolate(fr, [a, a + 7], [0, 1], clamp) * interpolate(fr, [end - 11 + de, end - 3 + de], [1, 0], clamp);
        const blur = (1 - o) * 9;
        const ty = interpolate(fr, [a, a + 9], [16, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
        return (
          <span key={i} style={{ display: 'inline-block', opacity: o, transform: `translateY(${ty}px)`, filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
            ...(cream ? { backgroundImage: CREAM, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' } : {}) }}>
            {ch}
          </span>
        );
      })}
    </div>
  );
};

// ---------- PLANNED pill (brand green) ----------
export const Planned: React.FC<{ start: number; end: number; label?: string }> = ({ start, end, label = 'PLANNED' }) => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame: fr - start, fps, config: { damping: 14, stiffness: 180 } });
  const o = interpolate(fr, [start, start + 5], [0, 1], clamp) * interpolate(fr, [end - 8, end - 1], [1, 0], clamp);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20, opacity: o }}>
      <div style={{ transform: `scale(${0.7 + 0.3 * sp})`, backgroundColor: G.holly, border: `2px solid ${G.pistachio}`, borderRadius: 40,
        padding: '9px 28px 8px', fontFamily: FONT.sans, fontWeight: 700, fontSize: 24, letterSpacing: 7, color: G.pistachio,
        boxShadow: '0 4px 18px rgba(0,0,0,0.35)' }}>{label}</div>
    </div>
  );
};

// ---------- title block: lines + optional pill, soft legibility scrim ----------
export type TitleSpec = { from: number; to: number; top: number; lines: Line[]; planned?: number; plannedLabel?: string; scrim?: number; id: string };
export const Title: React.FC<{ t: TitleSpec }> = ({ t }) => {
  const fr = useCurrentFrame();
  const vis = interpolate(fr, [t.from - 4, t.from + 8, t.to - 8, t.to + 2], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: t.top - 170, height: 560, opacity: vis * (t.scrim ?? 0.42),
        background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0) 100%)' }} />
      <div style={{ position: 'absolute', left: 40, right: 40, top: t.top, display: 'flex', flexDirection: 'column', alignItems: 'center', filter: SHADOW }}>
        {t.lines.map((l, i) => (
          <Scatter key={i} line={l} start={t.from + (l.delay ?? i * 5)} end={t.to} seed={`${t.id}-${i}`} />
        ))}
        {t.planned !== undefined && <Planned start={t.planned} end={t.to} label={t.plannedLabel} />}
      </div>
    </AbsoluteFill>
  );
};

// ---------- small corner tag ----------
export const Tag: React.FC<{ text: string; o: number }> = ({ text, o }) => (
  <div style={{ position: 'absolute', left: 52, top: 236, opacity: 0.78 * o, fontFamily: FONT.sans, fontWeight: 600, fontSize: 19, letterSpacing: 3.5,
    color: '#FFFFFF', textTransform: 'uppercase', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>{text}</div>
);

// ---------- map pin drop + location card ----------
export const Pin: React.FC<{ start: number; end: number; x: number; y: number }> = ({ start, end, x, y }) => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drop = spring({ frame: fr - start, fps, config: { damping: 9, stiffness: 140, mass: 0.8 } });
  const o = interpolate(fr, [start, start + 3], [0, 1], clamp) * interpolate(fr, [end - 8, end], [1, 0], clamp);
  const ty = (1 - drop) * -420;
  const ring = ((fr - start - 10) % 36) / 36;
  const card = spring({ frame: fr - start - 9, fps, config: { damping: 16, stiffness: 150 } });
  return (
    <AbsoluteFill style={{ opacity: o }}>
      {fr - start > 10 && [0, 0.5].map((k, i) => {
        const r = (ring + k) % 1;
        return <div key={i} style={{ position: 'absolute', left: x - 30 - 60 * r, top: y - 10 - 20 * r, width: 60 + 120 * r, height: 20 + 40 * r,
          borderRadius: '50%', border: `3px solid ${G.pistachio}`, opacity: 0.8 * (1 - r) }} />;
      })}
      <div style={{ position: 'absolute', left: x - 26, top: y - 8, width: 52, height: 16, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.45)',
        filter: 'blur(3px)', transform: `scale(${0.4 + 0.6 * drop})` }} />
      <svg width={96} height={124} viewBox="0 0 96 124" style={{ position: 'absolute', left: x - 48, top: y - 120, transform: `translateY(${ty}px)`,
        filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.45))' }}>
        <path d="M48 4 C24 4 6 22 6 46 C6 76 48 120 48 120 C48 120 90 76 90 46 C90 22 72 4 48 4 Z" fill={G.holly} stroke={G.pistachio} strokeWidth={4} />
        <circle cx={48} cy={45} r={17} fill={G.ivory} />
        <circle cx={48} cy={45} r={7} fill={G.grass} />
      </svg>
      <div style={{ position: 'absolute', left: x - 290, width: 580, top: y + 40, display: 'flex', justifyContent: 'center',
        opacity: card, transform: `translateY(${(1 - card) * 40}px)` }}>
        <div style={{ backgroundColor: G.paper, borderRadius: 22, padding: '22px 40px 20px', textAlign: 'center', boxShadow: '0 10px 34px rgba(0,0,0,0.38)',
          borderTop: `5px solid ${G.grass}` }}>
          <div style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 31, letterSpacing: 5, color: G.holly }}>ANAKKAYAM · MANJERI</div>
          <div style={{ fontFamily: FONT.italic, fontStyle: 'italic', fontWeight: 600, fontSize: 36, color: G.crusoe, marginTop: 4 }}>Malappuram, Kerala</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- big serif counter ("51") ----------
export const Counter: React.FC<{ start: number; land: number; end: number; to: number; size: number }> = ({ start, land, end, to, size }) => {
  const fr = useCurrentFrame();
  const v = Math.round(interpolate(fr, [start, land], [0, to], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const o = interpolate(fr, [start, start + 6], [0, 1], clamp) * interpolate(fr, [end - 10, end - 2], [1, 0], clamp);
  const pop = interpolate(fr, [land, land + 4, land + 12], [1, 1.07, 1], clamp);
  return (
    <div style={{ fontFamily: FONT.serif, fontWeight: 700, fontSize: size, lineHeight: 0.92, color: G.ivory, fontFeatureSettings: '"lnum" 1',
      opacity: o, transform: `scale(${pop})`, textAlign: 'center' }}>{v}</div>
  );
};

// ---------- typewriter ("Contact For Site Visit") ----------
export const Typewriter: React.FC<{ text: string; start: number; end: number; perChar?: number; style: React.CSSProperties }> = ({ text, start, end, perChar = 2, style }) => {
  const fr = useCurrentFrame();
  const n = Math.max(0, Math.min(text.length, Math.floor((fr - start) / perChar)));
  const done = fr - start >= text.length * perChar;
  const cursor = !done || Math.floor((fr - start) / 15) % 2 === 0;
  const o = interpolate(fr, [end - 8, end], [1, 0], clamp);
  if (fr < start) return null;
  return (
    <div style={{ ...style, opacity: o, whiteSpace: 'pre' }}>
      {text.slice(0, n)}<span style={{ opacity: cursor && fr < end - 12 ? 0.9 : 0 }}>|</span><span style={{ opacity: 0 }}>{text.slice(n)}</span>
    </div>
  );
};

// ---------- outro: motion-blur logo reveal on the logo's own paper colour ----------
const LogoSlide: React.FC<{ start: number }> = ({ start }) => {
  const fr = useCurrentFrame();
  const p = interpolate(fr, [start, start + 10], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const x = (1 - p) * -900;
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Img src={staticFile('brand/logo-green.png')} style={{ width: 700, transform: `translate(${x}px, -170px)` }} />
    </AbsoluteFill>
  );
};
export const Outro: React.FC<{ dur: number }> = ({ dur }) => {
  const fr = useCurrentFrame();
  const t1 = interpolate(fr, [18, 30], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const t2 = interpolate(fr, [24, 36], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const glow = interpolate(fr, [6, 30], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: G.paper }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 40% at 50% 42%, rgba(180,244,165,${0.22 * glow}) 0%, rgba(245,243,230,0) 70%)` }} />
      <CameraMotionBlur shutterAngle={260} samples={10}><LogoSlide start={2} /></CameraMotionBlur>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1170, textAlign: 'center' }}>
        <div style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 30, letterSpacing: 8, color: G.olive, opacity: t1, transform: `translateY(${(1 - t1) * 20}px)` }}>
          CONTACT FOR SITE VISIT</div>
        <div style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 64, letterSpacing: 2, color: G.holly, marginTop: 14, opacity: t2, transform: `translateY(${(1 - t2) * 20}px)` }}>
          +91 73565 23534</div>
        <div style={{ fontFamily: FONT.sans, fontWeight: 500, fontSize: 32, letterSpacing: 4, color: G.crusoe, marginTop: 14, opacity: t2 }}>bluezonehabitat.com</div>
      </div>
    </AbsoluteFill>
  );
};
