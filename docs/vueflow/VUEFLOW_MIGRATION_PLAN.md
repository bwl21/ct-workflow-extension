# VueFlow Migration Plan

## Übersicht
Dieser Plan zeigt, wie die Migration von der aktuellen SVG-basierten Lösung zu VueFlow aussehen würde.

## 1. Installation

```bash
npm install @vue-flow/core @vue-flow/background @vue-flow/controls @vue-flow/minimap
```

Bundle Size Impact: ~100KB (gzipped: ~35KB)

## 2. Datenstruktur-Anpassung

### Aktuell:
```typescript
interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  position: { x: number; y: number };
  data: NodeData;
}
```

### Mit VueFlow:
```typescript
// Bleibt fast gleich, nur kleine Anpassungen
interface VueFlowNode {
  id: string;
  type: string; // 'start', 'task', 'action', 'decision', 'end'
  label: string;
  position: { x: number; y: number };
  data: {
    ...NodeData,
    // VueFlow-spezifisch
    handles?: Array<{ id: string; type: 'source' | 'target'; position: 'top' | 'bottom' | 'left' | 'right' }>
  };
}
```

## 3. Komponenten-Struktur

```
src/components/workflow/
├── WorkflowEditor.vue (bleibt, aber nutzt VueFlow)
├── WorkflowDiagram.vue (wird ersetzt durch VueFlowDiagram.vue)
├── nodes/
│   ├── StartNode.vue (Custom Node für Start)
│   ├── TaskNode.vue (Custom Node für Tasks)
│   ├── ActionNode.vue (Custom Node für Actions)
│   ├── DecisionNode.vue (Custom Node für Decisions)
│   └── EndNode.vue (Custom Node für End)
└── edges/
    └── CustomEdge.vue (Optional: Custom Edge mit Labels)
```

## 4. Beispiel: VueFlowDiagram.vue

```vue
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { VueFlow, useVueFlow, Panel, Background, Controls, MiniMap } from '@vue-flow/core';
import { Background as BackgroundVariant } from '@vue-flow/background';
import type { Workflow } from '@/types/workflow.types';

// Custom Node Components
import StartNode from './nodes/StartNode.vue';
import TaskNode from './nodes/TaskNode.vue';
import ActionNode from './nodes/ActionNode.vue';
import DecisionNode from './nodes/DecisionNode.vue';
import EndNode from './nodes/EndNode.vue';

const props = defineProps<{
  workflow: Workflow;
  editable?: boolean;
}>();

const emit = defineEmits<{
  nodeClick: [nodeId: string];
  edgeClick: [edgeId: string];
  nodePositionChange: [nodeId: string, position: { x: number; y: number }];
}>();

// VueFlow Setup
const { onNodeDragStop, onConnect, onEdgeClick, onNodeClick } = useVueFlow();

// Convert workflow data to VueFlow format
const nodes = computed(() => {
  return props.workflow.definition.nodes.map(node => ({
    id: node.id,
    type: node.type.toLowerCase(), // 'start', 'task', etc.
    label: node.label,
    position: node.position,
    data: node.data,
  }));
});

const edges = computed(() => {
  return props.workflow.definition.edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated: true, // Optional: animierte Edges
  }));
});

// Event Handlers
onNodeClick((event) => {
  emit('nodeClick', event.node.id);
});

onNodeDragStop((event) => {
  emit('nodePositionChange', event.node.id, event.node.position);
});

onConnect((connection) => {
  // Neue Edge erstellen
  console.log('New connection:', connection);
});
</script>

<template>
  <div class="vue-flow-container">
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :node-types="{
        start: StartNode,
        task: TaskNode,
        action: ActionNode,
        decision: DecisionNode,
        end: EndNode,
      }"
      :fit-view-on-init="true"
      :nodes-draggable="editable"
      :nodes-connectable="editable"
      :edges-updatable="editable"
    >
      <!-- Background Pattern -->
      <Background :variant="BackgroundVariant.Dots" />
      
      <!-- Controls (Zoom, Fit View, etc.) -->
      <Controls />
      
      <!-- Minimap -->
      <MiniMap />
      
      <!-- Custom Panel (z.B. für Legende) -->
      <Panel position="top-right">
        <div class="legend">
          <div class="legend-item">
            <span class="legend-icon start">▶</span>
            <span>Start</span>
          </div>
          <div class="legend-item">
            <span class="legend-icon task">📝</span>
            <span>Aufgabe</span>
          </div>
          <div class="legend-item">
            <span class="legend-icon action">⚡</span>
            <span>Aktion</span>
          </div>
          <div class="legend-item">
            <span class="legend-icon decision">◆</span>
            <span>Entscheidung</span>
          </div>
          <div class="legend-item">
            <span class="legend-icon end">⬛</span>
            <span>Ende</span>
          </div>
        </div>
      </Panel>
    </VueFlow>
  </div>
</template>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';
@import '@vue-flow/minimap/dist/style.css';

.vue-flow-container {
  width: 100%;
  height: 100%;
  background: #f8f9fa;
}

.legend {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.legend-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 0.875rem;
}

.legend-icon.start { background: #4caf50; color: white; }
.legend-icon.task { background: #2196f3; color: white; }
.legend-icon.action { background: #ff9800; color: white; }
.legend-icon.decision { background: #9c27b0; color: white; }
.legend-icon.end { background: #f44336; color: white; }
</style>
```

## 5. Beispiel: Custom Task Node

```vue
<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';
import type { NodeData } from '@/types/workflow.types';

const props = defineProps<{
  id: string;
  data: NodeData;
  label: string;
}>();
</script>

<template>
  <div class="task-node">
    <!-- Input Handle (oben) -->
    <Handle type="target" :position="Position.Top" />
    
    <div class="node-content">
      <div class="node-icon">📝</div>
      <div class="node-label">{{ label }}</div>
      <div v-if="data.fields" class="node-info">
        {{ data.fields.length }} Felder
      </div>
    </div>
    
    <!-- Output Handle (unten) -->
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.task-node {
  background: white;
  border: 2px solid #2196f3;
  border-radius: 8px;
  padding: 1rem;
  min-width: 150px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.task-node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.node-content {
  text-align: center;
}

.node-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.node-label {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.node-info {
  font-size: 0.75rem;
  color: #666;
}
</style>
```

## 6. Migration Steps

### Phase 1: Vorbereitung (1-2 Stunden)
1. ✅ VueFlow Dependencies installieren
2. ✅ Neue Komponenten-Struktur erstellen
3. ✅ Custom Nodes für jeden NodeType erstellen

### Phase 2: Integration (2-3 Stunden)
1. ✅ VueFlowDiagram.vue erstellen
2. ✅ WorkflowEditor.vue anpassen
3. ✅ Event-Handling implementieren
4. ✅ Position-Updates im Store

### Phase 3: Features (2-3 Stunden)
1. ✅ Drag & Drop für neue Nodes
2. ✅ Edge-Erstellung durch Ziehen
3. ✅ Zoom & Pan
4. ✅ Minimap
5. ✅ Auto-Layout (optional)

### Phase 4: Testing & Polish (1-2 Stunden)
1. ✅ Alle Workflows testen
2. ✅ Styling anpassen
3. ✅ Performance optimieren

**Gesamt: 6-10 Stunden**

## 7. Vorher/Nachher Vergleich

### Aktuell (SVG):
```vue
<!-- Statische Darstellung -->
<svg :viewBox="viewBox">
  <g v-for="edge in workflow.edges">
    <line :x1="..." :y1="..." :x2="..." :y2="..." />
  </g>
  <g v-for="node in workflow.nodes">
    <circle r="30" />
    <text>{{ node.label }}</text>
  </g>
</svg>
```

**Limitierungen:**
- ❌ Keine Interaktivität
- ❌ Manuelle Position-Berechnung
- ❌ Kein Drag & Drop
- ❌ Kein Zoom/Pan
- ❌ Schwer erweiterbar

### Mit VueFlow:
```vue
<!-- Interaktive Darstellung -->
<VueFlow :nodes="nodes" :edges="edges">
  <Background />
  <Controls />
  <MiniMap />
</VueFlow>
```

**Vorteile:**
- ✅ Volle Interaktivität
- ✅ Automatisches Layout
- ✅ Drag & Drop out-of-the-box
- ✅ Zoom/Pan/Fit View
- ✅ Professionelles Look & Feel
- ✅ Einfach erweiterbar

## 8. Breaking Changes

### Store-Anpassungen:
```typescript
// Neue Methode für Position-Updates
function updateNodePosition(workflowId: string, nodeId: string, position: { x: number; y: number }) {
  const workflow = getWorkflowById(workflowId);
  if (workflow) {
    const node = workflow.definition.nodes.find(n => n.id === nodeId);
    if (node) {
      node.position = position;
      saveToLocalStorage();
    }
  }
}
```

### Keine Breaking Changes für:
- ✅ Workflow-Datenstruktur (bleibt gleich)
- ✅ Execution-Logik
- ✅ API/Storage Layer
- ✅ Bestehende Workflows (kompatibel)

## 9. Alternative: Schrittweise Migration

Falls du nicht alles auf einmal migrieren willst:

### Option A: Parallel betreiben
```vue
<template>
  <div class="workflow-diagram">
    <!-- Toggle zwischen beiden Ansichten -->
    <button @click="useVueFlow = !useVueFlow">
      {{ useVueFlow ? 'SVG-Ansicht' : 'VueFlow-Ansicht' }}
    </button>
    
    <VueFlowDiagram v-if="useVueFlow" :workflow="workflow" />
    <WorkflowDiagram v-else :workflow="workflow" />
  </div>
</template>
```

### Option B: Feature-Flag
```typescript
// .env
VITE_USE_VUEFLOW=true

// In Komponente
const useVueFlow = import.meta.env.VITE_USE_VUEFLOW === 'true';
```

## 10. Kosten-Nutzen-Analyse

### Kosten:
- 6-10 Stunden Entwicklungszeit
- ~100KB Bundle Size
- Lernkurve für Team
- Potenzielle Bugs während Migration

### Nutzen:
- Professionellere UX
- Schnellere Feature-Entwicklung
- Bessere Wartbarkeit
- Mehr Flexibilität für komplexe Workflows
- Community-Support & Updates

## 11. Empfehlung

**Wann migrieren:**
1. ✅ Nach Fertigstellung der Grundfunktionen
2. ✅ Wenn erste Benutzer-Feedback kommt
3. ✅ Vor dem Production-Release
4. ✅ In einem separaten Feature-Branch

**Wann NICHT migrieren:**
1. ❌ Mitten in der Entwicklung
2. ❌ Wenn Deadline drängt
3. ❌ Wenn aktuelle Lösung ausreicht
4. ❌ Wenn Bundle Size kritisch ist

## 12. Nächste Schritte (wenn du migrierst)

1. Branch erstellen: `git checkout -b feature/vueflow-integration`
2. Dependencies installieren
3. Erste Custom Node erstellen (z.B. StartNode)
4. VueFlowDiagram.vue erstellen
5. In WorkflowEditor integrieren
6. Testen mit bestehendem Workflow
7. Iterativ alle Node-Types migrieren
8. PR erstellen & reviewen

---

**Fazit:** VueFlow ist eine solide Wahl für professionelle Workflow-Editoren. Die Migration ist überschaubar und bringt signifikante UX-Verbesserungen. Ich würde empfehlen, es nach der aktuellen Entwicklungsphase in Betracht zu ziehen.
