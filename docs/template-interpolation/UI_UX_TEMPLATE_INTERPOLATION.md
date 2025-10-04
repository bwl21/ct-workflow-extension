# UI/UX Spezifikation: Template-Interpolation

## Übersicht

Dieses Dokument beschreibt die Benutzeroberfläche und User Experience für die Template-Interpolation in Workflows.

## 1. Workflow-Executor (Laufzeit)

### 1.1 Task-Beschreibung mit Platzhaltern

**Kontext:** Benutzer führt einen Workflow aus und sieht einen Task.

**Verhalten:**
- Platzhalter werden **automatisch** durch Werte ersetzt
- Keine visuelle Unterscheidung zwischen normalem Text und interpolierten Werten
- Wenn Platzhalter nicht ersetzt werden kann: Original-Platzhalter anzeigen

**Beispiel:**

```
Task 1: Eingabe
  Name: [Max Mustermann]
  Email: [max@example.com]
  [Weiter]

Task 2: Bestätigung
  ┌─────────────────────────────────────────────┐
  │ Hallo Max Mustermann, bitte bestätigen Sie │
  │ Ihre E-Mail-Adresse.                        │
  └─────────────────────────────────────────────┘
  
  Email: [max@example.com]  ← vorbesetzt, editierbar
  ☐ Ich bestätige die Richtigkeit
  
  [Abbrechen] [Weiter]
```

**Wireframe:**

```
┌─────────────────────────────────────────────────────┐
│ Workflow-Ausführung                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Bestätigung                                        │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  Hallo Max Mustermann, bitte bestätigen Sie Ihre   │
│  E-Mail-Adresse.                                    │
│                                                     │
│  E-Mail *                                           │
│  ┌───────────────────────────────────────────────┐ │
│  │ max@example.com                               │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ☐ Ich bestätige die Richtigkeit *                 │
│                                                     │
│  [Abbrechen]                        [Weiter]        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 1.2 Vorbesetzte Felder

**Verhalten:**
- Felder mit gleichem Namen wie in vorherigen Tasks werden automatisch vorbesetzt
- Felder sind **editierbar** (nicht read-only)
- Keine visuelle Markierung dass Wert vorbesetzt ist
- Benutzer kann Wert ändern oder bestätigen

**Beispiel:**

```
Task 1: Feld "email" = "max@example.com"
Task 2: Feld "email" ist vorbesetzt mit "max@example.com"
        → Benutzer sieht: [max@example.com]
        → Kann ändern zu: [max.neu@example.com]
```

## 2. Workflow-Editor (Design-Zeit)

### 2.1 Task-Node Eigenschaften

**Kontext:** Benutzer bearbeitet eine Task-Node im Workflow-Editor.

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│ Task-Eigenschaften                                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Name *                                             │
│  ┌───────────────────────────────────────────────┐ │
│  │ Bestätigung                                   │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Beschreibung                                       │
│  ┌───────────────────────────────────────────────┐ │
│  │ Hallo {{name}}, bitte bestätigen Sie Ihre    │ │
│  │ E-Mail-Adresse.                               │ │
│  │                                               │ │
│  └───────────────────────────────────────────────┘ │
│  [📋 Platzhalter einfügen ▼]                        │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  Formular-Felder                                    │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Feld 1: email                               │   │
│  │ Typ: E-Mail                                 │   │
│  │ Label: E-Mail                               │   │
│  │ Standardwert: {{email}}                     │   │
│  │ ☑ Pflichtfeld                               │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [+ Feld hinzufügen]                                │
│                                                     │
│  [Abbrechen]                        [Speichern]     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 2.2 Platzhalter-Dropdown

**Trigger:** Click auf "Platzhalter einfügen" Button

**Verhalten:**
- Dropdown öffnet sich **unter** dem Button
- Zeigt alle verfügbaren Variablen aus **vorherigen** Tasks
- Variablen alphabetisch sortiert
- Click auf Variable:
  - Fügt `{{variableName}}` an **Cursor-Position** ein
  - Dropdown schließt sich
  - Focus bleibt im Textfeld

**Wireframe:**

```
┌─────────────────────────────────────────────────────┐
│  Beschreibung                                       │
│  ┌───────────────────────────────────────────────┐ │
│  │ Hallo {{name}}, bitte bestätigen Sie Ihre█   │ │
│  │ E-Mail-Adresse.                               │ │
│  └───────────────────────────────────────────────┘ │
│  [📋 Platzhalter einfügen ▼]                        │
│     ┌─────────────────────────┐                     │
│     │ email                   │ ← Click             │
│     │ name                    │                     │
│     │ phone                   │                     │
│     └─────────────────────────┘                     │
└─────────────────────────────────────────────────────┘

Nach Click auf "email":
┌─────────────────────────────────────────────────────┐
│  Beschreibung                                       │
│  ┌───────────────────────────────────────────────┐ │
│  │ Hallo {{name}}, bitte bestätigen Sie Ihre    │ │
│  │ {{email}} E-Mail-Adresse.█                   │ │
│  └───────────────────────────────────────────────┘ │
│  [📋 Platzhalter einfügen ▼]                        │
└─────────────────────────────────────────────────────┘
```

**Leerer Zustand:**

```
┌─────────────────────────────────────────────────────┐
│  [📋 Platzhalter einfügen ▼]                        │
│     ┌─────────────────────────────────────────┐     │
│     │ ℹ️ Keine Variablen verfügbar           │     │
│     │                                         │     │
│     │ Fügen Sie zuerst Tasks mit Feldern     │     │
│     │ vor diesem Task hinzu.                 │     │
│     └─────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
```

### 2.3 Feld-Konfiguration mit Standardwert

**Kontext:** Benutzer konfiguriert ein Formular-Feld.

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│  Feld-Konfiguration                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Feldname *                                         │
│  ┌───────────────────────────────────────────────┐ │
│  │ email                                         │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Label *                                            │
│  ┌───────────────────────────────────────────────┐ │
│  │ E-Mail                                        │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Typ *                                              │
│  ┌───────────────────────────────────────────────┐ │
│  │ E-Mail                                    ▼   │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Standardwert                                       │
│  ┌───────────────────────────────────────────────┐ │
│  │ {{email}}                                     │ │
│  └───────────────────────────────────────────────┘ │
│  [📋]  ← Kleiner Button für Platzhalter            │
│                                                     │
│  Platzhalter                                        │
│  ┌───────────────────────────────────────────────┐ │
│  │ Bitte geben Sie Ihre E-Mail ein               │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ☑ Pflichtfeld                                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 2.4 Validierung & Feedback

**Unbekannte Platzhalter:**

```
┌─────────────────────────────────────────────────────┐
│  Beschreibung                                       │
│  ┌───────────────────────────────────────────────┐ │
│  │ Hallo {{name}}, Ihre {{unknown}} ist ...     │ │
│  └───────────────────────────────────────────────┘ │
│  [📋 Platzhalter einfügen ▼]                        │
│                                                     │
│  ⚠️ Warnung: Unbekannte Platzhalter                │
│     • unknown                                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Styling:**
- Warnung in gelb/orange
- Icon: ⚠️
- Liste der unbekannten Variablen
- Nicht blockierend (Speichern trotzdem möglich)

## 3. Interaktions-Details

### 3.1 Platzhalter einfügen

**Ablauf:**
1. Benutzer klickt in Beschreibungsfeld (Cursor-Position merken)
2. Benutzer klickt "Platzhalter einfügen"
3. Dropdown öffnet sich
4. Benutzer klickt auf Variable (z.B. "name")
5. `{{name}}` wird an Cursor-Position eingefügt
6. Dropdown schließt sich
7. Cursor steht nach `{{name}}`
8. Focus bleibt im Textfeld

**Edge Cases:**
- Kein Text selektiert: Einfügen an Cursor
- Text selektiert: Ersetzen der Selektion
- Kein Cursor gesetzt: Einfügen am Ende

### 3.2 Tastatur-Navigation (Optional)

**Im Dropdown:**
- `↑` / `↓` - Navigation durch Variablen
- `Enter` - Variable auswählen
- `Esc` - Dropdown schließen

**Im Textfeld:**
- `Ctrl+Space` - Dropdown öffnen (Optional)

### 3.3 Verfügbare Variablen ermitteln

**Regel:** Nur Variablen aus Tasks **vor** dem aktuellen Task sind verfügbar.

**Beispiel:**

```
Workflow:
  Start
    ↓
  Task 1 (id: task1)
    - Feld: name
    - Feld: email
    ↓
  Task 2 (id: task2)  ← Aktuell bearbeitet
    - Verfügbar: name, email
    ↓
  Task 3 (id: task3)
    - Verfügbar: name, email, (Felder aus Task 2)
```

**Implementierung:**
- Workflow-Graph traversieren
- Alle Tasks vor aktuellem Task finden
- Felder sammeln
- Duplikate entfernen (Set)

## 4. Styling & Design

### 4.1 ChurchTools-Konformität

**Farben:**
- Primary: ChurchTools Blau
- Secondary: Grau
- Warning: Orange/Gelb
- Error: Rot

**Buttons:**
- Verwende `ct-btn`, `ct-btn-primary`, `ct-btn-secondary` Klassen
- Icon + Text für "Platzhalter einfügen"

**Form-Elemente:**
- Verwende `ct-form-control`, `ct-form-label` Klassen
- Konsistent mit bestehendem Editor

### 4.2 Platzhalter-Styling im Editor (Optional)

**Ziel:** Platzhalter visuell hervorheben

**Ansatz 1: Einfach (Empfohlen)**
- Keine spezielle Hervorhebung
- Benutzer sieht `{{name}}` als normalen Text

**Ansatz 2: Syntax-Highlighting**
- Platzhalter in blau/türkis
- Unbekannte Platzhalter in rot
- Erfordert ContentEditable oder Library

**Empfehlung:** Ansatz 1 für MVP, Ansatz 2 als Enhancement

### 4.3 Dropdown-Styling

```css
.placeholder-dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  min-width: 200px;
  max-height: 300px;
  overflow-y: auto;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  margin-top: 4px;
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: #f5f5f5;
}

.empty-state {
  padding: 16px;
  text-align: center;
  color: #999;
  font-size: 0.9em;
}
```

## 5. Accessibility

### 5.1 Tastatur-Bedienung

- Alle Funktionen per Tastatur erreichbar
- Tab-Reihenfolge logisch
- Focus-Styles sichtbar

### 5.2 Screen-Reader

**Beschreibungsfeld:**
```html
<label for="description">
  Beschreibung
  <span class="sr-only">
    Verwenden Sie {{variableName}} für Platzhalter
  </span>
</label>
<textarea id="description" aria-describedby="desc-help">
</textarea>
<div id="desc-help" class="sr-only">
  Klicken Sie auf "Platzhalter einfügen" um Variablen einzufügen
</div>
```

**Dropdown:**
```html
<button 
  aria-haspopup="listbox"
  aria-expanded="false"
  aria-controls="placeholder-menu"
>
  Platzhalter einfügen
</button>
<ul 
  id="placeholder-menu"
  role="listbox"
  aria-label="Verfügbare Variablen"
>
  <li role="option">name</li>
  <li role="option">email</li>
</ul>
```

## 6. Responsive Design

**Desktop (> 768px):**
- Dropdown öffnet sich unter Button
- Volle Breite für Textfelder

**Tablet (768px - 1024px):**
- Gleich wie Desktop
- Evtl. kleinere Schrift

**Mobile (< 768px):**
- Dropdown als Bottom-Sheet (Optional)
- Oder: Fullscreen-Modal mit Variablen-Liste

**Empfehlung:** Workflow-Editor ist primär Desktop-Tool, Mobile-Optimierung niedrige Priorität

## 7. Performance

### 7.1 Interpolation

**Problem:** Interpolation bei jedem Render?

**Lösung:** Computed Property
```typescript
const interpolatedDescription = computed(() => {
  return interpolate(description.value, context.value);
});
```

**Vorteil:** Vue cached das Ergebnis, nur neu berechnet wenn Inputs ändern

### 7.2 Dropdown-Rendering

**Problem:** Viele Variablen (100+)?

**Lösung:** Virtual Scrolling (Optional)
- Nur sichtbare Items rendern
- Library: `vue-virtual-scroller`

**Empfehlung:** Erst bei Bedarf, typische Workflows haben < 20 Variablen

## 8. Fehlerbehandlung

### 8.1 Interpolation schlägt fehl

**Szenario:** Variable existiert nicht

**Verhalten:**
- Executor: Zeige Original-Platzhalter `{{unknown}}`
- Kein Error, kein Crash
- Optional: Console-Warning

### 8.2 Zirkuläre Referenzen

**Szenario:** `{{name}}` enthält `{{name}}`

**Verhalten:**
- Nur eine Iteration
- Keine rekursive Interpolation
- Verhindert Endlos-Schleife

**Implementierung:**
```typescript
function interpolate(template: string, context: Record<string, any>): string {
  // Nur einmal ersetzen, nicht rekursiv
  return template.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
    const value = context[variableName];
    return value !== undefined ? String(value) : match;
  });
}
```

## 9. Zukünftige Erweiterungen

### 9.1 Live-Vorschau

**Idee:** Zeige interpolierte Werte im Editor

```
┌─────────────────────────────────────────────────────┐
│  Beschreibung                                       │
│  ┌───────────────────────────────────────────────┐ │
│  │ Hallo {{name}}, bitte bestätigen Sie Ihre    │ │
│  │ E-Mail-Adresse.                               │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Vorschau:                                          │
│  ┌───────────────────────────────────────────────┐ │
│  │ Hallo Max Mustermann, bitte bestätigen Sie   │ │
│  │ Ihre E-Mail-Adresse.                          │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Herausforderung:** Woher kommen Beispiel-Werte?
- Aus letzter Ausführung?
- Dummy-Daten?
- Benutzer-definiert?

### 9.2 Autocomplete

**Idee:** Beim Tippen von `{{` öffnet sich Dropdown automatisch

```
Benutzer tippt: "Hallo {{"
→ Dropdown öffnet sich automatisch
→ Benutzer wählt "name"
→ Ergebnis: "Hallo {{name}}"
```

### 9.3 Formatierung

**Idee:** Werte formatieren

```
{{date|format('DD.MM.YYYY')}}
{{price|currency('EUR')}}
{{name|uppercase}}
```

**Implementierung:** Pipe-Syntax wie in Angular/Vue

## 10. Checkliste für Implementierung

### Executor (Laufzeit)
- [ ] Beschreibung wird interpoliert
- [ ] Felder werden vorbesetzt
- [ ] Unbekannte Platzhalter bleiben sichtbar
- [ ] Keine Fehler bei fehlenden Variablen

### Editor (Design-Zeit)
- [ ] Button "Platzhalter einfügen" vorhanden
- [ ] Dropdown zeigt verfügbare Variablen
- [ ] Click fügt Platzhalter an Cursor-Position ein
- [ ] Dropdown schließt sich nach Auswahl
- [ ] Leerer Zustand wird angezeigt
- [ ] Warnung bei unbekannten Platzhaltern

### Styling
- [ ] ChurchTools-Klassen verwendet
- [ ] Dropdown-Styling konsistent
- [ ] Focus-States sichtbar
- [ ] Responsive (Desktop-first)

### Accessibility
- [ ] Tastatur-Navigation funktioniert
- [ ] ARIA-Attribute gesetzt
- [ ] Screen-Reader-Texte vorhanden

### Performance
- [ ] Computed Properties für Interpolation
- [ ] Keine unnötigen Re-Renders
- [ ] Dropdown performant bei vielen Variablen

### Testing
- [ ] Unit-Tests für Interpolation
- [ ] Integration-Tests für Executor
- [ ] Manuelle Tests im Editor
- [ ] Edge-Cases getestet
