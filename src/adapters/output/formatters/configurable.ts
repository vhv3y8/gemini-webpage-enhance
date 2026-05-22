import { ChatFormatter } from '../../../core/ports/formatter';
import { ChatSession } from '../../../core/models/chat';

export interface FormatterConfig {
  extension: string;
  mimeType: string;
  includeMetadata: boolean;
  metadataFormat: string;
  userPrefix: string;
  modelPrefix: string;
  messageSeparator: string;
  codeBlockFormat: string;
  imageFormat: string;
}

export class ConfigurableFormatter implements ChatFormatter {
  constructor(private config: FormatterConfig) {}

  format(session: ChatSession): string {
    let output = '';

    // 1. Add Metadata if requested
    if (this.config.includeMetadata) {
      const dateStr = new Date(session.scrapedAt).toLocaleString();
      let meta = this.config.metadataFormat
        .replace(/{title}/g, session.title)
        .replace(/{url}/g, session.url)
        .replace(/{date}/g, dateStr);
      output += meta;
    }

    // 2. Format Messages
    const messageStrings: string[] = [];

    for (const msg of session.messages) {
      let msgStr = '';
      
      // Add Role Prefix
      if (msg.role === 'user') {
        msgStr += this.config.userPrefix;
      } else if (msg.role === 'model') {
        msgStr += this.config.modelPrefix;
      }

      // Add Message Parts
      for (const part of msg.parts) {
        if (part.type === 'text') {
          msgStr += part.content + '\n\n';
        } else if (part.type === 'code') {
          const lang = part.language || 'text';
          const codeFormatted = this.config.codeBlockFormat
            .replace(/{language}/g, lang)
            .replace(/{code}/g, part.content.trim());
          msgStr += codeFormatted;
        } else if (part.type === 'image') {
          const imgFormatted = this.config.imageFormat
            .replace(/{url}/g, part.content);
          msgStr += imgFormatted;
        }
      }

      messageStrings.push(msgStr.trim());
    }

    // Join messages using the separator
    output += messageStrings.join(this.config.messageSeparator);

    return output;
  }

  getFileExtension(): string {
    return this.config.extension;
  }

  getMimeType(): string {
    return this.config.mimeType;
  }
}
