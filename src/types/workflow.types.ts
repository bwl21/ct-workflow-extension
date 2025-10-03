/**
 * Workflow Types
 */

export interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string;
  definition: WorkflowDefinition;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface WorkflowDefinition {
  version: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata: {
    description: string;
  };
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  description?: string;
  position: Position;
  dimensions?: Dimensions;
  data: NodeData;
}

export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface NodeData {
  // Für Task-Knoten
  fields?: FormField[];

  // Für Action-Knoten
  actionId?: string;
  actionConfig?: Record<string, any>;

  // Für Decision-Knoten
  engine?: RuleEngine;
  simpleRules?: SimpleRules;
  jsonLogic?: any;
  customExpression?: string;
  
  // Decision Node Outputs mit Bedingungen
  outputs?: DecisionOutput[];
}

export interface DecisionOutput {
  id: string;
  label: string; // z.B. "Genehmigt", "Abgelehnt"
  condition?: {
    engine: RuleEngine;
    rule: any;
  };
  isDefault?: boolean; // Fallback wenn keine Bedingung zutrifft
}

export type RuleEngine = 'simple' | 'jsonlogic' | 'custom';

export interface SimpleRules {
  conditions: SimpleCondition[];
  logic: 'AND' | 'OR';
}

export interface SimpleCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
}

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  defaultValue?: any;
  // For SELECT, MULTISELECT, RADIO
  options?: string[];
  // For RANGE
  min?: number;
  max?: number;
  step?: number;
  // For FILE
  accept?: string;
  multiple?: boolean;
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
  sourceHandle?: string; // Für Decision Nodes: ID des Outputs
  label?: string;
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
  TEL = 'tel',
  URL = 'url',
  DATE = 'date',
  DATETIME = 'datetime-local',
  TIME = 'time',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  RANGE = 'range',
  COLOR = 'color',
  FILE = 'file',
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  GREATER_THAN_OR_EQUAL = 'greaterThanOrEqual',
  LESS_THAN_OR_EQUAL = 'lessThanOrEqual',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'notContains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  IS_EMPTY = 'isEmpty',
  IS_NOT_EMPTY = 'isNotEmpty',
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
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum StepStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  SKIPPED = 'skipped',
}
