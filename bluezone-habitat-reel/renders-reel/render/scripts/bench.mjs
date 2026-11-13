import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public') });
const composition = await selectComposition({ serveUrl, id: 'RendersReel', browserExecutable });
for (const t of process.argv.slice(2)) {
  const fr = Math.round(parseFloat(t) * 30);
  for (const k of [0, 1]) {
    const t0 = Date.now();
    await renderStill({ serveUrl, composition, frame: fr + k, output: "out/bench.png", browserExecutable, chromiumOptions: { gl: process.env.GL || 'swangle' } });
    console.log(t, k, Date.now() - t0, 'ms');
  }
}
