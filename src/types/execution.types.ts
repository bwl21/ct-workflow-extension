/**
 * Execution Types für ChurchTools Custom Module Persistierung
 */

export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'paused';

export interface WorkflowExecution {
  id: number;                    // ChurchTools value ID
  dataCategoryId: number;        // Workflow category ID
  type: 'execution';             // Typ-Marker
  meta: ExecutionData;           // Execution-Daten
}

export interface ExecutionData {
  executionId: string;           // UUID
  userId: number;
  userName: string;
  status: ExecutionStatus;
  currentNodeId: string;
  startedAt: string;
  completedAt?: string;
  pausedAt?: string;
  
  // Execution Context
  context: ExecutionContext;
  
  // Steps
  steps: Record<string, StepData>;
}

export interface ExecutionContext {
  variables: Record<string, any>;
  history: string[];             // Array von nodeIds
}

export interface StepData {
  nodeId: string;
  nodeName: string;
  timestamp: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  status: 'success' | 'error' | 'skipped';
  duration: number;
  error?: string;
}
