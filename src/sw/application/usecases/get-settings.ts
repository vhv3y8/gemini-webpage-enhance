import { SettingsRepository } from '@sw/application/ports/settings-repository';
import { AppSettings } from '@shared/models/settings';

export class GetSettingsUseCase {
  constructor(private repository: SettingsRepository) {}

  async execute(): Promise<AppSettings> {
    return this.repository.getSettings();
  }
}
