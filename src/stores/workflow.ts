import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { Workflow, WorkflowNode, WorkflowEdge } from '@/types/workflow.types';
import { useWorkflows } from '@/composables/useWorkflows';

export const useWorkflowStore = defineStore('workflow', () => {
  // State
  const workflows = ref<Workflow[]>([]);
  const currentWorkflowId = ref<string | null>(null);
  const isSaving = ref(false);
  const isLoading = ref(false);
  const workflowSnapshot = ref<Workflow | null>(null);
  
  // ChurchTools Backend Composable (lazy initialization)
  let backendWorkflows: ReturnType<typeof useWorkflows> | null = null;
  const getBackendWorkflows = () => {
    if (!backendWorkflows) {
      backendWorkflows = useWorkflows();
    }
    return backendWorkflows;
  };

  // Getters
  const currentWorkflow = computed(() => {
    if (!currentWorkflowId.value) return null;
    return workflows.value.find((w) => w.id === currentWorkflowId.value) || null;
  });

  const getWorkflowById = (id: string) => {
    return workflows.value.find((w) => w.id === id);
  };

  // Actions
  function createWorkflow(name: string, description: string, category: string = 'Allgemein'): Workflow {
    const workflow: Workflow = {
      id: generateId(),
      name,
      description,
      category,
      definition: {
        version: '1.0.0',
        nodes: [],
        edges: [],
        metadata: {
          description,
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'demo-user', // TODO: Get from user store
    };

    workflows.value.push(workflow);
    currentWorkflowId.value = workflow.id;

    // Speichern in localStorage
    saveToLocalStorage();

    return workflow;
  }

  function addWorkflow(workflow: Workflow) {
    workflows.value.push(workflow);
    saveToLocalStorage();
  }

  function getAllWorkflows(): Workflow[] {
    return workflows.value;
  }

  function updateWorkflow(id: string, updates: Partial<Workflow>) {
    const workflow = getWorkflowById(id);
    if (workflow) {
      Object.assign(workflow, updates);
      workflow.updatedAt = new Date();
      saveToLocalStorage();
    }
  }

  function deleteWorkflow(id: string) {
    const index = workflows.value.findIndex((w) => w.id === id);
    if (index > -1) {
      workflows.value.splice(index, 1);
      if (currentWorkflowId.value === id) {
        currentWorkflowId.value = null;
      }
      saveToLocalStorage();
    }
  }

  function setCurrentWorkflow(id: string | null) {
    currentWorkflowId.value = id;
  }

  function addNode(workflowId: string, node: WorkflowNode) {
    const workflow = getWorkflowById(workflowId);
    if (workflow) {
      workflow.definition.nodes.push(node);
      workflow.updatedAt = new Date();
      saveToLocalStorage();
    }
  }

  function updateNode(workflowId: string, nodeId: string, updates: Partial<WorkflowNode>) {
    const workflow = getWorkflowById(workflowId);
    if (workflow) {
      const node = workflow.definition.nodes.find((n) => n.id === nodeId);
      if (node) {
        Object.assign(node, updates);
        workflow.updatedAt = new Date();
        saveToLocalStorage();
      }
    }
  }

  function removeNode(workflowId: string, nodeId: string) {
    const workflow = getWorkflowById(workflowId);
    if (workflow) {
      // Remove node
      const nodeIndex = workflow.definition.nodes.findIndex((n) => n.id === nodeId);
      if (nodeIndex > -1) {
        workflow.definition.nodes.splice(nodeIndex, 1);
      }

      // Remove connected edges
      workflow.definition.edges = workflow.definition.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      );

      workflow.updatedAt = new Date();
      saveToLocalStorage();
    }
  }

  function addEdge(workflowId: string, edge: WorkflowEdge) {
    const workflow = getWorkflowById(workflowId);
    if (workflow) {
      workflow.definition.edges.push(edge);
      workflow.updatedAt = new Date();
      saveToLocalStorage();
    }
  }

  function removeEdge(workflowId: string, edgeId: string) {
    const workflow = getWorkflowById(workflowId);
    if (workflow) {
      const index = workflow.definition.edges.findIndex((e) => e.id === edgeId);
      if (index > -1) {
        workflow.definition.edges.splice(index, 1);
        workflow.updatedAt = new Date();
        saveToLocalStorage();
      }
    }
  }

  // LocalStorage
  function saveToLocalStorage() {
    try {
      localStorage.setItem('workflows', JSON.stringify(workflows.value));
    } catch (error) {
      console.error('Failed to save workflows to localStorage:', error);
    }
  }

  function loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('workflows');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects and migrate old structure
        workflows.value = parsed.map((w: any) => {
          // Migrate old structure to new V2 structure
          if (!w.definition && (w.nodes || w.edges)) {
            console.info('Migrating workflow to V2 structure:', w.name);
            return {
              ...w,
              category: w.category || 'Allgemein',
              definition: {
                version: '1.0.0',
                nodes: w.nodes || [],
                edges: w.edges || [],
                metadata: {
                  description: w.description || '',
                },
              },
              createdAt: new Date(w.createdAt),
              updatedAt: new Date(w.updatedAt),
            };
          }
          // Already V2 structure
          return {
            ...w,
            category: w.category || 'Allgemein',
            createdAt: new Date(w.createdAt),
            updatedAt: new Date(w.updatedAt),
          };
        });
        // Save migrated workflows
        saveToLocalStorage();
      }
    } catch (error) {
      console.error('Failed to load workflows from localStorage:', error);
      // Clear corrupted data
      localStorage.removeItem('workflows');
    }
  }

  function clearAllWorkflows() {
    workflows.value = [];
    localStorage.removeItem('workflows');
  }

  // ChurchTools Backend Functions
  async function loadFromBackend() {
    isLoading.value = true;
    try {
      const backend = getBackendWorkflows();
      
      // Warte bis Backend-Workflows geladen sind
      await new Promise(resolve => {
        const unwatch = watch(
          () => backend.isLoading.value,
          (loading) => {
            if (!loading) {
              unwatch();
              resolve(true);
            }
          },
          { immediate: true }
        );
      });
      
      // Konvertiere Backend-Workflows zu lokalem Format
      const backendWfs = backend.workflows.value || [];
      workflows.value = backendWfs.map((w: any) => convertBackendToLocal(w));
      
      // Speichere in localStorage für Offline-Nutzung
      saveToLocalStorage();
    } catch (error) {
      console.error('Failed to load workflows from backend:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function saveToBackend(workflowId: string) {
    const workflow = getWorkflowById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    isSaving.value = true;
    try {
      const backend = getBackendWorkflows();
      
      // Prüfe ob Workflow bereits im Backend existiert
      const existingBackendWorkflow = backend.workflows.value?.find(
        (w: any) => w.meta.metadata?.localId === workflow.id
      );

      if (existingBackendWorkflow) {
        // Update existing
        await backend.updateWorkflow(
          existingBackendWorkflow.id,
          workflow.definition
        );
      } else {
        // Create new
        await backend.createWorkflow(
          workflow.name,
          {
            ...workflow.definition,
            metadata: {
              ...workflow.definition.metadata,
              localId: workflow.id,
              createdAt: workflow.createdAt.toISOString(),
              updatedAt: workflow.updatedAt.toISOString(),
              createdBy: workflow.createdBy
            }
          }
        );
      }
    } catch (error) {
      console.error('Failed to save workflow to backend:', error);
      throw error;
    } finally {
      isSaving.value = false;
    }
  }

  async function deleteFromBackend(workflowId: string) {
    const workflow = getWorkflowById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    isSaving.value = true;
    try {
      const backend = getBackendWorkflows();
      
      // Finde Backend-Workflow
      const backendWorkflow = backend.workflows.value?.find(
        (w: any) => w.meta.metadata?.localId === workflow.id
      );

      if (backendWorkflow) {
        await backend.deleteWorkflow(backendWorkflow.id);
      }
      
      // Lösche auch lokal
      deleteWorkflow(workflowId);
    } catch (error) {
      console.error('Failed to delete workflow from backend:', error);
      throw error;
    } finally {
      isSaving.value = false;
    }
  }

  // Helper: Konvertiere Backend-Format zu lokalem Format
  function convertBackendToLocal(backendWorkflow: any): Workflow {
    return {
      id: backendWorkflow.meta.metadata?.localId || `backend-${backendWorkflow.id}`,
      name: backendWorkflow.name,
      description: backendWorkflow.meta.metadata?.description || '',
      category: 'Backend', // Marker dass es vom Backend kommt
      definition: {
        version: backendWorkflow.meta.version,
        nodes: backendWorkflow.meta.nodes,
        edges: backendWorkflow.meta.edges,
        metadata: backendWorkflow.meta.metadata
      },
      createdAt: new Date(backendWorkflow.meta.metadata?.createdAt || Date.now()),
      updatedAt: new Date(backendWorkflow.meta.metadata?.updatedAt || Date.now()),
      createdBy: backendWorkflow.meta.metadata?.createdBy
    };
  }

  // Snapshot Management
  function createSnapshot(workflowId: string) {
    const workflow = getWorkflowById(workflowId);
    if (workflow) {
      workflowSnapshot.value = JSON.parse(JSON.stringify(workflow));
    }
  }

  function revertToSnapshot() {
    if (workflowSnapshot.value && currentWorkflowId.value) {
      const index = workflows.value.findIndex((w) => w.id === currentWorkflowId.value);
      if (index !== -1) {
        workflows.value[index] = JSON.parse(JSON.stringify(workflowSnapshot.value));
        saveToLocalStorage();
      }
      workflowSnapshot.value = null;
    }
  }

  function clearSnapshot() {
    workflowSnapshot.value = null;
  }

  // Initialize
  loadFromLocalStorage();

  return {
    // State
    workflows,
    currentWorkflowId,
    isSaving,
    isLoading,

    // Getters
    currentWorkflow,
    getWorkflowById,
    getAllWorkflows,

    // Actions - Local
    createWorkflow,
    addWorkflow,
    updateWorkflow,
    deleteWorkflow,
    setCurrentWorkflow,
    addNode,
    updateNode,
    removeNode,
    addEdge,
    removeEdge,
    loadFromLocalStorage,
    clearAllWorkflows,
    
    // Actions - Backend
    loadFromBackend,
    saveToBackend,
    deleteFromBackend,
    
    // Actions - Snapshot
    createSnapshot,
    revertToSnapshot,
    clearSnapshot,
  };
});

// Helper
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
