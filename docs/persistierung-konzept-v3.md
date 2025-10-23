# Persistierung-Konzept V3 mit @churchtools/utils

## Änderungen zu V2

**V2 Problem:** Direkter Zugriff auf ChurchTools REST API erfordert manuelles Handling von:
- HTTP-Requests
- Caching
- Error-Handling
- Type-Safety
- Query-Invalidierung

**V3 Lösung:** Nutzung von `@churchtools/utils` Composables wie in `churchtools-extension-tasks`:
- ✅ Type-Safe Composables
- ✅ Automatisches Caching via TanStack Query
- ✅ Optimistic Updates
- ✅ Error-Handling
- ✅ Loading States
- ✅ Query Invalidierung

## Kernidee (unverändert)

**Workflows = CustomDataCategories**
**Workflow-Executions = CustomDataValues in einer Kategorie**

### Unterschied zu V2:

**V2:** 1 Workflow = 1 Category, 1 Execution = 1 Sub-Category
**V3:** 1 Workflow = 1 Category, 1 Execution = 1 CustomDataValue

**Begründung:**
- Einfachere Struktur (keine verschachtelten Kategorien)
- Bessere Performance (weniger API-Calls)
- Konsistent mit churchtools-extension-tasks Pattern
- Executions sind Daten, keine Kategorien

## Datenstruktur

### Hierarchie

```
CustomModule (ct-workflow)
├── CustomDataCategory (Workflow: "Mitgliederaufnahme")
│   ├── Metadata (in category.meta als JSON)
│   │   ├── workflow definition (nodes, edges)
│   │   ├── created/updated timestamps
│   │   └── creator info
│   │
│   └── CustomDataValues (Executions)
│       ├── CustomDataValue (execution-1 → {status, context, steps, userId})
│       ├── CustomDataValue (execution-2 → {status, context, steps, userId})
│       └── CustomDataValue (execution-3 → {status, context, steps, userId})
│
├── CustomDataCategory (Workflow: "Event-Planung")
│   ├── Metadata (workflow definition)
│   └── CustomDataValues (Executions)
│       └── ...
│
└── CustomDataCategory (_settings)
    └── CustomDataValue (global settings)
```

## Workflow-Definition

### In CustomDataCategory

Die Workflow-Definition wird in der `meta` Property der Kategorie gespeichert:

```typescript
interface WorkflowCategory {
  id: number;                    // ChurchTools category ID
  name: string;                  // "Mitgliederaufnahme"
  shorty: string;                // "workflow_1"
  meta: WorkflowDefinition;      // Workflow-Definition als Object
  customModuleId: number;
  securityLevelId: number;
  icon?: string;
  color?: string;
}

interface WorkflowDefinition {
  version: string;               // "1.0.0"
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    description: string;
  };
}
```

**Beispiel:**
```typescript
{
  id: 1,
  name: "Mitgliederaufnahme",
  shorty: "workflow_1",
  customModuleId: 42,
  securityLevelId: 1,
  icon: "user-plus",
  color: "primary",
  meta: {
    version: "1.0.0",
    nodes: [
      {
        id: "start-1",
        type: "start",
        label: "Start",
        position: { x: 100, y: 200 },
        data: {}
      },
      {
        id: "task-1",
        type: "task",
        label: "Persönliche Daten",
        position: { x: 300, y: 200 },
        data: {
          fields: [
            { name: "firstName", label: "Vorname", type: "text", required: true },
            { name: "lastName", label: "Nachname", type: "text", required: true }
          ]
        }
      }
    ],
    edges: [
      { id: "edge-1", source: "start-1", target: "task-1" }
    ],
    metadata: {
      createdAt: "2025-01-15T10:00:00Z",
      updatedAt: "2025-01-15T10:00:00Z",
      createdBy: "user-123",
      description: "Workflow für die Aufnahme neuer Mitglieder"
    }
  }
}
```

## Workflow-Execution

### CustomDataValue pro Execution

Jede Workflow-Ausführung ist ein CustomDataValue in der Workflow-Kategorie:

```typescript
interface WorkflowExecution {
  id: number;                    // ChurchTools value ID
  dataCategoryId: number;        // Workflow category ID
  type: 'execution';             // Typ-Marker
  meta: ExecutionData;           // Execution-Daten
}

interface ExecutionData {
  executionId: string;           // UUID
  userId: number;
  userName: string;
  status: ExecutionStatus;       // 'running' | 'completed' | 'failed' | 'paused'
  currentNodeId: string;
  startedAt: string;
  completedAt?: string;
  pausedAt?: string;
  
  // Execution Context
  context: {
    variables: Record<string, any>;
    history: string[];           // Array von nodeIds
  };
  
  // Steps
  steps: Record<string, StepData>;
}

interface StepData {
  nodeId: string;
  nodeName: string;
  timestamp: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  status: 'success' | 'error' | 'skipped';
  duration: number;
  error?: string;
}
```

**Beispiel:**
```typescript
{
  id: 123,
  dataCategoryId: 1,
  type: 'execution',
  meta: {
    executionId: "exec-2025-01-15-10-30-abc123",
    userId: 42,
    userName: "Max Mustermann",
    status: "running",
    currentNodeId: "task-2",
    startedAt: "2025-01-15T10:30:00Z",
    context: {
      variables: {
        firstName: "Max",
        lastName: "Mustermann",
        email: "max@example.com"
      },
      history: ["start-1", "task-1"]
    },
    steps: {
      "start-1": {
        nodeId: "start-1",
        nodeName: "Start",
        timestamp: "2025-01-15T10:30:00Z",
        inputs: {},
        outputs: {},
        status: "success",
        duration: 0
      },
      "task-1": {
        nodeId: "task-1",
        nodeName: "Persönliche Daten",
        timestamp: "2025-01-15T10:31:00Z",
        inputs: {},
        outputs: {
          firstName: "Max",
          lastName: "Mustermann"
        },
        status: "success",
        duration: 60000
      }
    }
  }
}
```

## Composables (basierend auf churchtools-extension-tasks)

### useWorkflows.ts

```typescript
import { 
  useCustomModuleDataCategoriesQuery,
  useCustomModuleDataCategoryMutations 
} from '@churchtools/utils';
import { computed } from 'vue';
import { usePlugin } from './usePlugin';

export function useWorkflows() {
  const { moduleId } = usePlugin();
  
  // Query für alle Kategorien
  const { data: categories, isLoading } = 
    useCustomModuleDataCategoriesQuery<WorkflowDefinition>(moduleId);
  
  // Mutations für CRUD
  const { 
    createDataCategory, 
    updateDataCategory, 
    deleteDataCategory 
  } = useCustomModuleDataCategoryMutations<WorkflowDefinition>(moduleId);
  
  // Nur Workflow-Kategorien (keine _settings)
  const workflows = computed(() => 
    (categories.value ?? []).filter(cat => 
      cat.shorty?.startsWith('workflow_')
    )
  );
  
  const createWorkflow = async (name: string, definition: WorkflowDefinition) => {
    const lastId = workflows.value[workflows.value.length - 1]?.id ?? 0;
    
    await createDataCategory({
      name,
      shorty: `workflow_${lastId + 1}`,
      meta: definition,
      customModuleId: moduleId.value,
      securityLevelId: 1,
      icon: 'workflow',
      color: 'primary'
    });
  };
  
  const updateWorkflow = async (id: number, definition: WorkflowDefinition) => {
    const workflow = workflows.value.find(w => w.id === id);
    if (!workflow) throw new Error('Workflow not found');
    
    await updateDataCategory({
      ...workflow,
      meta: definition
    });
  };
  
  const deleteWorkflow = async (id: number) => {
    await deleteDataCategory(id);
  };
  
  return {
    workflows,
    isLoading,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow
  };
}
```

### useExecutions.ts

```typescript
import { 
  useCustomModuleDataValuesMutations,
  useCustomModuleDataValuesQuery 
} from '@churchtools/utils';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { usePlugin } from './usePlugin';
import { useCurrentUser } from '@churchtools/utils';

export function useExecutions(workflowId: MaybeRefOrGetter<number>) {
  const { moduleId } = usePlugin();
  const categoryId = computed(() => toValue(workflowId));
  const currentUser = useCurrentUser();
  
  // Query für alle Values in der Kategorie
  const { data, isLoading } = 
    useCustomModuleDataValuesQuery<ExecutionData>(moduleId, categoryId);
  
  // Mutations für CRUD
  const { 
    createCustomDataValue, 
    updateCustomDataValue, 
    deleteCustomDataValue 
  } = useCustomModuleDataValuesMutations<ExecutionData>(moduleId, categoryId);
  
  // Nur Executions (type === 'execution')
  const executions = computed(() => 
    (data.value ?? []).filter(v => v.type === 'execution')
  );
  
  // Executions des aktuellen Users
  const myExecutions = computed(() =>
    executions.value.filter(e => e.meta.userId === currentUser.id)
  );
  
  const createExecution = async (workflowId: number) => {
    const executionId = `exec-${Date.now()}-${generateId()}`;
    
    return await createCustomDataValue({
      dataCategoryId: workflowId,
      type: 'execution',
      meta: {
        executionId,
        userId: currentUser.id,
        userName: currentUser.name,
        status: 'running',
        currentNodeId: 'start',
        startedAt: new Date().toISOString(),
        context: {
          variables: {},
          history: []
        },
        steps: {}
      }
    });
  };
  
  const updateExecution = async (execution: WorkflowExecution) => {
    await updateCustomDataValue({
      ...execution,
      dataCategoryId: categoryId.value
    });
  };
  
  const saveStep = async (
    execution: WorkflowExecution, 
    nodeId: string, 
    stepData: StepData
  ) => {
    const updatedExecution = {
      ...execution,
      meta: {
        ...execution.meta,
        currentNodeId: nodeId,
        context: {
          ...execution.meta.context,
          history: [...execution.meta.context.history, nodeId]
        },
        steps: {
          ...execution.meta.steps,
          [nodeId]: stepData
        }
      }
    };
    
    await updateExecution(updatedExecution);
  };
  
  const completeExecution = async (execution: WorkflowExecution) => {
    await updateExecution({
      ...execution,
      meta: {
        ...execution.meta,
        status: 'completed',
        completedAt: new Date().toISOString()
      }
    });
  };
  
  const pauseExecution = async (execution: WorkflowExecution) => {
    await updateExecution({
      ...execution,
      meta: {
        ...execution.meta,
        status: 'paused',
        pausedAt: new Date().toISOString()
      }
    });
  };
  
  const resumeExecution = async (execution: WorkflowExecution) => {
    await updateExecution({
      ...execution,
      meta: {
        ...execution.meta,
        status: 'running',
        pausedAt: undefined
      }
    });
  };
  
  const deleteExecution = async (executionId: number) => {
    await deleteCustomDataValue({
      id: executionId,
      dataCategoryId: categoryId.value
    });
  };
  
  return {
    executions,
    myExecutions,
    isLoading,
    createExecution,
    updateExecution,
    saveStep,
    completeExecution,
    pauseExecution,
    resumeExecution,
    deleteExecution
  };
}
```

### usePlugin.ts

```typescript
import { useCustomModuleQuery } from '@churchtools/utils';
import { computed } from 'vue';

export function usePlugin() {
  const { data, isLoading } = useCustomModuleQuery(import.meta.env.VITE_KEY);
  
  const moduleId = computed(() => data.value?.id);
  
  return {
    moduleId,
    isLoading
  };
}
```

## API-Operationen (via Composables)

### Workflow-Management

```typescript
// In Admin-Komponente
const { workflows, createWorkflow, updateWorkflow, deleteWorkflow } = useWorkflows();

// Workflow erstellen
await createWorkflow('Mitgliederaufnahme', workflowDefinition);

// Workflow aktualisieren
await updateWorkflow(workflowId, updatedDefinition);

// Workflow löschen
await deleteWorkflow(workflowId);
```

### Execution-Management

```typescript
// In User-Komponente
const { 
  myExecutions, 
  createExecution, 
  saveStep, 
  completeExecution 
} = useExecutions(workflowId);

// Execution starten
const execution = await createExecution(workflowId);

// Schritt speichern
await saveStep(execution, nodeId, stepData);

// Execution abschließen
await completeExecution(execution);
```

## Berechtigungen

### ChurchTools Security Levels

Workflows nutzen `securityLevelId` für Berechtigungen:

```typescript
interface SecurityLevel {
  1: 'Admin',           // Voller Zugriff
  2: 'Mitarbeiter',     // Kann Workflows ausführen
  3: 'Benutzer'         // Nur eigene Executions sehen
}
```

### Berechtigungs-Logik

```typescript
// In useWorkflows.ts
const canEditWorkflow = computed(() => {
  return currentUser.securityLevelId <= 1; // Nur Admins
});

const canExecuteWorkflow = computed(() => {
  return currentUser.securityLevelId <= 2; // Admins + Mitarbeiter
});

// In useExecutions.ts
const canViewExecution = (execution: WorkflowExecution) => {
  return execution.meta.userId === currentUser.id || 
         currentUser.securityLevelId <= 1; // Owner oder Admin
};

const canEditExecution = (execution: WorkflowExecution) => {
  return execution.meta.userId === currentUser.id; // Nur Owner
};
```

## Store-Integration

### Workflow Store

```typescript
// src/stores/workflow.ts
import { defineStore } from 'pinia';
import { useWorkflows } from '@/composables/useWorkflows';

export const useWorkflowStore = defineStore('workflow', () => {
  const { workflows, isLoading, createWorkflow, updateWorkflow, deleteWorkflow } = 
    useWorkflows();
  
  // Zusätzliche Store-Logik
  const currentWorkflowId = ref<number | null>(null);
  
  const currentWorkflow = computed(() => 
    workflows.value.find(w => w.id === currentWorkflowId.value)
  );
  
  return {
    workflows,
    isLoading,
    currentWorkflow,
    currentWorkflowId,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow
  };
});
```

### Execution Store

```typescript
// src/stores/execution.ts
import { defineStore } from 'pinia';
import { useExecutions } from '@/composables/useExecutions';
import { useWorkflowStore } from './workflow';

export const useExecutionStore = defineStore('execution', () => {
  const workflowStore = useWorkflowStore();
  
  const { 
    myExecutions, 
    createExecution, 
    saveStep, 
    completeExecution 
  } = useExecutions(() => workflowStore.currentWorkflowId ?? 0);
  
  const currentExecutionId = ref<number | null>(null);
  
  const currentExecution = computed(() =>
    myExecutions.value.find(e => e.id === currentExecutionId.value)
  );
  
  return {
    myExecutions,
    currentExecution,
    currentExecutionId,
    createExecution,
    saveStep,
    completeExecution
  };
});
```

## Vorteile von V3 gegenüber V2

### 1. Einfachere Struktur
- ❌ V2: Verschachtelte Kategorien (Category → Sub-Category → Values)
- ✅ V3: Flache Struktur (Category → Values)

### 2. Bessere Performance
- ❌ V2: Mehrere API-Calls für Sub-Kategorien
- ✅ V3: Ein API-Call für alle Executions

### 3. Type-Safety
- ❌ V2: Manuelle Type-Casts bei API-Calls
- ✅ V3: Generics in Composables (`useCustomModuleDataValuesQuery<ExecutionData>`)

### 4. Automatisches Caching
- ❌ V2: Manuelles Caching implementieren
- ✅ V3: TanStack Query handled Caching automatisch

### 5. Optimistic Updates
- ❌ V2: UI wartet auf Server-Response
- ✅ V3: UI updated sofort, rollback bei Fehler

### 6. Error-Handling
- ❌ V2: Manuelles try-catch überall
- ✅ V3: Composables liefern error-State

### 7. Loading States
- ❌ V2: Manuelles Loading-State-Management
- ✅ V3: `isLoading` automatisch verfügbar

### 8. Query Invalidierung
- ❌ V2: Manuelles Reload nach Mutations
- ✅ V3: Automatische Invalidierung verwandter Queries

## Dependencies

### Strategie: Lokale Kopie von @churchtools/utils (nicht committen!)

**Problem:** `@churchtools/utils` ist nicht veröffentlicht und darf nicht in unser Repo.

**Lösung:** Lokale Kopie nur in der Build-Umgebung (Ona/Gitpod), nicht im Git-Repository.

#### Verzeichnisstruktur (nur lokal, nicht in Git!)

```
/workspaces/
├── ct-workflow-extension/          # Hauptprojekt (in Git)
│   ├── src/
│   ├── package.json
│   ├── .gitignore                  # Enthält ../churchtools-utils
│   └── ...
│
└── churchtools-utils/              # Lokale Kopie (NICHT in Git!)
    ├── src/
    ├── package.json
    └── ...
```

#### .gitignore Anpassung

```gitignore
# Lokale churchtools-utils Kopie
../churchtools-utils/

# node_modules enthält Symlink zu churchtools-utils
node_modules/
```

#### Package.json Konfiguration

```json
{
  "dependencies": {
    "@churchtools/utils": "file:../churchtools-utils"
  }
}
```

**Wichtig:** 
- ❌ `package.json` wird committet (mit `file:../churchtools-utils`)
- ❌ `churchtools-utils/` wird NICHT committet
- ✅ Jeder Entwickler muss `churchtools-utils` lokal bereitstellen

#### Setup-Schritte für Entwickler

**Manuell:**
```bash
# 1. churchtools-utils neben Projekt bereitstellen
cd /workspaces

# Option A: Aus anderem Projekt kopieren
cp -r /path/to/churchtools-extension-tasks/node_modules/@churchtools/utils churchtools-utils

# Option B: Aus lokalem ChurchTools Repo
cp -r /path/to/churchtools/frontend-packages/utils churchtools-utils

# 2. churchtools-utils Dependencies installieren
cd churchtools-utils
npm install

# 3. Im Hauptprojekt installieren
cd ../ct-workflow-extension
npm install
```

**Automatisiert (Ona Script):**
```bash
# .ona/setup-utils.sh (wird von Ona ausgeführt, nicht committet)
#!/bin/bash

if [ ! -d "../churchtools-utils" ]; then
  echo "Setting up churchtools-utils..."
  
  # Ona kann das aus einem privaten Speicherort kopieren
  # z.B. aus einem anderen Workspace oder Cache
  cp -r /ona/cache/churchtools-utils ../churchtools-utils
  
  cd ../churchtools-utils
  npm install
  cd ../ct-workflow-extension
fi

npm install
```

#### Vorteile

- ✅ Volle Kontrolle über @churchtools/utils Code
- ✅ Lokale Anpassungen möglich
- ✅ Keine Wartezeit auf npm-Veröffentlichung
- ✅ TypeScript-Typen verfügbar
- ✅ Hot-Reload funktioniert (mit Vite)

#### Nachteile

- ⚠️ Zusätzliches Verzeichnis im Workspace
- ⚠️ Manuelles Sync bei Updates
- ⚠️ Deployment muss churchtools-utils einbeziehen

#### Deployment-Strategie

**Option 1: Bundle alles**
```bash
npm run build
# Vite bundelt @churchtools/utils automatisch mit
```

**Option 2: Git Submodule**
```bash
# In ct-workflow-extension
git submodule add https://github.com/churchtools/churchtools-utils.git ../churchtools-utils
git submodule update --init --recursive
```

**Option 3: Monorepo mit Workspaces**
```json
// package.json im Root
{
  "workspaces": [
    "ct-workflow-extension",
    "churchtools-utils"
  ]
}
```

#### Ona/Gitpod Setup

**Problem:** Ona/Gitpod startet mit leerem Workspace, `churchtools-utils` fehlt.

**Lösung:** Ona kopiert `churchtools-utils` beim Start aus einem Cache/Speicherort.

**.gitpod.yml:**
```yaml
tasks:
  - name: Setup
    init: |
      # Ona kann hier churchtools-utils bereitstellen
      if [ ! -d "../churchtools-utils" ]; then
        echo "⚠️  churchtools-utils nicht gefunden!"
        echo "Bitte manuell bereitstellen oder Ona-Script verwenden"
        exit 1
      fi
      npm install
    command: npm run dev
```

**Ona-spezifische Lösung:**

Ona kann `churchtools-utils` aus verschiedenen Quellen bereitstellen:

1. **Aus anderem Workspace:**
   ```bash
   # Wenn churchtools-extension-tasks bereits in Ona ist
   cp -r /workspaces/churchtools-extension-tasks/node_modules/@churchtools/utils \
         /workspaces/churchtools-utils
   ```

2. **Aus Ona-Cache:**
   ```bash
   # Ona könnte einen persistenten Cache haben
   cp -r /ona/cache/churchtools-utils /workspaces/churchtools-utils
   ```

3. **Aus lokalem ChurchTools Repo:**
   ```bash
   # Falls ChurchTools Repo verfügbar
   cp -r /workspaces/churchtools/frontend-packages/utils \
         /workspaces/churchtools-utils
   ```

**Empfehlung für Ona:**
- Beim ersten Start: Manuell `churchtools-utils` bereitstellen
- Danach: Ona cached das Verzeichnis für zukünftige Sessions
- Entwickler muss nichts manuell tun

#### CI/CD Pipeline

**Problem:** GitHub Actions hat keinen Zugriff auf `churchtools-utils`.

**Lösung 1: GitHub Secret mit Base64-encoded Package**
```yaml
name: Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup churchtools-utils
        env:
          CHURCHTOOLS_UTILS_BASE64: ${{ secrets.CHURCHTOOLS_UTILS_BASE64 }}
        run: |
          cd ..
          echo "$CHURCHTOOLS_UTILS_BASE64" | base64 -d | tar xz
          cd churchtools-utils
          npm install
          
      - name: Install dependencies
        run: npm install
        
      - name: Build
        run: npm run build
```

**Secret erstellen:**
```bash
# Lokal churchtools-utils packen und base64 encodieren
cd /workspaces
tar czf - churchtools-utils | base64 > churchtools-utils.base64

# In GitHub Secrets als CHURCHTOOLS_UTILS_BASE64 speichern
```

**Lösung 2: Private GitHub Repository**
```yaml
- name: Setup churchtools-utils
  run: |
    cd ..
    git clone https://${{ secrets.GH_TOKEN }}@github.com/your-org/churchtools-utils-private.git churchtools-utils
    cd churchtools-utils
    npm install
```

**Lösung 3: Artifact aus anderem Workflow**
```yaml
- name: Download churchtools-utils
  uses: actions/download-artifact@v3
  with:
    name: churchtools-utils
    path: ../churchtools-utils
```

### Alternative: Minimale Eigene Implementierung

Falls lokale Kopie nicht gewünscht, können die benötigten Composables selbst implementiert werden.

#### Benötigte Dependencies

```json
{
  "dependencies": {
    "@tanstack/vue-query": "^5.0.0",
    "@churchtools/churchtools-client": "^1.3.7"
  }
}
```

#### Minimale Implementierung

**src/composables/useCustomModuleQuery.ts:**
```typescript
import { useQuery } from '@tanstack/vue-query';
import { churchtoolsClient } from '@churchtools/churchtools-client';
import { computed, type MaybeRefOrGetter, toValue } from 'vue';

export function useCustomModuleQuery(moduleKey: MaybeRefOrGetter<string>) {
  const query = useQuery({
    queryKey: computed(() => ['customModule', toValue(moduleKey)]),
    queryFn: async () => {
      const response = await churchtoolsClient.get(`/custommodules/${toValue(moduleKey)}`);
      return response.data;
    },
    enabled: computed(() => !!toValue(moduleKey))
  });
  
  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error
  };
}
```

**src/composables/useCustomModuleDataCategoriesQuery.ts:**
```typescript
import { useQuery } from '@tanstack/vue-query';
import { churchtoolsClient } from '@churchtools/churchtools-client';
import { computed, type MaybeRefOrGetter, toValue } from 'vue';

export function useCustomModuleDataCategoriesQuery<T = any>(
  moduleId: MaybeRefOrGetter<number>
) {
  const query = useQuery({
    queryKey: computed(() => ['customModuleDataCategories', toValue(moduleId)]),
    queryFn: async () => {
      const response = await churchtoolsClient.get(
        `/custommodules/${toValue(moduleId)}/customdatacategories`
      );
      return response.data as Array<{
        id: number;
        name: string;
        shorty: string;
        meta: T;
        customModuleId: number;
        securityLevelId: number;
        icon?: string;
        color?: string;
      }>;
    },
    enabled: computed(() => toValue(moduleId) > 0)
  });
  
  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error
  };
}
```

**src/composables/useCustomModuleDataCategoryMutations.ts:**
```typescript
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { churchtoolsClient } from '@churchtools/churchtools-client';
import { computed, type MaybeRefOrGetter, toValue } from 'vue';

export function useCustomModuleDataCategoryMutations<T = any>(
  moduleId: MaybeRefOrGetter<number>
) {
  const queryClient = useQueryClient();
  const mId = computed(() => toValue(moduleId));
  
  const createDataCategory = useMutation({
    mutationFn: async (category: any) => {
      const response = await churchtoolsClient.post(
        `/custommodules/${mId.value}/customdatacategories`,
        category
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['customModuleDataCategories', mId.value] 
      });
    }
  });
  
  const updateDataCategory = useMutation({
    mutationFn: async (category: any) => {
      const response = await churchtoolsClient.put(
        `/custommodules/${mId.value}/customdatacategories/${category.id}`,
        category
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['customModuleDataCategories', mId.value] 
      });
    }
  });
  
  const deleteDataCategory = useMutation({
    mutationFn: async (categoryId: number) => {
      await churchtoolsClient.delete(
        `/custommodules/${mId.value}/customdatacategories/${categoryId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['customModuleDataCategories', mId.value] 
      });
    }
  });
  
  return {
    createDataCategory: createDataCategory.mutateAsync,
    updateDataCategory: updateDataCategory.mutateAsync,
    deleteDataCategory: deleteDataCategory.mutateAsync
  };
}
```

**src/composables/useCustomModuleDataValuesQuery.ts:**
```typescript
import { useQuery } from '@tanstack/vue-query';
import { churchtoolsClient } from '@churchtools/churchtools-client';
import { computed, type MaybeRefOrGetter, toValue } from 'vue';

export function useCustomModuleDataValuesQuery<T = any>(
  moduleId: MaybeRefOrGetter<number>,
  categoryId: MaybeRefOrGetter<number>
) {
  const query = useQuery({
    queryKey: computed(() => [
      'customModuleDataValues', 
      toValue(moduleId), 
      toValue(categoryId)
    ]),
    queryFn: async () => {
      const response = await churchtoolsClient.get(
        `/custommodules/${toValue(moduleId)}/customdatacategories/${toValue(categoryId)}/customdatavalues`
      );
      return response.data as Array<{
        id: number;
        dataCategoryId: number;
        type: string;
        meta: T;
      }>;
    },
    enabled: computed(() => 
      toValue(moduleId) > 0 && toValue(categoryId) > 0
    )
  });
  
  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error
  };
}
```

**src/composables/useCustomModuleDataValuesMutations.ts:**
```typescript
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { churchtoolsClient } from '@churchtools/churchtools-client';
import { computed, type MaybeRefOrGetter, toValue } from 'vue';

export function useCustomModuleDataValuesMutations<T = any>(
  moduleId: MaybeRefOrGetter<number>,
  categoryId: MaybeRefOrGetter<number>
) {
  const queryClient = useQueryClient();
  const mId = computed(() => toValue(moduleId));
  const cId = computed(() => toValue(categoryId));
  
  const createCustomDataValue = useMutation({
    mutationFn: async (value: any) => {
      const response = await churchtoolsClient.post(
        `/custommodules/${mId.value}/customdatacategories/${cId.value}/customdatavalues`,
        value
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['customModuleDataValues', mId.value, cId.value] 
      });
    }
  });
  
  const updateCustomDataValue = useMutation({
    mutationFn: async (value: any) => {
      const response = await churchtoolsClient.put(
        `/custommodules/${mId.value}/customdatacategories/${cId.value}/customdatavalues/${value.id}`,
        value
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['customModuleDataValues', mId.value, cId.value] 
      });
    }
  });
  
  const deleteCustomDataValue = useMutation({
    mutationFn: async (payload: { id: number; dataCategoryId: number }) => {
      await churchtoolsClient.delete(
        `/custommodules/${mId.value}/customdatacategories/${payload.dataCategoryId}/customdatavalues/${payload.id}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['customModuleDataValues', mId.value, cId.value] 
      });
    }
  });
  
  return {
    createCustomDataValue: createCustomDataValue.mutateAsync,
    updateCustomDataValue: updateCustomDataValue.mutateAsync,
    deleteCustomDataValue: deleteCustomDataValue.mutateAsync
  };
}
```

**src/composables/useCurrentUser.ts:**
```typescript
import { useQuery } from '@tanstack/vue-query';
import { churchtoolsClient } from '@churchtools/churchtools-client';

export function useCurrentUser() {
  const { data } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await churchtoolsClient.get('/whoami');
      return response.data;
    },
    staleTime: Infinity // User ändert sich selten
  });
  
  return data.value || { id: 0, name: 'Unknown' };
}
```

#### TanStack Query Setup

**src/main.ts:**
```typescript
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20 * 1000,      // 20 Sekunden
      gcTime: 10 * 60 * 1000,    // 10 Minuten
      retry: 3,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

app.use(VueQueryPlugin, { queryClient });
```

#### Vergleich: Lokale Kopie vs. Eigene Implementierung

| Aspekt | Lokale Kopie (nicht committen) | Eigene Implementierung |
|--------|--------------------------------|------------------------|
| **Setup-Aufwand** | Mittel (einmalig bereitstellen) | Hoch (alles selbst schreiben) |
| **Wartung** | Niedrig (Updates kopieren) | Hoch (selbst pflegen) |
| **Kontrolle** | Mittel | Voll |
| **Features** | Alle aus @churchtools/utils | Nur was implementiert |
| **Bundle-Größe** | Größer | Kleiner (nur Benötigtes) |
| **Updates** | Einfach (neue Kopie) | Manuell |
| **Testing** | Bereits getestet | Selbst testen |
| **Git-Komplexität** | Hoch (.gitignore, Setup-Docs) | Niedrig (alles im Repo) |
| **CI/CD** | Komplex (Secrets/Artifacts) | Einfach |
| **Lizenz-Konformität** | ✅ Kein Commit | ✅ Eigener Code |

#### Empfehlung

**Für dieses Projekt: Lokale Kopie (nicht committen)**

Gründe:
- ✅ Bewährte Implementierung aus churchtools-extension-tasks
- ✅ Weniger Code zu schreiben und warten
- ✅ Konsistent mit anderen ChurchTools Extensions
- ✅ Einfache Updates bei Bugfixes
- ✅ Lizenz-konform (nicht veröffentlicht)

**Voraussetzungen:**
- Ona kann `churchtools-utils` beim Start bereitstellen
- Entwickler haben Zugriff auf `churchtools-utils` Quelle
- CI/CD hat Zugriff via Secret oder Artifact

**Eigene Implementierung nur wenn:**
- Lokale Kopie nicht praktikabel
- Bundle-Größe kritisch ist
- Volle Kontrolle erforderlich ist
- Keine Abhängigkeit von externem Code gewünscht

## Migration von V2 zu V3

```typescript
async function migrateV2ToV3() {
  // V2: Workflows sind Categories mit Sub-Categories für Executions
  // V3: Workflows sind Categories mit Values für Executions
  
  const v2Workflows = await getV2Workflows();
  
  for (const v2Workflow of v2Workflows) {
    // 1. Workflow-Category bleibt gleich, nur meta statt description
    await updateWorkflowCategory(v2Workflow.id, {
      meta: JSON.parse(v2Workflow.description)
    });
    
    // 2. Sub-Categories (Executions) zu Values migrieren
    const v2Executions = await getV2ExecutionCategories(v2Workflow.id);
    
    for (const v2Execution of v2Executions) {
      // Sub-Category Daten holen
      const v2Steps = await getV2ExecutionValues(v2Execution.id);
      const v2Meta = v2Steps.find(s => s.key === '_meta');
      
      // Als Value in Workflow-Category speichern
      await createCustomDataValue({
        dataCategoryId: v2Workflow.id,
        type: 'execution',
        meta: {
          ...JSON.parse(v2Execution.description),
          context: JSON.parse(v2Meta.value),
          steps: Object.fromEntries(
            v2Steps
              .filter(s => s.key.startsWith('step-'))
              .map(s => [s.key.replace('step-', ''), JSON.parse(s.value)])
          )
        }
      });
      
      // Sub-Category löschen
      await deleteDataCategory(v2Execution.id);
    }
  }
}
```

## Nächste Schritte

1. ✅ Konzept V3 dokumentiert
2. Entscheidung: @churchtools/utils nutzen oder eigene Composables?
3. Composables implementieren (useWorkflows, useExecutions, usePlugin)
4. Stores anpassen (workflow.ts, execution.ts)
5. UI-Komponenten anpassen
6. TanStack Query konfigurieren
7. Migration-Tool V2→V3 erstellen
8. Testing mit echter ChurchTools-Instanz

## Offene Fragen

1. **@churchtools/utils Verfügbarkeit:**
   - Ist das Package auf npm verfügbar?
   - Wenn nein: Eigene Implementierung oder lokale Kopie?

2. **TanStack Query Setup:**
   - Welche Cache-Strategie?
   - Welche staleTime/gcTime?

3. **Permissions:**
   - Reichen securityLevelIds oder brauchen wir granularere Permissions?
   - Wie werden Workflow-spezifische Permissions gehandelt?

4. **Migration:**
   - Automatische Migration oder manueller Prozess?
   - Wie mit laufenden Executions umgehen?
