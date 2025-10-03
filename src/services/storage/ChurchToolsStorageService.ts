import type { StorageService, DataCategory } from './StorageService';
import type { Workflow, WorkflowExecution } from '@/types/workflow.types';
import type { WorkflowPermission } from '@/types/user.types';

/**
 * ChurchTools Custom Module API Implementation
 * 
 * HINWEIS: Diese Klasse ist vorbereitet für die ChurchTools API,
 * wird aber aktuell noch nicht verwendet. Für Development nutzen wir LocalStorageService.
 * 
 * Verwendung der ChurchTools Custom Module API:
 * - CustomModule = Extension (VITE_KEY)
 * - CustomDataCategory = Daten-Kategorie (workflows, executions, permissions, settings)
 * - CustomDataValue = Key-Value Paar (id → JSON)
 */
export class ChurchToolsStorageService implements StorageService {
  private moduleId: string;
  private categories: Map<DataCategory, string> = new Map();
  private initialized = false;

  constructor(private apiBaseUrl: string) {
    this.moduleId = import.meta.env.VITE_KEY || 'workflow';
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.ensureCategories();
      this.initialized = true;
      console.info('ChurchToolsStorageService initialized');
    } catch (error) {
      console.error('Failed to initialize ChurchToolsStorageService:', error);
      throw error;
    }
  }

  /**
   * Stellt sicher, dass alle benötigten Kategorien existieren
   */
  private async ensureCategories(): Promise<void> {
    // GET /custommodules/{moduleId}/customdatacategories
    const response = await fetch(
      `${this.apiBaseUrl}/custommodules/${this.moduleId}/customdatacategories`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }

    const existingCategories = await response.json();

    // Erstelle fehlende Kategorien
    const requiredCategories: DataCategory[] = [
      'workflows' as DataCategory,
      'executions' as DataCategory,
      'permissions' as DataCategory,
      'settings' as DataCategory,
    ];

    for (const categoryName of requiredCategories) {
      let category = existingCategories.find((c: { name: string }) => c.name === categoryName);

      if (!category) {
        // POST /custommodules/{moduleId}/customdatacategories
        const createResponse = await fetch(
          `${this.apiBaseUrl}/custommodules/${this.moduleId}/customdatacategories`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: categoryName,
              description: `Storage for ${categoryName}`,
            }),
          }
        );

        if (!createResponse.ok) {
          throw new Error(`Failed to create category ${categoryName}`);
        }

        category = await createResponse.json();
      }

      this.categories.set(categoryName, category.id);
    }
  }

  /**
   * Hilfsmethode: Alle Values einer Kategorie abrufen
   */
  private async getValues(category: DataCategory): Promise<any[]> {
    const categoryId = this.categories.get(category);
    if (!categoryId) {
      throw new Error(`Category ${category} not initialized`);
    }

    // GET /custommodules/{moduleId}/customdatacategories/{dataCategoryId}/customdatavalues
    const response = await fetch(
      `${this.apiBaseUrl}/custommodules/${this.moduleId}/customdatacategories/${categoryId}/customdatavalues`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch values for ${category}`);
    }

    return response.json();
  }

  /**
   * Hilfsmethode: Value finden
   */
  private async findValue(category: DataCategory, key: string): Promise<any> {
    const values = await this.getValues(category);
    return values.find((v) => v.key === key);
  }

  /**
   * Hilfsmethode: Value speichern (create oder update)
   */
  private async saveValue(category: DataCategory, key: string, value: string): Promise<void> {
    const categoryId = this.categories.get(category);
    if (!categoryId) {
      throw new Error(`Category ${category} not initialized`);
    }

    const existing = await this.findValue(category, key);

    if (existing) {
      // PUT /custommodules/{moduleId}/customdatacategories/{dataCategoryId}/customdatavalues/{valueId}
      const response = await fetch(
        `${this.apiBaseUrl}/custommodules/${this.moduleId}/customdatacategories/${categoryId}/customdatavalues/${existing.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update value ${key}`);
      }
    } else {
      // POST /custommodules/{moduleId}/customdatacategories/{dataCategoryId}/customdatavalues
      const response = await fetch(
        `${this.apiBaseUrl}/custommodules/${this.moduleId}/customdatacategories/${categoryId}/customdatavalues`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create value ${key}`);
      }
    }
  }

  /**
   * Hilfsmethode: Value löschen
   */
  private async deleteValue(category: DataCategory, key: string): Promise<void> {
    const categoryId = this.categories.get(category);
    if (!categoryId) {
      throw new Error(`Category ${category} not initialized`);
    }

    const existing = await this.findValue(category, key);
    if (!existing) return;

    // DELETE /custommodules/{moduleId}/customdatacategories/{dataCategoryId}/customdatavalues/{valueId}
    const response = await fetch(
      `${this.apiBaseUrl}/custommodules/${this.moduleId}/customdatacategories/${categoryId}/customdatavalues/${existing.id}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete value ${key}`);
    }
  }

  // Workflows
  async getWorkflows(): Promise<Workflow[]> {
    const values = await this.getValues('workflows' as DataCategory);
    return values.map((v) => JSON.parse(v.value));
  }

  async getWorkflow(id: string): Promise<Workflow | null> {
    const value = await this.findValue('workflows' as DataCategory, id);
    return value ? JSON.parse(value.value) : null;
  }

  async saveWorkflow(workflow: Workflow): Promise<void> {
    await this.saveValue('workflows' as DataCategory, workflow.id, JSON.stringify(workflow));
  }

  async deleteWorkflow(id: string): Promise<void> {
    await this.deleteValue('workflows' as DataCategory, id);
  }

  // Executions
  async getExecutions(userId?: string): Promise<WorkflowExecution[]> {
    const values = await this.getValues('executions' as DataCategory);
    let executions = values.map((v) => JSON.parse(v.value));

    if (userId) {
      executions = executions.filter((e: WorkflowExecution) => e.userId === userId);
    }

    return executions;
  }

  async getExecution(id: string): Promise<WorkflowExecution | null> {
    const value = await this.findValue('executions' as DataCategory, id);
    return value ? JSON.parse(value.value) : null;
  }

  async saveExecution(execution: WorkflowExecution): Promise<void> {
    await this.saveValue('executions' as DataCategory, execution.id, JSON.stringify(execution));
  }

  async deleteExecution(id: string): Promise<void> {
    await this.deleteValue('executions' as DataCategory, id);
  }

  // Permissions
  async getPermissions(workflowId?: string, userId?: string): Promise<WorkflowPermission[]> {
    const values = await this.getValues('permissions' as DataCategory);
    let permissions = values.map((v) => JSON.parse(v.value));

    if (workflowId) {
      permissions = permissions.filter((p: WorkflowPermission) => p.workflowId === workflowId);
    }

    if (userId) {
      permissions = permissions.filter((p: WorkflowPermission) => p.userId === userId);
    }

    return permissions;
  }

  async savePermission(permission: WorkflowPermission): Promise<void> {
    const key = `${permission.workflowId}:${permission.userId}`;
    await this.saveValue('permissions' as DataCategory, key, JSON.stringify(permission));
  }

  async deletePermission(workflowId: string, userId: string): Promise<void> {
    const key = `${workflowId}:${userId}`;
    await this.deleteValue('permissions' as DataCategory, key);
  }

  // Settings
  async getSetting<T = unknown>(key: string): Promise<T | null> {
    const value = await this.findValue('settings' as DataCategory, key);
    return value ? JSON.parse(value.value) : null;
  }

  async saveSetting<T = unknown>(key: string, value: T): Promise<void> {
    await this.saveValue('settings' as DataCategory, key, JSON.stringify(value));
  }
}
