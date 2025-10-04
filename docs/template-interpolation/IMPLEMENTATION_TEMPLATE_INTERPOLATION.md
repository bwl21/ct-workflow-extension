# Implementierungsplan: Template-Interpolation

## Übersicht

Dieses Dokument beschreibt die konkrete Implementierung der Template-Interpolation in Workflows.

## Phase 1: Basis-Interpolation (Core)

### 1.1 Utility-Funktion erstellen

**Datei:** `src/utils/template-interpolation.ts`

**Aufgaben:**
- [x] Funktion `interpolate()` implementieren
- [x] Funktion `extractPlaceholders()` implementieren
- [x] Funktion `getAvailableVariables()` implementieren
- [ ] Unit-Tests schreiben

**Abhängigkeiten:** Keine

**Geschätzter Aufwand:** 1-2 Stunden

### 1.2 WorkflowExecutor erweitern

**Datei:** `src/components/workflow/WorkflowExecutor.vue`

**Aufgaben:**
- [ ] Import von `interpolate()` hinzufügen
- [ ] Computed `interpolatedDescription` erstellen
- [ ] Funktion `initializeFormData()` implementieren
- [ ] `startWorkflow()` anpassen: `initializeFormData()` aufrufen
- [ ] Template anpassen: `interpolatedDescription` verwenden
- [ ] Watch auf `currentNode` hinzufügen → `initializeFormData()` triggern

**Code-Änderungen:**

```typescript
// Script-Bereich
import { interpolate } from '@/utils/template-interpolation';

// Nach Zeile 18 einfügen:
const interpolatedDescription = computed(() => {
  if (!currentNode.value?.description || !currentExecution.value) {
    return currentNode.value?.description || '';
  }
  return interpolate(
    currentNode.value.description,
    currentExecution.value.context.variables
  );
});

// Neue Funktion nach startWorkflow():
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
    // Priorität 2: defaultValue mit Interpolation
    else if (field.defaultValue) {
      const interpolated = interpolate(
        String(field.defaultValue),
        contextVars
      );
      formData.value[field.name] = interpolated;
    }
    // Priorität 3: Spezielle Defaults
    else if (field.type === 'multiselect') {
      formData.value[field.name] = [];
    }
  });
}

// Watch hinzufügen:
watch(currentNode, () => {
  if (currentNode.value?.type === NodeType.TASK) {
    initializeFormData();
  }
}, { immediate: true });

// startWorkflow() anpassen (Zeile 26-38):
function startWorkflow(workflowId: string) {
  executionStore.startExecution(workflowId);
  initializeFormData(); // Ersetzt die alte Logik
}
```

```vue
<!-- Template-Bereich: Zeile 130-132 ersetzen -->
<p v-if="interpolatedDescription" class="step-description">
  {{ interpolatedDescription }}
</p>
```

**Abhängigkeiten:** Phase 1.1

**Geschätzter Aufwand:** 2-3 Stunden

### 1.3 Execution Store anpassen

**Datei:** `src/stores/execution.ts`

**Problem:** Nach `moveToNextNode()` muss `formData` neu initialisiert werden.

**Lösung:** Event/Callback oder Watcher in WorkflowExecutor

**Aufgaben:**
- [ ] Prüfen ob `moveToNextNode()` bereits korrekt funktioniert
- [ ] Ggf. Event emittieren wenn Node wechselt

**Abhängigkeiten:** Phase 1.2

**Geschätzter Aufwand:** 1 Stunde

## Phase 2: Editor-Unterstützung

### 2.1 Platzhalter-Dropdown Komponente

**Datei:** `src/components/workflow/PlaceholderDropdown.vue` (neu)

**Aufgaben:**
- [ ] Komponente erstellen
- [ ] Props: `availableVariables: string[]`, `onSelect: (variable: string) => void`
- [ ] Dropdown-UI implementieren
- [ ] Click-Handler für Variablen
- [ ] Styling (ChurchTools-konform)

**Template:**
```vue
<template>
  <div class="placeholder-dropdown">
    <button 
      type="button"
      class="ct-btn ct-btn-secondary"
      @click="isOpen = !isOpen"
    >
      Platzhalter einfügen
    </button>
    
    <div v-if="isOpen" class="dropdown-menu">
      <div 
        v-for="variable in availableVariables"
        :key="variable"
        class="dropdown-item"
        @click="selectVariable(variable)"
      >
        {{ variable }}
      </div>
      <div v-if="availableVariables.length === 0" class="empty-state">
        Keine Variablen verfügbar
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  availableVariables: string[];
}>();

const emit = defineEmits<{
  select: [variable: string];
}>();

const isOpen = ref(false);

function selectVariable(variable: string) {
  emit('select', variable);
  isOpen.value = false;
}
</script>
```

**Abhängigkeiten:** Keine

**Geschätzter Aufwand:** 2-3 Stunden

### 2.2 TaskNode Editor erweitern

**Datei:** `src/components/workflow/nodes/TaskNode.vue` oder neue Datei

**Aufgaben:**
- [ ] Prüfen ob TaskNode-Editor existiert
- [ ] Falls nicht: Editor-Komponente erstellen
- [ ] Beschreibungsfeld mit Platzhalter-Support
- [ ] `getAvailableVariables()` integrieren
- [ ] Cursor-Position beim Einfügen berücksichtigen
- [ ] DefaultValue-Felder mit Platzhalter-Support

**Hinweis:** Aktuell wird TaskNode wahrscheinlich inline im WorkflowEditor bearbeitet.

**Zu prüfen:**
- Wo wird die Node-Konfiguration bearbeitet?
- Gibt es bereits ein Sidebar/Modal für Node-Eigenschaften?

**Abhängigkeiten:** Phase 2.1, Phase 1.1

**Geschätzter Aufwand:** 4-6 Stunden

### 2.3 WorkflowEditor Integration

**Datei:** `src/components/workflow/WorkflowEditor.vue`

**Aufgaben:**
- [ ] Code-Analyse: Wie werden Nodes aktuell bearbeitet?
- [ ] Integration des erweiterten TaskNode-Editors
- [ ] Sicherstellen dass `getAvailableVariables()` korrekt funktioniert

**Abhängigkeiten:** Phase 2.2

**Geschätzter Aufwand:** 2-3 Stunden

## Phase 3: Validierung & Feedback

### 3.1 Platzhalter-Validierung im Editor

**Aufgaben:**
- [ ] Funktion `validatePlaceholders()` erstellen
- [ ] Prüft ob alle Platzhalter in `availableVariables` existieren
- [ ] Zeigt Warnung bei unbekannten Platzhaltern
- [ ] UI: Warnung-Badge neben Beschreibungsfeld

**Datei:** `src/utils/template-interpolation.ts`

```typescript
export function validatePlaceholders(
  template: string,
  availableVariables: string[]
): { valid: boolean; unknownVariables: string[] } {
  const placeholders = extractPlaceholders(template);
  const unknown = placeholders.filter(p => !availableVariables.includes(p));
  
  return {
    valid: unknown.length === 0,
    unknownVariables: unknown
  };
}
```

**Abhängigkeiten:** Phase 2.2

**Geschätzter Aufwand:** 2 Stunden

### 3.2 Syntax-Highlighting (Optional)

**Aufgaben:**
- [ ] Platzhalter im Textfeld farblich hervorheben
- [ ] Regex-basierte Erkennung
- [ ] CSS-Klassen für valide/invalide Platzhalter

**Hinweis:** Kann komplex werden, evtl. Library verwenden (z.B. CodeMirror light)

**Abhängigkeiten:** Phase 2.2

**Geschätzter Aufwand:** 4-6 Stunden (optional)

## Phase 4: Testing & Dokumentation

### 4.1 Unit-Tests

**Dateien:**
- `src/utils/template-interpolation.spec.ts` (neu)

**Test-Cases:**
- `interpolate()` mit einfachen Variablen
- `interpolate()` mit fehlenden Variablen
- `interpolate()` mit leerem Template
- `extractPlaceholders()` findet alle Platzhalter
- `getAvailableVariables()` sammelt Variablen korrekt

**Abhängigkeiten:** Phase 1.1

**Geschätzter Aufwand:** 2-3 Stunden

### 4.2 Integration-Tests

**Test-Cases:**
- Workflow mit 2 Tasks durchlaufen
- Prüfen ob Beschreibung interpoliert wird
- Prüfen ob Felder vorbesetzt werden
- Prüfen ob Werte überschrieben werden

**Abhängigkeiten:** Phase 1.2

**Geschätzter Aufwand:** 2-3 Stunden

### 4.3 Benutzer-Dokumentation

**Datei:** `docs/USER_GUIDE_TEMPLATE_INTERPOLATION.md` (neu)

**Inhalte:**
- Wie verwende ich Platzhalter?
- Beispiele
- Best Practices
- Troubleshooting

**Abhängigkeiten:** Alle Phasen

**Geschätzter Aufwand:** 2 Stunden

## Reihenfolge der Implementierung

```
1. Phase 1.1 (Utility-Funktion)
   ↓
2. Phase 1.2 (WorkflowExecutor)
   ↓
3. Phase 1.3 (Execution Store Check)
   ↓
4. Phase 4.1 (Unit-Tests für Utils)
   ↓
5. Phase 2.1 (Platzhalter-Dropdown)
   ↓
6. Phase 2.2 (TaskNode Editor)
   ↓
7. Phase 2.3 (WorkflowEditor Integration)
   ↓
8. Phase 3.1 (Validierung)
   ↓
9. Phase 4.2 (Integration-Tests)
   ↓
10. Phase 3.2 (Syntax-Highlighting - Optional)
    ↓
11. Phase 4.3 (Dokumentation)
```

## Geschätzter Gesamt-Aufwand

**Minimum (ohne Optional):** 18-25 Stunden
**Mit Syntax-Highlighting:** 22-31 Stunden

## Risiken & Offene Fragen

### Risiken

1. **Editor-Struktur unbekannt:**
   - Wie werden Nodes aktuell bearbeitet?
   - Gibt es bereits ein Properties-Panel?
   - → Muss vor Phase 2 geklärt werden

2. **Cursor-Position beim Einfügen:**
   - Textarea vs. ContentEditable
   - Browser-Kompatibilität
   - → Kann mit `selectionStart/End` gelöst werden

3. **Reaktivität:**
   - Wann wird `formData` neu initialisiert?
   - Watch vs. Lifecycle-Hooks
   - → Muss getestet werden

### Offene Fragen

1. **Soll es eine Live-Vorschau im Editor geben?**
   - Zeigt interpolierte Werte mit Beispiel-Daten
   - Erhöht Komplexität deutlich

2. **Platzhalter in Labels/Placeholders?**
   - Aktuell nur in Description und DefaultValue
   - Sinnvoll auch in `field.label`?

3. **Fehlerbehandlung:**
   - Was passiert wenn Interpolation fehlschlägt?
   - Silent fail vs. Error-Boundary

4. **Performance:**
   - Interpolation bei jedem Render?
   - Oder gecached in Computed?
   - → Computed sollte ausreichen

## Nächste Schritte

1. **Code-Analyse:** WorkflowEditor und TaskNode untersuchen
2. **Prototyp:** Phase 1.1 + 1.2 implementieren und testen
3. **Feedback:** Funktioniert die Basis-Interpolation?
4. **Weiter:** Phase 2 starten
