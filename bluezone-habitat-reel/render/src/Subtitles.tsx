import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { F, FPS } from './theme';
import data from './data/captions.json';

type Chunk = { line: number; text: string; start: number; end: number };
const HL = /^(\d|Blue|Zone|Habitat|Mission|Malappuram|2050|3G|IRPS|Garden|Ethen|Elara|51|43%)/;

/** Malayalam subtitles, chunk-synced to the real voiceover. Lines whose words are already shown as big
 *  on-screen statements (`suppress`) are not duplicated at the bottom (they remain in the .srt file). */
export const Subtitles: React.FC<{ suppress: number[] }> = ({ suppress }) => {
  const f = useCurrentFrame(); const t = f / FPS;
  const c = (data.chunks as Chunk[]).find((k) => t >= k.start && t < k.end);
  if (!c || suppress.includes(c.line)) return null;
  const inP = interpolate(t, [c.start, c.start + 0.14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const outP = interpolate(t, [c.end - 0.1, c.end], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ position: 'absolute', left: 110, width: 860, bottom: 1920 - 1515, display: 'flex', justifyContent: 'center', opacity: Math.min(inP, outP) }}>
      <div style={{
        fontFamily: F.mlSub, fontWeight: 700, fontSize: 50, lineHeight: 1.38, color: '#FFFFFF', textAlign: 'center',
        padding: '10px 26px 6px', borderRadius: 18, background: 'rgba(8,16,9,0.46)', backdropFilter: 'blur(6px)',
        textShadow: '0 2px 10px rgba(0,0,0,0.6)', transform: `translateY(${(1 - inP) * 10}px)`,
      }}>
        {c.text.split(' ').map((w, i) => (
          <span key={i} style={{ color: HL.test(w) ? '#D9EBB4' : '#FFFFFF' }}>{w}{' '}</span>
        ))}
      </div>
    </div>
  );
};
