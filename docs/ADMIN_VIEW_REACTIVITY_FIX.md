# Admin View Reactivity Fix - Automatische Aktualisierung

## Problem

Die Verwaltungsseite (AdminView) wurde nach dem Erstellen oder Löschen von Workflows nicht automatisch aktualisiert. Der Benutzer musste die Seite manuell neu laden, um die Änderungen zu sehen.

### Ursache

Die AdminView verwendete den `workflowStore`, der eine manuelle Synchronisation zwischen dem Backend und dem lokalen State durchführte:

```typescript
// Alter Ansatz (❌ Nicht reaktiv)
const workflows = computed(() => workflowStore.workflows);

// workflowStore.loadWorkflows() musste manuell aufgerufen werden
onMounted(async () => {
  await workflowStore.loadWorkflows();
});
```

**Problem:** Der Store kopierte die Daten aus `useWorkflows` in ein lokales `ref`, was die Reaktivität von Vue Query unterbrach.

## Lösung

Die AdminView verwendet jetzt direkt das `useWorkflows` Composable, das Vue Query nutzt und automatisch reaktiv ist:

```typescript
// Neuer Ansatz (✅ Automatisch reaktiv)
const backendWorkflows = useWorkflows();
const workflows = computed(() => {
  const data = backendWorkflows.workflows.value || [];
  // Konvertiere zu Workflow-Format
  return data.map((cat: any): Workflow => { ... });
});
```

**Vorteil:** Vue Query invalidiert automatisch den Cache nach Änderungen und lädt die Daten neu.

## Änderungen

### 1. Imports aktualisiert

**Vorher:**
```typescript
import { ref, computed, onMounted } from 'vue';
import { useWorkflowStore } from '@/stores/workflow';

const workflowStore = useWorkflowStore();

onMounted(async () => {
  await workflowStore.loadWorkflows();
});
```

**Nachher:**
```typescript
import { ref, computed } from 'vue';
import { useWorkflowStore } from '@/stores/workflow';
import { useWorkflows } from '@/composables/useWorkflows';

const workflowStore = useWorkflowStore();
const backendWorkflows = useWorkflows();

// Kein onMounted mehr nötig - Vue Query lädt automatisch
```

### 2. Workflows Computed Property

**Vorher:**
```typescript
const workflows = computed(() => workflowStore.workflows);
```

**Nachher:**
```typescript
const workflows = computed(() => {
  const data = backendWorkflows.workflows.value || [];
  
  // Konvertiere zu Workflow-Format für die Anzeige
  return data.map((cat: any): Workflow => {
    const definition = cat.data || { version: '1.0.0', nodes: [], edges: [], metadata: {} };
    
    return {
      id: cat.id,
      name: cat.name,
      description: definition.metadata?.description || '',
      category: definition.metadata?.category || 'Allgemein',
      definition,
      createdAt: new Date(definition.metadata?.createdAt || Date.now()),
      updatedAt: new Date(definition.metadata?.updatedAt || Date.now()),
      createdBy: definition.metadata?.createdBy || 'unknown'
    };
  });
});
```

### 3. createWorkflow Funktion

**Vorher:**
```typescript
async function createWorkflow() {
  await workflowStore.createWorkflow(
    newWorkflow.value.name, 
    newWorkflow.value.description,
    newWorkflow.value.category
  );
  // Liste wird nicht automatisch aktualisiert
}
```

**Nachher:**
```typescript
async function createWorkflow() {
  const definition: WorkflowDefinition = {
    version: '1.0.0',
    nodes: [],
    edges: [],
    metadata: {
      description: newWorkflow.value.description,
      category: newWorkflow.value.category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user'
    }
  };
  
  await backendWorkflows.createWorkflow(newWorkflow.value.name, definition);
  // ✅ Vue Query invalidiert automatisch den Cache und lädt neu
}
```

### 4. deleteWorkflow Funktion

**Vorher:**
```typescript
async function deleteWorkflow() {
  await workflowStore.deleteWorkflow(selectedWorkflow.value.id);
  // Liste wird nicht automatisch aktualisiert
}
```

**Nachher:**
```typescript
async function deleteWorkflow() {
  await backendWorkflows.deleteWorkflow(selectedWorkflow.value.id);
  // ✅ Vue Query invalidiert automatisch den Cache und lädt neu
}
```

### 5. cancelEdit Funktion

**Vorher:**
```typescript
function cancelEdit() {
  showEditModal.value = false;
  selectedWorkflow.value = null;
  workflowStore.setCurrentWorkflow(null);
  // Manuelles Reload nötig
  workflowStore.loadWorkflows();
}
```

**Nachher:**
```typescript
function cancelEdit() {
  showEditModal.value = false;
  selectedWorkflow.value = null;
  workflowStore.setCurrentWorkflow(null);
  // ✅ Kein Reload nötig - Vue Query handled Reaktivität
}
```

## Wie Vue Query funktioniert

### Query Invalidation

Wenn ein Workflow erstellt oder gelöscht wird, invalidiert `useWorkflows` den Query-Cache:

```typescript
// In useWorkflows.ts
const createWorkflow = async (name: string, definition: WorkflowDefinition) => {
  // ... API Call ...
  
  // Invalidiere den Cache
  queryClient.invalidateQueries({ queryKey: ['workflows', moduleId] });
  
  // ✅ Vue Query lädt automatisch die Daten neu
};
```

### Automatisches Refetch

Vue Query erkennt die Invalidierung und lädt die Daten automatisch neu:

```
1. User klickt "Workflow erstellen"
2. createWorkflow() wird aufgerufen
3. API Call erstellt den Workflow
4. queryClient.invalidateQueries() markiert Cache als ungültig
5. Vue Query lädt automatisch die Workflows neu
6. workflows computed property wird aktualisiert
7. ✅ UI zeigt den neuen Workflow
```

## Vorteile

✅ **Automatische Aktualisierung:** Keine manuellen `loadWorkflows()` Aufrufe mehr  
✅ **Reaktivität:** Vue Query handled alle State-Updates automatisch  
✅ **Weniger Code:** Kein `onMounted` Hook mehr nötig  
✅ **Konsistenz:** Alle Komponenten sehen immer die aktuellen Daten  
✅ **Performance:** Vue Query cached intelligent und lädt nur bei Bedarf  

## Nachteile (behoben)

❌ **Doppelte State-Verwaltung:** Store + Composable (jetzt nur noch Composable)  
❌ **Manuelle Synchronisation:** Store musste manuell aktualisiert werden (jetzt automatisch)  
❌ **Race Conditions:** Timing-Probleme beim Laden (jetzt durch Vue Query gelöst)  

## Testing

### Manuelle Tests

1. **Workflow erstellen:**
   - Klicke "Neuer Workflow"
   - Fülle Formular aus
   - Klicke "Erstellen"
   - ✅ Workflow erscheint sofort in der Liste

2. **Workflow löschen:**
   - Klicke "Löschen" bei einem Workflow
   - Bestätige Löschung
   - ✅ Workflow verschwindet sofort aus der Liste

3. **Workflow bearbeiten:**
   - Klicke "Bearbeiten" bei einem Workflow
   - Mache Änderungen
   - Klicke "Speichern & Schließen"
   - ✅ Änderungen sind sofort sichtbar

4. **Abbrechen:**
   - Klicke "Bearbeiten" bei einem Workflow
   - Mache Änderungen
   - Klicke "Abbrechen"
   - ✅ Änderungen werden verworfen (keine unnötigen Reloads)

### Automatische Tests

```bash
npm run build  # ✅ Build erfolgreich
```

## Architektur

### Vorher (❌ Kompliziert)

```
AdminView
  ↓ verwendet
workflowStore (Pinia)
  ↓ kopiert Daten von
useWorkflows (Vue Query)
  ↓ lädt von
ChurchTools API
```

**Problem:** Daten werden kopiert, Reaktivität geht verloren

### Nachher (✅ Einfach)

```
AdminView
  ↓ verwendet direkt
useWorkflows (Vue Query)
  ↓ lädt von
ChurchTools API
```

**Vorteil:** Direkte Reaktivität, keine Kopien

## Zukünftige Verbesserungen

### Option 1: Store komplett entfernen

Der `workflowStore` wird nur noch für den Editor verwendet. Langfristig könnte man:
- Editor auch auf `useWorkflows` umstellen
- Store nur für UI-State (currentWorkflowId, Modals, etc.) verwenden
- Backend-Logik komplett in Composables auslagern

### Option 2: Store als Wrapper

Der Store könnte als dünner Wrapper um `useWorkflows` dienen:

```typescript
export const useWorkflowStore = defineStore('workflow', () => {
  const backendWorkflows = useWorkflows();
  
  // Nur UI-State
  const currentWorkflowId = ref<number | null>(null);
  
  // Direkte Weiterleitung
  const workflows = computed(() => backendWorkflows.workflows.value);
  
  return {
    workflows,
    currentWorkflowId,
    createWorkflow: backendWorkflows.createWorkflow,
    deleteWorkflow: backendWorkflows.deleteWorkflow,
    // ...
  };
});
```

## Changelog

### Version 1.3.0 (2025-01-21)

**Fixed:**
- ✅ AdminView aktualisiert sich jetzt automatisch nach Erstellen/Löschen
- ✅ Keine manuellen `loadWorkflows()` Aufrufe mehr nötig
- ✅ Vue Query handled alle State-Updates automatisch

**Changed:**
- `src/views/AdminView.vue`: Verwendet jetzt direkt `useWorkflows` Composable
- Entfernt: `onMounted` Hook für manuelles Laden
- Entfernt: Manuelle `loadWorkflows()` Aufrufe

**Improved:**
- Reaktivität durch Vue Query
- Weniger Code
- Bessere Performance

## Referenzen

- Vue Query: [https://tanstack.com/query/latest/docs/vue/overview](https://tanstack.com/query/latest/docs/vue/overview)
- useWorkflows Composable: `src/composables/useWorkflows.ts`
- AdminView: `src/views/AdminView.vue`
