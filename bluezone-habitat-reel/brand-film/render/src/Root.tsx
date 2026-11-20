import React from 'react';
import { Composition } from 'remotion';
import { Film } from './Film';
export const Root: React.FC = () => <Composition id="BrandFilm" component={Film} durationInFrames={2700} fps={30} width={1080} height={1920} />;
