import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { WorkflowExecution, StepHistory } from '@/types/workflow.types';
import { ExecutionStatus, StepStatus, NodeType, JoinMode } from '@/types/workflow.types';
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

    // Check if there are nodes in queue (multi-edge scenario)
    if (execution.context.nodeQueue && execution.context.nodeQueue.length > 0) {
      // Continue with next node from queue
      processNextFromQueue(executionId);
    } else {
      // Move to next node (will populate queue if multiple edges)
      moveToNextNode(executionId);
    }
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

    let selectedEdges: typeof outgoingEdges = [];

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
        const edge = outgoingEdges.find(e => e.sourceHandle === selectedOutput.id);
        if (edge) {
          selectedEdges = [edge];
        }
      }

      // If still no edge, log error and complete
      if (selectedEdges.length === 0) {
        console.error('No matching output edge found for decision node');
        execution.status = ExecutionStatus.FAILED;
        execution.completedAt = new Date();
        return;
      }
    } else {
      // For non-decision nodes: use ALL edges (sequential execution)
      selectedEdges = outgoingEdges;
    }

    // Initialize execution queue if not exists
    if (!execution.context.nodeQueue) {
      execution.context.nodeQueue = [];
    }

    // Add all target nodes to queue (in reverse order, so first edge is processed first)
    for (let i = selectedEdges.length - 1; i >= 0; i--) {
      const edge = selectedEdges[i];
      const nextNode = workflow.definition.nodes.find((n) => n.id === edge.target);
      if (nextNode) {
        execution.context.nodeQueue.push(nextNode.id);
      }
    }

    // Process next node from queue
    processNextFromQueue(executionId);
  }

  function processNextFromQueue(executionId: string) {
    let execution: WorkflowExecution | undefined;
    for (const executions of executionsByWorkflow.value.values()) {
      execution = executions.find((e) => e.id === executionId);
      if (execution) break;
    }
    
    if (!execution) return;

    const workflowStore = useWorkflowStore();
    const workflow = workflowStore.getWorkflowById(execution.workflowId);
    if (!workflow) return;

    // Check if queue exists and has items
    if (!execution.context.nodeQueue || execution.context.nodeQueue.length === 0) {
      // Queue empty, workflow complete
      execution.status = ExecutionStatus.COMPLETED;
      execution.completedAt = new Date();
      return;
    }

    // Get next node from queue
    const nextNodeId = execution.context.nodeQueue.shift();
    if (!nextNodeId) return;

    const nextNode = workflow.definition.nodes.find((n) => n.id === nextNodeId);
    if (!nextNode) {
      // Node not found, continue with next in queue
      processNextFromQueue(executionId);
      return;
    }

    // Check if next node is END
    if (nextNode.type === NodeType.END) {
      // Check if there are more nodes in queue
      if (execution.context.nodeQueue.length > 0) {
        // Continue with next node
        processNextFromQueue(executionId);
      } else {
        // No more nodes, complete workflow
        execution.status = ExecutionStatus.COMPLETED;
        execution.completedAt = new Date();
      }
      return;
    }

    // Check if next node is JOIN (explicit)
    if (nextNode.type === NodeType.JOIN) {
      handleJoinNode(executionId, nextNode.id);
      return;
    }

    // Check for implicit join: Does this node have multiple incoming edges?
    const incomingEdges = workflow.definition.edges.filter((e) => e.target === nextNode.id);
    if (incomingEdges.length > 1) {
      // Implicit join - treat like JOIN node with AND mode
      handleImplicitJoin(executionId, nextNode.id, incomingEdges.length);
      return;
    }

    // Move to next node
    execution.currentNodeId = nextNode.id;
  }

  function handleImplicitJoin(executionId: string, nodeId: string, expectedBranches: number) {
    let execution: WorkflowExecution | undefined;
    for (const executions of executionsByWorkflow.value.values()) {
      execution = executions.find((e) => e.id === executionId);
      if (execution) break;
    }
    
    if (!execution) return;

    const workflowStore = useWorkflowStore();
    const workflow = workflowStore.getWorkflowById(execution.workflowId);
    if (!workflow) return;

    // Initialize joinStates if not exists
    if (!execution.context.joinStates) {
      execution.context.joinStates = {};
    }

    // Initialize or update JOIN state
    if (!execution.context.joinStates[nodeId]) {
      execution.context.joinStates[nodeId] = {
        nodeId,
        expectedBranches,
        completedBranches: 0,
        branchData: [],
      };
    }

    const joinState = execution.context.joinStates[nodeId];

    // Mark this branch as completed
    joinState.completedBranches++;
    joinState.branchData.push({ ...execution.context.variables });

    // Check if all branches have arrived (implicit AND mode)
    if (joinState.completedBranches >= joinState.expectedBranches) {
      // All branches complete - merge data and continue
      
      // Merge all branch data into context
      for (const branchData of joinState.branchData) {
        execution.context.variables = {
          ...execution.context.variables,
          ...branchData,
        };
      }

      // Reset JOIN state for potential re-execution
      delete execution.context.joinStates[nodeId];

      // Move to this node (implicit join complete)
      execution.currentNodeId = nodeId;
    } else {
      // Not all branches arrived yet - continue with next in queue
      processNextFromQueue(executionId);
    }
  }

  function handleJoinNode(executionId: string, joinNodeId: string) {
    let execution: WorkflowExecution | undefined;
    for (const executions of executionsByWorkflow.value.values()) {
      execution = executions.find((e) => e.id === executionId);
      if (execution) break;
    }
    
    if (!execution) return;

    const workflowStore = useWorkflowStore();
    const workflow = workflowStore.getWorkflowById(execution.workflowId);
    if (!workflow) return;

    const joinNode = workflow.definition.nodes.find((n) => n.id === joinNodeId);
    if (!joinNode) return;

    // Get JOIN mode (default: AND)
    const joinMode = joinNode.data.joinMode || JoinMode.AND;

    // Initialize joinStates if not exists
    if (!execution.context.joinStates) {
      execution.context.joinStates = {};
    }

    // Count how many incoming edges this JOIN node has
    const incomingEdges = workflow.definition.edges.filter((e) => e.target === joinNodeId);
    const expectedBranches = incomingEdges.length;

    // Initialize or update JOIN state
    if (!execution.context.joinStates[joinNodeId]) {
      execution.context.joinStates[joinNodeId] = {
        nodeId: joinNodeId,
        expectedBranches,
        completedBranches: 0,
        branchData: [],
      };
    }

    const joinState = execution.context.joinStates[joinNodeId];

    // Mark this branch as completed
    joinState.completedBranches++;
    joinState.branchData.push({ ...execution.context.variables });

    // Check if JOIN condition is met
    let shouldContinue = false;

    if (joinMode === JoinMode.OR) {
      // OR mode: Continue as soon as ONE branch arrives
      shouldContinue = true;
    } else {
      // AND mode: Wait for ALL branches
      shouldContinue = joinState.completedBranches >= joinState.expectedBranches;
    }

    if (shouldContinue) {
      // Condition met - merge data and continue
      
      // Merge all branch data into context
      // Later branches overwrite earlier ones if same keys exist
      for (const branchData of joinState.branchData) {
        execution.context.variables = {
          ...execution.context.variables,
          ...branchData,
        };
      }

      // Add to history
      const historyEntry: StepHistory = {
        id: generateId(),
        nodeId: joinNodeId,
        nodeName: joinNode.label || 'JOIN',
        timestamp: new Date(),
        inputs: {},
        outputs: { 
          mode: joinMode,
          mergedBranches: joinState.completedBranches,
          expectedBranches: joinState.expectedBranches 
        },
        status: StepStatus.SUCCESS,
      };
      execution.history.push(historyEntry);

      // Reset JOIN state for potential re-execution
      delete execution.context.joinStates[joinNodeId];

      // Move to next node after JOIN
      execution.currentNodeId = joinNodeId;
      moveToNextNode(executionId);
    } else {
      // Not all branches arrived yet (AND mode) - continue with next in queue
      processNextFromQueue(executionId);
    }
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
