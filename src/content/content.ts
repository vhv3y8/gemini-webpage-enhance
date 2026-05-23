import { ExportChatUseCase } from "@content/core/usecases/export-chat"
import { GeminiDomScraper } from "@content/adapters/output/scrapers/gemini-dom"
import { ConfigurableFormatter } from "@content/adapters/output/formatters/configurable"
import { MenuInjector } from "@content/ui/menu-injector"
import { ScrollNavigator } from "@content/ui/scroll-navigator"
import { GeminiDomMarkdownRepairer } from "@content/adapters/output/markdown-repairer/gemini-dom-repairer"
import { RepairMarkdownUseCase } from "@content/core/usecases/repair-markdown"
import { MarkdownFixer } from "@content/adapters/input/markdown-fixer"
import { BrowserFileExporter } from "@content/infra/browser-file-exporter"
import { SwSettingsClient } from "@content/infra/sw-settings-client"
import { ChatWidthAdjuster } from "@content/ui/chat-width-adjuster"

import markdownConfig from "@content/adapters/output/formatters/configs/markdown.json"
import plaintextConfig from "@content/adapters/output/formatters/configs/plaintext.json"

// Bootstrapping the application (Composition Root)
function bootstrap() {
  const scraper = new GeminiDomScraper()
  const fileExporter = new BrowserFileExporter()
  const settingsClient = new SwSettingsClient()

  // Instantiate configurable formatters using data-driven JSON configurations
  const markdownFormatter = new ConfigurableFormatter(markdownConfig)
  const plaintextFormatter = new ConfigurableFormatter(plaintextConfig)

  // Instantiating Use Case Orchestrators with Ports and Infrastructure
  const exportMarkdownUseCase = new ExportChatUseCase(
    scraper,
    markdownFormatter,
    fileExporter
  )
  const exportPlaintextUseCase = new ExportChatUseCase(
    scraper,
    plaintextFormatter,
    fileExporter
  )

  // Initialize UI Menu Injector targeting Gemini native conversation dropdowns
  const injector = new MenuInjector(
    () => exportMarkdownUseCase.execute(),
    () => exportPlaintextUseCase.execute()
  )

  injector.start()
  console.log("[Gemini Downloader] Native UI Menu Injector initialized.")

  // Initialize UI Scroll Navigator targeting Gemini chat scrollbars
  const scrollNavigator = new ScrollNavigator()
  scrollNavigator.start()
  console.log("[Gemini Downloader] Scroll Navigator initialized.")

  // Initialize UI Markdown Repair Fixer to automatically detect and repair broken layout streamings
  const repairer = new GeminiDomMarkdownRepairer()
  const repairUseCase = new RepairMarkdownUseCase(repairer)
  const markdownFixer = new MarkdownFixer(repairUseCase)
  markdownFixer.start()
  console.log("[Gemini Downloader] Markdown Fixer UI initialized.")

  // Initialize UI Chat Width Adjuster
  const chatWidthAdjuster = new ChatWidthAdjuster(settingsClient)
  chatWidthAdjuster.start()
  console.log("[Gemini Downloader] Chat Width Adjuster UI initialized.")
}

// Start bootstrapping immediately
bootstrap()
