export class ScrollNavigator {
  private container: HTMLElement | null = null;
  private navElement: HTMLDivElement | null = null;
  private observer: MutationObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private queries: HTMLElement[] = [];
  private activeIndex: number = -1;

  constructor() {}

  /**
   * Starts observing the document to find and inject the ScrollNavigator.
   */
  start() {
    // 1. Initial check
    this.checkAndInject();

    // 2. Observe DOM mutations for infinite-scroller additions or deletions
    this.observer = new MutationObserver(() => {
      this.checkAndInject();
    });
    this.observer.observe(document.body, { childList: true, subtree: true });

    // 3. Listen to window resize events to keep heights perfectly synced
    window.addEventListener('resize', this.handleResize);
  }

  /**
   * Cleans up observers and listeners when needed.
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    window.removeEventListener('resize', this.handleResize);
    if (this.navElement && this.navElement.parentElement) {
      this.navElement.remove();
    }
    this.container = null;
    this.navElement = null;
  }

  /**
   * Checks if infinite-scroller is present and injects the scroll indicator bar.
   */
  private checkAndInject() {
    // Specifically target the infinite-scroller within chat-window to avoid history list sidebar
    const scroller = document.querySelector('chat-window infinite-scroller') as HTMLElement;
    if (!scroller) {
      if (this.navElement) {
        this.navElement.remove();
        this.navElement = null;
      }
      this.container = null;
      return;
    }

    if (this.container === scroller && this.navElement && this.navElement.parentElement && document.body.contains(this.navElement)) {
      this.updateQueriesAndPositions();
      return;
    }

    // New or replaced scroller container detected
    this.container = scroller;
    this.injectNavigator();
  }

  /**
   * Injects the main navigation bar element.
   */
  private injectNavigator() {
    if (this.navElement) {
      this.navElement.remove();
    }

    // 1. Create outer wrapper container
    // Positioned right next to the scrollbar (right: 24px aligns it beautifully left of the default scrollbar)
    const nav = document.createElement('div');
    nav.id = 'gemini-scroll-navigator';
    nav.style.position = 'absolute';
    nav.style.right = '24px';
    nav.style.top = '32px';
    nav.style.bottom = '32px';
    nav.style.width = '26px';
    nav.style.zIndex = '999';
    nav.style.display = 'none'; // Initially hidden, shown if > 1 queries
    nav.style.flexDirection = 'column';
    nav.style.alignItems = 'center';
    nav.style.pointerEvents = 'none'; // Don't block background pointer interactions
    
    // 2. Create the sleek vertical track line (Thick modern pill bar)
    const track = document.createElement('div');
    track.style.position = 'absolute';
    track.style.left = '50%';
    track.style.transform = 'translateX(-50%)';
    track.style.top = '0';
    track.style.bottom = '0';
    track.style.width = '26px';
    track.style.background = 'rgba(128, 128, 128, 0.18)';
    track.style.borderRadius = '13px';
    
    nav.appendChild(track);

    // Append to scroller's parent (chat-window or outer wrapper) to ensure it stays static on scroll
    const parent = this.container!.parentElement || this.container!;
    const originalPosition = window.getComputedStyle(parent).position;
    if (originalPosition === 'static') {
      (parent as HTMLElement).style.position = 'relative';
    }
    parent.appendChild(nav);
    this.navElement = nav;

    // 3. Listen to scroll events for scrollspy
    this.container!.addEventListener('scroll', this.handleScroll, { passive: true });

    // 4. Setup ResizeObserver to handle content height/reflow changes dynamically
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.resizeObserver = new ResizeObserver(() => {
      this.updateQueriesAndPositions();
    });
    this.resizeObserver.observe(this.container!);
    
    // Also observe the inner content wrapper if present
    const innerContent = this.container!.firstElementChild;
    if (innerContent) {
      this.resizeObserver.observe(innerContent);
    }

    this.updateQueriesAndPositions();
  }

  /**
   * Scrapes all user-queries and places the dots proportionally.
   */
  private updateQueriesAndPositions() {
    if (!this.container || !this.navElement) return;

    const currentQueries = Array.from(this.container.querySelectorAll('user-query')) as HTMLElement[];
    
    // Check if query list actually changed to prevent excessive DOM repaints
    const listChanged = currentQueries.length !== this.queries.length || 
                        currentQueries.some((q, i) => q !== this.queries[i]);
    
    if (listChanged) {
      this.queries = currentQueries;
      this.rebuildDots();
    } else {
      this.repositionDots();
    }
  }

  /**
   * Rebuilds all dot indicators inside the navigator bar.
   */
  private rebuildDots() {
    if (!this.navElement) return;

    // Clear existing dots (keeping only the track line)
    const track = this.navElement.firstElementChild;
    this.navElement.replaceChildren();
    if (track) {
      this.navElement.appendChild(track);
    }

    if (this.queries.length === 0) {
      this.navElement.style.display = 'none';
      return;
    }

    // Show indicator container only if there's scrollable query actions
    this.navElement.style.display = this.queries.length >= 2 ? 'flex' : 'none';

    this.queries.forEach((uq, index) => {
      // Extract clean user query text preview for the tooltip
      const uqClone = uq.cloneNode(true) as HTMLElement;
      const uiNoise = uqClone.querySelectorAll(
        '.cdk-visually-hidden, .screen-reader-user-query-label, [aria-hidden="true"], button, luminous-toggle-container'
      );
      uiNoise.forEach(el => el.remove());
      const cleanText = uqClone.textContent?.replace(/\s+/g, ' ').trim() || `Chat ${index + 1}`;

      // Create Dot Wrapper (handles bounds and positioning)
      const dotWrapper = document.createElement('div');
      dotWrapper.className = 'scroll-dot-wrapper';
      dotWrapper.style.position = 'absolute';
      dotWrapper.style.left = '50%';
      dotWrapper.style.transform = 'translate(-50%, -50%)';
      dotWrapper.style.width = '26px';
      dotWrapper.style.height = '26px';
      dotWrapper.style.display = 'flex';
      dotWrapper.style.alignItems = 'center';
      dotWrapper.style.justifyContent = 'center';
      dotWrapper.style.pointerEvents = 'none';

      // Create Interactive Dot
      const dot = document.createElement('div');
      dot.className = 'scroll-dot';
      dot.style.width = '26px';
      dot.style.height = '26px';
      dot.style.borderRadius = '50%';
      dot.style.boxSizing = 'border-box';
      dot.style.border = '2px solid transparent';
      dot.style.background = 'var(--fallback-color-on-surface, rgba(128, 128, 128, 0.45))';
      dot.style.transition = 'all 0.2s ease';
      dot.style.cursor = 'pointer';
      dot.style.pointerEvents = 'auto';

      // Create Hover Tooltip (5-line ellipsis, clean fade transition)
      const tooltip = document.createElement('div');
      tooltip.textContent = cleanText;
      tooltip.style.position = 'absolute';
      tooltip.style.right = '34px';
      tooltip.style.top = '50%';
      tooltip.style.transform = 'translateY(-50%)';
      tooltip.style.padding = '6px 12px';
      tooltip.style.borderRadius = '6px';
      tooltip.style.background = 'rgba(30, 30, 30, 0.95)';
      tooltip.style.color = '#ffffff';
      tooltip.style.fontSize = '13px';
      tooltip.style.lineHeight = '1.4';
      tooltip.style.fontWeight = '500';
      tooltip.style.fontFamily = 'Inter, Roboto, sans-serif';
      tooltip.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)';
      tooltip.style.whiteSpace = 'normal';
      tooltip.style.display = '-webkit-box';
      tooltip.style.setProperty('-webkit-box-orient', 'vertical');
      tooltip.style.setProperty('-webkit-line-clamp', '5');
      tooltip.style.width = 'max-content';
      tooltip.style.maxWidth = '250px';
      tooltip.style.overflow = 'hidden';
      tooltip.style.textOverflow = 'ellipsis';
      tooltip.style.opacity = '0';
      tooltip.style.pointerEvents = 'none';
      tooltip.style.transition = 'opacity 0.12s ease-out';
      tooltip.style.border = '1px solid rgba(255, 255, 255, 0.08)';

      dotWrapper.appendChild(dot);
      dotWrapper.appendChild(tooltip);
      this.navElement!.appendChild(dotWrapper);

      // Event Listeners
      dot.addEventListener('mouseenter', () => {
        if (this.activeIndex !== index) {
          dot.style.background = 'cornflowerblue';
          dot.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        }
        tooltip.style.opacity = '1';
      });

      dot.addEventListener('mouseleave', () => {
        if (this.activeIndex !== index) {
          dot.style.background = 'var(--fallback-color-on-surface, rgba(128, 128, 128, 0.45))';
          dot.style.borderColor = 'transparent';
        }
        tooltip.style.opacity = '0';
      });

      dot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const containerRect = this.container!.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(this.container!);
        const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
        
        const offsetTop = uq.getBoundingClientRect().top - containerRect.top + this.container!.scrollTop;
        const targetScrollTop = Math.max(0, offsetTop - paddingTop);
        
        this.smoothScrollTo(targetScrollTop, 350);
      });
    });

    this.repositionDots();
    this.handleScroll(); // Trigger initial ScrollSpy highlight
  }

  /**
   * Updates coordinates and proportionally repositions each dot on the track.
   */
  private repositionDots() {
    if (!this.container || !this.navElement || this.queries.length === 0) return;

    const dotWrappers = Array.from(this.navElement.querySelectorAll('.scroll-dot-wrapper')) as HTMLElement[];
    if (dotWrappers.length !== this.queries.length) return;

    const containerRect = this.container.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(this.container);
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
    const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;

    // Dynamically adjust navElement bounds to sit precisely within scroller content bounds, leaving 16px safety margin
    this.navElement.style.top = `${paddingTop + 16}px`;
    this.navElement.style.bottom = `${paddingBottom + 16}px`;

    // 1. Calculate absolute vertical offsets inside scroll container
    const offsets = this.queries.map(uq => {
      return uq.getBoundingClientRect().top - containerRect.top + this.container!.scrollTop;
    });

    const firstOffset = offsets[0];
    const lastOffset = offsets[offsets.length - 1];
    const offsetRange = lastOffset - firstOffset;

    // 2. Position dots proportionally
    dotWrappers.forEach((wrapper, index) => {
      let pct = 0;
      if (offsets.length > 1 && offsetRange > 0) {
        // Linear scale mapping from first query (0%) to last query (100%)
        pct = (offsets[index] - firstOffset) / offsetRange;
      } else if (offsets.length === 1) {
        pct = 0.5; // Single dot sits centered
      }

      // Constrain within [0, 1] to avoid spilling
      pct = Math.min(1, Math.max(0, pct));
      // Anchor first dot center at 13px (flush top) and last dot center at 100% - 13px (flush bottom)
      wrapper.style.top = `calc((${pct * 100}% - ${pct * 26}px) + 13px)`;
    });
  }

  /**
   * Scroll event handler - updates active class state based on scroll container viewport position (ScrollSpy).
   */
  private handleScroll = () => {
    if (!this.container || !this.navElement || this.queries.length === 0) return;

    const containerRect = this.container.getBoundingClientRect();
    const scrollTop = this.container.scrollTop;

    // Heuristic: Chat is active if its top edge has scrolled past the upper 20% mark of the viewport container
    const activeThreshold = scrollTop + containerRect.height * 0.2;

    let currentActive = 0;
    for (let i = 0; i < this.queries.length; i++) {
      const uq = this.queries[i];
      const offsetTop = uq.getBoundingClientRect().top - containerRect.top + scrollTop;
      
      if (offsetTop <= activeThreshold) {
        currentActive = i;
      } else {
        break;
      }
    }

    if (currentActive !== this.activeIndex) {
      this.activeIndex = currentActive;
      this.highlightActiveDot();
    }
  };

  /**
   * Styles the dots to visually emphasize the active chat segment.
   */
  private highlightActiveDot() {
    if (!this.navElement) return;

    const dotWrappers = Array.from(this.navElement.querySelectorAll('.scroll-dot-wrapper'));
    dotWrappers.forEach((wrapper, index) => {
      const dot = wrapper.querySelector('.scroll-dot') as HTMLElement;
      if (!dot) return;

      if (index === this.activeIndex) {
        // Premium highlighted cornflowerblue active state
        dot.style.background = 'cornflowerblue';
        dot.style.borderColor = '#ffffff';
        dot.style.boxShadow = '0 0 10px rgba(100, 149, 237, 0.5)';
      } else {
        // Standard dormant state
        dot.style.background = 'var(--fallback-color-on-surface, rgba(128, 128, 128, 0.45))';
        dot.style.borderColor = 'transparent';
        dot.style.boxShadow = 'none';
      }
    });
  }

  /**
   * Smoothly scrolls the container to a target position using a premium easeInOutCubic easing.
   */
  private smoothScrollTo(targetTop: number, duration: number = 350) {
    if (!this.container) return;
    const start = this.container.scrollTop;
    const change = targetTop - start;
    const startTime = performance.now();

    const animateScroll = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      if (elapsedTime >= duration) {
        this.container!.scrollTop = targetTop;
        return;
      }

      const t = elapsedTime / duration;
      // easeInOutCubic curve
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      this.container!.scrollTop = start + change * ease;
      requestAnimationFrame(animateScroll);
    };

    requestAnimationFrame(animateScroll);
  }

  private handleResize = () => {
    this.updateQueriesAndPositions();
  };
}
