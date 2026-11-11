import { Config } from '@remotion/cli/config';
Config.setEntryPoint('src/index.ts');
Config.setConcurrency(3);
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
// Pre-installed headless shell in this cloud container (no browser download needed)
Config.setBrowserExecutable('/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell');
Config.setChromiumOpenGlRenderer('swangle');
