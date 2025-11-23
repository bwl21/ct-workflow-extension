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
  const currentNodeId = ref<string | null>(null); // Separate reactive ref for current node

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

  // Validation helper
  function validateWorkflowForExecution(workflow: any): string[] {
    const errors: string[] = [];
    const definition = workflow.definition;
    
    // Check for START node
    const startNodes = definition.nodes.filter((n: any) => n.type === NodeType.START);
    if (startNodes.length === 0) {
      errors.push('⛔ Workflow hat keinen START Node.');
    } else if (startNodes.length > 1) {
      errors.push(`⛔ Workflow hat ${startNodes.length} START Nodes. Es darf nur einen geben.`);
    }
    
    // Check for nodes with multiple incoming edges (except JOIN nodes)
    definition.nodes.forEach((node: any) => {
      if (node.type === NodeType.JOIN) return;
      
      const incomingEdges = definition.edges.filter((e: any) => e.target === node.id);
      if (incomingEdges.length > 1) {
        errors.push(`⛔ Node "${node.label}" hat ${incomingEdges.length} eingehende Verbindungen ohne JOIN Node.`);
      }
    });
    
    return errors;
  }

  // Actions
  function startExecution(workflowId: number, userId: string = 'demo-user'): WorkflowExecution {
    const workflowStore = useWorkflowStore();
    const workflow = workflowStore.getWorkflowById(workflowId);

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Validate workflow before execution
    const validationErrors = validateWorkflowForExecution(workflow);
    if (validationErrors.length > 0) {
      const errorMessage = 'Workflow-Validierung fehlgeschlagen:\n\n' + validationErrors.join('\n');
      console.error('[Execution] Validation failed:', validationErrors);
      throw new Error(errorMessage);
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
    currentNodeId.value = startNode.id; // Initialize reactive ref

    // Move to first real node
    moveToNextNode(execution.id);

    return execution;
  }

  function completeStep(executionId: string, inputs: Record<string, any>) {
    console.log('[Execution] completeStep called for execution:', executionId);
    console.log('[Execution] Step inputs:', inputs);
    
    let execution: WorkflowExecution | undefined;
    for (const executions of executionsByWorkflow.value.values()) {
      execution = executions.find((e) => e.id === executionId);
      if (execution) break;
    }
    
    if (!execution) {
      throw new Error('Execution not found');
    }
    
    console.log('[Execution] Current execution:', execution);
    console.log('[Execution] Current node ID:', execution.currentNodeId);

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
    console.log('[Execution] moveToNextNode called for execution:', executionId);
    
    let execution: WorkflowExecution | undefined;
    for (const executions of executionsByWorkflow.value.values()) {
      execution = executions.find((e) => e.id === executionId);
      if (execution) break;
    }
    
    if (!execution) {
      console.error('[Execution] Execution not found in moveToNextNode');
      return;
    }
    
    console.log('[Execution] Current node before move:', execution.currentNodeId);

    const workflowStore = useWorkflowStore();
    const workflow = workflowStore.getWorkflowById(execution.workflowId);
    if (!workflow) return;

    const currentNode = workflow.definition.nodes.find((n) => n.id === execution.currentNodeId);
    if (!currentNode) {
      console.error('[Execution] Current node not found:', execution.currentNodeId);
      return;
    }
    
    console.log('[Execution] Current node:', currentNode);

    // Find outgoing edges
    const outgoingEdges = workflow.definition.edges.filter((e) => e.source === currentNode.id);
    console.log('[Execution] Outgoing edges:', outgoingEdges);

    if (outgoingEdges.length === 0) {
      // No more nodes, complete workflow
      console.log('[Execution] No outgoing edges, completing workflow');
      execution.status = ExecutionStatus.COMPLETED;
      execution.completedAt = new Date();
      return;
    }

    let selectedEdges: typeof outgoingEdges = [];

    // For DECISION nodes: evaluate conditions from node outputs
    if (currentNode.type === NodeType.DECISION) {
      console.log('[Execution] Decision node evaluation started');
      console.log('[Execution] Current node:', currentNode);
      console.log('[Execution] Outgoing edges:', outgoingEdges);
      
      const outputs = currentNode.data.outputs || [
        { id: 'true', label: 'JA', isDefault: false },
        { id: 'false', label: 'NEIN', isDefault: true }
      ];
      
      console.log('[Execution] Decision outputs:', outputs);

      // Try to find an output whose condition is met
      let selectedOutput = null;
      for (const output of outputs) {
        console.log('[Execution] Checking output:', output);
        if (output.condition) {
          console.log('[Execution] Evaluating condition:', output.condition);
          const conditionMet = evaluateRules(
            output.condition.engine,
            output.condition.rule,
            execution.context.variables
          );
          console.log('[Execution] Condition result:', conditionMet);
          
          if (conditionMet) {
            selectedOutput = output;
            console.log('[Execution] Selected output (condition met):', selectedOutput);
            break;
          }
        }
      }

      // If no condition matched, use default output
      if (!selectedOutput) {
        selectedOutput = outputs.find(o => o.isDefault);
        console.log('[Execution] Selected output (default):', selectedOutput);
      }

      // Find edge that uses this output
      if (selectedOutput) {
        const edge = outgoingEdges.find(e => e.sourceHandle === selectedOutput.id);
        console.log('[Execution] Looking for edge with sourceHandle:', selectedOutput.id);
        console.log('[Execution] Found edge:', edge);
        if (edge) {
          selectedEdges = [edge];
        }
      }

      // If still no edge, log error and complete
      if (selectedEdges.length === 0) {
        console.error('[Execution] No matching output edge found for decision node');
        console.error('[Execution] Available edges:', outgoingEdges);
        console.error('[Execution] Selected output:', selectedOutput);
        execution.status = ExecutionStatus.FAILED;
        execution.completedAt = new Date();
        return;
      }
      
      console.log('[Execution] Selected edges:', selectedEdges);
    } else {
      // For non-decision nodes: use ALL edges (sequential execution)
      console.log('[Execution] Non-decision node, using all edges');
      selectedEdges = outgoingEdges;
      console.log('[Execution] Selected edges for non-decision:', selectedEdges);
    }

    console.log('[Execution] About to initialize queue');
    // Initialize execution queue if not exists
    if (!execution.context.nodeQueue) {
      execution.context.nodeQueue = [];
      console.log('[Execution] Initialized empty queue');
    } else {
      console.log('[Execution] Queue already exists:', execution.context.nodeQueue);
    }

    console.log('[Execution] Adding edges to queue, count:', selectedEdges.length);
    // Add all target nodes to queue (in reverse order, so first edge is processed first)
    for (let i = selectedEdges.length - 1; i >= 0; i--) {
      const edge = selectedEdges[i];
      console.log('[Execution] Processing edge:', edge);
      const nextNode = workflow.definition.nodes.find((n) => n.id === edge.target);
      console.log('[Execution] Found next node:', nextNode);
      if (nextNode) {
        execution.context.nodeQueue.push(nextNode.id);
        console.log('[Execution] Added to queue:', nextNode.id);
      }
    }

    console.log('[Execution] Final queue:', execution.context.nodeQueue);
    console.log('[Execution] Calling processNextFromQueue');
    // Process next node from queue
    processNextFromQueue(executionId);
  }

  function processNextFromQueue(executionId: string) {
    console.log('[Execution] processNextFromQueue called');
    
    let execution: WorkflowExecution | undefined;
    for (const executions of executionsByWorkflow.value.values()) {
      execution = executions.find((e) => e.id === executionId);
      if (execution) break;
    }
    
    if (!execution) {
      console.error('[Execution] Execution not found in processNextFromQueue');
      return;
    }

    const workflowStore = useWorkflowStore();
    const workflow = workflowStore.getWorkflowById(execution.workflowId);
    if (!workflow) {
      console.error('[Execution] Workflow not found in processNextFromQueue');
      return;
    }

    console.log('[Execution] Current queue:', execution.context.nodeQueue);

    // Check if queue exists and has items
    if (!execution.context.nodeQueue || execution.context.nodeQueue.length === 0) {
      // Queue empty, workflow complete
      console.log('[Execution] Queue empty, completing workflow');
      execution.status = ExecutionStatus.COMPLETED;
      execution.completedAt = new Date();
      execution.currentNodeId = null; // Clear current node when workflow completes
      currentNodeId.value = null; // Update reactive ref
      return;
    }

    // Get next node from queue
    const nextNodeId = execution.context.nodeQueue.shift();
    console.log('[Execution] Next node ID from queue:', nextNodeId);
    
    if (!nextNodeId) return;

    const nextNode = workflow.definition.nodes.find((n) => n.id === nextNodeId);
    if (!nextNode) {
      // Node not found, continue with next in queue
      console.error('[Execution] Next node not found:', nextNodeId);
      processNextFromQueue(executionId);
      return;
    }
    
    console.log('[Execution] Next node:', nextNode.label);

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

    // Check for multiple incoming edges - require explicit JOIN node
    const incomingEdges = workflow.definition.edges.filter((e) => e.target === nextNode.id);
    console.log('[Execution] Checking incoming edges:', incomingEdges.length);
    
    if (incomingEdges.length > 1) {
      // Multiple incoming edges require explicit JOIN node
      console.error('[Execution] Node has multiple incoming edges without JOIN node:', nextNode.label);
      console.error('[Execution] Incoming edges:', incomingEdges);
      execution.status = ExecutionStatus.FAILED;
      execution.completedAt = new Date();
      // Store error message for UI
      if (!execution.context.error) {
        execution.context.error = `Node "${nextNode.label}" hat ${incomingEdges.length} eingehende Verbindungen. Bitte füge einen JOIN Node davor ein.`;
      }
      return;
    }

    // Move to next node
    console.log('[Execution] Moving to node (no join):', nextNode.label);
    console.log('[Execution] Setting currentNodeId to:', nextNode.id);
    execution.currentNodeId = nextNode.id;
    currentNodeId.value = nextNode.id; // Update reactive ref
    console.log('[Execution] currentNodeId is now:', execution.currentNodeId);
  }

  // handleImplicitJoin removed - we now require explicit JOIN nodes
  // Multiple incoming edges without JOIN node will cause execution to fail

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
      currentNodeId.value = joinNodeId; // Update reactive ref
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
    currentNodeId,

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
