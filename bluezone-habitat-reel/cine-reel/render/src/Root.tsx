import React from 'react';
import { Composition } from 'remotion';
import { Reel } from './Reel';
export const Root: React.FC = () => <Composition id="CineReel" component={Reel} durationInFrames={870} fps={30} width={1080} height={1920} />;
