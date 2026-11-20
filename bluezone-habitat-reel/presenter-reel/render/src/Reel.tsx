import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, interpolate, Easing, random } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import { G, FONT, FPS, VOICE_END, TOTAL, SHADOW } from './theme';
import { Captions } from './Captions';
import { TextFx, FxText } from './TextFx';
import fx from './data/fx.json';

/* Revision 2. Timeline = rough cut v2 (frame-exact EDL) + 4.5 s outro. Every time below is a spoken word
 * (render/src/data/beats.json); all designed text, transitions and SFX cues come from fx.json (tools/build_fx.py).
 * Reference technique ids (X1…, T1…) refer to analysis/08-reference-motion-text-sfx.md. */
const sec = (s: number) => Math.round(s * FPS);
const expo = Easing.bezier(0.16, 1, 0.3, 1);
const back = Easing.bezier(0.34, 1.56, 0.64, 1);
const C = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };
const p = (f: number, a: number, b: number, e = expo) => interpolate(f / FPS, [a, b], [0, 1], { ...C, easing: e });

type Pick = { id: string; rec: [number, number]; src: string; x: number; rate?: number; clip_handle?: number; tr: string };
const PICKS = fx.picks as unknown as Pick[];
const TEXTS = fx.texts as unknown as FxText[];
const HEADERS = [9.86, 45.43, 87.13];
const FLASHES = [0, ...HEADERS];
const PUNCH = [0.2, ...HEADERS, 127.84];
const W_USP3: [number, number] = [8.08, 9.86];
const W_CARD: [number, number] = [43.98, 45.43];

// ------------------------------------------------------------------ A-roll: natural grade (baked), punches, B&W snap (X2), defocus (X7)
const aFx = (f: number) => {
  const t = f / FPS;
  const punch = PUNCH.reduce((acc, s) => acc + (t >= s && t < s + 0.4 ? (1 - p(f, s, s + 0.35)) * 0.09 : 0), 0);
  const bwIn = HEADERS.reduce((a, s) => Math.max(a, t >= s + 0.17 && t < s + 0.9 ? interpolate(t, [s + 0.17, s + 0.27, s + 0.55, s + 0.9], [0, 1, 1, 0], C) : 0), 0);
  const defocus = t >= W_CARD[0] - 0.1 && t < W_CARD[0] ? interpolate(t, [W_CARD[0] - 0.1, W_CARD[0]], [0, 22], C) : 0;
  return { transform: `scale(${1 + punch})`, filter: `grayscale(${bwIn}) contrast(${1 + 0.2 * bwIn})${defocus ? ` blur(${defocus}px)` : ''}` };
};
const ARoll: React.FC = () => {
  const f = useCurrentFrame();
  return (<AbsoluteFill style={aFx(f)}><OffthreadVideo src={staticFile('aroll.mp4')} muted style={{ width: '100%', height: '100%' }} /></AbsoluteFill>);
};
const FG: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const f = useCurrentFrame();
  return <Img src={staticFile(`fg/f${String(f).padStart(5, '0')}.png`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', ...style }} />;
};
const BehindPresenter: React.FC<{ win: [number, number]; children: React.ReactNode }> = ({ win, children }) => {
  const f = useCurrentFrame(); const t = f / FPS;
  if (t < win[0] || t >= win[1]) return null;
  return (<AbsoluteFill>{children}<FG style={aFx(f)} /></AbsoluteFill>);
};

/** X1/X4: subject silhouette filled with Holly (2 f) -> ivory glowing silhouette over a blown-out frame (3 f) -> cut */
const SilhouetteFlash: React.FC = () => {
  const f = useCurrentFrame();
  const s = FLASHES.find((x) => f >= sec(x) && f < sec(x) + 5);
  if (s === undefined) return null;
  const k = f - sec(s);
  return (
    <AbsoluteFill>
      {k >= 2 && <AbsoluteFill style={{ backgroundColor: G.ivory, opacity: 0.55 }} />}
      <FG style={k < 2 ? { filter: `brightness(0) saturate(100%) drop-shadow(0 0 0 ${G.holly})`, opacity: 1 }
        : { filter: `brightness(0) invert(1) drop-shadow(0 0 26px ${G.pistachio}) drop-shadow(0 0 60px ${G.apple})` }} />
      {k < 2 && <FG style={{ mixBlendMode: 'screen', filter: 'brightness(0)', opacity: 0 }} />}
      {k < 2 && <AbsoluteFill style={{ backgroundColor: G.holly, mixBlendMode: 'color', opacity: 0 }} />}
    </AbsoluteFill>
  );
};
/** Holly silhouette needs a fill colour, not black: draw the matte as a mask over a holly plane */
const HollySilhouette: React.FC = () => {
  const f = useCurrentFrame();
  const s = FLASHES.find((x) => f >= sec(x) && f < sec(x) + 2);
  if (s === undefined) return null;
  const src = staticFile(`fg/f${String(f).padStart(5, '0')}.png`);
  return <AbsoluteFill style={{ backgroundColor: G.holly, WebkitMaskImage: `url(${src})`, maskImage: `url(${src})`, WebkitMaskSize: '100% 100%', maskSize: '100% 100%' }} />;
};

/** T11: giant numeral behind the presenter, scale 0.3 -> 1.08 -> 1 in 4 f with blur */
const Giant: React.FC<{ text: string; at: number; size?: number; y?: number }> = ({ text, at, size = 980, y = 60 }) => {
  const f = useCurrentFrame(); const a = p(f, at, at + 0.14, back); const l = p(f, at, at + 0.14, Easing.linear);
  return <div style={{ position: 'absolute', top: y, width: 1080, textAlign: 'center', fontFamily: FONT.serif, fontWeight: 700, fontSize: size, lineHeight: 0.8,
    color: G.holly, WebkitTextStroke: `3px ${G.pistachio}`, transform: `scale(${0.3 + 0.7 * a})`, filter: `blur(${(1 - l) * 12}px)`, opacity: Math.min(1, l * 3),
    fontVariantNumeric: 'lining-nums', fontFeatureSettings: '"lnum" 1', textShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>{text}</div>;
};

// ------------------------------------------------------------------ B-roll
const Tag: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: 'absolute', top: 236, left: 60, padding: '7px 14px', borderRadius: 6, background: 'rgba(1,52,8,0.78)', borderLeft: `3px solid ${G.pistachio}`,
    fontFamily: FONT.sans, fontWeight: 600, fontSize: 18, letterSpacing: 2.5, color: G.ivory, textTransform: 'uppercase' }}>{text}</div>
);
const TAG: Record<string, string> = { B12: 'Manjeri · photograph', B06: 'Villa layout · indicative' };
const Scrim: React.FC = () => <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(1,52,8,0.5) 0%, rgba(1,52,8,0) 26%, rgba(0,0,0,0) 62%, rgba(1,52,8,0.45) 100%)' }} />;

/** video or still B-roll body with a slow push (stills: 2.5D two-layer parallax + perspective) */
const Body: React.FC<{ k: Pick; d: number }> = ({ k, d }) => {
  const f = useCurrentFrame(); const q = f / FPS / d;
  const still = /\.(png|jpg)$/.test(k.src);
  if (still) {
    const src = staticFile(`broll/${k.id}.png`); const persp = k.id === 'B08' ? `perspective(1600px) rotateY(${5 - 5 * expo(Math.min(1, q * 1.4))}deg)` : '';
    const s0 = 1.08 + 0.05 * q, s1 = 1.08 + 0.085 * q;   // background vs foreground scale: restrained 2.5D parallax
    const pos = `${k.x * 100}% 50%`;
    return (<AbsoluteFill style={{ transform: persp }}>
      <Img src={src} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, transform: `scale(${s0})` }} />
      <Img src={src} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, transform: `scale(${s1}) translateY(${-12 * q}px)`,
        WebkitMaskImage: 'linear-gradient(180deg, transparent 38%, black 66%)', maskImage: 'linear-gradient(180deg, transparent 38%, black 66%)' }} />
    </AbsoluteFill>);
  }
  return (
    <div style={{ position: 'absolute', top: 0, height: 1920, width: 3413, left: -(3413 - 1080) * k.x, transform: `scale(${1.04 + 0.05 * q})`, transformOrigin: `${k.x * 100}% 50%` }}>
      <OffthreadVideo src={staticFile(`broll/${k.id}.mp4`)} startFrom={sec(k.clip_handle ?? 0.3)} playbackRate={k.rate ?? 1} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
};

/** X5 whip: incoming image streaks in over 5 f with real multi-sample camera motion blur */
const Whip: React.FC<{ dir: 1 | -1; children: React.ReactNode }> = ({ dir, children }) => {
  const f = useCurrentFrame();
  const inner = <AbsoluteFill style={{ transform: `translateX(${dir * (1 - interpolate(f, [0, 5], [0, 1], { ...C, easing: Easing.bezier(0.5, 0, 0.2, 1) })) * 100}%)` }}>{children}</AbsoluteFill>;
  return f < 6 ? <CameraMotionBlur samples={10} shutterAngle={300}>{inner}</CameraMotionBlur> : inner;
};
/** architectural door mask: frame opens from a centre seam, 7 f */
const Doors: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame(); const o = expo(interpolate(f, [0, 7], [0, 1], C));
  return (<AbsoluteFill style={{ clipPath: `inset(0 ${(1 - o) * 50}% 0 ${(1 - o) * 50}%)`, transform: `scale(${1.08 - 0.08 * o})` }}>{children}
    {o < 1 && <><div style={{ position: 'absolute', top: 0, bottom: 0, left: `${(1 - o) * 50}%`, width: 3, background: G.ivory }} /><div style={{ position: 'absolute', top: 0, bottom: 0, right: `${(1 - o) * 50}%`, width: 3, background: G.ivory }} /></>}
  </AbsoluteFill>);
};

const BRoll: React.FC<{ k: Pick }> = ({ k }) => {
  const d = k.rec[1] - k.rec[0];
  const body = (<AbsoluteFill style={{ backgroundColor: G.holly, overflow: 'hidden' }}><Body k={k} d={d} /><Scrim /><Tag text={TAG[k.id] ?? "Artist's impression"} /></AbsoluteFill>);
  if (k.tr === 'whipL') return <Whip dir={-1}>{body}</Whip>;
  if (k.tr === 'whipR') return <Whip dir={1}>{body}</Whip>;
  if (k.tr === 'maskDoors') return <Doors>{body}</Doors>;
  if (k.tr === 'imageText') return <ImageText k={k} d={d} />;
  if (k.tr === 'tear') return <Tear k={k} d={d} />;
  return body;
};

/** B01: the gate render seen THROUGH the letters of BLUE ZONE (holly plane with letter-shaped holes, SVG mask),
 *  letters type on 1.5 f apart (T2), then the camera flies through the letters into the full frame (text -> image) */
const ImageText: React.FC<{ k: Pick; d: number }> = ({ k, d }) => {
  const f = useCurrentFrame(); const t = f / FPS;
  const zoom = interpolate(t, [0.55, 0.95], [1, 18], { ...C, easing: Easing.bezier(0.7, 0, 0.84, 0) });
  const L1 = ['B', 'L', 'U', 'E'], L2 = ['Z', 'O', 'N', 'E'];
  const vis = (i: number) => (f >= i * 1.5 ? 1 : 0);
  const full = t >= 0.95;
  const line = (ls: string[], off: number, y: number, fill: string, stroke?: string) => (
    <text x={540} y={y} textAnchor="middle" fontFamily='"Cormorant Garamond"' fontWeight={700} fontSize={400} letterSpacing={-4} fill={fill} stroke={stroke} strokeWidth={stroke ? 2 : 0}>
      {ls.map((l, i) => <tspan key={i} fillOpacity={vis(i + off)} strokeOpacity={vis(i + off)}>{l}</tspan>)}
    </text>);
  return (
    <AbsoluteFill style={{ backgroundColor: G.holly }}>
      <Body k={k} d={d} />
      {full ? <><Scrim /><Tag text="Artist's impression" /></> : (
        <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <radialGradient id="bzbg" cx="50%" cy="45%" r="70%"><stop offset="0%" stopColor={G.forest} /><stop offset="100%" stopColor={G.holly} /></radialGradient>
            <mask id="bzmask" maskUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920}>
              <rect width={1080} height={1920} fill="white" />
              <g transform={`translate(540 900) scale(${zoom}) translate(-540 -900)`}>{line(L1, 0, 760, 'black')}{line(L2, 4, 1110, 'black')}</g>
            </mask>
          </defs>
          <rect width={1080} height={1920} fill="url(#bzbg)" mask="url(#bzmask)" />
          {zoom < 1.3 && <g opacity={0.95}>{line(L1, 0, 760, 'none', G.pistachio)}{line(L2, 4, 1110, 'none', G.pistachio)}</g>}
        </svg>)}
    </AbsoluteFill>
  );
};

/** B06 (X6 adapted): the master plan tears open along a jagged blueprint edge to reveal the 51-plot villa layout */
const Tear: React.FC<{ k: Pick; d: number }> = ({ k, d }) => {
  const f = useCurrentFrame(); const t = f / FPS;
  const open = interpolate(t, [0.1, 0.5], [0, 1], { ...C, easing: Easing.bezier(0.5, 0, 0.15, 1) });
  const N = 28; const pts = Array.from({ length: N + 1 }, (_, i) => [i / N * 1080, 960 + (random(`tear${i}`) - 0.5) * 70 + Math.sin(i * 1.7) * 18]);
  const gap = open * 1100;
  const top = `polygon(0 0, 1080px 0, ${pts.slice().reverse().map(([x, y]) => `${x}px ${y - gap / 2}px`).join(', ')})`;
  const bot = `polygon(${pts.map(([x, y]) => `${x}px ${y + gap / 2}px`).join(', ')}, 1080px 1920px, 0 1920px)`;
  const plan = <Img src={staticFile('img/masterplan_vertical.jpg')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.15 + 0.05 * t})` }} />;
  const q = t / d;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 42%, ${G.forest} 0%, ${G.holly} 78%)` }}>
      <Img src={staticFile('broll/B06.png')} style={{ position: 'absolute', left: 90, top: 660, width: 900, borderRadius: 22, boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
        transform: `perspective(1400px) rotateX(${(1 - open) * 14}deg) scale(${0.94 + 0.06 * open + 0.03 * q})` }} />
      {open < 1 && (<>
        <AbsoluteFill style={{ clipPath: top }}>{plan}</AbsoluteFill>
        <AbsoluteFill style={{ clipPath: bot }}>{plan}</AbsoluteFill>
        <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
          <polyline points={pts.map(([x, y]) => `${x},${y - gap / 2}`).join(' ')} fill="none" stroke={G.ivory} strokeWidth={6} />
          <polyline points={pts.map(([x, y]) => `${x},${y + gap / 2}`).join(' ')} fill="none" stroke={G.ivory} strokeWidth={6} />
        </svg>
      </>)}
      <Tag text={open < 0.5 ? 'Master plan · indicative' : 'Villa layout · indicative'} />
    </AbsoluteFill>
  );
};

/** 51 counter: persists across the B06 -> B07 cut (the label below morphs villas -> workspaces) */
const Counter51: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame(); const n = Math.round(51 * p(f, from + 0.3, from + 0.82, Easing.out(Easing.cubic)));
  const a = p(f, from + 0.25, from + 0.5, back);
  return <div style={{ position: 'absolute', top: 300, width: 1080, textAlign: 'center', fontFamily: FONT.serif, fontWeight: 700, fontSize: 250, lineHeight: 1, color: G.ivory,
    textShadow: SHADOW, transform: `scale(${0.7 + 0.3 * a})`, opacity: Math.min(1, a * 2), fontVariantNumeric: 'lining-nums tabular-nums', fontFeatureSettings: '"lnum" 1, "tnum" 1' }}>{n}</div>;
};

/** B10 picture-in-picture: office clip in a tilted card beside the presenter */
const Pip: React.FC<{ k: Pick }> = ({ k }) => {
  const f = useCurrentFrame(); const a = p(f, 0, 0.25, back); const out = 1 - p(f, (k.rec[1] - k.rec[0]) - 0.2, k.rec[1] - k.rec[0]);
  return (
    <div style={{ position: 'absolute', left: 470, top: 300, width: 540, height: 700, borderRadius: 30, overflow: 'hidden', border: `4px solid ${G.ivory}`,
      boxShadow: '0 30px 70px rgba(0,0,0,0.5)', transform: `perspective(1400px) rotateY(${-14 + 6 * a}deg) translateX(${(1 - a) * 300}px) rotate(${3 - 3 * a}deg)`, opacity: Math.min(a, out),
      filter: `blur(${(1 - Math.min(1, a)) * 10}px)` }}>
      <div style={{ position: 'absolute', top: 0, left: -700, width: 1244, height: 700 }}>
        <OffthreadVideo src={staticFile(`broll/${k.id}.mp4`)} startFrom={sec(k.clip_handle ?? 0.3)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ position: 'absolute', left: 14, bottom: 12, padding: '4px 10px', background: 'rgba(1,52,8,0.8)', fontFamily: FONT.sans, fontWeight: 600, fontSize: 16, letterSpacing: 2, color: G.ivory, textTransform: 'uppercase' }}>Artist's impression</div>
    </div>
  );
};

/** X7: defocus, then the presenter card pushes in (110 % -> 100 %) over a Holly field; giant USP behind */
const UspCard: React.FC = () => {
  const f = useCurrentFrame(); const t = f / FPS;
  const a = p(f, W_CARD[0], W_CARD[0] + 0.2); const tilt = interpolate(t, [W_CARD[0], W_CARD[1]], [12, -5]);
  const w = p(f, W_CARD[0] + 0.05, W_CARD[0] + 0.2, back);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(165deg, ${G.crusoe} 0%, ${G.forest} 40%, ${G.holly} 100%)` }}>
      <div style={{ position: 'absolute', top: 360, width: 1080, textAlign: 'center', fontFamily: FONT.serif, fontWeight: 700, fontSize: 700, lineHeight: 0.85, color: 'transparent',
        WebkitTextStroke: `3px ${G.pistachio}`, transform: `scale(${0.6 + 0.4 * w})`, opacity: Math.min(1, w * 2) }}>USP</div>
      <div style={{ position: 'absolute', left: 290, top: 420, width: 500, height: 889, borderRadius: 40, overflow: 'hidden', border: `4px solid ${G.ivory}`,
        boxShadow: '0 40px 90px rgba(0,0,0,0.55)', transform: `perspective(1600px) rotateY(${tilt}deg) scale(${1.1 - 0.1 * a})`, filter: `blur(${(1 - a) * 14}px)` }}>
        <div style={{ position: 'absolute', left: -290, top: -240, width: 1080, height: 1920, transform: 'scale(0.8)', transformOrigin: '540px 520px' }}><ARoll /></div>
      </div>
    </AbsoluteFill>
  );
};

/** B17 icons: 3 villas + 1 shared maid (label is a TextFx element) */
const MaidIcons: React.FC = () => {
  const f = useCurrentFrame();
  const house = (i: number) => {
    const a = p(f, 0.12 + i * 0.18, 0.4 + i * 0.18, back);
    return (<svg key={i} width={120} height={110} viewBox="0 0 24 22" style={{ transform: `scale(${0.4 + 0.6 * a})`, opacity: Math.min(1, a * 1.6) }}>
      <path d="M2 11 12 2l10 9v10H2z" fill="rgba(1,52,8,0.75)" stroke={G.ivory} strokeWidth={1.6} strokeLinejoin="round" /><rect x="9.5" y="14" width="5" height="7" fill={G.pistachio} /></svg>);
  };
  const m = p(f, 0.84, 1.1, back);
  return (
    <div style={{ position: 'absolute', top: 290, width: 1080, display: 'flex', justifyContent: 'center', gap: 18, alignItems: 'flex-end' }}>
      {[0, 1, 2].map(house)}
      <div style={{ width: 3, height: 90, background: G.ivory, margin: '0 14px', opacity: m }} />
      <svg width={90} height={110} viewBox="0 0 20 24" style={{ transform: `scale(${0.4 + 0.6 * m})`, opacity: Math.min(1, m * 1.5) }}>
        <circle cx="10" cy="6" r="4.5" fill={G.pistachio} stroke={G.holly} strokeWidth={0.8} /><path d="M1 24c0-6 4-10 9-10s9 4 9 10z" fill={G.pistachio} stroke={G.holly} strokeWidth={0.8} /></svg>
    </div>
  );
};
const Pin: React.FC = () => {
  const f = useCurrentFrame(); const a = p(f, 0.0, 0.25, back);
  return (<svg width={64} height={84} viewBox="0 0 24 30" style={{ position: 'absolute', left: 90, top: 330, transform: `translateY(${(1 - a) * -60}px)`, opacity: Math.min(1, a * 2) }}>
    <path d="M12 0C5.4 0 0 5.2 0 11.7 0 20.2 12 30 12 30s12-9.8 12-18.3C24 5.2 18.6 0 12 0z" fill={G.holly} stroke={G.pistachio} strokeWidth={1.2} /><circle cx="12" cy="11.5" r="4.4" fill={G.pistachio} /></svg>);
};
const LogoGlow: React.FC = () => {
  const f = useCurrentFrame(); const a = p(f, 127.84, 128.5);
  return <Img src={staticFile('brand/bluezone-leaf-white.png')} style={{ position: 'absolute', left: 190, top: 120, width: 700, opacity: 0.9 * a,
    filter: `drop-shadow(0 0 20px ${G.pistachio}) drop-shadow(0 0 50px ${G.grass})`, transform: `scale(${0.92 + 0.08 * a})` }} />;
};

// ------------------------------------------------------------------ outro (X10): particles converge into the logo
const OUTRO_LEN = TOTAL - VOICE_END;
const Outro: React.FC = () => {
  const f = useCurrentFrame(); const N = 120;
  const c = p(f, 0.1, 1.5, Easing.bezier(0.6, 0, 0.2, 1)); const logo = p(f, 1.15, 1.7); const info = p(f, 2.0, 2.5); const end = p(f, OUTRO_LEN - 0.5, OUTRO_LEN);
  const tl = interpolate(f / FPS, [1.9, 2.5], [18, 3], { ...C, easing: expo });
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, ${G.forest} 0%, ${G.holly} 65%, #000 100%)` }}>
      {Array.from({ length: N }).map((_, i) => {
        const sx = random(`x${i}`) * 1080, sy = random(`y${i}`) * 1920; const ang = random(`a${i}`) * Math.PI * 2, r = 30 + random(`r${i}`) * 180;
        const x = sx + (540 + Math.cos(ang) * r * 0.85 - sx) * c, y = sy + (760 + Math.sin(ang) * r - sy) * c; const s = 3 + random(`s${i}`) * 8;
        const col = i % 4 === 0 ? G.gold : i % 2 ? G.pistachio : G.ivory;
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: 99, background: col, boxShadow: `0 0 ${s * 2}px ${G.pistachio}`, opacity: (1 - logo * 0.92) * (0.45 + 0.55 * random(`o${i}`)) }} />;
      })}
      <Img src={staticFile('brand/bluezone-logo-white.png')} style={{ position: 'absolute', left: 260, top: 560, width: 560, opacity: logo, filter: `drop-shadow(0 0 16px rgba(180,244,165,0.6))`, transform: `scale(${0.88 + 0.12 * logo})` }} />
      <div style={{ position: 'absolute', top: 1060, width: 1080, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: info, transform: `translateY(${(1 - info) * 20}px)` }}>
        <div style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontWeight: 600, fontSize: 80, color: G.ivory, letterSpacing: tl }}>A Better Way to Live</div>
        <div style={{ width: 160, height: 2, background: G.gold, margin: '26px 0 30px' }} />
        <div style={{ padding: '16px 44px', borderRadius: 999, background: G.holly, border: `2px solid ${G.pistachio}`, color: G.ivory, fontFamily: FONT.sans, fontWeight: 700, fontSize: 44, letterSpacing: 2 }}>+91 73565 23534</div>
        <div style={{ marginTop: 22, fontFamily: FONT.sans, fontWeight: 600, fontSize: 32, letterSpacing: 4, color: G.ivory }}>bluezonehabitat.com</div>
        <div style={{ marginTop: 10, fontFamily: FONT.sans, fontWeight: 500, fontSize: 22, letterSpacing: 6, color: G.pistachio }}>ANAKKAYAM · MANJERI · MALAPPURAM</div>
      </div>
      <AbsoluteFill style={{ backgroundColor: '#000', opacity: end }} />
    </AbsoluteFill>
  );
};

const Bug: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  if (t < 2.3 || (t >= W_CARD[0] && t < W_CARD[1]) || t >= VOICE_END) return null;
  return <Img src={staticFile('brand/bluezone-logo-white.png')} style={{ position: 'absolute', top: 226, right: 58, width: 112, opacity: 0.9, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }} />;
};
const Win: React.FC<{ w: [number, number]; children: React.ReactNode }> = ({ w, children }) => {
  const t = useCurrentFrame() / FPS;
  return t >= w[0] && t < w[1] ? <AbsoluteFill>{children}</AbsoluteFill> : null;
};
const at = (id: string) => PICKS.find((k) => k.id === id)!;

// ------------------------------------------------------------------ master
export const Reel: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#000' }}>
    <Sequence durationInFrames={sec(VOICE_END)}><ARoll /></Sequence>
    {/* text behind the presenter (segmentation matte) */}
    <BehindPresenter win={W_USP3}><Giant text="3" at={8.1} size={1250} y={-40} /></BehindPresenter>
    <BehindPresenter win={[9.86, 11.08]}><Giant text="01" at={9.86} /></BehindPresenter>
    <BehindPresenter win={[45.43, 48.03]}><Giant text="02" at={45.43} /></BehindPresenter>
    <BehindPresenter win={[87.13, 90.5]}><Giant text="03" at={87.13} /></BehindPresenter>
    <BehindPresenter win={[127.84, 129.99]}><LogoGlow /></BehindPresenter>
    <Win w={W_CARD}><UspCard /></Win>
    {/* B-roll with reference transitions */}
    {PICKS.map((k) => (
      <Sequence key={k.id} name={`${k.id} ${k.tr}`} from={sec(k.rec[0])} durationInFrames={sec(k.rec[1]) - sec(k.rec[0])}>
        {k.id === 'B10' ? <Pip k={k} /> : <BRoll k={k} />}
        {k.id === 'B17' && <MaidIcons />}
        {k.id === 'B12' && <Pin />}
      </Sequence>
    ))}
    <Win w={[at('B06').rec[0], at('B07').rec[1]]}><Counter51 from={at('B06').rec[0]} /></Win>
    {/* designed typography + captions */}
    {TEXTS.map((e) => <TextFx key={e.id} e={e} />)}
    <Captions hidden={fx.hidden} />
    <HollySilhouette />
    <SilhouetteFlashLayer />
    <Bug />
    <Sequence from={sec(VOICE_END)} durationInFrames={sec(TOTAL) - sec(VOICE_END)}><Outro /></Sequence>
  </AbsoluteFill>
);
/** ivory glow silhouette frames (k = 2..4) of each flash */
const SilhouetteFlashLayer: React.FC = () => {
  const f = useCurrentFrame();
  const s = FLASHES.find((x) => f >= sec(x) + 2 && f < sec(x) + 5);
  if (s === undefined) return null;
  return (<AbsoluteFill>
    <AbsoluteFill style={{ backgroundColor: G.ivory, opacity: 0.5 }} />
    <FG style={{ filter: `brightness(0) invert(1) drop-shadow(0 0 26px ${G.pistachio}) drop-shadow(0 0 60px ${G.apple})` }} />
  </AbsoluteFill>);
};
export { SilhouetteFlash };
