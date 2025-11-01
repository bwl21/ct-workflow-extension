<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useWorkflowStore } from '@/stores/workflow';
import { useExecutionStore } from '@/stores/execution';
import VueFlowDiagram from './VueFlowDiagram.vue';
import PersonSelector from '@/components/common/PersonSelector.vue';
import { NodeType, ExecutionStatus, FieldType } from '@/types/workflow.types';
import { interpolate } from '@/utils/template-interpolation';
import { renderMarkdownSync } from '@/utils/markdown-renderer';
import { extractStyledHTML, extractPlainHTML } from '@/utils/html-extractor';
import { useToast } from '@/composables/useToast';

const workflowStore = useWorkflowStore();
const executionStore = useExecutionStore();
const { showSuccess } = useToast();

const formData = ref<Record<string, any>>({});

const currentExecution = computed(() => executionStore.currentExecution);
const currentNode = computed(() => executionStore.currentNode);
const currentWorkflow = computed(() => {
  if (!currentExecution.value) return null;
  return workflowStore.getWorkflowById(currentExecution.value.workflowId);
});

const interpolatedDescription = computed(() => {
  if (!currentNode.value?.description || !currentExecution.value) {
    return currentNode.value?.description || '';
  }
  
  // Kombiniere Context-Variablen mit aktuellen formData
  // So werden Platzhalter auch während der Eingabe aufgelöst
  const combinedContext = {
    ...currentExecution.value.context.variables,
    ...formData.value
  };
  
  // 1. Interpoliere Platzhalter
  const interpolated = interpolate(
    currentNode.value.description,
    combinedContext
  );
  
  // 2. Rendere Markdown zu HTML
  return renderMarkdownSync(interpolated);
});

const isCompleted = computed(() => {
  return currentExecution.value?.status === ExecutionStatus.COMPLETED;
});

// Computed property für interpolierte defaultValues
// Wird automatisch aktualisiert, wenn sich formData ändert
const interpolatedDefaults = computed(() => {
  if (!currentNode.value || currentNode.value.type !== NodeType.TASK) {
    return {};
  }
  
  const fields = currentNode.value.data.fields || [];
  const contextVars = currentExecution.value?.context.variables || {};
  const defaults: Record<string, any> = {};
  
  // Kombiniere Context mit aktuellen formData für Live-Interpolation
  const combinedContext = {
    ...contextVars,
    ...formData.value
  };
  
  fields.forEach(field => {
    if (field.defaultValue) {
      const interpolated = interpolate(
        String(field.defaultValue),
        combinedContext
      );
      defaults[field.name] = interpolated;
    }
  });
  
  return defaults;
});

function initializeFormData() {
  if (!currentNode.value || currentNode.value.type !== NodeType.TASK) {
    return;
  }
  
  const fields = currentNode.value.data.fields || [];
  const contextVars = currentExecution.value?.context.variables || {};
  
  formData.value = {};
  
  fields.forEach(field => {
    // Priorität 1: Wert aus Context (Feld wurde schon mal ausgefüllt)
    if (contextVars[field.name] !== undefined) {
      formData.value[field.name] = contextVars[field.name];
    }
    // Priorität 2: Spezielle Defaults
    else if (field.type === 'multiselect') {
      formData.value[field.name] = [];
    }
    // Priorität 3: Leerer String für Text-Felder (defaultValue wird über interpolatedDefaults gehandhabt)
    else if (['text', 'email', 'tel', 'url', 'textarea'].includes(field.type)) {
      formData.value[field.name] = '';
    }
  });
}

function startWorkflow(workflowId: number) {
  executionStore.startExecution(workflowId);
  initializeFormData();
}

function submitStep() {
  if (!currentExecution.value) return;

  // Validate required fields
  if (currentNode.value?.type === NodeType.TASK && currentNode.value.data.fields) {
    const requiredFields = currentNode.value.data.fields.filter((f) => f.required);
    for (const field of requiredFields) {
      if (!formData.value[field.name]) {
        alert(`Bitte fülle das Pflichtfeld "${field.label}" aus`);
        return;
      }
    }
  }

  executionStore.completeStep(currentExecution.value.id, { ...formData.value });
  formData.value = {};
}

function cancelWorkflow() {
  if (!currentExecution.value) return;
  if (confirm('Workflow wirklich abbrechen?')) {
    executionStore.cancelExecution(currentExecution.value.id);
  }
}

function handleFileChange(event: Event, fieldName: string) {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    // Store file names for now (in production, you'd upload to server)
    const fileNames = Array.from(target.files).map(f => f.name);
    formData.value[fieldName] = target.multiple ? fileNames : fileNames[0];
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString('de-DE');
}

function getInterpolatedFieldValue(field: any): string {
  if (!currentExecution.value) return '';
  
  // Kombiniere Context mit formData für Live-Interpolation
  const combinedContext = {
    ...currentExecution.value.context.variables,
    ...formData.value
  };
  
  // 1. Interpoliere Platzhalter im defaultValue
  const interpolated = interpolate(
    field.defaultValue || '',
    combinedContext
  );
  
  // 2. Rendere Markdown zu HTML
  return renderMarkdownSync(interpolated);
}

type CopyFormat = 'markdown' | 'html-styled' | 'html-plain';

async function copyToClipboard(fieldName: string, format: CopyFormat = 'markdown') {
  if (!currentNode.value?.data.fields) return;
  
  const field = currentNode.value.data.fields.find(f => f.name === fieldName);
  if (!field) return;
  
  // Kombiniere Context mit formData
  const combinedContext = {
    ...currentExecution.value?.context.variables || {},
    ...formData.value
  };
  
  // Interpoliere Platzhalter
  const interpolated = interpolate(
    field.defaultValue || '',
    combinedContext
  );
  
  try {
    switch (format) {
      case 'markdown':
        // Roher Markdown-Text als Plain Text
        await navigator.clipboard.writeText(interpolated);
        break;
        
      case 'html-styled':
        // Rich Text (HTML) mit Formatierung - für Word, E-Mail, etc.
        const htmlWithStyles = renderMarkdownSync(interpolated);
        const styledHtml = extractStyledHTML(htmlWithStyles);
        
        // Kopiere als Rich Text (HTML + Plain Text Fallback)
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([styledHtml], { type: 'text/html' }),
            'text/plain': new Blob([interpolated], { type: 'text/plain' })
          })
        ]);
        break;
        
      case 'html-plain':
        // HTML ohne Styles - übernimmt Ziel-Styling
        const plainHtml = renderMarkdownSync(interpolated);
        const unstyled = extractPlainHTML(plainHtml);
        
        // Kopiere als Rich Text ohne inline-styles
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([unstyled], { type: 'text/html' }),
            'text/plain': new Blob([interpolated], { type: 'text/plain' })
          })
        ]);
        break;
    }
    
    showCopyFeedback(format);
  } catch (err) {
    console.error('Kopieren fehlgeschlagen:', err);
    alert('Kopieren fehlgeschlagen. Bitte manuell kopieren.');
  }
}

const openDropdown = ref<string | null>(null);

function showCopyFeedback(format: CopyFormat) {
  const messages = {
    'markdown': 'Markdown in Zwischenablage kopiert',
    'html-styled': 'HTML mit Formatierung kopiert',
    'html-plain': 'HTML ohne Formatierung kopiert'
  };
  
  showSuccess(messages[format], {
    title: 'Erfolgreich kopiert',
    duration: 3000
  });
}

function toggleDropdown(fieldName: string) {
  openDropdown.value = openDropdown.value === fieldName ? null : fieldName;
}

function closeDropdown() {
  openDropdown.value = null;
}

async function copyAndClose(fieldName: string, format: CopyFormat) {
  await copyToClipboard(fieldName, format);
  closeDropdown();
}

// Watch für automatische Initialisierung bei Node-Wechsel
watch(currentNode, () => {
  if (currentNode.value?.type === NodeType.TASK) {
    initializeFormData();
  }
}, { immediate: true });

// Watch für Live-Update der defaultValues
// Wenn ein Feld leer ist und ein interpolierter defaultValue existiert, fülle es aus
watch(interpolatedDefaults, (newDefaults) => {
  if (!currentNode.value || currentNode.value.type !== NodeType.TASK) {
    return;
  }
  
  const fields = currentNode.value.data.fields || [];
  
  fields.forEach(field => {
    // Nur aktualisieren, wenn:
    // 1. Ein defaultValue existiert
    // 2. Das Feld noch leer/unberührt ist
    // 3. Der interpolierte Wert sich geändert hat
    if (field.defaultValue && newDefaults[field.name]) {
      const currentValue = formData.value[field.name];
      const newValue = newDefaults[field.name];
      
      // Wenn Feld leer ist oder noch den alten interpolierten Wert hat
      if (!currentValue || currentValue === '') {
        formData.value[field.name] = newValue;
      }
    }
  });
}, { deep: true });

// Click-Outside Handler für Dropdown
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.copy-dropdown')) {
    closeDropdown();
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="workflow-executor">
    <!-- Header -->
    <div class="executor-header">
      <h2>Workflow-Ausführung</h2>
      <div v-if="currentWorkflow" class="workflow-info">
        <h3>{{ currentWorkflow.name }}</h3>
        <p>{{ currentWorkflow.description }}</p>
      </div>
    </div>

    <!-- Workflow Selection -->
    <div v-if="!currentExecution" class="workflow-selection">
      <h3>Workflow auswählen</h3>
      <div class="workflow-list">
        <div
          v-for="workflow in workflowStore.workflows"
          :key="workflow.id"
          class="workflow-card"
          @click="startWorkflow(workflow.id)"
        >
          <h4>{{ workflow.name }}</h4>
          <p>{{ workflow.description }}</p>
          <div class="workflow-meta">
            <span>{{ workflow.definition.nodes.length }} Schritte</span>
            <span>Erstellt: {{ formatDate(workflow.createdAt) }}</span>
          </div>
        </div>
      </div>
      <div v-if="workflowStore.workflows.length === 0" class="empty-state">
        <p>Keine Workflows verfügbar. Erstelle zuerst einen Workflow im Editor.</p>
      </div>
    </div>

    <!-- Execution View -->
    <div v-else class="execution-view">
      <!-- Left: Diagram -->
      <div class="execution-diagram">
        <h4>Workflow-Fortschritt</h4>
        <VueFlowDiagram
          v-if="currentWorkflow"
          :definition="currentWorkflow.definition"
          :readonly="true"
          :current-node-id="currentExecution.currentNodeId"
        />
      </div>

      <!-- Center: Current Step -->
      <div class="execution-workspace">
        <div v-if="!isCompleted" class="current-step">
          <h3>{{ currentNode?.label }}</h3>
          <div 
            v-if="interpolatedDescription" 
            class="step-description"
            v-html="interpolatedDescription"
          ></div>

          <!-- Task Form -->
          <div v-if="currentNode?.type === NodeType.TASK && currentNode.data.fields" class="task-form">
            <div
              v-for="field in currentNode.data.fields"
              :key="field.name"
              class="ct-form-group"
            >
              <!-- DISPLAY Field (Read-only mit Markdown + Copy Dropdown) -->
              <div v-if="field.type === 'display'" class="display-field">
                <div class="display-field-header">
                  <label class="ct-form-label">{{ field.label }}</label>
                  <div class="copy-dropdown">
                    <button 
                      type="button"
                      class="copy-btn"
                      @click="toggleDropdown(field.name)"
                      title="Kopierformat auswählen"
                    >
                      📋 Kopieren ▼
                    </button>
                    <div 
                      v-if="openDropdown === field.name"
                      class="copy-options"
                      @click.stop
                    >
                      <button 
                        type="button"
                        @click="copyAndClose(field.name, 'markdown')"
                        title="Roher Markdown-Text"
                      >
                        📝 Markdown
                      </button>
                      <button 
                        type="button"
                        @click="copyAndClose(field.name, 'html-styled')"
                        title="HTML mit Styling für Word"
                      >
                        🎨 HTML + Style
                      </button>
                      <button 
                        type="button"
                        @click="copyAndClose(field.name, 'html-plain')"
                        title="HTML ohne Styling"
                      >
                        📄 HTML
                      </button>
                    </div>
                  </div>
                </div>
                <div 
                  class="display-field-content"
                  v-html="getInterpolatedFieldValue(field)"
                  @click="closeDropdown"
                ></div>
              </div>

              <!-- Regular Fields -->
              <template v-else>
                <label class="ct-form-label">
                  {{ field.label }}
                  <span v-if="field.required" class="required">*</span>
                </label>

                <!-- Person Selector -->
                <PersonSelector
                  v-if="field.type === FieldType.PERSON || field.type === FieldType.PERSON_MULTI"
                  v-model="formData[field.name]"
                  :multiple="field.type === FieldType.PERSON_MULTI"
                  :required="field.required"
                  :placeholder="field.placeholder"
                  :filter="field.personFilter"
                />

                <!-- Text inputs -->
              <input
                v-if="['text', 'email', 'tel', 'url', 'date', 'datetime-local', 'time', 'color'].includes(field.type)"
                v-model="formData[field.name]"
                :type="field.type"
                class="ct-form-control"
                :placeholder="field.placeholder || interpolatedDefaults[field.name]"
                :required="field.required"
              />

              <!-- Textarea -->
              <textarea
                v-else-if="field.type === 'textarea'"
                v-model="formData[field.name]"
                class="ct-form-control"
                rows="4"
                :placeholder="field.placeholder || interpolatedDefaults[field.name]"
                :required="field.required"
              />

              <!-- Number -->
              <input
                v-else-if="field.type === 'number'"
                v-model.number="formData[field.name]"
                type="number"
                class="ct-form-control"
                :placeholder="field.placeholder"
                :required="field.required"
              />

              <!-- Range -->
              <div v-else-if="field.type === 'range'" class="range-field">
                <input
                  v-model.number="formData[field.name]"
                  type="range"
                  class="ct-form-range"
                  :min="field.min || 0"
                  :max="field.max || 100"
                  :step="field.step || 1"
                  :required="field.required"
                />
                <span class="range-value">{{ formData[field.name] || field.min || 0 }}</span>
              </div>

              <!-- Select -->
              <select
                v-else-if="field.type === 'select'"
                v-model="formData[field.name]"
                class="ct-form-control"
                :required="field.required"
              >
                <option value="">Bitte wählen...</option>
                <option v-for="option in field.options" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>

              <!-- Multiselect -->
              <select
                v-else-if="field.type === 'multiselect'"
                v-model="formData[field.name]"
                class="ct-form-control"
                :required="field.required"
                multiple
                size="5"
              >
                <option v-for="option in field.options" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>

              <!-- Radio -->
              <div v-else-if="field.type === 'radio'" class="radio-group">
                <label v-for="option in field.options" :key="option" class="radio-label">
                  <input
                    v-model="formData[field.name]"
                    type="radio"
                    :value="option"
                    :name="field.name"
                    :required="field.required"
                  />
                  {{ option }}
                </label>
              </div>

              <!-- Checkbox -->
              <label v-else-if="field.type === 'checkbox'" class="checkbox-label">
                <input v-model="formData[field.name]" type="checkbox" />
                {{ field.placeholder || 'Ja' }}
              </label>

              <!-- File -->
              <input
                v-else-if="field.type === 'file'"
                @change="handleFileChange($event, field.name)"
                type="file"
                class="ct-form-control"
                :accept="field.accept"
                :multiple="field.multiple"
                :required="field.required"
              />
              </template>
            </div>

            <div class="form-actions">
              <button class="ct-btn ct-btn-secondary" @click="cancelWorkflow">Abbrechen</button>
              <button class="ct-btn ct-btn-primary" @click="submitStep">Weiter</button>
            </div>
          </div>

          <!-- Action Node -->
          <div v-else-if="currentNode?.type === NodeType.ACTION" class="action-node">
            <p>Aktion wird ausgeführt...</p>
            <button class="ct-btn ct-btn-primary" @click="submitStep">Fortfahren</button>
          </div>

          <!-- Other Node Types -->
          <div v-else class="simple-node">
            <button class="ct-btn ct-btn-primary" @click="submitStep">Weiter</button>
          </div>
        </div>

        <!-- Completed -->
        <div v-else class="completion-message">
          <div class="success-icon">✓</div>
          <h3>Workflow abgeschlossen!</h3>
          <p>Der Workflow wurde erfolgreich durchlaufen.</p>
          <button class="ct-btn ct-btn-primary" @click="executionStore.setCurrentExecution(null)">
            Neuer Workflow
          </button>
        </div>
      </div>

      <!-- Right: History -->
      <div class="execution-history">
        <h4>Bearbeitungschronologie</h4>
        <div class="history-list">
          <div v-for="entry in currentExecution.history" :key="entry.id" class="history-entry">
            <div class="history-header">
              <span class="history-node">{{ entry.nodeName }}</span>
              <span class="history-status" :class="`status-${entry.status}`">
                {{ entry.status === 'success' ? '✓' : '✕' }}
              </span>
            </div>
            <div class="history-time">{{ formatDate(entry.timestamp) }}</div>
            <div v-if="Object.keys(entry.inputs).length > 0" class="history-data">
              <strong>Eingaben:</strong>
              <ul>
                <li v-for="(value, key) in entry.inputs" :key="key">
                  <strong>{{ key }}:</strong> {{ value }}
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div v-if="currentExecution.history.length === 0" class="empty-history">
          <p>Noch keine Schritte durchlaufen</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.workflow-executor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.executor-header {
  padding: 1rem;
  border-bottom: 1px solid #ddd;
}

.workflow-info h3 {
  margin: 0.5rem 0 0;
  font-size: 1.2rem;
}

.workflow-info p {
  margin: 0.25rem 0 0;
  color: #666;
  font-size: 0.9rem;
}

.workflow-selection {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.workflow-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.workflow-card {
  padding: 1.5rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.workflow-card:hover {
  border-color: var(--ct-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.workflow-card h4 {
  margin: 0 0 0.5rem;
}

.workflow-card p {
  margin: 0 0 1rem;
  color: #666;
  font-size: 0.9rem;
}

.workflow-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #999;
}

.execution-view {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 1rem;
  padding: 1rem;
  overflow: hidden;
}

.execution-diagram,
.execution-workspace,
.execution-history {
  overflow-y: auto;
}

.execution-diagram {
  border-right: 1px solid #ddd;
  padding-right: 1rem;
}

.execution-history {
  border-left: 1px solid #ddd;
  padding-left: 1rem;
}

.current-step {
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.current-step h3 {
  margin: 0 0 0.5rem;
}

.step-description {
  color: #333;
  margin-bottom: 1.5rem;
  line-height: 1.6;
  word-wrap: break-word;
  padding: 1.5rem;
  background: #f9f9f9;
  border-left: 4px solid #2196f3;
  border-radius: 4px;
  font-size: 0.95rem;
}

/* Markdown-Styling innerhalb der Beschreibung */
.step-description h1,
.step-description h2,
.step-description h3 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  color: #2196f3;
}

.step-description h1 {
  font-size: 1.5rem;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 0.5rem;
}

.step-description h2 {
  font-size: 1.25rem;
  margin-top: 1rem;
}

.step-description h3 {
  font-size: 1.1rem;
  margin-top: 1rem;
}

.step-description p {
  margin: 0.75rem 0;
}

.step-description ul,
.step-description ol {
  margin: 0.75rem 0;
  padding-left: 1.5rem;
}

.step-description li {
  margin: 0.25rem 0;
}

.step-description strong {
  color: #1976d2;
  font-weight: 600;
}

.step-description em {
  color: #666;
  font-style: italic;
}

.step-description blockquote {
  margin: 1rem 0;
  padding: 0.75rem 1rem;
  background: #fff;
  border-left: 4px solid #ffc107;
  color: #666;
  font-style: italic;
}

.step-description code {
  background: #fff;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
  color: #d32f2f;
}

.step-description pre {
  background: #fff;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
}

.step-description pre code {
  background: none;
  padding: 0;
  color: #333;
}

.step-description a {
  color: #2196f3;
  text-decoration: none;
}

.step-description a:hover {
  text-decoration: underline;
}

/* DISPLAY Field Styling */
.display-field {
  margin-bottom: 1.5rem;
}

.display-field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.display-field-header .ct-form-label {
  margin-bottom: 0;
}

/* Copy Dropdown */
.copy-dropdown {
  position: relative;
  display: inline-block;
}

.copy-btn {
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.copy-btn:hover {
  background: #1976d2;
}

.copy-btn:active {
  transform: scale(0.98);
}

.copy-options {
  position: absolute;
  right: 0;
  top: calc(100% + 0.25rem);
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 180px;
  animation: dropdownSlide 0.2s ease-out;
}

@keyframes dropdownSlide {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.copy-options button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.625rem 1rem;
  text-align: left;
  background: white;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.15s;
}

.copy-options button:hover {
  background: #f5f5f5;
}

.copy-options button:active {
  background: #e8e8e8;
}

.copy-options button:not(:last-child) {
  border-bottom: 1px solid #eee;
}

.copy-options button:first-child {
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}

.copy-options button:last-child {
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}

.display-field-content {
  padding: 1rem;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  color: #333;
  line-height: 1.6;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Markdown-Styling innerhalb DISPLAY-Felder */
.display-field-content h1,
.display-field-content h2,
.display-field-content h3 {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  color: #1976d2;
}

.display-field-content p {
  margin: 0.5rem 0;
}

.display-field-content ul,
.display-field-content ol {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.display-field-content strong {
  color: #1976d2;
  font-weight: 600;
}

.display-field-content code {
  background: #fff;
  padding: 2px 4px;
  border-radius: 3px;
  color: #d32f2f;
}

.task-form {
  margin-top: 1.5rem;
}

.required {
  color: #f44336;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.range-field {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.ct-form-range {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #e0e0e0;
  outline: none;
  -webkit-appearance: none;
}

.ct-form-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--ct-primary, #007bff);
  cursor: pointer;
}

.ct-form-range::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--ct-primary, #007bff);
  cursor: pointer;
  border: none;
}

.range-value {
  min-width: 40px;
  text-align: center;
  font-weight: 600;
  color: var(--ct-primary, #007bff);
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.completion-message {
  text-align: center;
  padding: 3rem;
}

.success-icon {
  font-size: 4rem;
  color: #4caf50;
  margin-bottom: 1rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.history-entry {
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 4px;
  border-left: 3px solid #4caf50;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.history-node {
  font-weight: 500;
}

.history-status {
  font-size: 1.2rem;
}

.status-success {
  color: #4caf50;
}

.status-error {
  color: #f44336;
}

.history-time {
  font-size: 0.85rem;
  color: #999;
  margin-bottom: 0.5rem;
}

.history-data {
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.history-data ul {
  margin: 0.5rem 0 0;
  padding-left: 1.5rem;
}

.history-data li {
  margin-bottom: 0.25rem;
}

.empty-state,
.empty-history {
  text-align: center;
  color: #999;
  padding: 2rem;
}

.action-node,
.simple-node {
  text-align: center;
  padding: 2rem;
}
</style>
