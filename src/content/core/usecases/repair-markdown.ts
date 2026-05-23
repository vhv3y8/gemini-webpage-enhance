import { MarkdownRepairer } from '../ports/markdown-repairer';

export class RepairMarkdownUseCase {
  constructor(private repairer: MarkdownRepairer) {}

  check(element: HTMLElement): boolean {
    return this.repairer.isBroken(element);
  }

  execute(element: HTMLElement): HTMLElement | null {
    if (this.repairer.isBroken(element)) {
      return this.repairer.repair(element);
    }
    return null;
  }
}
