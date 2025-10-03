# Persistierung-Konzept V2 mit ChurchTools Custom Module API

## Kernidee

**1 Workflow = 1 CustomDataCategory**

Dies ermöglicht:
- ✅ Nutzung des ChurchTools Berechtigungssystems pro Workflow
- ✅ Workflow-Definition in der Kategorie selbst
- ✅ Jede Execution als eigene Sub-Kategorie
- ✅ Benutzer sieht alle seine Executions pro Workflow
- ✅ Executions können pausiert und fortgesetzt werden

## Datenstruktur

### Hierarchie

```
CustomModule (workflow-assistant)
├── CustomDataCategory (Workflow: "Mitgliederaufnahme")
│   ├── Metadata (in category.description als JSON)
│   │   ├── workflow definition (nodes, edges)
│   │   ├── created/updated timestamps
│   │   └── creator info
│   │
│   └── CustomDataCategory (Execution: "exec-2025-01-15-10-30")
│       ├── CustomDataValue (step-1 → {inputs, outputs, timestamp})
│       ├── CustomDataValue (step-2 → {inputs, outputs, timestamp})
│       ├── CustomDataValue (step-3 → {inputs, outputs, timestamp})
│       └── CustomDataValue (_meta → {status, currentNode, context})
│
├── CustomDataCategory (Workflow: "Event-Planung")
│   ├── Metadata (workflow definition)
│   └── CustomDataCategory (Execution: "exec-2025-01-16-14-00")
│       └── ...
│
└── CustomDataCategory (_settings)
    └── CustomDataValue (global settings)
```

## Workflow-Definition

### In CustomDataCategory

Die Workflow-Definition wird in der `description` der Kategorie als JSON gespeichert:

```typescript
interface WorkflowCategory {
  id: string;                    // ChurchTools category ID
  name: string;                  // "Mitgliederaufnahme"
  description: string;           // JSON mit Workflow-Definition
  permissions: Permission[];     // ChurchTools Berechtigungen
}

// description enthält:
interface WorkflowDefinition {
  version: string;               // "1.0.0"
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    description: string;         // Benutzerfreundliche Beschreibung
  };
}
```

**Beispiel:**
```json
{
  "version": "1.0.0",
  "nodes": [
    {
      "id": "start-1",
      "type": "start",
      "label": "Start",
      "position": {"x": 100, "y": 200},
      "data": {}
    },
    {
      "id": "task-1",
      "type": "task",
      "label": "Persönliche Daten",
      "position": {"x": 300, "y": 200},
      "data": {
        "fields": [
          {"name": "firstName", "label": "Vorname", "type": "text", "required": true},
          {"name": "lastName", "label": "Nachname", "type": "text", "required": true}
        ]
      }
    }
  ],
  "edges": [
    {"id": "edge-1", "source": "start-1", "target": "task-1"}
  ],
  "metadata": {
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z",
    "createdBy": "user-123",
    "description": "Workflow für die Aufnahme neuer Mitglieder"
  }
}
```

## Workflow-Execution

### Sub-Kategorie pro Execution

Jede Workflow-Ausführung bekommt eine eigene Sub-Kategorie:

```typescript
interface ExecutionCategory {
  id: string;                    // ChurchTools category ID
  name: string;                  // "exec-2025-01-15-10-30-user123"
  parentId: string;              // Workflow category ID
  description: string;           // Execution metadata als JSON
}

// description enthält:
interface ExecutionMetadata {
  executionId: string;
  userId: string;
  userName: string;
  status: ExecutionStatus;       // running, completed, failed, paused
  currentNodeId: string;
  startedAt: string;
  completedAt?: string;
  pausedAt?: string;
}
```

### CustomDataValues pro Schritt

Jeder Workflow-Schritt wird als CustomDataValue gespeichert:

```typescript
// Key: step-{nodeId}
// Value: StepData (JSON)
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

**Spezial-Value: `_meta`**
```typescript
// Key: _meta
// Value: ExecutionContext (JSON)
interface ExecutionContext {
  variables: Record<string, any>;  // Alle gesammelten Daten
  currentNodeId: string;
  status: ExecutionStatus;
  history: string[];               // Array von step keys
}
```

## API-Operationen

### Workflow-Management (Admin)

#### Workflow erstellen
```typescript
// POST /custommodules/{moduleId}/customdatacategories
{
  name: "Mitgliederaufnahme",
  description: JSON.stringify(workflowDefinition),
  permissions: [
    { userId: "admin-1", canView: true, canEdit: true },
    { groupId: "group-mitarbeiter", canView: true, canEdit: false }
  ]
}
```

#### Workflow aktualisieren
```typescript
// PUT /custommodules/{moduleId}/customdatacategories/{workflowId}
{
  description: JSON.stringify(updatedWorkflowDefinition)
}
```

#### Workflow löschen
```typescript
// DELETE /custommodules/{moduleId}/customdatacategories/{workflowId}
// Löscht automatisch alle Sub-Kategorien (Executions)
```

#### Workflows abrufen
```typescript
// GET /custommodules/{moduleId}/customdatacategories
// Gibt nur Workflows zurück, für die der Benutzer Berechtigung hat
const workflows = categories
  .filter(c => !c.parentId)  // Nur Top-Level Kategorien
  .map(c => ({
    id: c.id,
    name: c.name,
    definition: JSON.parse(c.description),
    permissions: c.permissions
  }));
```

### Workflow-Ausführung (Benutzer)

#### Execution starten
```typescript
// 1. Sub-Kategorie erstellen
// POST /custommodules/{moduleId}/customdatacategories
{
  name: `exec-${Date.now()}-${userId}`,
  parentId: workflowId,
  description: JSON.stringify(executionMetadata),
  permissions: [
    { userId: currentUserId, canView: true, canEdit: true }
  ]
}

// 2. _meta Value erstellen
// POST /custommodules/{moduleId}/customdatacategories/{executionId}/customdatavalues
{
  key: "_meta",
  value: JSON.stringify(initialContext)
}
```

#### Schritt speichern
```typescript
// POST /custommodules/{moduleId}/customdatacategories/{executionId}/customdatavalues
{
  key: `step-${nodeId}`,
  value: JSON.stringify(stepData)
}

// _meta aktualisieren
// PUT /custommodules/{moduleId}/customdatacategories/{executionId}/customdatavalues/{metaValueId}
{
  key: "_meta",
  value: JSON.stringify(updatedContext)
}
```

#### Execution fortsetzen
```typescript
// 1. Execution-Kategorie abrufen
// GET /custommodules/{moduleId}/customdatacategories/{executionId}

// 2. _meta abrufen
// GET /custommodules/{moduleId}/customdatacategories/{executionId}/customdatavalues
const metaValue = values.find(v => v.key === "_meta");
const context = JSON.parse(metaValue.value);

// 3. Alle Schritte abrufen
const steps = values
  .filter(v => v.key.startsWith("step-"))
  .map(v => JSON.parse(v.value));

// 4. Workflow an currentNodeId fortsetzen
```

#### Executions eines Workflows anzeigen
```typescript
// GET /custommodules/{moduleId}/customdatacategories
const executions = categories
  .filter(c => c.parentId === workflowId)
  .map(c => ({
    id: c.id,
    name: c.name,
    metadata: JSON.parse(c.description)
  }));
```

#### Executions eines Benutzers anzeigen
```typescript
// GET /custommodules/{moduleId}/customdatacategories
const userExecutions = categories
  .filter(c => c.parentId && c.permissions.some(p => p.userId === currentUserId))
  .map(c => ({
    id: c.id,
    workflowId: c.parentId,
    workflowName: categories.find(cat => cat.id === c.parentId)?.name,
    metadata: JSON.parse(c.description)
  }));
```

## Berechtigungen

### ChurchTools Permissions nutzen

Jede Kategorie (Workflow und Execution) hat eigene Berechtigungen:

```typescript
interface Permission {
  userId?: string;
  groupId?: string;
  canView: boolean;
  canEdit: boolean;
  canDelete?: boolean;
}
```

### Berechtigungs-Szenarien

#### 1. Workflow-Berechtigung (Admin)
```typescript
// Workflow erstellen - nur Admins
POST /custommodules/{moduleId}/customdatacategories
Permissions: Admin-Gruppe

// Workflow bearbeiten - nur Admins
PUT /custommodules/{moduleId}/customdatacategories/{workflowId}
Permissions: Admin-Gruppe
```

#### 2. Workflow-Ausführung (Benutzer)
```typescript
// Workflow anzeigen - alle berechtigten Benutzer
GET /custommodules/{moduleId}/customdatacategories/{workflowId}
Permissions: Benutzer-Gruppe oder spezifische User

// Execution erstellen - alle berechtigten Benutzer
POST /custommodules/{moduleId}/customdatacategories (mit parentId)
Permissions: Automatisch vom Parent geerbt + eigener User
```

#### 3. Execution-Berechtigung (Owner)
```typescript
// Execution bearbeiten - nur Owner
PUT /custommodules/{moduleId}/customdatacategories/{executionId}/customdatavalues/{valueId}
Permissions: Nur der User der die Execution gestartet hat

// Execution anzeigen - Owner + Admins
GET /custommodules/{moduleId}/customdatacategories/{executionId}
Permissions: Owner + Admin-Gruppe
```

## UI-Anpassungen

### Admin-Bereich

**Workflow-Liste:**
```typescript
// Zeigt alle Workflows (Admin sieht alle)
const workflows = await getWorkflows();

// Pro Workflow: Anzahl aktiver Executions
const activeExecutions = await getExecutions(workflow.id, { status: 'running' });
```

**Workflow-Details:**
```typescript
// Workflow-Definition bearbeiten
// Alle Executions anzeigen (Admin sieht alle)
const allExecutions = await getExecutions(workflow.id);
```

### Benutzer-Bereich

**Workflow-Auswahl:**
```typescript
// Zeigt nur Workflows mit Berechtigung
const availableWorkflows = await getWorkflows();
// ChurchTools API gibt automatisch nur erlaubte zurück
```

**Meine Executions:**
```typescript
// Zeigt alle Executions des Benutzers (über alle Workflows)
const myExecutions = await getUserExecutions(currentUserId);

// Gruppiert nach Workflow
const grouped = groupBy(myExecutions, 'workflowId');
```

**Execution-Liste pro Workflow:**
```typescript
// Zeigt alle Executions des Benutzers für diesen Workflow
const executions = await getExecutions(workflowId, { userId: currentUserId });

// Mit Status-Badges
executions.map(e => ({
  ...e,
  statusBadge: getStatusBadge(e.metadata.status),
  canResume: e.metadata.status === 'paused' || e.metadata.status === 'running'
}));
```

## Datenmodell-Anpassungen

### Workflow Type

```typescript
interface Workflow {
  id: string;                    // ChurchTools category ID
  name: string;
  definition: WorkflowDefinition;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  
  // Statistiken (optional)
  stats?: {
    totalExecutions: number;
    activeExecutions: number;
    completedExecutions: number;
    failedExecutions: number;
  };
}
```

### Execution Type

```typescript
interface WorkflowExecution {
  id: string;                    // ChurchTools sub-category ID
  workflowId: string;            // Parent category ID
  workflowName: string;
  userId: string;
  userName: string;
  status: ExecutionStatus;
  currentNodeId: string;
  context: ExecutionContext;
  steps: StepData[];
  startedAt: Date;
  completedAt?: Date;
  pausedAt?: Date;
  
  // UI helpers
  canResume: boolean;
  canDelete: boolean;
  progress: number;              // 0-100%
}
```

## Storage Service Anpassungen

```typescript
interface StorageService {
  // Workflows
  getWorkflows(): Promise<Workflow[]>;
  getWorkflow(id: string): Promise<Workflow | null>;
  createWorkflow(name: string, definition: WorkflowDefinition): Promise<Workflow>;
  updateWorkflow(id: string, definition: WorkflowDefinition): Promise<void>;
  deleteWorkflow(id: string): Promise<void>;
  
  // Executions
  getExecutions(workflowId: string, filter?: ExecutionFilter): Promise<WorkflowExecution[]>;
  getUserExecutions(userId: string): Promise<WorkflowExecution[]>;
  getExecution(executionId: string): Promise<WorkflowExecution | null>;
  createExecution(workflowId: string, userId: string): Promise<WorkflowExecution>;
  updateExecution(executionId: string, context: ExecutionContext): Promise<void>;
  saveStep(executionId: string, step: StepData): Promise<void>;
  deleteExecution(executionId: string): Promise<void>;
  
  // Permissions (über ChurchTools API)
  grantWorkflowAccess(workflowId: string, userId: string): Promise<void>;
  revokeWorkflowAccess(workflowId: string, userId: string): Promise<void>;
}

interface ExecutionFilter {
  userId?: string;
  status?: ExecutionStatus;
  dateFrom?: Date;
  dateTo?: Date;
}
```

## Vorteile dieser Architektur

### 1. Native ChurchTools Integration
- ✅ Berechtigungen werden von ChurchTools verwaltet
- ✅ Keine separate Permission-Tabelle nötig
- ✅ Gruppen-Berechtigungen möglich
- ✅ Audit-Log durch ChurchTools

### 2. Skalierbarkeit
- ✅ Jede Execution isoliert in eigener Kategorie
- ✅ Keine großen JSON-Blobs
- ✅ Schritte können einzeln geladen werden
- ✅ Alte Executions können archiviert werden

### 3. Benutzerfreundlichkeit
- ✅ Benutzer sieht alle seine Executions
- ✅ Executions können pausiert und fortgesetzt werden
- ✅ Historie pro Execution vollständig
- ✅ Fortschritt sichtbar

### 4. Admin-Funktionen
- ✅ Übersicht über alle Executions
- ✅ Monitoring möglich
- ✅ Fehlerhafte Executions identifizieren
- ✅ Statistiken pro Workflow

### 5. Performance
- ✅ Lazy Loading von Executions
- ✅ Nur benötigte Schritte laden
- ✅ Caching möglich
- ✅ Keine großen Datenmengen auf einmal

## Migration von V1 zu V2

```typescript
async function migrateToV2() {
  // 1. Workflows migrieren
  const oldWorkflows = await localStorageService.getWorkflows();
  
  for (const workflow of oldWorkflows) {
    // Kategorie erstellen
    const category = await createWorkflowCategory(workflow);
    
    // Permissions migrieren
    const permissions = await localStorageService.getPermissions(workflow.id);
    for (const perm of permissions) {
      await grantWorkflowAccess(category.id, perm.userId);
    }
  }
  
  // 2. Executions migrieren
  const oldExecutions = await localStorageService.getExecutions();
  
  for (const execution of oldExecutions) {
    // Sub-Kategorie erstellen
    const execCategory = await createExecutionCategory(execution);
    
    // Schritte migrieren
    for (const step of execution.history) {
      await saveStep(execCategory.id, step);
    }
    
    // Context migrieren
    await saveExecutionMeta(execCategory.id, execution.context);
  }
}
```

## Nächste Schritte

1. ✅ Konzept dokumentiert
2. Storage Service Interface anpassen
3. ChurchToolsStorageService V2 implementieren
4. UI für Execution-Liste erweitern
5. Execution-Fortsetzen Feature implementieren
6. Migration-Tool erstellen
7. Testing mit echter ChurchTools-Instanz
