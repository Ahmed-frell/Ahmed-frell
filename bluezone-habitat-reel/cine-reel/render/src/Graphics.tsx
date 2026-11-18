// Motion-graphic B-roll in the reference's style: an illustrated isometric map (Manjeri -> Anakkayam) and
// master-plan stats. The map is ILLUSTRATIVE (no distances, no exact pin: the site coordinates are not verified).
import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

const C = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const G = { holly: '#013408', crusoe: '#005B0D', grass: '#089F25', pistachio: '#B4F4A5', paper: '#F5F3E6' };
const SH = '0 2px 6px rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.35)';

// plane coordinates (px on a 1400 x 2400 ground)
const MANJERI = { x: 470, y: 1660 };
const SITE = { x: 930, y: 700 };
const ROUTE = 'M470 1660 C 520 1520, 640 1470, 660 1330 S 600 1120, 700 1010 S 900 900, 930 700';

const Trees: React.FC = () => (
  <>{Array.from({ length: 150 }).map((_, i) => {
    const x = random(`tx${i}`) * 1400, y = random(`ty${i}`) * 2400, r = 22 + random(`tr${i}`) * 30;
    if (Math.hypot(x - MANJERI.x, y - MANJERI.y) < 230) return null;
    const c = ['#7DB65A', '#6AA84B', '#8CC26A', '#5E9C44'][i % 4];
    return <g key={i}><circle cx={x + 5} cy={y + 8} r={r} fill="rgba(40,70,30,0.18)" /><circle cx={x} cy={y} r={r} fill={c} /><circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.45} fill="rgba(255,255,255,0.18)" /></g>;
  })}</>
);
const Town: React.FC = () => (
  <>{Array.from({ length: 46 }).map((_, i) => {
    const a = random(`ha${i}`) * Math.PI * 2, d = 40 + random(`hd${i}`) * 190;
    const x = MANJERI.x + Math.cos(a) * d, y = MANJERI.y + Math.sin(a) * d * 0.9, w = 26 + random(`hw${i}`) * 26;
    return <g key={i}><rect x={x + 5} y={y + 6} width={w} height={w * 0.8} fill="rgba(0,0,0,0.12)" rx={3} /><rect x={x} y={y} width={w} height={w * 0.8} fill={i % 3 ? '#F7F4EC' : '#E8DCC8'} stroke="#D9D2C2" rx={3} /></g>;
  })}</>
);

const BillboardPin: React.FC<{ x: number; y: number; at: number; label: string; sub?: string; brand?: boolean }> = ({ x, y, at, label, sub, brand }) => {
  const fr = useCurrentFrame(); const { fps } = useVideoConfig();
  const d = spring({ frame: fr - at, fps, config: { damping: 11, stiffness: 160 } });
  const card = spring({ frame: fr - at - 8, fps, config: { damping: 16, stiffness: 150 } });
  if (fr < at) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: y, transformStyle: 'preserve-3d', transform: 'rotateX(-55deg)', transformOrigin: '0 0' }}>
      <div style={{ position: 'absolute', left: -60, top: -170, width: 120, transform: `translateY(${(1 - d) * -320}px) scale(${0.6 + 0.4 * d})`, transformOrigin: '50% 100%' }}>
        <svg width={120} height={150} viewBox="0 0 96 120" style={{ filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.35))' }}>
          <path d="M48 4 C24 4 6 22 6 46 C6 76 48 116 48 116 C48 116 90 76 90 46 C90 22 72 4 48 4 Z" fill={brand ? G.holly : '#2F3A40'} stroke={brand ? G.pistachio : '#fff'} strokeWidth={3} />
          <circle cx={48} cy={45} r={brand ? 28 : 15} fill={brand ? G.paper : '#fff'} />
        </svg>
        {brand && <Img src={staticFile('brand/logo-green.png')} style={{ position: 'absolute', left: 31, top: 24, width: 58 }} />}
      </div>
      <div style={{ position: 'absolute', left: -230, width: 460, top: -250 - (brand ? 70 : 40), display: 'flex', justifyContent: 'center', opacity: card, transform: `translateY(${(1 - card) * 20}px)` }}>
        <div style={{ backgroundColor: brand ? G.holly : '#fff', color: brand ? G.paper : '#2F3A40', borderRadius: 18, padding: brand ? '14px 28px' : '10px 24px', textAlign: 'center', boxShadow: '0 8px 22px rgba(0,0,0,0.22)' }}>
          <div style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: brand ? 34 : 30 }}>{label}</div>
          {sub && <div style={{ fontFamily: 'Poppins', fontWeight: 400, fontSize: 24, opacity: 0.85, marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
};

export const MapShot: React.FC = () => {
  const fr = useCurrentFrame();
  const intro = interpolate(fr, [0, 20], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
  const draw = interpolate(fr, [16, 70], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) });
  const p = interpolate(fr, [0, 117], [0, 1], { ...C, easing: Easing.inOut(Easing.sin) });
  const rotZ = -14 + 10 * p, tilt = 58 - 6 * intro;
  const camX = -(MANJERI.x + (SITE.x - MANJERI.x) * draw * 0.85) + 700, camY = -(MANJERI.y + (SITE.y - MANJERI.y) * draw * 0.85) + 1200;
  const outO = interpolate(fr, [108, 117], [1, 0], C);
  return (
    <AbsoluteFill style={{ backgroundColor: '#EEF1E8', overflow: 'hidden', opacity: outO }}>
      <AbsoluteFill style={{ perspective: 1700, perspectiveOrigin: '50% 30%' }}>
        <div style={{ position: 'absolute', left: -160, top: -240, width: 1400, height: 2400, transformStyle: 'preserve-3d',
          transform: `scale(${1.25 - 0.15 * intro}) rotateX(${tilt}deg) rotateZ(${rotZ}deg) translate(${camX * 0.6}px, ${camY * 0.6}px)`, transformOrigin: '50% 50%' }}>
          <svg width={1400} height={2400} style={{ position: 'absolute', left: 0, top: 0 }}>
            <rect width={1400} height={2400} fill="#E6ECDB" />
            <path d="M-50 400 C 300 520, 260 900, 120 1200 S 260 1900, 80 2450" stroke="#BFDDE8" strokeWidth={70} fill="none" />
            <path d="M0 1700 L 1400 1550 M 470 1660 L 330 2400 M 470 1660 C 520 1520, 640 1470, 660 1330 S 600 1120, 700 1010 S 900 900, 930 700 L 1100 300 M 700 1010 L 1400 1150 M 0 900 L 660 1330"
              stroke="#FFFFFF" strokeWidth={30} fill="none" strokeLinecap="round" />
            <Trees />
            <Town />
            <path d="M840 600 L1040 610 L1060 780 L860 820 Z" fill="rgba(8,159,37,0.22)" stroke={G.grass} strokeWidth={6} strokeDasharray="18 12" />
            <path d={ROUTE} stroke="#F2A33A" strokeWidth={22} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} />
            <path d={ROUTE} stroke="#FFF3DC" strokeWidth={6} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} />
          </svg>
          <BillboardPin x={MANJERI.x} y={MANJERI.y} at={10} label="Manjeri" sub="town" />
          <BillboardPin x={SITE.x} y={SITE.y} at={72} label="Blue Zone Habitat" sub="Anakkayam" brand />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ top: 230, alignItems: 'center', opacity: interpolate(fr, [6, 20], [0, 1], C) }}>
        <div style={{ fontFamily: 'Allura', fontSize: 100, color: G.holly, lineHeight: 1 }}>Near Manjeri,</div>
        <div style={{ fontFamily: 'Poppins', fontWeight: 300, fontSize: 46, color: G.holly }}>close to nature</div>
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 300, textAlign: 'center', fontFamily: 'Poppins', fontWeight: 500, fontSize: 20, letterSpacing: 3, color: 'rgba(1,52,8,0.6)' }}>ILLUSTRATIVE MAP · NOT TO SCALE</div>
    </AbsoluteFill>
  );
};

const Ring: React.FC<{ pct: number; p: number }> = ({ pct, p }) => {
  const r = 120, c = 2 * Math.PI * r;
  return (
    <svg width={300} height={300} viewBox="0 0 300 300">
      <circle cx={150} cy={150} r={r} stroke="rgba(255,255,255,0.25)" strokeWidth={16} fill="none" />
      <circle cx={150} cy={150} r={r} stroke={G.pistachio} strokeWidth={16} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - (pct / 100) * p)} transform="rotate(-90 150 150)" />
      <text x={150} y={168} textAnchor="middle" fontFamily="Poppins" fontWeight={300} fontSize={64} fill="#fff">{Math.round(pct * p)}%</text>
    </svg>
  );
};
export const StatsShot: React.FC = () => {
  const fr = useCurrentFrame();
  const a = (s: number, d = 12) => interpolate(fr, [s, s + d], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
  const n = Math.round(51 * interpolate(fr, [9, 33], [0, 1], { ...C, easing: Easing.out(Easing.cubic) }));
  const ring = interpolate(fr, [42, 72], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
  const out = interpolate(fr, [104, 114], [1, 0], C);
  const series = ['NEURA', 'QUANTRA', 'AUREXA', 'LYNORA'];
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(1,52,8,0.55) 0%, rgba(1,52,8,0.35) 45%, rgba(1,52,8,0.65) 100%)', opacity: a(0, 10) }} />
      <div style={{ position: 'absolute', left: 52, top: 236, fontFamily: 'Poppins', fontWeight: 500, fontSize: 18, letterSpacing: 3, color: 'rgba(255,255,255,0.75)' }}>MASTER PLAN · INDICATIVE</div>
      <AbsoluteFill style={{ top: 430, alignItems: 'center' }}>
        <div style={{ opacity: a(6), fontFamily: 'Poppins', fontWeight: 200, fontSize: 260, color: '#fff', lineHeight: 0.9, textShadow: SH }}>{n}</div>
        <div style={{ opacity: a(14), fontFamily: 'Allura', fontSize: 92, color: '#fff', marginTop: -10, textShadow: SH }}>Luxury villas</div>
        <div style={{ height: 50 }} />
        <div style={{ opacity: a(40), transform: `scale(${0.9 + 0.1 * a(40)})` }}><Ring pct={43} p={ring} /></div>
        <div style={{ opacity: a(48), fontFamily: 'Poppins', fontWeight: 300, fontSize: 44, color: '#fff', textShadow: SH, marginTop: -6 }}>open green space</div>
        <div style={{ height: 46 }} />
        <div style={{ display: 'flex', gap: 14 }}>
          {series.map((s, i) => (
            <div key={s} style={{ opacity: a(78 + i * 4), transform: `translateY(${(1 - a(78 + i * 4)) * 16}px)`, border: `2px solid ${G.pistachio}`, color: '#fff', borderRadius: 30,
              padding: '10px 22px', fontFamily: 'Poppins', fontWeight: 500, fontSize: 26, letterSpacing: 3, backgroundColor: 'rgba(1,52,8,0.55)' }}>{s}</div>
          ))}
        </div>
        <div style={{ opacity: a(92), fontFamily: 'Poppins', fontWeight: 300, fontSize: 30, color: 'rgba(255,255,255,0.9)', marginTop: 16 }}>four villa series</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
