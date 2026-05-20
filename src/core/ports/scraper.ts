import { ChatSession } from '../models/chat';

export interface ChatScraper {
  scrape(): Promise<ChatSession>;
}
