import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Workflow, WorkflowNode, WorkflowEdge } from '@/types/workflow.types';
import { useWorkflows } from '@/composables/useWorkflows';

export const useWorkflowStore = defineStore('workflow', () => {
  // Backend workflows composable
  const backendWorkflows = useWorkflows();
  
  // State
  const currentWorkflowId = ref<number | null>(null);
  const isSaving = ref(false);

  // Workflows direkt aus backendWorkflows (reaktiv!)
  const workflows = computed(() => {
    const data = backendWorkflows.workflows.value || [];
    
    // Konvertiere zu Workflow-Format
    return data.map((cat: any): Workflow => {
      const definition = cat.data || { version: '1.0.0', nodes: [], edges: [], metadata: {} };
      
      return {
        id: cat.id,
        name: cat.name,
        description: definition.metadata?.description || '',
        category: definition.metadata?.category || 'Allgemein',
        definition,
        createdAt: new Date(definition.metadata?.createdAt || Date.now()),
        updatedAt: new Date(definition.metadata?.updatedAt || Date.now()),
        createdBy: definition.metadata?.createdBy || 'unknown',
        valueId: cat.valueId
      };
    });
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

  // Note: loadWorkflows() is no longer needed - workflows are loaded automatically via useWorkflows

  // Save workflow to backend
  async function saveWorkflow(id: number) {
    const workflow = getWorkflowById(id);
    if (!workflow) throw new Error('Workflow not found');
    
    isSaving.value = true;
    try {
      console.log('[workflowStore] Saving workflow to backend:', workflow);
      
      const definition = {
        ...workflow.definition,
        metadata: {
          ...workflow.definition.metadata,
          description: workflow.description,
          category: workflow.category,
          updatedAt: new Date().toISOString()
        }
      };
      
      await backendWorkflows.updateWorkflow(id, definition);
      console.log('[workflowStore] Workflow saved successfully');
      
      // Note: No need to reload - workflows computed property is reactive
    } catch (error) {
      console.error('[workflowStore] Failed to save workflow:', error);
      throw error;
    } finally {
      isSaving.value = false;
    }
  }

  // Actions
  async function createWorkflow(name: string, description: string, category: string = 'Allgemein') {
    const definition = {
      version: '1.0.0',
      nodes: [],
      edges: [],
      metadata: {
        description,
        category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'current-user'
      }
    };

    return await backendWorkflows.createWorkflow(name, definition);
    // Note: No need to reload - workflows computed property is reactive
  }

  function getAllWorkflows(): Workflow[] {
    return workflows.value;
  }

  function updateWorkflow(id: number, updates: Partial<Workflow>) {
    const workflow = getWorkflowById(id);
    if (workflow) {
      Object.assign(workflow, updates);
      workflow.updatedAt = new Date();
      // Note: Call saveWorkflow() manually to persist to backend
    }
  }

  async function deleteWorkflow(id: number) {
    await backendWorkflows.deleteWorkflow(id);
    // Note: No need to reload - workflows computed property is reactive
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
    }
  }

  function updateNode(workflowId: number, nodeId: string, updates: Partial<WorkflowNode>) {
    const workflow = getWorkflowById(workflowId);
    if (workflow) {
      const node = workflow.definition.nodes.find((n) => n.id === nodeId);
      if (node) {
        Object.assign(node, updates);
        workflow.updatedAt = new Date();
      }
    }
  }

  function removeNode(workflowId: number, nodeId: string) {
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
    }
  }

  function addEdge(workflowId: number, edge: WorkflowEdge) {
    const workflow = getWorkflowById(workflowId);
    if (workflow) {
      workflow.definition.edges.push(edge);
      workflow.updatedAt = new Date();
    }
  }

  function removeEdge(workflowId: number, edgeId: string) {
    const workflow = getWorkflowById(workflowId);
    if (workflow) {
      const index = workflow.definition.edges.findIndex((e) => e.id === edgeId);
      if (index > -1) {
        workflow.definition.edges.splice(index, 1);
        workflow.updatedAt = new Date();
      }
    }
  }

  return {
    // State
    workflows,
    currentWorkflowId,
    isLoading,
    isSaving,

    // Getters
    currentWorkflow,
    getWorkflowById,
    getAllWorkflows,

    // Actions - Backend
    saveWorkflow,
    createWorkflow,
    deleteWorkflow,
    
    // Actions - Local (Editor)
    updateWorkflow,
    setCurrentWorkflow,
    addNode,
    updateNode,
    removeNode,
    addEdge,
    removeEdge,
  };
});


