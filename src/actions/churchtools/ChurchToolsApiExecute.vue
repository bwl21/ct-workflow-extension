<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { churchtoolsClient } from '@churchtools/churchtools-client';
import type { ActionContext, ActionResult } from '@/types/action-plugin.types';

const props = defineProps<{
  config: {
    method: string;
    endpoint: string;
    params: Record<string, string>;
    body: any;
    responseMapping: Record<string, string>;
  };
  context: ActionContext;
}>();

const emit = defineEmits<{
  (e: 'complete', result: ActionResult): void;
}>();

const loading = ref(false);
const status = ref<'pending' | 'success' | 'error'>('pending');
const message = ref('');
const responseData = ref<any>(null);

/**
 * Interpoliert Variablen in einem String
 */
const interpolateVariables = (str: string): string => {
  if (typeof str !== 'string') return str;
  
  return str.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    const value = props.context.helpers.getVariable(varName);
    return value !== undefined ? String(value) : match;
  });
};

/**
 * Interpoliert Variablen in einem Objekt (rekursiv)
 */
const interpolateObject = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return interpolateVariables(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(interpolateObject);
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = interpolateObject(value);
    }
    return result;
  }
  
  return obj;
};

/**
 * Führt den API-Call aus
 */
const execute = async () => {
  loading.value = true;
  const startTime = Date.now();

  try {
    // Interpoliere Endpoint
    const endpoint = interpolateVariables(props.config.endpoint);
    message.value = `Führe ${props.config.method} ${endpoint} aus...`;

    let response: any;

    // Führe API-Call aus basierend auf Methode
    switch (props.config.method) {
      case 'GET': {
        const params = interpolateObject(props.config.params);
        response = await churchtoolsClient.get(endpoint, params);
        break;
      }

      case 'POST': {
        const body = interpolateObject(
          typeof props.config.body === 'string'
            ? JSON.parse(props.config.body)
            : props.config.body
        );
        response = await churchtoolsClient.post(endpoint, body);
        break;
      }

      case 'PUT': {
        const body = interpolateObject(
          typeof props.config.body === 'string'
            ? JSON.parse(props.config.body)
            : props.config.body
        );
        response = await churchtoolsClient.put(endpoint, body);
        break;
      }

      case 'PATCH': {
        const body = interpolateObject(
          typeof props.config.body === 'string'
            ? JSON.parse(props.config.body)
            : props.config.body
        );
        response = await churchtoolsClient.patch(endpoint, body);
        break;
      }

      case 'DELETE': {
        response = await churchtoolsClient.deleteApi(endpoint);
        break;
      }

      default:
        throw new Error(`Ungültige HTTP-Methode: ${props.config.method}`);
    }

    // Extrahiere Response-Daten
    responseData.value = response.data || response;

    // TODO: Response Mapping implementieren
    // Für jetzt speichern wir die gesamte Response
    props.context.helpers.setVariable('lastApiResponse', responseData.value);

    status.value = 'success';
    message.value = `${props.config.method} ${endpoint} erfolgreich ausgeführt`;

    emit('complete', {
      success: true,
      data: responseData.value,
      duration: Date.now() - startTime,
    });
  } catch (error: any) {
    status.value = 'error';
    
    // Baue Fehlermeldung mit Validierungsfehlern
    let errorMessage = error.response?.data?.translatedMessage || 
                       error.response?.data?.message || 
                       error.message || 
                       'Unbekannter Fehler';
    
    // Füge Validierungsfehler direkt zur Message hinzu
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      errorMessage += '\n\nValidierungsfehler:\n';
      error.response.data.errors.forEach((err: any) => {
        errorMessage += `• ${err.fieldId}: ${err.message}\n`;
      });
    }
    
    message.value = errorMessage;
    responseData.value = null;

    emit('complete', {
      success: false,
      error: errorMessage,
      duration: Date.now() - startTime,
    });
  } finally {
    loading.value = false;
  }
};

onMounted(() => execute());
</script>

<template>
  <div class="ct-api-execute">
    <div v-if="loading" class="status loading">
      <div class="spinner"></div>
      <p>{{ message }}</p>
    </div>

    <div v-else-if="status === 'success'" class="status success">
      <div class="icon">✓</div>
      <p>{{ message }}</p>
      
      <div v-if="responseData" class="response-preview">
        <details>
          <summary>Response anzeigen</summary>
          <pre>{{ JSON.stringify(responseData, null, 2) }}</pre>
        </details>
      </div>
    </div>

    <div v-else-if="status === 'error'" class="status error">
      <div class="icon">✕</div>
      <p style="white-space: pre-line;">{{ message }}</p>
    </div>
  </div>
</template>

<style scoped>
.ct-api-execute {
  padding: 1rem;
}

.status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  border-radius: 8px;
}

.status.loading {
  background: #f5f5f5;
}

.status.success {
  background: #e8f5e9;
  color: #2e7d32;
}

.status.error {
  background: #ffebee;
  color: #c62828;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.icon {
  font-size: 3rem;
  font-weight: bold;
}

.status p {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
}

.response-preview {
  width: 100%;
  margin-top: 1rem;
}

.response-preview details {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.5rem;
}

.response-preview summary {
  cursor: pointer;
  font-weight: bold;
  padding: 0.5rem;
  user-select: none;
}

.response-preview summary:hover {
  background: #f5f5f5;
}

.response-preview pre {
  margin: 0.5rem 0 0 0;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.9rem;
  max-height: 400px;
  overflow-y: auto;
}

.validation-errors {
  width: 100%;
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  border: 2px solid #ef5350;
  border-radius: 4px;
  text-align: left;
}

.validation-errors h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: #c62828;
}

.validation-errors ul {
  margin: 0;
  padding-left: 1.5rem;
  list-style: disc;
}

.validation-errors li {
  margin: 0.5rem 0;
  font-size: 0.9rem;
  line-height: 1.5;
}

.validation-errors li strong {
  color: #c62828;
  font-weight: 600;
}

.error-details {
  width: 100%;
  margin-top: 1rem;
}

.error-details details {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.5rem;
}

.error-details summary {
  cursor: pointer;
  font-weight: bold;
  padding: 0.5rem;
  user-select: none;
  color: #666;
  font-size: 0.9rem;
}

.error-details summary:hover {
  background: #f5f5f5;
}

.error-info {
  padding: 1rem;
  text-align: left;
}

.error-info p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.error-info strong {
  color: #333;
}
</style>
