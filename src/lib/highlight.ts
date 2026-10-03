import hljs from 'highlight.js/lib/core';
import csharp from 'highlight.js/lib/languages/csharp';
import go from 'highlight.js/lib/languages/go';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import kotlin from 'highlight.js/lib/languages/kotlin';
import python from 'highlight.js/lib/languages/python';
import rust from 'highlight.js/lib/languages/rust';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';

hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('go', go);
hljs.registerLanguage('java', java);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('kotlin', kotlin);
hljs.registerLanguage('python', python);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('typescript', typescript);

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Highlights a single line; multi-line constructs (block comments) may lose color. */
export function highlightLine(code: string, language: string): string {
  if (!hljs.getLanguage(language)) return escapeHtml(code);
  return hljs.highlight(code, { language, ignoreIllegals: true }).value;
}
