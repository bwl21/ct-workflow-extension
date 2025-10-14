# Technische Spezifikation - Workflow-Assistent

## 1. Technologie-Stack

### Frontend
- **Framework:** Vue 3 (Composition API)
- **Sprache:** TypeScript
- **State Management:** Pinia
- **Routing:** Vue Router
- **Build Tool:** Vite
- **UI-Bibliotheken:**
  - Vue Flow / @vue-flow/core (Workflow-Diagramme)
  - VueUse (Utility Composables)
  - Vuelidate (Formular-Validierung)
- **HTTP Client:** Axios
- **Styling:** ChurchTools Design System + Custom CSS

### Backend (Optional - kann auch ChurchTools API erweitern)
- **Runtime:** Node.js
- **Framework:** Express.js
- **Sprache:** TypeScript
- **Validierung:** Zod / Joi
- **ORM:** Prisma / TypeORM
- **Datenbank:** PostgreSQL / MySQL (ChurchTools DB)

### Development Tools
- **Linting:** ESLint
- **Formatting:** Prettier
- **Testing:** Vitest + Vue Test Utils
- **E2E Testing:** Playwright (optional)

## 2. Projektstruktur

```
ct-workflow-extension/
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── WorkflowEditor.vue
│   │   │   ├── WorkflowManager.vue
│   │   │   ├── NodeEditor.vue
│   │   │   └── NodePalette.vue
│   │   ├── execution/
│   │   │   ├── WorkflowExecutor.vue
│   │   │   ├── StepWorkspace.vue
│   │   │   ├── WorkflowHistory.vue
│   │   │   └── ExecutionControls.vue
│   │   ├── shared/
│   │   │   ├── WorkflowDiagram.vue
│   │   │   ├── NodeRenderer.vue
│   │   │   ├── FormBuilder.vue
│   │   │   └── StatusIndicator.vue
│   │   └── ui/
│   │       ├── Button.vue
│   │       ├── Card.vue
│   │       ├── Modal.vue
│   │       └── Alert.vue
│   ├── composables/
│   │   ├── useWorkflow.ts
│   │   ├── useExecution.ts
│   │   ├── useValidation.ts
│   │   └── useIntegration.ts
│   ├── stores/
│   │   ├── workflow.ts
│   │   ├── execution.ts
│   │   ├── user.ts
│   │   └── integration.ts
│   ├── services/
│   │   ├── api/
│   │   │   ├── workflow.service.ts
│   │   │   ├── execution.service.ts
│   │   │   └── integration.service.ts
│   │   ├── engine/
│   │   │   ├── WorkflowEngine.ts
│   │   │   ├── StepProcessor.ts
│   │   │   ├── ConditionEvaluator.ts
│   │   │   └── ActionExecutor.ts
│   │   └── validation/
│   │       ├── WorkflowValidator.ts
│   │       └── InputValidator.ts
│   ├── types/
│   │   ├── workflow.types.ts
│   │   ├── execution.types.ts
│   │   ├── node.types.ts
│   │   └── api.types.ts
│   ├── utils/
│   │   ├── helpers.ts
│   │   ├── constants.ts
│   │   └── formatters.ts
│   ├── router.ts
│   ├── App.vue
│   └── main.ts
├── backend/ (optional)
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── routes/
│   └── prisma/
│       └── schema.prisma
├── docs/
│   ├── konzept.md
│   ├── diagramme.md
│   ├── technische-spezifikation.md
│   └── api-dokumentation.md
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── package.json
```

## 3. Datenstrukturen

### TypeScript Interfaces

```typescript
// workflow.types.ts

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  permissions: Permission[];
  status: WorkflowStatus;
  version: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  description: string;
  position: Position;
  config: NodeConfig;
  actions: ActionConfig[];
  style?: NodeStyle;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  condition?: Condition;
  label?: string;
  style?: EdgeStyle;
}

export interface NodeConfig {
  fields: FormField[];
  validations: ValidationRule[];
  defaultValues?: Record<string, any>;
  helpText?: string;
  allowBack?: boolean;
  allowSkip?: boolean;
}

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: SelectOption[];
  validation?: ValidationRule[];
  dependsOn?: string;
  conditional?: Condition;
}

export interface ActionConfig {
  id: string;
  type: ActionType;
  name: string;
  config: ActionConfigData;
  onSuccess?: string; // Next node ID
  onError?: string; // Error handler node ID
  retryPolicy?: RetryPolicy;
}

export interface ActionConfigData {
  endpoint?: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  responseMapping?: ResponseMapping;
  timeout?: number;
}

export interface Condition {
  field: string;
  operator: ConditionOperator;
  value: any;
  logic?: 'AND' | 'OR';
  conditions?: Condition[];
}

export interface ValidationRule {
  type: ValidationType;
  value?: any;
  message: string;
}

// execution.types.ts

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowVersion: number;
  userId: string;
  currentNodeId: string;
  context: ExecutionContext;
  history: StepHistory[];
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  pausedAt?: Date;
  error?: ExecutionError;
}

export interface ExecutionContext {
  variables: Record<string, any>;
  userId: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface StepHistory {
  id: string;
  nodeId: string;
  nodeName: string;
  timestamp: Date;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  status: StepStatus;
  duration: number;
  error?: string;
  actionResults?: ActionResult[];
}

export interface ActionResult {
  actionId: string;
  actionName: string;
  status: 'success' | 'error';
  response?: any;
  error?: string;
  duration: number;
}

// Enums

export enum NodeType {
  START = 'start',
  TASK = 'task',
  DECISION = 'decision',
  ACTION = 'action',
  END = 'end',
  PARALLEL = 'parallel',
  MERGE = 'merge'
}

export enum ActionType {
  REST_API = 'rest_api',
  WEBHOOK = 'webhook',
  EMAIL = 'email',
  CHURCHTOOLS_API = 'churchtools_api',
  CUSTOM_SCRIPT = 'custom_script'
}

export enum ExecutionStatus {
  CREATED = 'created',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum StepStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  SKIPPED = 'skipped'
}

export enum FieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  EMAIL = 'email',
  DATE = 'date',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  FILE = 'file'
}

export enum ValidationType {
  REQUIRED = 'required',
  MIN_LENGTH = 'minLength',
  MAX_LENGTH = 'maxLength',
  MIN = 'min',
  MAX = 'max',
  PATTERN = 'pattern',
  EMAIL = 'email',
  URL = 'url',
  CUSTOM = 'custom'
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'notContains',
  IN = 'in',
  NOT_IN = 'notIn',
  IS_EMPTY = 'isEmpty',
  IS_NOT_EMPTY = 'isNotEmpty'
}
```

## 4. API-Spezifikation

### REST Endpoints

#### Workflow Management

```
GET    /api/workflows
GET    /api/workflows/:id
POST   /api/workflows
PUT    /api/workflows/:id
DELETE /api/workflows/:id
POST   /api/workflows/:id/publish
POST   /api/workflows/:id/duplicate
GET    /api/workflows/:id/versions
```

#### Workflow Execution

```
POST   /api/workflows/:id/execute
GET    /api/executions/:id
POST   /api/executions/:id/step
POST   /api/executions/:id/pause
POST   /api/executions/:id/resume
POST   /api/executions/:id/cancel
GET    /api/executions/:id/history
GET    /api/executions/user/:userId
```

#### Integration

```
POST   /api/integrations/test
GET    /api/integrations/churchtools/persons
GET    /api/integrations/churchtools/groups
POST   /api/integrations/email/send
POST   /api/integrations/webhook/trigger
```

### Request/Response Beispiele

#### POST /api/workflows

**Request:**
```json
{
  "name": "Mitgliederaufnahme",
  "description": "Workflow für neue Mitglieder",
  "nodes": [
    {
      "id": "start-1",
      "type": "start",
      "label": "Start",
      "position": { "x": 100, "y": 100 },
      "config": {
        "fields": [],
        "validations": []
      },
      "actions": []
    },
    {
      "id": "task-1",
      "type": "task",
      "label": "Persönliche Daten",
      "position": { "x": 300, "y": 100 },
      "config": {
        "fields": [
          {
            "name": "firstName",
            "label": "Vorname",
            "type": "text",
            "required": true
          },
          {
            "name": "lastName",
            "label": "Nachname",
            "type": "text",
            "required": true
          },
          {
            "name": "email",
            "label": "E-Mail",
            "type": "email",
            "required": true,
            "validation": [
              {
                "type": "email",
                "message": "Bitte gültige E-Mail eingeben"
              }
            ]
          }
        ],
        "validations": []
      },
      "actions": []
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "start-1",
      "target": "task-1"
    }
  ],
  "permissions": [
    {
      "userId": "admin-1",
      "role": "admin",
      "canExecute": true,
      "canEdit": true
    }
  ]
}
```

**Response:**
```json
{
  "id": "wf-123",
  "name": "Mitgliederaufnahme",
  "description": "Workflow für neue Mitglieder",
  "status": "draft",
  "version": 1,
  "createdBy": "admin-1",
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z",
  "nodes": [...],
  "edges": [...],
  "permissions": [...]
}
```

#### POST /api/workflows/:id/execute

**Request:**
```json
{
  "userId": "user-123",
  "initialContext": {
    "source": "web",
    "referrer": "homepage"
  }
}
```

**Response:**
```json
{
  "id": "exec-456",
  "workflowId": "wf-123",
  "workflowVersion": 1,
  "userId": "user-123",
  "currentNodeId": "start-1",
  "context": {
    "variables": {
      "source": "web",
      "referrer": "homepage"
    },
    "userId": "user-123",
    "timestamp": "2025-01-15T10:05:00Z",
    "metadata": {}
  },
  "history": [],
  "status": "running",
  "startedAt": "2025-01-15T10:05:00Z"
}
```

#### POST /api/executions/:id/step

**Request:**
```json
{
  "nodeId": "task-1",
  "inputs": {
    "firstName": "Max",
    "lastName": "Mustermann",
    "email": "max@example.com"
  }
}
```

**Response:**
```json
{
  "executionId": "exec-456",
  "currentNodeId": "task-2",
  "context": {
    "variables": {
      "firstName": "Max",
      "lastName": "Mustermann",
      "email": "max@example.com",
      "source": "web",
      "referrer": "homepage"
    },
    "userId": "user-123",
    "timestamp": "2025-01-15T10:06:00Z",
    "metadata": {}
  },
  "history": [
    {
      "id": "hist-1",
      "nodeId": "task-1",
      "nodeName": "Persönliche Daten",
      "timestamp": "2025-01-15T10:06:00Z",
      "inputs": {
        "firstName": "Max",
        "lastName": "Mustermann",
        "email": "max@example.com"
      },
      "outputs": {},
      "status": "success",
      "duration": 1200
    }
  ],
  "status": "running"
}
```

## 5. Workflow Engine Implementierung

### WorkflowEngine Klasse

```typescript
// services/engine/WorkflowEngine.ts

export class WorkflowEngine {
  private workflow: Workflow;
  private execution: WorkflowExecution;
  private stepProcessor: StepProcessor;
  private conditionEvaluator: ConditionEvaluator;
  private actionExecutor: ActionExecutor;

  constructor(
    workflow: Workflow,
    execution: WorkflowExecution
  ) {
    this.workflow = workflow;
    this.execution = execution;
    this.stepProcessor = new StepProcessor();
    this.conditionEvaluator = new ConditionEvaluator();
    this.actionExecutor = new ActionExecutor();
  }

  async start(): Promise<WorkflowExecution> {
    const startNode = this.findStartNode();
    if (!startNode) {
      throw new Error('No start node found');
    }

    this.execution.currentNodeId = startNode.id;
    this.execution.status = ExecutionStatus.RUNNING;
    this.execution.startedAt = new Date();

    return this.execution;
  }

  async processStep(
    nodeId: string,
    inputs: Record<string, any>
  ): Promise<StepResult> {
    const node = this.findNode(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    // Validate inputs
    const validationResult = await this.stepProcessor.validate(
      node,
      inputs
    );
    if (!validationResult.valid) {
      return {
        success: false,
        errors: validationResult.errors
      };
    }

    // Update context
    this.execution.context.variables = {
      ...this.execution.context.variables,
      ...inputs
    };

    // Execute actions
    const actionResults = await this.executeActions(node);

    // Add to history
    const historyEntry: StepHistory = {
      id: generateId(),
      nodeId: node.id,
      nodeName: node.label,
      timestamp: new Date(),
      inputs,
      outputs: actionResults.outputs,
      status: actionResults.success ? StepStatus.SUCCESS : StepStatus.ERROR,
      duration: actionResults.duration,
      actionResults: actionResults.results
    };
    this.execution.history.push(historyEntry);

    // Determine next node
    const nextNode = await this.determineNextNode(node);
    
    if (!nextNode) {
      // Workflow completed
      this.execution.status = ExecutionStatus.COMPLETED;
      this.execution.completedAt = new Date();
      return {
        success: true,
        completed: true
      };
    }

    this.execution.currentNodeId = nextNode.id;

    return {
      success: true,
      nextNodeId: nextNode.id,
      outputs: actionResults.outputs
    };
  }

  private async executeActions(
    node: WorkflowNode
  ): Promise<ActionExecutionResult> {
    const startTime = Date.now();
    const results: ActionResult[] = [];
    const outputs: Record<string, any> = {};

    for (const action of node.actions) {
      try {
        const result = await this.actionExecutor.execute(
          action,
          this.execution.context
        );
        
        results.push({
          actionId: action.id,
          actionName: action.name,
          status: 'success',
          response: result.data,
          duration: result.duration
        });

        // Map response to context variables
        if (action.config.responseMapping) {
          Object.assign(
            outputs,
            this.mapResponse(result.data, action.config.responseMapping)
          );
        }
      } catch (error) {
        results.push({
          actionId: action.id,
          actionName: action.name,
          status: 'error',
          error: error.message,
          duration: Date.now() - startTime
        });

        // Handle error based on action config
        if (action.onError) {
          // Jump to error handler node
          return {
            success: false,
            results,
            outputs,
            duration: Date.now() - startTime,
            errorNodeId: action.onError
          };
        }
      }
    }

    return {
      success: true,
      results,
      outputs,
      duration: Date.now() - startTime
    };
  }

  private async determineNextNode(
    currentNode: WorkflowNode
  ): Promise<WorkflowNode | null> {
    const outgoingEdges = this.workflow.edges.filter(
      edge => edge.source === currentNode.id
    );

    if (outgoingEdges.length === 0) {
      return null; // End of workflow
    }

    if (outgoingEdges.length === 1 && !outgoingEdges[0].condition) {
      return this.findNode(outgoingEdges[0].target);
    }

    // Evaluate conditions for decision nodes
    for (const edge of outgoingEdges) {
      if (edge.condition) {
        const conditionMet = await this.conditionEvaluator.evaluate(
          edge.condition,
          this.execution.context
        );
        if (conditionMet) {
          return this.findNode(edge.target);
        }
      }
    }

    // Default edge (no condition)
    const defaultEdge = outgoingEdges.find(edge => !edge.condition);
    if (defaultEdge) {
      return this.findNode(defaultEdge.target);
    }

    throw new Error('No valid next node found');
  }

  private findNode(nodeId: string): WorkflowNode | null {
    return this.workflow.nodes.find(node => node.id === nodeId) || null;
  }

  private findStartNode(): WorkflowNode | null {
    return this.workflow.nodes.find(
      node => node.type === NodeType.START
    ) || null;
  }

  private mapResponse(
    data: any,
    mapping: ResponseMapping
  ): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, path] of Object.entries(mapping)) {
      result[key] = this.getValueByPath(data, path);
    }
    
    return result;
  }

  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
```

## 6. Vue Composables

### useWorkflow Composable

```typescript
// composables/useWorkflow.ts

import { ref, computed } from 'vue';
import { useWorkflowStore } from '@/stores/workflow';
import type { Workflow, WorkflowNode, WorkflowEdge } from '@/types';

export function useWorkflow(workflowId?: string) {
  const store = useWorkflowStore();
  const loading = ref(false);
  const error = ref<string | null>(null);

  const workflow = computed(() => 
    workflowId ? store.getWorkflowById(workflowId) : null
  );

  const loadWorkflow = async (id: string) => {
    loading.value = true;
    error.value = null;
    try {
      await store.fetchWorkflow(id);
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  };

  const saveWorkflow = async (data: Partial<Workflow>) => {
    loading.value = true;
    error.value = null;
    try {
      if (workflowId) {
        await store.updateWorkflow(workflowId, data);
      } else {
        await store.createWorkflow(data as Workflow);
      }
    } catch (e) {
      error.value = e.message;
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const addNode = (node: WorkflowNode) => {
    if (workflowId) {
      store.addNode(workflowId, node);
    }
  };

  const updateNode = (nodeId: string, updates: Partial<WorkflowNode>) => {
    if (workflowId) {
      store.updateNode(workflowId, nodeId, updates);
    }
  };

  const removeNode = (nodeId: string) => {
    if (workflowId) {
      store.removeNode(workflowId, nodeId);
    }
  };

  const addEdge = (edge: WorkflowEdge) => {
    if (workflowId) {
      store.addEdge(workflowId, edge);
    }
  };

  const removeEdge = (edgeId: string) => {
    if (workflowId) {
      store.removeEdge(workflowId, edgeId);
    }
  };

  return {
    workflow,
    loading,
    error,
    loadWorkflow,
    saveWorkflow,
    addNode,
    updateNode,
    removeNode,
    addEdge,
    removeEdge
  };
}
```

### useExecution Composable

```typescript
// composables/useExecution.ts

import { ref, computed } from 'vue';
import { useExecutionStore } from '@/stores/execution';
import type { WorkflowExecution } from '@/types';

export function useExecution(executionId?: string) {
  const store = useExecutionStore();
  const loading = ref(false);
  const error = ref<string | null>(null);

  const execution = computed(() =>
    executionId ? store.getExecutionById(executionId) : null
  );

  const currentNode = computed(() => {
    if (!execution.value) return null;
    return store.getCurrentNode(execution.value.id);
  });

  const startExecution = async (workflowId: string) => {
    loading.value = true;
    error.value = null;
    try {
      const exec = await store.startExecution(workflowId);
      return exec;
    } catch (e) {
      error.value = e.message;
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const completeStep = async (inputs: Record<string, any>) => {
    if (!executionId) {
      throw new Error('No execution ID provided');
    }

    loading.value = true;
    error.value = null;
    try {
      await store.completeStep(executionId, inputs);
    } catch (e) {
      error.value = e.message;
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const pauseExecution = async () => {
    if (!executionId) return;
    await store.pauseExecution(executionId);
  };

  const resumeExecution = async () => {
    if (!executionId) return;
    await store.resumeExecution(executionId);
  };

  const cancelExecution = async () => {
    if (!executionId) return;
    await store.cancelExecution(executionId);
  };

  return {
    execution,
    currentNode,
    loading,
    error,
    startExecution,
    completeStep,
    pauseExecution,
    resumeExecution,
    cancelExecution
  };
}
```

## 7. Sicherheit & Berechtigungen

### Authentifizierung
- Integration mit ChurchTools Authentifizierung
- JWT-basierte Session-Verwaltung
- Automatische Token-Erneuerung

### Autorisierung
- Rollenbasierte Zugriffskontrolle (RBAC)
- Workflow-spezifische Berechtigungen
- Schritt-Level Berechtigungen (optional)

### Validierung
- Input-Validierung auf Client und Server
- XSS-Schutz durch Sanitization
- CSRF-Token für State-ändernde Operationen

### Datenschutz
- Verschlüsselung sensibler Daten
- Audit-Log für alle Workflow-Aktionen
- DSGVO-konforme Datenspeicherung

## 8. Performance-Optimierungen

### Frontend
- Lazy Loading von Komponenten
- Virtual Scrolling für große Listen
- Debouncing bei Benutzereingaben
- Caching von Workflow-Definitionen
- Optimistic UI Updates

### Backend
- Datenbank-Indizes auf häufig abgefragte Felder
- Caching von Workflow-Definitionen (Redis)
- Batch-Processing für Aktionen
- Connection Pooling
- Rate Limiting für API-Calls

## 9. Testing-Strategie

### Unit Tests
- Workflow Engine Logik
- Condition Evaluator
- Action Executor
- Validation Rules
- Composables

### Integration Tests
- API Endpoints
- Workflow Execution Flow
- External Integrations
- Database Operations

### E2E Tests
- Workflow Creation
- Workflow Execution
- User Interactions
- Error Scenarios

## 10. Deployment

### Build Process
```bash
# Frontend Build
npm run build

# Package für ChurchTools
npm run package
```

### Environment Variables
```env
VITE_KEY=workflow
VITE_API_URL=https://your-churchtools.de/api
VITE_WS_URL=wss://your-churchtools.de/ws
```

### ChurchTools Integration
- Extension als ZIP hochladen
- Automatische Installation der Datenbank-Tabellen
- Konfiguration über ChurchTools Admin-Panel

## 11. Monitoring & Logging

### Metriken
- Workflow-Ausführungszeiten
- Fehlerrate pro Workflow
- API-Response-Zeiten
- Aktive Executions

### Logging
- Strukturiertes Logging (JSON)
- Log-Levels: ERROR, WARN, INFO, DEBUG
- Correlation IDs für Request-Tracking
- Sensitive Daten filtern

### Error Tracking
- Sentry Integration (optional)
- Error Boundaries in Vue
- Automatische Fehlerberichte
- Stack Traces für Debugging
