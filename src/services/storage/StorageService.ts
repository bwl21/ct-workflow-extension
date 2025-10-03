import type { Workflow, WorkflowExecution } from '@/types/workflow.types';
import type { WorkflowPermission } from '@/types/user.types';

/**
 * Abstract Storage Service Interface
 * Kann mit localStorage oder ChurchTools API implementiert werden
 */
export interface StorageService {
  // Initialization
  initialize(): Promise<void>;

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
  getSetting<T = unknown>(key: string): Promise<T | null>;
  saveSetting<T = unknown>(key: string, value: T): Promise<void>;
}

/**
 * Data Categories für ChurchTools Custom Module API
 */
export enum DataCategory {
  WORKFLOWS = 'workflows',
  EXECUTIONS = 'executions',
  PERMISSIONS = 'permissions',
  SETTINGS = 'settings',
}
