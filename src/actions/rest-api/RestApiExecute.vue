<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { ActionContext, ActionResult } from '@/types/action-plugin.types';

interface Props {
  config: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: any;
    timeout: number;
  };
  context: ActionContext;
}

interface Emits {
  (e: 'complete', result: ActionResult): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const loading = ref(false);
const status = ref<'pending' | 'success' | 'error'>('pending');
const message = ref('');
const responseData = ref<any>(null);

const replaceVariables = (str: string): string => {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return props.context.helpers.getVariable(key) || '';
  });
};

const replaceVariablesInObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return replaceVariables(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(replaceVariablesInObject);
  }
  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = replaceVariablesInObject(value);
    }
    return result;
  }
  return obj;
};

const executeRequest = async () => {
  loading.value = true;
  status.value = 'pending';
  message.value = 'Führe API-Request aus...';

  const startTime = Date.now();

  try {
    const url = replaceVariables(props.config.url);
    const headers = replaceVariablesInObject(props.config.headers);
    const body = props.config.body ? replaceVariablesInObject(props.config.body) : undefined;

    props.context.helpers.log.info(`Executing ${props.config.method} ${url}`);

    const response = await props.context.helpers.http.request({
      method: props.config.method as any,
      url,
      headers,
      data: body,
      timeout: props.config.timeout,
    });

    const duration = Date.now() - startTime;

    status.value = 'success';
    message.value = `Request erfolgreich (Status: ${response.status}, ${duration}ms)`;
    responseData.value = response.data;

    props.context.helpers.log.info(`Request successful: ${response.status}`);

    emit('complete', {
      success: true,
      data: response.data,
      metadata: {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      },
      duration,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;

    status.value = 'error';
    message.value = `Fehler: ${error.message}`;

    props.context.helpers.log.error(`Request failed: ${error.message}`);

    emit('complete', {
      success: false,
      error: error.message,
      duration,
    });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  executeRequest();
});
</script>

<template>
  <div class="rest-api-execute">
    <div v-if="loading" class="status-indicator loading">
      <div class="spinner"></div>
      <p>{{ message }}</p>
    </div>

    <div v-else-if="status === 'success'" class="status-indicator success">
      <div class="icon">✓</div>
      <p>{{ message }}</p>
      <details v-if="responseData" class="response-details">
        <summary>Response anzeigen</summary>
        <pre>{{ JSON.stringify(responseData, null, 2) }}</pre>
      </details>
    </div>

    <div v-else-if="status === 'error'" class="status-indicator error">
      <div class="icon">✕</div>
      <p>{{ message }}</p>
    </div>
  </div>
</template>

<style scoped>
.rest-api-execute {
  padding: 2rem;
}

.status-indicator {
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--ct-secondary);
  border-top-color: var(--ct-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.success .icon {
  color: #4caf50;
}

.error .icon {
  color: #f44336;
}

.response-details {
  margin-top: 1rem;
  text-align: left;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.response-details summary {
  cursor: pointer;
  padding: 0.5rem;
  background: var(--ct-secondary);
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.response-details pre {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.85rem;
  max-height: 300px;
  overflow-y: auto;
}
</style>
