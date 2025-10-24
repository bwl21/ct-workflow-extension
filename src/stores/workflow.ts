import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Workflow, WorkflowNode, WorkflowEdge } from '@/types/workflow.types';
import { useWorkflows } from '@/composables/useWorkflows';

export const useWorkflowStore = defineStore('workflow', () => {
  // Backend workflows
  const backendWorkflows = useWorkflows();
  
  // State
  const currentWorkflowId = ref<number | null>(null);
  const isSaving = ref(false);
  const workflowSnapshot = ref<Workflow | null>(null);

  // Workflows from backend (converted to store format)
  const workflows = computed((): Workflow[] => {
    console.log('[workflowStore] Backend workflows:', backendWorkflows.workflows.value);
    const result = (backendWorkflows.workflows.value || [])
      .map((cat: any): Workflow => {
        // Check if workflow has valid definition
        if (!cat.data || typeof cat.data !== 'object') {
          console.error(`[workflowStore] Workflow "${cat.name}" (ID: ${cat.id}) has invalid or missing definition:`, cat.data);
          
          // Return corrupted workflow marker
          return {
            id: cat.id,
            name: cat.name,
            description: 'Fehlerhafter Workflow',
            category: 'Fehler',
            definition: {
              version: '1.0.0',
              nodes: [],
              edges: [],
              metadata: {}
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'unknown',
            isCorrupted: true,
            corruptionReason: 'Ungültige oder fehlende Definition'
          };
        }
        
        const definition = cat.data;
        
        // Ensure nodes and edges arrays exist
        if (!definition.nodes) {
          console.warn(`[workflowStore] Workflow "${cat.name}" (ID: ${cat.id}) missing nodes array, initializing empty`);
          definition.nodes = [];
        }
        if (!definition.edges) {
          console.warn(`[workflowStore] Workflow "${cat.name}" (ID: ${cat.id}) missing edges array, initializing empty`);
          definition.edges = [];
        }
        if (!definition.metadata) {
          console.warn(`[workflowStore] Workflow "${cat.name}" (ID: ${cat.id}) missing metadata, initializing empty`);
          definition.metadata = {};
        }
        
        return {
          id: cat.id,                    // Backend-ID (number)
          name: cat.name,
          description: definition.metadata?.description || '',
          category: definition.metadata?.category || 'Allgemein',
          definition,
          createdAt: new Date(definition.metadata?.createdAt || Date.now()),
          updatedAt: new Date(definition.metadata?.updatedAt || Date.now()),
          createdBy: definition.metadata?.createdBy || 'unknown'
        };
      });
    
    console.log('[workflowStore] Converted workflows:', result);
    return result;
  });

  const isLoading = computed(() => backendWorkflows.isLoading.value);

  // Getters
  const currentWorkflow = computed(() => {
    if (!currentWorkflowId.value) return null;
    return workflows.value.find((w) => w.id === currentWorkflowId.value) || null;
  });

  const getWorkflowById = (id: number) => {
    return workflows.value.find((w) => w.id === id);
  };

  // Actions
  async function createWorkflow(name: string, description: string, category: string = 'Allgemein') {
    console.log('[workflowStore] Creating workflow:', { name, description, category });
    const definition = {
      version: '1.0.0',
      nodes: [],
      edges: [],
      metadata: {
        description,
        category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'current-user' // TODO: Get from useCurrentUser
      }
    };

    try {
      await backendWorkflows.createWorkflow(name, definition);
      console.log('[workflowStore] Workflow created successfully');
      // Query wird automatisch invalidiert und workflows neu geladen
    } catch (error) {
      console.error('[workflowStore] Failed to create workflow:', error);
      throw error;
    }
  }

  function getAllWorkflows(): Workflow[] {
    return workflows.value;
  }

  async function updateWorkflow(id: number, updates: Partial<Workflow>) {
    const workflow = getWorkflowById(id);
    if (!workflow) throw new Error('Workflow not found');

    const updatedDefinition = {
      ...workflow.definition,
      ...updates.definition,
      metadata: {
        ...workflow.definition.metadata,
        description: updates.description ?? workflow.description,
        category: updates.category ?? workflow.category,
        updatedAt: new Date().toISOString()
      }
    };

    await backendWorkflows.updateWorkflow(id, updatedDefinition);
  }

  async function deleteWorkflow(id: number) {
    await backendWorkflows.deleteWorkflow(id);
    if (currentWorkflowId.value === id) {
      currentWorkflowId.value = null;
    }
  }

  function setCurrentWorkflow(id: number | null) {
    currentWorkflowId.value = id;
  }

  function addNode(workflowId: number, node: WorkflowNode) {
    const workflow = getWorkflowById(workflowId);
    if (workflow) {
      workflow.definition.nodes.push(node);
      workflow.updatedAt = new Date();
      // Note: Changes are only saved when explicitly calling updateWorkflow
    }
  }

  function updateNode(workflowId: number, nodeId: string, updates: Partial<WorkflowNode>) {
    const workflow = getWorkflowById(workflowId);
    if (workflow) {
      const node = workflow.definition.nodes.find((n: WorkflowNode) => n.id === nodeId);
      if (node) {
        Object.assign(node, updates);
        workflow.updatedAt = new Date();
        // Note: Changes are only saved when explicitly calling updateWorkflow
      }
    }
  }

  function removeNode(workflowId: number, nodeId: string) {
    const workflow = getWorkflowById(workflowId);
    if (workflow) {
      // Remove node
      const nodeIndex = workflow.definition.nodes.findIndex((n: WorkflowNode) => n.id === nodeId);
      if (nodeIndex > -1) {
        workflow.definition.nodes.splice(nodeIndex, 1);
      }

      // Remove connected edges
      workflow.definition.edges = workflow.definition.edges.filter(
        (e: WorkflowEdge) => e.source !== nodeId && e.target !== nodeId
      );

      workflow.updatedAt = new Date();
      // Note: Changes are only saved when explicitly calling updateWorkflow
    }
  }

  function addEdge(workflowId: number, edge: WorkflowEdge) {
    const workflow = getWorkflowById(workflowId);
    if (workflow) {
      workflow.definition.edges.push(edge);
      workflow.updatedAt = new Date();
      // Note: Changes are only saved when explicitly calling updateWorkflow
    }
  }

  function removeEdge(workflowId: number, edgeId: string) {
    const workflow = getWorkflowById(workflowId);
    if (workflow) {
      const index = workflow.definition.edges.findIndex((e: WorkflowEdge) => e.id === edgeId);
      if (index > -1) {
        workflow.definition.edges.splice(index, 1);
        workflow.updatedAt = new Date();
        // Note: Changes are only saved when explicitly calling updateWorkflow
      }
    }
  }

  // LocalStorage removed - Backend is now the source of truth

  // Snapshot Management (with localStorage backup)
  function createSnapshot(workflowId: number) {
    const workflow = getWorkflowById(workflowId);
    if (workflow) {
      workflowSnapshot.value = JSON.parse(JSON.stringify(workflow));
      // Backup to localStorage
      try {
        localStorage.setItem('workflow_snapshot', JSON.stringify({
          workflowId,
          snapshot: workflowSnapshot.value,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error('Failed to save snapshot to localStorage:', error);
      }
    }
  }

  async function revertToSnapshot() {
    if (workflowSnapshot.value && currentWorkflowId.value) {
      // Revert by updating with snapshot data
      await updateWorkflow(currentWorkflowId.value, workflowSnapshot.value);
      clearSnapshot();
    }
  }

  function clearSnapshot() {
    workflowSnapshot.value = null;
    // Remove from localStorage
    try {
      localStorage.removeItem('workflow_snapshot');
    } catch (error) {
      console.error('Failed to remove snapshot from localStorage:', error);
    }
  }

  function loadSnapshotFromLocalStorage(): { workflowId: number; snapshot: Workflow; timestamp: number } | null {
    try {
      const stored = localStorage.getItem('workflow_snapshot');
      if (stored) {
        const data = JSON.parse(stored);
        // Check if snapshot is not too old (e.g., 24 hours)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        if (Date.now() - data.timestamp < maxAge) {
          return data;
        } else {
          // Remove old snapshot
          localStorage.removeItem('workflow_snapshot');
        }
      }
    } catch (error) {
      console.error('Failed to load snapshot from localStorage:', error);
      localStorage.removeItem('workflow_snapshot');
    }
    return null;
  }

  function restoreSnapshot(data: { workflowId: number; snapshot: Workflow }) {
    workflowSnapshot.value = data.snapshot;
    currentWorkflowId.value = data.workflowId;
  }

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

    // Actions - Backend
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    setCurrentWorkflow,
    
    // Actions - Local modifications (saved on updateWorkflow)
    addNode,
    updateNode,
    removeNode,
    addEdge,
    removeEdge,
    
    // Actions - Snapshot
    createSnapshot,
    revertToSnapshot,
    clearSnapshot,
    loadSnapshotFromLocalStorage,
    restoreSnapshot,
  };
});
