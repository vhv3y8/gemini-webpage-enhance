import { ChatSession } from '@shared/models/chat';

export interface ChatScraper {
  scrape(): Promise<ChatSession>;
}
