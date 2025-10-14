# Entwickler-Guide: Custom Actions

Dieser Guide zeigt dir Schritt für Schritt, wie du eigene Action-Knoten für den Workflow-Assistenten entwickelst.

## Inhaltsverzeichnis

1. [Schnellstart](#schnellstart)
2. [Action-Struktur](#action-struktur)
3. [Config-Komponente](#config-komponente)
4. [Execute-Komponente](#execute-komponente)
5. [Registrierung](#registrierung)
6. [Testing](#testing)
7. [Best Practices](#best-practices)
8. [Häufige Patterns](#häufige-patterns)

## Schnellstart

### Minimale Action in 5 Minuten

```bash
# 1. Verzeichnis erstellen
mkdir -p src/actions/my-action

# 2. Dateien erstellen
touch src/actions/my-action/MyAction.ts
touch src/actions/my-action/MyActionConfig.vue
```

```typescript
// src/actions/my-action/MyAction.ts
import { defineAsyncComponent } from 'vue';
import type { ActionPlugin } from '@/types/action-plugin.types';
import { ActionCategory } from '@/types/action-plugin.types';

export const MyAction: ActionPlugin = {
  id: 'my-action',
  name: 'Meine Action',
  description: 'Beschreibung',
  category: ActionCategory.CUSTOM,
  configComponent: defineAsyncComponent(() => import('./MyActionConfig.vue')),
  defaultConfig: {},
};
```

```vue
<!-- src/actions/my-action/MyActionConfig.vue -->
<script setup lang="ts">
interface Props {
  config: Record<string, any>;
  context: any;
}
interface Emits {
  (e: 'update:config', config: any): void;
}
defineProps<Props>();
defineEmits<Emits>();
</script>

<template>
  <div class="my-action-config">
    <p>Konfiguration hier...</p>
  </div>
</template>
```

```typescript
// src/actions/index.ts
import { MyAction } from './my-action/MyAction';

export function registerCustomActions() {
  actionRegistry.register(MyAction);
}
```

## Action-Struktur

### Verzeichnis-Layout

```
src/actions/my-action/
├── MyAction.ts              # Action Definition (erforderlich)
├── MyActionConfig.vue       # Konfigurations-UI (erforderlich)
├── MyActionExecute.vue      # Ausführungs-UI (optional)
├── types.ts                 # TypeScript Types (optional)
├── utils.ts                 # Hilfsfunktionen (optional)
└── README.md                # Dokumentation (empfohlen)
```

### Action Definition

```typescript
import { defineAsyncComponent } from 'vue';
import type { ActionPlugin } from '@/types/action-plugin.types';
import { ActionCategory } from '@/types/action-plugin.types';

export const MyAction: ActionPlugin = {
  // Eindeutige ID (kebab-case)
  id: 'my-action',

  // Anzeigename
  name: 'Meine Action',

  // Beschreibung (wird im Editor angezeigt)
  description: 'Macht etwas Tolles',

  // Icon (optional, Font Awesome oder Material Icons)
  icon: 'star',

  // Kategorie für Gruppierung
  category: ActionCategory.CUSTOM,

  // Config-Komponente (erforderlich)
  configComponent: defineAsyncComponent(() => import('./MyActionConfig.vue')),

  // Execute-Komponente (optional)
  executeComponent: defineAsyncComponent(() => import('./MyActionExecute.vue')),

  // Standard-Konfiguration
  defaultConfig: {
    myField: 'default value',
    enabled: true,
  },

  // Validierung (optional)
  validate: (config) => {
    const errors = [];
    if (!config.myField) {
      errors.push({ field: 'myField', message: 'Feld ist erforderlich' });
    }
    return { valid: errors.length === 0, errors };
  },

  // JSON Schema (optional, für erweiterte Validierung)
  configSchema: {
    type: 'object',
    properties: {
      myField: { type: 'string' },
      enabled: { type: 'boolean' },
    },
    required: ['myField'],
  },

  // Metadaten (optional)
  metadata: {
    author: 'Dein Name',
    version: '1.0.0',
    tags: ['custom', 'example'],
    docsUrl: 'https://docs.example.com',
    example: {
      myField: 'Beispielwert',
      enabled: true,
    },
  },
};
```

## Config-Komponente

Die Config-Komponente wird im Workflow-Editor angezeigt, wenn ein Admin die Action konfiguriert.

### Template

```vue
<script setup lang="ts">
import { ref } from 'vue';
import type { ActionContext } from '@/types/action-plugin.types';

interface Props {
  config: {
    // Deine Config-Felder
    myField: string;
    enabled: boolean;
  };
  context: ActionContext;
}

interface Emits {
  (e: 'update:config', config: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Lokale Kopie für v-model
const localConfig = ref({ ...props.config });

// Config aktualisieren
const updateConfig = () => {
  emit('update:config', localConfig.value);
};
</script>

<template>
  <div class="my-action-config">
    <!-- ChurchTools Design System verwenden -->
    <div class="ct-form-group">
      <label class="ct-form-label">Mein Feld</label>
      <input
        v-model="localConfig.myField"
        type="text"
        class="ct-form-control"
        @blur="updateConfig"
      />
    </div>

    <div class="ct-form-group">
      <label class="ct-form-label">
        <input v-model="localConfig.enabled" type="checkbox" @change="updateConfig" />
        Aktiviert
      </label>
    </div>
  </div>
</template>

<style scoped>
.my-action-config {
  padding: 1rem;
}
</style>
```

### Verfügbare Context-Daten

```typescript
props.context.workflowContext; // Alle Workflow-Variablen
props.context.executionId; // Execution ID
props.context.nodeId; // Node ID
props.context.userId; // Benutzer ID
props.context.helpers.getVariable('key'); // Variable abrufen
props.context.helpers.churchtools; // ChurchTools API
```

### Variablen-Interpolation

```vue
<template>
  <div class="ct-form-group">
    <label class="ct-form-label">URL</label>
    <input v-model="localConfig.url" type="text" class="ct-form-control" />
    <small class="ct-form-text">
      Verfügbare Variablen:
      <code v-for="v in Object.keys(context.workflowContext)" :key="v">
        {{ `{{${v}}}` }}
      </code>
    </small>
  </div>
</template>
```

## Execute-Komponente

Die Execute-Komponente wird während der Workflow-Ausführung angezeigt (optional).

### Template

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { ActionContext, ActionResult } from '@/types/action-plugin.types';

interface Props {
  config: {
    myField: string;
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

const execute = async () => {
  loading.value = true;
  status.value = 'pending';
  message.value = 'Führe Action aus...';

  const startTime = Date.now();

  try {
    // Deine Logik hier
    await doSomething();

    const duration = Date.now() - startTime;

    status.value = 'success';
    message.value = 'Erfolgreich!';

    emit('complete', {
      success: true,
      data: { result: 'some data' },
      duration,
    });
  } catch (error: any) {
    status.value = 'error';
    message.value = `Fehler: ${error.message}`;

    emit('complete', {
      success: false,
      error: error.message,
      duration: Date.now() - startTime,
    });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  execute();
});
</script>

<template>
  <div class="my-action-execute">
    <div v-if="loading" class="status-indicator loading">
      <div class="spinner"></div>
      <p>{{ message }}</p>
    </div>

    <div v-else-if="status === 'success'" class="status-indicator success">
      <div class="icon">✓</div>
      <p>{{ message }}</p>
    </div>

    <div v-else-if="status === 'error'" class="status-indicator error">
      <div class="icon">✕</div>
      <p>{{ message }}</p>
    </div>
  </div>
</template>

<style scoped>
/* Standard Styles für Status-Anzeige */
.my-action-execute {
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
</style>
```

### Ohne Execute-Komponente

Wenn keine UI während der Ausführung benötigt wird, kann die Action direkt im Backend ausgeführt werden:

```typescript
export const MyAction: ActionPlugin = {
  // ... andere Felder
  executeComponent: undefined, // Keine UI

  // Stattdessen wird die Action vom Workflow Engine ausgeführt
};
```

## Registrierung

### In src/actions/index.ts

```typescript
import { actionRegistry } from '@/services/ActionRegistry';
import { MyAction } from './my-action/MyAction';

export function registerCustomActions() {
  // Einzelne Action
  actionRegistry.register(MyAction);

  // Mehrere Actions
  actionRegistry.registerMany([MyAction, AnotherAction]);

  // Mit Overwrite (überschreibt existierende)
  actionRegistry.register(MyAction, true);
}
```

### Lazy Loading

Actions werden automatisch lazy geladen durch `defineAsyncComponent`:

```typescript
configComponent: defineAsyncComponent(() => import('./MyActionConfig.vue'));
```

## Testing

### Unit Tests

```typescript
// tests/actions/my-action.test.ts
import { describe, it, expect } from 'vitest';
import { MyAction } from '@/actions/my-action/MyAction';

describe('MyAction', () => {
  it('should have correct id', () => {
    expect(MyAction.id).toBe('my-action');
  });

  it('should validate config', () => {
    const validConfig = { myField: 'value' };
    const result = MyAction.validate!(validConfig);
    expect(result.valid).toBe(true);
  });

  it('should fail validation for empty field', () => {
    const invalidConfig = { myField: '' };
    const result = MyAction.validate!(invalidConfig);
    expect(result.valid).toBe(false);
  });
});
```

### Component Tests

```typescript
// tests/actions/my-action-config.test.ts
import { mount } from '@vue/test-utils';
import MyActionConfig from '@/actions/my-action/MyActionConfig.vue';

describe('MyActionConfig', () => {
  it('should render', () => {
    const wrapper = mount(MyActionConfig, {
      props: {
        config: { myField: 'test' },
        context: {
          workflowContext: {},
          helpers: {},
        },
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('should emit update on change', async () => {
    const wrapper = mount(MyActionConfig, {
      props: {
        config: { myField: 'test' },
        context: { workflowContext: {}, helpers: {} },
      },
    });

    await wrapper.find('input').setValue('new value');
    await wrapper.find('input').trigger('blur');

    expect(wrapper.emitted('update:config')).toBeTruthy();
  });
});
```

## Best Practices

### 1. Typsicherheit

```typescript
// Definiere eigene Types
interface MyActionConfig {
  myField: string;
  enabled: boolean;
}

// Verwende sie in Props
interface Props {
  config: MyActionConfig;
  context: ActionContext;
}
```

### 2. Validierung

```typescript
validate: (config) => {
  const errors: ValidationError[] = [];

  // Pflichtfelder
  if (!config.myField) {
    errors.push({ field: 'myField', message: 'Feld ist erforderlich' });
  }

  // Format-Validierung
  if (config.email && !isValidEmail(config.email)) {
    errors.push({ field: 'email', message: 'Ungültige E-Mail' });
  }

  // Bereichs-Validierung
  if (config.timeout < 1000 || config.timeout > 60000) {
    errors.push({ field: 'timeout', message: 'Timeout muss zwischen 1-60s liegen' });
  }

  return { valid: errors.length === 0, errors };
};
```

### 3. Error Handling

```typescript
try {
  const result = await doSomething();
  emit('complete', { success: true, data: result });
} catch (error: any) {
  // Logging
  props.context.helpers.log.error(`Action failed: ${error.message}`);

  // User-friendly Fehlermeldung
  const userMessage = error.response?.data?.message || error.message;

  emit('complete', {
    success: false,
    error: userMessage,
  });
}
```

### 4. Variablen-Ersetzung

```typescript
const replaceVariables = (str: string): string => {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return props.context.helpers.getVariable(key) || '';
  });
};

// Verwendung
const url = replaceVariables(props.config.url);
```

### 5. Logging

```typescript
// Info
props.context.helpers.log.info('Action started');

// Debug
props.context.helpers.log.debug('Processing data', data);

// Warning
props.context.helpers.log.warn('Deprecated config option used');

// Error
props.context.helpers.log.error('Action failed', error);
```

### 6. Context-Variablen setzen

```typescript
// Einzelne Variable
props.context.helpers.setVariable('result', data);

// Mehrere Variablen
props.context.helpers.setVariables({
  userId: user.id,
  userName: user.name,
  userEmail: user.email,
});
```

## Häufige Patterns

### Pattern 1: Async Data Loading

```vue
<script setup lang="ts">
const items = ref<any[]>([]);
const loading = ref(false);

const loadItems = async () => {
  loading.value = true;
  try {
    items.value = await props.context.helpers.churchtools.getGroups();
  } catch (error) {
    console.error('Failed to load items:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadItems();
});
</script>

<template>
  <select v-if="!loading" v-model="localConfig.itemId" @change="updateConfig">
    <option v-for="item in items" :key="item.id" :value="item.id">
      {{ item.name }}
    </option>
  </select>
  <p v-else>Lade...</p>
</template>
```

### Pattern 2: Dynamic Fields

```vue
<script setup lang="ts">
const addField = () => {
  localConfig.value.fields.push({ name: '', value: '' });
  updateConfig();
};

const removeField = (index: number) => {
  localConfig.value.fields.splice(index, 1);
  updateConfig();
};
</script>

<template>
  <div v-for="(field, index) in localConfig.fields" :key="index">
    <input v-model="field.name" @blur="updateConfig" />
    <input v-model="field.value" @blur="updateConfig" />
    <button @click="removeField(index)">✕</button>
  </div>
  <button @click="addField">+ Feld hinzufügen</button>
</template>
```

### Pattern 3: Conditional Config

```vue
<template>
  <div class="ct-form-group">
    <label class="ct-form-label">Typ</label>
    <select v-model="localConfig.type" @change="updateConfig">
      <option value="simple">Einfach</option>
      <option value="advanced">Erweitert</option>
    </select>
  </div>

  <!-- Nur bei "advanced" anzeigen -->
  <div v-if="localConfig.type === 'advanced'" class="ct-form-group">
    <label class="ct-form-label">Erweiterte Optionen</label>
    <input v-model="localConfig.advancedOptions" @blur="updateConfig" />
  </div>
</template>
```

### Pattern 4: Progress Tracking

```vue
<script setup lang="ts">
const progress = ref(0);

const executeWithProgress = async () => {
  const steps = 5;
  for (let i = 0; i < steps; i++) {
    await doStep(i);
    progress.value = ((i + 1) / steps) * 100;
  }
};
</script>

<template>
  <div class="progress-bar">
    <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
  </div>
  <p>{{ Math.round(progress) }}% abgeschlossen</p>
</template>
```

## Debugging

### Console Logging

```typescript
console.log('Config:', props.config);
console.log('Context:', props.context);
console.log('Variables:', props.context.workflowContext);
```

### Vue DevTools

- Installiere Vue DevTools Browser Extension
- Inspiziere Component Props und State
- Tracke Events

### Registry Debug

```typescript
import { actionRegistry } from '@/services/ActionRegistry';

// Alle Actions anzeigen
console.log(actionRegistry.getDebugInfo());

// Action prüfen
console.log(actionRegistry.get('my-action'));

// Nach Kategorie
console.log(actionRegistry.getByCategory(ActionCategory.CUSTOM));
```

## Checkliste für neue Actions

- [ ] Action Definition erstellt
- [ ] Config-Komponente implementiert
- [ ] Execute-Komponente implementiert (falls benötigt)
- [ ] Validierung hinzugefügt
- [ ] Default Config definiert
- [ ] Metadata ausgefüllt
- [ ] In index.ts registriert
- [ ] Unit Tests geschrieben
- [ ] Component Tests geschrieben
- [ ] Dokumentation erstellt
- [ ] Beispiel-Konfiguration hinzugefügt
- [ ] Error Handling implementiert
- [ ] Logging hinzugefügt
- [ ] ChurchTools Design System verwendet

## Weitere Ressourcen

- [Plugin-System Dokumentation](./plugin-system.md)
- [Vollständiges Beispiel](./examples/custom-action-example.md)
- [TypeScript Types](../src/types/action-plugin.types.ts)
- [Action Registry](../src/services/ActionRegistry.ts)
- [Built-in Actions](../src/actions/)
