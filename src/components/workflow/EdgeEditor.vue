<script setup lang="ts">
import { ref, watch } from 'vue';
import SimpleRulesEditor from './SimpleRulesEditor.vue';
import type { WorkflowEdge, SimpleRules } from '@/types/workflow.types';

const props = defineProps<{
  edge: WorkflowEdge;
  availableFields: Array<{ name: string; label: string; type: string }>;
}>();

const emit = defineEmits<{
  save: [edge: WorkflowEdge];
  cancel: [];
}>();

const localEdge = ref<WorkflowEdge>({ ...props.edge });

// Initialize condition if not exists
if (!localEdge.value.condition) {
  localEdge.value.condition = {
    engine: 'simple',
    rule: { conditions: [], logic: 'AND' } as SimpleRules,
  };
}

// Watch for engine changes
watch(() => localEdge.value.condition?.engine, (newEngine) => {
  if (newEngine === 'simple' && !localEdge.value.condition?.rule) {
    localEdge.value.condition = {
      engine: 'simple',
      rule: { conditions: [], logic: 'AND' } as SimpleRules,
    };
  }
});

function save() {
  emit('save', localEdge.value);
}

function cancel() {
  emit('cancel');
}
</script>

<template>
  <div class="edge-editor">
    <h3>Verbindung bearbeiten</h3>

    <div class="ct-form-group">
      <label class="ct-form-label">Label (optional)</label>
      <input 
        v-model="localEdge.label" 
        type="text" 
        class="ct-form-control"
        placeholder="z.B. 'Ja', 'Nein', 'Erwachsen'"
      />
    </div>

    <div class="ct-form-group">
      <label class="checkbox-label">
        <input type="checkbox" v-model="localEdge.isDefault" />
        Als Default-Verbindung markieren
      </label>
      <small class="ct-form-text">
        Diese Verbindung wird genommen, wenn keine andere Bedingung zutrifft
      </small>
    </div>

    <div v-if="!localEdge.isDefault" class="condition-section">
      <h4>Bedingung</h4>
      
      <div class="ct-form-group">
        <label class="ct-form-label">Rule Engine</label>
        <select v-model="localEdge.condition!.engine" class="ct-form-control">
          <option value="simple">Einfache Regeln</option>
          <option value="jsonlogic" disabled>JSONLogic (coming soon)</option>
          <option value="custom" disabled>Custom Expression (coming soon)</option>
        </select>
      </div>

      <SimpleRulesEditor
        v-if="localEdge.condition?.engine === 'simple'"
        v-model="localEdge.condition.rule"
        :available-fields="availableFields"
      />

      <div v-if="localEdge.condition?.engine === 'jsonlogic'" class="coming-soon">
        <p>JSONLogic Editor wird in Kürze verfügbar sein.</p>
      </div>

      <div v-if="localEdge.condition?.engine === 'custom'" class="coming-soon">
        <p>Custom Expression Editor wird in Kürze verfügbar sein.</p>
      </div>
    </div>

    <div class="modal-actions">
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
</style>
