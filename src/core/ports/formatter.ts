import { ChatSession } from '../models/chat';

export interface ChatFormatter {
  format(session: ChatSession): string;
  getFileExtension(): string;
  getMimeType(): string;
}
