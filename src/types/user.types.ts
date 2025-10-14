/**
 * User and Permission Types
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export interface WorkflowPermission {
  workflowId: string;
  userId: string;
  canExecute: boolean;
  canView: boolean;
}
