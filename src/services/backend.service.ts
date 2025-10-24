import { useWorkflows } from '@/composables/useWorkflows';

class BackendService {
  private workflowsComposable: ReturnType<typeof useWorkflows> | null = null;

  get workflows() {
    if (!this.workflowsComposable) {
      // Lazy initialization on first access
      this.workflowsComposable = useWorkflows();
    }
    return this.workflowsComposable;
  }
}

export const backendService = new BackendService();
