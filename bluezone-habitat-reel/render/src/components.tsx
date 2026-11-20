import React from 'react';
import {
  AbsoluteFill, Img, OffthreadVideo, Sequence, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import { C, F, FPS } from './theme';

export const sec = (s: number) => Math.round(s * FPS);
const ease = Easing.bezier(0.22, 1, 0.36, 1);       // smooth, premium ease-out
const easeIO = Easing.bezier(0.65, 0, 0.35, 1);

/** progress 0..1 between two local times (seconds) */
export const prog = (frame: number, a: number, b: number, e = ease) =>
  interpolate(frame / FPS, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e });

// ---------------------------------------------------------------- media layers
/** Full-bleed 16:9 clip in a 9:16 frame with a slow pan (x0 -> x1 as 0..1 across the overflow) and push-in. */
export const FullClip: React.FC<{ src: string; startFrom?: number; x0?: number; x1?: number; z0?: number; z1?: number; dim?: number; rate?: number }> =
  ({ src, startFrom = 0, x0 = 0.5, x1 = 0.5, z0 = 1.0, z1 = 1.06, dim = 0, rate = 1 }) => {
    const f = useCurrentFrame(); const { durationInFrames } = useVideoConfig();
    const p = interpolate(f, [0, durationInFrames], [0, 1], { extrapolateRight: 'clamp', easing: easeIO });
    const vw = 1920 * (1920 / 1080); // video width when scaled to frame height
    const over = vw - 1080;
    const x = -over * (x0 + (x1 - x0) * p);
    const z = z0 + (z1 - z0) * p;
    return (
      <AbsoluteFill style={{ backgroundColor: C.forest, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: x, top: 0, width: vw, height: 1920, transform: `scale(${z})`, transformOrigin: `${(x0 + (x1 - x0) * p) * 100}% 50%` }}>
          <OffthreadVideo src={staticFile(src)} startFrom={sec(startFrom)} playbackRate={rate} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        {dim > 0 && <AbsoluteFill style={{ backgroundColor: `rgba(8,16,8,${dim})` }} />}
        <Vignette />
      </AbsoluteFill>
    );
  };

/** Ken Burns on a still image covering the frame. */
export const KenBurns: React.FC<{ src: string; z0?: number; z1?: number; ox?: string; oy0?: number; oy1?: number; dim?: number; blur?: number }> =
  ({ src, z0 = 1.12, z1 = 1.0, ox = '50%', oy0 = 50, oy1 = 50, dim = 0, blur = 0 }) => {
    const f = useCurrentFrame(); const { durationInFrames } = useVideoConfig();
    const p = interpolate(f, [0, durationInFrames], [0, 1], { extrapolateRight: 'clamp', easing: easeIO });
    return (
      <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: C.forest }}>
        <Img src={staticFile(src)} style={{
          width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${ox} ${oy0 + (oy1 - oy0) * p}%`,
          transform: `scale(${z0 + (z1 - z0) * p})`, filter: blur ? `blur(${blur}px)` : undefined,
        }} />
        {dim > 0 && <AbsoluteFill style={{ backgroundColor: `rgba(8,16,8,${dim})` }} />}
        <Vignette />
      </AbsoluteFill>
    );
  };

export const Vignette: React.FC<{ strength?: number; top?: number }> = ({ strength = 0.55, top = 0.6 }) => (
  <AbsoluteFill style={{
    background: `radial-gradient(ellipse 85% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(5,10,5,${strength}) 100%),
                 linear-gradient(180deg, rgba(5,12,6,${top}) 0%, rgba(5,12,6,${top * 0.55}) 26%, rgba(0,0,0,0) 46%, rgba(0,0,0,0) 62%, rgba(5,12,6,0.55) 100%)`,
  }} />
);

/** Rounded media panel (video or image) that slides in at time `at` (local seconds). */
export const Panel: React.FC<{ src: string; video?: boolean; startFrom?: number; rate?: number; x: number; y: number; w: number; h: number; at: number; from?: 'right' | 'left' | 'up'; children?: React.ReactNode }> =
  ({ src, video, startFrom = 0, rate = 1, x, y, w, h, at, from = 'right', children }) => {
    const f = useCurrentFrame();
    const p = prog(f, at, at + 0.6);
    const d = (1 - p) * (from === 'up' ? 260 : 420) * (from === 'left' ? -1 : 1);
    const kb = 1.08 - 0.08 * prog(f, at, at + 4, easeIO);
    return (
      <div style={{
        position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 28, overflow: 'hidden',
        transform: from === 'up' ? `translateY(${d}px)` : `translateX(${d}px)`, opacity: p,
        boxShadow: '0 24px 60px rgba(0,0,0,0.45)', filter: `blur(${(1 - p) * 10}px)`,
      }}>
        {video
          ? <Sequence from={Math.max(0, sec(at) - 2)} layout="none"><OffthreadVideo src={staticFile(src)} startFrom={sec(startFrom)} playbackRate={rate} muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${kb})` }} /></Sequence>
          : <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${kb})` }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(8,18,8,0.55) 0%, rgba(0,0,0,0) 55%)' }} />
        {children}
      </div>
    );
  };

// ---------------------------------------------------------------- typography
/** Words rise in with a blur-to-sharp settle, staggered. `times` = per-word local start seconds (or a single start + stagger). */
export const Kinetic: React.FC<{
  text: string; at: number; stagger?: number; y: number; size: number; font?: string; weight?: number; color?: string;
  italic?: boolean; spacing?: number; upper?: boolean; maxWidth?: number; align?: 'center' | 'left'; x?: number; shadow?: boolean; out?: number;
}> = ({ text, at, stagger = 0.09, y, size, font = F.serif, weight = 600, color = C.white, italic, spacing = 0, upper, maxWidth = 900, align = 'center', x, shadow = true, out }) => {
  const f = useCurrentFrame();
  const words = text.split(' ');
  const o = out !== undefined ? 1 - prog(f, out, out + 0.35) : 1;
  return (
    <div style={{
      position: 'absolute', top: y, left: x ?? (1080 - maxWidth) / 2, width: maxWidth, textAlign: align,
      fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.18, color, fontStyle: italic ? 'italic' : 'normal',
      letterSpacing: spacing, textTransform: upper ? 'uppercase' : 'none', opacity: o, fontVariantNumeric: 'lining-nums', fontFeatureSettings: '"lnum" 1',
      textShadow: shadow ? '0 4px 24px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.5)' : undefined,
    }}>
      {words.map((w, i) => {
        const p = prog(f, at + i * stagger, at + i * stagger + 0.55);
        return (
          <span key={i} style={{ display: 'inline-block', whiteSpace: 'pre', opacity: p, transform: `translateY(${(1 - p) * 28}px)`, filter: `blur(${(1 - p) * 8}px)` }}>
            {w}{i < words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </div>
  );
};

/** Frosted-glass label chip. */
export const Chip: React.FC<{ text: string; at: number; x?: number; y: number; size?: number; accent?: string; out?: number; center?: boolean; dark?: boolean }> =
  ({ text, at, x, y, size = 30, accent = C.sage, out, center = true, dark = true }) => {
    const f = useCurrentFrame();
    const p = prog(f, at, at + 0.5);
    const o = out !== undefined ? 1 - prog(f, out, out + 0.3) : 1;
    return (
      <div style={{ position: 'absolute', top: y, left: center ? 0 : x, width: center ? 1080 : undefined, display: 'flex', justifyContent: center ? 'center' : 'flex-start', opacity: p * o }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: `${size * 0.5}px ${size * 0.95}px`,
          borderRadius: 999, background: dark ? 'rgba(14,26,14,0.42)' : 'rgba(255,255,255,0.55)', backdropFilter: 'blur(14px)',
          border: '1.5px solid rgba(255,255,255,0.35)', transform: `scale(${0.86 + 0.14 * p}) translateY(${(1 - p) * 18}px)`,
          fontFamily: F.sans, fontWeight: 600, fontSize: size, letterSpacing: size * 0.16, color: dark ? C.white : C.leaf, textTransform: 'uppercase',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        }}>
          <span style={{ width: size * 0.32, height: size * 0.32, borderRadius: 99, background: accent, boxShadow: `0 0 14px ${accent}` }} />
          {text}
        </div>
      </div>
    );
  };

/** Thin rule that draws from the centre. */
export const Rule: React.FC<{ at: number; y: number; w?: number; color?: string }> = ({ at, y, w = 360, color = 'rgba(255,255,255,0.8)' }) => {
  const f = useCurrentFrame(); const p = prog(f, at, at + 0.7);
  return <div style={{ position: 'absolute', top: y, left: 540 - (w * p) / 2, width: w * p, height: 2, background: color }} />;
};

/** Counter that counts up to `to`, landing at time `land`. */
export const Counter: React.FC<{ to: number; start: number; land: number; y: number; size: number; prefix?: string; suffix?: string; color?: string }> =
  ({ to, start, land, y, size, prefix = '', suffix = '', color = C.white }) => {
    const f = useCurrentFrame();
    const p = prog(f, start, land, Easing.bezier(0.16, 1, 0.3, 1));
    const vis = prog(f, start - 0.2, start + 0.3);
    return (
      <div style={{ position: 'absolute', top: y, width: 1080, textAlign: 'center', fontFamily: F.serif, fontWeight: 700, fontSize: size, color, lineHeight: 1, opacity: vis,
        textShadow: '0 6px 40px rgba(0,0,0,0.45)', transform: `scale(${0.92 + 0.08 * vis})`, fontVariantNumeric: 'lining-nums tabular-nums', fontFeatureSettings: '"lnum" 1, "tnum" 1' }}>
        {prefix}{Math.round(to * p)}{suffix}
      </div>
    );
  };

// ---------------------------------------------------------------- brand + compliance
export const ArtistTag: React.FC<{ text?: string }> = ({ text = "Artist's impression" }) => (
  <div style={{ position: 'absolute', top: 236, left: 64, padding: '8px 16px', borderRadius: 8, background: 'rgba(10,18,10,0.45)',
    fontFamily: F.sans, fontWeight: 500, fontSize: 20, letterSpacing: 2.5, color: 'rgba(255,255,255,0.88)', textTransform: 'uppercase' }}>
    {text}
  </div>
);

export const Bug: React.FC = () => (
  <Img src={staticFile('brand/bluezone-logo-white.png')} style={{ position: 'absolute', top: 228, right: 62, width: 120, opacity: 0.92,
    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }} />
);

export const SageCard: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.sage }}>
      <Img src={staticFile('img/sage_texture.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.25 + f * 0.0006})`, opacity: 0.95 }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 42%, rgba(255,255,255,0.35) 0%, rgba(0,0,0,0) 70%)' }} />
      {children}
    </AbsoluteFill>
  );
};

/** Light sweep across a logo/title (subtle sheen). */
export const Sheen: React.FC<{ at: number; dur?: number }> = ({ at, dur = 1.2 }) => {
  const f = useCurrentFrame(); const p = prog(f, at, at + dur, easeIO);
  if (p <= 0 || p >= 1) return null;
  return <AbsoluteFill style={{ background: `linear-gradient(105deg, rgba(255,255,255,0) ${p * 140 - 40}%, rgba(255,250,235,0.35) ${p * 140 - 25}%, rgba(255,255,255,0) ${p * 140 - 10}%)`, mixBlendMode: 'screen' }} />;
};
