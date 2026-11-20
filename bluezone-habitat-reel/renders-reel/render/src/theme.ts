// Blue Zone Habitat renders reel: reference-2 typography (italic serif over a heavy condensed cream line),
// natural render colours, GREEN only as branding (pins, tags, outro).
import '@fontsource/playfair-display/600-italic.css';
import '@fontsource/playfair-display/700-italic.css';
import '@fontsource/anton/400.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';

export const G = {
  holly: '#013408',
  crusoe: '#005B0D',
  grass: '#089F25',
  pistachio: '#B4F4A5',
  olive: '#6B7A2E',
  ivory: '#FFF8EC',
  paper: '#F5F3E6', // the client logo's own background
};

export const FONT = {
  italic: '"Playfair Display", Georgia, serif',
  bold: 'Anton, Impact, sans-serif',
  serif: '"Cormorant Garamond", Georgia, serif',
  sans: 'Montserrat, "Helvetica Neue", sans-serif',
};

// warm cream metallic, as in the reference's condensed line
export const CREAM = 'linear-gradient(180deg, #FFF8E6 0%, #F6E4B8 42%, #DDBE82 78%, #C9A564 100%)';
export const SHADOW = 'drop-shadow(0 2px 2px rgba(0,0,0,0.55)) drop-shadow(0 6px 18px rgba(0,0,0,0.45))';

export const FPS = 30;
export const W = 1080;
export const H = 1920;
import REMAP from './remap.json';
import SHOTS_JSON from './shots.json';
export const TOTAL = SHOTS_JSON.total;
// raw: seconds on the final timeline. f: seconds on the first-cut (v1 voice) timeline, remapped to the current voice.
export const raw = (s: number) => Math.round(s * FPS);
export const remap = (t: number) => {
  const o = REMAP.old, n = REMAP.new;
  if (t <= o[0]) return n[0];
  for (let i = 1; i < o.length; i++) if (t <= o[i]) return n[i - 1] + ((t - o[i - 1]) / (o[i] - o[i - 1])) * (n[i] - n[i - 1]);
  return n[n.length - 1];
};
export const f = (s: number) => raw(remap(s));

export const IMG: Record<string, [number, number]> = {
  office: [4442, 2500], r01: [3334, 2500], r02: [3750, 2500], r03: [3750, 2500], r04: [3750, 2500], r05: [4452, 2500],
  r06: [3750, 2500], r07: [3750, 2500], r08: [3750, 2500], r09: [3334, 2500], r10: [3750, 2500], r11: [3244, 2500],
  vi10: [4444, 2500], wt185: [4444, 2500],
};
