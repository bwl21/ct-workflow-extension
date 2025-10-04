# Vereinfachte Implementierung: Template-Interpolation

## Kernidee

**Vue hat bereits Template-Interpolation!** Wir müssen nur:
1. Den Template-String aus den Daten holen
2. Mit Context-Variablen ersetzen
3. Vue's Reaktivität macht den Rest

## Minimale Implementierung

### 1. WorkflowExecutor.vue - Nur 3 Änderungen

**Änderung 1: Computed für Description**

```typescript
// Nach Zeile 18 einfügen:
const interpolatedDescription = computed(() => {
  if (!currentNode.value?.description || !currentExecution.value) {
    return currentNode.value?.description || '';
  }
  
  const template = currentNode.value.description;
  const context = currentExecution.value.context.variables;
  
  // Einfache String-Ersetzung
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return context[key] !== undefined ? String(context[key]) : match;
  });
});
```

**Änderung 2: Felder vorbesetzen**

```typescript
// startWorkflow() erweitern (Zeile 26-38):
function startWorkflow(workflowId: string) {
  executionStore.startExecution(workflowId);
  initializeFormData(); // NEU
}

// Neue Funktion:
function initializeFormData() {
  if (!currentNode.value?.type === NodeType.TASK) return;
  
  const fields = currentNode.value.data.fields || [];
  const context = currentExecution.value?.context.variables || {};
  
  formData.value = {};
  
  fields.forEach(field => {
    // Feld mit Context-Wert vorbesetzen (falls vorhanden)
    if (context[field.name] !== undefined) {
      formData.value[field.name] = context[field.name];
    }
    // Multiselect: leeres Array
    else if (field.type === 'multiselect') {
      formData.value[field.name] = [];
    }
  });
}

// Watch für Node-Wechsel:
watch(currentNode, () => {
  if (currentNode.value?.type === NodeType.TASK) {
    initializeFormData();
  }
});
```

**Änderung 3: Template anpassen**

```vue
<!-- Zeile 130-132 ersetzen: -->
<p v-if="interpolatedDescription" class="step-description">
  {{ interpolatedDescription }}
</p>
```

**Das war's!** Keine neue Komponente, keine Library, nur Vue's eingebaute Features.

## Warum so einfach?

### Vue macht die Arbeit

```typescript
// Wir erstellen einen Computed:
const interpolatedDescription = computed(() => {
  return template.replace(/\{\{(\w+)\}\}/g, ...);
});

// Vue:
// 1. Tracked automatisch Abhängigkeiten (currentNode, currentExecution)
// 2. Re-computed nur wenn sich Inputs ändern
// 3. Triggert Re-Render automatisch
```

### Kein v-html nötig

```vue
<!-- Vue escaped automatisch: -->
<p>{{ interpolatedDescription }}</p>

<!-- Wenn name = "<script>alert('XSS')</script>" -->
<!-- Wird angezeigt als: &lt;script&gt;alert('XSS')&lt;/script&gt; -->
<!-- → Kein XSS-Risiko! -->
```

### Reaktivität ist eingebaut

```
Benutzer füllt Task 1 aus
  ↓
completeStep() → context.variables = { name: "Max" }
  ↓
currentExecution ändert sich
  ↓
interpolatedDescription wird neu berechnet (Computed)
  ↓
Template wird neu gerendert
  ↓
Benutzer sieht "Hallo Max"
```

## Vergleich: Komplex vs. Einfach

### ❌ Komplexe Lösung (nicht nötig)

```typescript
// Eigene Template-Engine
import { compile } from 'vue';

const render = compile(template);
const vnode = render(context);
// ... komplexe VNode-Manipulation
```

### ✅ Einfache Lösung (ausreichend)

```typescript
// Einfache String-Ersetzung
return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
  return context[key] !== undefined ? String(context[key]) : match;
});
```

## Editor-Unterstützung

### Platzhalter einfügen

**Komponente:** `PlaceholderDropdown.vue`

```vue
<template>
  <div class="placeholder-dropdown">
    <button @click="isOpen = !isOpen">
      Platzhalter einfügen
    </button>
    
    <div v-if="isOpen" class="dropdown-menu">
      <div 
        v-for="variable in availableVariables"
        :key="variable"
        @click="$emit('select', variable)"
      >
        {{ variable }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  availableVariables: string[];
}>();

defineEmits<{
  select: [variable: string];
}>();

const isOpen = ref(false);
</script>
```

**Verwendung im Editor:**

```vue
<template>
  <div>
    <label>Beschreibung</label>
    <textarea ref="descInput" v-model="description"></textarea>
    
    <PlaceholderDropdown 
      :available-variables="availableVars"
      @select="insertPlaceholder"
    />
  </div>
</template>

<script setup lang="ts">
const descInput = ref<HTMLTextAreaElement>();

function insertPlaceholder(variable: string) {
  const textarea = descInput.value;
  if (!textarea) return;
  
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = description.value;
  
  description.value = 
    text.substring(0, start) + 
    `{{${variable}}}` + 
    text.substring(end);
  
  // Cursor nach Platzhalter setzen
  nextTick(() => {
    textarea.focus();
    const newPos = start + variable.length + 4; // {{}}
    textarea.setSelectionRange(newPos, newPos);
  });
}
</script>
```

## Utility-Funktion (Optional)

Falls Sie die Interpolation an mehreren Stellen brauchen:

**Datei:** `src/utils/interpolate.ts`

```typescript
/**
 * Interpoliert {{variableName}} mit Werten aus Context
 */
export function interpolate(
  template: string,
  context: Record<string, any>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = context[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Findet alle Platzhalter in einem Template
 */
export function extractPlaceholders(template: string): string[] {
  const matches = template.matchAll(/\{\{(\w+)\}\}/g);
  return Array.from(matches, m => m[1]);
}

/**
 * Sammelt verfügbare Variablen aus vorherigen Tasks
 */
export function getAvailableVariables(
  workflow: WorkflowDefinition,
  currentNodeId: string
): string[] {
  const variables = new Set<string>();
  const nodes = workflow.nodes;
  const currentIndex = nodes.findIndex(n => n.id === currentNodeId);
  
  for (let i = 0; i < currentIndex; i++) {
    const node = nodes[i];
    if (node.type === NodeType.TASK && node.data.fields) {
      node.data.fields.forEach(field => variables.add(field.name));
    }
  }
  
  return Array.from(variables).sort();
}
```

**Verwendung:**

```typescript
import { interpolate } from '@/utils/interpolate';

const interpolatedDescription = computed(() => {
  return interpolate(
    currentNode.value?.description || '',
    currentExecution.value?.context.variables || {}
  );
});
```

## Zusammenfassung

### Was wir NICHT brauchen:
- ❌ Vue's Template-Compiler
- ❌ Dynamische Komponenten
- ❌ v-html (XSS-Risiko)
- ❌ Externe Libraries
- ❌ Komplexe VNode-Manipulation

### Was wir brauchen:
- ✅ Einfache String-Ersetzung mit Regex
- ✅ Vue's Computed Properties
- ✅ Vue's Reaktivität
- ✅ Standard Template-Syntax `{{ }}`

### Vorteile:
- **Einfach:** ~30 Zeilen Code
- **Sicher:** Automatisches HTML-Escaping
- **Performant:** Vue's Computed-Caching
- **Wartbar:** Keine Magic, nur Standard-Vue
- **Erweiterbar:** Später Formatierung hinzufügen möglich

### Implementierungs-Aufwand:
- **Phase 1 (Basis):** 2-3 Stunden
- **Phase 2 (Editor):** 3-4 Stunden
- **Gesamt:** ~6 Stunden statt 20+

## Nächste Schritte

1. **Prototyp:** Änderung 1-3 in WorkflowExecutor implementieren
2. **Testen:** Mit Demo-Workflow ausprobieren
3. **Editor:** PlaceholderDropdown hinzufügen
4. **Fertig!**

Die Komplexität liegt nicht in der Interpolation (das ist trivial), sondern in der Editor-UX (Dropdown, Cursor-Position, etc.).
