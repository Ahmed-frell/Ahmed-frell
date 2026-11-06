import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';

export type TransitionType = 'cut' | 'fade' | 'zoomBlur' | 'wipeDown' | 'wipeUp' | 'leaf' | 'bloom' | 'push' | 'fromBlack';
const e = Easing.bezier(0.65, 0, 0.35, 1);

/** Applies the incoming transition over the first `T` frames of a scene (scenes overlap by T frames). */
export const TransitionIn: React.FC<{ type: TransitionType; T: number; children: React.ReactNode }> = ({ type, T, children }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, Math.max(1, T)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e });
  if (type === 'cut' || p >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  let style: React.CSSProperties = {};
  let overlay: React.ReactNode = null;
  switch (type) {
    case 'fade': style = { opacity: p }; break;
    case 'fromBlack': style = { opacity: p }; break;
    case 'zoomBlur': style = { opacity: Math.min(1, p * 1.6), transform: `scale(${1.14 - 0.14 * p})`, filter: `blur(${(1 - p) * 22}px)` }; break;
    case 'push': style = { opacity: Math.min(1, p * 2), transform: `translateX(${(1 - p) * 32}%)`, filter: `blur(${(1 - p) * 16}px)` }; break;
    case 'wipeDown': {
      const m = `linear-gradient(180deg, #000 ${p * 130 - 30}%, transparent ${p * 130}%)`;
      style = { WebkitMaskImage: m, maskImage: m }; break;
    }
    case 'wipeUp': {
      const m = `linear-gradient(0deg, #000 ${p * 130 - 30}%, transparent ${p * 130}%)`;
      style = { WebkitMaskImage: m, maskImage: m }; break;
    }
    case 'leaf': { // soft diagonal sweep, like light passing a leaf edge
      const m = `linear-gradient(125deg, #000 ${p * 150 - 45}%, transparent ${p * 150 - 5}%)`;
      style = { WebkitMaskImage: m, maskImage: m, filter: `brightness(${1 + (1 - p) * 0.25})` }; break;
    }
    case 'bloom': {
      style = { opacity: Math.min(1, p * 2.2) };
      const a = Math.sin(Math.min(1, p) * Math.PI) * 0.85;
      overlay = <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, rgba(255,250,236,${a}) 0%, rgba(255,244,220,${a * 0.75}) 60%, rgba(255,240,210,${a * 0.5}) 100%)` }} />;
      break;
    }
  }
  return (<AbsoluteFill><AbsoluteFill style={style}>{children}</AbsoluteFill>{overlay}</AbsoluteFill>);
};
