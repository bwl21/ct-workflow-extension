import { computed } from 'vue';
import { churchtoolsClient } from '@churchtools/churchtools-client';
import { useQuery } from '@tanstack/vue-query';

export function usePlugin() {
  const pluginKey = import.meta.env.VITE_KEY;
  
  // Load all custom modules directly using churchtoolsClient
  const { data: response, isLoading } = useQuery({
    queryKey: ['customModules'],
    queryFn: async () => {
      const result = await churchtoolsClient.get<any>('/custommodules');
      // Handle both formats: direct array or {data: array}
      return result.data || result;
    },
  });
  
  const module = computed(() => {
    const allModules = response.value || [];
    const found = Array.isArray(allModules) 
      ? allModules.find((m: any) => m.shorty === pluginKey)
      : null;
    return found;
  });
  
  const moduleId = computed(() => module.value?.id);
  
  return {
    moduleId,
    module,
    isLoading
  };
}
