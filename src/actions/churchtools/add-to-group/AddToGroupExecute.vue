<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { GroupService } from '@/services/GroupService';
import type { ActionContext, ActionResult } from '@/types/action-plugin.types';
import { extractApiErrorInfo, extractApiErrorDetails, type ApiErrorInfo } from '@/utils/errorHelper';

const props = defineProps<{
  config: {
    personId: number | null;
    groupId: number | null;
    roleId: number | null;
    personIdVariable: string;
    groupIdVariable: string;
  };
  context: ActionContext;
}>();

const emit = defineEmits<{
  (e: 'complete', result: ActionResult): void;
}>();

const loading = ref(false);
const status = ref<'pending' | 'success' | 'error'>('pending');
const message = ref('');
const errorInfo = ref<ApiErrorInfo | null>(null);

/**
 * Führt die Action aus
 */
const execute = async () => {
  loading.value = true;
  const startTime = Date.now();

  try {
    // Resolve Person ID
    const personId = props.config.personId || 
      props.context.helpers.getVariable(props.config.personIdVariable);
    
    // Resolve Group ID
    const groupId = props.config.groupId || 
      props.context.helpers.getVariable(props.config.groupIdVariable);

    if (!personId) {
      throw new Error('Person ID ist erforderlich');
    }

    if (!groupId) {
      throw new Error('Gruppen ID ist erforderlich');
    }

    message.value = `Füge Person ${personId} zu Gruppe ${groupId} hinzu...`;

    // Führe API-Call über GroupService aus
    await GroupService.addMemberToGroup(
      Number(groupId),
      Number(personId),
      props.config.roleId ? Number(props.config.roleId) : undefined
    );

    status.value = 'success';
    message.value = `Person ${personId} erfolgreich zu Gruppe ${groupId} hinzugefügt`;

    // Speichere Ergebnis im Workflow-Kontext
    props.context.helpers.setVariables({
      lastAddedPersonId: personId,
      lastAddedToGroupId: groupId,
    });

    emit('complete', {
      success: true,
      data: {
        personId,
        groupId,
        roleId: props.config.roleId,
      },
      duration: Date.now() - startTime,
    });
  } catch (error: any) {
    status.value = 'error';
    
    // Extrahiere vollständige Fehlerinformationen
    errorInfo.value = extractApiErrorInfo(error);
    const errorDetails = extractApiErrorDetails(error);
    
    message.value = `Fehler: ${errorInfo.value.message}`;

    console.error('[AddToGroupExecute] Error:', error);
    console.error('[AddToGroupExecute] Error Details:', errorDetails);

    emit('complete', {
      success: false,
      error: errorInfo.value.message,
      duration: Date.now() - startTime,
    });
  } finally {
    loading.value = false;
  }
};

onMounted(() => execute());
</script>

<template>
  <div class="add-to-group-execute">
    <div v-if="loading" class="status loading">
      <div class="spinner"></div>
      <p>{{ message }}</p>
    </div>

    <div v-else-if="status === 'success'" class="status success">
      <div class="icon">✓</div>
      <p>{{ message }}</p>
    </div>

    <div v-else-if="status === 'error'" class="status error">
      <div class="icon">✕</div>
      <p>{{ message }}</p>
      
      <!-- Fehler-Details als JSON -->
      <div v-if="errorInfo" class="error-details">
        <details open>
          <summary>Fehler-Details</summary>
          <pre>{{ JSON.stringify(errorInfo, null, 2) }}</pre>
        </details>
      </div>
    </div>
  </div>
</template>

<style scoped>
.add-to-group-execute {
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

.error-details {
  width: 100%;
  margin-top: 1rem;
}

.error-details details {
  background: white;
  border: 1px solid #ef5350;
  border-radius: 4px;
  padding: 0.5rem;
}

.error-details summary {
  cursor: pointer;
  font-weight: bold;
  padding: 0.5rem;
  user-select: none;
  color: #c62828;
}

.error-details summary:hover {
  background: #ffebee;
}

.error-details pre {
  margin: 0.5rem 0 0 0;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.85rem;
  max-height: 400px;
  overflow-y: auto;
  text-align: left;
}
</style>
