# Persistierung-Konzept mit ChurchTools Custom Module API

## Übersicht

Die Persistierung nutzt die ChurchTools Custom Module API als Key-Value Store. Für die Entwicklung wird localStorage als Fallback verwendet.

## ChurchTools API Struktur

### Hierarchie

```
CustomModule (Extension)
└── CustomDataCategory (Daten-Kategorie)
    └── CustomDataValue (Key-Value Paar)
```

### Verfügbare Endpoints

```
GET    /custommodules
GET    /custommodules/{extensionkey}
GET    /custommodules/{moduleId}

GET    /custommodules/{moduleId}/customdatacategories
POST   /custommodules/{moduleId}/customdatacategories
PUT    /custommodules/{moduleId}/customdatacategories/{dataCategoryId}
DELETE /custommodules/{moduleId}/customdatacategories/{dataCategoryId}

GET    /custommodules/{moduleId}/customdatacategories/{dataCategoryId}/customdatavalues
POST   /custommodules/{moduleId}/customdatacategories/{dataCategoryId}/customdatavalues
PUT    /custommodules/{moduleId}/customdatacategories/{dataCategoryId}/customdatavalues/{valueId}
DELETE /custommodules/{moduleId}/customdatacategories/{dataCategoryId}/customdatavalues/{valueId}
```

## Datenstruktur

### Kategorien (CustomDataCategories)

Wir verwenden folgende Kategorien für die Organisation:

```typescript
enum DataCategory {
  WORKFLOWS = 'workflows',           // Workflow-Definitionen
  EXECUTIONS = 'executions',         // Workflow-Ausführungen
  PERMISSIONS = 'permissions',       // Berechtigungen
  SETTINGS = 'settings',             // Globale Einstellungen
}
```

### Daten-Mapping

#### 1. Workflows

**Kategorie:** `workflows`

**Struktur:**
```typescript
// Key: workflow.id
// Value: Workflow (JSON serialisiert)
{
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: Date;
  updatedAt: Date;
}
```

**Beispiel CustomDataValue:**
```json
{
  "valueId": "123",
  "key": "wf-1234567890",
  "value": "{\"id\":\"wf-1234567890\",\"name\":\"Mitgliederaufnahme\",\"description\":\"...\",\"nodes\":[...],\"edges\":[...]}",
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

#### 2. Executions

**Kategorie:** `executions`

**Struktur:**
```typescript
// Key: execution.id
// Value: WorkflowExecution (JSON serialisiert)
{
  id: string;
  workflowId: string;
  userId: string;
  currentNodeId: string;
  context: ExecutionContext;
  history: StepHistory[];
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
}
```

**Hinweis:** Abgeschlossene Executions können nach einer gewissen Zeit archiviert/gelöscht werden.

#### 3. Permissions

**Kategorie:** `permissions`

**Struktur:**
```typescript
// Key: `${workflowId}:${userId}`
// Value: WorkflowPermission (JSON serialisiert)
{
  workflowId: string;
  userId: string;
  canExecute: boolean;
  canView: boolean;
}
```

**Beispiel Key:** `wf-1234567890:user-123`

#### 4. Settings

**Kategorie:** `settings`

**Struktur:**
```typescript
// Key: setting name
// Value: setting value (JSON serialisiert)
{
  key: string;
  value: any;
}
```

**Beispiele:**
- `default_workflow_timeout`: `30000`
- `max_concurrent_executions`: `10`
- `enable_workflow_versioning`: `true`

## Storage Service Interface

### Abstrakte Storage-Schnittstelle

```typescript
interface StorageService {
  // Workflows
  getWorkflows(): Promise<Workflow[]>;
  getWorkflow(id: string): Promise<Workflow | null>;
  saveWorkflow(workflow: Workflow): Promise<void>;
  deleteWorkflow(id: string): Promise<void>;

  // Executions
  getExecutions(userId?: string): Promise<WorkflowExecution[]>;
  getExecution(id: string): Promise<WorkflowExecution | null>;
  saveExecution(execution: WorkflowExecution): Promise<void>;
  deleteExecution(id: string): Promise<void>;

  // Permissions
  getPermissions(workflowId?: string, userId?: string): Promise<WorkflowPermission[]>;
  savePermission(permission: WorkflowPermission): Promise<void>;
  deletePermission(workflowId: string, userId: string): Promise<void>;

  // Settings
  getSetting(key: string): Promise<any>;
  saveSetting(key: string, value: any): Promise<void>;
}
```

## Implementierungen

### 1. LocalStorageService (Development)

```typescript
class LocalStorageService implements StorageService {
  private prefix = 'ct-workflow-';

  async getWorkflows(): Promise<Workflow[]> {
    const data = localStorage.getItem(`${this.prefix}workflows`);
    return data ? JSON.parse(data) : [];
  }

  async saveWorkflow(workflow: Workflow): Promise<void> {
    const workflows = await this.getWorkflows();
    const index = workflows.findIndex(w => w.id === workflow.id);
    
    if (index > -1) {
      workflows[index] = workflow;
    } else {
      workflows.push(workflow);
    }
    
    localStorage.setItem(`${this.prefix}workflows`, JSON.stringify(workflows));
  }

  // ... weitere Methoden
}
```

### 2. ChurchToolsStorageService (Production)

```typescript
class ChurchToolsStorageService implements StorageService {
  private moduleId: string;
  private categories: Map<DataCategory, string> = new Map();

  constructor(private api: ChurchToolsApiClient) {
    this.moduleId = import.meta.env.VITE_KEY;
  }

  async initialize(): Promise<void> {
    // Kategorien erstellen falls nicht vorhanden
    await this.ensureCategories();
  }

  private async ensureCategories(): Promise<void> {
    const categories = await this.api.get(
      `/custommodules/${this.moduleId}/customdatacategories`
    );

    for (const cat of Object.values(DataCategory)) {
      let category = categories.find(c => c.name === cat);
      
      if (!category) {
        category = await this.api.post(
          `/custommodules/${this.moduleId}/customdatacategories`,
          { name: cat, description: `Storage for ${cat}` }
        );
      }
      
      this.categories.set(cat, category.id);
    }
  }

  async getWorkflows(): Promise<Workflow[]> {
    const categoryId = this.categories.get(DataCategory.WORKFLOWS);
    const values = await this.api.get(
      `/custommodules/${this.moduleId}/customdatacategories/${categoryId}/customdatavalues`
    );

    return values.map(v => JSON.parse(v.value));
  }

  async saveWorkflow(workflow: Workflow): Promise<void> {
    const categoryId = this.categories.get(DataCategory.WORKFLOWS);
    const key = workflow.id;
    const value = JSON.stringify(workflow);

    // Prüfen ob bereits vorhanden
    const existing = await this.findValue(categoryId, key);

    if (existing) {
      // Update
      await this.api.put(
        `/custommodules/${this.moduleId}/customdatacategories/${categoryId}/customdatavalues/${existing.id}`,
        { key, value }
      );
    } else {
      // Create
      await this.api.post(
        `/custommodules/${this.moduleId}/customdatacategories/${categoryId}/customdatavalues`,
        { key, value }
      );
    }
  }

  private async findValue(categoryId: string, key: string): Promise<any> {
    const values = await this.api.get(
      `/custommodules/${this.moduleId}/customdatacategories/${categoryId}/customdatavalues`
    );
    return values.find(v => v.key === key);
  }

  // ... weitere Methoden
}
```

## Storage Factory

```typescript
class StorageFactory {
  static create(): StorageService {
    const useChurchTools = import.meta.env.VITE_USE_CHURCHTOOLS_STORAGE === 'true';
    
    if (useChurchTools) {
      const api = new ChurchToolsApiClient();
      return new ChurchToolsStorageService(api);
    }
    
    return new LocalStorageService();
  }
}

// Usage
const storage = StorageFactory.create();
await storage.initialize();
```

## Migration von localStorage zu ChurchTools

### Migrations-Script

```typescript
async function migrateToChurchTools() {
  const localStorage = new LocalStorageService();
  const churchtools = new ChurchToolsStorageService(api);
  
  await churchtools.initialize();

  // Workflows migrieren
  const workflows = await localStorage.getWorkflows();
  for (const workflow of workflows) {
    await churchtools.saveWorkflow(workflow);
  }

  // Executions migrieren
  const executions = await localStorage.getExecutions();
  for (const execution of executions) {
    await churchtools.saveExecution(execution);
  }

  // Permissions migrieren
  const permissions = await localStorage.getPermissions();
  for (const permission of permissions) {
    await churchtools.savePermission(permission);
  }

  console.info('Migration completed successfully');
}
```

## Caching-Strategie

### In-Memory Cache

```typescript
class CachedStorageService implements StorageService {
  private cache: Map<string, any> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 Minuten

  constructor(private storage: StorageService) {}

  async getWorkflows(): Promise<Workflow[]> {
    const cacheKey = 'workflows';
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    const data = await this.storage.getWorkflows();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }

  async saveWorkflow(workflow: Workflow): Promise<void> {
    await this.storage.saveWorkflow(workflow);
    this.invalidateCache('workflows');
  }

  private invalidateCache(key: string): void {
    this.cache.delete(key);
  }
}
```

## Performance-Optimierungen

### 1. Batch Operations

```typescript
interface BatchOperation {
  type: 'create' | 'update' | 'delete';
  category: DataCategory;
  key: string;
  value?: any;
}

class BatchStorageService {
  private queue: BatchOperation[] = [];
  private flushInterval = 5000; // 5 Sekunden

  constructor(private storage: ChurchToolsStorageService) {
    this.startAutoFlush();
  }

  async saveWorkflow(workflow: Workflow): Promise<void> {
    this.queue.push({
      type: 'update',
      category: DataCategory.WORKFLOWS,
      key: workflow.id,
      value: workflow,
    });
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    // Gruppiere nach Kategorie
    const grouped = this.groupByCategory(this.queue);

    for (const [category, operations] of grouped) {
      await this.processBatch(category, operations);
    }

    this.queue = [];
  }

  private startAutoFlush(): void {
    setInterval(() => this.flush(), this.flushInterval);
  }
}
```

### 2. Lazy Loading

```typescript
class LazyStorageService {
  private loaded: Set<string> = new Set();

  async getWorkflow(id: string): Promise<Workflow | null> {
    if (!this.loaded.has(id)) {
      const workflow = await this.storage.getWorkflow(id);
      if (workflow) {
        this.cache.set(id, workflow);
        this.loaded.add(id);
      }
      return workflow;
    }

    return this.cache.get(id);
  }
}
```

## Error Handling

```typescript
class ResilientStorageService implements StorageService {
  constructor(
    private primary: StorageService,
    private fallback: StorageService
  ) {}

  async getWorkflows(): Promise<Workflow[]> {
    try {
      return await this.primary.getWorkflows();
    } catch (error) {
      console.error('Primary storage failed, using fallback:', error);
      return await this.fallback.getWorkflows();
    }
  }

  async saveWorkflow(workflow: Workflow): Promise<void> {
    try {
      await this.primary.saveWorkflow(workflow);
    } catch (error) {
      console.error('Primary storage failed, using fallback:', error);
      await this.fallback.saveWorkflow(workflow);
      
      // Queue für spätere Synchronisation
      this.queueSync('workflow', workflow);
    }
  }

  private queueSync(type: string, data: any): void {
    // Speichere in Queue für spätere Synchronisation
    const queue = JSON.parse(localStorage.getItem('sync-queue') || '[]');
    queue.push({ type, data, timestamp: Date.now() });
    localStorage.setItem('sync-queue', JSON.stringify(queue));
  }
}
```

## Berechtigungen

### ChurchTools Permissions

Die ChurchTools API unterstützt Berechtigungen pro Route. Wir nutzen dies für:

```typescript
// Admin-Routen (nur für Admins)
POST   /custommodules/{moduleId}/customdatacategories
DELETE /custommodules/{moduleId}/customdatacategories/{dataCategoryId}

// Workflow-Management (Admins + Workflow-Ersteller)
POST   /custommodules/{moduleId}/customdatacategories/{workflows}/customdatavalues
PUT    /custommodules/{moduleId}/customdatacategories/{workflows}/customdatavalues/{valueId}
DELETE /custommodules/{moduleId}/customdatacategories/{workflows}/customdatavalues/{valueId}

// Workflow-Ausführung (Berechtigte Benutzer)
GET    /custommodules/{moduleId}/customdatacategories/{workflows}/customdatavalues
POST   /custommodules/{moduleId}/customdatacategories/{executions}/customdatavalues
PUT    /custommodules/{moduleId}/customdatacategories/{executions}/customdatavalues/{valueId}
```

## Umgebungsvariablen

```env
# .env
VITE_KEY=workflow
VITE_USE_CHURCHTOOLS_STORAGE=false  # true für Production
VITE_STORAGE_CACHE_TTL=300000       # 5 Minuten
VITE_STORAGE_BATCH_INTERVAL=5000    # 5 Sekunden
```

## Implementierungs-Reihenfolge

1. ✅ **Phase 1:** LocalStorageService (aktuell)
2. **Phase 2:** StorageService Interface definieren
3. **Phase 3:** ChurchToolsStorageService implementieren
4. **Phase 4:** StorageFactory mit Umschaltung
5. **Phase 5:** Caching-Layer hinzufügen
6. **Phase 6:** Batch-Operations implementieren
7. **Phase 7:** Migration-Tool erstellen

## Testing

### Mock Storage für Tests

```typescript
class MockStorageService implements StorageService {
  private data: Map<string, any> = new Map();

  async getWorkflows(): Promise<Workflow[]> {
    return Array.from(this.data.values())
      .filter(item => item.type === 'workflow');
  }

  async saveWorkflow(workflow: Workflow): Promise<void> {
    this.data.set(workflow.id, { type: 'workflow', data: workflow });
  }

  clear(): void {
    this.data.clear();
  }
}
```

## Vorteile dieser Architektur

1. **Abstraktion:** Stores kennen nur das StorageService Interface
2. **Flexibilität:** Einfacher Wechsel zwischen localStorage und ChurchTools
3. **Testbarkeit:** Mock-Implementation für Tests
4. **Performance:** Caching und Batch-Operations
5. **Resilience:** Fallback auf localStorage bei API-Fehlern
6. **Migration:** Schrittweise Migration möglich
