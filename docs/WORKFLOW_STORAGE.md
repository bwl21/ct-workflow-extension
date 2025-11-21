# Workflow Storage Architecture

## Übersicht

Workflows werden im ChurchTools Custom Module System gespeichert unter Verwendung von Custom Data Categories und Custom Data Values.

## Aktuelle Architektur

### Struktur

Jeder Workflow besteht aus:

```
CustomDataCategory (z.B. workflow_1)
  ├─ name: "Workflow Name"
  ├─ shorty: "workflow_1"
  ├─ description: "" (leer)
  └─ CustomDataValue (genau 1)
      └─ value: JSON-String der Workflow-Definition
```

### Design-Prinzipien

1. **Genau ein CustomDataValue pro Workflow**
   - Beim Laden: Falls mehrere Values existieren → Warnung + neuester wird verwendet (höchste ID)
   - Beim Update: Existierender Value wird aktualisiert
   - Beim Erstellen: Kategorie + ein Value werden erstellt

2. **JSON-Speicherung ohne Einrückungen**
   - `JSON.stringify(definition)` ohne Formatierung
   - Spart erheblich Speicherplatz
   - Beispiel: `{"version":"1.0.0","nodes":[],"edges":[]}`

3. **Größenlimits**
   - CustomDataCategory description: ~64KB (nicht verwendet)
   - CustomDataValue value: Deutlich größer (mehrere MB möglich)
   - Aktuell keine Kompression

## Workflow-Definition Format

```typescript
interface WorkflowDefinition {
  version: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata: {
    description?: string;
    category?: string;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
  };
}
```

## Implementierung

### Dateien

- `src/utils/kv-store.ts` - Utility-Funktionen für Custom Module API
- `src/utils/ct-types.ts` - TypeScript-Typen für ChurchTools API
- `src/composables/useWorkflows.ts` - Workflow-Management mit KV-Store

### API-Operationen

**Laden:**
```typescript
// 1. Hole alle Kategorien mit shorty "workflow_*"
// 2. Für jede Kategorie: Hole CustomDataValues
// 3. Validiere: Genau 1 Value erwartet
// 4. Parse JSON aus value-Feld
```

**Erstellen:**
```typescript
// 1. Erstelle CustomDataCategory (ohne Definition)
// 2. Erstelle CustomDataValue mit JSON-Definition
```

**Aktualisieren:**
```typescript
// 1. Update CustomDataValue (nicht die Kategorie)
// 2. Falls kein Value existiert: Erstelle einen (Fallback)
```

**Löschen:**
```typescript
// 1. Lösche CustomDataCategory
// 2. Values werden automatisch mitgelöscht
```

## Zukünftige Erweiterungen

### Geplant: Kompression

**Problem:** Sehr große Workflows können Speicherlimits erreichen

**Lösung:** JSON-Kompression vor dem Speichern
- Library: pako (gzip compression)
- Transparent für Anwendung
- Backward-compatible durch Version-Check

**Implementierung (TODO):**
```typescript
import pako from 'pako';

// Speichern
const json = JSON.stringify(definition);
const compressed = pako.deflate(json, { to: 'string' });
const value = JSON.stringify({
  version: '2.0.0',
  compressed: true,
  data: compressed
});

// Laden
const stored = JSON.parse(value);
if (stored.compressed) {
  const decompressed = pako.inflate(stored.data, { to: 'string' });
  definition = JSON.parse(decompressed);
}
```

**Vorteile:**
- 60-80% Größenreduktion bei typischen Workflows
- Ermöglicht sehr komplexe Workflows
- Backward-compatible durch Version-Flag

### Geplant: Execution Logs

**Problem:** Workflow-Ausführungen sollen gespeichert werden

**Vorschlag:** Separate Kategorien pro Workflow
```
workflow_1_definition    → 1 Value mit Definition
workflow_1_executions    → N Values mit Execution-Logs
```

**Alternative:** Zentrale Execution-Kategorie
```
workflow_executions      → Alle Executions aller Workflows
  └─ Values mit {workflowId, executionId, ...}
```

## Backward Compatibility

Die aktuelle Implementierung unterstützt alte Workflows:

1. **Alte Version:** Definition in `category.description` Feld
2. **Neue Version:** Definition in `CustomDataValue`

Beim Laden wird automatisch erkannt und migriert.

## Monitoring & Debugging

### Logging

Alle Operationen loggen in Console:
- `[useWorkflows] createWorkflow called`
- `[useWorkflows] Workflow size: X.XX KB`
- Warnungen bei mehreren Values
- Fehler bei fehlgeschlagenen Operationen

### Größen-Validierung

Bei jedem Speichern wird die Größe geloggt:
```typescript
const sizeKB = new Blob([definitionJson]).size / 1024;
console.log(`Workflow size: ${sizeKB.toFixed(2)} KB`);
```

## Bekannte Limitierungen

1. **Keine Versionierung:** Überschreiben löscht alte Version
2. **Keine Transaktionen:** Kategorie + Value werden separat erstellt
3. **Keine Kompression:** Große Workflows können Limits erreichen
4. **Keine Execution-History:** Nur Definition wird gespeichert

## Migration von alter zu neuer Architektur

Workflows die vor der KV-Store-Migration erstellt wurden, haben die Definition im `description`-Feld der Kategorie. Diese werden beim ersten Laden automatisch erkannt und funktionieren weiterhin (Fallback-Logik in `useWorkflows.ts`).

Beim nächsten Speichern werden sie automatisch in die neue Struktur migriert.
