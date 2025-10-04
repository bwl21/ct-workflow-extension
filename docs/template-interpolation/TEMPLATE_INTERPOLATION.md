# Template-Interpolation in Workflows

## Übersicht

Dieses Feature ermöglicht es, in Task-Beschreibungen und Feld-Defaultwerten auf Variablen aus vorherigen Workflow-Schritten zuzugreifen.

## Anforderungen

### 1. Platzhalter in Beschreibungen

**Use Case:**
```
Task 1: Eingabe "name" = "Max Mustermann"
Task 2: Beschreibung = "Hallo {{name}}, bitte bestätigen Sie Ihre Daten."
         → Angezeigt wird: "Hallo Max Mustermann, bitte bestätigen Sie Ihre Daten."
```

### 2. Globale Variablennamen

- Alle Feldnamen sind **workflow-weit eindeutig**
- Wenn Task 2 ein Feld mit gleichem Namen wie Task 1 hat:
  - Das Feld wird mit dem Wert aus `context.variables` **vorbesetzt**
  - Der Benutzer kann den Wert ändern
  - Der neue Wert überschreibt den alten im Context

**Beispiel:**
```
Task 1: Feld "email" = "max@example.com"
Task 2: Feld "email" (vorbesetzt mit "max@example.com")
        → Benutzer ändert zu "max.mustermann@example.com"
        → context.variables.email = "max.mustermann@example.com"
```

### 3. Editor-Unterstützung

Im Workflow-Editor beim Bearbeiten einer Task-Node:

**Beschreibungsfeld:**
- Textfeld für Node-Description
- Dropdown/Button "Platzhalter einfügen"
- Zeigt alle verfügbaren Variablen aus vorherigen Tasks
- Fügt `{{variableName}}` an Cursor-Position ein

**Feld-Definition:**
- Bei `defaultValue`: Gleiche Dropdown-Funktionalität
- Zeigt Vorschau des interpolierten Werts (wenn möglich)

## Technische Spezifikation

### 1. Syntax

**Platzhalter-Format:** `{{variableName}}`

**Beispiele:**
- `{{name}}` - Einfache Variable
- `{{user.email}}` - Verschachtelte Objekte (zukünftig)
- `{{items.0}}` - Array-Zugriff (zukünftig)

### 2. Interpolation zur Laufzeit

**Wo wird interpoliert:**
- `WorkflowNode.description` - Bei Anzeige im Executor
- `FormField.defaultValue` - Bei Initialisierung von formData
- `FormField.placeholder` - Bei Anzeige (optional)

**Wann wird interpoliert:**
- Beim Laden eines neuen Task-Nodes im Executor
- Vor dem Rendering im Template

### 3. Datenfluss

```
1. Workflow-Ausführung startet
   → execution.context.variables = {}

2. Task 1 wird geladen
   → Felder haben keine Defaultwerte (Context leer)
   → Benutzer gibt ein: { name: "Max", email: "max@example.com" }
   → completeStep() → context.variables = { name: "Max", email: "max@example.com" }

3. Task 2 wird geladen
   → description = "Hallo {{name}}, ..." 
   → interpolate(description, context.variables) 
   → "Hallo Max, ..."
   
   → Feld "email" hat defaultValue = "{{email}}"
   → interpolate("{{email}}", context.variables)
   → formData.email = "max@example.com"
   
   → Feld "phone" hat kein defaultValue
   → formData.phone = undefined

4. Benutzer ändert email zu "new@example.com"
   → completeStep() → context.variables = { 
       name: "Max", 
       email: "new@example.com",  // überschrieben
       phone: "..." 
     }
```

### 4. Implementierung

#### 4.1 Vue's Template-Interpolation nutzen

**Wichtig:** Vue hat bereits Template-Interpolation mit `{{ }}` Syntax eingebaut!

**Ansatz 1: Dynamische Template-Compilation (Empfohlen)**

Vue kann Templates zur Laufzeit kompilieren. Wir übergeben einfach den Context als Daten.

**Datei:** `src/components/workflow/DynamicTemplate.vue` (neu)

```vue
<template>
  <div v-html="compiledTemplate"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  template: string;
  context: Record<string, any>;
}>();

const compiledTemplate = computed(() => {
  // Einfache String-Interpolation (sicher, kein HTML)
  return props.template.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
    const value = props.context[variableName];
    return value !== undefined ? escapeHtml(String(value)) : match;
  });
});

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
</script>
```

**Ansatz 2: Noch einfacher - Computed Property**

Keine separate Komponente nötig, direkt im WorkflowExecutor:

```typescript
const interpolatedDescription = computed(() => {
  if (!currentNode.value?.description || !currentExecution.value) {
    return currentNode.value?.description || '';
  }
  
  const template = currentNode.value.description;
  const context = currentExecution.value.context.variables;
  
  // Vue-Style Interpolation
  return template.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
    const value = context[variableName];
    return value !== undefined ? String(value) : match;
  });
});
```

**Vorteil:** 
- Nutzt Vue's reaktives System
- Automatisches Re-Rendering bei Context-Änderungen
- Keine externe Library nötig

#### 4.2 Utility-Funktionen

**Datei:** `src/utils/template-interpolation.ts`

```typescript
/**
 * Extrahiert alle Platzhalter aus einem Template
 */
export function extractPlaceholders(template: string): string[] {
  const matches = template.matchAll(/\{\{(\w+)\}\}/g);
  return Array.from(matches, m => m[1]);
}

/**
 * Sammelt alle verfügbaren Variablen aus vorherigen Nodes
 */
export function getAvailableVariables(
  workflow: WorkflowDefinition,
  currentNodeId: string
): string[] {
  const variables: string[] = [];
  const nodes = workflow.nodes;
  const currentIndex = nodes.findIndex(n => n.id === currentNodeId);
  
  // Durchlaufe alle Nodes vor dem aktuellen
  for (let i = 0; i < currentIndex; i++) {
    const node = nodes[i];
    if (node.type === NodeType.TASK && node.data.fields) {
      // Sammle alle Feldnamen
      node.data.fields.forEach(field => {
        if (!variables.includes(field.name)) {
          variables.push(field.name);
        }
      });
    }
  }
  
  return variables;
}

/**
 * Interpoliert Template mit Context (mit XSS-Schutz)
 */
export function interpolate(
  template: string | undefined,
  context: Record<string, any>
): string {
  if (!template) return '';
  
  return template.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
    const value = context[variableName];
    if (value === undefined) return match;
    
    // XSS-Schutz: HTML escapen
    return escapeHtml(String(value));
  });
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
```

#### 4.3 WorkflowExecutor Anpassungen (Vereinfacht)

**Datei:** `src/components/workflow/WorkflowExecutor.vue`

**Wichtig:** Da die Description aus Daten kommt, können wir Vue's Reaktivität direkt nutzen!

```typescript
import { interpolate } from '@/utils/template-interpolation';

// Computed für interpolierte Description
const interpolatedDescription = computed(() => {
  if (!currentNode.value?.description || !currentExecution.value) {
    return currentNode.value?.description || '';
  }
  
  const template = currentNode.value.description;
  const context = currentExecution.value.context.variables;
  
  // Einfache String-Interpolation (Vue macht den Rest)
  return template.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
    const value = context[variableName];
    return value !== undefined ? String(value) : match;
  });
});

// Bei moveToNextNode: formData mit Context-Werten initialisieren
function initializeFormData() {
  if (!currentNode.value || currentNode.value.type !== NodeType.TASK) {
    return;
  }
  
  const fields = currentNode.value.data.fields || [];
  const contextVars = currentExecution.value?.context.variables || {};
  
  formData.value = {};
  
  fields.forEach(field => {
    // 1. Wenn Feld im Context existiert → vorbesetzen
    if (contextVars[field.name] !== undefined) {
      formData.value[field.name] = contextVars[field.name];
    }
    // 2. Sonst: defaultValue interpolieren (falls vorhanden)
    else if (field.defaultValue) {
      const interpolated = interpolate(
        String(field.defaultValue),
        contextVars
      );
      formData.value[field.name] = interpolated;
    }
    // 3. Multiselect: leeres Array
    else if (field.type === 'multiselect') {
      formData.value[field.name] = [];
    }
  });
}

// Watch für automatische Initialisierung bei Node-Wechsel
watch(currentNode, () => {
  if (currentNode.value?.type === NodeType.TASK) {
    initializeFormData();
  }
}, { immediate: true });
```

**Template:**
```vue
<!-- Einfach: Interpolierter String als Text -->
<p v-if="interpolatedDescription" class="step-description">
  {{ interpolatedDescription }}
</p>
```

**Alternativ: v-html für HTML-Formatierung (Vorsicht: XSS-Risiko)**
```vue
<!-- Nur wenn HTML in Description erlaubt sein soll -->
<div v-if="interpolatedDescription" 
     class="step-description" 
     v-html="interpolatedDescription">
</div>
```

#### 4.3 Editor Anpassungen

**Datei:** `src/components/workflow/nodes/TaskNodeEditor.vue` (neu oder erweitert)

**Features:**
1. Beschreibungsfeld mit Platzhalter-Button
2. Dropdown zeigt verfügbare Variablen
3. Einfügen an Cursor-Position

```vue
<template>
  <div class="task-editor">
    <!-- Description mit Platzhalter-Unterstützung -->
    <div class="form-group">
      <label>Aufgabenbeschreibung</label>
      <div class="description-editor">
        <textarea 
          ref="descriptionInput"
          v-model="nodeData.description"
          rows="3"
        />
        <button 
          type="button"
          class="insert-placeholder-btn"
          @click="showPlaceholderMenu = !showPlaceholderMenu"
        >
          Platzhalter einfügen
        </button>
        
        <!-- Dropdown mit verfügbaren Variablen -->
        <div v-if="showPlaceholderMenu" class="placeholder-menu">
          <div 
            v-for="variable in availableVariables"
            :key="variable"
            class="placeholder-item"
            @click="insertPlaceholder(variable)"
          >
            {{ variable }}
          </div>
          <div v-if="availableVariables.length === 0" class="empty-state">
            Keine Variablen aus vorherigen Tasks verfügbar
          </div>
        </div>
      </div>
    </div>
    
    <!-- Felder-Definition -->
    <div class="fields-section">
      <h4>Formular-Felder</h4>
      <div v-for="(field, index) in fields" :key="index">
        <!-- ... Feld-Konfiguration ... -->
        
        <!-- DefaultValue mit Platzhalter-Support -->
        <div class="form-group">
          <label>Standardwert</label>
          <input 
            v-model="field.defaultValue"
            placeholder="z.B. {{email}}"
          />
          <button 
            type="button"
            @click="showFieldPlaceholderMenu[index] = true"
          >
            Platzhalter
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { getAvailableVariables } from '@/utils/template-interpolation';

const props = defineProps<{
  workflow: WorkflowDefinition;
  nodeId: string;
  nodeData: NodeData;
}>();

const descriptionInput = ref<HTMLTextAreaElement>();
const showPlaceholderMenu = ref(false);

const availableVariables = computed(() => {
  return getAvailableVariables(props.workflow, props.nodeId);
});

function insertPlaceholder(variableName: string) {
  const textarea = descriptionInput.value;
  if (!textarea) return;
  
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = props.nodeData.description || '';
  
  const placeholder = `{{${variableName}}}`;
  const newText = text.substring(0, start) + placeholder + text.substring(end);
  
  props.nodeData.description = newText;
  
  // Cursor nach Platzhalter setzen
  nextTick(() => {
    textarea.focus();
    textarea.setSelectionRange(
      start + placeholder.length,
      start + placeholder.length
    );
  });
  
  showPlaceholderMenu.value = false;
}
</script>
```

### 5. Sicherheit (XSS-Schutz)

**Problem:** Benutzer-Eingaben könnten HTML/JavaScript enthalten

**Beispiel:**
```
Task 1: name = "<script>alert('XSS')</script>"
Task 2: Description = "Hallo {{name}}"
→ Ohne Schutz: Script wird ausgeführt!
```

**Lösung 1: Text-Interpolation (Empfohlen)**
```vue
<!-- Vue escaped automatisch -->
<p>{{ interpolatedDescription }}</p>
```

**Lösung 2: HTML-Escaping bei v-html**
```typescript
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// In interpolate():
return template.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
  const value = context[variableName];
  return value !== undefined ? escapeHtml(String(value)) : match;
});
```

**Empfehlung:** 
- Verwende `{{ }}` statt `v-html` 
- Vue escaped automatisch
- Kein XSS-Risiko

### 6. Validierung

**Warnung bei unbekannten Platzhaltern:**
- Im Editor: Zeige Warnung wenn `{{unknown}}` verwendet wird
- Im Executor: Zeige Original-Platzhalter wenn Variable nicht existiert

**Beispiel:**
```typescript
// Wenn context.variables = { name: "Max" }
interpolate("Hallo {{name}}, {{unknown}}", context)
// → "Hallo Max, {{unknown}}"
```

## UI/UX Anforderungen

### Editor

1. **Beschreibungsfeld:**
   - Mehrzeiliges Textfeld
   - Button "Platzhalter einfügen" rechts neben dem Feld
   - Dropdown öffnet sich unter dem Button
   - Variablen alphabetisch sortiert
   - Click auf Variable fügt `{{name}}` an Cursor-Position ein

2. **Feld-DefaultValue:**
   - Gleiche Funktionalität wie bei Beschreibung
   - Kleinerer Button (Icon?)

3. **Visuelle Hinweise:**
   - Platzhalter im Text farblich hervorheben (z.B. blau)
   - Tooltip zeigt Variablenname bei Hover

### Executor

1. **Interpolierte Beschreibung:**
   - Wird normal als Text angezeigt
   - Keine speziellen Styles für interpolierte Werte

2. **Vorbesetzte Felder:**
   - Sehen aus wie normale Eingabefelder
   - Sind editierbar
   - Kein visueller Unterschied zu leeren Feldern

## Beispiel-Workflow

```typescript
{
  nodes: [
    {
      id: 'task1',
      type: 'task',
      label: 'Persönliche Daten',
      description: 'Bitte geben Sie Ihre Daten ein.',
      data: {
        fields: [
          { name: 'name', label: 'Name', type: 'text', required: true },
          { name: 'email', label: 'E-Mail', type: 'email', required: true }
        ]
      }
    },
    {
      id: 'task2',
      type: 'task',
      label: 'Bestätigung',
      description: 'Hallo {{name}}, bitte bestätigen Sie Ihre E-Mail-Adresse.',
      data: {
        fields: [
          { 
            name: 'email', 
            label: 'E-Mail', 
            type: 'email',
            defaultValue: '{{email}}',  // Vorbesetzt mit Wert aus Task 1
            required: true 
          },
          {
            name: 'confirmed',
            label: 'Ich bestätige die Richtigkeit',
            type: 'checkbox',
            required: true
          }
        ]
      }
    }
  ]
}
```

**Ausführung:**
1. Task 1: Benutzer gibt ein: `name="Max"`, `email="max@example.com"`
2. Task 2 wird geladen:
   - Description: "Hallo Max, bitte bestätigen Sie Ihre E-Mail-Adresse."
   - Feld "email" ist vorbesetzt mit "max@example.com"
   - Benutzer kann Email ändern oder bestätigen

## Zukünftige Erweiterungen

1. **Verschachtelte Objekte:** `{{user.address.city}}`
2. **Array-Zugriff:** `{{items.0.name}}`
3. **Formatierung:** `{{date|format('DD.MM.YYYY')}}`
4. **Berechnungen:** `{{price * quantity}}`
5. **Bedingungen:** `{{#if approved}}Genehmigt{{/if}}`

## Offene Fragen

1. Soll es eine Vorschau der interpolierten Werte im Editor geben?
2. Wie gehen wir mit fehlenden Variablen um? (Warnung, Fehler, ignorieren?)
3. Sollen Platzhalter auch in Labels/Placeholders funktionieren?
