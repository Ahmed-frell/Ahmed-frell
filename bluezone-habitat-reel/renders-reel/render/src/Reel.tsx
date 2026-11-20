import React from 'react';
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Counter, Move, Outro, Pin, Planned, Scatter, Tag, Title, TitleSpec, Typewriter } from './Fx';
import { CREAM, FONT, G, SHADOW, TOTAL, f, raw } from './theme';

// Shot list: times in seconds, timed to the voiceover (work/vo/timing.json). xin = 10-frame dissolve in (scene change).
import SHOTS_JSON from './shots.json';
// Camera moves are pre-rendered into public/bg.mp4 by tools/render_bg.py from the same shots.json (sub-pixel, antialiased).
type Shot = { id: string; src: string; from: number; to: number; move: Move; xin?: boolean; tag?: string };
export const SHOTS = SHOTS_JSON.shots as Shot[];
export const OUTRO_FROM = SHOTS_JSON.outroFrom;

const it = (text: string, size = 84) => ({ text, kind: 'italic' as const, size });
const bd = (text: string, size = 118) => ({ text, kind: 'bold' as const, size });
export const TITLES: TitleSpec[] = [
  { id: 't1', from: f(0.9), to: f(6.9), top: 1120, lines: [it('Premium Lifestyle', 92), bd('& Longevity', 150)] },
  { id: 't2a0', from: f(11.3), to: f(17.1), top: 520, scrim: 0.5, lines: [{ text: 'Inspired by longevity science', kind: 'caps', size: 34, track: 5 }] },
  { id: 't2a', from: f(14.2), to: f(17.1), top: 600, lines: [it('Introducing', 76), bd('Blue Zone Habitat', 124)] },
  { id: 't2b', from: f(17.9), to: f(21.95), top: 560, scrim: 0.62, lines: [it('Bluezone-Inspired', 88), bd('Living in Malappuram', 102)] },
  { id: 't2c', from: f(22.6), to: f(26.55), top: 1150, lines: [it('Inspired by', 80), bd('The Blue Zones', 132)] },
  { id: 't3a', from: f(27.5), to: f(33.3), top: 560, lines: [it('In harmony', 92), bd('With Nature', 150)] },
  { id: 't4a', from: f(42.4), to: f(49.95), top: 600, planned: f(43.6), lines: [it('Longevity Wellness Club', 74), bd('Gym & Swimming Pool', 104)] },
  { id: 't4b', from: f(50.8), to: f(58.45), top: 560, planned: f(52.0), lines: [it('In-House Cloud Kitchen', 78), bd('No More Morning Rush!', 94)] },
  { id: 't5a', from: f(59.4), to: f(64.85), top: 600, planned: f(60.6), lines: [it('Solar-Powered', 92), bd('Living', 170)] },
  { id: 't5b', from: f(65.7), to: f(70.2), top: 1100, planned: f(66.9), plannedLabel: 'PLANNED SOLAR COMMUNITY', lines: [it('A smart choice', 96)] },
  { id: 't6a', from: f(71.1), to: f(75.6), top: 600, lines: [it('Future-Ready', 96), bd('Workspaces', 150)] },
  { id: 't7a', from: f(81.5), to: f(85.85), top: 1210, lines: [it('Designed for', 84), bd('Gen Z, Alpha & Beta', 120)] },
];

const Shots: React.FC = () => <OffthreadVideo src={staticFile('bg.mp4')} muted />;

const CurrentTag: React.FC = () => {
  const fr = useCurrentFrame();
  const s = SHOTS.find((x) => fr >= raw(x.from) && fr < raw(x.to));
  if (!s) return null;
  const o = interpolate(fr, [raw(s.from), raw(s.from) + 8], [0, 1], { extrapolateRight: 'clamp' });
  return <Tag text={s.tag ?? "Artist's impression"} o={o} />;
};

// 3 · "PREMIUM ATMOSPHERE" + big serif numerals (reference 2's "4 & 5" moment)
const VillaTypes: React.FC = () => {
  const fr = useCurrentFrame();
  const a = f(34.1), n = f(37.8), b = f(38.4), e = f(41.45);
  const vis = interpolate(fr, [a - 4, a + 8, e - 8, e + 2], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 860, height: 720, opacity: 0.5 * vis,
        background: 'radial-gradient(ellipse 75% 50% at 50% 50%, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 100%)' }} />
      <div style={{ position: 'absolute', left: 40, right: 40, top: 1010, display: 'flex', flexDirection: 'column', alignItems: 'center', filter: SHADOW }}>
        <Scatter line={{ text: 'Premium Atmosphere', kind: 'caps', size: 40, track: 10 }} start={a} end={e} seed="pa" />
        <Scatter line={{ text: '3, 4 & 5', kind: 'num', size: 250 }} start={n} end={e} seed="num" />
        <Scatter line={{ text: 'BHK Wellness Villas', kind: 'bold', size: 92 }} start={b} end={e} seed="bhk" />
      </div>
    </AbsoluteFill>
  );
};

// 6 · counter "51" + workspaces line
const Workspaces: React.FC = () => {
  const fr = useCurrentFrame();
  const s0 = f(75.3), land = f(76.2), e = f(80.6);
  const vis = interpolate(fr, [s0 - 4, s0 + 8, e - 8, e + 2], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 380, height: 820, opacity: 0.48 * vis,
        background: 'radial-gradient(ellipse 75% 50% at 50% 50%, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 100%)' }} />
      <div style={{ position: 'absolute', left: 40, right: 40, top: 470, display: 'flex', flexDirection: 'column', alignItems: 'center', filter: SHADOW }}>
        <Counter start={s0} land={land} end={e} to={51} size={330} />
        <Scatter line={{ text: 'Future-Ready Workspaces', kind: 'bold', size: 88 }} start={land - 2} end={e} seed="ws" />
        <div style={{ height: 10 }} />
        <Scatter line={{ text: 'Maid Quarters · Wellness Club', kind: 'italic', size: 56 }} start={f(77.4)} end={e} seed="mq" />
        <Planned start={f(78.2)} end={e} />
      </div>
    </AbsoluteFill>
  );
};

// 7 · "Contact For Site Visit" typewriter + phone
const SiteVisit: React.FC = () => {
  const fr = useCurrentFrame();
  const a = f(87.0), p = f(88.6), e = f(90.75);
  const po = interpolate(fr, [p, p + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) * interpolate(fr, [e - 8, e], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const vis = interpolate(fr, [a - 4, a + 8, e - 8, e + 2], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1000, height: 560, opacity: 0.45 * vis,
        background: 'radial-gradient(ellipse 75% 50% at 50% 50%, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 100%)' }} />
      <div style={{ position: 'absolute', left: 40, right: 40, top: 1150, display: 'flex', flexDirection: 'column', alignItems: 'center', filter: SHADOW }}>
        <Typewriter text="Contact For Site Visit" start={a} end={e} perChar={2}
          style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 64, color: '#FFFFFF', letterSpacing: 1 }} />
        <div style={{ marginTop: 18, opacity: po, transform: `translateY(${(1 - po) * 18}px)`, fontFamily: FONT.bold, fontSize: 104, letterSpacing: 3,
          backgroundImage: CREAM, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>+91 73565 23534</div>
      </div>
    </AbsoluteFill>
  );
};

export const Reel: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#000' }}>
    <Sequence durationInFrames={raw(OUTRO_FROM)} layout="none">
      <Shots />
      {/* soft edge vignette for legibility; no colour cast on the renders */}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.28) 100%)' }} />
      <CurrentTag />
      <Pin start={f(7.75)} end={f(10.6)} x={540} y={980} />
      {TITLES.map((t) => <Title key={t.id} t={t} />)}
      <VillaTypes />
      <Workspaces />
      <SiteVisit />
    </Sequence>
    <Sequence from={raw(OUTRO_FROM)} durationInFrames={raw(TOTAL - OUTRO_FROM)}>
      <Outro dur={raw(TOTAL - OUTRO_FROM)} />
    </Sequence>
    <Audio src={staticFile('mix.wav')} />
  </AbsoluteFill>
);
