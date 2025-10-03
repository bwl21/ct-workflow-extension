# Decision Node Refactoring - Bedingungen am Node statt an Edges

## Übersicht

Die Bedingungen wurden von den Edges auf die Decision Nodes verschoben. Dies ist ein besseres Design, da:
- Bedingungen logisch zum Decision Node gehören
- Edges nur noch Verbindungen darstellen
- Mehrere Ausgänge pro Decision Node möglich sind
- Die Konfiguration übersichtlicher ist

## Datenmodell-Änderungen

### WorkflowEdge (vereinfacht)

**Vorher:**
```typescript
interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: {
    engine: RuleEngine;
    rule: any;
  };
  isDefault?: boolean;
}
```

**Nachher:**
```typescript
interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string; // ID des Decision Node Outputs
  label?: string;
}
```

### NodeData (erweitert)

**Neu hinzugefügt:**
```typescript
interface NodeData {
  // ... existing fields ...
  
  // Decision Node Outputs mit Bedingungen
  outputs?: DecisionOutput[];
}

interface DecisionOutput {
  id: string;
  label: string; // z.B. "Genehmigt", "Abgelehnt"
  condition?: {
    engine: RuleEngine;
    rule: any;
  };
  isDefault?: boolean; // Fallback wenn keine Bedingung zutrifft
}
```

## Komponenten-Änderungen

### 1. DecisionNode.vue

**Dynamische Handles:**
- Liest `data.outputs` vom Node
- Erstellt für jeden Output einen Handle
- Standard: 2 Outputs (TRUE/FALSE) wenn keine definiert

**Beispiel:**
```typescript
const outputs = computed(() => {
  if (props.data.outputs && props.data.outputs.length > 0) {
    return props.data.outputs;
  }
  // Standard: TRUE und FALSE
  return [
    { id: 'true', label: '✓ JA', isDefault: false },
    { id: 'false', label: '✗ NEIN', isDefault: true }
  ];
});
```

**Handle-Positionierung:**
- 2 Outputs: 30% und 70%
- 3+ Outputs: Gleichmäßig verteilt

### 2. VueFlowDiagram.vue

**Vereinfachte Edge-Konvertierung:**
```typescript
function convertEdges(): Edge[] {
  return props.definition.edges.map((edge: WorkflowEdge) => {
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle, // Wichtig!
      label: edge.label || '',
      // ... styling ...
    };
  });
}
```

### 3. EdgeEditor.vue

**Vereinfacht:**
- Keine Bedingungen mehr
- Nur noch Label-Bearbeitung
- Zeigt sourceHandle an (read-only)
- Info-Text: "Bedingungen werden am Decision-Node konfiguriert"

### 4. Execution Store

**Neue Logik:**
```typescript
if (currentNode.type === NodeType.DECISION) {
  const outputs = currentNode.data.outputs || [
    { id: 'true', label: 'JA', isDefault: false },
    { id: 'false', label: 'NEIN', isDefault: true }
  ];

  // Finde Output dessen Bedingung erfüllt ist
  let selectedOutput = null;
  for (const output of outputs) {
    if (output.condition) {
      const conditionMet = evaluateRules(
        output.condition.engine,
        output.condition.rule,
        execution.context.variables
      );
      
      if (conditionMet) {
        selectedOutput = output;
        break;
      }
    }
  }

  // Fallback: Default Output
  if (!selectedOutput) {
    selectedOutput = outputs.find(o => o.isDefault);
  }

  // Finde Edge mit diesem Output
  if (selectedOutput) {
    selectedEdge = outgoingEdges.find(e => e.sourceHandle === selectedOutput.id);
  }
}
```

## Workflow-Erstellung

### Edges erstellen

**Automatisch:**
```typescript
function handleEdgeAdd(connection: { 
  source: string; 
  target: string; 
  sourceHandle?: string 
}) {
  const newEdge: WorkflowEdge = {
    id: generateId(),
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle, // Wird von VueFlow gesetzt
  };
  
  workflowStore.addEdge(currentWorkflow.value.id, newEdge);
}
```

### Decision Node konfigurieren

**Zukünftig (noch zu implementieren):**
1. Decision Node bearbeiten
2. Tab "Ausgänge"
3. Ausgänge hinzufügen/bearbeiten:
   - ID (z.B. "approved", "rejected")
   - Label (z.B. "Genehmigt", "Abgelehnt")
   - Bedingung (optional)
   - Als Default markieren (optional)

## Vorteile

### 1. Klarere Struktur
- Bedingungen gehören zum Decision Node
- Edges sind nur Verbindungen
- Einfacher zu verstehen

### 2. Flexibilität
- Beliebig viele Ausgänge pro Decision Node
- Nicht nur TRUE/FALSE
- Z.B. "Erwachsen", "Jugendlich", "Kind"

### 3. Wiederverwendbarkeit
- Decision Node kann kopiert werden mit allen Bedingungen
- Edges müssen nicht einzeln konfiguriert werden

### 4. Bessere Visualisierung
- Alle Ausgänge sichtbar am Node
- Labels direkt am Handle
- Übersichtlicher

## Migration bestehender Workflows

**Automatische Migration (noch zu implementieren):**
```typescript
function migrateWorkflow(workflow: Workflow) {
  workflow.definition.nodes.forEach(node => {
    if (node.type === NodeType.DECISION) {
      // Sammle alle ausgehenden Edges
      const outgoingEdges = workflow.definition.edges.filter(
        e => e.source === node.id
      );
      
      // Erstelle Outputs aus Edge-Bedingungen
      node.data.outputs = outgoingEdges.map(edge => ({
        id: edge.id,
        label: edge.label || (edge.isDefault ? 'NEIN' : 'JA'),
        condition: edge.condition,
        isDefault: edge.isDefault
      }));
      
      // Update Edges: sourceHandle = output.id
      outgoingEdges.forEach(edge => {
        const output = node.data.outputs.find(o => o.id === edge.id);
        if (output) {
          edge.sourceHandle = output.id;
        }
        // Entferne alte Properties
        delete edge.condition;
        delete edge.isDefault;
      });
    }
  });
}
```

## Nächste Schritte

### 1. Decision Node Editor
- UI zum Bearbeiten der Outputs
- Bedingungen pro Output konfigurieren
- Drag & Drop zum Sortieren

### 2. Visuelle Verbesserungen
- Farbcodierung der Handles
- Icons für Output-Typen
- Tooltips mit Bedingungen

### 3. Validierung
- Mindestens ein Default Output
- Keine doppelten Output-IDs
- Alle Outputs haben Edges

### 4. Templates
- Vordefinierte Decision Nodes
- Z.B. "Ja/Nein", "Genehmigt/Abgelehnt/Zurückgestellt"
- Schnellere Workflow-Erstellung

## Beispiel-Workflow

```typescript
// Decision Node
{
  id: 'decision-1',
  type: NodeType.DECISION,
  label: 'Altersgruppe prüfen',
  data: {
    outputs: [
      {
        id: 'adult',
        label: '👨 Erwachsen',
        condition: {
          engine: 'simple',
          rule: {
            conditions: [
              { field: 'age', operator: 'greaterThanOrEqual', value: 18 }
            ],
            logic: 'AND'
          }
        }
      },
      {
        id: 'teen',
        label: '👦 Jugendlich',
        condition: {
          engine: 'simple',
          rule: {
            conditions: [
              { field: 'age', operator: 'greaterThanOrEqual', value: 13 },
              { field: 'age', operator: 'lessThan', value: 18 }
            ],
            logic: 'AND'
          }
        }
      },
      {
        id: 'child',
        label: '👶 Kind',
        isDefault: true
      }
    ]
  }
}

// Edges
[
  { id: 'e1', source: 'decision-1', target: 'action-adult', sourceHandle: 'adult' },
  { id: 'e2', source: 'decision-1', target: 'action-teen', sourceHandle: 'teen' },
  { id: 'e3', source: 'decision-1', target: 'action-child', sourceHandle: 'child' }
]
```

## Zusammenfassung

✅ **Vorteile:**
- Klarere Datenstruktur
- Flexiblere Decision Nodes
- Einfachere Konfiguration
- Bessere Visualisierung

⚠️ **Noch zu tun:**
- Decision Node Editor für Outputs
- Migration bestehender Workflows
- Validierung
- Templates

🎯 **Ergebnis:**
Edges haben keine Bedingungen mehr - diese sind jetzt am Decision Node wo sie hingehören!
