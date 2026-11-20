import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G, FONT, FPS, SHADOW, isML } from './theme';

/** One designed text element (render/src/data/fx.json). Every parameter is data:
 *  text · font · size · weight · italic · colour · tracking · position (x, y, w, align) · start/dur (s) ·
 *  enter (rise | type | fly | overshoot | box | track | morph | none) · exit (rise | fade | morph | none) ·
 *  stagger (frames) · enterDur/exitDur (frames) · ease (expo | back | cubic) · blur (motion blur on/off) ·
 *  box colour · marker · leader line · sfx + sfxAt (consumed by the mixer, frame-aligned to the impact).
 *  Malayalam is animated per WORD only (splitting code points would break conjunct shaping). */
export type FxText = {
  id: string; text: string; start: number; dur: number; font: 'serif' | 'sans' | 'mlSerif' | 'mlSans'; size: number; weight: number;
  color: string; tracking: number; x: number; y: number; w: number; align: 'left' | 'center' | 'right'; enter: string; exit: string;
  stagger: number; enterDur: number; exitDur: number; ease: string; blur: boolean; box: string | null; italic: boolean;
  marker?: boolean; leader?: boolean; layer?: string;
};

const EASE: Record<string, (t: number) => number> = {
  expo: Easing.bezier(0.16, 1, 0.3, 1),
  back: Easing.bezier(0.34, 1.56, 0.64, 1),
  cubic: Easing.bezier(0.33, 1, 0.68, 1),
};
const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

export const TextFx: React.FC<{ e: FxText }> = ({ e }) => {
  const f = useCurrentFrame(); const t = f / FPS;
  if (t < e.start - 0.05 || t >= e.start + e.dur) return null;
  const lf = (t - e.start) * FPS;                       // local frame
  const endF = e.dur * FPS;
  const ease = EASE[e.ease] ?? EASE.expo;
  const ml = isML(e.text) || e.font.startsWith('ml');
  const family = FONT[e.font] ?? FONT.serif;
  // exit progress (0 = fully in, 1 = gone)
  const xo = e.exit === 'none' ? 0 : interpolate(lf, [endF - e.exitDur, endF], [0, 1], clamp);
  const words = e.text.split(' ');
  // unit list: letters for latin type/fly, words otherwise
  const perLetter = !ml && (e.enter === 'type' || e.enter === 'fly');
  let idx = 0;

  const unit = (u: string, i: number, key: string) => {
    const p = ease(interpolate(lf - i * e.stagger, [0, e.enterDur], [0, 1], clamp));
    const lin = interpolate(lf - i * e.stagger, [0, e.enterDur], [0, 1], clamp);
    let st: React.CSSProperties = { display: 'inline-block', whiteSpace: 'pre' };
    let inner: React.CSSProperties = {};
    let mask = false;
    switch (e.enter) {
      case 'rise': mask = true; inner = { transform: `translateY(${(1 - p) * 110}%)` }; break;              // masked text reveal (vertical)
      case 'type': st = { ...st, opacity: interpolate(lf - i * e.stagger, [0, 2], [0, 1], clamp) }; break;   // typewriter (T2)
      case 'fly': {                                                                                           // letter fly-in with motion blur (T9)
        const v = 1 - p;
        st = { ...st, opacity: Math.min(1, lin * 2.5), transform: `translateX(${v * 140}px) scaleX(${1 + 0.45 * v * (e.blur ? 1 : 0)})`,
          filter: e.blur ? `blur(${v * 7}px)` : undefined, transformOrigin: 'left center' };
        break;
      }
      case 'overshoot': st = { ...st, transform: `scale(${0.3 + 0.7 * p})`, filter: e.blur ? `blur(${(1 - lin) * 10}px)` : undefined, opacity: Math.min(1, lin * 3) }; break;
      case 'track': st = { ...st, opacity: lin, filter: `blur(${(1 - lin) * 6}px)` }; break;
      case 'morph': st = { ...st, opacity: lin, transform: `scaleY(${0.55 + 0.45 * p}) translateY(${(1 - p) * 18}px)`, filter: `blur(${(1 - lin) * 12}px)` }; break;
      default: break;
    }
    // exits
    if (e.exit === 'rise' && xo > 0) { mask = true; inner = { ...inner, transform: `translateY(${-EASE.expo(xo) * 110}%)` }; }
    if (e.exit === 'fade') st = { ...st, opacity: (st.opacity as number ?? 1) * (1 - xo) };
    if (e.exit === 'morph' && xo > 0) st = { ...st, opacity: (st.opacity as number ?? 1) * (1 - xo), transform: `${st.transform ?? ''} scaleY(${1 + 0.5 * xo})`, filter: `blur(${xo * 12}px)` };
    if (mask) {
      return (<span key={key} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', paddingBottom: '0.08em', marginBottom: '-0.08em', ...st }}>
        <span style={{ display: 'inline-block', whiteSpace: 'pre', ...inner }}>{u}</span></span>);
    }
    return <span key={key} style={st}>{u}</span>;
  };

  const content = words.map((wd, wi) => {
    const sp = wi < words.length - 1 ? ' ' : '';
    if (perLetter && !isML(wd)) {
      return <span key={wi} style={{ display: 'inline-block', whiteSpace: 'pre' }}>{[...(wd + sp)].map((ch, ci) => unit(ch, idx++, `${wi}-${ci}`))}</span>;
    }
    return unit(wd + sp, idx++, `${wi}`);
  });

  // tracking expansion (airy)
  const trackP = e.enter === 'track' ? EASE.expo(interpolate(lf, [0, e.enterDur], [0, 1], clamp)) : 1;
  const tracking = e.tracking + (1 - trackP) * 22;
  // box wipe (T10): holly box sweeps L->R, text is revealed by the same wipe
  const boxP = e.enter === 'box' ? EASE.expo(interpolate(lf, [0, e.enterDur], [0, 1], clamp)) : 1;
  const boxOut = e.box && e.exit === 'rise' ? xo : 0;
  const block: React.CSSProperties = {
    position: 'absolute', left: e.x, top: e.y, width: e.w, textAlign: e.align, fontFamily: family, fontWeight: e.weight, fontSize: e.size,
    fontStyle: e.italic ? 'italic' : 'normal', color: e.color, letterSpacing: tracking, lineHeight: ml ? 1.35 : 1.04, textShadow: e.box ? undefined : SHADOW,
    fontVariantNumeric: 'lining-nums', fontFeatureSettings: '"lnum" 1',
  };
  if (e.box) {
    return (
      <div style={{ ...block, textShadow: undefined, display: 'flex', justifyContent: e.align === 'left' ? 'flex-start' : e.align === 'right' ? 'flex-end' : 'center' }}>
        <div style={{ position: 'relative', padding: '0.16em 0.5em 0.12em', clipPath: `inset(0 ${(1 - boxP) * 100}% 0 ${boxOut * 100}%)` }}>
          <div style={{ position: 'absolute', inset: 0, background: e.box, borderRadius: 6, boxShadow: '0 10px 30px rgba(0,0,0,0.35)', borderLeft: `5px solid ${G.pistachio}` }} />
          <span style={{ position: 'relative' }}>{e.text}</span>
        </div>
      </div>
    );
  }
  return (
    <div style={block}>
      {content}
      {e.marker && <Marker lf={lf - e.enterDur} />}
      {e.leader && <Leader lf={lf} />}
    </div>
  );
};

/** hand-drawn marker ellipse (reference T6) in pistachio */
export const Marker: React.FC<{ lf: number }> = ({ lf }) => {
  const p = Easing.out(Easing.quad)(interpolate(lf, [0, 11], [0, 1], clamp));
  return (
    <svg viewBox="0 0 200 100" preserveAspectRatio="none" style={{ position: 'absolute', left: '8%', top: '-8%', width: '84%', height: '120%', overflow: 'visible', pointerEvents: 'none' }}>
      <path d="M 104 10 C 180 8, 198 42, 188 64 C 176 94, 36 96, 12 70 C -8 44, 28 8, 116 14" fill="none" stroke={G.pistachio} strokeWidth={4.5}
        strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
    </svg>
  );
};
/** floating architectural label leader: dot + thin line drawn toward the building */
const Leader: React.FC<{ lf: number }> = ({ lf }) => {
  const p = EASE.expo(interpolate(lf, [2, 14], [0, 1], clamp));
  return (
    <svg width={420} height={420} style={{ position: 'absolute', left: -300, top: 40, overflow: 'visible' }}>
      <line x1={290} y1={10} x2={290 - 230 * p} y2={10 + 330 * p} stroke={G.ivory} strokeWidth={2.5} />
      <circle cx={290 - 230 * p} cy={10 + 330 * p} r={9 * p} fill={G.pistachio} stroke={G.holly} strokeWidth={2} />
    </svg>
  );
};
