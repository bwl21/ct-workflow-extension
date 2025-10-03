<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWorkflowStore } from '@/stores/workflow';
import { useExecutionStore } from '@/stores/execution';
import WorkflowDiagram from './WorkflowDiagram.vue';
import { NodeType, ExecutionStatus } from '@/types/workflow.types';

const workflowStore = useWorkflowStore();
const executionStore = useExecutionStore();

const formData = ref<Record<string, any>>({});

const currentExecution = computed(() => executionStore.currentExecution);
const currentNode = computed(() => executionStore.currentNode);
const currentWorkflow = computed(() => {
  if (!currentExecution.value) return null;
  return workflowStore.getWorkflowById(currentExecution.value.workflowId);
});

const completedNodeIds = computed(() => {
  if (!currentExecution.value) return [];
  return currentExecution.value.history.map((h) => h.nodeId);
});

const isCompleted = computed(() => {
  return currentExecution.value?.status === ExecutionStatus.COMPLETED;
});

function startWorkflow(workflowId: string) {
  executionStore.startExecution(workflowId);
  formData.value = {};
}

function submitStep() {
  if (!currentExecution.value) return;

  // Validate required fields
  if (currentNode.value?.type === NodeType.TASK && currentNode.value.data.fields) {
    const requiredFields = currentNode.value.data.fields.filter((f) => f.required);
    for (const field of requiredFields) {
      if (!formData.value[field.name]) {
        alert(`Bitte fülle das Pflichtfeld "${field.label}" aus`);
        return;
      }
    }
  }

  executionStore.completeStep(currentExecution.value.id, { ...formData.value });
  formData.value = {};
}

function cancelWorkflow() {
  if (!currentExecution.value) return;
  if (confirm('Workflow wirklich abbrechen?')) {
    executionStore.cancelExecution(currentExecution.value.id);
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString('de-DE');
}
</script>

<template>
  <div class="workflow-executor">
    <!-- Header -->
    <div class="executor-header">
      <h2>Workflow-Ausführung</h2>
      <div v-if="currentWorkflow" class="workflow-info">
        <h3>{{ currentWorkflow.name }}</h3>
        <p>{{ currentWorkflow.description }}</p>
      </div>
    </div>

    <!-- Workflow Selection -->
    <div v-if="!currentExecution" class="workflow-selection">
      <h3>Workflow auswählen</h3>
      <div class="workflow-list">
        <div
          v-for="workflow in workflowStore.workflows"
          :key="workflow.id"
          class="workflow-card"
          @click="startWorkflow(workflow.id)"
        >
          <h4>{{ workflow.name }}</h4>
          <p>{{ workflow.description }}</p>
          <div class="workflow-meta">
            <span>{{ workflow.definition.nodes.length }} Schritte</span>
            <span>Erstellt: {{ formatDate(workflow.createdAt) }}</span>
          </div>
        </div>
      </div>
      <div v-if="workflowStore.workflows.length === 0" class="empty-state">
        <p>Keine Workflows verfügbar. Erstelle zuerst einen Workflow im Editor.</p>
      </div>
    </div>

    <!-- Execution View -->
    <div v-else class="execution-view">
      <!-- Left: Diagram -->
      <div class="execution-diagram">
        <h4>Workflow-Fortschritt</h4>
        <WorkflowDiagram
          v-if="currentWorkflow"
          :workflow="currentWorkflow"
          :current-node-id="currentExecution.currentNodeId"
          :completed-node-ids="completedNodeIds"
        />
      </div>

      <!-- Center: Current Step -->
      <div class="execution-workspace">
        <div v-if="!isCompleted" class="current-step">
          <h3>{{ currentNode?.label }}</h3>
          <p v-if="currentNode?.description" class="step-description">
            {{ currentNode.description }}
          </p>

          <!-- Task Form -->
          <div v-if="currentNode?.type === NodeType.TASK && currentNode.data.fields" class="task-form">
            <div
              v-for="field in currentNode.data.fields"
              :key="field.name"
              class="ct-form-group"
            >
              <label class="ct-form-label">
                {{ field.label }}
                <span v-if="field.required" class="required">*</span>
              </label>

              <input
                v-if="field.type === 'text' || field.type === 'email'"
                v-model="formData[field.name]"
                :type="field.type"
                class="ct-form-control"
                :placeholder="field.placeholder"
                :required="field.required"
              />

              <textarea
                v-else-if="field.type === 'textarea'"
                v-model="formData[field.name]"
                class="ct-form-control"
                rows="4"
                :placeholder="field.placeholder"
                :required="field.required"
              />

              <input
                v-else-if="field.type === 'number'"
                v-model.number="formData[field.name]"
                type="number"
                class="ct-form-control"
                :placeholder="field.placeholder"
                :required="field.required"
              />

              <label v-else-if="field.type === 'checkbox'" class="checkbox-label">
                <input v-model="formData[field.name]" type="checkbox" />
                {{ field.placeholder || 'Ja' }}
              </label>
            </div>

            <div class="form-actions">
              <button class="ct-btn ct-btn-secondary" @click="cancelWorkflow">Abbrechen</button>
              <button class="ct-btn ct-btn-primary" @click="submitStep">Weiter</button>
            </div>
          </div>

          <!-- Action Node -->
          <div v-else-if="currentNode?.type === NodeType.ACTION" class="action-node">
            <p>Aktion wird ausgeführt...</p>
            <button class="ct-btn ct-btn-primary" @click="submitStep">Fortfahren</button>
          </div>

          <!-- Other Node Types -->
          <div v-else class="simple-node">
            <button class="ct-btn ct-btn-primary" @click="submitStep">Weiter</button>
          </div>
        </div>

        <!-- Completed -->
        <div v-else class="completion-message">
          <div class="success-icon">✓</div>
          <h3>Workflow abgeschlossen!</h3>
          <p>Der Workflow wurde erfolgreich durchlaufen.</p>
          <button class="ct-btn ct-btn-primary" @click="executionStore.setCurrentExecution(null)">
            Neuer Workflow
          </button>
        </div>
      </div>

      <!-- Right: History -->
      <div class="execution-history">
        <h4>Bearbeitungschronologie</h4>
        <div class="history-list">
          <div v-for="entry in currentExecution.history" :key="entry.id" class="history-entry">
            <div class="history-header">
              <span class="history-node">{{ entry.nodeName }}</span>
              <span class="history-status" :class="`status-${entry.status}`">
                {{ entry.status === 'success' ? '✓' : '✕' }}
              </span>
            </div>
            <div class="history-time">{{ formatDate(entry.timestamp) }}</div>
            <div v-if="Object.keys(entry.inputs).length > 0" class="history-data">
              <strong>Eingaben:</strong>
              <ul>
                <li v-for="(value, key) in entry.inputs" :key="key">
                  <strong>{{ key }}:</strong> {{ value }}
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div v-if="currentExecution.history.length === 0" class="empty-history">
          <p>Noch keine Schritte durchlaufen</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.workflow-executor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.executor-header {
  padding: 1rem;
  border-bottom: 1px solid #ddd;
}

.workflow-info h3 {
  margin: 0.5rem 0 0;
  font-size: 1.2rem;
}

.workflow-info p {
  margin: 0.25rem 0 0;
  color: #666;
  font-size: 0.9rem;
}

.workflow-selection {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.workflow-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.workflow-card {
  padding: 1.5rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.workflow-card:hover {
  border-color: var(--ct-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.workflow-card h4 {
  margin: 0 0 0.5rem;
}

.workflow-card p {
  margin: 0 0 1rem;
  color: #666;
  font-size: 0.9rem;
}

.workflow-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #999;
}

.execution-view {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 1rem;
  padding: 1rem;
  overflow: hidden;
}

.execution-diagram,
.execution-workspace,
.execution-history {
  overflow-y: auto;
}

.execution-diagram {
  border-right: 1px solid #ddd;
  padding-right: 1rem;
}

.execution-history {
  border-left: 1px solid #ddd;
  padding-left: 1rem;
}

.current-step {
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.current-step h3 {
  margin: 0 0 0.5rem;
}

.step-description {
  color: #666;
  margin-bottom: 1.5rem;
}

.task-form {
  margin-top: 1.5rem;
}

.required {
  color: #f44336;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.completion-message {
  text-align: center;
  padding: 3rem;
}

.success-icon {
  font-size: 4rem;
  color: #4caf50;
  margin-bottom: 1rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.history-entry {
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 4px;
  border-left: 3px solid #4caf50;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.history-node {
  font-weight: 500;
}

.history-status {
  font-size: 1.2rem;
}

.status-success {
  color: #4caf50;
}

.status-error {
  color: #f44336;
}

.history-time {
  font-size: 0.85rem;
  color: #999;
  margin-bottom: 0.5rem;
}

.history-data {
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.history-data ul {
  margin: 0.5rem 0 0;
  padding-left: 1.5rem;
}

.history-data li {
  margin-bottom: 0.25rem;
}

.empty-state,
.empty-history {
  text-align: center;
  color: #999;
  padding: 2rem;
}

.action-node,
.simple-node {
  text-align: center;
  padding: 2rem;
}
</style>
