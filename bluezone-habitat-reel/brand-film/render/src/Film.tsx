// Bluezone Habitat 90-s brand film: typography, subtitles, labels and end card over the deterministic picture track (public/bg.mp4).
import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import '@fontsource/bodoni-moda/400.css';
import '@fontsource/bodoni-moda/400-italic.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/noto-sans-malayalam/500.css';
import SUBS from './subs.json';
import TL from './timeline.json';

const F = (s: number) => Math.round(s * 30);
const C = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const G = { holly: '#013408', crusoe: '#005B0D', pistachio: '#B4F4A5', paper: '#F5F3E6', cream: '#FFF8EC' };
const SH = '0 2px 8px rgba(0,0,0,0.6), 0 0 24px rgba(0,0,0,0.35)';
const BODONI = '"Bodoni Moda", Georgia, serif';
const MONT = 'Montserrat, sans-serif';
const ML = '"Noto Sans Malayalam", Montserrat, sans-serif';
const isML = (s: string) => /[ഀ-ൿ]/.test(s);

const Fade: React.FC<{ a: number; b: number; children: React.ReactNode; d?: number }> = ({ a, b, children, d = 0 }) => {
  const fr = useCurrentFrame();
  const s = F(a) + d;
  const o = interpolate(fr, [s, s + 15, F(b) - 12, F(b)], [0, 1, 1, 0], C);
  const y = interpolate(fr, [s, s + 20], [12, 0], { ...C, easing: Easing.out(Easing.cubic) });
  return <div style={{ opacity: o, transform: `translateY(${y}px)` }}>{children}</div>;
};

// Hero copy (Bodoni Moda) in the upper third, secondary line in Montserrat
const Hero: React.FC<{ a: number; b: number; title: string; sub?: string; top?: number }> = ({ a, b, title, sub, top = 330 }) => (
  <AbsoluteFill style={{ top, height: 300, alignItems: 'center' }}>
    <Fade a={a} b={b}><div style={{ fontFamily: BODONI, fontSize: 74, color: G.cream, textShadow: SH, textAlign: 'center', lineHeight: 1.1, padding: '0 60px', whiteSpace: 'pre-line' }}>{title}</div></Fade>
    {sub && <Fade a={a} b={b} d={8}><div style={{ fontFamily: MONT, fontWeight: 500, fontSize: 30, letterSpacing: 5, color: '#fff', textShadow: SH, marginTop: 14, textAlign: 'center' }}>{sub}</div></Fade>}
  </AbsoluteFill>
);

const Subtitles: React.FC = () => {
  const fr = useCurrentFrame();
  const c = (SUBS as { start: number; end: number; text: string }[]).find((x) => fr >= F(x.start) && fr < F(x.end));
  if (!c) return null;
  const o = interpolate(fr, [F(c.start), F(c.start) + 5, F(c.end) - 5, F(c.end)], [0, 1, 1, 0], C);
  const ml = isML(c.text);
  return (
    <div style={{ position: 'absolute', left: 90, right: 90, top: 1330, display: 'flex', justifyContent: 'center', opacity: o }}>
      <div style={{ backgroundColor: 'rgba(0,0,0,0.42)', borderRadius: 14, padding: '12px 26px', textAlign: 'center', color: '#fff',
        fontFamily: ml ? ML : MONT, fontWeight: 500, fontSize: ml ? 40 : 42, lineHeight: 1.45 }}>{c.text}</div>
    </div>
  );
};

type Shot = { id: string; from: number; to: number; label?: string; placeholder?: string };
const Labels: React.FC = () => {
  const fr = useCurrentFrame();
  const s = (TL.shots as Shot[]).find((x) => fr >= F(x.from) && fr < F(x.to));
  if (!s) return null;
  const o = interpolate(fr, [F(s.from), F(s.from) + 10], [0, 1], C);
  return (
    <>
      {s.label && <div style={{ position: 'absolute', right: 48, top: 236, opacity: 0.75 * o, fontFamily: MONT, fontWeight: 500, fontSize: 18, letterSpacing: 2.5, color: '#fff', textShadow: SH, textTransform: 'uppercase', textAlign: 'right' }}>{s.label}</div>}
      {s.placeholder && <div style={{ position: 'absolute', left: 48, top: 230, opacity: o, fontFamily: MONT, fontWeight: 600, fontSize: 20, letterSpacing: 2, color: '#1b1b1b', backgroundColor: '#FFD34D', padding: '6px 14px', borderRadius: 8 }}>STAND-IN · {s.placeholder.toUpperCase()} TO BE SUPPLIED</div>}
    </>
  );
};
// project-visual disclaimer, above the Instagram caption zone
const Disclaimer: React.FC = () => {
  const fr = useCurrentFrame();
  const o = interpolate(fr, [F(29.6), F(30.2), F(85.2), F(85.6)], [0, 1, 1, 0], C);
  return <div style={{ position: 'absolute', left: 0, right: 0, top: 1520, textAlign: 'center', opacity: 0.7 * o, fontFamily: MONT, fontSize: 19, letterSpacing: 1.5, color: '#fff', textShadow: SH }}>Conceptual visualization of proposed development</div>;
};

const EndCard: React.FC = () => {
  const fr = useCurrentFrame();
  const t = (d: number) => interpolate(fr, [d, d + 18], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ backgroundColor: G.paper, alignItems: 'center', opacity: interpolate(fr, [0, 14], [0, 1], C) }}>
      <Img src={staticFile('brand/logo-green.png')} style={{ width: 520, marginTop: 470, opacity: t(6), transform: `scale(${0.95 + 0.05 * t(6)})` }} />
      <div style={{ fontFamily: BODONI, fontStyle: 'italic', fontSize: 64, color: G.crusoe, marginTop: 34, opacity: t(22) }}>Live Better. Live Longer.</div>
      <div style={{ width: 120, height: 2, backgroundColor: G.crusoe, opacity: 0.4 * t(30), marginTop: 30 }} />
      <div style={{ fontFamily: MONT, fontWeight: 500, fontSize: 30, letterSpacing: 7, color: G.holly, marginTop: 30, opacity: t(32) }}>ANAKKAYAM · MANJERI</div>
      <div style={{ fontFamily: MONT, fontWeight: 600, fontSize: 56, color: G.holly, marginTop: 16, opacity: t(38) }}>+91 73565 23534</div>
      <div style={{ fontFamily: MONT, fontWeight: 400, fontSize: 18, letterSpacing: 1.5, color: 'rgba(1,52,8,0.6)', marginTop: 120, opacity: t(44) }}>Conceptual visualization of proposed development. Facilities shown are planned.</div>
    </AbsoluteFill>
  );
};

export const Film: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#000' }}>
    <Sequence durationInFrames={F(85.6) + 6}><OffthreadVideo src={staticFile('bg.mp4')} muted /></Sequence>
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.32) 18%, rgba(0,0,0,0) 34%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.35) 100%)' }} />
    <Labels />
    <Hero a={1.0} b={9.6} title="Manjeri, Malappuram" sub="A REGION ON THE RISE" />
    <Hero a={31.0} b={34.3} title="Aurexa · 4 BHK" sub="FROM PLAN" />
    <Hero a={35.8} b={39.6} title="Aurexa · 4 BHK" sub="TO HOME" />
    <Hero a={40.4} b={43.4} title="The Grand Entrance" sub="PLANNED" />
    <Hero a={44.2} b={49.6} title="51 Premium Villas" sub="43% PLANNED OPEN & GREEN SPACE" />
    <Hero a={50.4} b={59.6} title={"Garden Ethen\nGarden Elara"} sub="PLANNED GARDENS" />
    <Hero a={60.4} b={69.6} title="The Clubhouse" sub="PLANNED · WORK-FROM-NATURE OFFICE" />
    <Hero a={70.6} b={79.6} title="Where Peace Meets Luxury" />
    <Disclaimer />
    <Subtitles />
    <Sequence from={F(85.6)}><EndCard /></Sequence>
    <Audio src={staticFile('mix.wav')} />
  </AbsoluteFill>
);
