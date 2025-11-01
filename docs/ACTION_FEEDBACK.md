# Action-Feedback bei Workflow-Ausführung

## Übersicht

Bei der Ausführung von Actions im Workflow erhält der Benutzer jetzt detailliertes Feedback über:
- Was die Action macht
- Ob sie erfolgreich war
- Welche Daten zurückgegeben wurden
- Wie lange die Ausführung gedauert hat

## Feedback während der Ausführung

### 1. Action-Anzeige

Wenn ein Action-Node erreicht wird, sieht der Benutzer:

```
┌─────────────────────────────────────────────────────┐
│ ChurchTools API Call                                │
│ Führt einen ChurchTools API-Call aus                │
│                                                     │
│ [Action wird ausgeführt...]                         │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Führe POST /persons aus...                      │ │
│ │ [Spinner Animation]                             │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 2. Erfolgreiche Ausführung

Nach erfolgreicher Ausführung:

```
┌─────────────────────────────────────────────────────┐
│ ✓ Erfolgreich ausgeführt                            │
│                                                     │
│ ▼ Ergebnis anzeigen                                 │
│ ┌─────────────────────────────────────────────────┐ │
│ │ {                                               │ │
│ │   "data": {                                     │ │
│ │     "id": 123,                                  │ │
│ │     "firstName": "Max",                         │ │
│ │     "lastName": "Mustermann"                    │ │
│ │   }                                             │ │
│ │ }                                               │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Dauer: 234ms                                        │
│                                                     │
│ [Fortfahren]                                        │
└─────────────────────────────────────────────────────┘
```

### 3. Fehlgeschlagene Ausführung

Bei Fehler:

```
┌─────────────────────────────────────────────────────┐
│ ✕ Fehler bei Ausführung                             │
│                                                     │
│ Person ID ist erforderlich                          │
│                                                     │
│ [Fortfahren]                                        │
└─────────────────────────────────────────────────────┘
```

## Feedback in der Execution History

Die Bearbeitungschronologie zeigt alle ausgeführten Actions mit ihrem Ergebnis:

```
Bearbeitungschronologie
├─ Start
│  ✓ 01.11.2024, 17:30
│
├─ Person-Daten erfassen
│  ✓ 01.11.2024, 17:31
│  Eingaben:
│  • firstName: Max
│  • lastName: Mustermann
│  • email: max@example.com
│
├─ ChurchTools API Call
│  ✓ 01.11.2024, 17:31
│  ┌─────────────────────────────────────┐
│  │ ✓ ChurchTools API Call erfolgreich  │
│  │ (234ms)                             │
│  └─────────────────────────────────────┘
│
├─ Person zu Gruppe hinzufügen
│  ✓ 01.11.2024, 17:32
│  ┌─────────────────────────────────────┐
│  │ ✓ Person zu Gruppe hinzufügen       │
│  │   erfolgreich (156ms)               │
│  └─────────────────────────────────────┘
│
└─ Ende
   ✓ 01.11.2024, 17:32
```

### Bei Fehler in der History:

```
├─ ChurchTools API Call
│  ✕ 01.11.2024, 17:31
│  ┌─────────────────────────────────────┐
│  │ ✕ ChurchTools API Call              │
│  │   fehlgeschlagen                    │
│  │ Person ID ist erforderlich          │
│  └─────────────────────────────────────┘
```

## Action-Ergebnis-Struktur

Jede Action gibt ein `ActionResult` zurück:

```typescript
interface ActionResult {
  success: boolean;        // Erfolgreich?
  data?: any;             // Ausgabedaten
  error?: string;         // Fehlermeldung
  metadata?: Record<string, any>;  // Zusätzliche Metadaten
  duration?: number;      // Dauer in ms
}
```

### Beispiel: ChurchToolsApiAction

```typescript
// Erfolg
{
  success: true,
  data: {
    data: {
      id: 123,
      firstName: "Max",
      lastName: "Mustermann"
    }
  },
  duration: 234
}

// Fehler
{
  success: false,
  error: "Person ID ist erforderlich",
  duration: 12
}
```

### Beispiel: AddToGroupAction

```typescript
// Erfolg
{
  success: true,
  data: {
    personId: 123,
    groupId: 42,
    roleId: 1
  },
  duration: 156
}

// Fehler
{
  success: false,
  error: "Gruppe nicht gefunden",
  duration: 45
}
```

## Daten-Weitergabe

Erfolgreiche Action-Ergebnisse werden automatisch im Workflow-Context gespeichert:

```typescript
// Nach ChurchToolsApiAction (POST /persons)
context.variables = {
  ...context.variables,
  lastApiResponse: {
    data: {
      id: 123,
      firstName: "Max",
      lastName: "Mustermann"
    }
  }
}

// Kann in nächster Action verwendet werden
{
  personIdVariable: "lastApiResponse.data.id"  // → 123
}
```

## Implementierung in eigenen Actions

### Execute-Komponente

Jede Action sollte eine Execute-Komponente haben, die das `complete` Event emittiert:

```vue
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

const loading = ref(false);
const status = ref<'pending' | 'success' | 'error'>('pending');
const message = ref('');

const execute = async () => {
  loading.value = true;
  const startTime = Date.now();

  try {
    message.value = 'Führe Action aus...';
    
    // Deine Action-Logik hier
    const result = await doSomething();
    
    status.value = 'success';
    message.value = 'Erfolgreich ausgeführt';

    // Emit success
    emit('complete', {
      success: true,
      data: result,
      duration: Date.now() - startTime,
    });
  } catch (error: any) {
    status.value = 'error';
    message.value = `Fehler: ${error.message}`;

    // Emit error
    emit('complete', {
      success: false,
      error: error.message,
      duration: Date.now() - startTime,
    });
  } finally {
    loading.value = false;
  }
};

onMounted(() => execute());
</script>

<template>
  <div class="my-action-execute">
    <div v-if="loading" class="status loading">
      <div class="spinner"></div>
      <p>{{ message }}</p>
    </div>

    <div v-else-if="status === 'success'" class="status success">
      <div class="icon">✓</div>
      <p>{{ message }}</p>
    </div>

    <div v-else-if="status === 'error'" class="status error">
      <div class="icon">✕</div>
      <p>{{ message }}</p>
    </div>
  </div>
</template>
```

### Best Practices

1. **Immer `complete` Event emittieren**
   - Bei Erfolg UND bei Fehler
   - Mit vollständigem `ActionResult`

2. **Aussagekräftige Fehlermeldungen**
   ```typescript
   // ✅ Gut
   error: "Person ID ist erforderlich"
   
   // ❌ Schlecht
   error: "Error"
   ```

3. **Nützliche Daten zurückgeben**
   ```typescript
   // ✅ Gut
   data: {
     personId: 123,
     groupId: 42,
     membershipId: 456
   }
   
   // ❌ Schlecht
   data: true
   ```

4. **Duration messen**
   ```typescript
   const startTime = Date.now();
   // ... action logic ...
   duration: Date.now() - startTime
   ```

5. **Loading-State anzeigen**
   - Spinner während Ausführung
   - Fortschritts-Meldungen
   - Klare Status-Anzeige

## Beispiel-Workflows

### Workflow 1: Person erstellen mit Feedback

```
1. [Task] Person-Daten erfassen
   → firstName, lastName, email

2. [Action: ChurchToolsApiAction]
   POST /persons
   
   Feedback:
   ✓ Erfolgreich ausgeführt
   Ergebnis: { data: { id: 123, ... } }
   Dauer: 234ms
   
   → lastApiResponse.data.id = 123

3. [Action: AddToGroupAction]
   personIdVariable: lastApiResponse.data.id
   groupId: 42
   
   Feedback:
   ✓ Person zu Gruppe hinzufügen erfolgreich
   Dauer: 156ms

4. [End]
```

### Workflow 2: Mit Fehlerbehandlung

```
1. [Task] Person-Daten erfassen
   → firstName, lastName, email

2. [Action: ChurchToolsApiAction]
   POST /persons
   
   Feedback:
   ✕ Fehler bei Ausführung
   E-Mail-Adresse ist ungültig
   
   [Benutzer kann Workflow abbrechen oder korrigieren]

3. [Decision] Erfolgreich?
   → Ja: Weiter
   → Nein: Zurück zu Schritt 1
```

## Troubleshooting

### Problem: Kein Feedback angezeigt

**Ursache:** Action hat keine `executeComponent`

**Lösung:** Füge `executeComponent` zur Action hinzu

### Problem: Feedback verschwindet sofort

**Ursache:** `complete` Event wird zu früh emittiert

**Lösung:** Warte auf async-Operationen:
```typescript
await doSomething();  // ← await!
emit('complete', result);
```

### Problem: Daten nicht im Context

**Ursache:** `data` nicht im ActionResult

**Lösung:** Gib `data` im Result zurück:
```typescript
emit('complete', {
  success: true,
  data: { myVariable: value },  // ← data!
  duration: 123
});
```

## Weitere Informationen

- [ChurchTools Actions](./churchtools-actions.md)
- [Action Plugin System](./plugin-system.md)
- [Workflow Editor Actions](./WORKFLOW_EDITOR_ACTIONS.md)
