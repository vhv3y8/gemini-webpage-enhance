import { FileExporter } from '@content/core/ports/file-exporter';
import { ExportResult } from '@shared/models/chat';

export class BrowserFileExporter implements FileExporter {
  async exportFile(result: ExportResult): Promise<void> {
    try {
      const blob = new Blob([result.content], { type: result.mimeType });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();

      // Clean up virtual node in microtask queue
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      console.log(`[Gemini Downloader] Successfully downloaded: ${result.filename}`);
    } catch (error) {
      console.error('[Gemini Downloader] Infrastructure Export failed:', error);
      throw error;
    }
  }
}
