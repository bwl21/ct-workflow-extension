<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ActionContext } from '@/types/action-plugin.types';
import PlaceholderDropdown from '@/components/workflow/PlaceholderDropdown.vue';

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
  (e: 'update:config', config: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localConfig = ref({ 
  ...props.config,
  memberFields: props.config.memberFields || [],
  roleName: props.config.roleName || '',
  memberStartDate: props.config.memberStartDate || '',
  groupMemberStatus: props.config.groupMemberStatus || 'active',
  onlyAdd: props.config.onlyAdd !== undefined ? props.config.onlyAdd : true,
});

const updateConfig = () => {
  emit('update:config', localConfig.value);
};

const availableVariables = computed(() => {
  return Object.keys(props.context.workflowContext);
});

// Helper functions for placeholder insertion
const insertPlaceholder = (field: string, variable: string) => {
  if (field === 'memberFields' || field === 'onlyAdd') return; // Handle separately
  const currentValue = (localConfig.value as any)[field] || '';
  (localConfig.value as any)[field] = currentValue + `{{${variable}}}`;
  updateConfig();
};

const insertPlaceholderInField = (index: number, fieldType: 'referenceName' | 'value', variable: string) => {
  const currentValue = localConfig.value.memberFields[index][fieldType] || '';
  localConfig.value.memberFields[index][fieldType] = currentValue + `{{${variable}}}`;
  updateConfig();
};

const addMemberField = () => {
  localConfig.value.memberFields.push({ referenceName: '', value: '' });
  updateConfig();
};

const removeMemberField = (index: number) => {
  localConfig.value.memberFields.splice(index, 1);
  updateConfig();
};
</script>

<template>
  <div class="manage-group-membership-config">
    <div class="config-section">
      <h4>Gruppenmitgliedschaft</h4>
      <p class="section-description">
        Konfiguriere die Gruppenmitgliedschaft. Alle Felder unterstützen Platzhalter (z.B. <code v-pre>{{personId}}</code>).
      </p>
    </div>

    <!-- Person ID -->
    <div class="ct-form-group">
      <label class="ct-form-label">
        Person ID <span class="required">*</span>
      </label>
      <div class="input-with-placeholder">
        <input
          v-model="localConfig.personId"
          type="text"
          class="ct-form-control"
          placeholder="z.B. {{personId}} oder 123"
          @input="updateConfig"
        />
        <PlaceholderDropdown
          :available-variables="availableVariables"
          @select="(v) => insertPlaceholder('personId', v)"
        />
      </div>
      <small class="ct-form-text">ID der Person, die zur Gruppe hinzugefügt werden soll</small>
    </div>

    <!-- Group Name -->
    <div class="ct-form-group">
      <label class="ct-form-label">Gruppenname</label>
      <div class="input-with-placeholder">
        <input
          v-model="localConfig.groupName"
          type="text"
          class="ct-form-control"
          placeholder="z.B. Mitarbeiter oder {{groupName}}"
          @input="updateConfig"
        />
        <PlaceholderDropdown
          :available-variables="availableVariables"
          @select="(v) => insertPlaceholder('groupName', v)"
        />
      </div>
      <small class="ct-form-text">Name der Gruppe (alternativ zu Gruppen-ID)</small>
    </div>

    <!-- Group ID -->
    <div class="ct-form-group">
      <label class="ct-form-label">Gruppen-ID</label>
      <div class="input-with-placeholder">
        <input
          v-model="localConfig.groupId"
          type="text"
          class="ct-form-control"
          placeholder="z.B. {{groupId}} oder 42"
          @input="updateConfig"
        />
        <PlaceholderDropdown
          :available-variables="availableVariables"
          @select="(v) => insertPlaceholder('groupId', v)"
        />
      </div>
      <small class="ct-form-text">ID der Gruppe (alternativ zu Gruppenname)</small>
    </div>

    <!-- Role Name -->
    <div class="ct-form-group">
      <label class="ct-form-label">Rollenname</label>
      <div class="input-with-placeholder">
        <input
          v-model="localConfig.roleName"
          type="text"
          class="ct-form-control"
          placeholder="z.B. Leiter oder {{rollenname}}"
          @input="updateConfig"
        />
        <PlaceholderDropdown
          :available-variables="availableVariables"
          @select="(v) => insertPlaceholder('roleName', v)"
        />
      </div>
      <small class="ct-form-text">Name der Rolle (alternativ zu Rollen-ID, wird automatisch aufgelöst)</small>
    </div>

    <!-- Role ID -->
    <div class="ct-form-group">
      <label class="ct-form-label">Rollen-ID (groupTypeRoleId)</label>
      <div class="input-with-placeholder">
        <input
          v-model="localConfig.roleId"
          type="text"
          class="ct-form-control"
          placeholder="z.B. {{roleId}} oder 15"
          @input="updateConfig"
        />
        <PlaceholderDropdown
          :available-variables="availableVariables"
          @select="(v) => insertPlaceholder('roleId', v)"
        />
      </div>
      <small class="ct-form-text">ID der Rolle in der Gruppe (alternativ zu Rollenname, optional)</small>
    </div>

    <!-- Member Start Date -->
    <div class="ct-form-group">
      <label class="ct-form-label">Startdatum</label>
      <div class="input-with-placeholder">
        <input
          v-model="localConfig.memberStartDate"
          type="text"
          class="ct-form-control"
          placeholder="z.B. 2025-11-22 oder {{datum}}"
          @input="updateConfig"
        />
        <PlaceholderDropdown
          :available-variables="availableVariables"
          @select="(v) => insertPlaceholder('memberStartDate', v)"
        />
      </div>
      <small class="ct-form-text">Startdatum der Mitgliedschaft (YYYY-MM-DD, optional)</small>
    </div>

    <!-- Group Member Status -->
    <div class="ct-form-group">
      <label class="ct-form-label">Status</label>
      <div class="input-with-placeholder">
        <input
          v-model="localConfig.groupMemberStatus"
          type="text"
          class="ct-form-control"
          placeholder="z.B. active oder {{status}}"
          @input="updateConfig"
        />
        <PlaceholderDropdown
          :available-variables="availableVariables"
          @select="(v) => insertPlaceholder('groupMemberStatus', v)"
        />
      </div>
      <small class="ct-form-text">Status der Mitgliedschaft (z.B. "active", optional)</small>
    </div>

    <!-- Only Add -->
    <div class="ct-form-group">
      <label class="ct-form-label">
        <input
          v-model="localConfig.onlyAdd"
          type="checkbox"
          @change="updateConfig"
        />
        Nur hinzufügen (only_add)
      </label>
      <small class="ct-form-text">Wenn aktiviert, wird die Person nur hinzugefügt, nicht aktualisiert</small>
    </div>

    <div class="config-section">
      <h4>Gruppenmitgliedsfelder</h4>
      <p class="section-description">
        Optional: Setze Werte für Gruppenmitgliedsfelder (z.B. Status, Bemerkung, etc.).
      </p>
    </div>

    <!-- Member Fields List -->
    <div class="member-fields-list">
      <div 
        v-for="(field, index) in localConfig.memberFields" 
        :key="index"
        class="member-field-row"
      >
        <div class="field-number">{{ index + 1 }}</div>
        
        <div class="ct-form-group">
          <label class="ct-form-label">Referenzname</label>
          <div class="input-with-placeholder">
            <input
              v-model="field.referenceName"
              type="text"
              class="ct-form-control"
              placeholder="z.B. status oder {{fieldName}}"
              @input="updateConfig"
            />
            <PlaceholderDropdown
              :available-variables="availableVariables"
              @select="(v) => insertPlaceholderInField(index, 'referenceName', v)"
            />
          </div>
          <small class="ct-form-text">Wird automatisch zur Field-ID aufgelöst</small>
        </div>

        <div class="ct-form-group">
          <label class="ct-form-label">Wert</label>
          <div class="input-with-placeholder">
            <input
              v-model="field.value"
              type="text"
              class="ct-form-control"
              placeholder="z.B. aktiv oder {{status}}"
              @input="updateConfig"
            />
            <PlaceholderDropdown
              :available-variables="availableVariables"
              @select="(v) => insertPlaceholderInField(index, 'value', v)"
            />
          </div>
        </div>

        <button
          type="button"
          class="ct-btn ct-btn-sm btn-remove"
          @click="removeMemberField(index)"
          title="Feld entfernen"
        >
          ✕
        </button>
      </div>

      <button
        type="button"
        class="ct-btn ct-btn-secondary ct-btn-sm"
        @click="addMemberField"
      >
        + Feld hinzufügen
      </button>
    </div>

    <div class="config-info">
      <strong>💡 Tipp:</strong> Verwende Platzhalter aus vorherigen Schritten, um dynamische Werte zu verwenden.
      Klicke auf den 📋 Button, um verfügbare Variablen zu sehen.
    </div>
  </div>
</template>

<style scoped>
.manage-group-membership-config {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.config-section {
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e9ecef;
}

.config-section h4 {
  margin: 0 0 0.5rem 0;
  color: #495057;
  font-size: 1.1rem;
}

.section-description {
  margin: 0;
  color: #6c757d;
  font-size: 0.875rem;
  line-height: 1.5;
}

.section-description code {
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.85em;
  color: #e83e8c;
}

.ct-form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ct-form-label {
  font-weight: 600;
  color: #495057;
  font-size: 0.875rem;
}

.required {
  color: #dc3545;
}

.input-with-placeholder {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.input-with-placeholder .ct-form-control {
  flex: 1;
}

.ct-form-control {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: border-color 0.15s ease-in-out;
}

.ct-form-control:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.ct-form-control::placeholder {
  color: #adb5bd;
}

.ct-form-text {
  color: #6c757d;
  font-size: 0.8rem;
  margin: 0;
}

.config-info {
  padding: 1rem;
  background: #e7f3ff;
  border-left: 4px solid #2196f3;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #1565c0;
}

.config-info strong {
  display: block;
  margin-bottom: 0.25rem;
}

.member-fields-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.member-field-row {
  display: grid;
  grid-template-columns: auto 1fr 1fr auto;
  gap: 1rem;
  align-items: start;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.field-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: #007bff;
  color: white;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.875rem;
  margin-top: 1.5rem;
}

.member-field-row .ct-form-group {
  margin: 0;
}

.btn-remove {
  margin-top: 1.5rem;
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-remove:hover {
  background: #c82333;
}
</style>
