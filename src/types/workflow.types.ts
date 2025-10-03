/**
 * Workflow Types
 */

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  description?: string;
  position: Position;
  data: NodeData;
}

export interface Position {
  x: number;
  y: number;
}

export interface NodeData {
  // Für Task-Knoten
  fields?: FormField[];

  // Für Action-Knoten
  actionId?: string;
  actionConfig?: Record<string, any>;

  // Für Decision-Knoten
  conditions?: Condition[];
}

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  defaultValue?: any;
}

export interface Condition {
  field: string;
  operator: ConditionOperator;
  value: any;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: Condition;
}

export enum NodeType {
  START = 'start',
  TASK = 'task',
  ACTION = 'action',
  DECISION = 'decision',
  END = 'end',
}

export enum FieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  EMAIL = 'email',
  SELECT = 'select',
  CHECKBOX = 'checkbox',
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  CONTAINS = 'contains',
}

/**
 * Workflow Execution Types
 */

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  currentNodeId: string;
  context: ExecutionContext;
  history: StepHistory[];
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
}

export interface ExecutionContext {
  variables: Record<string, any>;
  userId: string;
  timestamp: Date;
}

export interface StepHistory {
  id: string;
  nodeId: string;
  nodeName: string;
  timestamp: Date;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  status: StepStatus;
}

export enum ExecutionStatus {
  CREATED = 'created',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum StepStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  SKIPPED = 'skipped',
}
