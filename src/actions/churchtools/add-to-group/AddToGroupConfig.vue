<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ActionContext } from '@/types/action-plugin.types';

interface Props {
  config: {
    personId: number | null;
    groupId: number | null;
    roleId: number | null;
    personIdVariable: string;
    groupIdVariable: string;
  };
  context: ActionContext;
}

interface Emits {
  (e: 'update:config', config: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localConfig = ref({ ...props.config });

const updateConfig = () => {
  emit('update:config', localConfig.value);
};

const availableVariables = computed(() => {
  return Object.keys(props.context.workflowContext);
});

const usePersonVariable = ref(!!localConfig.value.personIdVariable);
const useGroupVariable = ref(!!localConfig.value.groupIdVariable);

const togglePersonVariable = () => {
  usePersonVariable.value = !usePersonVariable.value;
  if (usePersonVariable.value) {
    localConfig.value.personId = null;
  } else {
    localConfig.value.personIdVariable = '';
  }
  updateConfig();
};

const toggleGroupVariable = () => {
  useGroupVariable.value = !useGroupVariable.value;
  if (useGroupVariable.value) {
    localConfig.value.groupId = null;
  } else {
    localConfig.value.groupIdVariable = '';
  }
  updateConfig();
};
</script>

<template>
  <div class="add-to-group-config">
    <div class="ct-form-group">
      <label class="ct-form-label">Person</label>
      
      <div class="input-mode-toggle">
        <label>
          <input type="checkbox" :checked="usePersonVariable" @change="togglePersonVariable" />
          Aus Variable
        </label>
      </div>

      <div v-if="!usePersonVariable">
        <input
          v-model.number="localConfig.personId"
          type="number"
          class="ct-form-control"
          placeholder="Person ID"
          @blur="updateConfig"
        />
        <small class="ct-form-text">ID der Person</small>
      </div>

      <div v-else>
        <select v-model="localConfig.personIdVariable" class="ct-form-control" @change="updateConfig">
          <option value="">-- Variable wählen --</option>
          <option v-for="v in availableVariables" :key="v" :value="v">
            {{ v }}
          </option>
        </select>
        <small class="ct-form-text">Variable mit Person ID</small>
      </div>
    </div>

    <div class="ct-form-group">
      <label class="ct-form-label">Gruppe</label>
      
      <div class="input-mode-toggle">
        <label>
          <input type="checkbox" :checked="useGroupVariable" @change="toggleGroupVariable" />
          Aus Variable
        </label>
      </div>

      <div v-if="!useGroupVariable">
        <input
          v-model.number="localConfig.groupId"
          type="number"
          class="ct-form-control"
          placeholder="Gruppen ID"
          @blur="updateConfig"
        />
        <small class="ct-form-text">ID der Gruppe</small>
      </div>

      <div v-else>
        <select v-model="localConfig.groupIdVariable" class="ct-form-control" @change="updateConfig">
          <option value="">-- Variable wählen --</option>
          <option v-for="v in availableVariables" :key="v" :value="v">
            {{ v }}
          </option>
        </select>
        <small class="ct-form-text">Variable mit Gruppen ID</small>
      </div>
    </div>

    <div class="ct-form-group">
      <label class="ct-form-label">Rolle (optional)</label>
      <input
        v-model.number="localConfig.roleId"
        type="number"
        class="ct-form-control"
        placeholder="Rollen ID (optional)"
        @blur="updateConfig"
      />
      <small class="ct-form-text">ID der Gruppenrolle (leer lassen für Standard-Rolle)</small>
    </div>

    <div class="ct-alert ct-alert-info">
      <strong>Hinweis:</strong> Diese Action fügt eine Person einer Gruppe hinzu.
      Die Person und Gruppe müssen bereits in ChurchTools existieren.
    </div>
  </div>
</template>

<style scoped>
.add-to-group-config {
  padding: 1rem;
}

.input-mode-toggle {
  margin-bottom: 0.5rem;
}

.input-mode-toggle label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: normal;
}

.ct-form-text {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #6c757d;
}

.ct-alert {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 4px;
  border-left: 4px solid;
}

.ct-alert-info {
  background: #e7f3ff;
  border-color: #2196f3;
  color: #0d47a1;
}
</style>
