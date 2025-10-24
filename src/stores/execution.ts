import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { WorkflowExecution, StepHistory } from '@/types/workflow.types';
import { ExecutionStatus, StepStatus, NodeType } from '@/types/workflow.types';
import { useWorkflowStore } from './workflow';
import { evaluateRules } from '@/utils/rule-evaluator';

export const useExecutionStore = defineStore('execution', () => {
  // State - Executions grouped by workflow
  const executionsByWorkflow = ref<Map<number, WorkflowExecution[]>>(new Map());
  const currentExecutionId = ref<string | null>(null);

  // Getters
  const currentExecution = computed(() => {
    if (!currentExecutionId.value) return null;
    for (const executions of executionsByWorkflow.value.values()) {
      const execution = executions.find((e) => e.id === currentExecutionId.value);
      if (execution) return execution;
    }
    return null;
  });

  const currentNode = computed(() => {
    if (!currentExecution.value) return null;
    const workflowStore = useWorkflowStore();
    const workflow = workflowStore.getWorkflowById(currentExecution.value.workflowId);
    if (!workflow) return null;
    return (
      workflow.definition.nodes.find((n) => n.id === currentExecution.value!.currentNodeId) || null
    );
  });

  const getWorkflowExecutions = (workflowId: number): WorkflowExecution[] => {
    return executionsByWorkflow.value.get(workflowId) || [];
  };

  const getAllExecutions = computed(() => {
    const all: WorkflowExecution[] = [];
    for (const executions of executionsByWorkflow.value.values()) {
      all.push(...executions);
    }
    return all;
  });

  // Actions
  function startExecution(workflowId: number, userId: string = 'demo-user'): WorkflowExecution {
    const workflowStore = useWorkflowStore();
    const workflow = workflowStore.getWorkflowById(workflowId);

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Find start node
    const startNode = workflow.definition.nodes.find((n) => n.type === NodeType.START);
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

    // Add to workflow's execution list
    const workflowExecutions = executionsByWorkflow.value.get(workflowId) || [];
    workflowExecutions.push(execution);
    executionsByWorkflow.value.set(workflowId, workflowExecutions);
    
    currentExecutionId.value = execution.id;

    // Move to first real node
    moveToNextNode(execution.id);

    return execution;
  }

  function completeStep(executionId: string, inputs: Record<string, any>) {
    let execution: WorkflowExecution | undefined;
    for (const executions of executionsByWorkflow.value.values()) {
      execution = executions.find((e) => e.id === executionId);
      if (execution) break;
    }
    
    if (!execution) {
      throw new Error('Execution not found');
    }

    const workflowStore = useWorkflowStore();
    const workflow = workflowStore.getWorkflowById(execution.workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const currentNode = workflow.definition.nodes.find((n) => n.id === execution.currentNodeId);
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
    let execution: WorkflowExecution | undefined;
    for (const executions of executionsByWorkflow.value.values()) {
      execution = executions.find((e) => e.id === executionId);
      if (execution) break;
    }
    
    if (!execution) return;

    const workflowStore = useWorkflowStore();
    const workflow = workflowStore.getWorkflowById(execution.workflowId);
    if (!workflow) return;

    const currentNode = workflow.definition.nodes.find((n) => n.id === execution.currentNodeId);
    if (!currentNode) return;

    // Find outgoing edges
    const outgoingEdges = workflow.definition.edges.filter((e) => e.source === currentNode.id);

    if (outgoingEdges.length === 0) {
      // No more nodes, complete workflow
      execution.status = ExecutionStatus.COMPLETED;
      execution.completedAt = new Date();
      return;
    }

    let selectedEdge;

    // For DECISION nodes: evaluate conditions from node outputs
    if (currentNode.type === NodeType.DECISION) {
      const outputs = currentNode.data.outputs || [
        { id: 'true', label: 'JA', isDefault: false },
        { id: 'false', label: 'NEIN', isDefault: true }
      ];

      // Try to find an output whose condition is met
      let selectedOutput = null;
      for (const output of outputs) {
        if (output.condition) {
          const conditionMet = evaluateRules(
            output.condition.engine,
            output.condition.rule,
            execution.context.variables
          );
          
          if (conditionMet) {
            selectedOutput = output;
            break;
          }
        }
      }

      // If no condition matched, use default output
      if (!selectedOutput) {
        selectedOutput = outputs.find(o => o.isDefault);
      }

      // Find edge that uses this output
      if (selectedOutput) {
        selectedEdge = outgoingEdges.find(e => e.sourceHandle === selectedOutput.id);
      }

      // If still no edge, log error and complete
      if (!selectedEdge) {
        console.error('No matching output edge found for decision node');
        execution.status = ExecutionStatus.FAILED;
        execution.completedAt = new Date();
        return;
      }
    } else {
      // For non-decision nodes: use first edge
      selectedEdge = outgoingEdges[0];
    }

    const nextNode = workflow.definition.nodes.find((n) => n.id === selectedEdge.target);
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
    for (const executions of executionsByWorkflow.value.values()) {
      const execution = executions.find((e) => e.id === executionId);
      if (execution) {
        execution.status = ExecutionStatus.CANCELLED;
        return;
      }
    }
  }

  function pauseExecution(executionId: string) {
    for (const executions of executionsByWorkflow.value.values()) {
      const execution = executions.find((e) => e.id === executionId);
      if (execution && execution.status === ExecutionStatus.RUNNING) {
        execution.status = ExecutionStatus.PAUSED;
        return;
      }
    }
  }

  function resumeExecution(executionId: string) {
    for (const executions of executionsByWorkflow.value.values()) {
      const execution = executions.find((e) => e.id === executionId);
      if (execution && execution.status === ExecutionStatus.PAUSED) {
        execution.status = ExecutionStatus.RUNNING;
        return;
      }
    }
  }

  function setCurrentExecution(id: string | null) {
    currentExecutionId.value = id;
  }

  return {
    // State
    executionsByWorkflow,
    currentExecutionId,

    // Getters
    currentExecution,
    currentNode,
    getWorkflowExecutions,
    getAllExecutions,

    // Actions
    startExecution,
    completeStep,
    cancelExecution,
    pauseExecution,
    resumeExecution,
    setCurrentExecution,
  };
});

// Helper
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
