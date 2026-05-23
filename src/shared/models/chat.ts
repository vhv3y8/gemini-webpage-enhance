export type ChatMessageRole = 'user' | 'model' | 'system';

export interface ChatMessagePart {
  type: 'text' | 'code' | 'image';
  content: string;
  language?: string;
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  role: ChatMessageRole;
  parts: ChatMessagePart[];
  timestamp?: number;
}

export interface ChatSession {
  title: string;
  url: string;
  messages: ChatMessage[];
  scrapedAt: number;
}

export interface ExportResult {
  content: string;
  filename: string;
  mimeType: string;
}
