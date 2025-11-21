import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { churchtoolsClient } from '@churchtools/churchtools-client';
import type { User } from '@/types/user.types';
import { UserRole } from '@/types/user.types';
import { usePermissions } from '@/composables/usePermissions';

export const useUserStore = defineStore('user', () => {
  // State
  const currentUser = ref<User>({
    id: 'demo-user',
    name: 'Demo Benutzer',
    email: 'demo@example.com',
    role: UserRole.USER, // Change to UserRole.ADMIN to test admin view
  });

  // Use TanStack Query for permissions (with caching)
  const userId = computed(() => currentUser.value.id);
  const permissionsQuery = usePermissions(userId);
  const permissions = permissionsQuery.permissions;

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

  // fetchPermissions is now handled by TanStack Query in usePermissions composable
  // No need for manual fetching, caching, or LocalStorage management

  // Note: grantPermission, revokePermission are kept for potential admin UI
  // but they don't affect the actual permissions from backend
  function grantPermission() {
    console.warn('[userStore] grantPermission is deprecated - permissions come from ChurchTools backend');
    // This function is kept for backwards compatibility but does nothing
  }

  function revokePermission() {
    console.warn('[userStore] revokePermission is deprecated - permissions come from ChurchTools backend');
    // This function is kept for backwards compatibility but does nothing
  }

  function grantAllWorkflows() {
    console.warn('[userStore] grantAllWorkflows is deprecated - permissions come from ChurchTools backend');
    // This function is kept for backwards compatibility but does nothing
  }

  // LocalStorage for user only (not permissions)
  function saveToLocalStorage() {
    try {
      localStorage.setItem('currentUser', JSON.stringify(currentUser.value));
      // Permissions are NOT stored in LocalStorage anymore - TanStack Query handles caching
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
      // Permissions are NOT loaded from LocalStorage - they come from TanStack Query
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
    // fetchPermissions removed - handled by TanStack Query
    grantPermission,
    revokePermission,
    grantAllWorkflows,
    loadFromLocalStorage,
  };
});
