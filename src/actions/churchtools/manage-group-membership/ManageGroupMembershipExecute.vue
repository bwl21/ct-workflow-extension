<script setup lang="ts">
import { ref } from 'vue';
import type { ActionContext, ActionResult } from '@/types/action-plugin.types';
import { interpolate } from '@/utils/template-interpolation';

interface Props {
  config: {
    groupName: string;
    groupId: string;
    roleId: string;
    gmfReferenceName: string;
    gmfId: string;
    personId: string;
  };
  context: ActionContext;
}

interface Emits {
  (e: 'complete', result: ActionResult): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const executing = ref(false);
const result = ref<ActionResult | null>(null);

async function execute() {
  executing.value = true;
  result.value = null;

  try {
    // Interpolate all config values with context variables
    const interpolatedConfig = {
      groupName: interpolate(props.config.groupName, props.context.workflowContext),
      groupId: interpolate(props.config.groupId, props.context.workflowContext),
      roleId: interpolate(props.config.roleId, props.context.workflowContext),
      gmfReferenceName: interpolate(props.config.gmfReferenceName, props.context.workflowContext),
      gmfId: interpolate(props.config.gmfId, props.context.workflowContext),
      personId: interpolate(props.config.personId, props.context.workflowContext),
    };

    console.log('[ManageGroupMembership] Interpolated config:', interpolatedConfig);

    // TODO: Implement actual API call
    // For now, just simulate success
    await new Promise(resolve => setTimeout(resolve, 1000));

    const actionResult: ActionResult = {
      success: true,
      data: {
        message: 'Gruppenmitgliedschaft erfolgreich verwaltet (Simulation)',
        personId: interpolatedConfig.personId,
        groupId: interpolatedConfig.groupId,
        groupName: interpolatedConfig.groupName,
        roleId: interpolatedConfig.roleId,
        gmfReferenceName: interpolatedConfig.gmfReferenceName,
        gmfId: interpolatedConfig.gmfId,
      },
      duration: 1000,
    };

    result.value = actionResult;
    emit('complete', actionResult);
  } catch (error) {
    const errorResult: ActionResult = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };

    result.value = errorResult;
    emit('complete', errorResult);
  } finally {
    executing.value = false;
  }
}
</script>

<template>
  <div class="manage-group-membership-execute">
    <div v-if="!result" class="action-pending">
      <h4>Gruppenmitgliedschaft verwalten</h4>
      <p>Diese Aktion wird die Gruppenmitgliedschaft anlegen oder ändern.</p>
      
      <div class="config-preview">
        <h5>Konfiguration:</h5>
        <dl>
          <dt>Person ID:</dt>
          <dd><code>{{ config.personId }}</code></dd>
          
          <dt>Gruppenname:</dt>
          <dd><code>{{ config.groupName || '-' }}</code></dd>
          
          <dt>Gruppen-ID:</dt>
          <dd><code>{{ config.groupId || '-' }}</code></dd>
          
          <dt>Rollen-ID:</dt>
          <dd><code>{{ config.roleId || '-' }}</code></dd>
          
          <dt>GMF Referenzname:</dt>
          <dd><code>{{ config.gmfReferenceName || '-' }}</code></dd>
          
          <dt>GMF-ID:</dt>
          <dd><code>{{ config.gmfId || '-' }}</code></dd>
        </dl>
      </div>

      <button
        class="ct-btn ct-btn-primary"
        :disabled="executing"
        @click="execute"
      >
        {{ executing ? 'Wird ausgeführt...' : 'Ausführen' }}
      </button>
    </div>

    <div v-else class="action-result">
      <div v-if="result.success" class="ct-alert ct-alert-success">
        <strong>✓ Erfolgreich</strong>
        <p>{{ result.data?.message || 'Gruppenmitgliedschaft erfolgreich verwaltet' }}</p>
        
        <details v-if="result.data">
          <summary>Details anzeigen</summary>
          <pre>{{ JSON.stringify(result.data, null, 2) }}</pre>
        </details>
      </div>

      <div v-else class="ct-alert ct-alert-danger">
        <strong>✕ Fehler</strong>
        <p>Fehler beim Verwalten der Gruppenmitgliedschaft</p>
        <pre v-if="result.error">{{ result.error }}</pre>
      </div>
    </div>

    <div class="implementation-note">
      <strong>⚠️ Hinweis:</strong> Die tatsächliche API-Implementierung erfolgt später.
      Aktuell wird nur eine Simulation ausgeführt.
    </div>
  </div>
</template>

<style scoped>
.manage-group-membership-execute {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.action-pending h4 {
  margin: 0 0 0.5rem 0;
  color: #495057;
}

.action-pending p {
  margin: 0 0 1rem 0;
  color: #6c757d;
}

.config-preview {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.config-preview h5 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  color: #495057;
}

.config-preview dl {
  margin: 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.5rem 1rem;
  font-size: 0.875rem;
}

.config-preview dt {
  font-weight: 600;
  color: #495057;
}

.config-preview dd {
  margin: 0;
  color: #6c757d;
}

.config-preview code {
  background: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.85em;
  color: #e83e8c;
}

.ct-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.ct-btn-primary {
  background: #007bff;
  color: white;
}

.ct-btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.ct-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-result {
  margin-top: 1rem;
}

.ct-alert {
  padding: 1rem;
  border-radius: 4px;
  border-left: 4px solid;
}

.ct-alert-success {
  background: #d4edda;
  border-color: #28a745;
  color: #155724;
}

.ct-alert-danger {
  background: #f8d7da;
  border-color: #dc3545;
  color: #721c24;
}

.ct-alert strong {
  display: block;
  margin-bottom: 0.5rem;
}

.ct-alert p {
  margin: 0 0 0.5rem 0;
}

.ct-alert pre {
  margin: 0.5rem 0 0 0;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
  font-size: 0.8rem;
  overflow-x: auto;
}

details {
  margin-top: 0.5rem;
}

details summary {
  cursor: pointer;
  font-weight: 600;
  user-select: none;
}

details summary:hover {
  text-decoration: underline;
}

.implementation-note {
  padding: 1rem;
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #856404;
}

.implementation-note strong {
  display: block;
  margin-bottom: 0.25rem;
}
</style>
