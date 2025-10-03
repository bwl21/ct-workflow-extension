import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
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

  const canExecuteWorkflow = (workflowId: string): boolean => {
    if (isAdmin.value) return true;

    const permission = permissions.value.find(
      (p) => p.workflowId === workflowId && p.userId === currentUser.value.id
    );

    return permission?.canExecute ?? false;
  };

  const canViewWorkflow = (workflowId: string): boolean => {
    if (isAdmin.value) return true;

    const permission = permissions.value.find(
      (p) => p.workflowId === workflowId && p.userId === currentUser.value.id
    );

    return permission?.canView ?? false;
  };

  const getExecutableWorkflows = (workflowIds: string[]): string[] => {
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

  function grantPermission(workflowId: string, userId: string, canExecute = true, canView = true) {
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

  function revokePermission(workflowId: string, userId: string) {
    const index = permissions.value.findIndex(
      (p) => p.workflowId === workflowId && p.userId === userId
    );

    if (index > -1) {
      permissions.value.splice(index, 1);
      saveToLocalStorage();
    }
  }

  function grantAllWorkflows(userId: string) {
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
    grantPermission,
    revokePermission,
    grantAllWorkflows,
    loadFromLocalStorage,
  };
});
