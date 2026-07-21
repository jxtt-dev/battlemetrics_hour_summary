import * as esbuild from 'esbuild';
import { cpSync, rmSync } from 'fs';

const prod = process.argv.includes('--prod');

// Clean dist
rmSync('dist', { recursive: true, force: true });

// Copy static assets
cpSync('public', 'dist', { recursive: true });

const entryPoints = [
    'src/content.ts',
    'src/popup.ts',
    'src/options.ts',
    'src/background.ts',
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