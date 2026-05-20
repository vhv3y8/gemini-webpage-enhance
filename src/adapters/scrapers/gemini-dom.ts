import { ChatScraper } from '../../core/ports/scraper';
import { ChatSession, ChatMessage, ChatMessagePart } from '../../core/models/chat';

export class GeminiDomScraper implements ChatScraper {
  async scrape(): Promise<ChatSession> {
    // 1. Get title and clean up common browser suffixes
    let title = document.title || 'Gemini Conversation';
    title = title.replace(/\s+-\s+Gemini$/, '').trim();
    const url = window.location.href;

    const messages: ChatMessage[] = [];

    // 2. Locate all user-query components
    // Angular custom tags are highly stable anchors for Gemini's layout
    const userQueries = document.querySelectorAll('user-query');

    for (const uq of Array.from(userQueries)) {
      // Find the corresponding parent/sibling group
      const parent = uq.closest('.conversation-container') || uq.parentElement;
      if (!parent) continue;

      const mr = parent.querySelector('model-response');

      // A. Parse User Query
      const uqClone = uq.cloneNode(true) as HTMLElement;
      
      // Remove visual elements that are just for screen readers or UI controls
      const uiNoise = uqClone.querySelectorAll(
        '.cdk-visually-hidden, .screen-reader-user-query-label, [aria-hidden="true"], button, luminous-toggle-container'
      );
      uiNoise.forEach(el => el.remove());

      // Attempt to extract prompt text line by line or fallback to bubble container
      const queryParagraphs = Array.from(uqClone.querySelectorAll('.query-text-line, p'));
      let userText = '';

      if (queryParagraphs.length > 0) {
        userText = queryParagraphs
          .map(p => p.textContent?.trim() || '')
          .filter(Boolean)
          .join('\n\n');
      } else {
        const queryTextNode = uqClone.querySelector('.query-text, .user-query-bubble-with-background');
        userText = queryTextNode ? queryTextNode.textContent?.trim() || '' : uqClone.innerText?.trim() || '';
      }

      if (!userText) continue; // Skip empty nodes

      messages.push({
        role: 'user',
        parts: [{ type: 'text', content: userText }]
      });

      // B. Parse Model Response
      if (mr) {
        const messageContent = mr.querySelector('message-content');
        if (messageContent) {
          // Look for standard markdown-rendered wrapper inside the message content
          const markdownContainer = messageContent.querySelector('.markdown') || messageContent;
          const parsedParts = this.parseModelContent(markdownContainer);
          
          if (parsedParts.length > 0) {
            messages.push({
              role: 'model',
              parts: parsedParts
            });
          }
        }
      }
    }

    return {
      title,
      url,
      scrapedAt: Date.now(),
      messages
    };
  }

  /**
   * Parses the HTML elements inside the model's markdown container into structured parts.
   */
  private parseModelContent(container: Element): ChatMessagePart[] {
    const parts: ChatMessagePart[] = [];
    let accumulatedText = '';

    // Direct children represents paragraphs, lists, headers, code blocks, etc.
    const children = Array.from(container.children);

    for (const child of children) {
      const tagName = child.tagName;

      if (tagName === 'PRE' || child.querySelector('pre')) {
        // Find actual <pre> node if child is a wrapper
        const preNode = tagName === 'PRE' ? child : child.querySelector('pre')!;
        const codeNode = preNode.querySelector('code') || preNode;
        const codeText = codeNode.textContent || '';

        // Extract programming language from class list
        let language = '';
        const possibleClasses = Array.from(codeNode.classList).concat(Array.from(preNode.classList));
        for (const cls of possibleClasses) {
          if (cls.startsWith('lang-') || cls.startsWith('language-')) {
            language = cls.replace(/^(lang-|language-)/, '');
            break;
          }
        }

        // Flush any accumulated text part before inserting the code block
        if (accumulatedText.trim()) {
          parts.push({
            type: 'text',
            content: accumulatedText.trim()
          });
          accumulatedText = '';
        }

        parts.push({
          type: 'code',
          content: codeText,
          language: language || undefined
        });
      } else {
        // Standard text elements: Paragraphs, lists, headings
        accumulatedText += this.elementToMarkdown(child);
      }
    }

    // Flush any remaining text at the end
    if (accumulatedText.trim()) {
      parts.push({
        type: 'text',
        content: accumulatedText.trim()
      });
    }

    return parts;
  }

  /**
   * Converts a generic HTML element into simple Markdown.
   */
  private elementToMarkdown(element: Element): string {
    const tag = element.tagName;

    // Headings
    if (/^H[1-6]$/.test(tag)) {
      const level = parseInt(tag.substring(1));
      const prefix = '#'.repeat(level);
      return `${prefix} ${this.parseInlineFormatting(element)}\n\n`;
    }

    // Paragraphs
    if (tag === 'P') {
      return `${this.parseInlineFormatting(element)}\n\n`;
    }

    // Unordered list
    if (tag === 'UL') {
      const lis = Array.from(element.children).filter(el => el.tagName === 'LI');
      return lis.map(li => `* ${this.parseInlineFormatting(li)}`).join('\n') + '\n\n';
    }

    // Ordered list
    if (tag === 'OL') {
      const lis = Array.from(element.children).filter(el => el.tagName === 'LI');
      return lis.map((li, idx) => `${idx + 1}. ${this.parseInlineFormatting(li)}`).join('\n') + '\n\n';
    }

    // Horizontal Rule
    if (tag === 'HR') {
      return '---\n\n';
    }

    // Blockquote
    if (tag === 'BLOCKQUOTE') {
      return `> ${this.parseInlineFormatting(element)}\n\n`;
    }

    // Fallback to text text content with formatting if unrecognized
    const text = this.parseInlineFormatting(element);
    return text ? `${text}\n\n` : '';
  }

  /**
   * Helper to parse inline formatting elements like links, bold, italics, code.
   */
  private parseInlineFormatting(element: Element): string {
    let markdownText = '';

    element.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        markdownText += child.textContent;
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element;
        const tag = el.tagName;
        const text = el.textContent || '';

        if (tag === 'B' || tag === 'STRONG') {
          markdownText += `**${text}**`;
        } else if (tag === 'I' || tag === 'EM') {
          markdownText += `*${text}*`;
        } else if (tag === 'CODE') {
          markdownText += `\`${text}\``;
        } else if (tag === 'A') {
          const href = el.getAttribute('href') || '';
          markdownText += `[${text}](${href})`;
        } else {
          // Recurse for elements nested inside lists or divs
          markdownText += this.parseInlineFormatting(el);
        }
      }
    });

    return markdownText.trim();
  }
}
