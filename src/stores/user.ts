import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { churchtoolsClient } from '@churchtools/churchtools-client';
import type { User, WorkflowPermission } from '@/types/user.types';
import { UserRole } from '@/types/user.types';

export const useUserStore = defineStore('user', () => {
  // State
  const currentUser = ref<User>({
    id: 'demo-user',
    name: 'Demo Benutzer',
    email: 'demo@example.com',
    role: UserRole.USER, // Change to UserRole.ADMIN to test admin view
  });

  const permissions = ref<WorkflowPermission[]>([]);

  // Getters
  const isAdmin = computed(() => currentUser.value.role === UserRole.ADMIN);

  const canExecuteWorkflow = (workflowId: number): boolean => {
    console.log(`[userStore] canExecuteWorkflow(${workflowId})`);
    console.log(`[userStore] isAdmin: ${isAdmin.value}`);
    
    if (isAdmin.value) {
      console.log(`[userStore] → true (admin bypass)`);
      return true;
    }

    const permission = permissions.value.find(
      (p) => p.workflowId === workflowId && p.userId === currentUser.value.id
    );
    
    console.log(`[userStore] Found permission:`, permission);
    console.log(`[userStore] → ${permission?.canExecute ?? false}`);

    return permission?.canExecute ?? false;
  };

  const canViewWorkflow = (workflowId: number): boolean => {
    if (isAdmin.value) return true;

    const permission = permissions.value.find(
      (p) => p.workflowId === workflowId && p.userId === currentUser.value.id
    );

    return permission?.canView ?? false;
  };

  const getExecutableWorkflows = (workflowIds: number[]): number[] => {
    if (isAdmin.value) return workflowIds;

    return workflowIds.filter((id) => canExecuteWorkflow(id));
  };

  // Actions
  function setUser(user: User) {
    currentUser.value = user;
  }

  function setUserRole(role: UserRole) {
    currentUser.value.role = role;
    saveToLocalStorage();
  }

  async function fetchCurrentUser() {
    try {
      const response: any = await churchtoolsClient.get('/whoami');
      const ctUser = response.data || response;
      
      currentUser.value = {
        id: ctUser.id?.toString() || 'unknown',
        name: [ctUser.firstName, ctUser.lastName].filter(Boolean).join(' ') || 'Benutzer',
        email: ctUser.email || '',
        role: ctUser.securityLevelId === 1 ? UserRole.ADMIN : UserRole.USER,
      };
      
      saveToLocalStorage();
      return true;
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      return false;
    }
  }

  async function fetchPermissions() {
    try {
      console.log('[userStore] Fetching permissions from ChurchTools API...');
      const response: any = await churchtoolsClient.get('/permissions/global');
      const data = response.data || response;
      const ctWorkflowPerms = data.data?.['ct-workflow'];
      
      if (!ctWorkflowPerms) {
        console.warn('[userStore] No ct-workflow permissions found in API response');
        return false;
      }
      
      console.log('[userStore] ChurchTools permissions:', ctWorkflowPerms);
      
      // Konvertiere ChurchTools Permissions zu unserem Format
      const viewCategories = ctWorkflowPerms['view custom category'] || [];
      const createData = ctWorkflowPerms['create custom data'] || [];
      
      // Erstelle Permissions für jeden Workflow
      const newPermissions: WorkflowPermission[] = [];
      
      // Alle sichtbaren Workflows
      viewCategories.forEach((workflowId: number) => {
        newPermissions.push({
          workflowId,
          userId: currentUser.value.id,
          canView: true,
          canExecute: createData.includes(workflowId),
        });
      });
      
      // Workflows die ausführbar sind, aber nicht in viewCategories (sollte nicht vorkommen)
      createData.forEach((workflowId: number) => {
        if (!viewCategories.includes(workflowId)) {
          newPermissions.push({
            workflowId,
            userId: currentUser.value.id,
            canView: true, // Implizit, wenn ausführbar
            canExecute: true,
          });
        }
      });
      
      permissions.value = newPermissions;
      saveToLocalStorage();
      
      console.log('[userStore] Loaded permissions:', newPermissions);
      return true;
    } catch (error) {
      console.error('[userStore] Failed to fetch permissions:', error);
      return false;
    }
  }

  function grantPermission(workflowId: number, userId: string, canExecute = true, canView = true) {
    const existing = permissions.value.find(
      (p) => p.workflowId === workflowId && p.userId === userId
    );

    if (existing) {
      existing.canExecute = canExecute;
      existing.canView = canView;
    } else {
      permissions.value.push({
        workflowId,
        userId,
        canExecute,
        canView,
      });
    }

    saveToLocalStorage();
  }

  function revokePermission(workflowId: number, userId: string) {
    const index = permissions.value.findIndex(
      (p) => p.workflowId === workflowId && p.userId === userId
    );

    if (index > -1) {
      permissions.value.splice(index, 1);
      saveToLocalStorage();
    }
  }

  function grantAllWorkflows(_userId: string) {
    // This would typically fetch all workflow IDs
    // For demo, we'll just mark the user as having access
    saveToLocalStorage();
  }

  // LocalStorage
  function saveToLocalStorage() {
    try {
      localStorage.setItem('currentUser', JSON.stringify(currentUser.value));
      localStorage.setItem('permissions', JSON.stringify(permissions.value));
    } catch (error) {
      console.error('Failed to save user data to localStorage:', error);
    }
  }

  function loadFromLocalStorage() {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        currentUser.value = JSON.parse(storedUser);
      }

      const storedPermissions = localStorage.getItem('permissions');
      if (storedPermissions) {
        permissions.value = JSON.parse(storedPermissions);
      }
    } catch (error) {
      console.error('Failed to load user data from localStorage:', error);
    }
  }

  // Initialize
  loadFromLocalStorage();

  return {
    // State
    currentUser,
    permissions,

    // Getters
    isAdmin,
    canExecuteWorkflow,
    canViewWorkflow,
    getExecutableWorkflows,

    // Actions
    setUser,
    setUserRole,
    fetchCurrentUser,
    fetchPermissions,
    grantPermission,
    revokePermission,
    grantAllWorkflows,
    loadFromLocalStorage,
  };
});
