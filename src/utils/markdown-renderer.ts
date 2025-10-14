import { marked } from 'marked';

/**
 * Markdown-Rendering-Abstraktionsschicht
 * 
 * Diese Funktion kann später durch ChurchTools Backend-Rendering ersetzt werden.
 * Aktuell verwendet sie die 'marked' Library für Client-seitiges Rendering.
 * 
 * @param markdown - Markdown-Text (kann Platzhalter enthalten)
 * @returns HTML-String
 * 
 * @example
 * const html = await renderMarkdown("# Hallo {{name}}\n\nWillkommen!");
 */
export async function renderMarkdown(markdown: string): Promise<string> {
  if (!markdown) return '';
  
  // TODO: Später durch ChurchTools Backend-API ersetzen:
  // return await churchtoolsApi.renderMarkdown(markdown);
  
  // Aktuell: Client-seitiges Rendering mit 'marked'
  try {
    const html = await marked.parse(markdown, {
      // Sicherheitseinstellungen
      breaks: true,        // Zeilenumbrüche als <br>
      gfm: true,          // GitHub Flavored Markdown
    });
    
    return sanitizeHtml(html);
  } catch (error) {
    console.error('Markdown rendering failed:', error);
    // Fallback: Zeige Original-Text
    return escapeHtml(markdown);
  }
}

/**
 * Synchrone Variante für einfache Fälle
 * (Wenn Backend-API nicht verfügbar ist)
 */
export function renderMarkdownSync(markdown: string): string {
  if (!markdown) return '';
  
  try {
    const html = marked.parse(markdown, {
      breaks: true,
      gfm: true,
    }) as string;
    
    return sanitizeHtml(html);
  } catch (error) {
    console.error('Markdown rendering failed:', error);
    return escapeHtml(markdown);
  }
}

/**
 * Basis-HTML-Sanitization
 * Entfernt gefährliche Tags und Attribute
 * 
 * WICHTIG: Dies ist eine einfache Implementierung.
 * Für Produktion sollte eine robuste Library wie DOMPurify verwendet werden.
 */
function sanitizeHtml(html: string): string {
  // Entferne gefährliche Tags
  const dangerousTags = ['script', 'iframe', 'object', 'embed', 'link', 'style'];
  let sanitized = html;
  
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gis');
    sanitized = sanitized.replace(regex, '');
    // Auch selbstschließende Tags
    const selfClosing = new RegExp(`<${tag}[^>]*/>`, 'gi');
    sanitized = sanitized.replace(selfClosing, '');
  });
  
  // Entferne on*-Event-Handler
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Entferne javascript: URLs
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
  
  return sanitized;
}

/**
 * HTML-Escaping für Fallback
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * ChurchTools Backend-Integration (Platzhalter für zukünftige Implementierung)
 * 
 * Beispiel-Verwendung:
 * 
 * ```typescript
 * import { churchtoolsApi } from '@/services/churchtools-api';
 * 
 * export async function renderMarkdown(markdown: string): Promise<string> {
 *   try {
 *     // ChurchTools Backend-Rendering
 *     const response = await churchtoolsApi.post('/api/markdown/render', {
 *       markdown: markdown,
 *       options: {
 *         sanitize: true,
 *         allowHtml: false
 *       }
 *     });
 *     return response.data.html;
 *   } catch (error) {
 *     console.error('ChurchTools markdown rendering failed:', error);
 *     // Fallback auf Client-Rendering
 *     return renderMarkdownSync(markdown);
 *   }
 * }
 * ```
 */
