export interface MarkdownRepairer {
  isBroken(element: HTMLElement): boolean;
  repair(element: HTMLElement): HTMLElement;
}
