// Blue Zone presenter reel, revision 2: GREEN IS THE BRAND, NOT A FILTER.
// Footage is graded naturally (tools/grade.json); green lives only in typography, graphics, backgrounds and transitions.
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import '@fontsource/cormorant-garamond/600-italic.css';
import '@fontsource/cormorant-garamond/700-italic.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/noto-serif-malayalam/600.css';
import '@fontsource/noto-serif-malayalam/700.css';
import '@fontsource/manjari/700.css';

// colour roles (client palette + brand neutrals)
export const G = {
  holly: '#013408',      // main graphic backgrounds, boxes
  forest: '#0B3D1A',     // deep gradients
  crusoe: '#005B0D',
  olive: '#6B7A2E',      // secondary graphic elements
  grass: '#089F25',
  apple: '#6DC839',
  pistachio: '#B4F4A5',  // subtle highlights, accent words, strokes
  ivory: '#FFF8EC',      // primary text
  gold: '#E3C98F',       // muted champagne: occasional premium detail
};
// kept for older components
export const W_ = G;

export const FONT = {
  serif: '"Cormorant Garamond", Georgia, serif',          // luxury editorial headlines
  sans: 'Montserrat, "Helvetica Neue", sans-serif',        // supporting text
  mlSerif: '"Noto Serif Malayalam", "Cormorant Garamond", serif', // Malayalam headlines
  mlSans: 'Manjari, "Noto Serif Malayalam", Montserrat, sans-serif', // Malayalam captions
};

export const FPS = 30;
export const W = 1080;
export const H = 1920;
export const VOICE_END = 131.73;
export const OUTRO = 4.5;
export const TOTAL = VOICE_END + OUTRO;
export const isML = (s: string) => /[ഀ-ൿ]/.test(s);
// legibility shadow: soft holly glow + tight dark edge (no colour cast on the image itself)
export const SHADOW = '0 2px 3px rgba(0,0,0,0.45), 0 6px 26px rgba(1,52,8,0.55)';
