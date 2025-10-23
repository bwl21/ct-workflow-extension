import { 
  useCustomModuleDataValuesMutations,
  useCustomModuleDataValuesQuery,
  useCurrentUser
} from '@churchtools/utils';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { usePlugin } from './usePlugin';
import type { ExecutionData, StepData, WorkflowExecution } from '@/types/execution.types';

export function useExecutions(workflowId: MaybeRefOrGetter<number>) {
  const { moduleId } = usePlugin();
  const categoryId = computed(() => toValue(workflowId));
  const currentUser = useCurrentUser();
  
  // Query für alle Values in der Kategorie
  const { data, isLoading } = 
    useCustomModuleDataValuesQuery<ExecutionData>(moduleId, categoryId);
  
  // Mutations für CRUD
  const { 
    createCustomDataValue, 
    updateCustomDataValue, 
    deleteCustomDataValue 
  } = useCustomModuleDataValuesMutations<ExecutionData>(moduleId, categoryId);
  
  // Nur Executions (type === 'execution')
  const executions = computed(() => 
    (data.value ?? []).filter((v: any) => v.type === 'execution') as WorkflowExecution[]
  );
  
  // Executions des aktuellen Users
  const myExecutions = computed(() =>
    executions.value.filter(e => e.meta.userId === currentUser.value?.id)
  );
  
  const createExecution = async (workflowId: number) => {
    if (!currentUser.value) {
      throw new Error('User not available');
    }
    
    const executionId = `exec-${Date.now()}-${generateId()}`;
    
    return await createCustomDataValue({
      dataCategoryId: workflowId,
      type: 'execution',
      meta: {
        executionId,
        userId: currentUser.value.id,
        userName: currentUser.value.name || 'Unknown',
        status: 'running',
        currentNodeId: 'start',
        startedAt: new Date().toISOString(),
        context: {
          variables: {},
          history: []
        },
        steps: {}
      }
    });
  };
  
  const updateExecution = async (execution: WorkflowExecution) => {
    await updateCustomDataValue({
      ...execution,
      dataCategoryId: categoryId.value
    });
  };
  
  const saveStep = async (
    execution: WorkflowExecution, 
    nodeId: string, 
    stepData: StepData
  ) => {
    const updatedExecution = {
      ...execution,
      meta: {
        ...execution.meta,
        currentNodeId: nodeId,
        context: {
          ...execution.meta.context,
          history: [...execution.meta.context.history, nodeId],
          variables: {
            ...execution.meta.context.variables,
            ...stepData.outputs
          }
        },
        steps: {
          ...execution.meta.steps,
          [nodeId]: stepData
        }
      }
    };
    
    await updateExecution(updatedExecution);
  };
  
  const completeExecution = async (execution: WorkflowExecution) => {
    await updateExecution({
      ...execution,
      meta: {
        ...execution.meta,
        status: 'completed',
        completedAt: new Date().toISOString()
      }
    });
  };
  
  const pauseExecution = async (execution: WorkflowExecution) => {
    await updateExecution({
      ...execution,
      meta: {
        ...execution.meta,
        status: 'paused',
        pausedAt: new Date().toISOString()
      }
    });
  };
  
  const resumeExecution = async (execution: WorkflowExecution) => {
    await updateExecution({
      ...execution,
      meta: {
        ...execution.meta,
        status: 'running',
        pausedAt: undefined
      }
    });
  };
  
  const deleteExecution = async (executionId: number) => {
    await deleteCustomDataValue({
      id: executionId,
      dataCategoryId: categoryId.value
    });
  };
  
  return {
    executions,
    myExecutions,
    isLoading,
    createExecution,
    updateExecution,
    saveStep,
    completeExecution,
    pauseExecution,
    resumeExecution,
    deleteExecution
  };
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
