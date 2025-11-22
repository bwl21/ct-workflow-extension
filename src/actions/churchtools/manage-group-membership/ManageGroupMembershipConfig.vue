<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ActionContext } from '@/types/action-plugin.types';
import PlaceholderDropdown from '@/components/workflow/PlaceholderDropdown.vue';

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

// Helper functions for placeholder insertion
const insertPlaceholder = (field: keyof typeof localConfig.value, variable: string) => {
  const currentValue = localConfig.value[field] || '';
  localConfig.value[field] = currentValue + `{{${variable}}}`;
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

    <!-- Role ID -->
    <div class="ct-form-group">
      <label class="ct-form-label">Rollen-ID</label>
      <div class="input-with-placeholder">
        <input
          v-model="localConfig.roleId"
          type="text"
          class="ct-form-control"
          placeholder="z.B. {{roleId}} oder 1"
          @input="updateConfig"
        />
        <PlaceholderDropdown
          :available-variables="availableVariables"
          @select="(v) => insertPlaceholder('roleId', v)"
        />
      </div>
      <small class="ct-form-text">ID der Rolle in der Gruppe (optional)</small>
    </div>

    <div class="config-section">
      <h4>Gruppenmerkmalfelder (GMF)</h4>
      <p class="section-description">
        Optional: Setze Werte für Gruppenmerkmalfelder.
      </p>
    </div>

    <!-- GMF Reference Name -->
    <div class="ct-form-group">
      <label class="ct-form-label">GMF Referenzname</label>
      <div class="input-with-placeholder">
        <input
          v-model="localConfig.gmfReferenceName"
          type="text"
          class="ct-form-control"
          placeholder="z.B. status oder {{gmfReferenceName}}"
          @input="updateConfig"
        />
        <PlaceholderDropdown
          :available-variables="availableVariables"
          @select="(v) => insertPlaceholder('gmfReferenceName', v)"
        />
      </div>
      <small class="ct-form-text">Referenzname des Gruppenmerkmalfelds</small>
    </div>

    <!-- GMF ID -->
    <div class="ct-form-group">
      <label class="ct-form-label">GMF-ID</label>
      <div class="input-with-placeholder">
        <input
          v-model="localConfig.gmfId"
          type="text"
          class="ct-form-control"
          placeholder="z.B. {{gmfId}} oder 5"
          @input="updateConfig"
        />
        <PlaceholderDropdown
          :available-variables="availableVariables"
          @select="(v) => insertPlaceholder('gmfId', v)"
        />
      </div>
      <small class="ct-form-text">ID des Gruppenmerkmalfelds</small>
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
</style>
