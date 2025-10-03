<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ActionContext } from '@/types/action-plugin.types';

interface Props {
  config: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: any;
    timeout: number;
    responseMapping: Record<string, string>;
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

const addHeader = () => {
  const newKey = `header${Object.keys(localConfig.value.headers).length + 1}`;
  localConfig.value.headers = {
    ...localConfig.value.headers,
    [newKey]: '',
  };
  updateConfig();
};

const updateHeaderKey = (oldKey: string, newKey: string) => {
  const value = localConfig.value.headers[oldKey];
  const { [oldKey]: _, ...rest } = localConfig.value.headers;
  localConfig.value.headers = { ...rest, [newKey]: value };
  updateConfig();
};

const updateHeaderValue = (key: string, value: string) => {
  localConfig.value.headers[key] = value;
  updateConfig();
};

const removeHeader = (key: string) => {
  const { [key]: _, ...rest } = localConfig.value.headers;
  localConfig.value.headers = rest;
  updateConfig();
};

const showBody = computed(() => {
  return ['POST', 'PUT', 'PATCH'].includes(localConfig.value.method);
});
</script>

<template>
  <div class="rest-api-config">
    <div class="ct-form-group">
      <label class="ct-form-label">HTTP-Methode</label>
      <select v-model="localConfig.method" class="ct-form-control" @change="updateConfig">
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="DELETE">DELETE</option>
        <option value="PATCH">PATCH</option>
      </select>
    </div>

    <div class="ct-form-group">
      <label class="ct-form-label">URL</label>
      <input
        v-model="localConfig.url"
        type="text"
        class="ct-form-control"
        placeholder="https://api.example.com/endpoint"
        @blur="updateConfig"
      />
      <small class="ct-form-text">
        Verfügbare Variablen: <code v-for="v in availableVariables" :key="v">{{ `{{${v}}}` }}</code>
      </small>
    </div>

    <div class="ct-form-group">
      <label class="ct-form-label">Headers</label>
      <div v-for="(value, key) in localConfig.headers" :key="key" class="header-row">
        <input
          :value="key"
          type="text"
          class="ct-form-control"
          placeholder="Header Name"
          @blur="(e) => updateHeaderKey(key as string, (e.target as HTMLInputElement).value)"
        />
        <input
          :value="value"
          type="text"
          class="ct-form-control"
          placeholder="Header Value"
          @blur="(e) => updateHeaderValue(key as string, (e.target as HTMLInputElement).value)"
        />
        <button type="button" class="ct-btn ct-btn-secondary" @click="removeHeader(key as string)">
          ✕
        </button>
      </div>
      <button type="button" class="ct-btn ct-btn-secondary ct-btn-sm" @click="addHeader">
        + Header hinzufügen
      </button>
    </div>

    <div v-if="showBody" class="ct-form-group">
      <label class="ct-form-label">Request Body (JSON)</label>
      <textarea
        v-model="localConfig.body"
        class="ct-form-control"
        rows="6"
        placeholder='{ "key": "value" }'
        @blur="updateConfig"
      />
      <small class="ct-form-text"> Verwende Variablen mit <code>{{ '{{variableName}}' }}</code> </small>
    </div>

    <div class="ct-form-group">
      <label class="ct-form-label">Timeout (ms)</label>
      <input
        v-model.number="localConfig.timeout"
        type="number"
        class="ct-form-control"
        min="1000"
        max="300000"
        step="1000"
        @blur="updateConfig"
      />
    </div>

    <div class="ct-form-group">
      <label class="ct-form-label">Response Mapping</label>
      <small class="ct-form-text">
        Mappe Response-Felder auf Workflow-Variablen (z.B. <code>data.id → userId</code>)
      </small>
      <div class="mapping-info">
        <p>Wird in zukünftiger Version implementiert</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rest-api-config {
  padding: 1rem;
}

.header-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.header-row input {
  flex: 1;
}

.header-row button {
  width: 40px;
  flex-shrink: 0;
}

.mapping-info {
  padding: 0.5rem;
  background: var(--ct-secondary);
  border-radius: 4px;
  margin-top: 0.5rem;
}

.ct-form-text code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
  margin: 0 2px;
}
</style>
