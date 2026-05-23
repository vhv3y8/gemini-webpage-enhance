import { ExportResult } from '@shared/models/chat';

export interface FileExporter {
  exportFile(result: ExportResult): Promise<void>;
}
