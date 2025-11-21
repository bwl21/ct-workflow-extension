# ChurchTools Actions

## Übersicht

Actions für die Integration mit der ChurchTools API.

## Verfügbare Actions

### ChurchToolsApiAction (Generisch)
**Datei:** `ChurchToolsApiAction.ts`

Flexible Action für beliebige ChurchTools API-Calls.

**Features:**
- Alle HTTP-Methoden (GET, POST, PUT, PATCH, DELETE)
- Variable Interpolation
- Query-Parameter und Request Body
- Autocomplete für häufige Endpoints

**Verwendung:**
```typescript
{
  method: 'POST',
  endpoint: '/groups/{{groupId}}/members',
  body: {
    personId: '{{personId}}',
    groupTypeRoleId: 1
  }
}
```

### AddToGroupAction (Spezialisiert)
**Ordner:** `add-to-group/`

Benutzerfreundliche Action zum Hinzufügen von Personen zu Gruppen.

**Features:**
- Toggle zwischen direkter ID und Variable
- Validierung
- Nutzt GroupService
- Klare UI

**Verwendung:**
```typescript
{
  personIdVariable: 'newPersonId',
  groupId: 42,
  roleId: 1
}
```

## Neue Action hinzufügen

### 1. Ordner erstellen
```bash
mkdir -p src/actions/churchtools/my-action
```

### 2. Action-Definition
```typescript
// my-action/MyAction.ts
import { defineAsyncComponent } from 'vue';
import type { ActionPlugin } from '@/types/action-plugin.types';
import { ActionCategory } from '@/types/action-plugin.types';

export const MyAction: ActionPlugin = {
  id: 'ct-my-action',
  name: 'Meine Action',
  description: 'Beschreibung',
  icon: 'icon-name',
  category: ActionCategory.CHURCHTOOLS,
  
  configComponent: defineAsyncComponent(() => import('./MyActionConfig.vue')),
  executeComponent: defineAsyncComponent(() => import('./MyActionExecute.vue')),
  
  defaultConfig: {
    // Deine Config-Felder
  },
  
  validate: (config) => {
    // Validierung
    return { valid: true, errors: [] };
  }
};
```

### 3. Config-Komponente
```vue
<!-- my-action/MyActionConfig.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import type { ActionContext } from '@/types/action-plugin.types';

const props = defineProps<{
  config: any;
  context: ActionContext;
}>();

const emit = defineEmits<{
  (e: 'update:config', config: any): void;
}>();

const localConfig = ref({ ...props.config });

const updateConfig = () => {
  emit('update:config', localConfig.value);
};
</script>

<template>
  <div class="my-action-config">
    <!-- Deine Config-UI -->
  </div>
</template>
```

### 4. Execute-Komponente
```vue
<!-- my-action/MyActionExecute.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { ActionContext, ActionResult } from '@/types/action-plugin.types';

const props = defineProps<{
  config: any;
  context: ActionContext;
}>();

const emit = defineEmits<{
  (e: 'complete', result: ActionResult): void;
}>();

const execute = async () => {
  try {
    // Deine Logik
    
    emit('complete', {
      success: true,
      data: { /* Ergebnis */ }
    });
  } catch (error: any) {
    emit('complete', {
      success: false,
      error: error.message
    });
  }
};

onMounted(() => execute());
</script>

<template>
  <div class="my-action-execute">
    <!-- Deine Execute-UI -->
  </div>
</template>
```

### 5. Registrieren
```typescript
// src/actions/index.ts
import { MyAction } from './churchtools/my-action/MyAction';

export function registerBuiltInActions() {
  actionRegistry.registerMany([
    // ... andere Actions
    MyAction,
  ]);
}
```

## Best Practices

### Service-Layer nutzen
```typescript
// ✅ Gut: Service nutzen
import { GroupService } from '@/services/GroupService';
await GroupService.addMemberToGroup(groupId, personId);

// ❌ Weniger gut: Direkt churchtoolsClient
import { churchtoolsClient } from '@churchtools/churchtools-client';
await churchtoolsClient.post(`/groups/${groupId}/members`, { personId });
```

### Variable Interpolation
```typescript
// In Execute-Komponente
const personId = props.config.personId || 
  props.context.helpers.getVariable(props.config.personIdVariable);
```

### Output-Variablen setzen
```typescript
props.context.helpers.setVariables({
  myOutputVariable: result.id
});
```

### Fehlerbehandlung
```typescript
try {
  // API-Call
} catch (error: any) {
  console.error('[MyAction] Error:', error);
  emit('complete', {
    success: false,
    error: error.message || 'Unbekannter Fehler'
  });
}
```

## Wichtige Hinweise

### ⚠️ churchtoolsClient
- Fügt automatisch `/api` Prefix hinzu
- Nutzt `deleteApi()` statt `delete()`
- Verwendet aktuelle Session (keine API-Keys)

### ⚠️ Response-Struktur
```typescript
const response = await churchtoolsClient.get('/persons');
const data = response.data || response;
const persons = data.data || data;
```

## Dokumentation

Vollständige Dokumentation: `docs/churchtools-actions.md`
