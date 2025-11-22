/**
 * Workflow Types
 */

export interface Workflow {
  id: number; // Backend-ID (CustomDataCategory ID)
  name: string;
  description: string;
  category: string;
  definition: WorkflowDefinition;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  valueId?: number; // CustomDataValue ID where definition is stored
  isCorrupted?: boolean; // Marks workflows with invalid data
  corruptionReason?: string; // Reason why workflow is corrupted
}

export interface WorkflowDefinition {
  version: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata?: {
    description?: string;
    category?: string;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
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

  // Für Join-Knoten
  joinMode?: JoinMode;
}

export enum JoinMode {
  AND = 'and', // Warte auf ALLE eingehenden Branches
  OR = 'or',   // Warte auf EINEN eingehenden Branch
}

export interface DecisionOutput {
  id: string;
  label: string; // z.B. "Genehmigt", "Abgelehnt"
  color?: string; // Farbe für das Handle (z.B. "#4caf50")
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
  // For PERSON, PERSON_MULTI
  personFilter?: {
    groupIds?: number[];
    statusIds?: number[];
    campusIds?: number[];
  };
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
  JOIN = 'join',
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
  DISPLAY = 'display', // Read-only Informationsfeld mit Markdown + Interpolation
  PERSON = 'person', // ChurchTools Person Einzelauswahl
  PERSON_MULTI = 'person-multi', // ChurchTools Person Mehrfachauswahl
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
  workflowId: number; // Backend Workflow-ID
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
  nodeQueue?: string[]; // Queue for sequential multi-edge execution
  joinStates?: Record<string, JoinState>; // Track JOIN node states
  error?: string; // Error message for failed executions
}

export interface JoinState {
  nodeId: string;
  expectedBranches: number; // How many branches should arrive
  completedBranches: number; // How many have arrived
  branchData: Record<string, any>[]; // Data from each branch
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
