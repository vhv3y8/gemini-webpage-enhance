import { ChatSession } from '@shared/models/chat';

export interface ChatFormatter {
  format(session: ChatSession): string;
  getFileExtension(): string;
  getMimeType(): string;
}
