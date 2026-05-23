export class SimpleMarkdownParser {
  static parse(markdown: string): HTMLElement {
    const container = document.createElement('div');
    container.classList.add('markdown', 'repaired-markdown');
    
    const lines = markdown.split(/\r?\n/);
    
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeLines: string[] = [];
    
    let inList = false;
    let listTag = ''; // 'UL' or 'OL'
    let listElement: HTMLElement | null = null;
    
    const flushList = () => {
      if (inList && listElement) {
        container.appendChild(listElement);
        inList = false;
        listElement = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // 1. Code Block
      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          // Close code block
          const pre = document.createElement('pre');
          pre.className = 'repaired-code-block';
          
          const code = document.createElement('code');
          if (codeLanguage) {
            code.className = `language-${codeLanguage} lang-${codeLanguage} hljs`;
            code.setAttribute('data-language', codeLanguage);
          }
          code.textContent = codeLines.join('\n');
          pre.appendChild(code);
          container.appendChild(pre);
          
          inCodeBlock = false;
          codeLines = [];
          codeLanguage = '';
        } else {
          flushList();
          inCodeBlock = true;
          codeLanguage = trimmed.substring(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      // 2. Empty Line
      if (trimmed === '') {
        flushList();
        continue;
      }

      // 3. Headings
      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        flushList();
        const level = headingMatch[1].length;
        const headingText = headingMatch[2];
        const h = document.createElement(`h${level}`);
        h.innerHTML = this.parseInline(headingText);
        container.appendChild(h);
        continue;
      }

      // 4. Horizontal Rule
      if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
        flushList();
        container.appendChild(document.createElement('hr'));
        continue;
      }

      // 5. Unordered List (*, -)
      const ulMatch = line.match(/^(\s*)([*+-])\s+(.*)$/);
      if (ulMatch) {
        const content = ulMatch[3];
        if (!inList || listTag !== 'UL') {
          flushList();
          inList = true;
          listTag = 'UL';
          listElement = document.createElement('ul');
        }
        const li = document.createElement('li');
        li.innerHTML = this.parseInline(content);
        listElement!.appendChild(li);
        continue;
      }

      // 6. Ordered List (1., 2.)
      const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
      if (olMatch) {
        const content = olMatch[3];
        if (!inList || listTag !== 'OL') {
          flushList();
          inList = true;
          listTag = 'OL';
          listElement = document.createElement('ol');
        }
        const li = document.createElement('li');
        li.innerHTML = this.parseInline(content);
        listElement!.appendChild(li);
        continue;
      }

      // 7. Paragraph
      flushList();
      const p = document.createElement('p');
      p.innerHTML = this.parseInline(line);
      container.appendChild(p);
    }

    // Flush any remaining active blocks
    flushList();
    if (inCodeBlock && codeLines.length > 0) {
      const pre = document.createElement('pre');
      pre.className = 'repaired-code-block';
      
      // Dynamically detect theme
      const isDarkMode = document.body.classList.contains('dark-theme') || 
                         document.documentElement.classList.contains('dark-theme') ||
                         window.matchMedia('(prefers-color-scheme: dark)').matches;

      // Theme-reversed colors (Light background for Dark mode, Dark background for Light mode)
      const bgColor = isDarkMode ? '#f5f5f5' : '#1e1e1e';
      const textColor = isDarkMode ? '#1a1a1a' : '#f8f8f2';
      const borderColor = isDarkMode ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.15)';

      // Apply beautiful high-contrast standalone code box styles
      pre.style.backgroundColor = bgColor;
      pre.style.color = textColor;
      pre.style.border = `1px solid ${borderColor}`;
      pre.style.borderRadius = '8px';
      pre.style.padding = '12px 16px';
      pre.style.margin = '12px 0';
      pre.style.fontFamily = 'monospace';
      pre.style.fontSize = '14px';
      pre.style.overflowX = 'auto';
      pre.style.display = 'block';

      const code = document.createElement('code');
      code.className = 'code-container formatted';
      
      if (codeLanguage) {
        code.classList.add(`language-${codeLanguage}`, `lang-${codeLanguage}`);
        code.setAttribute('data-language', codeLanguage);
      }
      
      // Ensure zero style conflict inside our custom block
      code.style.background = 'transparent';
      code.style.backgroundColor = 'transparent';
      code.style.border = 'none';
      code.style.color = 'inherit';
      code.style.fontFamily = 'inherit';
      code.style.fontSize = 'inherit';
      code.style.padding = '0';
      
      code.textContent = codeLines.join('\n');
      pre.appendChild(code);
      container.appendChild(pre);
    }

    return container;
  }

  private static parseInline(text: string): string {
    // Escape HTML to prevent XSS
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // Bold: **text**
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic: *text* or _text_
    escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
    escaped = escaped.replace(/_(.*?)_/g, '<em>$1</em>');

    // Inline Code: `code`
    escaped = escaped.replace(/`(.*?)`/g, '<code>$1</code>');

    // Links: [text](url)
    escaped = escaped.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    return escaped;
  }
}
