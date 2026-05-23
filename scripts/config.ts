import { resolve } from 'path';
import { InlineConfig } from 'vite';
import { chromeExtensionZip } from './plugins/zip';

export const sharedResolve = {
  alias: {
    '@content': resolve(__dirname, '../src/content'),
    '@sw': resolve(__dirname, '../src/sw'),
    '@shared': resolve(__dirname, '../src/shared'),
  }
};

export const getContentConfig = (isWatch: boolean): InlineConfig => ({
  configFile: false,
  resolve: sharedResolve,
  plugins: [chromeExtensionZip()],
  build: {
    outDir: resolve(__dirname, '../dist'),
    emptyOutDir: true,
    minify: false,
    watch: isWatch ? {} : undefined,
    lib: {
      entry: resolve(__dirname, '../src/content/content.ts'),
      name: 'GeminiDownloader',
      formats: ['iife'],
      fileName: () => 'content.js',
    }
  }
});

export const getSwConfig = (isWatch: boolean): InlineConfig => ({
  configFile: false,
  resolve: sharedResolve,
  build: {
    outDir: resolve(__dirname, '../dist'),
    emptyOutDir: false, // Critical: DO NOT wipe dist (keeps content.js)
    minify: false,
    watch: isWatch ? {} : undefined,
    lib: {
      entry: resolve(__dirname, '../src/sw/sw.ts'),
      name: 'GeminiDownloaderSW',
      formats: ['iife'],
      fileName: () => 'sw.js',
    }
  }
});
