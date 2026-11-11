import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, interpolate, Easing, random } from 'remotion';
import { G, FONT, FPS, VOICE_END, TOTAL, TEXT_SHADOW } from './theme';
import { Captions } from './Captions';
import plan from './data/broll_plan.json';

/* Timeline = rough cut v2 (frame-exact EDL) + 4.5 s outro. All times are seconds on the edit timeline;
 * every sync point is a spoken word from render/src/data/beats.json (see analysis/05-edl.md). */
const sec = (s: number) => Math.round(s * FPS);
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const backOut = Easing.bezier(0.34, 1.56, 0.64, 1);
const p = (f: number, a: number, b: number, e = ease) => interpolate(f / FPS, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e });

// ------------------------------------------------------------------ graphic windows (captions hidden there)
const W_USP3: [number, number] = [8.08, 9.86];      // "മൂന്ന് key USPs"
const W_H1: [number, number] = [9.86, 11.08];        // "The first one is..."
const W_CARD: [number, number] = [43.98, 45.43];     // "So അതാണ് നമ്മുടെ ഒരു USP"
const W_H2: [number, number] = [45.43, 48.03];       // "The second one is shared maid quarters"
const W_H3: [number, number] = [87.13, 90.5];        // "And the third one is Internal Cloud Kitchen"
const HIDDEN: [number, number][] = [W_USP3, W_H1, W_CARD, W_H2, W_H3, [VOICE_END, TOTAL]];
const BW_SNAPS = [9.86, 45.43, 87.13];               // reference: colour → B&W snap on a key beat
const PUNCHES = [0.25, 9.86, 43.98, 45.43, 87.13, 127.84];

type Pick = { id: string; rec: [number, number]; src: string; x: number; rate?: number; clip_handle?: number; what: string };
const PICKS = (plan.picks as unknown as Pick[]);
const RENDER_TAG: Record<string, string> = { B12: 'Manjeri · photo' };
const TR = ['whip', 'zoom', 'whipL', 'flash'] as const;

// ------------------------------------------------------------------ A-roll with effects
const ARoll: React.FC = () => {
  const f = useCurrentFrame(); const t = f / FPS;
  const bw = BW_SNAPS.some((s) => t >= s && t < s + 0.45);
  const punch = PUNCHES.reduce((acc, s) => acc + (t >= s && t < s + 0.35 ? (1 - p(f, s, s + 0.3)) * 0.1 : 0), 0);
  return (
    <AbsoluteFill style={{ transform: `scale(${1 + punch})`, filter: bw ? 'grayscale(1) contrast(1.25) brightness(0.95)' : undefined }}>
      <OffthreadVideo src={staticFile('aroll.mp4')} muted style={{ width: '100%', height: '100%' }} />
    </AbsoluteFill>
  );
};

/** presenter foreground (pre-matted PNG per frame) for text-behind-subject moments */
const FG: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const f = useCurrentFrame();
  return <Img src={staticFile(`fg/f${String(f).padStart(5, '0')}.png`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', ...style }} />;
};
/** Renders children behind the presenter: children, then the matte on top. Uses absolute frames (no Sequence offset). */
const BehindPresenter: React.FC<{ win: [number, number]; children: React.ReactNode; bwFrom?: number }> = ({ win, children, bwFrom }) => {
  const f = useCurrentFrame(); const t = f / FPS;
  if (t < win[0] || t >= win[1]) return null;
  const bw = bwFrom !== undefined && t >= bwFrom && t < bwFrom + 0.45;
  return (<AbsoluteFill>{children}<FG style={{ filter: bw ? 'grayscale(1) contrast(1.25) brightness(0.95)' : undefined, transform: `scale(${1 + PUNCHES.reduce((a, s) => a + (t >= s && t < s + 0.35 ? (1 - p(f, s, s + 0.3)) * 0.1 : 0), 0)})` }} /></AbsoluteFill>);
};

// ------------------------------------------------------------------ B-roll
const BRoll: React.FC<{ k: Pick; i: number }> = ({ k, i }) => {
  const f = useCurrentFrame(); const t = f / FPS; const d = k.rec[1] - k.rec[0];
  const tr = TR[i % TR.length]; const q = p(f, 0, 0.17);
  const still = k.src.endsWith('png') || k.src.endsWith('jpg');
  const drift = 1.06 + 0.06 * (t / d);
  let wrap: React.CSSProperties = {}; let flash = 0;
  if (tr === 'whip') wrap = { transform: `translateX(${(1 - q) * 70}%)`, filter: `blur(${(1 - q) * 30}px)` };
  if (tr === 'whipL') wrap = { transform: `translateX(${(q - 1) * 70}%)`, filter: `blur(${(1 - q) * 30}px)` };
  if (tr === 'zoom') wrap = { transform: `scale(${1.35 - 0.35 * q})`, filter: `blur(${(1 - q) * 18}px)`, opacity: Math.min(1, q * 2) };
  if (tr === 'flash') flash = 1 - p(f, 0, 0.2);
  const tag = RENDER_TAG[k.id] ?? "Artist's impression";
  if (k.id === 'B06') return <PlotCard d={d} />;
  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: G.holly }}>
      <AbsoluteFill style={wrap}>
        {still ? (
          <Img src={staticFile(`broll/${k.id}.png`)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${k.x * 100}% 50%`, transform: `scale(${drift})` }} />
        ) : (
          <div style={{ position: 'absolute', top: 0, height: 1920, width: 3413, left: -(3413 - 1080) * k.x, transform: `scale(${drift})`, transformOrigin: `${k.x * 100}% 50%` }}>
            <OffthreadVideo src={staticFile(`broll/${k.id}.mp4`)} startFrom={sec(k.clip_handle ?? 0.3)} playbackRate={k.rate ?? 1} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(1,52,8,0.45) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 55%, rgba(1,52,8,0.55) 100%)' }} />
      </AbsoluteFill>
      {flash > 0 && <AbsoluteFill style={{ backgroundColor: `rgba(244,255,241,${flash})` }} />}
      <Tag text={tag} />
      <BrollLabel id={k.id} />
    </AbsoluteFill>
  );
};

const Tag: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: 'absolute', top: 236, left: 60, padding: '7px 14px', borderRadius: 8, background: 'rgba(1,52,8,0.6)', fontFamily: FONT.label, fontWeight: 600,
    fontSize: 19, letterSpacing: 2.5, color: G.pistachio, textTransform: 'uppercase' }}>{text}</div>
);

/** short factual label on a B-roll insert (top area, clear of captions) */
const LABELS: Record<string, [string, string?]> = {
  B07: ['51 WORKSPACES', 'planned · work-from-nature office'],
  B08: ['WORK FROM NATURE OFFICE', 'USP 01'],
  B12: ['MANJERI · MALAPPURAM', 'our roots'],
  B16: ['SHARED MAID QUARTERS', 'planned · inside the clubhouse'],
  B20: ['BREAKFAST TO EVERY VILLA', 'concept'],
  B21: ['INTERNAL CLOUD KITCHEN', 'planned · association-run'],
};
const BrollLabel: React.FC<{ id: string }> = ({ id }) => {
  const f = useCurrentFrame(); const L = LABELS[id];
  if (id === 'B17') return <MaidGraphic />;
  if (!L) return null;
  const a = p(f, 0.12, 0.55, backOut); const b = p(f, 0.35, 0.75);
  return (
    <div style={{ position: 'absolute', top: 300, left: 60, right: 60, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      {id === 'B12' && <Pin a={a} />}
      <div style={{ fontFamily: FONT.em, fontSize: 84, color: G.apple, lineHeight: 0.95, textShadow: TEXT_SHADOW, WebkitTextStroke: `2px ${G.holly}`,
        transform: `translateX(${(1 - a) * -60}px) scale(${0.8 + 0.2 * a})`, transformOrigin: 'left center', opacity: Math.min(1, a * 1.5) }}>{L[0]}</div>
      {L[1] && <div style={{ marginTop: 10, padding: '6px 14px', borderRadius: 999, background: 'rgba(1,52,8,0.72)', border: `1.5px solid ${G.apple}`,
        fontFamily: FONT.label, fontWeight: 600, fontSize: 24, letterSpacing: 3, color: G.pistachio, textTransform: 'uppercase', opacity: b, transform: `translateY(${(1 - b) * 12}px)` }}>{L[1]}</div>}
    </div>
  );
};
const Pin: React.FC<{ a: number }> = ({ a }) => (
  <svg width={70} height={90} viewBox="0 0 24 30" style={{ marginBottom: 6, transform: `translateY(${(1 - a) * -40}px)`, opacity: Math.min(1, a * 2), filter: `drop-shadow(0 3px 0 ${G.holly})` }}>
    <path d="M12 0C5.4 0 0 5.2 0 11.7 0 20.2 12 30 12 30s12-9.8 12-18.3C24 5.2 18.6 0 12 0z" fill={G.apple} /><circle cx="12" cy="11.5" r="4.6" fill={G.holly} />
  </svg>
);

/** "2–3 villas · 1 shared maid" on the villa-row insert */
const MaidGraphic: React.FC = () => {
  const f = useCurrentFrame();
  const house = (i: number) => {
    const a = p(f, 0.15 + i * 0.18, 0.5 + i * 0.18, backOut);
    return (<svg key={i} width={120} height={110} viewBox="0 0 24 22" style={{ transform: `scale(${0.4 + 0.6 * a})`, opacity: Math.min(1, a * 1.6), filter: `drop-shadow(0 3px 0 ${G.holly})` }}>
      <path d="M2 11 12 2l10 9v10H2z" fill="none" stroke={G.pistachio} strokeWidth={1.8} strokeLinejoin="round" /><rect x="9.5" y="14" width="5" height="7" fill={G.apple} /></svg>);
  };
  const m = p(f, 0.85, 1.2, backOut); const lab = p(f, 1.1, 1.45);
  return (
    <div style={{ position: 'absolute', top: 290, width: 1080, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-end' }}>
        {[0, 1, 2].map(house)}
        <div style={{ width: 4, height: 90, background: G.apple, margin: '0 14px', opacity: m }} />
        <svg width={90} height={110} viewBox="0 0 20 24" style={{ transform: `scale(${0.4 + 0.6 * m})`, opacity: Math.min(1, m * 1.5), filter: `drop-shadow(0 3px 0 ${G.holly})` }}>
          <circle cx="10" cy="6" r="4.5" fill={G.apple} /><path d="M1 24c0-6 4-10 9-10s9 4 9 10z" fill={G.apple} /></svg>
      </div>
      <div style={{ marginTop: 12, fontFamily: FONT.em, fontSize: 64, color: G.apple, WebkitTextStroke: `2px ${G.holly}`, textShadow: TEXT_SHADOW, opacity: lab, transform: `translateY(${(1 - lab) * 16}px)` }}>2–3 VILLAS · 1 SHARED MAID</div>
    </div>
  );
};

/** B06: the 51-plot layout on a green card with a counter */
const PlotCard: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame(); const a = p(f, 0, 0.3); const n = Math.round(51 * p(f, 0.05, 0.75, Easing.out(Easing.cubic)));
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, ${G.crusoe} 0%, ${G.holly} 75%)` }}>
      <Img src={staticFile('broll/B06.png')} style={{ position: 'absolute', left: 90, top: 640, width: 900, borderRadius: 26, boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
        transform: `perspective(1400px) rotateX(${(1 - a) * 18}deg) scale(${0.9 + 0.1 * a + 0.03 * (f / FPS / d)})`, opacity: a }} />
      <div style={{ position: 'absolute', top: 300, width: 1080, textAlign: 'center', fontFamily: FONT.em, fontSize: 260, color: G.apple, lineHeight: 1, textShadow: TEXT_SHADOW, WebkitTextStroke: `3px ${G.holly}` }}>{n}</div>
      <div style={{ position: 'absolute', top: 565, width: 1080, textAlign: 'center', fontFamily: FONT.label, fontWeight: 600, fontSize: 30, letterSpacing: 8, color: G.pistachio }}>SIGNATURE VILLAS</div>
      <Tag text="Villa layout · indicative" />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ headers and cards
const Giant: React.FC<{ text: string; at: number; size?: number; y?: number; color?: string }> = ({ text, at, size = 900, y = 160, color = G.grass }) => {
  const f = useCurrentFrame(); const a = p(f, at, at + 0.35, backOut);
  return <div style={{ position: 'absolute', top: y, width: 1080, textAlign: 'center', fontFamily: FONT.em, fontSize: size, lineHeight: 0.85, color,
    transform: `scale(${0.6 + 0.4 * a})`, opacity: Math.min(1, a * 1.4), textShadow: `0 10px 0 ${G.holly}`, WebkitTextStroke: `4px ${G.holly}` }}>{text}</div>;
};
const Title: React.FC<{ lines: string[]; at: number; y: number; small?: string }> = ({ lines, at, y, small }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', top: y, width: 1080, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {small && <div style={{ fontFamily: FONT.label, fontWeight: 600, fontSize: 30, letterSpacing: 10, color: G.pistachio, textShadow: TEXT_SHADOW, opacity: p(f, at - 0.2, at) }}>{small}</div>}
      {lines.map((l, i) => {
        const a = p(f, at + i * 0.14, at + i * 0.14 + 0.32, backOut);
        return <div key={i} style={{ fontFamily: FONT.em, fontSize: 118, lineHeight: 0.98, color: i % 2 ? G.pistachio : G.apple, WebkitTextStroke: `2px ${G.holly}`, textShadow: TEXT_SHADOW,
          transform: `translateY(${(1 - a) * 40}px) scale(${0.7 + 0.3 * a})`, opacity: Math.min(1, a * 1.5), letterSpacing: 2 + (1 - a) * 18 }}>{l}</div>;
      })}
    </div>
  );
};
const UspList: React.FC = () => {
  const f = useCurrentFrame();
  const items = [['01', 'Work from Nature Office'], ['02', 'Shared Maid Quarters'], ['03', 'Internal Cloud Kitchen']];
  return (
    <div style={{ position: 'absolute', top: 1290, left: 120, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {items.map(([n, l], i) => {
        const a = p(f, 8.5 + i * 0.22, 8.85 + i * 0.22, backOut);
        return (<div key={n} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '12px 26px 12px 14px', borderRadius: 18, background: 'rgba(1,52,8,0.72)', border: `2px solid ${G.apple}`,
          transform: `translateX(${(1 - a) * -120}px)`, opacity: Math.min(1, a * 1.5), boxShadow: '0 12px 30px rgba(0,0,0,0.35)' }}>
          <span style={{ fontFamily: FONT.em, fontSize: 54, color: G.apple }}>{n}</span>
          <span style={{ fontFamily: FONT.pri, fontWeight: 800, fontSize: 38, color: G.pistachio }}>{l}</span></div>);
      })}
    </div>
  );
};
/** reference: presenter inside a tilted rounded card over a colour field, huge word interleaved */
const UspCard: React.FC = () => {
  const f = useCurrentFrame(); const t = f / FPS;
  const a = p(f, W_CARD[0], W_CARD[0] + 0.4); const tilt = interpolate(t, [W_CARD[0], W_CARD[1]], [16, -6]);
  const word = (front: boolean) => (
    <div style={{ position: 'absolute', top: 330, width: 1080, textAlign: 'center', fontFamily: FONT.em, fontSize: 760, lineHeight: 0.9, color: G.apple,
      WebkitTextStroke: `5px ${G.holly}`, transform: `scale(${0.75 + 0.25 * p(f, W_CARD[0] + 0.1, W_CARD[0] + 0.5, backOut)})`, opacity: p(f, W_CARD[0] + 0.1, W_CARD[0] + 0.3),
      clipPath: front ? 'inset(58% 0 0 0)' : undefined, textShadow: `0 14px 0 ${G.holly}` }}>USP</div>);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${G.grass} 0%, ${G.crusoe} 45%, ${G.holly} 100%)` }}>
      {word(false)}
      <div style={{ position: 'absolute', left: 290, top: 420, width: 500, height: 889, borderRadius: 44, overflow: 'hidden', border: `6px solid ${G.pistachio}`,
        boxShadow: '0 40px 90px rgba(0,0,0,0.55)', transform: `perspective(1600px) rotateY(${tilt}deg) scale(${0.85 + 0.15 * a})`, opacity: a }}>
        <div style={{ position: 'absolute', left: -290, top: -240, width: 1080, height: 1920, transform: 'scale(0.8)', transformOrigin: '540px 520px' }}><ARoll /></div>
      </div>
      <div style={{ position: 'absolute', top: 1600, width: 1080, textAlign: 'center', fontFamily: FONT.label, fontWeight: 600, fontSize: 30, letterSpacing: 10, color: G.pistachio, opacity: p(f, W_CARD[0] + 0.5, W_CARD[0] + 0.8) }}>OUR USP · 01</div>
    </AbsoluteFill>
  );
};
/** B10: office clip as a tilted picture-in-picture card beside the presenter */
const Pip: React.FC<{ k: Pick }> = ({ k }) => {
  const f = useCurrentFrame(); const a = p(f, 0, 0.3, backOut); const out = 1 - p(f, (k.rec[1] - k.rec[0]) - 0.2, k.rec[1] - k.rec[0]);
  return (
    <div style={{ position: 'absolute', left: 470, top: 300, width: 540, height: 700, borderRadius: 34, overflow: 'hidden', border: `5px solid ${G.apple}`,
      boxShadow: '0 30px 70px rgba(0,0,0,0.5)', transform: `perspective(1400px) rotateY(${-14 + 6 * a}deg) translateX(${(1 - a) * 300}px) rotate(${3 - 3 * a}deg)`, opacity: Math.min(a, out) }}>
      <div style={{ position: 'absolute', top: 0, left: -700, width: 1244, height: 700 }}>
        <OffthreadVideo src={staticFile(`broll/${k.id}.mp4`)} startFrom={sec(k.clip_handle ?? 0.3)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ position: 'absolute', left: 16, bottom: 14, fontFamily: FONT.label, fontWeight: 600, fontSize: 18, letterSpacing: 2, color: G.pistachio, textTransform: 'uppercase' }}>Artist's impression</div>
    </div>
  );
};
/** closing: soft-glow leaf logo behind the presenter */
const LogoGlow: React.FC = () => {
  const f = useCurrentFrame(); const a = p(f, 127.84, 128.5);
  return <Img src={staticFile('brand/bluezone-leaf-white.png')} style={{ position: 'absolute', left: 190, top: 120, width: 700, opacity: 0.85 * a,
    filter: `drop-shadow(0 0 22px ${G.apple}) drop-shadow(0 0 60px ${G.grass})`, transform: `scale(${0.92 + 0.08 * a})` }} />;
};
/** opening: the presenter as a glowing white silhouette for a few frames (reference shot 1) */
const OpenFlash: React.FC = () => {
  const f = useCurrentFrame(); if (f > 9) return null;
  const k = interpolate(f, [0, 5, 9], [1, 1, 0]);
  return (<AbsoluteFill>
    <AbsoluteFill style={{ backgroundColor: G.holly, opacity: k * 0.9 }} />
    <FG style={{ filter: `brightness(0) invert(1) drop-shadow(0 0 30px ${G.pistachio}) drop-shadow(0 0 70px ${G.apple})`, opacity: k }} />
  </AbsoluteFill>);
};

// ------------------------------------------------------------------ outro: particles converge into the logo
const Outro: React.FC = () => {
  const f = useCurrentFrame(); const t = f / FPS; const N = 110;
  const c = p(f, 0.1, 1.5, Easing.bezier(0.6, 0, 0.2, 1)); const logo = p(f, 1.15, 1.7); const info = p(f, 2.0, 2.5); const end = p(f, OUTRO_LEN - 0.5, OUTRO_LEN);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 42%, ${G.crusoe} 0%, ${G.holly} 70%, #000 100%)` }}>
      {Array.from({ length: N }).map((_, i) => {
        const sx = random(`x${i}`) * 1080, sy = random(`y${i}`) * 1920; const ang = random(`a${i}`) * Math.PI * 2, r = 40 + random(`r${i}`) * 170;
        const tx = 540 + Math.cos(ang) * r * 0.9, ty = 780 + Math.sin(ang) * r;
        const x = sx + (tx - sx) * c, y = sy + (ty - sy) * c; const s = 4 + random(`s${i}`) * 9;
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: 99, background: i % 3 ? G.apple : G.pistachio,
          boxShadow: `0 0 ${s * 2}px ${G.apple}`, opacity: (1 - logo * 0.9) * (0.5 + 0.5 * random(`o${i}`)) }} />;
      })}
      <Img src={staticFile('brand/bluezone-logo-white.png')} style={{ position: 'absolute', left: 240, top: 560, width: 600, opacity: logo,
        filter: `drop-shadow(0 0 18px ${G.apple}) drop-shadow(0 0 50px ${G.grass})`, transform: `scale(${0.85 + 0.15 * logo})` }} />
      <div style={{ position: 'absolute', top: 1090, width: 1080, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: info, transform: `translateY(${(1 - info) * 24}px)` }}>
        <div style={{ fontFamily: FONT.em, fontSize: 64, letterSpacing: 4, color: G.pistachio }}>A BETTER WAY TO LIVE</div>
        <div style={{ marginTop: 34, padding: '18px 46px', borderRadius: 999, background: G.apple, color: G.holly, fontFamily: FONT.pri, fontWeight: 800, fontSize: 46, letterSpacing: 2 }}>+91 73565 23534</div>
        <div style={{ marginTop: 22, fontFamily: FONT.label, fontWeight: 600, fontSize: 32, letterSpacing: 4, color: G.pistachio }}>bluezonehabitat.com</div>
        <div style={{ marginTop: 10, fontFamily: FONT.label, fontWeight: 500, fontSize: 22, letterSpacing: 6, color: 'rgba(180,244,165,0.75)' }}>ANAKKAYAM · MANJERI · MALAPPURAM</div>
      </div>
      <AbsoluteFill style={{ backgroundColor: '#000', opacity: end }} />
    </AbsoluteFill>
  );
};
const OUTRO_LEN = TOTAL - VOICE_END;

const Bug: React.FC = () => {
  const f = useCurrentFrame(); const t = f / FPS;
  if (t < 0.4 || HIDDEN.slice(2, 3).some(([a, b]) => t >= a && t < b) || t >= VOICE_END) return null;
  return <Img src={staticFile('brand/bluezone-logo-white.png')} style={{ position: 'absolute', top: 226, right: 58, width: 116, opacity: 0.9, filter: `drop-shadow(0 2px 6px ${G.holly})` }} />;
};

// ------------------------------------------------------------------ master
export const Reel: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Sequence durationInFrames={sec(VOICE_END)}><ARoll /></Sequence>
      {/* text behind presenter */}
      <BehindPresenter win={W_USP3} bwFrom={undefined}><Giant text="3" at={8.1} size={1250} y={-40} /></BehindPresenter>
      <BehindPresenter win={W_H1} bwFrom={9.86}><Giant text="01" at={9.86} /><Title lines={[]} small="USP" at={9.95} y={170} /></BehindPresenter>
      <BehindPresenter win={W_H2} bwFrom={45.43}><Giant text="02" at={45.43} /></BehindPresenter>
      <BehindPresenter win={W_H3} bwFrom={87.13}><Giant text="03" at={87.13} /></BehindPresenter>
      <BehindPresenter win={[127.84, 129.99]}><LogoGlow /></BehindPresenter>
      {/* in-front header graphics (absolute-time windows) */}
      <Win w={W_USP3}><Title lines={['KEY USPs']} at={8.45} y={1150} /><UspList /></Win>
      <Win w={W_H1}><Title lines={['THE FIRST', 'ONE IS…']} at={9.96} y={1180} /></Win>
      <Win w={W_H2}><Title lines={['SHARED MAID', 'QUARTERS']} at={46.6} y={1150} small="THE SECOND ONE" /></Win>
      <Win w={W_H3}><Title lines={['INTERNAL', 'CLOUD KITCHEN']} at={88.9} y={1150} small="THE THIRD ONE" /></Win>
      <Win w={W_CARD}><UspCard /></Win>
      {/* B-roll */}
      {PICKS.map((k, i) => (
        <Sequence key={k.id} name={k.id} from={sec(k.rec[0])} durationInFrames={sec(k.rec[1]) - sec(k.rec[0])}>
          {k.id === 'B10' ? <Pip k={k} /> : <BRoll k={k} i={i} />}
        </Sequence>
      ))}
      <OpenFlash />
      <Bug />
      <Captions hidden={HIDDEN} />
      <Sequence from={sec(VOICE_END)} durationInFrames={sec(TOTAL) - sec(VOICE_END)}><Outro /></Sequence>
    </AbsoluteFill>
  );
};
/** renders children only inside [a, b) on the absolute timeline (children animate on absolute seconds) */
const Win: React.FC<{ w: [number, number]; children: React.ReactNode }> = ({ w, children }) => {
  const t = useCurrentFrame() / FPS;
  return t >= w[0] && t < w[1] ? <AbsoluteFill>{children}</AbsoluteFill> : null;
};
