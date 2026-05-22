import { ExportResult } from '../models/chat';

export interface FileExporter {
  exportFile(result: ExportResult): Promise<void>;
}
