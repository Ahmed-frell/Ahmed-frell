import React from 'react';
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, interpolate } from 'remotion';
import { C, F, FPS } from './theme';
import { FullClip, KenBurns, Panel, Kinetic, Chip, Rule, Counter, ArtistTag, Bug, SageCard, Sheen, sec, prog } from './components';
import { TransitionIn, TransitionType } from './transitions';
import { Subtitles } from './Subtitles';

/* Times are absolute seconds on the video timeline (voice starts at 0.40 s).
 * V3 (2026-11-07): new client voiceover (transcript v4). Scenes written for Draft V2 keep their V2 times and are mapped
 * onto the new voice by a piecewise-linear time map anchored on every VO line (src/data/timemap_v3.json).
 * Scenes marked `v3: true` were (re)written for the changed lines and use V3 times directly
 * (measured from work/v4_line_timings.json + src/data/captions.json). */
import timemap from './data/timemap_v3.json';
const W = (t: number) => {
  const o = timemap.old, n = timemap.new;
  for (let i = 0; i < o.length - 1; i++) if (t >= o[i] && t <= o[i + 1]) return n[i] + (t - o[i]) * (n[i + 1] - n[i]) / (o[i + 1] - o[i]);
  return t;
};
type Scene = {
  id: string; start: number; end: number; tr: TransitionType; T?: number;
  tag?: string | null; bug?: boolean; v3?: boolean;
  render: (L: (abs: number) => number) => React.ReactNode;
};

const AI = "Artist's impression";
export const TOTAL = 92.7;          // V2 reference length (mapped below)
export const TOTAL_OUT = W(TOTAL); // V3 output length
// lines whose words are already shown as large on-screen statements (kept in the .srt)
export const SUPPRESS_SUBS = [1, 7, 18, 19, 20, 21];

export const SCENES: Scene[] = [
  { id: 'S01 hook · dream', start: 0, end: 2.0, tr: 'fromBlack', T: 12, tag: AI,
    render: (L) => (<>
      <KenBurns src="img/vision_dusk_aerial.jpg" z0={1.3} z1={1.16} dim={0.35} />
      <Kinetic text="ഒരു സ്വപ്നമുണ്ട്…" at={L(0.42)} stagger={0.18} y={780} size={104} font={F.mlSerif} weight={700} />
    </>) },
  { id: 'S02 Singapore · Dubai · Malappuram', start: 2.0, end: 8.8, tr: 'zoomBlur', tag: AI,
    render: (L) => (<>
      <FullClip src="clips/wt_aerial_open.mp4" x0={0.38} x1={0.62} z0={1.04} z1={1.12} dim={0.12} />
      <Kinetic text="SINGAPORE" at={L(3.2)} y={430} size={54} font={F.sans} weight={500} spacing={14} out={L(8.3)} />
      <Kinetic text="DUBAI" at={L(4.2)} y={510} size={54} font={F.sans} weight={500} spacing={14} out={L(8.3)} />
      <Rule at={L(5.0)} y={610} w={300} />
      <Kinetic text="MALAPPURAM" at={L(5.3)} y={640} size={104} font={F.serif} weight={700} spacing={6} out={L(8.3)} />
      <Kinetic text="ലോകോത്തര നിലവാരത്തിലേക്ക്" at={L(5.9)} y={780} size={46} font={F.mlSerif} weight={600} out={L(8.3)} />
    </>) },
  { id: 'S03 Mission Malappuram 2050', start: 8.8, end: 12.8, tr: 'bloom', T: 16, tag: null,
    render: (L) => <MissionLogo L={L} /> },
  { id: 'S04a IIT Madras · 3G IRPS', start: 12.46, end: 18.05, tr: 'wipeDown', tag: 'Master plan · indicative', v3: true,
    render: (L) => <Research L={L} /> },
  { id: 'S04b1 Dr. Sahid Cholayil · research vision', start: 18.05, end: 22.3, tr: 'leaf', tag: AI, v3: true,
    render: (L) => (<>
      <FullClip src="clips/wt_arbour_garden.mp4" x0={0.42} x1={0.55} z0={1.02} z1={1.1} dim={0.32} />
      <FounderCard at={L(18.17)} />
      <Kinetic text="Research-driven vision" at={L(19.69)} y={720} size={68} font={F.serif} weight={600} italic color="#CFE8F2" />
    </>) },
  { id: 'S04b2 longevity science', start: 22.3, end: 26.54, tr: 'push', tag: AI, v3: true,
    render: (L) => (<>
      <FullClip src="clips/wt_amphitheatre.mp4" x0={0.5} x1={0.62} z0={1.02} z1={1.1} dim={0.3} />
      <Kinetic text="BASED ON" at={L(22.44)} y={420} size={28} font={F.sans} weight={600} spacing={10} />
      <Kinetic text="Longevity science" at={L(22.5)} stagger={0.14} y={470} size={104} font={F.serif} weight={700} maxWidth={960} />
      <Rule at={L(23.3)} y={610} w={300} />
      <Chip text="A movement for Malappuram" at={L(25.3)} y={650} size={28} accent="#9FD3E6" />
    </>) },
  { id: 'S05 premium community', start: 21.95, end: 27.95, tr: 'leaf', tag: AI,
    render: (L) => (<>
      <FullClip src="clips/wt_boulevard_people.mp4" x0={0.55} x1={0.42} z0={1.02} z1={1.1} dim={0.1} />
      <Kinetic text="A premium community" at={L(26.15)} y={520} size={88} font={F.serif} weight={600} italic />
      <Rule at={L(26.6)} y={640} w={240} />
    </>) },
  { id: 'S06 approach to the gate', start: 27.95, end: 31.95, tr: 'push', tag: AI,
    render: () => <FullClip src="clips/wt_gate_approach.mp4" startFrom={1.2} x0={0.52} x1={0.6} z0={1.0} z1={1.14} /> },
  { id: 'S07 BLUE ZONE HABITAT title', start: 31.95, end: 33.8, tr: 'bloom', T: 16, tag: null,
    render: (L) => <TitleLogo L={L} at={L(32.11)} /> },
  { id: 'S08a township · residential project', start: 37.95, end: 45.45, tr: 'zoomBlur', tag: AI, v3: true,
    render: (L) => (<>
      <FullClip src="clips/wt_township_aerial.mp4" x0={0.5} x1={0.4} z0={1.04} z1={1.0} dim={0.22} />
      <Kinetic text="HEART OF MALAPPURAM" at={L(38.1)} y={420} size={30} font={F.sans} weight={600} spacing={9} />
      <Chip text="Anakkayam · Manjeri" at={L(39.5)} y={485} size={26} accent="#C9E2A0" />
      <TownshipCard at={L(42.1)} sub={L(43.35)} />
    </>) },
  { id: 'S08b 51 signature villas', start: 45.45, end: 48.37, tr: 'zoomBlur', tag: 'Villa layout · indicative', v3: true,
    render: (L) => <FiftyOne L={L} /> },
  { id: 'S09 3 / 4 / 5 BHK', start: 48.37, end: 51.27, tr: 'push', tag: AI, bug: true, v3: true,
    render: (L) => <BHK L={L} /> },
  { id: 'S10 Gen Z · Gen Alpha', start: 43.0, end: 49.5, tr: 'leaf', tag: AI, bug: true,
    render: (L) => (<>
      <FullClip src="clips/wt_walkway_people.mp4" x0={0.45} x1={0.6} z0={1.02} z1={1.1} />
      <Chip text="Gen Z" at={L(43.5)} y={420} size={34} />
      <Chip text="Gen Alpha" at={L(44.4)} y={510} size={34} />
      <Kinetic text="Designed for future lifestyles" at={L(46.0)} y={620} size={70} font={F.serif} weight={600} italic maxWidth={860} />
    </>) },
  { id: 'S11 work-from-nature office', start: 49.5, end: 52.65, tr: 'push', tag: AI, bug: true,
    render: (L) => (<>
      <KenBurns src="img/sage_texture.jpg" z0={1.3} z1={1.2} />
      <AbsoluteFill style={{ background: 'rgba(15,29,12,0.82)' }} />
      <Kinetic text="WORK FROM HOME" at={L(49.6)} y={360} size={40} font={F.sans} weight={600} spacing={10} />
      <Panel src="clips/ch_office.mp4" video x={60} y={470} w={960} h={620} at={L(49.6)} from="up" />
      <Kinetic text="Dedicated office space" at={L(50.8)} y={1130} size={66} font={F.serif} weight={600} italic />
      <Kinetic text="PLANNED IN THE CLUBHOUSE" at={L(51.2)} y={1225} size={24} font={F.sans} weight={500} spacing={6} color="rgba(255,255,255,0.75)" />
    </>) },
  { id: 'S12 people + nature design', start: 52.65, end: 57.4, tr: 'leaf', tag: AI, bug: true,
    render: (L) => (<>
      <FullClip src="clips/vi_living.mp4" rate={0.96} x0={0.5} x1={0.4} z0={1.03} z1={1.1} dim={0.3} />
      <Kinetic text="PEOPLE  +  NATURE" at={L(52.75)} stagger={0.5} y={430} size={60} font={F.sans} weight={500} spacing={12} />
      <Rule at={L(53.8)} y={530} w={320} />
      <Kinetic text="Materials & design philosophy" at={L(55.3)} y={560} size={64} font={F.serif} weight={600} italic maxWidth={880} />
    </>) },
  { id: 'S13 ~43% planned open space', start: 57.4, end: 63.05, tr: 'zoomBlur', tag: AI, bug: true,
    render: (L) => (<>
      <FullClip src="clips/wt_aerial_green.mp4" x0={0.4} x1={0.58} z0={1.02} z1={1.12} dim={0.25} />
      <Counter to={43} start={L(57.6)} land={L(58.6)} y={360} size={230} prefix="~" suffix="%" />
      <Kinetic text="PLANNED OPEN SPACE & GREENERY" at={L(58.9)} y={660} size={32} font={F.sans} weight={600} spacing={7} maxWidth={900} />
      <Kinetic text="approx. · as per current plan" at={L(59.6)} y={720} size={24} font={F.sans} weight={400} spacing={3} color="rgba(255,255,255,0.8)" />
    </>) },
  { id: 'S14 Garden Ethen', start: 63.05, end: 65.4, tr: 'leaf', tag: AI, bug: true,
    render: (L) => (<>
      <FullClip src="clips/wt_zen_garden.mp4" x0={0.48} x1={0.4} z0={1.04} z1={1.1} />
      <GardenTitle L={L} name="Garden Ethen" sub="Calm, mindful landscape" at={L(63.6)} />
    </>) },
  { id: 'S15 Garden Elara', start: 65.4, end: 68.4, tr: 'push', tag: AI, bug: true,
    render: (L) => (<>
      <FullClip src="clips/wt_playground.mp4" x0={0.5} x1={0.62} z0={1.04} z1={1.1} />
      <GardenTitle L={L} name="Garden Elara" sub="Children & family garden" at={L(66.6)} />
    </>) },
  { id: 'S16a clubhouse exterior', start: 68.4, end: 70.0, tr: 'zoomBlur', tag: AI, bug: true,
    render: () => <FullClip src="clips/ch_exterior.mp4" x0={0.42} x1={0.52} z0={1.0} z1={1.08} /> },
  { id: 'S16b clubhouse: fitness · family', start: 70.0, end: 72.5, tr: 'wipeUp', tag: AI, bug: true,
    render: (L) => (<>
      <AbsoluteFill style={{ background: C.forest }} />
      <Kinetic text="PREMIUM CLUBHOUSE" at={L(70.9)} y={300} size={38} font={F.sans} weight={600} spacing={10} />
      <Panel src="clips/ch_hall.mp4" video x={60} y={370} w={960} h={330} at={L(70.0)} from="right"><PanelLabel text="Family gatherings" /></Panel>
      <Panel src="clips/ch_pool.mp4" video rate={0.9} x={60} y={720} w={960} h={330} at={L(70.25)} from="left"><PanelLabel text="Pool" /></Panel>
      <Panel src="clips/ch_gym.mp4" video rate={0.7} x={60} y={1070} w={960} h={330} at={L(70.5)} from="right"><PanelLabel text="Fitness" /></Panel>
    </>) },
  { id: 'S17 science · technology · nature', start: 72.5, end: 77.9, tr: 'leaf', tag: AI, bug: true,
    render: (L) => (<>
      <FullClip src="clips/wt_palm_boulevard.mp4" x0={0.45} x1={0.55} z0={1.02} z1={1.1} dim={0.08} />
      <Chip text="Science" at={L(72.6)} y={400} size={34} accent="#9FD3E6" />
      <Chip text="Technology" at={L(73.3)} y={490} size={34} accent="#C9E2A0" />
      <Chip text="Nature" at={L(74.25)} y={580} size={34} accent="#8FCB6B" />
      <Kinetic text="A new lifestyle" at={L(76.4)} y={690} size={84} font={F.serif} weight={600} italic />
    </>) },
  { id: 'S18 statement: not just a villa', start: 77.9, end: 80.05, tr: 'fade', T: 12, tag: AI,
    render: (L) => (<>
      <FullClip src="clips/wt_villa_curves.mp4" x0={0.5} x1={0.42} z0={1.06} z1={1.12} dim={0.42} />
      <Kinetic text="ഇത് വെറുമൊരു villa അല്ല…" at={L(78.0)} stagger={0.16} y={820} size={74} font={F.mlSerif} weight={700} maxWidth={940} />
    </>) },
  { id: 'S19 statement: future lifestyle', start: 80.05, end: 83.1, tr: 'zoomBlur', tag: AI,
    render: (L) => (<>
      <FullClip src="clips/ch_roof.mp4" x0={0.5} x1={0.44} z0={1.0} z1={1.08} dim={0.42} />
      <Kinetic text="ഭാവിയിലേക്ക് ചിന്തിച്ചൊരു" at={L(80.12)} stagger={0.3} y={760} size={70} font={F.mlSerif} weight={700} maxWidth={960} />
      <Kinetic text="ജീവിതരീതിയാണ്." at={L(81.6)} y={870} size={84} font={F.mlSerif} weight={700} color="#D9EBB4" />
    </>) },
  { id: 'S20 logo + tagline', start: 83.1, end: 86.95, tr: 'bloom', T: 16, tag: null,
    render: (L) => (<>
      <TitleLogo L={L} at={L(83.19)} hold moveAt={L(86.1)} />
      <Kinetic text="Where Peace Meets Luxury" at={L(84.87)} stagger={0.2} y={1110} size={72} font={F.serif} weight={600} italic color={C.leaf} shadow={false} out={L(86.35)} />
    </>) },
  { id: 'S21 CTA + contact', start: 86.95, end: TOTAL, tr: 'fade', T: 14, tag: null,
    render: (L) => <EndCard L={L} /> },
];

// ---------------------------------------------------------------- composite scenes
const PanelLabel: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: 'absolute', left: 34, bottom: 26, fontFamily: F.sans, fontWeight: 600, fontSize: 30, letterSpacing: 6, color: '#fff', textTransform: 'uppercase', textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>{text}</div>
);

const GardenTitle: React.FC<{ L: (a: number) => number; name: string; sub: string; at: number }> = ({ name, sub, at }) => {
  const f = useCurrentFrame(); const p = prog(f, at, at + 0.7);
  return (<>
    <div style={{ position: 'absolute', top: 440, width: 1080, display: 'flex', justifyContent: 'center', opacity: p }}>
      <div style={{ padding: '26px 54px 20px', borderRadius: 30, background: 'rgba(12,24,12,0.38)', backdropFilter: 'blur(16px)', border: '1.5px solid rgba(255,255,255,0.3)', textAlign: 'center', transform: `translateY(${(1 - p) * 24}px)` }}>
        <div style={{ fontFamily: F.serif, fontWeight: 700, fontSize: 92, color: C.white, lineHeight: 1 }}>{name}</div>
        <div style={{ fontFamily: F.sans, fontWeight: 500, fontSize: 24, letterSpacing: 5, color: 'rgba(255,255,255,0.85)', marginTop: 14, textTransform: 'uppercase' }}>{sub}</div>
      </div>
    </div>
  </>);
};

const MissionLogo: React.FC<{ L: (a: number) => number }> = ({ L }) => {
  const f = useCurrentFrame();
  const p = prog(f, L(9.75), L(10.6));
  const rot = f * 0.12;
  return (
    <AbsoluteFill>
      <KenBurns src="img/vision_dusk_aerial.jpg" z0={1.35} z1={1.25} blur={14} dim={0.62} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 46%, rgba(201,162,39,0.22) 0%, rgba(0,0,0,0) 70%)' }} />
      <svg width={1080} height={1920} style={{ position: 'absolute', opacity: 0.55 * p }}>
        {[260, 330, 400].map((r, i) => (
          <circle key={r} cx={540} cy={880} r={r} fill="none" stroke={C.gold} strokeWidth={1.5} strokeDasharray={`${4 + i * 3} ${14 + i * 6}`}
            transform={`rotate(${rot * (i % 2 ? -1 : 1)} 540 880)`} />
        ))}
      </svg>
      <Img src={staticFile('brand/mission-malappuram-2050-logo.png')} style={{
        position: 'absolute', left: 540 - 400, top: 880 - 137, width: 800, opacity: p,
        transform: `scale(${0.88 + 0.12 * p})`, filter: `blur(${(1 - p) * 10}px) drop-shadow(0 8px 30px rgba(0,0,0,0.5))`,
      }} />
      <Sheen at={L(10.6)} dur={1.3} />
    </AbsoluteFill>
  );
};

const Research: React.FC<{ L: (a: number) => number }> = ({ L }) => {
  const f = useCurrentFrame();
  const scan = ((f / FPS) * 260) % 2100 - 100;
  return (
    <AbsoluteFill>
      <KenBurns src="img/masterplan_vertical.jpg" z0={1.08} z1={1.22} oy0={20} oy1={70} blur={3} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(8,26,34,0.88) 0%, rgba(8,26,34,0.72) 50%, rgba(8,26,34,0.6) 75%, rgba(8,26,34,0.8) 100%)' }} />
      <AbsoluteFill style={{ backgroundImage: 'linear-gradient(rgba(159,211,230,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(159,211,230,0.10) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div style={{ position: 'absolute', top: scan, left: 0, width: 1080, height: 3, background: 'linear-gradient(90deg, transparent, rgba(159,211,230,0.9), transparent)', boxShadow: '0 0 24px rgba(159,211,230,0.7)' }} />
      <Kinetic text="INCUBATED AT IIT MADRAS RESEARCH PARK" at={L(12.65)} stagger={0.06} y={430} size={26} font={F.sans} weight={500} spacing={5} maxWidth={940} />
      <Rule at={L(14.4)} y={500} w={420} color="rgba(159,211,230,0.85)" />
      <Kinetic text="3G IRPS" at={L(15.95)} y={560} size={170} font={F.serif} weight={700} spacing={4} />
    </AbsoluteFill>
  );
};

const TownshipCard: React.FC<{ at: number; sub: number }> = ({ at, sub }) => {
  const f = useCurrentFrame(); const p = prog(f, at, at + 0.7); const q = prog(f, sub, sub + 0.5);
  return (
    <div style={{ position: 'absolute', top: 580, width: 1080, display: 'flex', justifyContent: 'center', opacity: p }}>
      <div style={{ padding: '28px 56px 24px', borderRadius: 30, background: 'rgba(12,24,12,0.5)', backdropFilter: 'blur(16px)', border: '1.5px solid rgba(255,255,255,0.3)', textAlign: 'center', transform: `translateY(${(1 - p) * 24}px)` }}>
        <div style={{ fontFamily: F.serif, fontWeight: 600, fontStyle: 'italic', fontSize: 80, color: C.white, lineHeight: 1.05 }}>Part of a planned township</div>
        <div style={{ width: 140 * q, height: 2, background: 'rgba(255,255,255,0.7)', margin: '18px auto 14px' }} />
        <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 28, letterSpacing: 9, color: 'rgba(255,255,255,0.92)', opacity: q }}>RESIDENTIAL PROJECT</div>
      </div>
    </div>
  );
};

const FounderCard: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame(); const p = prog(f, at, at + 0.7);
  return (
    <div style={{ position: 'absolute', top: 420, width: 1080, display: 'flex', justifyContent: 'center', opacity: p }}>
      <div style={{ padding: '30px 60px 24px', borderRadius: 30, background: 'rgba(12,24,12,0.42)', backdropFilter: 'blur(16px)', border: '1.5px solid rgba(255,255,255,0.3)', textAlign: 'center', transform: `translateY(${(1 - p) * 24}px)` }}>
        <div style={{ fontFamily: F.serif, fontWeight: 700, fontSize: 86, color: C.white, lineHeight: 1 }}>Dr. Sahid Cholayil</div>
        <div style={{ width: 120 * p, height: 2, background: 'rgba(255,255,255,0.7)', margin: '18px auto 14px' }} />
        <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 26, letterSpacing: 7, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase' }}>Founder · 3G IRPS</div>
      </div>
    </div>
  );
};

const TitleLogo: React.FC<{ L: (a: number) => number; at: number; hold?: boolean; moveAt?: number }> = ({ at, hold, moveAt }) => {
  const f = useCurrentFrame();
  const p = prog(f, at - 0.15, at + 0.75);
  const leaf = prog(f, at - 0.15, at + 0.5);
  const m = moveAt !== undefined ? prog(f, moveAt, moveAt + 0.6) : 0;   // glide to the end-card logo slot
  const w = 660 + (420 - 660) * m; const top = (hold ? 560 : 640) + (270 - (hold ? 560 : 640)) * m;
  return (
    <SageCard>
      <Img src={staticFile('brand/bluezone-logo-green.png')} style={{
        position: 'absolute', left: 540 - w / 2, top, width: w, opacity: p,
        transform: `scale(${0.9 + 0.1 * p})`, filter: `blur(${(1 - leaf) * 12}px)`,
      }} />
      <Sheen at={at + 0.6} dur={1.2} />
    </SageCard>
  );
};

const FiftyOne: React.FC<{ L: (a: number) => number }> = ({ L }) => {
  const f = useCurrentFrame();
  const plan = prog(f, L(45.3), L(45.95));
  const sweep = prog(f, L(45.9), L(48.0));
  return (
    <SageCard>
      <Img src={staticFile('img/villa_plot_plan.png')} style={{
        position: 'absolute', left: 140, top: 590, width: 800, borderRadius: 22, opacity: plan,
        transform: `scale(${0.94 + 0.06 * plan + 0.03 * sweep})`, boxShadow: '0 20px 60px rgba(30,50,20,0.25)',
      }} />
      <div style={{ position: 'absolute', left: 140, top: 590, width: 800, height: 740, borderRadius: 22, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(115deg, rgba(255,255,255,0) ${sweep * 140 - 40}%, rgba(255,252,235,0.55) ${sweep * 140 - 22}%, rgba(255,255,255,0) ${sweep * 140 - 4}%)`, mixBlendMode: 'screen' }} />
      </div>
      <Counter to={51} start={L(45.35)} land={L(46.05)} y={360} size={170} color={C.leaf} />
      <Kinetic text="PREMIUM SIGNATURE VILLAS" at={L(45.95)} y={535} size={28} font={F.sans} weight={600} spacing={8} color={C.leaf} shadow={false} />
    </SageCard>
  );
};

const BHK: React.FC<{ L: (a: number) => number }> = ({ L }) => (
  <AbsoluteFill style={{ background: C.forest }}>
    <Panel src="img/villa_3bhk_neura.jpg" x={60} y={345} w={960} h={330} at={L(48.43)} from="right"><BhkLabel n="3" model="Neura" /></Panel>
    <Panel src="img/villa_4bhk_quantra.jpg" x={60} y={700} w={960} h={330} at={L(48.82)} from="left"><BhkLabel n="4" model="Quantra · Aurexa" /></Panel>
    <Panel src="img/villa_5bhk_lynora.jpg" x={60} y={1055} w={960} h={330} at={L(49.28)} from="right"><BhkLabel n="5" model="Lynora" /></Panel>
  </AbsoluteFill>
);
const BhkLabel: React.FC<{ n: string; model: string }> = ({ n, model }) => (
  <div style={{ position: 'absolute', left: 36, top: 70, color: '#fff', textShadow: '0 3px 16px rgba(0,0,0,0.6)' }}>
    <div style={{ fontFamily: F.serif, fontWeight: 700, fontSize: 110, lineHeight: 0.95, fontVariantNumeric: 'lining-nums', fontFeatureSettings: '"lnum" 1' }}>{n}<span style={{ fontSize: 50, marginLeft: 12, fontFamily: F.sans, fontWeight: 600, letterSpacing: 4 }}>BHK</span></div>
    <div style={{ fontFamily: F.sans, fontWeight: 500, fontSize: 24, letterSpacing: 6, textTransform: 'uppercase', marginTop: 10, opacity: 0.9 }}>{model}</div>
  </div>
);

const EndCard: React.FC<{ L: (a: number) => number }> = ({ L }) => {
  const f = useCurrentFrame();
  const btn = prog(f, L(87.6), L(88.3));
  const fadeOut = interpolate(f / FPS, [L(TOTAL - 0.7), L(TOTAL)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <SageCard>
      <Img src={staticFile('brand/bluezone-logo-green.png')} style={{ position: 'absolute', left: 540 - 210, top: 270, width: 420 }} />
      <Kinetic text="Book a project walkthrough" at={L(87.12)} stagger={0.12} y={630} size={66} font={F.serif} weight={600} italic color={C.leaf} shadow={false} />
      <div style={{ position: 'absolute', top: 760, width: 1080, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: btn, transform: `translateY(${(1 - btn) * 20}px)` }}>
        <div style={{ padding: '22px 52px', borderRadius: 999, background: C.leaf, color: C.white, fontFamily: F.sans, fontWeight: 600, fontSize: 46, letterSpacing: 3, boxShadow: '0 14px 40px rgba(30,50,20,0.35)' }}>
          +91 73565 23534
        </div>
        <div style={{ marginTop: 26, fontFamily: F.sans, fontWeight: 500, fontSize: 34, letterSpacing: 3, color: C.leaf }}>bluezonehabitat.com</div>
        <div style={{ marginTop: 10, fontFamily: F.sans, fontWeight: 400, fontSize: 24, letterSpacing: 5, color: 'rgba(46,74,20,0.8)', textTransform: 'uppercase' }}>Anakkayam · Manjeri · Malappuram</div>
      </div>
      <div style={{ position: 'absolute', top: 1170, left: 150, width: 780, height: 130, borderRadius: 24, background: 'rgba(255,255,255,0.82)', boxShadow: '0 10px 30px rgba(30,50,20,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 44, opacity: prog(f, L(88.2), L(88.9)) }}>
        <Img src={staticFile('brand/mission-malappuram-2050-logo.png')} style={{ height: 78, filter: 'brightness(0.8) saturate(1.2)' }} />
        <div style={{ width: 1.5, height: 70, background: 'rgba(46,74,20,0.35)' }} />
        <Img src={staticFile('brand/genius-infravision-logo.png')} style={{ height: 62 }} />
      </div>
      <AbsoluteFill style={{ backgroundColor: '#000', opacity: fadeOut }} />
    </SageCard>
  );
};

// ---------------------------------------------------------------- master timeline
export const Reel: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {SCENES.map((s) => {
        const T = s.T ?? (s.tr === 'cut' ? 0 : 14);
        const M = s.v3 ? (t: number) => t : W;           // V2-timed scenes follow the new voice via the time map
        const from = Math.max(0, sec(M(s.start)) - Math.floor(T / 2));
        const end = s.id.startsWith('S21') ? TOTAL_OUT : M(s.end);
        const dur = sec(end) - from + Math.ceil(T / 2);
        const fromSec = from / FPS;
        const L = (abs: number) => M(abs) - fromSec;
        return (
          <Sequence key={s.id} name={s.id} from={from} durationInFrames={dur}>
            <TransitionIn type={s.tr} T={T}>
              {s.render(L)}
              {s.tag && <ArtistTag text={s.tag} />}
              {s.bug && <Bug />}
            </TransitionIn>
          </Sequence>
        );
      })}
      <Subtitles suppress={SUPPRESS_SUBS} />
    </AbsoluteFill>
  );
};
