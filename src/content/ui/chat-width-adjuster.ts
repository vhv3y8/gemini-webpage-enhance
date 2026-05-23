import { SettingsClient } from '@content/core/ports/settings-client';

export class ChatWidthAdjuster {
  private static readonly STYLE_ID = 'gemini-chat-width-style';
  private static readonly DEFAULT_WIDTH = 760;

  constructor(private settingsClient: SettingsClient) {}

  /**
   * Starts the chat width adjuster.
   * Immediately injects the saved width style, then observes DOM for the settings menu.
   */
  async start() {
    // 1. Fetch saved settings and apply immediately (handles existing/new chats)
    const settings = await this.settingsClient.getSettings();
    const currentWidth = settings.chatWidth ?? ChatWidthAdjuster.DEFAULT_WIDTH;
    this.injectStyle(currentWidth);

    // 2. Scan for any already open menus
    const existingMenu = document.querySelector('gem-menu');
    if (existingMenu) {
      this.injectSliderItem(existingMenu, currentWidth);
    }

    // 3. Observe dynamic popovers inserted at body root
    const observer = new MutationObserver(async (mutations) => {
      for (const mutation of mutations) {
        for (const addedNode of Array.from(mutation.addedNodes)) {
          if (addedNode.nodeType === Node.ELEMENT_NODE) {
            const el = addedNode as HTMLElement;
            const menu = el.tagName === 'GEM-MENU' ? el : el.querySelector('gem-menu');
            if (menu) {
              const freshSettings = await this.settingsClient.getSettings();
              const width = freshSettings.chatWidth ?? ChatWidthAdjuster.DEFAULT_WIDTH;
              this.injectSliderItem(menu, width);
            }
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Injects or updates a global style tag targeting the chat container's max-width.
   * This overrides Gemini's high-specificity selector dynamically and applies immediately.
   */
  private injectStyle(width: number) {
    let styleEl = document.getElementById(ChatWidthAdjuster.STYLE_ID) as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = ChatWidthAdjuster.STYLE_ID;
      (document.head || document.documentElement).appendChild(styleEl);
    }

    // Target the main chat containers, model-responses, and user-queries
    styleEl.textContent = `
      infinite-scroller .conversation-container,
      .conversation-container[_ngcontent-ng-c3355167462],
      .conversation-container,
      .conversation-container user-query,
      user-query[_ngcontent-ng-c3355167462],
      user-query {
        max-width: ${width}px !important;
      }
    `;
  }

  /**
   * Injects the custom slider menu item natively into the gem-menu container.
   */
  private injectSliderItem(menu: Element, currentWidth: number) {
    // 1. Identify if the currently opened gem-menu belongs to the conversation actions menu
    const activeTrigger = document.querySelector('conversation-actions-icon [aria-expanded="true"]');
    if (!activeTrigger) {
      return;
    }

    // 2. Correlate with the trigger's aria-controls to prevent wrong injection
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
    if (menu.querySelector('[value="chat-width"]')) {
      return;
    }

    // Create a thin divider before the slider item if elements exist
    if (menu.children.length > 0) {
      const divider = document.createElement('div');
      divider.style.height = '1px';
      divider.style.background = 'rgba(128, 128, 128, 0.15)';
      divider.style.margin = '4px 0';
      menu.appendChild(divider);
    }

    // Create the slider menu item
    const sliderItem = this.createSliderItem(currentWidth);
    menu.appendChild(sliderItem);
  }

  /**
   * Factory method to build a custom <gem-menu-item> with a slider and value badge.
   */
  private createSliderItem(initialWidth: number): HTMLElement {
    const item = document.createElement('gem-menu-item');
    item.setAttribute('role', 'menuitem');
    item.setAttribute('value', 'chat-width');
    item.setAttribute('tabindex', '-1');
    item.classList.add('ng-star-inserted');

    item.style.display = 'block';
    item.style.cursor = 'default';
    item.style.transition = 'background-color 0.15s ease';

    // Outer padding box
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.padding = '10px 16px';
    container.style.gap = '8px';

    // Simulated hover background
    item.addEventListener('mouseenter', () => {
      item.style.background = 'rgba(128, 128, 128, 0.04)';
    });
    item.addEventListener('mouseleave', () => {
      item.style.background = 'transparent';
    });

    // --- Row 1: Icon, Label, and Value Badge ---
    const row1 = document.createElement('div');
    row1.style.display = 'flex';
    row1.style.alignItems = 'center';
    row1.style.justifyContent = 'space-between';
    row1.style.width = '100%';

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
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ruler-dimension-line"><path d="M10 15v-3"/><path d="M14 15v-3"/><path d="M18 15v-3"/><path d="M2 8V4"/><path d="M22 6H2"/><path d="M22 8V4"/><path d="M6 15v-3"/><rect x="2" y="12" width="20" height="8" rx="2"/></svg>
    `;

    const labelSpan = document.createElement('span');
    labelSpan.style.fontFamily = 'Inter, Roboto, sans-serif';
    labelSpan.style.fontSize = '14px';
    labelSpan.style.color = 'var(--fallback-color-on-surface, #1f1f1f)';
    labelSpan.style.fontWeight = '500';
    labelSpan.textContent = 'Chat Width';

    leading.appendChild(iconContainer);
    leading.appendChild(labelSpan);

    // Trailing Badge
    const badge = document.createElement('span');
    badge.style.fontFamily = 'monospace';
    badge.style.fontSize = '12px';
    badge.style.padding = '2px 6px';
    badge.style.background = 'rgba(128, 128, 128, 0.12)';
    badge.style.borderRadius = '4px';
    badge.style.color = 'var(--fallback-color-on-surface, #1f1f1f)';
    badge.style.fontWeight = '600';
    badge.textContent = `${initialWidth}px`;

    row1.appendChild(leading);
    row1.appendChild(badge);

    // --- Row 2: Range Slider Control ---
    const row2 = document.createElement('div');
    row2.style.display = 'flex';
    row2.style.alignItems = 'center';
    row2.style.width = '100%';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '400';
    slider.max = '1120';
    slider.step = '20';
    slider.value = String(initialWidth);
    slider.style.width = '100%';
    slider.style.cursor = 'pointer';
    slider.style.accentColor = 'cornflowerblue';
    slider.style.margin = '4px 0';
    slider.style.outline = 'none';

    // Prevent standard click/mousedown events from bubbling up and closing the menu
    const stopEvents = ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'input', 'change'];
    stopEvents.forEach((event) => {
      slider.addEventListener(event, (e) => {
        e.stopPropagation();
      });
    });

    // Real-time adjustment (dragging)
    slider.addEventListener('input', () => {
      const val = parseInt(slider.value);
      badge.textContent = `${val}px`;
      this.injectStyle(val);
    });

    // Finalize save on mouse up / release
    slider.addEventListener('change', async () => {
      const val = parseInt(slider.value);
      try {
        await this.settingsClient.saveSettings({ chatWidth: val });
        console.log('[Gemini Downloader] Saved new chat width:', val);
      } catch (err) {
        console.error('[Gemini Downloader] Failed to save chat width:', err);
      }
    });

    row2.appendChild(slider);

    container.appendChild(row1);
    container.appendChild(row2);
    item.appendChild(container);

    return item;
  }
}
