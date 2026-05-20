import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';
import archiver from 'archiver';

/**
 * Custom Vite plugin to automatically package the compiled dist folder
 * into a production-ready Chrome Extension ZIP archive using the 'archiver' library.
 */
function chromeExtensionZip() {
  return {
    name: 'chrome-extension-zip',
    closeBundle() {
      if (process.env.BUILD_ZIP !== 'true') return;

      console.log('\n[Zip Plugin] Packaging extension into production ZIP archive using archiver...');

      const zipPath = resolve(__dirname, 'gemini-chat-downloader.zip');
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      output.on('close', () => {
        console.log(`[Zip Plugin] Success! Archive created at ./gemini-chat-downloader.zip (${(archive.pointer() / 1024).toFixed(2)} KB total)\n`);
      });

      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          console.warn('[Zip Plugin] Warning:', err);
        } else {
          throw err;
        }
      });

      archive.on('error', (err) => {
        console.error('[Zip Plugin] Packaging failed:', err);
      });

      // Stream data to write stream
      archive.pipe(output);

      // Append files from 'dist/' directory directly into the ZIP archive root
      archive.directory('dist/', false);

      // Finalize the archive (stream will close)
      archive.finalize();
    }
  };
}

export default defineConfig({
  plugins: [chromeExtensionZip()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: false, // Keep it readable for easier debugging and extension reviews
    lib: {
      entry: resolve(__dirname, 'src/content.ts'),
      name: 'GeminiDownloader',
      formats: ['iife'],
      fileName: () => 'content.js',
    },
  },
});




