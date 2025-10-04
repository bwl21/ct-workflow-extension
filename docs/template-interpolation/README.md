# Template-Interpolation in Workflows

## Übersicht

Dieses Feature ermöglicht es, in Task-Beschreibungen und Feld-Defaultwerten auf Variablen aus vorherigen Workflow-Schritten zuzugreifen.

## Dokumentation

### 1. [TEMPLATE_INTERPOLATION.md](./TEMPLATE_INTERPOLATION.md)
**Feature-Spezifikation**

Vollständige Beschreibung des Features:
- Anforderungen und Use Cases
- Technische Spezifikation
- Datenfluss und Beispiele
- Zukünftige Erweiterungen

### 2. [SIMPLE_IMPLEMENTATION.md](./SIMPLE_IMPLEMENTATION.md)
**Vereinfachte Implementierung** ⭐ Start hier!

Die einfachste Lösung mit Vue's eingebauter Reaktivität:
- Minimale Code-Änderungen (~30 Zeilen)
- Keine externe Libraries
- Aufwand: ~6 Stunden statt 20+

### 3. [IMPLEMENTATION_TEMPLATE_INTERPOLATION.md](./IMPLEMENTATION_TEMPLATE_INTERPOLATION.md)
**Detaillierter Implementierungsplan**

Phasen-basierter Plan mit:
- Aufgaben-Checklisten
- Abhängigkeiten
- Zeitschätzungen
- Risiken und offene Fragen

### 4. [UI_UX_TEMPLATE_INTERPOLATION.md](./UI_UX_TEMPLATE_INTERPOLATION.md)
**UI/UX Spezifikation**

Design und Benutzerführung:
- Wireframes und Layouts
- Interaktions-Details
- Accessibility
- Styling-Richtlinien

## Quick Start

### Beispiel

**Workflow:**
```
Task 1: Persönliche Daten
  - Feld: name (Eingabe: "Max Mustermann")
  - Feld: email (Eingabe: "max@example.com")

Task 2: Bestätigung
  - Beschreibung: "Hallo {{name}}, bitte bestätigen Sie Ihre E-Mail."
  - Feld: email (vorbesetzt mit "max@example.com")
```

**Ergebnis:**
```
Task 2 zeigt:
  "Hallo Max Mustermann, bitte bestätigen Sie Ihre E-Mail."
  
  E-Mail: [max@example.com] ← editierbar
```

### Syntax

- **Platzhalter:** `{{variableName}}`
- **Verfügbar:** Alle Felder aus vorherigen Tasks
- **Vorbesetzung:** Felder mit gleichem Namen werden automatisch vorbesetzt

## Implementierungs-Status

- [ ] Phase 1: Basis-Interpolation (Core)
- [ ] Phase 2: Editor-Unterstützung
- [ ] Phase 3: Validierung & Feedback
- [ ] Phase 4: Testing & Dokumentation

## Nächste Schritte

1. Lesen Sie [SIMPLE_IMPLEMENTATION.md](./SIMPLE_IMPLEMENTATION.md)
2. Implementieren Sie die 3 Änderungen in WorkflowExecutor.vue
3. Testen Sie mit einem Demo-Workflow
4. Fügen Sie Editor-Unterstützung hinzu (PlaceholderDropdown)

## Technische Details

**Kern-Technologie:** Vue's Computed Properties + String-Ersetzung

**Sicherheit:** Automatisches HTML-Escaping durch Vue

**Performance:** Computed-Caching, nur Re-Rendering bei Änderungen

**Aufwand:** ~6 Stunden für MVP
