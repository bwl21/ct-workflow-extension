# Decision Node - Erweiterte Variablen-Unterstützung

## Problem

Decision Nodes konnten bisher nur auf Felder aus TASK-Nodes zugreifen. API-Call Ergebnisse und verschachtelte Objekt-Properties waren nicht verfügbar.

## Lösung

### 1. Alle Context-Variablen verfügbar

Decision Nodes haben jetzt Zugriff auf **alle Variablen** im Execution Context:

- ✅ **TASK-Felder** - Eingaben aus Formularen
- ✅ **ACTION-Ergebnisse** - Daten aus API-Calls
- ✅ **Verschachtelte Objekte** - Properties mit Dot-Notation

### 2. Verschachtelte Objekt-Properties

**Automatisch für PERSON-Felder:**

Wenn ein TASK-Feld vom Typ `PERSON` oder `PERSON_MULTI` ist, werden automatisch alle Person-Properties verfügbar:

```javascript
// TASK-Feld: eltern1 (Type: PERSON)

// Verfügbare Felder:
- eltern1              // Das Person-Objekt selbst
- eltern1.id           // Person-ID
- eltern1.firstName    // Vorname
- eltern1.lastName     // Nachname
- eltern1.nickname     // Spitzname
- eltern1.email        // E-Mail
- eltern1.imageUrl     // Bild-URL
- eltern1.street       // Straße
- eltern1.zip          // PLZ
- eltern1.city         // Ort
```

**Dot-Notation für API-Response:**

Nach Workflow-Ausführung auch für API-Responses:

```javascript
// Context nach API-Call:
{
  person: {
    id: 123,
    name: "Max Mustermann",
    address: {
      city: "Berlin",
      zip: "10115"
    }
  }
}

// Verfügbare Felder:
- person
- person.id
- person.name
- person.address
- person.address.city
- person.address.zip
```

### 3. Automatische Erkennung aus Execution

Die verfügbaren Felder werden **automatisch** aus der letzten Workflow-Ausführung erkannt:

1. Workflow einmal ausführen
2. Decision Node bearbeiten
3. Alle Variablen aus dem Context sind verfügbar
4. Verschachtelte Properties werden automatisch aufgelöst (bis 3 Ebenen tief)

## Verwendung

### Im Editor

**1. Workflow ausführen:**
```
[Start]
   ↓
[Daten erfassen] → name: "Max"
   ↓
[Person anlegen] → person: { id: 123, name: "Max", ... }
   ↓
[Entscheidung] ← Hier alle Variablen verfügbar!
```

**2. Decision Node konfigurieren:**
- Öffne Decision Node Editor
- Wähle Ausgang (z.B. "JA")
- Klicke "Bedingung hinzufügen"
- **Feld-Dropdown zeigt:**
  - 📝 Daten erfassen: name
  - 📝 Daten erfassen: eltern1
  - 📝 Daten erfassen: eltern1 → ID
  - 📝 Daten erfassen: eltern1 → Vorname
  - 📝 Daten erfassen: eltern1 → Nachname
  - 📝 Daten erfassen: eltern1 → E-Mail
  - 📝 Daten erfassen: eltern1 → Ort
  - ⚡ Variablen: person (nach Workflow-Ausführung)
  - ⚡ Variablen: person.id
  - ⚡ Variablen: person.name

**3. Bedingung erstellen:**
```
Feld: person.address.city
Operator: ist gleich
Wert: Berlin
```

### Beispiel-Workflow

```
[Start]
   ↓
[Daten erfassen]
  - name: Text
  - alter: Number
   ↓
[ChurchTools API: Person anlegen]
  → Ergebnis: { id: 123, name: "Max", status: "active" }
   ↓
[Entscheidung: Person aktiv?]
  Bedingung: person.status == "active"
   ↓ JA        ↓ NEIN
[Email]    [Warnung]
```

## Implementierung

### 1. Erweiterte `getAvailableFields()`

**Vorher:**
```typescript
function getAvailableFields() {
  // Nur TASK-Felder
  for (const node of nodes) {
    if (node.type === NodeType.TASK) {
      fields.push(node.data.fields);
    }
  }
}
```

**Jetzt:**
```typescript
function getAvailableFields() {
  // 1. TASK-Felder
  for (const node of nodes) {
    if (node.type === NodeType.TASK) {
      fields.push(node.data.fields);
    }
  }
  
  // 2. Execution Context Variablen
  const recentExecutions = executionStore.getWorkflowExecutions(workflowId);
  if (recentExecutions.length > 0) {
    const contextVars = recentExecutions[0].context.variables;
    flattenObject(contextVars); // Verschachtelte Properties
  }
}
```

### 2. Objekt-Flattening

```typescript
function flattenObject(obj: any, prefix: string = '', maxDepth: number = 3) {
  for (const [key, value] of Object.entries(obj)) {
    const fieldName = prefix ? `${prefix}.${key}` : key;
    
    // Add field
    fields.push({ name: fieldName, label: fieldName, type: typeof value });
    
    // Recurse for nested objects
    if (typeof value === 'object' && maxDepth > 0) {
      flattenObject(value, fieldName, maxDepth - 1);
    }
  }
}
```

### 3. Rule-Evaluator mit Dot-Notation

**Vorher:**
```typescript
function evaluateCondition(condition, context) {
  const fieldValue = context[condition.field]; // Nur top-level
}
```

**Jetzt:**
```typescript
function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value === null || value === undefined) return undefined;
    value = value[key];
  }
  
  return value;
}

function evaluateCondition(condition, context) {
  const fieldValue = getNestedValue(context, condition.field); // Dot-notation!
}
```

## Beispiele

### Beispiel 1: API-Response prüfen

**Context nach API-Call:**
```javascript
{
  apiResponse: {
    success: true,
    data: {
      id: 123,
      status: "active"
    }
  }
}
```

**Decision Node Bedingung:**
```
Feld: apiResponse.success
Operator: ist gleich
Wert: true
```

### Beispiel 2: Verschachtelte Person-Daten

**Context:**
```javascript
{
  person: {
    id: 123,
    name: "Max Mustermann",
    address: {
      city: "Berlin",
      zip: "10115"
    },
    groups: [1, 2, 3]
  }
}
```

**Mögliche Bedingungen:**
```
person.id > 100
person.name enthält "Max"
person.address.city ist gleich "Berlin"
person.address.zip beginnt mit "101"
```

### Beispiel 3: Mehrere API-Calls

**Context nach mehreren Actions:**
```javascript
{
  // Von TASK
  name: "Max",
  alter: 25,
  
  // Von API-Call 1
  person: { id: 123, status: "active" },
  
  // Von API-Call 2
  groups: [
    { id: 1, name: "Mitarbeiter" },
    { id: 2, name: "Admin" }
  ]
}
```

**Verfügbare Felder:**
- name
- alter
- person
- person.id
- person.status
- groups (Array)

## Einschränkungen

⚠️ **Max. 3 Ebenen tief** - Verschachtelung wird bis 3 Ebenen aufgelöst
⚠️ **Arrays** - Array-Elemente werden nicht einzeln aufgelöst
⚠️ **Execution erforderlich** - Workflow muss einmal ausgeführt werden, um Variablen zu sehen
⚠️ **Letzte Execution** - Verwendet die letzte Ausführung als Referenz

## Vorteile

✅ **Vollständiger Zugriff** - Alle Context-Variablen verfügbar
✅ **Verschachtelte Objekte** - Dot-Notation für Properties
✅ **Automatische Erkennung** - Keine manuelle Konfiguration
✅ **Type-Safe** - TypeScript-Unterstützung
✅ **Intuitiv** - Dropdown zeigt alle verfügbaren Felder

## Migration

Bestehende Workflows funktionieren **ohne Änderungen**:
- TASK-Felder funktionieren wie bisher
- Neue Variablen sind zusätzlich verfügbar
- Keine Breaking Changes

## Dateien geändert

- `src/components/workflow/WorkflowEditor.vue` - Erweiterte `getAvailableFields()`
- `src/utils/rule-evaluator.ts` - `getNestedValue()` für Dot-Notation

## Testing

1. Erstelle Workflow mit API-Call
2. Führe Workflow aus
3. Öffne Decision Node Editor
4. Prüfe Feld-Dropdown → Sollte API-Response Felder zeigen
5. Erstelle Bedingung mit verschachteltem Property
6. Teste Workflow-Ausführung

## Zukünftige Erweiterungen

- [ ] Array-Element-Zugriff: `groups[0].name`
- [ ] Funktionen: `length(groups)`, `contains(groups, 1)`
- [ ] Live-Preview: Zeige aktuellen Wert während Bearbeitung
- [ ] Type-Hints: Zeige Datentyp im Dropdown
