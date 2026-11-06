import React from 'react';
import { Composition } from 'remotion';
import { Reel, TOTAL } from './Reel';
import { FPS, W, H } from './theme';

export const RemotionRoot: React.FC = () => (
  <Composition id="BlueZoneReel" component={Reel} durationInFrames={Math.round(TOTAL * FPS)} fps={FPS} width={W} height={H} />
);
