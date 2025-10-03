import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Workflow, WorkflowNode, WorkflowEdge } from '@/types/workflow.types';
import { NodeType } from '@/types/workflow.types';

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
  function createWorkflow(name: string, description: string): Workflow {
    const workflow: Workflow = {
      id: generateId(),
      name,
      description,
      nodes: [],
      edges: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    workflows.value.push(workflow);
    currentWorkflowId.value = workflow.id;

    // Speichern in localStorage
    saveToLocalStorage();

    return workflow;
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
      workflow.nodes.push(node);
      workflow.updatedAt = new Date();
      saveToLocalStorage();
    }
  }

  function updateNode(workflowId: string, nodeId: string, updates: Partial<WorkflowNode>) {
    const workflow = getWorkflowById(workflowId);
    if (workflow) {
      const node = workflow.nodes.find((n) => n.id === nodeId);
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
      const nodeIndex = workflow.nodes.findIndex((n) => n.id === nodeId);
      if (nodeIndex > -1) {
        workflow.nodes.splice(nodeIndex, 1);
      }

      // Remove connected edges
      workflow.edges = workflow.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      );

      workflow.updatedAt = new Date();
      saveToLocalStorage();
    }
  }

  function addEdge(workflowId: string, edge: WorkflowEdge) {
    const workflow = getWorkflowById(workflowId);
    if (workflow) {
      workflow.edges.push(edge);
      workflow.updatedAt = new Date();
      saveToLocalStorage();
    }
  }

  function removeEdge(workflowId: string, edgeId: string) {
    const workflow = getWorkflowById(workflowId);
    if (workflow) {
      const index = workflow.edges.findIndex((e) => e.id === edgeId);
      if (index > -1) {
        workflow.edges.splice(index, 1);
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
        // Convert date strings back to Date objects
        workflows.value = parsed.map((w: any) => ({
          ...w,
          createdAt: new Date(w.createdAt),
          updatedAt: new Date(w.updatedAt),
        }));
      }
    } catch (error) {
      console.error('Failed to load workflows from localStorage:', error);
    }
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

    // Actions
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    setCurrentWorkflow,
    addNode,
    updateNode,
    removeNode,
    addEdge,
    removeEdge,
    loadFromLocalStorage,
  };
});

// Helper
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
