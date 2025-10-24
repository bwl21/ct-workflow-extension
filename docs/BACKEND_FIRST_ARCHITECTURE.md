# Backend-First Architektur für Workflows

## Problem

**Aktueller Zustand:**
- Workflows werden primär in localStorage gespeichert
- Backend wird nur als Sync-Target verwendet
- `localId` (UUID) verknüpft localStorage mit Backend
- Workflows gehen verloren bei Browser-Wechsel oder gelöschtem localStorage
- Keine Berechtigungsprüfung möglich

**Fehler:**
```typescript
// AdminView.vue - Workflows kommen aus localStorage
const workflows = computed(() => workflowStore.workflows);

// workflowStore - lädt aus localStorage
loadFromLocalStorage();

// Backend-Sync ist optional
if (backendWorkflows) {
  // Suche nach localId im Backend
  const existing = backendWorkflows.find(w => w.data.metadata.localId === workflow.id);
}
```

## Lösung: Backend-First Architektur

### 1. Datenfluss

```
Backend (ChurchTools Custom Module)
  ↓ (beim Start laden)
workflowStore (Pinia)
  ↓ (reactive)
AdminView / WorkflowEditor
```

**Keine localStorage-Persistierung mehr** (oder nur als Offline-Cache)

### 2. ID-Strategie & Datenspeicherung

**Problem: data-Feld ist auf 2000 Zeichen begrenzt**

**Lösung: Category für Metadata, Values für Definition**

```typescript
// Backend: Custom Data Category (Metadata)
{
  id: 42,                    // ← Primäre ID
  name: "Onboarding",
  shorty: "workflow_42",
  data: {                    // ← Nur Metadata (klein)
    description: "...",
    category: "Allgemein",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    createdBy: "user123"
  }
}

// Backend: Custom Data Value (Definition)
{
  id: 123,
  categoryId: 42,           // ← Verknüpfung zur Category
  type: "definition",       // ← Marker für Workflow-Definition
  data: {                   // ← Große Workflow-Definition
    version: "1.0.0",
    nodes: [...],           // Kann sehr groß werden
    edges: [...]
  }
}
```

**Strategie:**
- **Category** = Workflow-Metadata (Name, Beschreibung, Timestamps)
- **Value** = Workflow-Definition (Nodes, Edges)
- Verknüpfung über `categoryId`

**Store verwendet Backend-ID:**
```typescript
// workflowStore
interface Workflow {
  id: number,              // ← Backend-ID (nicht mehr UUID)
  name: string,
  description: string,
  category: string,
  definition: WorkflowDefinition,
  createdAt: Date,
  updatedAt: Date,
  createdBy: string
}
```

### 3. Komponenten-Änderungen

#### useWorkflows.ts
**NEU: Categories + Values kombinieren**
```typescript
export function useWorkflows() {
  const { moduleId } = usePlugin();
  
  // Query für Categories (Metadata)
  const { data: categories } = useQuery({
    queryKey: ['customModuleCategories', moduleId],
    queryFn: async () => {
      const result = await churchtoolsClient.get(
        `/custommodules/${moduleId.value}/customdatacategories`
      );
      return result.data || result;
    }
  });
  
  // Query für alle Values (Definitionen)
  const { data: allValues } = useQuery({
    queryKey: ['customModuleValues', moduleId],
    queryFn: async () => {
      const result = await churchtoolsClient.get(
        `/custommodules/${moduleId.value}/customdatavalues`
      );
      return result.data || result;
    }
  });
  
  // Workflows = Categories + Values kombiniert
  const workflows = computed(() => {
    const cats = (categories.value ?? []).filter((cat: any) => 
      cat.shorty?.startsWith('workflow_')
    );
    
    return cats.map((cat: any) => {
      // Finde Definition-Value für diese Category
      const definitionValue = (allValues.value ?? []).find(
        (v: any) => v.categoryId === cat.id && v.type === 'definition'
      );
      
      return {
        id: cat.id,
        name: cat.name,
        metadata: cat.data,
        definition: definitionValue?.data || { version: '1.0.0', nodes: [], edges: [] }
      };
    });
  });
  
  const createWorkflow = async (name: string, metadata: any, definition: WorkflowDefinition) => {
    // 1. Create Category (Metadata)
    const categoryResult = await churchtoolsClient.post(
      `/custommodules/${moduleId.value}/customdatacategories`,
      {
        name,
        shorty: `workflow_${Date.now()}`,
        data: metadata,
        customModuleId: moduleId.value,
        securityLevelId: 1
      }
    );
    
    const categoryId = categoryResult.data?.id || categoryResult.id;
    
    // 2. Create Value (Definition)
    await churchtoolsClient.post(
      `/custommodules/${moduleId.value}/customdatavalues`,
      {
        categoryId,
        type: 'definition',
        data: definition
      }
    );
    
    queryClient.invalidateQueries({ queryKey: ['customModuleCategories', moduleId] });
    queryClient.invalidateQueries({ queryKey: ['customModuleValues', moduleId] });
  };
  
  const updateWorkflow = async (id: number, metadata: any, definition: WorkflowDefinition) => {
    // 1. Update Category (Metadata)
    await churchtoolsClient.put(
      `/custommodules/${moduleId.value}/customdatacategories/${id}`,
      { data: metadata }
    );
    
    // 2. Find and update Value (Definition)
    const definitionValue = (allValues.value ?? []).find(
      (v: any) => v.categoryId === id && v.type === 'definition'
    );
    
    if (definitionValue) {
      await churchtoolsClient.put(
        `/custommodules/${moduleId.value}/customdatavalues/${definitionValue.id}`,
        { data: definition }
      );
    } else {
      // Create if not exists
      await churchtoolsClient.post(
        `/custommodules/${moduleId.value}/customdatavalues`,
        {
          categoryId: id,
          type: 'definition',
          data: definition
        }
      );
    }
    
    queryClient.invalidateQueries({ queryKey: ['customModuleCategories', moduleId] });
    queryClient.invalidateQueries({ queryKey: ['customModuleValues', moduleId] });
  };
  
  const deleteWorkflow = async (id: number) => {
    // 1. Delete Values
    const valuesToDelete = (allValues.value ?? []).filter(
      (v: any) => v.categoryId === id
    );
    
    for (const value of valuesToDelete) {
      await churchtoolsClient.post(
        `/custommodules/${moduleId.value}/customdatavalues/${value.id}`,
        { _method: 'DELETE' }
      );
    }
    
    // 2. Delete Category
    await churchtoolsClient.post(
      `/custommodules/${moduleId.value}/customdatacategories/${id}`,
      { _method: 'DELETE' }
    );
    
    queryClient.invalidateQueries({ queryKey: ['customModuleCategories', moduleId] });
    queryClient.invalidateQueries({ queryKey: ['customModuleValues', moduleId] });
  };
  
  return { workflows, createWorkflow, updateWorkflow, deleteWorkflow };
}
```

#### workflowStore.ts
**NEU: Backend-Workflows als Quelle (Metadata + Definition getrennt)**
```typescript
export const useWorkflowStore = defineStore('workflow', () => {
  const backendWorkflows = useWorkflows();
  
  // Workflows kommen aus Backend (Category + Value kombiniert)
  const workflows = computed(() => {
    return (backendWorkflows.workflows.value || []).map((w: any) => ({
      id: w.id,                    // Backend-ID
      name: w.name,
      description: w.metadata?.description || '',
      category: w.metadata?.category || 'Allgemein',
      definition: w.definition,
      createdAt: new Date(w.metadata?.createdAt || Date.now()),
      updatedAt: new Date(w.metadata?.updatedAt || Date.now()),
      createdBy: w.metadata?.createdBy || 'unknown'
    }));
  });
  
  // Actions rufen Backend-Funktionen auf
  async function createWorkflow(name: string, description: string, category: string) {
    const metadata = {
      description,
      category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user' // TODO: Get from useCurrentUser
    };
    
    const definition: WorkflowDefinition = {
      version: '1.0.0',
      nodes: [],
      edges: []
    };
    
    await backendWorkflows.createWorkflow(name, metadata, definition);
    // Query wird automatisch invalidiert und neu geladen
  }
  
  async function updateWorkflow(id: number, updates: Partial<Workflow>) {
    const workflow = workflows.value.find(w => w.id === id);
    if (!workflow) throw new Error('Workflow not found');
    
    const updatedMetadata = {
      description: updates.description ?? workflow.description,
      category: updates.category ?? workflow.category,
      createdAt: workflow.createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: workflow.createdBy
    };
    
    const updatedDefinition = updates.definition ?? workflow.definition;
    
    await backendWorkflows.updateWorkflow(id, updatedMetadata, updatedDefinition);
  }
  
  async function deleteWorkflow(id: number) {
    await backendWorkflows.deleteWorkflow(id);
  }
  
  // ENTFERNEN: localStorage-Funktionen
  // - saveToLocalStorage()
  // - loadFromLocalStorage()
  // - clearAllWorkflows()
  
  return {
    workflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    // ... andere Funktionen
  };
});
```

#### AdminView.vue
**NEU: Workflows kommen aus Store (der aus Backend lädt)**
```typescript
const workflowStore = useWorkflowStore();
const workflows = computed(() => workflowStore.workflows);

// Kein separates backendWorkflows mehr nötig
async function saveAndClose() {
  if (!selectedWorkflow.value) return;
  
  isSaving.value = true;
  try {
    const workflow = workflowStore.getWorkflowById(selectedWorkflow.value.id);
    if (!workflow) throw new Error('Workflow not found');
    
    // Direkt mit Backend-ID updaten
    await workflowStore.updateWorkflow(workflow.id, workflow);
    
    workflowStore.clearSnapshot();
    showEditModal.value = false;
    selectedWorkflow.value = null;
  } catch (error) {
    console.error('Failed to save workflow:', error);
    alert('Fehler beim Speichern des Workflows.');
  } finally {
    isSaving.value = false;
  }
}

// Kein localId-Matching mehr nötig!
```

### 4. Migration

**Keine Migration nötig:**
- Bestehende localStorage-Workflows werden ignoriert
- User erstellt neue Workflows im Backend
- Optional: Einmalige Migration beim ersten Start (später)

### 5. localStorage-Strategie

**Option A: Komplett entfernen**
- Einfachste Lösung
- Backend ist immer die Quelle

**Option B: Als Offline-Cache** (später)
- Workflows aus Backend in localStorage cachen
- Bei Offline: Aus Cache laden
- Bei Online: Backend synchronisieren

**Empfehlung: Option A** (für jetzt)

### 6. Berechtigungen

**Später implementieren:**
```typescript
// ChurchTools Custom Module unterstützt securityLevelId
{
  securityLevelId: 1  // Admin
  securityLevelId: 2  // Mitarbeiter
  securityLevelId: 3  // Alle
}

// Workflows werden nach Berechtigung gefiltert
const workflows = computed(() => 
  backendWorkflows.workflows.value.filter(w => 
    hasPermission(w.securityLevelId)
  )
);
```

## Implementierungsplan

1. **useWorkflows.ts** - Umbauen: Categories + Values kombinieren
2. **workflowStore.ts** - Umbauen auf Backend-Quelle (Metadata + Definition getrennt)
3. **AdminView.vue** - Vereinfachen (kein separates backendWorkflows)
4. **WorkflowEditor.vue** - Prüfen (sollte keine Änderungen brauchen)
5. **localStorage entfernen** - Alle localStorage-Calls entfernen
6. **ID-Typ ändern** - `id: string` → `id: number` in Types
7. **Testen** - Build und Funktionstest

## Wichtig: Datenspeicherung

**Category (data-Feld max 2000 Zeichen):**
- Name, Beschreibung, Kategorie
- Timestamps (createdAt, updatedAt)
- createdBy

**Value (data-Feld unbegrenzt):**
- Workflow-Definition (nodes, edges)
- Kann sehr groß werden (viele Nodes)
- type: 'definition' als Marker

## Vorteile

✅ Backend ist Single Source of Truth
✅ Workflows funktionieren browser-übergreifend
✅ Berechtigungen können geprüft werden
✅ Einfacheres Datenmodell (keine localId-Verknüpfung)
✅ Automatische Synchronisation durch TanStack Query
✅ Weniger Code (kein localStorage-Management)

## Nachteile

⚠️ Keine Offline-Funktionalität (erstmal)
⚠️ Abhängigkeit von Backend-Verfügbarkeit
⚠️ Bestehende localStorage-Workflows gehen verloren (akzeptabel)
