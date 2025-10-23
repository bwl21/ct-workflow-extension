import { 
  useCustomModuleDataCategoriesQuery,
  useCustomModuleDataCategoryMutations 
} from '@churchtools/utils';
import { computed } from 'vue';
import { usePlugin } from './usePlugin';
import type { WorkflowDefinition } from '@/types/workflow.types';

export function useWorkflows() {
  const { moduleId } = usePlugin();
  
  // Query für alle Kategorien
  const { data: categories, isLoading } = 
    useCustomModuleDataCategoriesQuery<WorkflowDefinition>(moduleId);
  
  // Mutations für CRUD
  const { 
    createDataCategory, 
    updateDataCategory, 
    deleteDataCategory 
  } = useCustomModuleDataCategoryMutations<WorkflowDefinition>(moduleId);
  
  // Nur Workflow-Kategorien (keine _settings)
  const workflows = computed(() => 
    (categories.value ?? []).filter((cat: any) => 
      cat.shorty?.startsWith('workflow_')
    )
  );
  
  const createWorkflow = async (name: string, definition: WorkflowDefinition) => {
    if (!moduleId.value) {
      throw new Error('Module ID not available');
    }
    
    const lastId = workflows.value[workflows.value.length - 1]?.id ?? 0;
    
    await createDataCategory({
      name,
      shorty: `workflow_${lastId + 1}`,
      meta: definition,
      customModuleId: moduleId.value,
      securityLevelId: 1,
      icon: 'workflow',
      color: 'primary'
    });
  };
  
  const updateWorkflow = async (id: number, definition: WorkflowDefinition) => {
    const workflow = workflows.value.find((w: any) => w.id === id);
    if (!workflow) throw new Error('Workflow not found');
    
    await updateDataCategory({
      ...workflow,
      meta: definition
    });
  };
  
  const deleteWorkflow = async (id: number) => {
    await deleteDataCategory(id);
  };
  
  return {
    workflows,
    isLoading,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow
  };
}
