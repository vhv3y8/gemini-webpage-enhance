import { ExportChatUseCase } from './core/usecases/export-chat';
import { GeminiDomScraper } from './adapters/output/scrapers/gemini-dom';
import { ConfigurableFormatter } from './adapters/output/formatters/configurable';
import { MenuInjector } from './ui/menu-injector';
import { ScrollNavigator } from './ui/scroll-navigator';
import { GeminiDomMarkdownRepairer } from './adapters/output/markdown-repairer/gemini-dom-repairer';
import { RepairMarkdownUseCase } from './core/usecases/repair-markdown';
import { MarkdownFixer } from './adapters/input/markdown-fixer';
import { BrowserFileExporter } from './infra/browser-file-exporter';

import markdownConfig from './adapters/output/formatters/configs/markdown.json';
import plaintextConfig from './adapters/output/formatters/configs/plaintext.json';

// Bootstrapping the application (Composition Root)
function bootstrap() {
  const scraper = new GeminiDomScraper();
  const fileExporter = new BrowserFileExporter();

  // Instantiate configurable formatters using data-driven JSON configurations
  const markdownFormatter = new ConfigurableFormatter(markdownConfig);
  const plaintextFormatter = new ConfigurableFormatter(plaintextConfig);

  // Instantiating Use Case Orchestrators with Ports and Infrastructure
  const exportMarkdownUseCase = new ExportChatUseCase(scraper, markdownFormatter, fileExporter);
  const exportPlaintextUseCase = new ExportChatUseCase(scraper, plaintextFormatter, fileExporter);

  // Initialize UI Menu Injector targeting Gemini native conversation dropdowns
  const injector = new MenuInjector(
    () => exportMarkdownUseCase.execute(),
    () => exportPlaintextUseCase.execute()
  );

  injector.start();
  console.log('[Gemini Downloader] Native UI Menu Injector initialized.');

  // Initialize UI Scroll Navigator targeting Gemini chat scrollbars
  const scrollNavigator = new ScrollNavigator();
  scrollNavigator.start();
  console.log('[Gemini Downloader] Scroll Navigator initialized.');

  // Initialize UI Markdown Repair Fixer to automatically detect and repair broken layout streamings
  const repairer = new GeminiDomMarkdownRepairer();
  const repairUseCase = new RepairMarkdownUseCase(repairer);
  const markdownFixer = new MarkdownFixer(repairUseCase);
  markdownFixer.start();
  console.log('[Gemini Downloader] Markdown Fixer UI initialized.');
}

// Start bootstrapping immediately
bootstrap();

