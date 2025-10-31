import { computed, type ComputedRef } from 'vue';
import { churchtoolsClient } from '@churchtools/churchtools-client';
import { useQuery } from '@tanstack/vue-query';
import type { WorkflowPermission } from '@/types/user.types';

export function usePermissions(userId: ComputedRef<string>) {
  // Query für Permissions
  const { data: permissionsData, isLoading, error } = useQuery({
    queryKey: ['permissions', 'global', userId],
    queryFn: async () => {
      console.log('[usePermissions] Fetching permissions from ChurchTools API...');
      const response: any = await churchtoolsClient.get('/permissions/global');
      
      console.log('[usePermissions] Raw response:', response);
      console.log('[usePermissions] response.data:', response.data);
      console.log('[usePermissions] response.data.data:', response.data?.data);
      
      // ChurchTools API returns: { data: { ct-workflow: {...}, ... } }
      const apiData = response.data || response;
      const permissionsData = apiData.data || apiData;
      
      console.log('[usePermissions] Extracted permissions data:', permissionsData);
      console.log('[usePermissions] Available modules:', Object.keys(permissionsData || {}));
      
      const ctWorkflowPerms = permissionsData?.['ct-workflow'];
      console.log('[usePermissions] ct-workflow permissions:', JSON.stringify(ctWorkflowPerms, null, 2));
      
      if (!ctWorkflowPerms) {
        console.warn('[usePermissions] No ct-workflow module found in API response');
        return [];
      }
      
      console.log('[usePermissions] ChurchTools permissions:', ctWorkflowPerms);
      
      // Konvertiere ChurchTools Permissions zu unserem Format
      const viewCategories = ctWorkflowPerms['view custom category'] || [];
      const createData = ctWorkflowPerms['create custom data'] || [];
      
      console.log('[usePermissions] view custom category:', viewCategories);
      console.log('[usePermissions] create custom data:', createData);
      
      // Check if user has any permissions
      if (viewCategories.length === 0 && createData.length === 0) {
        console.warn('[usePermissions] User has no permissions for ct-workflow module');
        return [];
      }
      
      // Erstelle Permissions für jeden Workflow
      const permissions: WorkflowPermission[] = [];
      
      // Alle sichtbaren Workflows
      viewCategories.forEach((workflowId: number) => {
        permissions.push({
          workflowId,
          userId: userId.value,
          canView: true,
          canExecute: createData.includes(workflowId),
        });
      });
      
      // Workflows die ausführbar sind, aber nicht in viewCategories (sollte nicht vorkommen)
      createData.forEach((workflowId: number) => {
        if (!viewCategories.includes(workflowId)) {
          permissions.push({
            workflowId,
            userId: userId.value,
            canView: true, // Implizit, wenn ausführbar
            canExecute: true,
          });
        }
      });
      
      console.log('[usePermissions] Loaded permissions:', permissions);
      return permissions;
    },
    staleTime: 5 * 60 * 1000, // 5 Minuten - Permissions ändern sich selten
    gcTime: 10 * 60 * 1000, // 10 Minuten im Cache behalten
    enabled: computed(() => !!userId.value), // Nur laden wenn userId vorhanden
  });

  const permissions = computed(() => permissionsData.value || []);

  return {
    permissions,
    isLoading,
    error,
  };
}
