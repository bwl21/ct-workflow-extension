<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ActionContext } from '@/types/action-plugin.types';
import PlaceholderDropdown from '@/components/workflow/PlaceholderDropdown.vue';

interface Props {
  config: {
    method: string;
    endpoint: string;
    params: Record<string, string>;
    body: any;
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
  const variables: string[] = [];
  
  // Basis-Variablen aus Context
  Object.keys(props.context.workflowContext).forEach(key => {
    const value = props.context.workflowContext[key];
    
    // Wenn es ein Objekt ist (z.B. Person), füge auch Properties hinzu
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      variables.push(key);
      Object.keys(value).forEach(prop => {
        variables.push(`${key}.${prop}`);
      });
    } else {
      variables.push(key);
    }
  });
  
  return variables;
});

const formatVariable = (v: string) => {
  return `{{${v}}}`;
};

// Häufige ChurchTools Endpoints
const commonEndpoints = [
  { value: '/persons', label: 'Personen' },
  { value: '/persons/{id}', label: 'Person (einzeln)' },
  { value: '/groups', label: 'Gruppen' },
  { value: '/groups/{id}', label: 'Gruppe (einzeln)' },
  { value: '/groups/{id}/members', label: 'Gruppenmitglieder' },
  { value: '/events', label: 'Events' },
  { value: '/events/{id}', label: 'Event (einzeln)' },
  { value: '/custommodules', label: 'Custom Modules' },
  { value: '/whoami', label: 'Aktueller User' },
  { value: '/permissions/global', label: 'Globale Berechtigungen' },
];

const addParam = () => {
  const newKey = `param${Object.keys(localConfig.value.params).length + 1}`;
  localConfig.value.params = {
    ...localConfig.value.params,
    [newKey]: '',
  };
  updateConfig();
};

const updateParamKey = (oldKey: string, newKey: string) => {
  const value = localConfig.value.params[oldKey];
  const { [oldKey]: _, ...rest } = localConfig.value.params;
  localConfig.value.params = { ...rest, [newKey]: value };
  updateConfig();
};

const updateParamValue = (key: string, value: string) => {
  localConfig.value.params[key] = value;
  updateConfig();
};

const removeParam = (key: string) => {
  const { [key]: _, ...rest } = localConfig.value.params;
  localConfig.value.params = rest;
  updateConfig();
};

const showBody = computed(() => {
  return ['POST', 'PUT', 'PATCH'].includes(localConfig.value.method);
});

const showParams = computed(() => {
  return localConfig.value.method === 'GET';
});

const bodyTextarea = ref<HTMLTextAreaElement>();

const insertPlaceholder = (variable: string) => {
  const placeholder = `{{${variable}}}`;
  
  if (bodyTextarea.value) {
    const start = bodyTextarea.value.selectionStart;
    const end = bodyTextarea.value.selectionEnd;
    const text = localConfig.value.body || '';
    
    localConfig.value.body = text.substring(0, start) + placeholder + text.substring(end);
    updateConfig();
    
    // Cursor nach dem Platzhalter setzen
    setTimeout(() => {
      if (bodyTextarea.value) {
        const newPos = start + placeholder.length;
        bodyTextarea.value.focus();
        bodyTextarea.value.setSelectionRange(newPos, newPos);
      }
    }, 0);
  } else {
    // Fallback: Am Ende anhängen
    localConfig.value.body = (localConfig.value.body || '') + placeholder;
    updateConfig();
  }
};
</script>

<template>
  <div class="ct-api-config">
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
      <label class="ct-form-label">Endpoint</label>
      <input
        v-model="localConfig.endpoint"
        type="text"
        class="ct-form-control"
        placeholder="/persons"
        list="common-endpoints"
        @blur="updateConfig"
      />
      <datalist id="common-endpoints">
        <option v-for="ep in commonEndpoints" :key="ep.value" :value="ep.value">
          {{ ep.label }}
        </option>
      </datalist>
      <small class="ct-form-text">
        Ohne <code>/api</code> Prefix (wird automatisch hinzugefügt).
        Verfügbare Variablen: <code v-for="v in availableVariables" :key="v">{{ formatVariable(v) }}</code>
      </small>
    </div>

    <div v-if="showParams" class="ct-form-group">
      <label class="ct-form-label">Query-Parameter</label>
      <div v-for="(value, key) in localConfig.params" :key="key" class="param-row">
        <input
          :value="key"
          type="text"
          class="ct-form-control"
          placeholder="Parameter Name"
          @blur="(e) => updateParamKey(key as string, (e.target as HTMLInputElement).value)"
        />
        <input
          :value="value"
          type="text"
          class="ct-form-control"
          placeholder="Parameter Value"
          @blur="(e) => updateParamValue(key as string, (e.target as HTMLInputElement).value)"
        />
        <button type="button" class="ct-btn ct-btn-secondary" @click="removeParam(key as string)">
          ✕
        </button>
      </div>
      <button type="button" class="ct-btn ct-btn-secondary ct-btn-sm" @click="addParam">
        + Parameter hinzufügen
      </button>
    </div>

    <div v-if="showBody" class="ct-form-group">
      <div class="label-with-dropdown">
        <label class="ct-form-label">Request Body (JSON)</label>
        <PlaceholderDropdown
          :available-variables="availableVariables"
          @select="insertPlaceholder"
        />
      </div>
      <textarea
        ref="bodyTextarea"
        v-model="localConfig.body"
        class="ct-form-control"
        rows="8"
        placeholder='{ "firstName": "{{firstName}}", "lastName": "{{lastName}}" }'
        @blur="updateConfig"
      />
      <small class="ct-form-text">
        Verwende Variablen mit <code>{{ formatVariable('variableName') }}</code>
      </small>
    </div>

    <div class="ct-form-group">
      <label class="ct-form-label">Response Mapping</label>
      <small class="ct-form-text">
        Mappe Response-Felder auf Workflow-Variablen (z.B. <code>data.id → personId</code>)
      </small>
      <div class="mapping-info">
        <p>Wird in zukünftiger Version implementiert</p>
      </div>
    </div>

    <div class="ct-alert ct-alert-info">
      <strong>Hinweis:</strong> Der ChurchTools API-Client fügt automatisch das <code>/api</code> Prefix
      hinzu und verwendet die aktuelle Session für die Authentifizierung.
    </div>
  </div>
</template>

<style scoped>
.ct-api-config {
  padding: 1rem;
}

.label-with-dropdown {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.param-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.param-row input {
  flex: 1;
}

.param-row button {
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
