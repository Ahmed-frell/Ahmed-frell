// Blue Zone presenter reel: client green palette + the reference's three-typeface caption system.
import '@fontsource/poppins/700.css';
import '@fontsource/poppins/800.css';
import '@fontsource/anton/400.css';
import '@fontsource/allura/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/noto-sans-malayalam/700.css';
import '@fontsource/noto-sans-malayalam/800.css';
import '@fontsource/noto-sans-malayalam/900.css';

// client palette (Holly → Pistachio)
export const G = {
  holly: '#013408',
  crusoe: '#005B0D',
  grass: '#089F25',
  apple: '#6DC839',
  pistachio: '#B4F4A5',
  white: '#F4FFF1',
};

export const FONT = {
  pri: 'Poppins, "Noto Sans Malayalam", sans-serif',          // primary: rounded geometric, heavy
  em: 'Anton, "Noto Sans Malayalam", Impact, sans-serif',       // emphasis: condensed display
  script: 'Allura, cursive',                                     // accent word
  ml: '"Noto Sans Malayalam", Poppins, sans-serif',             // Malayalam words
  label: 'Montserrat, Poppins, sans-serif',
};

export const FPS = 30;
export const W = 1080;
export const H = 1920;
export const VOICE_END = 131.73;   // end of the edited dialogue (rough cut v2)
export const OUTRO = 4.5;
export const TOTAL = VOICE_END + OUTRO;
export const isML = (s: string) => /[ഀ-ൿ]/.test(s);
// dark green shadow keeps light-green text legible on any background
export const TEXT_SHADOW = `0 4px 0 ${G.holly}, 0 0 18px rgba(1,52,8,0.85), 0 8px 26px rgba(0,0,0,0.45)`;
