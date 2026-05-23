import { build } from 'vite';
import { getContentConfig, getSwConfig } from '../config';

async function runBuild() {
  const isWatch = process.argv.includes('--watch') || process.argv.includes('-w');

  console.log(`[Custom Builder] Starting ${isWatch ? 'watch mode' : 'production build'}...`);

  try {
    // 1. Build Content Script (empties outDir)
    console.log('[Custom Builder] Compiling Content Script...');
    await build(getContentConfig(isWatch));
    console.log('[Custom Builder] Content Script compiled successfully!\n');

    // 2. Build Service Worker (keeps outDir)
    console.log('[Custom Builder] Compiling Service Worker...');
    await build(getSwConfig(isWatch));
    console.log('[Custom Builder] Service Worker compiled successfully!\n');

    console.log('[Custom Builder] All builds finished successfully!');
  } catch (err) {
    console.error('[Custom Builder] Build failed:', err);
    process.exit(1);
  }
}

runBuild();
