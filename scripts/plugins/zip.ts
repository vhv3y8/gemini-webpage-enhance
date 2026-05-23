import { resolve } from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { Plugin } from 'vite';

export function chromeExtensionZip(): Plugin {
  return {
    name: 'chrome-extension-zip',
    closeBundle() {
      if (process.env.BUILD_ZIP !== 'true') return;

      console.log('\n[Zip Plugin] Packaging extension into production ZIP archive using archiver...');

      const zipPath = resolve(__dirname, '../../gemini-chat-downloader.zip');
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

      archive.pipe(output);
      archive.directory(resolve(__dirname, '../../dist'), false);
      archive.finalize();
    }
  };
}
