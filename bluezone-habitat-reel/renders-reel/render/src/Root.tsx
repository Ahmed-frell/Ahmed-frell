import React from 'react';
import { Composition } from 'remotion';
import { Reel } from './Reel';
import { FPS, H, TOTAL, W } from './theme';
export const Root: React.FC = () => (
  <Composition id="RendersReel" component={Reel} durationInFrames={Math.round(TOTAL * FPS)} fps={FPS} width={W} height={H} />
);
