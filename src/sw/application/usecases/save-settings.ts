import { SettingsRepository } from '@sw/application/ports/settings-repository';
import { AppSettings } from '@shared/models/settings';

export class SaveSettingsUseCase {
  constructor(private repository: SettingsRepository) {}

  async execute(settings: AppSettings): Promise<void> {
    return this.repository.saveSettings(settings);
  }
}
