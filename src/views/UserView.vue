<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWorkflowStore } from '@/stores/workflow';
import { useUserStore } from '@/stores/user';
import { useExecutionStore } from '@/stores/execution';
import WorkflowExecutor from '@/components/workflow/WorkflowExecutor.vue';

const workflowStore = useWorkflowStore();
const userStore = useUserStore();
const executionStore = useExecutionStore();

const showExecutor = ref(false);

const availableWorkflows = computed(() => {
  return workflowStore.workflows.filter((workflow) =>
    userStore.canExecuteWorkflow(workflow.id.toString())
  );
});

const currentExecution = computed(() => executionStore.currentExecution);

function startWorkflow(workflowId: number) {
  executionStore.startExecution(workflowId.toString(), userStore.currentUser.id);
  showExecutor.value = true;
}

function closeExecutor() {
  showExecutor.value = false;
  executionStore.setCurrentExecution(null);
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
</script>

<template>
  <div class="user-view">
    <!-- Header -->
    <div class="ct-card ct-mb-3">
      <div class="ct-card-header">
        <div class="header-content">
          <div>
            <h2 class="ct-h4 ct-mb-0">Workflows</h2>
            <p class="ct-text-muted ct-mb-0">
              Willkommen, {{ userStore.currentUser.name }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Workflow Executor -->
    <div v-if="showExecutor && currentExecution" class="ct-card">
      <div class="ct-card-body executor-container">
        <WorkflowExecutor />
        <div class="executor-actions">
          <button class="ct-btn ct-btn-secondary" @click="closeExecutor">
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    </div>

    <!-- Workflow Selection -->
    <div v-else>
      <div v-if="availableWorkflows.length > 0" class="workflow-grid">
        <div
          v-for="workflow in availableWorkflows"
          :key="workflow.id"
          class="workflow-card ct-card"
          @click="startWorkflow(workflow.id)"
        >
          <div class="ct-card-body">
            <div class="workflow-icon">📋</div>
            <h3 class="workflow-title">{{ workflow.name }}</h3>
            <p class="workflow-description">
              {{ workflow.description || 'Kein Beschreibung verfügbar' }}
            </p>
            <div class="workflow-meta">
              <span class="ct-badge ct-badge-primary">
                {{ workflow.definition.nodes.length }} Schritte
              </span>
              <span class="ct-text-muted">
                <small>Erstellt: {{ formatDate(workflow.createdAt) }}</small>
              </span>
            </div>
            <div class="workflow-action">
              <button class="ct-btn ct-btn-primary ct-btn-block">
                Workflow starten →
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="ct-card">
        <div class="ct-card-body">
          <div class="ct-empty-state">
            <div class="ct-empty-state-icon">🔒</div>
            <h3 class="ct-empty-state-title">Keine Workflows verfügbar</h3>
            <p class="ct-empty-state-text">
              Du hast derzeit keine Berechtigung, Workflows auszuführen.<br />
              Bitte wende dich an einen Administrator.
            </p>
          </div>
        </div>
      </div>

      <!-- Info Box -->
      <div class="ct-card ct-mt-3">
        <div class="ct-card-body">
          <div class="ct-alert ct-alert-info">
            <strong>ℹ️ Hinweis:</strong> Du siehst nur Workflows, für die du eine Berechtigung hast.
            Wenn du weitere Workflows benötigst, kontaktiere bitte einen Administrator.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-view {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.workflow-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.workflow-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid var(--ct-border-color);
}

.workflow-card:hover {
  border-color: var(--ct-primary);
  box-shadow: 0 0.5rem 1rem rgba(14, 32, 75, 0.15);
  transform: translateY(-2px);
}

.workflow-icon {
  font-size: 3rem;
  text-align: center;
  margin-bottom: 1rem;
  opacity: 0.8;
}

.workflow-title {
  font-size: 1.25rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--ct-primary);
}

.workflow-description {
  color: var(--ct-text-secondary);
  margin-bottom: 1rem;
  min-height: 3rem;
  font-size: 0.9rem;
}

.workflow-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--ct-border-light);
}

.workflow-action {
  margin-top: 1rem;
}

.ct-btn-block {
  display: block;
  width: 100%;
}

.executor-container {
  padding: 0;
}

.executor-container :deep(.workflow-executor) {
  height: 70vh;
}

.executor-actions {
  padding: 1rem;
  border-top: 1px solid var(--ct-border-color);
  background: var(--ct-bg-secondary);
}

@media (max-width: 768px) {
  .user-view {
    padding: 1rem;
  }

  .workflow-grid {
    grid-template-columns: 1fr;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
