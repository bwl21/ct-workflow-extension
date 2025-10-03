import type { StorageService } from './StorageService';
import type { Workflow, WorkflowExecution } from '@/types/workflow.types';
import type { WorkflowPermission } from '@/types/user.types';

/**
 * LocalStorage Implementation des StorageService
 * Für Development und als Fallback
 */
export class LocalStorageService implements StorageService {
  private prefix = 'ct-workflow-';

  async initialize(): Promise<void> {
    // Keine Initialisierung nötig für localStorage
    console.info('LocalStorageService initialized');
  }

  // Workflows
  async getWorkflows(): Promise<Workflow[]> {
    const data = localStorage.getItem(`${this.prefix}workflows`);
    if (!data) return [];

    const workflows = JSON.parse(data);
    // Convert date strings back to Date objects
    return workflows.map((w: Workflow) => ({
      ...w,
      createdAt: new Date(w.createdAt),
      updatedAt: new Date(w.updatedAt),
    }));
  }

  async getWorkflow(id: string): Promise<Workflow | null> {
    const workflows = await this.getWorkflows();
    return workflows.find((w) => w.id === id) || null;
  }

  async saveWorkflow(workflow: Workflow): Promise<void> {
    const workflows = await this.getWorkflows();
    const index = workflows.findIndex((w) => w.id === workflow.id);

    if (index > -1) {
      workflows[index] = workflow;
    } else {
      workflows.push(workflow);
    }

    localStorage.setItem(`${this.prefix}workflows`, JSON.stringify(workflows));
  }

  async deleteWorkflow(id: string): Promise<void> {
    const workflows = await this.getWorkflows();
    const filtered = workflows.filter((w) => w.id !== id);
    localStorage.setItem(`${this.prefix}workflows`, JSON.stringify(filtered));
  }

  // Executions
  async getExecutions(userId?: string): Promise<WorkflowExecution[]> {
    const data = localStorage.getItem(`${this.prefix}executions`);
    if (!data) return [];

    let executions = JSON.parse(data);

    // Convert date strings back to Date objects
    executions = executions.map((e: WorkflowExecution) => ({
      ...e,
      startedAt: new Date(e.startedAt),
      completedAt: e.completedAt ? new Date(e.completedAt) : undefined,
      context: {
        ...e.context,
        timestamp: new Date(e.context.timestamp),
      },
      history: e.history.map((h) => ({
        ...h,
        timestamp: new Date(h.timestamp),
      })),
    }));

    if (userId) {
      executions = executions.filter((e: WorkflowExecution) => e.userId === userId);
    }

    return executions;
  }

  async getExecution(id: string): Promise<WorkflowExecution | null> {
    const executions = await this.getExecutions();
    return executions.find((e) => e.id === id) || null;
  }

  async saveExecution(execution: WorkflowExecution): Promise<void> {
    const executions = await this.getExecutions();
    const index = executions.findIndex((e) => e.id === execution.id);

    if (index > -1) {
      executions[index] = execution;
    } else {
      executions.push(execution);
    }

    localStorage.setItem(`${this.prefix}executions`, JSON.stringify(executions));
  }

  async deleteExecution(id: string): Promise<void> {
    const executions = await this.getExecutions();
    const filtered = executions.filter((e) => e.id !== id);
    localStorage.setItem(`${this.prefix}executions`, JSON.stringify(filtered));
  }

  // Permissions
  async getPermissions(
    workflowId?: string,
    userId?: string
  ): Promise<WorkflowPermission[]> {
    const data = localStorage.getItem(`${this.prefix}permissions`);
    if (!data) return [];

    let permissions: WorkflowPermission[] = JSON.parse(data);

    if (workflowId) {
      permissions = permissions.filter((p) => p.workflowId === workflowId);
    }

    if (userId) {
      permissions = permissions.filter((p) => p.userId === userId);
    }

    return permissions;
  }

  async savePermission(permission: WorkflowPermission): Promise<void> {
    const permissions = await this.getPermissions();
    const index = permissions.findIndex(
      (p) => p.workflowId === permission.workflowId && p.userId === permission.userId
    );

    if (index > -1) {
      permissions[index] = permission;
    } else {
      permissions.push(permission);
    }

    localStorage.setItem(`${this.prefix}permissions`, JSON.stringify(permissions));
  }

  async deletePermission(workflowId: string, userId: string): Promise<void> {
    const permissions = await this.getPermissions();
    const filtered = permissions.filter(
      (p) => !(p.workflowId === workflowId && p.userId === userId)
    );
    localStorage.setItem(`${this.prefix}permissions`, JSON.stringify(filtered));
  }

  // Settings
  async getSetting<T = unknown>(key: string): Promise<T | null> {
    const data = localStorage.getItem(`${this.prefix}settings`);
    if (!data) return null;

    const settings = JSON.parse(data);
    return settings[key] || null;
  }

  async saveSetting<T = unknown>(key: string, value: T): Promise<void> {
    const data = localStorage.getItem(`${this.prefix}settings`);
    const settings = data ? JSON.parse(data) : {};

    settings[key] = value;

    localStorage.setItem(`${this.prefix}settings`, JSON.stringify(settings));
  }
}
