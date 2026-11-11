import React from 'react';
import { Composition } from 'remotion';
import { Reel } from './Reel';
import { FPS, W, H, TOTAL } from './theme';
export const RemotionRoot: React.FC = () => (
  <Composition id="BlueZonePresenterReel" component={Reel} durationInFrames={Math.round(TOTAL * FPS)} fps={FPS} width={W} height={H} />
);
