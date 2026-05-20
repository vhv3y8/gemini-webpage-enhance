import { ChatScraper } from './ports/scraper';
import { ChatFormatter } from './ports/formatter';
import { ExportResult } from './models/chat';

export class ChatExporter {
  constructor(
    private scraper: ChatScraper,
    private formatter: ChatFormatter
  ) {}

  async export(): Promise<ExportResult> {
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

    return {
      content,
      filename,
      mimeType: this.formatter.getMimeType(),
    };
  }
}
