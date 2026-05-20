import { ChatExporter } from './core/exporter';
import { GeminiDomScraper } from './adapters/scrapers/gemini-dom';
import { ConfigurableFormatter } from './adapters/formatters/configurable';
import { MenuInjector } from './ui/menu-injector';

import markdownConfig from './adapters/formatters/configs/markdown.json';
import plaintextConfig from './adapters/formatters/configs/plaintext.json';

// Helper to trigger a file download inside the Chrome Extension script context
async function triggerDownload(exporter: ChatExporter) {
  try {
    const result = await exporter.export();

    const blob = new Blob([result.content], { type: result.mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();

    // Clean up virtual node
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    console.log(`[Gemini Downloader] Successfully downloaded: ${result.filename}`);
  } catch (error) {
    console.error('[Gemini Downloader] Export failed:', error);
  }
}

// Bootstrapping the application (Composition Root)
function bootstrap() {
  const scraper = new GeminiDomScraper();

  // Instantiate configurable formatters using data-driven JSON configurations
  const markdownFormatter = new ConfigurableFormatter(markdownConfig);
  const plaintextFormatter = new ConfigurableFormatter(plaintextConfig);

  // Instantiating Exporter services
  const markdownExporter = new ChatExporter(scraper, markdownFormatter);
  const plaintextExporter = new ChatExporter(scraper, plaintextFormatter);

  // Initialize UI Menu Injector targeting Gemini native conversation dropdowns
  const injector = new MenuInjector(
    () => triggerDownload(markdownExporter),
    () => triggerDownload(plaintextExporter)
  );

  injector.start();
  console.log('[Gemini Downloader] Native UI Menu Injector initialized.');
}

// Start bootstrapping immediately
bootstrap();

