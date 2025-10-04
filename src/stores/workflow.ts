import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Workflow, WorkflowNode, WorkflowEdge } from '@/types/workflow.types';
<<<<<<< Updated upstream
=======
import { useHistoryStore } from './history';
import { deepClone } from '@/utils/clone';
>>>>>>> Stashed changes

export const useWorkflowStore = defineStore('workflow', () => {
  // State
  const workflows = ref<Workflow[]>([]);
  const currentWorkflowId = ref<string | null>(null);

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
<<<<<<< Updated upstream
    const workflow = getWorkflowById(id);
    if (workflow) {
      Object.assign(workflow, updates);
      workflow.updatedAt = new Date();
      saveToLocalStorage();
=======
    const index = workflows.value.findIndex((w) => w.id === id);
    if (index > -1) {
      // Replace the entire workflow object to trigger reactivity
      workflows.value[index] = {
        ...workflows.value[index],
        ...updates,
        updatedAt: new Date(),
      };
      // Save to localStorage without history (history is saved explicitly by operations)
      saveToLocalStorage(false);
    }
  }

  /**
   * Replace a workflow completely (used for undo/redo)
   * Does not save to history or update timestamps
   */
  function replaceWorkflow(workflow: Workflow) {
    console.log('[Workflow] replaceWorkflow called with workflow:', workflow.id, workflow.name);
    const index = workflows.value.findIndex((w) => w.id === workflow.id);
    console.log('[Workflow] Found workflow at index:', index);
    if (index > -1) {
      const current = workflows.value[index];
      
      // Replace nodes and edges arrays completely to trigger Vue reactivity
      current.definition.nodes = [...workflow.definition.nodes];
      current.definition.edges = [...workflow.definition.edges];
      current.definition.metadata = { ...workflow.definition.metadata };
      
      console.log('[Workflow] Workflow definition replaced, nodes:', current.definition.nodes.length, 'edges:', current.definition.edges.length);
      saveToLocalStorage(false);
>>>>>>> Stashed changes
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
    console.log('[Workflow] setCurrentWorkflow called with id:', id);
    currentWorkflowId.value = id;
<<<<<<< Updated upstream
=======
    
    // Clear history and take snapshot when workflow is loaded
    if (id) {
      const workflow = getWorkflowById(id);
      if (workflow) {
        const historyStore = useHistoryStore();
        console.log('[Workflow] Clearing history and taking snapshot');
        historyStore.clearHistory();
        historyStore.takeSnapshot(workflow);
        console.log('[Workflow] Snapshot taken, undoStack size:', historyStore.undoStackSize);
      }
    }
>>>>>>> Stashed changes
  }

  function addNode(workflowId: string, node: WorkflowNode) {
    const workflow = getWorkflowById(workflowId);
    if (workflow) {
<<<<<<< Updated upstream
      workflow.definition.nodes.push(node);
      workflow.updatedAt = new Date();
=======
      // Create new nodes array (triggers reactivity)
      const nodes = [...workflow.definition.nodes, node];
      
      updateWorkflow(workflowId, {
        definition: {
          ...workflow.definition,
          nodes,
        }
      });
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
        saveToLocalStorage();
=======
        // Don't save to history - let the caller decide (e.g., debounced in WorkflowEditor)
        saveToLocalStorage(false);
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream

      // Remove connected edges
      workflow.definition.edges = workflow.definition.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      );

      workflow.updatedAt = new Date();
      saveToLocalStorage();
    }
=======
    });
    saveToLocalStorage();
>>>>>>> Stashed changes
  }

  function addEdge(workflowId: string, edge: WorkflowEdge) {
    const workflow = getWorkflowById(workflowId);
    if (workflow) {
<<<<<<< Updated upstream
      workflow.definition.edges.push(edge);
      workflow.updatedAt = new Date();
=======
      // Create new edges array (triggers reactivity)
      const edges = [...workflow.definition.edges, edge];
      
      updateWorkflow(workflowId, {
        definition: {
          ...workflow.definition,
          edges,
        }
      });
>>>>>>> Stashed changes
      saveToLocalStorage();
    }
  }

  function removeEdge(workflowId: string, edgeId: string) {
    const workflow = getWorkflowById(workflowId);
    if (workflow) {
<<<<<<< Updated upstream
      const index = workflow.definition.edges.findIndex((e) => e.id === edgeId);
      if (index > -1) {
        workflow.definition.edges.splice(index, 1);
        workflow.updatedAt = new Date();
        saveToLocalStorage();
      }
=======
      // Create new edges array without the removed edge (triggers reactivity)
      const edges = workflow.definition.edges.filter((e) => e.id !== edgeId);
      
      updateWorkflow(workflowId, {
        definition: {
          ...workflow.definition,
          edges,
        }
      });
      saveToLocalStorage();
>>>>>>> Stashed changes
    }
  }

  // LocalStorage
  function saveToLocalStorage(saveHistory: boolean = true) {
    try {
      localStorage.setItem('workflows', JSON.stringify(workflows.value));
      
      // Save current workflow to history after persisting (if requested)
      if (saveHistory && currentWorkflowId.value) {
        const workflow = getWorkflowById(currentWorkflowId.value);
        if (workflow) {
          console.log('[Workflow] saveToLocalStorage: saving to history');
          const historyStore = useHistoryStore();
          historyStore.saveState(deepClone(workflow));
          console.log('[Workflow] saveToLocalStorage: undoStack size:', historyStore.undoStackSize);
        }
      }
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
        // Save migrated workflows (without history)
        saveToLocalStorage(false);
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

  // Initialize
  loadFromLocalStorage();

  return {
    // State
    workflows,
    currentWorkflowId,

    // Getters
    currentWorkflow,
    getWorkflowById,
    getAllWorkflows,

    // Actions
    createWorkflow,
    addWorkflow,
    updateWorkflow,
    replaceWorkflow,
    deleteWorkflow,
    setCurrentWorkflow,
    addNode,
    updateNode,
    removeNode,
    addEdge,
    removeEdge,
    loadFromLocalStorage,
    clearAllWorkflows,
  };
});

// Helper
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
