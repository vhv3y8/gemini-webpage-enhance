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
   * Injects our custom unified export option natively into the gem-menu container.
   */
  private injectMenuItems(menu: Element) {
    // 1. Identify if the currently opened gem-menu belongs to the conversation actions menu.
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
    if (menu.querySelector('[value="export-chat"]')) {
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

    // Create a single unified menu item
    const exportItem = this.createExportMenuItem();
    menu.appendChild(exportItem);
  }

  /**
   * Factory method to build a unified <gem-menu-item> with select format options.
   */
  private createExportMenuItem(): HTMLElement {
    const item = document.createElement('gem-menu-item');
    item.setAttribute('role', 'menuitem');
    item.setAttribute('value', 'export-chat');
    item.setAttribute('tabindex', '-1');
    item.classList.add('ng-star-inserted');
    
    item.style.display = 'block';
    item.style.cursor = 'default';
    item.style.transition = 'background-color 0.15s ease';

    // Simulated hover background
    item.addEventListener('mouseenter', () => {
      item.style.background = 'rgba(128, 128, 128, 0.04)';
    });
    item.addEventListener('mouseleave', () => {
      item.style.background = 'transparent';
    });

    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.alignItems = 'center';
    content.style.justifyContent = 'space-between';
    content.style.padding = '8px 16px';
    content.style.width = '100%';
    content.style.boxSizing = 'border-box';

    // Leading Container: Icon + Label
    const leading = document.createElement('div');
    leading.style.display = 'flex';
    leading.style.alignItems = 'center';
    leading.style.gap = '12px';

    const iconContainer = document.createElement('span');
    iconContainer.style.display = 'flex';
    iconContainer.style.alignItems = 'center';
    iconContainer.style.color = 'var(--fallback-color-on-surface, #1f1f1f)';
    iconContainer.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download"><path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/></svg>
    `;

    const labelSpan = document.createElement('span');
    labelSpan.style.fontFamily = 'Inter, Roboto, sans-serif';
    labelSpan.style.fontSize = '14px';
    labelSpan.style.color = 'var(--fallback-color-on-surface, #1f1f1f)';
    labelSpan.style.fontWeight = '500';
    labelSpan.textContent = 'Export Chat';

    leading.appendChild(iconContainer);
    leading.appendChild(labelSpan);

    // Trailing Controls: Select Format + Go Button
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.alignItems = 'center';
    controls.style.gap = '6px';

    const select = document.createElement('select');
    select.style.fontFamily = 'Inter, Roboto, sans-serif';
    select.style.fontSize = '12px';
    select.style.border = '1px solid rgba(128, 128, 128, 0.25)';
    select.style.borderRadius = '4px';
    select.style.padding = '2px 4px';
    select.style.background = 'var(--fallback-color-surface-container-high, #e3e9f4)';
    select.style.color = 'var(--fallback-color-on-surface, #1f1f1f)';
    select.style.cursor = 'pointer';
    select.style.outline = 'none';

    const optMarkdown = document.createElement('option');
    optMarkdown.value = 'markdown';
    optMarkdown.textContent = 'Markdown';
    select.appendChild(optMarkdown);

    const optPlaintext = document.createElement('option');
    optPlaintext.value = 'plaintext';
    optPlaintext.textContent = 'Plain Text';
    select.appendChild(optPlaintext);

    const btn = document.createElement('button');
    btn.textContent = 'Go';
    btn.style.border = 'none';
    btn.style.background = 'cornflowerblue';
    btn.style.color = 'white';
    btn.style.borderRadius = '4px';
    btn.style.padding = '3px 8px';
    btn.style.fontSize = '12px';
    btn.style.fontWeight = '600';
    btn.style.cursor = 'pointer';
    btn.style.transition = 'background-color 0.15s ease';

    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#4fa3e3'; // slightly lighter blue
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'cornflowerblue';
    });

    // Prevent closing menu when interacting with controls
    const stopEvents = ['click', 'mousedown', 'mouseup', 'change'];
    stopEvents.forEach((event) => {
      select.addEventListener(event, (e) => e.stopPropagation());
      btn.addEventListener(event, (e) => e.stopPropagation());
    });

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const format = select.value;
      try {
        if (format === 'markdown') {
          await this.onExportMarkdown();
        } else {
          await this.onExportPlaintext();
        }
      } catch (err) {
        console.error('Failed to export conversation:', err);
      }

      // Close the native popover menu
      document.body.click();
    });

    controls.appendChild(select);
    controls.appendChild(btn);

    content.appendChild(leading);
    content.appendChild(controls);
    item.appendChild(content);

    return item;
  }
}
