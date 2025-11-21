# Multi-Edge Execution & JOIN Node

## Problem

Bisher wurde bei Nodes mit mehreren ausgehenden Edges nur die **erste Edge** ausgeführt:

```typescript
// Alt: Nur erste Edge
selectedEdge = outgoingEdges[0];
```

**Beispiel-Szenario:**
```
Personendatensatz für Kind anlegen
         ↓ (Edge 1) ← wurde ausgeführt
    Beziehung zu Eltern 1 anlegen
         
         ↓ (Edge 2) ← wurde IGNORIERT!
    Beziehung zu Eltern 2 eintragen
```

## Lösung

### Sequentielle Abarbeitung mit Queue-System

Die neue Implementierung verwendet ein **Queue-System** für die sequentielle Abarbeitung mehrerer Edges:

1. **Alle Edges werden erfasst:**
   ```typescript
   // Für non-decision nodes: ALLE Edges verwenden
   selectedEdges = outgoingEdges;
   ```

2. **Nodes werden in Queue eingereiht:**
   ```typescript
   execution.context.nodeQueue = [];
   for (const edge of selectedEdges) {
     execution.context.nodeQueue.push(edge.target);
   }
   ```

3. **Sequentielle Abarbeitung:**
   ```typescript
   function processNextFromQueue(executionId: string) {
     const nextNodeId = execution.context.nodeQueue.shift();
     execution.currentNodeId = nextNodeId;
   }
   ```

### Verhalten nach Node-Typen

#### ACTION/TASK Nodes (Non-Decision)
- **Alle** ausgehenden Edges werden sequentiell abgearbeitet
- Reihenfolge: In der Reihenfolge wie die Edges erstellt wurden
- Jeder Node wird vollständig ausgeführt, bevor der nächste startet

#### DECISION Nodes
- **Nur eine** Edge wird ausgeführt (basierend auf Bedingung)
- Verhalten unverändert

#### START/END Nodes
- START: Wie bisher, eine Edge
- END: Beendet Workflow oder springt zum nächsten Node in Queue

## Implementierungsdetails

### Geänderte Dateien

#### `src/types/workflow.types.ts`
```typescript
export interface ExecutionContext {
  variables: Record<string, any>;
  userId: string;
  timestamp: Date;
  nodeQueue?: string[]; // ← NEU: Queue für Multi-Edge
}
```

#### `src/stores/execution.ts`

**Neue Funktion:** `processNextFromQueue()`
- Verarbeitet nächsten Node aus der Queue
- Wird nach jedem `completeStep()` aufgerufen
- Beendet Workflow wenn Queue leer ist

**Geänderte Funktion:** `moveToNextNode()`
- Sammelt alle ausgehenden Edges (außer bei DECISION)
- Füllt die Queue mit Target-Nodes
- Startet Verarbeitung mit `processNextFromQueue()`

**Geänderte Funktion:** `completeStep()`
- Prüft ob Queue existiert und Nodes enthält
- Ruft `processNextFromQueue()` auf wenn Queue nicht leer
- Sonst: `moveToNextNode()` wie bisher

## Beispiel-Ablauf

### Workflow:
```
[Start]
   ↓
[Daten erfassen]
   ↓
[Kind anlegen] ← Node mit 2 ausgehenden Edges
   ↓         ↓
[Eltern 1] [Eltern 2]
   ↓         ↓
[Ende]    [Ende]
```

### Execution-Ablauf:

1. **Start → Daten erfassen**
   - Queue: `[]`
   - Current: `daten-erfassen`

2. **Daten erfassen → Kind anlegen**
   - Queue: `[]`
   - Current: `kind-anlegen`

3. **Kind anlegen (completeStep)**
   - `moveToNextNode()` findet 2 Edges
   - Queue: `['eltern-1', 'eltern-2']`
   - `processNextFromQueue()` → Current: `eltern-1`

4. **Eltern 1 (completeStep)**
   - Queue: `['eltern-2']`
   - `processNextFromQueue()` → Current: `eltern-2`

5. **Eltern 2 (completeStep)**
   - Queue: `[]`
   - `processNextFromQueue()` → Workflow COMPLETED

## Vorteile

✅ **Alle Edges werden ausgeführt** - Keine Edges werden mehr ignoriert
✅ **Vorhersagbare Reihenfolge** - Sequentielle Abarbeitung
✅ **Einfaches Debugging** - Klare Execution-History
✅ **Keine Race Conditions** - Single-Threaded JavaScript
✅ **Abwärtskompatibel** - Workflows mit einer Edge funktionieren wie bisher

## Einschränkungen

⚠️ **Keine echte Parallelität** - JavaScript ist Single-Threaded
⚠️ **Keine Join-Logik** - Branches laufen nicht zusammen
⚠️ **Reihenfolge wichtig** - Bei Abhängigkeiten zwischen Branches

## Zukünftige Erweiterungen

### Option 1: Promise.all() für API-Calls
```typescript
// Pseudo-parallele Ausführung für schnellere API-Calls
await Promise.all(
  selectedEdges.map(edge => executeNode(edge.target))
);
```

### Option 2: Fork/Join Pattern
```typescript
// Neuer NodeType: JOIN
// Wartet bis alle Branches fertig sind
if (nextNode.type === NodeType.JOIN) {
  // Warte auf alle eingehenden Edges
}
```

### Option 3: Conditional Multi-Edge
```typescript
// Bedingungen auch für Non-Decision Nodes
edge.condition = { field: 'hasParent2', operator: 'equals', value: true };
```

## Testing

### Manueller Test
1. Öffne [https://5173--019aa20b-92be-7336-ac86-0888c82a5c6c.eu-central-1-01.gitpod.dev](https://5173--019aa20b-92be-7336-ac86-0888c82a5c6c.eu-central-1-01.gitpod.dev)
2. Erstelle Workflow mit Multi-Edge Node
3. Führe Workflow aus
4. Prüfe Execution History - beide Branches sollten erscheinen

### Erwartetes Ergebnis
```
History:
1. Daten des Kindes erfassen ✅
2. Personendatensatz für Kind anlegen ✅
3. Beziehung zu Eltern 1 anlegen ✅  ← Jetzt auch!
4. Beziehung zu Eltern 2 eintragen ✅ ← Jetzt auch!
```

## Pfade zusammenführen

### Problem: Branches zusammenführen

Nach Multi-Edge Execution müssen die Pfade wieder zusammengeführt werden:

```
[Kind anlegen]
   ↓         ↓
[Eltern 1] [Eltern 2]
   ↓         ↓
[Email senden] ← Wie warten auf beide?
```

### Lösung: Impliziter Join + Expliziter JOIN Node

**Zwei Möglichkeiten:**

#### 1. Impliziter Join (Automatisch, AND-Modus)

Jeder Node mit **mehreren eingehenden Edges** wartet automatisch auf alle Branches:

```
[Kind anlegen]
   ↓         ↓
[Eltern 1] [Eltern 2]
   ↓         ↓
[Email senden] ← Automatischer Join! Kein extra Node nötig
```

**Verhalten:**
- Wartet auf ALLE eingehenden Branches (AND-Modus)
- Keine Konfiguration nötig
- Einfach mehrere Edges zum gleichen Node verbinden

**Use Case:** Standard-Szenario - alle Branches müssen fertig sein

#### 2. Expliziter JOIN Node (Für OR-Modus oder explizite Kontrolle)

Ein neuer Node-Type `JOIN` für spezielle Anforderungen:

#### Zwei Modi:

**1. AND-Modus (Standard)**
- Wartet auf **ALLE** eingehenden Branches
- Erst wenn alle fertig sind, geht es weiter
- Use Case: Beide Eltern-Beziehungen müssen angelegt sein

```
Branch 1 ✓ + Branch 2 ✓ → JOIN → Weiter
```

**2. OR-Modus**
- Fährt fort sobald **EINER** der Branches fertig ist
- Andere Branches werden ignoriert
- Use Case: Schnellster Branch gewinnt (z.B. Timeout-Szenarien)

```
Branch 1 ✓ → JOIN → Weiter (Branch 2 wird ignoriert)
```

### Verwendung

#### 1. JOIN Node erstellen
1. Im Workflow-Editor: "Zusammenführung" Node hinzufügen
2. Node konfigurieren: AND oder OR Modus wählen
3. Mehrere Branches mit dem JOIN Node verbinden

#### 2. Konfiguration

**AND-Modus:**
```typescript
{
  type: NodeType.JOIN,
  label: 'Warte auf alle',
  data: {
    joinMode: JoinMode.AND
  }
}
```

**OR-Modus:**
```typescript
{
  type: NodeType.JOIN,
  label: 'Erster gewinnt',
  data: {
    joinMode: JoinMode.OR
  }
}
```

### Beispiel-Workflows

**Variante 1: Impliziter Join (empfohlen)**
```
[Start]
   ↓
[Daten erfassen]
   ↓
[Kind anlegen]
   ↓         ↓
[Eltern 1] [Eltern 2]
   ↓         ↓
[Email senden] ← Impliziter Join (AND)
   ↓
[Ende]
```

**Variante 2: Expliziter JOIN Node (für OR-Modus)**
```
[Start]
   ↓
[Daten erfassen]
   ↓
[Kind anlegen]
   ↓         ↓
[Eltern 1] [Eltern 2]
   ↓         ↓
   [JOIN - OR]  ← Erster Branch gewinnt
      ↓
[Email senden]
   ↓
[Ende]
```

### Execution-Ablauf mit Implizitem Join

1. **Kind anlegen (completeStep)**
   - Queue: `['eltern-1', 'eltern-2']`
   - Current: `eltern-1`

2. **Eltern 1 (completeStep)**
   - Queue: `['eltern-2']`
   - Next: `email-senden`
   - Prüfung: 2 eingehende Edges → Impliziter Join!
   - JOIN State: `completedBranches: 1/2`
   - → Weiter mit Queue (Eltern 2)

3. **Eltern 2 (completeStep)**
   - Queue: `[]`
   - Next: `email-senden`
   - JOIN State: `completedBranches: 2/2` ✅
   - → Impliziter Join erfüllt!

4. **Email senden**
   - Alle Branch-Daten gemerged
   - Node wird ausgeführt
   - Weiter zum nächsten Node

### Execution-Ablauf mit Explizitem JOIN Node

Gleicher Ablauf, aber mit explizitem JOIN-Node:
- Zusätzlicher History-Eintrag für JOIN
- Konfigurierbar: AND oder OR Modus

### Daten-Merging

Alle Branch-Variablen werden zusammengeführt:

```typescript
// Branch 1 Variablen
{ eltern1Id: 123, eltern1Name: 'Max' }

// Branch 2 Variablen
{ eltern2Id: 456, eltern2Name: 'Maria' }

// Nach JOIN
{
  eltern1Id: 123,
  eltern1Name: 'Max',
  eltern2Id: 456,
  eltern2Name: 'Maria'
}
```

**Konflikt-Handling:** Spätere Branches überschreiben frühere bei gleichen Keys.

### Implementierungsdetails

#### Neue Types

**`NodeType.JOIN`**
```typescript
export enum NodeType {
  START = 'start',
  TASK = 'task',
  ACTION = 'action',
  DECISION = 'decision',
  JOIN = 'join',  // ← NEU
  END = 'end',
}
```

**`JoinMode`**
```typescript
export enum JoinMode {
  AND = 'and', // Warte auf ALLE
  OR = 'or',   // Warte auf EINEN
}
```

**`JoinState`**
```typescript
export interface JoinState {
  nodeId: string;
  expectedBranches: number;    // Anzahl eingehender Edges
  completedBranches: number;   // Anzahl fertige Branches
  branchData: Record<string, any>[]; // Daten aus jedem Branch
}
```

#### Execution Context

```typescript
export interface ExecutionContext {
  variables: Record<string, any>;
  userId: string;
  timestamp: Date;
  nodeQueue?: string[];
  joinStates?: Record<string, JoinState>; // ← NEU
}
```

### UI/UX

**JOIN Node Darstellung:**
- Farbe: Lila/Purple (`#9c27b0`)
- Icon: ⚡ (Blitz)
- 2 Input Handles (oben)
- 1 Output Handle (unten)

**Editor:**
- Radio-Buttons für AND/OR Modus
- Visuelle Beispiele für jeden Modus
- Info-Box mit aktuellem Modus

### Wann welche Variante?

**Impliziter Join (Standard):**
- ✅ Alle Branches müssen fertig sein (AND)
- ✅ Einfacher Workflow
- ✅ Weniger Nodes

**Expliziter JOIN Node:**
- ✅ OR-Modus benötigt (erster Branch gewinnt)
- ✅ Explizite Kontrolle gewünscht
- ✅ Dokumentation im Workflow wichtig

### Einschränkungen

⚠️ **Keine Nested Joins** - JOIN in JOIN nicht getestet
⚠️ **Keine Loops** - JOIN in Schleifen nicht unterstützt
⚠️ **Reihenfolge wichtig** - Branches werden sequentiell abgearbeitet
⚠️ **Impliziter Join = AND** - Für OR-Modus expliziten JOIN Node verwenden

### Vorteile

**Impliziter Join:**
✅ **Einfach** - Keine extra Nodes nötig
✅ **Intuitiv** - Mehrere Edges → automatisches Warten
✅ **Übersichtlich** - Weniger Nodes im Workflow

**Expliziter JOIN Node:**
✅ **Explizite Kontrolle** - Klar sichtbar wo Branches zusammenlaufen
✅ **Flexible Modi** - AND oder OR je nach Use Case
✅ **Dokumentation** - JOIN erscheint in Execution History

**Beide:**
✅ **Daten-Merging** - Automatische Zusammenführung von Variablen
✅ **Debugging** - Klare Execution History

## Migration

Bestehende Workflows funktionieren **ohne Änderungen**:
- Workflows mit einer Edge: Verhalten unverändert
- Workflows mit mehreren Edges: Jetzt werden alle ausgeführt
- **NEU:** JOIN Node für Zusammenführung verfügbar

Keine Breaking Changes! 🎉

## Zusammenfassung

### Was wurde implementiert:

1. ✅ **Multi-Edge Execution** - Alle ausgehenden Edges werden sequentiell abgearbeitet
2. ✅ **Queue-System** - Nodes werden in Queue eingereiht und nacheinander verarbeitet
3. ✅ **Impliziter Join** - Nodes mit mehreren Inputs warten automatisch (AND-Modus)
4. ✅ **Expliziter JOIN Node** - Neuer Node-Type für OR-Modus und explizite Kontrolle
5. ✅ **AND/OR Modi** - Flexible Kontrolle über Join-Verhalten
6. ✅ **Daten-Merging** - Automatische Zusammenführung von Branch-Variablen
7. ✅ **UI/UX** - Vollständiger Editor für JOIN-Konfiguration

### Dateien geändert:

- `src/types/workflow.types.ts` - NodeType.JOIN, JoinMode, JoinState
- `src/stores/execution.ts` - handleJoinNode(), handleImplicitJoin(), processNextFromQueue()
- `src/components/workflow/nodes/JoinNode.vue` - Neue Node-Komponente
- `src/components/workflow/VueFlowDiagram.vue` - JOIN Node registriert
- `src/components/workflow/WorkflowEditor.vue` - JOIN Editor UI

### Wichtigste Änderung:

**Impliziter Join macht JOIN-Node optional!**

```
// Vorher: JOIN-Node zwingend nötig
[A] → [B] → [JOIN] ← [C] → [D]

// Jetzt: Einfach mehrere Edges verbinden
[A] → [B] ↘
            [D] ← Automatischer Join!
[A] → [C] ↗
```
