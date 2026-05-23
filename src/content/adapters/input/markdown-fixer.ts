import { RepairMarkdownUseCase } from '../../core/usecases/repair-markdown';

export class MarkdownFixer {
  private activeObservers = new Map<Element, MutationObserver>();
  private debounceTimers = new Map<Element, number>();

  constructor(private repairUseCase: RepairMarkdownUseCase) {}

  /**
   * Starts observing the DOM for Gemini's model responses.
   */
  start() {
    // 1. Scan for any existing model-responses
    const existingResponses = document.querySelectorAll('model-response');
    console.log(`[Markdown Fixer] Initializing. Found ${existingResponses.length} existing model-response elements.`);
    existingResponses.forEach((mr) => this.trackModelResponse(mr));

    // 2. Observe dynamic changes to detect new model-responses
    const bodyObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const addedNode of Array.from(mutation.addedNodes)) {
          if (addedNode.nodeType === Node.ELEMENT_NODE) {
            const el = addedNode as HTMLElement;
            const modelResponses = el.tagName === 'MODEL-RESPONSE' 
              ? [el] 
              : Array.from(el.querySelectorAll('model-response'));

            if (modelResponses.length > 0) {
              console.log(`[Markdown Fixer] Mutation detected ${modelResponses.length} new model-response elements.`);
            }
            modelResponses.forEach((mr) => this.trackModelResponse(mr));
          }
        }
      }
    });

    bodyObserver.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Tracks a single model-response element to monitor its streaming changes.
   */
  private trackModelResponse(mr: Element) {
    if (mr.getAttribute('data-markdown-fixer-tracked') === 'true') {
      return;
    }
    mr.setAttribute('data-markdown-fixer-tracked', 'true');
    console.log('[Markdown Fixer] Tracking new model-response element:', mr);

    // 1. Immediately check for past conversations that are already fully loaded
    const messageContent = mr.querySelector('message-content') as HTMLElement;
    if (messageContent) {
      console.log('[Markdown Fixer] message-content found. Initiating immediate check...');
      this.checkForBrokenMarkdownAndInject(messageContent);
    } else {
      console.log('[Markdown Fixer] message-content not found in this model-response yet (could be streaming).');
    }

    // 2. Create an observer to watch for dynamic updates (streaming response)
    const observer = new MutationObserver(() => {
      this.resetDebounceTimer(mr);
    });

    observer.observe(mr, { childList: true, characterData: true, subtree: true });
    this.activeObservers.set(mr, observer);

    // 3. Fallback check for active streaming delay
    this.resetDebounceTimer(mr);
  }

  /**
   * Resets the debounce timer. When the timer fires, we know streaming has ended.
   */
  private resetDebounceTimer(mr: Element) {
    if (this.debounceTimers.has(mr)) {
      clearTimeout(this.debounceTimers.get(mr));
    }

    const timer = window.setTimeout(() => {
      this.onStreamingFinished(mr);
    }, 1000); // 1.0 second without any DOM changes suggests it has finished streaming

    this.debounceTimers.set(mr, timer);
  }

  /**
   * Called when the model-response has finished streaming completely.
   */
  private onStreamingFinished(mr: Element) {
    // Clean up observer and timers for this element since it's fully rendered
    const observer = this.activeObservers.get(mr);
    if (observer) {
      observer.disconnect();
      this.activeObservers.delete(mr);
    }
    this.debounceTimers.delete(mr);

    const messageContent = mr.querySelector('message-content') as HTMLElement;
    if (!messageContent) return;

    console.log('[Markdown Fixer] Streaming finished. Initiating layout check...');
    this.checkForBrokenMarkdownAndInject(messageContent);
  }

  /**
   * Inspects content, identifies broken markdown elements, and triggers button injection directly on the broken element.
   */
  private checkForBrokenMarkdownAndInject(messageContent: HTMLElement) {
    const isBroken = this.repairUseCase.check(messageContent);
    console.log(`[Markdown Fixer] Diagnosis result: isBroken=${isBroken}`);

    if (isBroken) {
      const codeNodes = messageContent.querySelectorAll('pre, code');
      for (const node of Array.from(codeNodes)) {
        if (node.textContent?.includes('```')) {
          // Identify pre Node or use itself if none found
          const preNode = node.tagName === 'PRE' ? node : node.closest('pre') || node;
          
          // Inject the button directly on the broken element (typically the PRE block)
          this.injectFixButton(messageContent, preNode as HTMLElement);
          break; // Anchor to the first detected broken segment
        }
      }
    }
  }

  /**
   * Injects a native-looking floating "Fix Markdown" button directly inside the target broken element.
   */
  private injectFixButton(messageContent: HTMLElement, hostElement: HTMLElement) {
    if (hostElement.querySelector('.gemini-markdown-fix-btn')) {
      console.log('[Markdown Fixer] Fix button already exists inside this element.');
      return; // Already has a fix button
    }
    console.log('[Markdown Fixer] Injecting floating Fix Layout button inside host element:', hostElement);

    // Ensure host is positioned relative to anchor the absolute button properly
    hostElement.style.position = 'relative';

    // Create action button
    const btn = document.createElement('button');
    btn.className = 'gemini-markdown-fix-btn';
    btn.setAttribute('title', 'Fix formatting and layout of this message');
    
    // Modern premium rounded rectangle styles matching Gemini's theme
    Object.assign(btn.style, {
      position: 'absolute',
      top: '8px',
      right: '-60px', // Placed nicely outside the code-block to avoid covering text
      height: '28px', // Slightly taller for better button proportions
      padding: '4px 8px', // Increased vertical proportion (tighter horizontal)
      borderRadius: '6px',
      border: '1px solid rgba(128, 128, 128, 0.25)',
      backgroundColor: 'var(--fallback-color-surface-container-high, #e3e9f4)',
      color: 'var(--fallback-color-on-surface, #1f1f1f)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '999',
      boxShadow: '0 2px 5px rgba(0,0,0,0.12)',
      fontSize: '12px', // Slightly larger font size for premium visibility
      fontWeight: '700',
      fontFamily: 'inherit',
      transition: 'background-color 0.18s ease-out, border-color 0.18s ease-out'
    });

    btn.textContent = 'Fix';

    // Hover transitions (No scale enlarging)
    btn.addEventListener('mouseenter', () => {
      btn.style.backgroundColor = 'var(--fallback-color-surface-container-highest, #d6e2f7)';
      btn.style.borderColor = 'rgba(128, 128, 128, 0.35)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.backgroundColor = 'var(--fallback-color-surface-container-high, #e3e9f4)';
      btn.style.borderColor = 'rgba(128, 128, 128, 0.25)';
    });

    // Handle button action
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Execute repair logic (mutates messageContent in-place losslessly)
      const repaired = this.repairUseCase.execute(messageContent);
      if (repaired) {
        // Show a nice micro-animation on the repaired area
        messageContent.animate([
          { opacity: 0.4 },
          { opacity: 1 }
        ], {
          duration: 300,
          easing: 'ease-out'
        });

        console.log('[Gemini Downloader] Successfully repaired broken markdown branches in place.');

        // Remove the button since formatting is now perfect
        btn.remove();
      }
    });

    hostElement.appendChild(btn);
  }
}
