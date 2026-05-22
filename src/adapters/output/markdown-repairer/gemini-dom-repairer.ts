import { MarkdownRepairer } from '../../../core/ports/markdown-repairer';
import { SimpleMarkdownParser } from '../../../infra/simple-markdown-parser';

export class GeminiDomMarkdownRepairer implements MarkdownRepairer {
  isBroken(element: HTMLElement): boolean {
    const codeNodes = element.querySelectorAll('pre, code');
    console.log(`[Gemini Dom Repairer] Checking isBroken. Found ${codeNodes.length} pre/code elements inside target message-content.`);
    
    for (let i = 0; i < codeNodes.length; i++) {
      const node = codeNodes[i];
      const text = node.textContent || '';
      const sample = text.length > 60 ? text.substring(0, 60) + '...' : text;
      const hasTripleBackticks = text.includes('```');
      console.log(`  -> Code node #${i + 1} (${node.tagName}): has TripleBackticks? ${hasTripleBackticks}.`);
      
      if (hasTripleBackticks) {
        console.log(`  [MATCH] Found broken markdown pattern in code node #${i + 1}!`);
        return true;
      }
    }
    return false;
  }

  repair(element: HTMLElement): HTMLElement {
    const codeNodes = element.querySelectorAll('pre, code');
    
    for (const node of Array.from(codeNodes)) {
      const text = node.textContent || '';
      if (text.includes('```')) {
        // Target the outer broken code-block component itself to wipe it out completely!
        const targetToReplace = node.closest('code-block') || node.closest('pre') || node;
        console.log('[Gemini Dom Repairer] Identified target code-block element to replace completely:', targetToReplace);

        // 1. Cleanly clone the node and remove any embedded fix button to avoid text leakage (e.g. "build", "auto_fix_high")
        const cleanClone = node.cloneNode(true) as HTMLElement;
        const embedBtn = cleanClone.querySelector('.gemini-markdown-fix-btn');
        if (embedBtn) {
          embedBtn.remove();
        }
        const rawMarkdown = cleanClone.textContent?.trim() || '';
        console.log('[Gemini Dom Repairer] Cleanly extracted raw markdown:', rawMarkdown);

        // 2. Parse using the simple markdown parser to get beautiful standalone resetted elements
        const repairedNode = SimpleMarkdownParser.parse(rawMarkdown);

        // 3. Swap the broken code-block branch directly inside the live tree
        targetToReplace.replaceWith(repairedNode);
        console.log('[Gemini Dom Repairer] Swapped broken code-block with standalone contrast block successfully.');
      }
    }

    return element;
  }
}
