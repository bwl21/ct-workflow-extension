import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { WorkflowExecution, StepHistory } from '@/types/workflow.types';
import { ExecutionStatus, StepStatus, NodeType } from '@/types/workflow.types';
import { useWorkflowStore } from './workflow';

export const useExecutionStore = defineStore('execution', () => {
  // State
  const executions = ref<WorkflowExecution[]>([]);
  const currentExecutionId = ref<string | null>(null);

  // Getters
  const currentExecution = computed(() => {
    if (!currentExecutionId.value) return null;
    return executions.value.find((e) => e.id === currentExecutionId.value) || null;
  });

  const currentNode = computed(() => {
    if (!currentExecution.value) return null;
    const workflowStore = useWorkflowStore();
    const workflow = workflowStore.getWorkflowById(currentExecution.value.workflowId);
    if (!workflow) return null;
    return workflow.nodes.find((n) => n.id === currentExecution.value!.currentNodeId) || null;
  });

  // Actions
  function startExecution(workflowId: string, userId: string = 'demo-user'): WorkflowExecution {
    const workflowStore = useWorkflowStore();
    const workflow = workflowStore.getWorkflowById(workflowId);

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Find start node
    const startNode = workflow.nodes.find((n) => n.type === NodeType.START);
    if (!startNode) {
      throw new Error('No start node found');
    }

    const execution: WorkflowExecution = {
      id: generateId(),
      workflowId,
      currentNodeId: startNode.id,
      context: {
        variables: {},
        userId,
        timestamp: new Date(),
      },
      history: [],
      status: ExecutionStatus.RUNNING,
      startedAt: new Date(),
    };

    executions.value.push(execution);
    currentExecutionId.value = execution.id;

    // Move to first real node
    moveToNextNode(execution.id);

    return execution;
  }

  function completeStep(executionId: string, inputs: Record<string, any>) {
    const execution = executions.value.find((e) => e.id === executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    const workflowStore = useWorkflowStore();
    const workflow = workflowStore.getWorkflowById(execution.workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const currentNode = workflow.nodes.find((n) => n.id === execution.currentNodeId);
    if (!currentNode) {
      throw new Error('Current node not found');
    }

    // Add to history
    const historyEntry: StepHistory = {
      id: generateId(),
      nodeId: currentNode.id,
      nodeName: currentNode.label,
      timestamp: new Date(),
      inputs,
      outputs: {},
      status: StepStatus.SUCCESS,
    };
    execution.history.push(historyEntry);

    // Update context with inputs
    execution.context.variables = {
      ...execution.context.variables,
      ...inputs,
    };

    // Move to next node
    moveToNextNode(executionId);
  }

  function moveToNextNode(executionId: string) {
    const execution = executions.value.find((e) => e.id === executionId);
    if (!execution) return;

    const workflowStore = useWorkflowStore();
    const workflow = workflowStore.getWorkflowById(execution.workflowId);
    if (!workflow) return;

    const currentNode = workflow.nodes.find((n) => n.id === execution.currentNodeId);
    if (!currentNode) return;

    // Find outgoing edge
    const outgoingEdge = workflow.edges.find((e) => e.source === currentNode.id);

    if (!outgoingEdge) {
      // No more nodes, complete workflow
      execution.status = ExecutionStatus.COMPLETED;
      execution.completedAt = new Date();
      return;
    }

    const nextNode = workflow.nodes.find((n) => n.id === outgoingEdge.target);
    if (!nextNode) return;

    // Check if next node is END
    if (nextNode.type === NodeType.END) {
      execution.status = ExecutionStatus.COMPLETED;
      execution.completedAt = new Date();
      return;
    }

    // Move to next node
    execution.currentNodeId = nextNode.id;
  }

  function cancelExecution(executionId: string) {
    const execution = executions.value.find((e) => e.id === executionId);
    if (execution) {
      execution.status = ExecutionStatus.CANCELLED;
    }
  }

  function setCurrentExecution(id: string | null) {
    currentExecutionId.value = id;
  }

  return {
    // State
    executions,
    currentExecutionId,

    // Getters
    currentExecution,
    currentNode,

    // Actions
    startExecution,
    completeStep,
    cancelExecution,
    setCurrentExecution,
  };
});

// Helper
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
