import { ChatScraper } from '../ports/scraper';
import { ChatFormatter } from '../ports/formatter';
import { FileExporter } from '../ports/file-exporter';

export class ExportChatUseCase {
  constructor(
    private scraper: ChatScraper,
    private formatter: ChatFormatter,
    private fileExporter: FileExporter
  ) {}

  async execute(): Promise<void> {
    const session = await this.scraper.scrape();
    const content = this.formatter.format(session);
    
    // Create a safe, clean filename from the session title (supports Korean, alphanumeric, spaces, hyphens)
    const safeTitle = session.title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s\-_]/g, '') // Strip special chars
      .trim()
      .replace(/\s+/g, '_');               // Replace spaces with underscores
      
    const dateStr = new Date(session.scrapedAt).toISOString().split('T')[0];
    const filename = `${safeTitle || 'gemini_chat'}_${dateStr}.${this.formatter.getFileExtension()}`;

    // Delegate the file exporting responsibility entirely to the Port boundary!
    await this.fileExporter.exportFile({
      content,
      filename,
      mimeType: this.formatter.getMimeType(),
    });
  }
}
