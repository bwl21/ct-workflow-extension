<script setup lang="ts">
import { ref } from 'vue';
import type { WorkflowEdge } from '@/types/workflow.types';

const props = defineProps<{
  edge: WorkflowEdge;
}>();

const emit = defineEmits<{
  save: [edge: WorkflowEdge];
  cancel: [];
  delete: [];
}>();

const localEdge = ref<WorkflowEdge>({ ...props.edge });

function save() {
  emit('save', localEdge.value);
}

function cancel() {
  emit('cancel');
}

function deleteEdge() {
  if (confirm('Verbindung wirklich löschen?')) {
    emit('delete');
  }
}
</script>

<template>
  <div class="edge-editor">
    <h3>Verbindung bearbeiten</h3>
    
    <p class="info-text">
      ℹ️ Bedingungen werden jetzt am Decision-Node konfiguriert, nicht an den Verbindungen.
    </p>

    <div class="ct-form-group">
      <label class="ct-form-label">Label (optional)</label>
      <input 
        v-model="localEdge.label" 
        type="text" 
        class="ct-form-control"
        placeholder="z.B. 'Ja', 'Nein', 'Erwachsen'"
      />
    </div>
    
    <div v-if="localEdge.sourceHandle" class="ct-form-group">
      <label class="ct-form-label">Ausgang</label>
      <input :value="localEdge.sourceHandle" type="text" class="ct-form-control" disabled />
      <small class="form-text text-muted">
        Diese Verbindung ist mit dem Ausgang "{{ localEdge.sourceHandle }}" des Decision-Nodes verbunden
      </small>
    </div>

    <div class="modal-actions">
      <button class="ct-btn ct-btn-danger" @click="deleteEdge">🗑️ Löschen</button>
      <div style="flex: 1"></div>
      <button class="ct-btn ct-btn-secondary" @click="cancel">Abbrechen</button>
      <button class="ct-btn ct-btn-primary" @click="save">Speichern</button>
    </div>
  </div>
</template>

<style scoped>
.edge-editor {
  padding: 1.5rem;
}

.edge-editor h3 {
  margin: 0 0 1.5rem 0;
}

.edge-editor h4 {
  margin: 1.5rem 0 1rem 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.condition-section {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.coming-soon {
  padding: 2rem;
  text-align: center;
  background: white;
  border-radius: 4px;
  border: 2px dashed #dee2e6;
  color: #6c757d;
}

.coming-soon p {
  margin: 0;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.info-text {
  background: #e3f2fd;
  padding: 0.75rem;
  border-radius: 4px;
  border-left: 4px solid #2196f3;
  margin-bottom: 1rem;
  color: #1565c0;
}
</style>
