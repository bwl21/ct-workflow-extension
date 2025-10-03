# Beispiel: Custom Action erstellen

Dieses Beispiel zeigt, wie man eine vollständige Custom Action erstellt, die Daten aus einer ChurchTools-Gruppe abruft und verarbeitet.

## Szenario

Wir erstellen eine Action "Gruppenmitglieder abrufen", die:
- Eine ChurchTools-Gruppe auswählt
- Alle Mitglieder der Gruppe abruft
- Die Daten filtert und transformiert
- Die Ergebnisse im Workflow-Kontext speichert

## Schritt 1: Verzeichnisstruktur

```bash
src/actions/group-members/
├── GroupMembersAction.ts
├── GroupMembersConfig.vue
└── GroupMembersExecute.vue
```

## Schritt 2: Action Definition

```typescript
// src/actions/group-members/GroupMembersAction.ts

import { defineAsyncComponent } from 'vue';
import type { ActionPlugin } from '@/types/action-plugin.types';
import { ActionCategory } from '@/types/action-plugin.types';

export const GroupMembersAction: ActionPlugin = {
  id: 'group-members',
  name: 'Gruppenmitglieder abrufen',
  description: 'Ruft alle Mitglieder einer ChurchTools-Gruppe ab',
  icon: 'users',
  category: ActionCategory.CHURCHTOOLS,

  configComponent: defineAsyncComponent(
    () => import('./GroupMembersConfig.vue')
  ),

  executeComponent: defineAsyncComponent(
    () => import('./GroupMembersExecute.vue')
  ),

  defaultConfig: {
    groupId: null,
    includeInactive: false,
    fields: ['firstName', 'lastName', 'email'],
    sortBy: 'lastName',
    filterRole: null,
  },

  validate: (config) => {
    const errors: Array<{ field?: string; message: string }> = [];

    if (!config.groupId) {
      errors.push({
        field: 'groupId',
        message: 'Gruppe muss ausgewählt werden',
      });
    }

    if (!config.fields || config.fields.length === 0) {
      errors.push({
        field: 'fields',
        message: 'Mindestens ein Feld muss ausgewählt werden',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  configSchema: {
    type: 'object',
    properties: {
      groupId: {
        type: ['number', 'null'],
      },
      includeInactive: {
        type: 'boolean',
      },
      fields: {
        type: 'array',
        items: {
          type: 'string',
        },
        minItems: 1,
      },
      sortBy: {
        type: 'string',
        enum: ['firstName', 'lastName', 'email'],
      },
      filterRole: {
        type: ['string', 'null'],
      },
    },
    required: ['groupId', 'fields'],
  },

  metadata: {
    author: 'ChurchTools',
    version: '1.0.0',
    tags: ['churchtools', 'group', 'members', 'data'],
    docsUrl: 'https://docs.church.tools/api/groups',
    example: {
      groupId: 123,
      includeInactive: false,
      fields: ['firstName', 'lastName', 'email', 'mobile'],
      sortBy: 'lastName',
      filterRole: 'Leiter',
    },
  },
};
```

## Schritt 3: Config-Komponente

```vue
<!-- src/actions/group-members/GroupMembersConfig.vue -->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { ActionContext } from '@/types/action-plugin.types';

interface Props {
  config: {
    groupId: number | null;
    includeInactive: boolean;
    fields: string[];
    sortBy: string;
    filterRole: string | null;
  };
  context: ActionContext;
}

interface Emits {
  (e: 'update:config', config: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localConfig = ref({ ...props.config });
const groups = ref<Array<{ id: number; name: string }>>([]);
const loading = ref(false);

const availableFields = [
  { value: 'firstName', label: 'Vorname' },
  { value: 'lastName', label: 'Nachname' },
  { value: 'email', label: 'E-Mail' },
  { value: 'mobile', label: 'Mobilnummer' },
  { value: 'birthday', label: 'Geburtstag' },
  { value: 'street', label: 'Straße' },
  { value: 'city', label: 'Stadt' },
  { value: 'zip', label: 'PLZ' },
];

const updateConfig = () => {
  emit('update:config', localConfig.value);
};

const loadGroups = async () => {
  loading.value = true;
  try {
    const result = await props.context.helpers.churchtools.getGroups();
    groups.value = result.map((g: any) => ({
      id: g.id,
      name: g.name,
    }));
  } catch (error) {
    console.error('Failed to load groups:', error);
  } finally {
    loading.value = false;
  }
};

const toggleField = (field: string) => {
  const index = localConfig.value.fields.indexOf(field);
  if (index > -1) {
    localConfig.value.fields.splice(index, 1);
  } else {
    localConfig.value.fields.push(field);
  }
  updateConfig();
};

const isFieldSelected = (field: string) => {
  return localConfig.value.fields.includes(field);
};

onMounted(() => {
  loadGroups();
});
</script>

<template>
  <div class="group-members-config">
    <div class="ct-form-group">
      <label class="ct-form-label">Gruppe *</label>
      <select
        v-model="localConfig.groupId"
        class="ct-form-control"
        :disabled="loading"
        @change="updateConfig"
      >
        <option :value="null">Bitte wählen...</option>
        <option v-for="group in groups" :key="group.id" :value="group.id">
          {{ group.name }}
        </option>
      </select>
      <small v-if="loading" class="ct-form-text">Lade Gruppen...</small>
    </div>

    <div class="ct-form-group">
      <label class="ct-form-label">Felder *</label>
      <div class="fields-grid">
        <label
          v-for="field in availableFields"
          :key="field.value"
          class="field-checkbox"
        >
          <input
            type="checkbox"
            :checked="isFieldSelected(field.value)"
            @change="toggleField(field.value)"
          />
          {{ field.label }}
        </label>
      </div>
    </div>

    <div class="ct-form-group">
      <label class="ct-form-label">Sortieren nach</label>
      <select
        v-model="localConfig.sortBy"
        class="ct-form-control"
        @change="updateConfig"
      >
        <option value="firstName">Vorname</option>
        <option value="lastName">Nachname</option>
        <option value="email">E-Mail</option>
      </select>
    </div>

    <div class="ct-form-group">
      <label class="ct-form-label">
        <input
          v-model="localConfig.includeInactive"
          type="checkbox"
          @change="updateConfig"
        />
        Inaktive Mitglieder einschließen
      </label>
    </div>

    <div class="ct-form-group">
      <label class="ct-form-label">Nach Rolle filtern (optional)</label>
      <input
        v-model="localConfig.filterRole"
        type="text"
        class="ct-form-control"
        placeholder="z.B. Leiter, Mitarbeiter"
        @blur="updateConfig"
      />
    </div>

    <div class="info-box">
      <strong>Hinweis:</strong> Die abgerufenen Mitglieder werden als Array in
      der Variable <code>groupMembers</code> gespeichert.
    </div>
  </div>
</template>

<style scoped>
.group-members-config {
  padding: 1rem;
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.field-checkbox input {
  cursor: pointer;
}

.info-box {
  background: #e3f2fd;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
  border-left: 4px solid #2196f3;
}

.info-box code {
  background: #fff;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}
</style>
```

## Schritt 4: Execute-Komponente

```vue
<!-- src/actions/group-members/GroupMembersExecute.vue -->

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { ActionContext, ActionResult } from '@/types/action-plugin.types';

interface Props {
  config: {
    groupId: number;
    includeInactive: boolean;
    fields: string[];
    sortBy: string;
    filterRole: string | null;
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
const memberCount = ref(0);

const fetchMembers = async () => {
  loading.value = true;
  status.value = 'pending';
  message.value = 'Rufe Gruppenmitglieder ab...';

  const startTime = Date.now();

  try {
    props.context.helpers.log.info(
      `Fetching members for group ${props.config.groupId}`
    );

    // Gruppe mit Mitgliedern abrufen
    const group = await props.context.helpers.churchtools.getGroup(
      props.config.groupId
    );

    let members = group.members || [];

    // Inaktive filtern
    if (!props.config.includeInactive) {
      members = members.filter((m: any) => m.status === 'active');
    }

    // Nach Rolle filtern
    if (props.config.filterRole) {
      members = members.filter(
        (m: any) => m.role === props.config.filterRole
      );
    }

    // Nur gewählte Felder extrahieren
    const processedMembers = members.map((member: any) => {
      const result: any = { id: member.id };
      props.config.fields.forEach((field) => {
        result[field] = member[field];
      });
      return result;
    });

    // Sortieren
    processedMembers.sort((a: any, b: any) => {
      const aVal = a[props.config.sortBy] || '';
      const bVal = b[props.config.sortBy] || '';
      return aVal.localeCompare(bVal);
    });

    memberCount.value = processedMembers.length;

    const duration = Date.now() - startTime;

    status.value = 'success';
    message.value = `${memberCount.value} Mitglieder erfolgreich abgerufen`;

    // Mitglieder im Workflow-Kontext speichern
    props.context.helpers.setVariable('groupMembers', processedMembers);
    props.context.helpers.setVariable('groupMemberCount', memberCount.value);

    props.context.helpers.log.info(
      `Successfully fetched ${memberCount.value} members`
    );

    emit('complete', {
      success: true,
      data: {
        members: processedMembers,
        count: memberCount.value,
        groupId: props.config.groupId,
      },
      duration,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;

    status.value = 'error';
    message.value = `Fehler: ${error.message}`;

    props.context.helpers.log.error(
      `Failed to fetch members: ${error.message}`
    );

    emit('complete', {
      success: false,
      error: error.message,
      duration,
    });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchMembers();
});
</script>

<template>
  <div class="group-members-execute">
    <div v-if="loading" class="status-indicator loading">
      <div class="spinner"></div>
      <p>{{ message }}</p>
    </div>

    <div v-else-if="status === 'success'" class="status-indicator success">
      <div class="icon">✓</div>
      <p>{{ message }}</p>
      <div class="result-info">
        <p>
          Die Mitglieder wurden in der Variable <code>groupMembers</code>
          gespeichert.
        </p>
        <p>Anzahl: <strong>{{ memberCount }}</strong></p>
      </div>
    </div>

    <div v-else-if="status === 'error'" class="status-indicator error">
      <div class="icon">✕</div>
      <p>{{ message }}</p>
    </div>
  </div>
</template>

<style scoped>
.group-members-execute {
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

.result-info {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
  text-align: left;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.result-info code {
  background: #fff;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}
</style>
```

## Schritt 5: Registrierung

```typescript
// src/actions/index.ts

import { actionRegistry } from '@/services/ActionRegistry';
import { RestApiAction } from './rest-api/RestApiAction';
import { EmailAction } from './email/EmailAction';
import { GroupMembersAction } from './group-members/GroupMembersAction';

export function registerCustomActions() {
  // Custom Action registrieren
  actionRegistry.register(GroupMembersAction);
}
```

## Verwendung im Workflow

Nach der Registrierung kann die Action im Workflow-Editor verwendet werden:

1. **Im Editor:** Action aus der Palette ziehen
2. **Konfigurieren:** Gruppe auswählen, Felder wählen
3. **Im Workflow:** Action wird automatisch ausgeführt
4. **Nachfolgende Schritte:** Können auf `groupMembers` Variable zugreifen

### Beispiel: E-Mail an alle Mitglieder

```
Schritt 1: Gruppenmitglieder abrufen
  → groupMembers Variable wird gesetzt

Schritt 2: Für jedes Mitglied (Loop)
  → E-Mail senden an {{member.email}}
```

## Best Practices aus diesem Beispiel

1. **Async Loading:** Gruppen werden asynchron geladen
2. **Validierung:** Pflichtfelder werden geprüft
3. **Error Handling:** Try-catch mit aussagekräftigen Fehlern
4. **Logging:** Wichtige Schritte werden geloggt
5. **Context Variables:** Ergebnisse werden im Kontext gespeichert
6. **UI Feedback:** Loading, Success und Error States
7. **Dokumentation:** Metadata mit Beispiel und Docs-URL
8. **Typsicherheit:** Vollständige TypeScript-Typen

## Testing

```typescript
// tests/actions/group-members.test.ts

import { describe, it, expect, vi } from 'vitest';
import { GroupMembersAction } from '@/actions/group-members/GroupMembersAction';

describe('GroupMembersAction', () => {
  it('should have correct metadata', () => {
    expect(GroupMembersAction.id).toBe('group-members');
    expect(GroupMembersAction.category).toBe('churchtools');
  });

  it('should validate config correctly', () => {
    const validConfig = {
      groupId: 123,
      fields: ['firstName', 'lastName'],
      includeInactive: false,
      sortBy: 'lastName',
      filterRole: null,
    };

    const result = GroupMembersAction.validate!(validConfig);
    expect(result.valid).toBe(true);
  });

  it('should fail validation without groupId', () => {
    const invalidConfig = {
      groupId: null,
      fields: ['firstName'],
      includeInactive: false,
      sortBy: 'lastName',
      filterRole: null,
    };

    const result = GroupMembersAction.validate!(invalidConfig);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });
});
```

## Erweiterungsmöglichkeiten

1. **Pagination:** Große Gruppen in Batches laden
2. **Caching:** Gruppendaten zwischenspeichern
3. **Export:** Mitglieder als CSV exportieren
4. **Filter UI:** Erweiterte Filter-Optionen
5. **Preview:** Vorschau der Mitglieder im Editor
