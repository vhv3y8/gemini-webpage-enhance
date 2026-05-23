import { AppSettings } from '@shared/models/settings';

export interface SettingsRepository {
  getSettings(): Promise<AppSettings>;
  saveSettings(settings: AppSettings): Promise<void>;
}
