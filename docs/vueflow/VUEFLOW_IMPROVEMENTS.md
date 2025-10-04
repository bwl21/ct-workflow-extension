# VueFlow Verbesserungen

## Übersicht

Dieses Dokument beschreibt die Verbesserungen am VueFlow-Diagramm für bessere Usability und visuelles Feedback.

## 1. Pfeilspitzen an Edges

### Problem
Edges hatten keine Richtungsanzeige, was bei gerichteten Workflows verwirrend war.

### Lösung
```typescript
return {
  id: edge.id,
  source: edge.source,
  target: edge.target,
  markerEnd: 'arrow', // ✅ Pfeilspitze am Ende
  // ...
};
```

### Ergebnis
- Klare Richtungsanzeige
- Besseres Verständnis des Workflow-Flusses
- Standard-Pfeilspitzen von VueFlow

## 2. Verbesserte Handle-Sichtbarkeit

### Problem
- Handles waren schwer zu greifen
- Bei mehreren Edges von einem Punkt war Umhängen schwierig
- Keine visuelle Rückmeldung beim Hovern

### Lösung

**Größere Handles:**
```css
.vue-flow__handle {
  width: 14px;
  height: 14px;
  border: 3px solid white;
}
```

**Hover-Effekt:**
```css
.vue-flow__handle:hover {
  width: 18px;
  height: 18px;
  background: #4caf50;
  box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.2);
}
```

**Node-Hover zeigt Handles:**
```css
.vue-flow__node:hover .vue-flow__handle {
  opacity: 1;
  background: #4caf50;
}
```

### Ergebnis
- ✅ Handles sind größer und leichter zu greifen
- ✅ Grüner Hover-Effekt zeigt Interaktivität
- ✅ Handles werden beim Node-Hover hervorgehoben
- ✅ Besseres visuelles Feedback beim Verbinden

## 3. Verbessertes Auto-Layout

### Problem
Dagre ordnete alle Nodes untereinander an, ohne horizontale Verteilung.

### Lösung

**Optimierte Parameter:**
```typescript
{
  direction: 'TB',
  nodeWidth: 180,
  nodeHeight: 100,
  rankSep: 150,      // ⬆️ Erhöht von 120
  nodeSep: 150,      // ⬆️ Erhöht von 100
  align: 'UL',       // ✅ Upper Left alignment
  ranker: 'network-simplex', // ✅ Besserer Algorithmus
}
```

**Graph-Optionen:**
```typescript
graph.setGraph({
  rankdir: opts.direction,
  ranksep: opts.rankSep,
  nodesep: opts.nodeSep,
  align: opts.align,
  ranker: opts.ranker,
  marginx: 50,  // ✅ Rand horizontal
  marginy: 50,  // ✅ Rand vertikal
});
```

### Dagre Ranker-Algorithmen

**network-simplex** (Standard, jetzt verwendet):
- Optimiert für minimale Edge-Längen
- Bessere horizontale Verteilung
- Gut für komplexe Graphen mit Verzweigungen

**tight-tree**:
- Kompakteres Layout
- Weniger Platz zwischen Nodes
- Gut für einfache lineare Workflows

**longest-path**:
- Maximiert Pfadlängen
- Kann zu sehr vertikalen Layouts führen

### Ergebnis
- ✅ Bessere horizontale Verteilung bei Verzweigungen
- ✅ Mehr Platz zwischen Nodes (150px statt 100px)
- ✅ Ränder um das Diagramm (50px)
- ✅ Optimierter Algorithmus für komplexe Workflows

## 4. Snap-to-Grid

### Aktiviert
```typescript
:snap-to-grid="true"
:snap-grid="[15, 15]"
```

### Ergebnis
- Nodes rasten am 15px-Raster ein
- Saubere Ausrichtung
- Professionelleres Layout

## Verwendung

### Edge-Umhängen
1. **Hover über Node** → Handles werden grün
2. **Hover über Handle** → Handle wird größer
3. **Klicken und Ziehen** → Edge umhängen
4. **Loslassen auf Ziel-Handle** → Edge wird neu verbunden

### Auto-Layout
1. **Klick auf "🔄 Auto-Layout"** Button
2. Workflow wird automatisch angeordnet:
   - Hierarchisch von oben nach unten
   - Verzweigungen horizontal verteilt
   - Optimale Abstände
   - Keine Überlappungen

### Beispiel-Workflows

**Linearer Workflow:**
```
Start
  ↓
Task 1
  ↓
Task 2
  ↓
End
```
→ Vertikal angeordnet mit 150px Abstand

**Verzweigter Workflow:**
```
Start
  ↓
Decision
  ├─→ Action A
  └─→ Action B
       ↓
      End
```
→ Horizontal verteilt mit 150px Abstand

**Komplexer Workflow:**
```
Start
  ↓
Task 1
  ↓
Decision 1
  ├─→ Task 2A ─→ Decision 2
  │              ├─→ Action A
  │              └─→ Action B
  └─→ Task 2B ─────────→ End
```
→ Optimale Verteilung mit network-simplex Algorithmus

## Technische Details

### Edge-Marker
VueFlow verwendet SVG-Marker für Pfeilspitzen:
- `markerEnd: 'arrow'` - Standard-Pfeil
- Automatische Farbanpassung an Edge-Farbe
- Skaliert mit Edge-Breite

### Handle-Typen
- `type="source"` - Ausgangs-Handle (unten)
- `type="target"` - Eingangs-Handle (oben)
- Mehrere Handles pro Node möglich (Decision Nodes)

### Dagre-Graph-Struktur
```typescript
const graph = new dagre.graphlib.Graph();
graph.setNode(nodeId, { width, height });
graph.setEdge(sourceId, targetId);
dagre.layout(graph);
const position = graph.node(nodeId);
```

## Weitere Verbesserungsmöglichkeiten

### 1. Layout-Optionen im UI
- Dropdown für direction (TB, LR, BT, RL)
- Slider für rankSep und nodeSep
- Auswahl des Ranker-Algorithmus

### 2. Custom Edge-Typen
- Gestrichelte Edges für optionale Pfade
- Farbcodierung nach Bedingungstyp
- Dickere Edges für häufig genutzte Pfade

### 3. Minimap-Verbesserungen
- Farbcodierung der Nodes nach Typ
- Highlight des aktuellen Viewport
- Klick zum Navigieren

### 4. Keyboard-Shortcuts
- Strg+L: Auto-Layout
- Entf: Ausgewählte Edge löschen
- Strg+Z: Undo
- Strg+Y: Redo

## Zusammenfassung

✅ **Pfeilspitzen** - Klare Richtungsanzeige
✅ **Bessere Handles** - Größer, grün beim Hover, leichter zu greifen
✅ **Optimiertes Auto-Layout** - Horizontale Verteilung, mehr Abstand
✅ **Snap-to-Grid** - Saubere Ausrichtung

Die Verbesserungen machen das Arbeiten mit VueFlow deutlich intuitiver und professioneller!
