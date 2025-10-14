# VueFlow Integration

## Übersicht

Diese Dokumentation beschreibt die Migration und Integration von VueFlow für die Workflow-Visualisierung. VueFlow ist eine professionelle Vue 3 Flow-Diagramm-Bibliothek, die die vorherige canvas-basierte Lösung ersetzt.

## Dokumentation

### 1. [VUEFLOW_MIGRATION.md](./VUEFLOW_MIGRATION.md)
**Migrations-Zusammenfassung**

Dokumentiert die erfolgreiche Migration:
- Installierte Dependencies
- Erstellte Custom Node Components (Start, Task, Action, Decision, End)
- VueFlowDiagram Komponente
- Datenstruktur-Mapping
- Styling und Layout

### 2. [VUEFLOW_MIGRATION_PLAN.md](./VUEFLOW_MIGRATION_PLAN.md)
**Migrations-Plan**

Detaillierter Plan für die Migration:
- Installations-Schritte
- Datenstruktur-Anpassungen
- Komponenten-Struktur
- Schritt-für-Schritt Implementierung
- Bundle Size Impact (~35KB gzipped)

### 3. [VUEFLOW_IMPROVEMENTS.md](./VUEFLOW_IMPROVEMENTS.md)
**Verbesserungen & Optimierungen**

Beschreibt Verbesserungen am VueFlow-Diagramm:
- Pfeilspitzen an Edges (Richtungsanzeige)
- Verbesserte Handle-Sichtbarkeit
- Visuelles Feedback
- Usability-Optimierungen

## Features

### Custom Node Types

**StartNode** (Grün, Kreis)
- Play-Icon ▶️
- Nur Output-Handle
- Gradient-Hintergrund

**TaskNode** (Blau, Rechteck)
- Dokument-Icon 📝
- Zeigt Anzahl der Formular-Felder
- Input & Output Handles

**ActionNode** (Orange, Rechteck)
- Blitz-Icon ⚡
- Zeigt Action-ID
- Input & Output Handles

**DecisionNode** (Gelb, Raute)
- Fragezeichen-Icon ❓
- Multiple Output-Handles für Bedingungen
- Input & Output Handles

**EndNode** (Rot, Kreis)
- Stop-Icon ⏹️
- Nur Input-Handle
- Gradient-Hintergrund

### VueFlow Features

- **Background:** Gepunktetes Raster
- **Controls:** Zoom, Fit View, Lock/Unlock
- **Minimap:** Übersichtskarte (optional)
- **Drag & Drop:** Nodes verschieben
- **Auto-Layout:** Dagre-basiertes Layout
- **Readonly Mode:** Für Workflow-Ausführung

## Technische Details

### Dependencies

```json
{
  "@vue-flow/core": "^1.47.0",
  "@vue-flow/background": "^1.3.2",
  "@vue-flow/controls": "^1.1.3",
  "@vue-flow/minimap": "^1.5.4",
  "@dagrejs/dagre": "^1.1.5"
}
```

### Bundle Size

- Uncompressed: ~100KB
- Gzipped: ~35KB
- Akzeptabler Overhead für professionelle Diagramm-Funktionalität

### Komponenten-Struktur

```
src/components/workflow/
├── VueFlowDiagram.vue          # Haupt-Komponente
└── nodes/
    ├── StartNode.vue
    ├── TaskNode.vue
    ├── ActionNode.vue
    ├── DecisionNode.vue
    └── EndNode.vue
```

## Verwendung

### Im Editor

```vue
<VueFlowDiagram
  :definition="workflow.definition"
  :readonly="false"
  @update:definition="updateWorkflow"
/>
```

### Im Executor (Readonly)

```vue
<VueFlowDiagram
  :definition="workflow.definition"
  :readonly="true"
  :current-node-id="execution.currentNodeId"
/>
```

## Vorteile gegenüber Custom Canvas

✅ **Professionelle Features:** Zoom, Pan, Minimap out-of-the-box
✅ **Bessere Performance:** Optimiertes Rendering
✅ **Wartbarkeit:** Weniger Custom-Code
✅ **Accessibility:** Keyboard-Navigation eingebaut
✅ **Responsive:** Funktioniert auf verschiedenen Bildschirmgrößen
✅ **Erweiterbar:** Plugin-System für Custom-Features

## Status

- [x] Migration abgeschlossen
- [x] Custom Node Components erstellt
- [x] Styling angepasst
- [x] Pfeilspitzen hinzugefügt
- [x] Handle-Sichtbarkeit verbessert
- [x] Auto-Layout implementiert
- [x] Readonly-Mode für Executor
- [ ] Minimap aktivieren (optional)
- [ ] Custom Edge-Types (optional)
- [ ] Animation bei Workflow-Ausführung (optional)

## Zukünftige Erweiterungen

### 1. Animierte Workflow-Ausführung
- Highlight des aktuellen Nodes
- Animierte Edges beim Übergang
- Fortschritts-Indikator

### 2. Custom Edge-Types
- Bedingte Edges (Decision → Task)
- Fehler-Edges (rot)
- Success-Edges (grün)

### 3. Node-Validierung
- Visuelles Feedback bei Konfigurations-Fehlern
- Warnung bei fehlenden Verbindungen
- Zyklus-Erkennung

### 4. Erweiterte Interaktionen
- Doppelklick zum Bearbeiten
- Kontextmenü (Rechtsklick)
- Multi-Select für Bulk-Operationen

## Troubleshooting

### Nodes werden nicht angezeigt
- Prüfen ob `nodeTypes` korrekt registriert sind
- Position-Werte müssen valide Zahlen sein

### Layout ist durcheinander
- `fitView()` nach Änderungen aufrufen
- Auto-Layout mit Dagre verwenden

### Handles nicht klickbar
- Z-Index in CSS prüfen
- Handle-Größe erhöhen (min. 10x10px)

## Referenzen

- [VueFlow Dokumentation](https://vueflow.dev/)
- [VueFlow Examples](https://vueflow.dev/examples/)
- [Dagre Layout](https://github.com/dagrejs/dagre)
