<script setup lang="ts">
import { ref } from 'vue';
import type { ActionContext, ActionResult } from '@/types/action-plugin.types';
import { interpolate } from '@/utils/template-interpolation';
import { churchtoolsClient } from '@churchtools/churchtools-client';

interface MemberField {
  referenceName: string;
  value: string;
}

interface Props {
  config: {
    groupName: string;
    groupId: string;
    roleName: string;
    roleId: string;
    personId: string;
    memberStartDate: string;
    groupMemberStatus: string;
    onlyAdd: boolean;
    memberFields: MemberField[];
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
    const startTime = Date.now();

    // Interpolate all config values with context variables
    const interpolatedConfig = {
      groupName: interpolate(props.config.groupName, props.context.workflowContext),
      groupId: interpolate(props.config.groupId, props.context.workflowContext),
      roleName: interpolate(props.config.roleName, props.context.workflowContext),
      roleId: interpolate(props.config.roleId, props.context.workflowContext),
      personId: interpolate(props.config.personId, props.context.workflowContext),
      memberStartDate: interpolate(props.config.memberStartDate, props.context.workflowContext),
      groupMemberStatus: interpolate(props.config.groupMemberStatus, props.context.workflowContext),
      onlyAdd: props.config.onlyAdd,
      memberFields: (props.config.memberFields || []).map(field => ({
        referenceName: interpolate(field.referenceName, props.context.workflowContext),
        value: interpolate(field.value, props.context.workflowContext),
      })),
    };

    console.log('[ManageGroupMembership] Interpolated config:', interpolatedConfig);

    // Resolve groupId from groupName if needed
    let groupId = interpolatedConfig.groupId;
    if (!groupId && interpolatedConfig.groupName) {
      console.log('[ManageGroupMembership] Resolving group by name:', interpolatedConfig.groupName);
      const groups: any = await churchtoolsClient.get('/groups', {
          query: interpolatedConfig.groupName,
          limit: 100,
          page: 1
      });
      // Find exact match by name
      const group = groups.find((g: any) => g.name === interpolatedConfig.groupName);
      if (!group) {
        throw new Error(`Gruppe "${interpolatedConfig.groupName}" nicht gefunden`);
      }
      groupId = group.id;
      console.log('[ManageGroupMembership] Resolved groupId:', groupId);
    }

    if (!groupId) {
      throw new Error('Gruppen-ID oder Gruppenname erforderlich');
    }

    // Fetch group details (includes roles and fields)
    console.log('[ManageGroupMembership] Fetching group details for group:', groupId);
    const groupData: any = await churchtoolsClient.get(`/groups/${groupId}`);
    console.log('[ManageGroupMembership] Group data:', groupData);

    // Resolve roleId from roleName if needed
    let roleId = interpolatedConfig.roleId;
    if (!roleId && interpolatedConfig.roleName) {
      console.log('[ManageGroupMembership] Resolving role by name:', interpolatedConfig.roleName);
      const roles = groupData.roles || [];
      const role = roles.find((r: any) => r.name === interpolatedConfig.roleName);
      if (!role) {
        throw new Error(`Rolle "${interpolatedConfig.roleName}" nicht gefunden in Gruppe ${groupId}`);
      }
      roleId = role.groupTypeRoleId.toString();
      console.log('[ManageGroupMembership] Resolved roleId (groupTypeRoleId):', roleId);
    }

    // Get available fields from group data
    const availableFields = groupData.fields || [];
    console.log('[ManageGroupMembership] Available fields:', availableFields);

    // Build fields object: { fieldId: [value] }
    const fields: Record<string, string[]> = {};
    for (const field of interpolatedConfig.memberFields) {
      if (!field.referenceName || !field.value) continue;

      // Find field by referenceName
      const fieldDef = availableFields.find((f: any) => 
        f.referenceName === field.referenceName || 
        f.name === field.referenceName
      );

      if (!fieldDef) {
        console.warn(`[ManageGroupMembership] Field "${field.referenceName}" not found, skipping`);
        continue;
      }

      const fieldId = fieldDef.id.toString();
      fields[fieldId] = [field.value];
      console.log(`[ManageGroupMembership] Mapped ${field.referenceName} -> ${fieldId} = ${field.value}`);
    }

    // Build request body
    const requestBody: any = {
      fields,
    };

    if (roleId) {
      requestBody.groupTypeRoleId = parseInt(roleId);
    }

    if (interpolatedConfig.memberStartDate) {
      requestBody.memberStartDate = interpolatedConfig.memberStartDate;
    }

    if (interpolatedConfig.groupMemberStatus) {
      requestBody.groupMemberStatus = interpolatedConfig.groupMemberStatus;
    }

    console.log('[ManageGroupMembership] Request body:', requestBody);

    // Make API call
    const queryParams = interpolatedConfig.onlyAdd ? '?only_add=true' : '';
    const endpoint = `/groups/${groupId}/members/${interpolatedConfig.personId}${queryParams}`;
    console.log('[ManageGroupMembership] PUT', endpoint);

    const response: any = await churchtoolsClient.put(endpoint, requestBody);

    const duration = Date.now() - startTime;

    const actionResult: ActionResult = {
      success: true,
      data: {
        message: 'Gruppenmitgliedschaft erfolgreich verwaltet',
        personId: interpolatedConfig.personId,
        groupId,
        groupName: interpolatedConfig.groupName,
        roleName: interpolatedConfig.roleName,
        roleId,
        memberFields: interpolatedConfig.memberFields,
        response: response.data,
      },
      duration,
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
          
          <dt>Rollenname:</dt>
          <dd><code>{{ config.roleName || '-' }}</code></dd>

          <dt>Rollen-ID:</dt>
          <dd><code>{{ config.roleId || '-' }}</code></dd>

          <dt>Startdatum:</dt>
          <dd><code>{{ config.memberStartDate || '-' }}</code></dd>

          <dt>Status:</dt>
          <dd><code>{{ config.groupMemberStatus || 'active' }}</code></dd>

          <dt>Nur hinzufügen:</dt>
          <dd><code>{{ config.onlyAdd ? 'Ja' : 'Nein' }}</code></dd>
        </dl>

        <div v-if="config.memberFields && config.memberFields.length > 0" class="member-fields-preview">
          <h5>Gruppenmitgliedsfelder:</h5>
          <dl>
            <template v-for="(field, index) in config.memberFields" :key="index">
              <dt>{{ field.referenceName || '(leer)' }}:</dt>
              <dd><code>{{ field.value || '-' }}</code></dd>
            </template>
          </dl>
          <small class="field-note">Referenznamen werden automatisch zu Field-IDs aufgelöst</small>
        </div>
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

.member-fields-preview {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
}

.member-fields-preview h5 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  color: #495057;
}

.field-note {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #6c757d;
  font-style: italic;
}
</style>
