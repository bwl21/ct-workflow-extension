<script setup lang="ts">
import { ref } from 'vue';
import type { SimpleRules } from '@/types/workflow.types';
import { ConditionOperator } from '@/types/workflow.types';

const props = defineProps<{
  modelValue: SimpleRules;
  availableFields: Array<{ name: string; label: string; type: string }>;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: SimpleRules];
}>();

const localRules = ref<SimpleRules>({ ...props.modelValue });

const operators = [
  { value: ConditionOperator.EQUALS, label: 'ist gleich (=)' },
  { value: ConditionOperator.NOT_EQUALS, label: 'ist nicht gleich (≠)' },
  { value: ConditionOperator.GREATER_THAN, label: 'größer als (>)' },
  { value: ConditionOperator.LESS_THAN, label: 'kleiner als (<)' },
  { value: ConditionOperator.GREATER_THAN_OR_EQUAL, label: 'größer oder gleich (≥)' },
  { value: ConditionOperator.LESS_THAN_OR_EQUAL, label: 'kleiner oder gleich (≤)' },
  { value: ConditionOperator.CONTAINS, label: 'enthält' },
  { value: ConditionOperator.NOT_CONTAINS, label: 'enthält nicht' },
  { value: ConditionOperator.STARTS_WITH, label: 'beginnt mit' },
  { value: ConditionOperator.ENDS_WITH, label: 'endet mit' },
  { value: ConditionOperator.IS_EMPTY, label: 'ist leer' },
  { value: ConditionOperator.IS_NOT_EMPTY, label: 'ist nicht leer' },
];

function addCondition() {
  if (!localRules.value.conditions) {
    localRules.value.conditions = [];
  }
  localRules.value.conditions.push({
    field: props.availableFields[0]?.name || '',
    operator: ConditionOperator.EQUALS,
    value: '',
  });
  updateModel();
}

function removeCondition(index: number) {
  localRules.value.conditions.splice(index, 1);
  updateModel();
}

function updateModel() {
  emit('update:modelValue', { ...localRules.value });
}

function needsValue(operator: ConditionOperator): boolean {
  return operator !== ConditionOperator.IS_EMPTY && operator !== ConditionOperator.IS_NOT_EMPTY;
}
</script>

<template>
  <div class="simple-rules-editor">
    <div class="rules-header">
      <h4>Bedingungen</h4>
      <div class="logic-selector">
        <label>
          <input 
            type="radio" 
            value="AND" 
            v-model="localRules.logic"
            @change="updateModel"
          />
          Alle Bedingungen müssen erfüllt sein (UND)
        </label>
        <label>
          <input 
            type="radio" 
            value="OR" 
            v-model="localRules.logic"
            @change="updateModel"
          />
          Mindestens eine Bedingung muss erfüllt sein (ODER)
        </label>
      </div>
    </div>

    <div v-if="localRules.conditions.length === 0" class="empty-state">
      <p>Noch keine Bedingungen definiert.</p>
      <button class="ct-btn ct-btn-secondary" @click="addCondition">
        + Erste Bedingung hinzufügen
      </button>
    </div>

    <div v-else class="conditions-list">
      <div 
        v-for="(condition, index) in localRules.conditions" 
        :key="index" 
        class="condition-row"
      >
        <div class="condition-number">{{ index + 1 }}</div>
        
        <select 
          v-model="condition.field" 
          class="ct-form-control"
          @change="updateModel"
        >
          <option value="">Feld wählen...</option>
          <option 
            v-for="field in availableFields" 
            :key="field.name" 
            :value="field.name"
          >
            {{ field.label }}
          </option>
        </select>

        <select 
          v-model="condition.operator" 
          class="ct-form-control"
          @change="updateModel"
        >
          <option 
            v-for="op in operators" 
            :key="op.value" 
            :value="op.value"
          >
            {{ op.label }}
          </option>
        </select>

        <input 
          v-if="needsValue(condition.operator)"
          v-model="condition.value" 
          type="text" 
          class="ct-form-control"
          placeholder="Wert"
          @input="updateModel"
        />

        <button 
          class="ct-btn ct-btn-sm btn-remove" 
          @click="removeCondition(index)"
          title="Bedingung entfernen"
        >
          ✕
        </button>
      </div>

      <button class="ct-btn ct-btn-secondary ct-btn-sm" @click="addCondition">
        + Weitere Bedingung
      </button>
    </div>

    <div v-if="localRules.conditions.length > 0" class="rules-preview">
      <h5>Vorschau:</h5>
      <code>
        <template v-for="(condition, index) in localRules.conditions" :key="index">
          <span v-if="index > 0" class="logic-operator">
            {{ localRules.logic === 'AND' ? 'UND' : 'ODER' }}
          </span>
          <span class="condition-text">
            {{ availableFields.find(f => f.name === condition.field)?.label || condition.field }}
            {{ operators.find(o => o.value === condition.operator)?.label }}
            <span v-if="needsValue(condition.operator)">
              "{{ condition.value }}"
            </span>
          </span>
        </template>
      </code>
    </div>
  </div>
</template>

<style scoped>
.simple-rules-editor {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.rules-header {
  margin-bottom: 1rem;
}

.rules-header h4 {
  margin: 0 0 0.75rem 0;
}

.logic-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.logic-selector label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 4px;
  border: 2px dashed #dee2e6;
}

.empty-state p {
  margin: 0 0 1rem 0;
  color: #6c757d;
}

.conditions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.condition-row {
  display: grid;
  grid-template-columns: 32px 1fr 1.5fr 1fr 40px;
  gap: 0.5rem;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.condition-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #007bff;
  color: white;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.875rem;
}

.btn-remove {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.375rem 0.5rem;
  min-width: 32px;
}

.btn-remove:hover {
  background: #c82333;
}

.rules-preview {
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.rules-preview h5 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: #6c757d;
}

.rules-preview code {
  display: block;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.8;
  color: #212529;
}

.logic-operator {
  display: inline-block;
  margin: 0 0.5rem;
  padding: 0.125rem 0.5rem;
  background: #007bff;
  color: white;
  border-radius: 3px;
  font-weight: 600;
  font-size: 0.75rem;
}

.condition-text {
  display: inline-block;
}
</style>
