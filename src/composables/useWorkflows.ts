import { computed } from 'vue';
import { churchtoolsClient } from '@churchtools/churchtools-client';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { usePlugin } from './usePlugin';
import type { WorkflowDefinition } from '@/types/workflow.types';
import {
  deleteCustomDataCategory,
  getCustomDataValues,
  createCustomDataValue,
  updateCustomDataValue,
  deleteCustomDataValue,
} from '@/utils/kv-store';

/**
 * Workflow Storage Architecture:
 * 
 * Each workflow consists of:
 * - CustomDataCategory: Metadata (name, shorty, icon, etc.)
 * - CustomDataValue: Workflow definition (nodes, edges, metadata)
 * 
 * Design principle: Exactly ONE CustomDataValue per workflow category
 * - On load: If multiple values exist, use the one with highest ID (most recent)
 * - On update: Update existing value or create if missing
 * - On create: Create category + one value
 * 
 * This avoids field size limitations (~64KB in category fields vs. much larger in values)
 */
export function useWorkflows() {
  const { moduleId } = usePlugin();
  const queryClient = useQueryClient();
  
  // Query für alle Workflow-Kategorien und deren Values
  const { data: workflowsData, isLoading } = useQuery({
    queryKey: ['workflows', moduleId],
    queryFn: async () => {
      if (!moduleId.value) return [];
      
      // Hole alle Kategorien
      const categories = await churchtoolsClient.get<any>(
        `/custommodules/${moduleId.value}/customdatacategories`
      );
      const data = categories.data || categories;
      
      // Filtere nur Workflow-Kategorien
      const workflowCategories = data.filter((cat: any) => 
        cat.shorty?.startsWith('workflow_')
      );
      
      // Für jede Kategorie: Hole die Values (dort liegt die Definition)
      const workflowsWithData = await Promise.all(
        workflowCategories.map(async (cat: any) => {
          try {
            // Hole alle Values für diese Kategorie
            const values = await getCustomDataValues<WorkflowDefinition>(
              cat.id,
              moduleId.value
            );
            
            // Validierung: Es sollte genau ein Value pro Workflow geben
            if (values.length === 0) {
              console.warn(`Workflow ${cat.name} (ID: ${cat.id}) has no definition value`);
              return {
                ...cat,
                data: { version: '1.0.0', nodes: [], edges: [], metadata: {} },
                valueId: null
              };
            }
            
            if (values.length > 1) {
              console.warn(
                `Workflow ${cat.name} (ID: ${cat.id}) has ${values.length} values. ` +
                `Expected exactly 1. Using the most recent one (highest ID).`
              );
            }
            
            // Nimm den Value mit der höchsten ID (neuester)
            const latestValue = values.reduce((latest, current) => 
              current.id > latest.id ? current : latest
            );
            
            return {
              ...cat,
              data: latestValue,
              valueId: latestValue.id
            };
          } catch (error) {
            console.error(`Failed to load workflow data for category ${cat.id}:`, error);
            // Fallback für fehlerhafte Workflows
            return {
              ...cat,
              data: { version: '1.0.0', nodes: [], edges: [], metadata: {} },
              valueId: null
            };
          }
        })
      );
      
      return workflowsWithData;
    },
    enabled: computed(() => !!moduleId.value),
  });
  
  const workflows = computed(() => workflowsData.value ?? []);
  
  const createWorkflow = async (name: string, definition: WorkflowDefinition) => {
    console.log('[useWorkflows] createWorkflow called:', { name, definition, moduleId: moduleId.value });
    
    if (!moduleId.value) {
      throw new Error('Module ID not available');
    }
    
    const lastId = workflows.value[workflows.value.length - 1]?.id ?? 0;
    const definitionJson = JSON.stringify(definition);
    
    // Validierung: Prüfe Größe
    const sizeKB = new Blob([definitionJson]).size / 1024;
    console.log(`[useWorkflows] Workflow size: ${sizeKB.toFixed(2)} KB`);
    
    try {
      // 1. Erstelle die Kategorie (ohne Definition im description Feld)
      const categoryPayload = {
        name,
        shorty: `workflow_${lastId + 1}`,
        description: '', // Leer lassen - Definition kommt in Value
        customModuleId: moduleId.value,
        securityLevelId: 1,
        icon: 'workflow',
        color: 'primary'
      };
      
      const newCategory = await churchtoolsClient.post<{ id: number }>(
        `/custommodules/${moduleId.value}/customdatacategories`,
        categoryPayload
      );
      console.log('[useWorkflows] Created category:', newCategory);
      
      // 2. Erstelle den Value mit der Definition
      await createCustomDataValue(
        {
          dataCategoryId: newCategory.id,
          value: definitionJson
        },
        moduleId.value
      );
      console.log('[useWorkflows] Created workflow value');
      
      // Invalidate query to refetch
      queryClient.invalidateQueries({ queryKey: ['workflows', moduleId] });
    } catch (error) {
      console.error('[useWorkflows] Failed to create workflow:', error);
      throw error;
    }
  };
  
  const updateWorkflow = async (id: number, definition: WorkflowDefinition) => {
    if (!moduleId.value) {
      throw new Error('Module ID not available');
    }
    
    const workflow = workflows.value.find((w: any) => w.id === id);
    if (!workflow) throw new Error('Workflow not found');
    
    const definitionJson = JSON.stringify(definition);
    
    // Validierung: Prüfe Größe
    const sizeKB = new Blob([definitionJson]).size / 1024;
    console.log(`[useWorkflows] Workflow size: ${sizeKB.toFixed(2)} KB`);
    
    try {
      // Update den Value (nicht die Kategorie)
      if (workflow.valueId) {
        // Value existiert bereits - update diesen
        await updateCustomDataValue(
          id,
          workflow.valueId,
          { value: definitionJson },
          moduleId.value
        );
        console.log('[useWorkflows] Updated existing workflow value');
      } else {
        // Kein Value vorhanden - erstelle einen (sollte nicht vorkommen bei normaler Nutzung)
        console.warn(`Workflow ${workflow.name} (ID: ${id}) has no value. Creating one.`);
        await createCustomDataValue(
          {
            dataCategoryId: id,
            value: definitionJson
          },
          moduleId.value
        );
        console.log('[useWorkflows] Created missing workflow value');
      }
      
      // Invalidate query to refetch
      queryClient.invalidateQueries({ queryKey: ['workflows', moduleId] });
    } catch (error) {
      console.error('[useWorkflows] Failed to update workflow:', error);
      throw error;
    }
  };
  
  const deleteWorkflow = async (id: number) => {
    if (!moduleId.value) {
      throw new Error('Module ID not available');
    }
    
    try {
      console.log(`[useWorkflows] Deleting workflow ${id}...`);
      
      // 1. Finde den Workflow und seine valueId
      const workflow = workflows.value.find((w: any) => w.id === id);
      
      if (workflow?.valueId) {
        // 2. Lösche zuerst den CustomDataValue
        console.log(`[useWorkflows] Deleting value ${workflow.valueId} for workflow ${id}`);
        await deleteCustomDataValue(id, workflow.valueId, moduleId.value);
      } else {
        console.warn(`[useWorkflows] Workflow ${id} has no valueId, skipping value deletion`);
      }
      
      // 3. Lösche dann die Kategorie
      console.log(`[useWorkflows] Deleting category ${id}`);
      await deleteCustomDataCategory(id, moduleId.value);
      
      console.log('[useWorkflows] Deleted workflow successfully');
      
      // Invalidate query to refetch
      queryClient.invalidateQueries({ queryKey: ['workflows', moduleId] });
    } catch (error) {
      console.error('[useWorkflows] Failed to delete workflow:', error);
      throw error;
    }
  };
  
  return {
    workflows,
    isLoading,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow
  };
}
