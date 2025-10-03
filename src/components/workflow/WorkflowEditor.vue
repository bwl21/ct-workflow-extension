<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWorkflowStore } from '@/stores/workflow';
import WorkflowDiagram from './WorkflowDiagram.vue';
import type { WorkflowNode } from '@/types/workflow.types';
import { NodeType, FieldType } from '@/types/workflow.types';

const workflowStore = useWorkflowStore();

const workflowName = ref('');
const workflowDescription = ref('');
const showCreateDialog = ref(false);
const selectedNode = ref<WorkflowNode | null>(null);
const showNodeEditor = ref(false);

const currentWorkflow = computed(() => workflowStore.currentWorkflow);

const nodeTypes = [
  { type: NodeType.START, label: 'Start', icon: '▶' },
  { type: NodeType.TASK, label: 'Aufgabe', icon: '📝' },
  { type: NodeType.ACTION, label: 'Aktion', icon: '⚡' },
  { type: NodeType.DECISION, label: 'Entscheidung', icon: '❓' },
  { type: NodeType.END, label: 'Ende', icon: '✓' },
];

function createNewWorkflow() {
  if (!workflowName.value) return;

  const workflow = workflowStore.createWorkflow(workflowName.value, workflowDescription.value);

  // Add default start node
  const startNode: WorkflowNode = {
    id: generateId(),
    type: NodeType.START,
    label: 'Start',
    position: { x: 100, y: 200 },
    data: {},
  };
  workflowStore.addNode(workflow.id, startNode);

  workflowName.value = '';
  workflowDescription.value = '';
  showCreateDialog.value = false;
}

function addNode(type: NodeType) {
  if (!currentWorkflow.value) return;

  const lastNode = currentWorkflow.value.nodes[currentWorkflow.value.nodes.length - 1];
  const x = lastNode ? lastNode.position.x + 200 : 100;
  const y = lastNode ? lastNode.position.y : 200;

  const node: WorkflowNode = {
    id: generateId(),
    type,
    label: getDefaultLabel(type),
    position: { x, y },
    data: type === NodeType.TASK ? { fields: [] } : {},
  };

  workflowStore.addNode(currentWorkflow.value.id, node);

  // Auto-connect to last node
  if (lastNode && lastNode.type !== NodeType.END) {
    workflowStore.addEdge(currentWorkflow.value.id, {
      id: generateId(),
      source: lastNode.id,
      target: node.id,
    });
  }
}

function getDefaultLabel(type: NodeType): string {
  switch (type) {
    case NodeType.START:
      return 'Start';
    case NodeType.TASK:
      return 'Neue Aufgabe';
    case NodeType.ACTION:
      return 'Neue Aktion';
    case NodeType.DECISION:
      return 'Entscheidung';
    case NodeType.END:
      return 'Ende';
    default:
      return 'Knoten';
  }
}

function editNode(node: WorkflowNode) {
  selectedNode.value = { ...node };
  showNodeEditor.value = true;
}

function saveNode() {
  if (!selectedNode.value || !currentWorkflow.value) return;

  workflowStore.updateNode(currentWorkflow.value.id, selectedNode.value.id, selectedNode.value);
  showNodeEditor.value = false;
  selectedNode.value = null;
}

function deleteNode(nodeId: string) {
  if (!currentWorkflow.value) return;
  if (confirm('Knoten wirklich löschen?')) {
    workflowStore.removeNode(currentWorkflow.value.id, nodeId);
  }
}

function addField() {
  if (!selectedNode.value || !selectedNode.value.data.fields) return;

  selectedNode.value.data.fields.push({
    name: `field${selectedNode.value.data.fields.length + 1}`,
    label: 'Neues Feld',
    type: FieldType.TEXT,
    required: false,
  });
}

function removeField(index: number) {
  if (!selectedNode.value || !selectedNode.value.data.fields) return;
  selectedNode.value.data.fields.splice(index, 1);
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
</script>

<template>
  <div class="workflow-editor">
    <!-- Header -->
    <div class="editor-header">
      <h2>Workflow-Editor</h2>
      <button v-if="!currentWorkflow" class="ct-btn ct-btn-primary" @click="showCreateDialog = true">
        + Neuer Workflow
      </button>
      <div v-else class="workflow-info">
        <h3>{{ currentWorkflow.name }}</h3>
        <p>{{ currentWorkflow.description }}</p>
      </div>
    </div>

    <!-- Create Dialog -->
    <div v-if="showCreateDialog" class="modal-overlay" @click.self="showCreateDialog = false">
      <div class="modal-content">
        <h3>Neuer Workflow</h3>
        <div class="ct-form-group">
          <label class="ct-form-label">Name</label>
          <input v-model="workflowName" type="text" class="ct-form-control" />
        </div>
        <div class="ct-form-group">
          <label class="ct-form-label">Beschreibung</label>
          <textarea v-model="workflowDescription" class="ct-form-control" rows="3" />
        </div>
        <div class="modal-actions">
          <button class="ct-btn ct-btn-secondary" @click="showCreateDialog = false">Abbrechen</button>
          <button class="ct-btn ct-btn-primary" @click="createNewWorkflow">Erstellen</button>
        </div>
      </div>
    </div>

    <!-- Editor Content -->
    <div v-if="currentWorkflow" class="editor-content">
      <!-- Toolbar -->
      <div class="editor-toolbar">
        <h4>Knoten hinzufügen:</h4>
        <div class="node-palette">
          <button
            v-for="nodeType in nodeTypes"
            :key="nodeType.type"
            class="node-button"
            :title="nodeType.label"
            @click="addNode(nodeType.type)"
          >
            <span class="node-icon">{{ nodeType.icon }}</span>
            <span class="node-label">{{ nodeType.label }}</span>
          </button>
        </div>
      </div>

      <!-- Diagram -->
      <div class="editor-diagram">
        <WorkflowDiagram :workflow="currentWorkflow" />
      </div>

      <!-- Node List -->
      <div class="editor-nodes">
        <h4>Knoten ({{ currentWorkflow.nodes.length }})</h4>
        <div class="node-list">
          <div v-for="node in currentWorkflow.nodes" :key="node.id" class="node-item">
            <span class="node-type">{{ node.type }}</span>
            <span class="node-name">{{ node.label }}</span>
            <div class="node-actions">
              <button class="ct-btn ct-btn-sm" @click="editNode(node)">✏️</button>
              <button
                v-if="node.type !== NodeType.START"
                class="ct-btn ct-btn-sm"
                @click="deleteNode(node.id)"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Node Editor Dialog -->
    <div v-if="showNodeEditor && selectedNode" class="modal-overlay" @click.self="showNodeEditor = false">
      <div class="modal-content modal-large">
        <h3>Knoten bearbeiten</h3>

        <div class="ct-form-group">
          <label class="ct-form-label">Label</label>
          <input v-model="selectedNode.label" type="text" class="ct-form-control" />
        </div>

        <div class="ct-form-group">
          <label class="ct-form-label">Beschreibung</label>
          <textarea v-model="selectedNode.description" class="ct-form-control" rows="2" />
        </div>

        <!-- Task Fields -->
        <div v-if="selectedNode.type === NodeType.TASK" class="task-fields">
          <h4>Formularfelder</h4>
          <div v-for="(field, index) in selectedNode.data.fields" :key="index" class="field-editor">
            <div class="field-row">
              <input v-model="field.name" type="text" class="ct-form-control" placeholder="Feldname" />
              <input v-model="field.label" type="text" class="ct-form-control" placeholder="Label" />
              <select v-model="field.type" class="ct-form-control">
                <option :value="FieldType.TEXT">Text</option>
                <option :value="FieldType.TEXTAREA">Textarea</option>
                <option :value="FieldType.NUMBER">Zahl</option>
                <option :value="FieldType.EMAIL">E-Mail</option>
                <option :value="FieldType.SELECT">Auswahl</option>
                <option :value="FieldType.CHECKBOX">Checkbox</option>
              </select>
              <label>
                <input v-model="field.required" type="checkbox" />
                Pflicht
              </label>
              <button class="ct-btn ct-btn-sm" @click="removeField(index)">✕</button>
            </div>
          </div>
          <button class="ct-btn ct-btn-secondary ct-btn-sm" @click="addField">+ Feld hinzufügen</button>
        </div>

        <div class="modal-actions">
          <button class="ct-btn ct-btn-secondary" @click="showNodeEditor = false">Abbrechen</button>
          <button class="ct-btn ct-btn-primary" @click="saveNode">Speichern</button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!currentWorkflow" class="empty-state">
      <p>Erstelle einen neuen Workflow um zu beginnen</p>
    </div>
  </div>
</template>

<style scoped>
.workflow-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-header {
  padding: 1rem;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.workflow-info h3 {
  margin: 0;
  font-size: 1.2rem;
}

.workflow-info p {
  margin: 0.25rem 0 0;
  color: #666;
  font-size: 0.9rem;
}

.editor-content {
  flex: 1;
  display: grid;
  grid-template-columns: 250px 1fr 300px;
  gap: 1rem;
  padding: 1rem;
  overflow: hidden;
}

.editor-toolbar {
  border-right: 1px solid #ddd;
  padding-right: 1rem;
}

.node-palette {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.node-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.node-button:hover {
  background: #f5f5f5;
  border-color: var(--ct-primary);
}

.node-icon {
  font-size: 1.5rem;
}

.node-label {
  font-size: 0.9rem;
}

.editor-diagram {
  overflow: auto;
}

.editor-nodes {
  border-left: 1px solid #ddd;
  padding-left: 1rem;
  overflow-y: auto;
}

.node-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
}

.node-type {
  font-size: 0.75rem;
  padding: 2px 6px;
  background: #e3f2fd;
  border-radius: 3px;
  text-transform: uppercase;
}

.node-name {
  flex: 1;
  font-size: 0.9rem;
}

.node-actions {
  display: flex;
  gap: 0.25rem;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-large {
  max-width: 800px;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.task-fields {
  margin-top: 1rem;
}

.field-editor {
  margin-bottom: 0.5rem;
}

.field-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.field-row input[type='text'],
.field-row select {
  flex: 1;
}

.field-row label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
}
</style>
