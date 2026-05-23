import { ChromeStorageRepository } from '@sw/adapters/storage/chrome-storage-repository';
import { GetSettingsUseCase } from '@sw/application/usecases/get-settings';
import { SaveSettingsUseCase } from '@sw/application/usecases/save-settings';

function bootstrap() {
  const repository = new ChromeStorageRepository();
  const getSettingsUseCase = new GetSettingsUseCase(repository);
  const saveSettingsUseCase = new SaveSettingsUseCase(repository);

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Gemini Downloader SW] Message received:', message, 'from:', sender);

    if (message.type === 'GET_SETTINGS') {
      getSettingsUseCase.execute()
        .then((settings) => {
          sendResponse({ success: true, settings });
        })
        .catch((error) => {
          console.error('[Gemini Downloader SW] Failed to get settings:', error);
          sendResponse({ success: false, error: String(error) });
        });
      return true; // Keep message channel open for async response
    }

    if (message.type === 'SAVE_SETTINGS') {
      saveSettingsUseCase.execute(message.settings)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          console.error('[Gemini Downloader SW] Failed to save settings:', error);
          sendResponse({ success: false, error: String(error) });
        });
      return true; // Keep message channel open for async response
    }
  });

  console.log('[Gemini Downloader SW] Service Worker initialized.');
}

bootstrap();
