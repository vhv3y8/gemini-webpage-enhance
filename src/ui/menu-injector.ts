export class MenuInjector {
  constructor(
    private onExportMarkdown: () => Promise<void>,
    private onExportPlaintext: () => Promise<void>
  ) {}

  /**
   * Starts observing the DOM for Gemini's popover dropdown menus.
   */
  start() {
    // 1. Scan for any already open menus
    const existingMenu = document.querySelector('gem-menu');
    if (existingMenu) {
      this.injectMenuItems(existingMenu);
    }

    // 2. Observe dynamic popovers inserted at body root
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const addedNode of Array.from(mutation.addedNodes)) {
          if (addedNode.nodeType === Node.ELEMENT_NODE) {
            const el = addedNode as HTMLElement;
            // The menu could be inside the added node, or be the node itself
            const menu = el.tagName === 'GEM-MENU' ? el : el.querySelector('gem-menu');
            if (menu) {
              this.injectMenuItems(menu);
            }
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Injects our custom export options natively into the gem-menu container.
   */
  private injectMenuItems(menu: Element) {
    // 1. Identify if the currently opened gem-menu belongs to the conversation actions menu.
    // The three-dot button that triggers this specific menu is wrapped in a `<conversation-actions-icon>` element.
    // When the menu is active, the trigger button inside it has the `aria-expanded="true"` attribute.
    const activeTrigger = document.querySelector('conversation-actions-icon [aria-expanded="true"]');
    if (!activeTrigger) {
      return;
    }

    // 2. Correlate the menu's ID or placement with the trigger's `aria-controls` attribute to prevent wrong injection.
    const ariaControls = activeTrigger.getAttribute('aria-controls');
    if (ariaControls) {
      const isMatchingMenu =
        menu.id === ariaControls ||
        menu.getAttribute('id') === ariaControls ||
        menu.closest(`#${ariaControls}`) !== null ||
        menu.querySelector(`#${ariaControls}`) !== null ||
        document.getElementById(ariaControls)?.contains(menu);

      if (!isMatchingMenu) {
        return;
      }
    }

    // Prevent duplicate injections
    if (menu.querySelector('[value="export-markdown"]') || menu.querySelector('[value="export-plaintext"]')) {
      return;
    }

    // Create a beautiful thin divider before our custom items if other items exist
    if (menu.children.length > 0) {
      const divider = document.createElement('div');
      divider.style.height = '1px';
      divider.style.background = 'rgba(128, 128, 128, 0.15)';
      divider.style.margin = '4px 0';
      menu.appendChild(divider);
    }

    // 1. Create Export Markdown Menu Item
    const markdownItem = this.createMenuItem({
      value: 'export-markdown',
      label: 'Export Markdown',
      iconName: 'download',
      onClick: this.onExportMarkdown
    });

    // 2. Create Export Plain Text Menu Item
    const plaintextItem = this.createMenuItem({
      value: 'export-plaintext',
      label: 'Export Plain Text',
      iconName: 'description',
      onClick: this.onExportPlaintext
    });

    menu.appendChild(markdownItem);
    menu.appendChild(plaintextItem);
  }

  /**
   * Factory method to build a <gem-menu-item> node perfectly matching Gemini's DOM design.
   */
  private createMenuItem(options: {
    value: string;
    label: string;
    iconName: string;
    onClick: () => Promise<void>;
  }): HTMLElement {
    const item = document.createElement('gem-menu-item');
    item.setAttribute('role', 'menuitem');
    item.setAttribute('value', options.value);
    item.setAttribute('tabindex', '-1');
    item.classList.add('ng-star-inserted');
    
    // Set matching inline hover styles (Gemini's standard colors)
    item.style.display = 'block';
    item.style.cursor = 'pointer';

    const content = document.createElement('gem-menu-item-content');
    content.style.display = 'flex';
    content.style.alignItems = 'center';
    content.style.padding = '8px 16px';
    content.style.gap = '12px';

    // Hover effect simulation
    item.addEventListener('mouseenter', () => {
      content.style.background = 'rgba(128, 128, 128, 0.08)';
    });
    item.addEventListener('mouseleave', () => {
      content.style.background = 'transparent';
    });

    // A. Leading Icon Wrapper
    const leadingContainer = document.createElement('div');
    leadingContainer.classList.add('leading-container');
    leadingContainer.style.display = 'flex';
    leadingContainer.style.alignItems = 'center';

    const gemIcon = document.createElement('gem-icon');
    gemIcon.classList.add('ng-star-inserted');

    const matIcon = document.createElement('mat-icon');
    matIcon.setAttribute('role', 'img');
    matIcon.classList.add(
      'mat-icon',
      'notranslate',
      'lumi-symbols',
      'mat-ligature-font',
      'mat-icon-no-color',
      'ng-star-inserted',
      'lm-icon-l'
    );
    matIcon.setAttribute('aria-hidden', 'true');
    matIcon.setAttribute('data-mat-icon-type', 'font');
    matIcon.setAttribute('data-mat-icon-name', options.iconName);
    matIcon.setAttribute('data-mat-icon-namespace', 'lumi-symbols');
    matIcon.setAttribute('fonticon', options.iconName);
    
    // Use Material Symbols text rendering
    matIcon.textContent = options.iconName;
    matIcon.style.fontSize = '20px';
    matIcon.style.width = '20px';
    matIcon.style.height = '20px';

    gemIcon.appendChild(matIcon);
    leadingContainer.appendChild(gemIcon);

    // B. Text Label Wrapper
    const labelContainer = document.createElement('div');
    labelContainer.classList.add('label-container');
    labelContainer.style.flex = '1';

    const labelSpan = document.createElement('span');
    labelSpan.classList.add('label');
    labelSpan.style.fontFamily = 'Inter, Roboto, sans-serif';
    labelSpan.style.fontSize = '14px';
    labelSpan.style.color = 'var(--fallback-color-on-surface, #1f1f1f)';

    const textSpan = document.createElement('span');
    textSpan.classList.add('ng-star-inserted');
    textSpan.textContent = options.label;

    labelSpan.appendChild(textSpan);
    labelContainer.appendChild(labelSpan);

    // C. Trailing empty container for spacing
    const trailingContainer = document.createElement('div');
    trailingContainer.classList.add('trailing-container');

    // Assemble Item tree
    content.appendChild(leadingContainer);
    content.appendChild(labelContainer);
    content.appendChild(trailingContainer);
    item.appendChild(content);

    // Handle clicks and execute export logic safely
    item.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Trigger action
      try {
        await options.onClick();
      } catch (err) {
        console.error('Failed to export conversation:', err);
      }

      // Close the native popover menu
      document.body.click();
    });

    return item;
  }
}
