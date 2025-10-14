/**
 * Extrahiert HTML mit inline-Styles aus einem gerenderten Element
 * 
 * Diese Funktion nimmt HTML-String und fügt computed styles als inline-styles hinzu,
 * damit das HTML auch außerhalb der Anwendung korrekt dargestellt wird.
 */
export function extractStyledHTML(html: string): string {
  // Erstelle temporäres DOM-Element
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Durchlaufe alle Elemente und füge computed styles hinzu
  addInlineStyles(temp);
  
  return temp.innerHTML;
}

function addInlineStyles(element: HTMLElement) {
  // Hole computed styles für dieses Element
  const computed = window.getComputedStyle(element);
  
  // Wichtige Style-Properties die wir übernehmen wollen
  const importantProps = [
    'color',
    'background-color',
    'font-size',
    'font-weight',
    'font-style',
    'font-family',
    'line-height',
    'margin',
    'padding',
    'border',
    'border-radius',
    'text-align',
    'text-decoration',
    'display',
  ];
  
  // Erstelle inline-style string
  const inlineStyles: string[] = [];
  importantProps.forEach(prop => {
    const value = computed.getPropertyValue(prop);
    if (value && value !== 'none' && value !== 'normal') {
      inlineStyles.push(`${prop}: ${value}`);
    }
  });
  
  if (inlineStyles.length > 0) {
    element.setAttribute('style', inlineStyles.join('; '));
  }
  
  // Rekursiv für alle Kinder
  Array.from(element.children).forEach(child => {
    if (child instanceof HTMLElement) {
      addInlineStyles(child);
    }
  });
}

/**
 * Extrahiert nur HTML-Tags ohne Styles
 */
export function extractPlainHTML(html: string): string {
  // Entferne alle style-Attribute
  return html.replace(/\s+style="[^"]*"/g, '');
}
