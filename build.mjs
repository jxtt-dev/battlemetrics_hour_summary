import * as esbuild from 'esbuild';
import { cpSync, rmSync, readFileSync, writeFileSync } from 'fs';

const prod = process.argv.includes('--prod');
const firefox = process.argv.includes('--firefox');

// Clean dist
rmSync('dist', { recursive: true, force: true });

// Copy static assets
cpSync('public', 'dist', { recursive: true });

// Patch manifest for target browser
const manifest = JSON.parse(readFileSync('dist/manifest.json', 'utf-8'));

if (firefox) {
    manifest.background = { scripts: ['background.js'] };
} else {
    manifest.background = { service_worker: 'background.js' };
}

writeFileSync('dist/manifest.json', JSON.stringify(manifest, null, 4));
console.log(`Building for ${firefox ? 'Firefox' : 'Chrome'}...`);

const entryPoints = [
    'src/content.ts',
    'src/main.ts',
    'src/popup.ts',
    'src/options.ts',
    'src/background.ts',
    'src/update.ts',
];

const ctx = await esbuild.context({
    entryPoints,
    bundle: true,
    outdir: 'dist',
    format: 'iife',
    platform: 'browser',
    minify: prod,
    sourcemap: prod ? false : 'inline',

    // Required for Chartist v0.11
    define: {
        global: 'window',
    },
});

await ctx.rebuild();
await ctx.dispose();
console.log('Build complete');
