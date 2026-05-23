import { SettingsClient } from '@content/core/ports/settings-client';
import { AppSettings } from '@shared/models/settings';

export class SwSettingsClient implements SettingsClient {
  async getSettings(): Promise<AppSettings> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
        const error = chrome.runtime.lastError;
        if (error) {
          console.warn('[Gemini Downloader Client] Failed to communicate with service worker. Falling back to default settings.', error);
          resolve({ chatWidth: 760 });
          return;
        }

        if (response && response.success) {
          resolve(response.settings);
        } else {
          console.warn('[Gemini Downloader Client] Service Worker returned error or empty response. Falling back to default.', response?.error);
          resolve({ chatWidth: 760 });
        }
      });
    });
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings }, (response) => {
        const error = chrome.runtime.lastError;
        if (error) {
          console.error('[Gemini Downloader Client] Failed to save settings via service worker:', error);
          reject(new Error(error.message));
          return;
        }

        if (response && response.success) {
          resolve();
        } else {
          console.error('[Gemini Downloader Client] Service Worker failed to save settings:', response?.error);
          reject(new Error(response?.error ?? 'Unknown error'));
        }
      });
    });
  }
}
