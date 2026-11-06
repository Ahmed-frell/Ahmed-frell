// Blue Zone Habitat visual identity (from the brand logo + brochure), not the reference's look.
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/600-italic.css';
import '@fontsource/cormorant-garamond/700.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/noto-serif-malayalam/600.css';
import '@fontsource/noto-serif-malayalam/700.css';
import '@fontsource/manjari/700.css';

export const C = {
  leaf: '#2E4A14',      // logo green
  forest: '#0F1D0C',    // deep background
  sage: '#E6EADF',      // brochure sage-cream
  teal: '#1F6E8C',      // villa-name teal-blue
  gold: '#C9A227',      // Mission Malappuram 2050 gold
  white: '#F7F5EF',
  amber: '#E8A33D',
};

export const F = {
  serif: '"Cormorant Garamond", Georgia, serif',
  sans: 'Montserrat, "Noto Sans", sans-serif',
  mlSerif: '"Noto Serif Malayalam", "Cormorant Garamond", serif',
  mlSub: 'Manjari, "Noto Sans Malayalam", Montserrat, sans-serif',
};

export const FPS = 30;
export const W = 1080;
export const H = 1920;
// Instagram Reels safe area: keep text between y=230 and y=1540, and x within 90..990
export const SAFE = { top: 230, bottom: 1540, left: 90, right: 990 };
export const VO_OFFSET = 0.4; // seconds of pre-roll before the voice starts
