<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ActionContext } from '@/types/action-plugin.types';

interface Props {
  config: {
    to: string;
    cc: string;
    bcc: string;
    subject: string;
    body: string;
    isHtml: boolean;
    attachments: string[];
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

const insertVariable = (field: 'to' | 'cc' | 'bcc' | 'subject' | 'body', variable: string) => {
  localConfig.value[field] += `{{${variable}}}`;
  updateConfig();
};
</script>

<template>
  <div class="email-config">
    <div class="ct-form-group">
      <label class="ct-form-label">Empfänger (To) *</label>
      <input
        v-model="localConfig.to"
        type="text"
        class="ct-form-control"
        placeholder="email@example.com oder {{userEmail}}"
        @blur="updateConfig"
      />
      <small class="ct-form-text"> Mehrere Empfänger mit Komma trennen </small>
    </div>

    <div class="ct-form-group">
      <label class="ct-form-label">CC</label>
      <input
        v-model="localConfig.cc"
        type="text"
        class="ct-form-control"
        placeholder="email@example.com"
        @blur="updateConfig"
      />
    </div>

    <div class="ct-form-group">
      <label class="ct-form-label">BCC</label>
      <input
        v-model="localConfig.bcc"
        type="text"
        class="ct-form-control"
        placeholder="email@example.com"
        @blur="updateConfig"
      />
    </div>

    <div class="ct-form-group">
      <label class="ct-form-label">Betreff *</label>
      <input
        v-model="localConfig.subject"
        type="text"
        class="ct-form-control"
        placeholder="E-Mail Betreff"
        @blur="updateConfig"
      />
    </div>

    <div class="ct-form-group">
      <label class="ct-form-label">Nachricht *</label>
      <textarea
        v-model="localConfig.body"
        class="ct-form-control"
        rows="10"
        placeholder="E-Mail Nachricht..."
        @blur="updateConfig"
      />
    </div>

    <div class="ct-form-group">
      <label class="ct-form-label">
        <input v-model="localConfig.isHtml" type="checkbox" @change="updateConfig" />
        HTML-Format verwenden
      </label>
    </div>

    <div class="ct-form-group">
      <label class="ct-form-label">Verfügbare Variablen</label>
      <div class="variables-list">
        <code v-for="v in availableVariables" :key="v" class="variable-tag">
          {{ `{{${v}}}` }}
        </code>
      </div>
      <small class="ct-form-text">
        Verwende diese Variablen in Empfänger, Betreff oder Nachricht
      </small>
    </div>
  </div>
</template>

<style scoped>
.email-config {
  padding: 1rem;
}

.variables-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.variable-tag {
  background: #e3f2fd;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
  cursor: pointer;
  transition: background 0.2s;
}

.variable-tag:hover {
  background: #bbdefb;
}
</style>
