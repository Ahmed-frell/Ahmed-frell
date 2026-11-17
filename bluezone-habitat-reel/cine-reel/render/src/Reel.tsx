// Blue Zone Habitat cinematic architecture reel: text / graphics layer over the pre-rendered camera moves (public/bg.mp4).
// Typography follows the Velora reference: script italic over light sans, small, white, lower-middle, blur-in.
import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import '@fontsource/allura/400.css';
import '@fontsource/poppins/200.css';
import '@fontsource/poppins/300.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/noto-sans-malayalam/700.css';

const F = (s: number) => Math.round(s * 30);
const C = { clampLeft: 'clamp', extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const G = { holly: '#013408', crusoe: '#005B0D', grass: '#089F25', pistachio: '#B4F4A5', paper: '#F5F3E6' };
const SH = '0 2px 6px rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.35)';

const Fade: React.FC<{ a: number; b: number; children: React.ReactNode; y?: number; delay?: number }> = ({ a, b, children, delay = 0 }) => {
  const fr = useCurrentFrame();
  const s = F(a) + delay;
  const o = interpolate(fr, [s, s + 12, F(b) - 9, F(b)], [0, 1, 1, 0], C);
  const bl = interpolate(fr, [s, s + 12], [10, 0], C) + interpolate(fr, [F(b) - 9, F(b)], [0, 6], C);
  const ty = interpolate(fr, [s, s + 16], [14, 0], { ...C, easing: Easing.out(Easing.cubic) });
  return <div style={{ opacity: o, filter: `blur(${bl}px)`, transform: `translateY(${ty}px)` }}>{children}</div>;
};
const Pair: React.FC<{ a: number; b: number; script: string; sans: string; top?: number }> = ({ a, b, script, sans, top = 1180 }) => (
  <AbsoluteFill style={{ top, height: 300, alignItems: 'center' }}>
    <Fade a={a} b={b}><div style={{ fontFamily: 'Allura', fontSize: 104, color: '#fff', textShadow: SH, lineHeight: 1 }}>{script}</div></Fade>
    <Fade a={a} b={b} delay={6}><div style={{ fontFamily: 'Poppins', fontWeight: 300, fontSize: 50, color: '#fff', textShadow: SH, letterSpacing: 1, marginTop: -6 }}>{sans}</div></Fade>
  </AbsoluteFill>
);

// morning mist drifting away during the drone descent
const Mist: React.FC = () => {
  const fr = useCurrentFrame();
  const clear = interpolate(fr, [0, 80], [1, 0.08], { ...C, easing: Easing.inOut(Easing.sin) });
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {Array.from({ length: 9 }).map((_, i) => {
        const x = random(`mx${i}`) * 1300 - 300, y = random(`my${i}`) * 1900 - 200, w = 700 + random(`mw${i}`) * 700;
        const dx = (random(`md${i}`) - 0.5) * 6 * fr + (x < 400 ? -1 : 1) * fr * 4;
        return <div key={i} style={{ position: 'absolute', left: x + dx, top: y + fr * (i % 2 ? 1.5 : -1), width: w, height: w * 0.55, borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(242,244,246,0.95) 0%, rgba(235,238,242,0.55) 45%, rgba(235,238,242,0) 72%)',
          filter: 'blur(28px)', opacity: clear }} />;
      })}
      <AbsoluteFill style={{ backgroundColor: `rgba(236,239,242,${0.55 * clear})` }} />
    </AbsoluteFill>
  );
};

const Pin: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => {
  const fr = useCurrentFrame(); const { fps } = useVideoConfig();
  const d = spring({ frame: fr - F(at), fps, config: { damping: 10, stiffness: 150 } });
  if (fr < F(at)) return null;
  return (
    <div style={{ position: 'absolute', left: x - 60, top: y - 150, width: 120, height: 150, transform: `translateY(${(1 - d) * -500}px)`, filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.45))' }}>
      <svg width={120} height={150} viewBox="0 0 96 120">
        <path d="M48 4 C24 4 6 22 6 46 C6 76 48 116 48 116 C48 116 90 76 90 46 C90 22 72 4 48 4 Z" fill={G.holly} stroke={G.pistachio} strokeWidth={3} />
        <circle cx={48} cy={45} r={27} fill={G.paper} />
      </svg>
      <Img src={staticFile('brand/logo-green.png')} style={{ position: 'absolute', left: 30, top: 23, width: 60 }} />
    </div>
  );
};
const Flash: React.FC<{ at: number }> = ({ at }) => {
  const fr = useCurrentFrame();
  const o = interpolate(fr, [F(at) - 5, F(at), F(at) + 8], [0, 0.95, 0], C);
  return <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 60%, #fff4dc 0%, #ffd59a 60%, #f7b866 100%)', opacity: o, mixBlendMode: 'screen' }} />;
};

const Tag: React.FC = () => {
  const fr = useCurrentFrame();
  const o = interpolate(fr, [F(25.0), F(25.4)], [1, 0], C);
  return <div style={{ position: 'absolute', right: 40, top: 240, opacity: 0.7 * o, fontFamily: 'Poppins', fontWeight: 500, fontSize: 17, letterSpacing: 3, color: '#fff', textShadow: SH }}>ARTIST'S IMPRESSION</div>;
};

const BHK: React.FC = () => (
  <AbsoluteFill style={{ top: 520, alignItems: 'center' }}>
    <Fade a={15.7} b={18.75}><div style={{ fontFamily: 'Poppins', fontWeight: 200, fontSize: 210, color: '#fff', textShadow: SH, lineHeight: 0.95, letterSpacing: -4 }}>3, 4 & 5</div></Fade>
    <Fade a={15.7} b={18.75} delay={8}><div style={{ fontFamily: 'Poppins', fontWeight: 200, fontSize: 170, color: '#fff', textShadow: SH, lineHeight: 0.95, textAlign: 'center' }}>BHK</div></Fade>
  </AbsoluteFill>
);

const SkyLogo: React.FC = () => {
  const fr = useCurrentFrame();
  const o = interpolate(fr, [F(22.3), F(23.1)], [0, 1], C);
  const bl = interpolate(fr, [F(22.3), F(23.1)], [14, 0], C);
  return (
    <AbsoluteFill style={{ alignItems: 'center', top: 250 }}>
      <div style={{ width: 560, padding: '26px 30px', borderRadius: 26, backgroundColor: 'rgba(245,243,230,0.0)', opacity: o, filter: `blur(${bl}px) drop-shadow(0 4px 18px rgba(255,255,255,0.55))` }}>
        <Img src={staticFile('brand/logo-green.png')} style={{ width: 500 }} />
      </div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const fr = useCurrentFrame();
  const o = interpolate(fr, [0, 10], [0, 1], C);
  const t = (d: number) => interpolate(fr, [d, d + 12], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ backgroundColor: G.paper, opacity: o, alignItems: 'center' }}>
      <Img src={staticFile('brand/logo-green.png')} style={{ width: 560, marginTop: 470, opacity: t(4), transform: `scale(${0.94 + 0.06 * t(4)})` }} />
      <div style={{ fontFamily: 'Allura', fontSize: 84, color: G.crusoe, marginTop: 30, opacity: t(14) }}>Live Better. Live Longer.</div>
      <div style={{ fontFamily: 'Poppins', fontWeight: 500, fontSize: 30, letterSpacing: 6, color: G.holly, marginTop: 26, opacity: t(20) }}>ANAKKAYAM · MANJERI</div>
      <div style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 58, color: G.holly, marginTop: 14, opacity: t(24) }}>+91 73565 23534</div>
      <div style={{ marginTop: 30, opacity: t(30), transform: `translateY(${(1 - t(30)) * 14}px)`, backgroundColor: G.holly, color: G.paper, fontFamily: 'Poppins', fontWeight: 500, fontSize: 30, padding: '16px 40px', borderRadius: 14 }}>Book your site visit today</div>
    </AbsoluteFill>
  );
};

export const Reel: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#000' }}>
    <Sequence durationInFrames={F(25.8)}><OffthreadVideo src={staticFile('bg.mp4')} muted /></Sequence>
    <Sequence durationInFrames={F(3.2)}><Mist /></Sequence>
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 70% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.25) 100%)' }} />
    <Tag />
    {/* 1 · location */}
    <AbsoluteFill style={{ top: 560, alignItems: 'center' }}>
      <Fade a={0.6} b={3.05}><div style={{ fontFamily: '"Noto Sans Malayalam"', fontWeight: 700, fontSize: 92, color: '#fff', textShadow: SH, textAlign: 'center', lineHeight: 1.25 }}>ആനക്കയം,<br />മഞ്ചേരി</div></Fade>
    </AbsoluteFill>
    <Sequence durationInFrames={F(3.1)}><Pin at={1.55} x={560} y={1290} /></Sequence>
    <Flash at={3.1} />
    <Pair a={3.35} b={5.55} script="A new way" sans="of living, close to nature" />
    <Pair a={5.75} b={7.15} script="Blue Zone" sans="H A B I T A T" top={1120} />
    <Pair a={7.2} b={9.05} script="Live Better." sans="Live Longer." />
    <Pair a={9.4} b={12.35} script="Green paths," sans="calm gardens" />
    <Pair a={12.55} b={15.45} script="Modern villas," sans="designed for wellness" />
    <BHK />
    <Pair a={19.0} b={21.85} script="Your next home" sans="starts here" />
    <SkyLogo />
    <Sequence from={F(25.4)}><EndCard /></Sequence>
    <Audio src={staticFile('mix.wav')} />
  </AbsoluteFill>
);
