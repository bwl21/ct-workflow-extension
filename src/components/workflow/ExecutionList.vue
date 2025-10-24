<template>
  <div class="execution-list">
    <h3>Workflow Executions</h3>
    
    <div v-if="executions.length === 0" class="empty-state">
      No executions yet. Start a workflow to see executions here.
    </div>
    
    <div v-else class="executions">
      <div
        v-for="execution in executions"
        :key="execution.id"
        class="execution-item"
        :class="{ active: execution.id === currentExecutionId }"
        @click="selectExecution(execution.id)"
      >
        <div class="execution-header">
          <span class="execution-status" :class="execution.status.toLowerCase()">
            {{ execution.status }}
          </span>
          <span class="execution-time">
            {{ formatDate(execution.startedAt) }}
          </span>
        </div>
        
        <div class="execution-details">
          <div class="detail-row">
            <span class="label">ID:</span>
            <span class="value">{{ execution.id }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Current Node:</span>
            <span class="value">{{ getCurrentNodeName(execution) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Steps:</span>
            <span class="value">{{ execution.history.length }}</span>
          </div>
        </div>
        
        <div class="execution-actions">
          <button
            v-if="execution.status === ExecutionStatus.RUNNING"
            @click.stop="pauseExecution(execution.id)"
            class="btn-pause"
          >
            Pause
          </button>
          <button
            v-if="execution.status === ExecutionStatus.PAUSED"
            @click.stop="resumeExecution(execution.id)"
            class="btn-resume"
          >
            Resume
          </button>
          <button
            v-if="execution.status === ExecutionStatus.RUNNING || execution.status === ExecutionStatus.PAUSED"
            @click.stop="cancelExecution(execution.id)"
            class="btn-cancel"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useExecutionStore } from '@/stores/execution';
import { useWorkflowStore } from '@/stores/workflow';
import type { WorkflowExecution } from '@/types/workflow.types';
import { ExecutionStatus } from '@/types/workflow.types';

const props = defineProps<{
  workflowId: number;
}>();

const executionStore = useExecutionStore();
const workflowStore = useWorkflowStore();

const executions = computed(() => {
  return executionStore.getWorkflowExecutions(props.workflowId);
});

const currentExecutionId = computed(() => executionStore.currentExecutionId);

function selectExecution(id: string) {
  executionStore.setCurrentExecution(id);
}

function cancelExecution(id: string) {
  executionStore.cancelExecution(id);
}

function pauseExecution(id: string) {
  executionStore.pauseExecution(id);
}

function resumeExecution(id: string) {
  executionStore.resumeExecution(id);
}

function getCurrentNodeName(execution: WorkflowExecution): string {
  const workflow = workflowStore.getWorkflowById(execution.workflowId);
  if (!workflow) return 'Unknown';
  
  const node = workflow.definition.nodes.find((n) => n.id === execution.currentNodeId);
  return node?.label || 'Unknown';
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString();
}
</script>

<style scoped>
.execution-list {
  padding: 1rem;
  background: var(--color-background-soft);
  border-radius: 8px;
}

h3 {
  margin: 0 0 1rem 0;
  color: var(--color-heading);
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-muted);
}

.executions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.execution-item {
  padding: 1rem;
  background: var(--color-background);
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.execution-item:hover {
  border-color: var(--color-border-hover);
}

.execution-item.active {
  border-color: var(--color-primary);
  background: var(--color-background-mute);
}

.execution-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.execution-status {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
}

.execution-status.running {
  background: #3b82f6;
  color: white;
}

.execution-status.completed {
  background: #10b981;
  color: white;
}

.execution-status.cancelled {
  background: #ef4444;
  color: white;
}

.execution-status.paused {
  background: #f59e0b;
  color: white;
}

.execution-time {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.execution-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.detail-row {
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.detail-row .label {
  font-weight: 600;
  color: var(--color-text-muted);
}

.detail-row .value {
  color: var(--color-text);
}

.execution-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn-pause,
.btn-resume,
.btn-cancel {
  padding: 0.375rem 0.75rem;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-pause {
  background: #f59e0b;
}

.btn-pause:hover {
  background: #d97706;
}

.btn-resume {
  background: #10b981;
}

.btn-resume:hover {
  background: #059669;
}

.btn-cancel {
  background: #ef4444;
}

.btn-cancel:hover {
  background: #dc2626;
}
</style>
