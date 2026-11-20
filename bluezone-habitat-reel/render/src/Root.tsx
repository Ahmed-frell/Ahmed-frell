import React from 'react';
import { Composition } from 'remotion';
import { Reel, TOTAL_OUT } from './Reel';
import { FPS, W, H } from './theme';

export const RemotionRoot: React.FC = () => (
  <Composition id="BlueZoneReel" component={Reel} durationInFrames={Math.round(TOTAL_OUT * FPS)} fps={FPS} width={W} height={H} />
);
