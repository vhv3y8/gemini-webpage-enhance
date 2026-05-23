import { SettingsRepository } from '@sw/application/ports/settings-repository';
import { AppSettings } from '@shared/models/settings';

export class ChromeStorageRepository implements SettingsRepository {
  private static readonly STORAGE_KEY = 'gemini-downloader-settings';
  private static readonly DEFAULT_SETTINGS: AppSettings = {
    chatWidth: 760,
  };

  async getSettings(): Promise<AppSettings> {
    return new Promise((resolve) => {
      chrome.storage.local.get([ChromeStorageRepository.STORAGE_KEY], (result) => {
        const stored = result[ChromeStorageRepository.STORAGE_KEY];
        if (stored) {
          resolve({
            ...ChromeStorageRepository.DEFAULT_SETTINGS,
            ...stored,
          });
        } else {
          resolve({ ...ChromeStorageRepository.DEFAULT_SETTINGS });
        }
      });
    });
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set(
        { [ChromeStorageRepository.STORAGE_KEY]: settings },
        () => {
          resolve();
        }
      );
    });
  }
}
