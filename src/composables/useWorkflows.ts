import { computed } from 'vue';
import { churchtoolsClient } from '@churchtools/churchtools-client';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { usePlugin } from './usePlugin';
import type { WorkflowDefinition } from '@/types/workflow.types';

export function useWorkflows() {
  const { moduleId } = usePlugin();
  const queryClient = useQueryClient();
  
  // Query für alle Kategorien
  const { data: categories, isLoading } = useQuery({
    queryKey: ['customModuleCategories', moduleId],
    queryFn: async () => {
      if (!moduleId.value) return [];
      const result = await churchtoolsClient.get<any>(
        `/custommodules/${moduleId.value}/customdatacategories`
      );
      console.log('API Response for categories:', result);
      const data = result.data || result;
      console.log('Categories data:', data);
      return data;
    },
    enabled: computed(() => !!moduleId.value),
  });
  
  // Nur Workflow-Kategorien (keine _settings)
  const workflows = computed(() => 
    (categories.value ?? [])
      .filter((cat: any) => cat.shorty?.startsWith('workflow_'))
      .map((cat: any) => ({
        ...cat,
        // Parse data string to object if needed
        data: typeof cat.data === 'string' ? JSON.parse(cat.data) : cat.data
      }))
  );
  
  const createWorkflow = async (name: string, definition: WorkflowDefinition) => {
    console.log('[useWorkflows] createWorkflow called:', { name, definition, moduleId: moduleId.value });
    
    if (!moduleId.value) {
      throw new Error('Module ID not available');
    }
    
    const lastId = workflows.value[workflows.value.length - 1]?.id ?? 0;
    const payload = {
      name,
      shorty: `workflow_${lastId + 1}`,
      data: JSON.stringify(definition), // Serialize to JSON string
      customModuleId: moduleId.value,
      securityLevelId: 1,
      icon: 'workflow',
      color: 'primary'
    };
    
    console.log('[useWorkflows] POST payload:', payload);
    
    try {
      const result = await churchtoolsClient.post(
        `/custommodules/${moduleId.value}/customdatacategories`,
        payload
      );
      console.log('[useWorkflows] POST result:', result);
      
      // Invalidate query to refetch
      queryClient.invalidateQueries({ queryKey: ['customModuleCategories', moduleId] });
    } catch (error) {
      console.error('[useWorkflows] POST failed:', error);
      throw error;
    }
  };
  
  const updateWorkflow = async (id: number, definition: WorkflowDefinition) => {
    if (!moduleId.value) {
      throw new Error('Module ID not available');
    }
    
    const workflow = workflows.value.find((w: any) => w.id === id);
    if (!workflow) throw new Error('Workflow not found');
    
    await churchtoolsClient.put(
      `/custommodules/${moduleId.value}/customdatacategories/${id}`,
      {
        ...workflow,
        data: JSON.stringify(definition) // Serialize to JSON string
      }
    );
    
    // Invalidate query to refetch
    queryClient.invalidateQueries({ queryKey: ['customModuleCategories', moduleId] });
  };
  
  const deleteWorkflow = async (id: number) => {
    if (!moduleId.value) {
      throw new Error('Module ID not available');
    }
    
    // Use post with _method=DELETE for ChurchTools API
    await churchtoolsClient.post(
      `/custommodules/${moduleId.value}/customdatacategories/${id}`,
      { _method: 'DELETE' }
    );
    
    // Invalidate query to refetch
    queryClient.invalidateQueries({ queryKey: ['customModuleCategories', moduleId] });
  };
  
  return {
    workflows,
    isLoading,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow
  };
}
