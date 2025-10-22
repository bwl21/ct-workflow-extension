<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Codemirror } from 'vue-codemirror';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter, type Diagnostic } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';

interface Props {
  modelValue: string;
  height?: string;
  readonly?: boolean;
  placeholder?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'error', error: string | null): void;
}

const props = withDefaults(defineProps<Props>(), {
  height: '50vh',
  readonly: false,
  placeholder: '',
});

const emit = defineEmits<Emits>();

const internalValue = ref(props.modelValue);
const currentError = ref<string | null>(null);

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue !== internalValue.value) {
    internalValue.value = newValue;
  }
});

// Custom linter that also emits errors
const customJsonLinter = () => {
  return (view: EditorView): Diagnostic[] => {
    const diagnostics = jsonParseLinter()(view);
    
    if (diagnostics.length > 0) {
      const firstError = diagnostics[0];
      currentError.value = firstError.message;
      emit('error', firstError.message);
    } else {
      currentError.value = null;
      emit('error', null);
    }
    
    return diagnostics;
  };
};

const extensions = computed(() => [
  json(),
  linter(customJsonLinter()),
  EditorView.lineWrapping,
  EditorView.theme({
    '&': {
      fontSize: '14px',
      border: '1px solid #ddd',
      borderRadius: '4px',
    },
    '.cm-scroller': {
      fontFamily: '"Courier New", monospace',
    },
    '.cm-gutters': {
      backgroundColor: '#f5f5f5',
      borderRight: '1px solid #ddd',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#e8e8e8',
    },
    '.cm-activeLine': {
      backgroundColor: '#f0f0f0',
    },
    '.cm-lintRange-error': {
      backgroundImage: 'none',
      textDecoration: 'underline wavy red',
    },
  }),
  ...(props.readonly ? [EditorView.editable.of(false)] : []),
]);

function handleChange(value: string) {
  internalValue.value = value;
  emit('update:modelValue', value);
}

// Format JSON
function formatJson() {
  try {
    const parsed = JSON.parse(internalValue.value);
    const formatted = JSON.stringify(parsed, null, 2);
    internalValue.value = formatted;
    emit('update:modelValue', formatted);
    currentError.value = null;
    emit('error', null);
  } catch (error) {
    currentError.value = `Formatierung fehlgeschlagen: ${error instanceof Error ? error.message : 'Ungültiges JSON'}`;
    emit('error', currentError.value);
  }
}

defineExpose({
  formatJson,
});
</script>

<template>
  <div class="json-editor-wrapper">
    <div class="json-editor-toolbar">
      <button 
        v-if="!readonly"
        class="ct-btn ct-btn-sm ct-btn-secondary" 
        @click="formatJson"
        title="JSON formatieren (Einrückung korrigieren)"
      >
        ✨ Formatieren
      </button>
      <div v-if="currentError" class="json-editor-error">
        ⚠️ {{ currentError }}
      </div>
    </div>
    <Codemirror
      v-model="internalValue"
      :style="{ height }"
      :extensions="extensions"
      :indent-with-tab="true"
      :tab-size="2"
      :placeholder="placeholder"
      @change="handleChange"
    />
  </div>
</template>

<style scoped>
.json-editor-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.json-editor-toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.json-editor-error {
  flex: 1;
  padding: 0.5rem 0.75rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  color: #c33;
  font-size: 0.875rem;
  font-family: 'Courier New', monospace;
}

.ct-btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}
</style>
