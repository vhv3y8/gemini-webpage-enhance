import { AppSettings } from '../../../shared/models/settings';

export interface SettingsClient {
  getSettings(): Promise<AppSettings>;
  saveSettings(settings: AppSettings): Promise<void>;
}
