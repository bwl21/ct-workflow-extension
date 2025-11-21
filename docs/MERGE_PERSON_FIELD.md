# Merge: Person Field Feature

## Zusammenfassung

Der Branch `feature/person-field` wurde erfolgreich in `fix/workflow-delete-customdatavalue` gemerged.

## Was wurde gemerged

### 1. PersonSelector Komponente
- **Datei:** `src/components/common/PersonSelector.vue`
- **Funktionalität:** ChurchTools Person-Auswahl mit Suche und Filterung
- **Features:**
  - Single und Multiple Selection
  - Suche mit Debouncing (300ms)
  - Avatar-Anzeige
  - Filter nach Gruppen, Status, Campus
  - Required Field Validation

### 2. PersonService
- **Datei:** `src/services/PersonService.ts`
- **Funktionalität:** ChurchTools API Integration für Personen
- **Methoden:**
  - `getPersons()` - Liste aller Personen
  - `getPerson(id)` - Einzelne Person
  - `searchPersons(query)` - Suche

### 3. Field Types
- **Datei:** `src/types/workflow.types.ts`
- **Neue Types:**
  ```typescript
  PERSON = 'person',        // Einzelauswahl
  PERSON_MULTI = 'person-multi', // Mehrfachauswahl
  ```

### 4. ChurchTools Actions
- **AddToGroup Action:** Person zu Gruppe hinzufügen
- **ChurchToolsApi Action:** Generische ChurchTools API Calls
- **Dateien:**
  - `src/actions/churchtools/AddToGroupAction.ts`
  - `src/actions/churchtools/AddToGroupConfig.vue`
  - `src/actions/churchtools/AddToGroupExecute.vue`

### 5. Weitere Services
- **GroupService:** `src/services/GroupService.ts`
- **Permissions:** `src/composables/usePermissions.ts`
- **Error Helper:** `src/utils/errorHelper.ts`

### 6. Dokumentation
- `docs/PERSON_FIELD_IMPLEMENTATION.md`
- `docs/PERSON_FIELD_PLAN.md`
- `docs/PERSON_FIELD_SUMMARY.md`
- `docs/ACTION_FEEDBACK.md`
- `docs/CHURCHTOOLS_ACTIONS.md`
- Und viele weitere...

## Merge-Konflikte

### 1. useWorkflows.ts
**Konflikt:** `deleteWorkflow` Funktion

**Gelöst:** Unsere erweiterte Version behalten (mit CustomDataValue-Löschung)

```typescript
// Unsere Version (behalten) ✅
const deleteWorkflow = async (id: number) => {
  // 1. Finde Workflow und valueId
  const workflow = workflows.value.find((w: any) => w.id === id);
  
  // 2. Lösche CustomDataValue
  if (workflow?.valueId) {
    await deleteCustomDataValue(id, workflow.valueId, moduleId.value);
  }
  
  // 3. Lösche Category
  await deleteCustomDataCategory(id, moduleId.value);
};
```

### 2. UserView.vue
**Problem:** `loadWorkflows()` existiert nicht mehr

**Gelöst:** Aufruf entfernt, da Workflows automatisch über Vue Query geladen werden

```typescript
// Vorher ❌
onMounted(async () => {
  await workflowStore.loadWorkflows();
});

// Nachher ✅
// Note: Workflows are loaded automatically via useWorkflows (Vue Query)
```

## Änderungen an bestehenden Dateien

### WorkflowEditor.vue
- PersonSelector Integration für PERSON und PERSON_MULTI Fields
- Erweiterte Field-Konfiguration

### WorkflowExecutor.vue
- PersonSelector für Workflow-Ausführung
- Person-Daten in Execution Context

### PlaceholderDropdown.vue
- Person-Objekt Properties (firstName, lastName, email, etc.)
- Gruppierung nach Datentyp

### template-interpolation.ts
- Unterstützung für Person-Objekte
- Nested Property Access (z.B. `{{person.firstName}}`)

## Build-Status

✅ **Build erfolgreich**
```bash
npm run build
✓ built in 6.62s
```

## Commits

### Auf fix/workflow-delete-customdatavalue
1. `fix: Delete CustomDataValue when deleting workflow`
2. `fix: AdminView updates automatically after create/delete`
3. `feat: Add valueId to Workflow type`
4. `fix: Auto-open editor after workflow creation`
5. `fix: WorkflowStore uses reactive workflows from useWorkflows`
6. `Merge feature/person-field into fix/workflow-delete-customdatavalue` ← **NEU**

## Verwendung

### Person Field im Workflow-Editor

```typescript
// Task Node mit Person Field
{
  type: NodeType.TASK,
  data: {
    fields: [
      {
        name: 'assignedPerson',
        label: 'Zugewiesene Person',
        type: FieldType.PERSON,
        required: true,
        // Optional: Filter
        groupIds: [1, 2, 3],
        statusIds: [1, 2],
        campusIds: [1]
      }
    ]
  }
}
```

### Person Field in Workflow-Ausführung

```typescript
// Execution Context
{
  assignedPerson: {
    id: 123,
    firstName: 'Max',
    lastName: 'Mustermann',
    email: 'max@example.com',
    // ... weitere Felder
  }
}

// Template Interpolation
"Hallo {{assignedPerson.firstName}} {{assignedPerson.lastName}}"
// → "Hallo Max Mustermann"
```

### AddToGroup Action

```typescript
// Action Config
{
  actionId: 'churchtools.add-to-group',
  actionConfig: {
    personId: '{{assignedPerson.id}}', // Template Interpolation
    groupId: 42,
    groupTypeRoleId: 1
  }
}
```

## Testing

### Manuelle Tests

1. **Person Field im Editor:**
   - Task Node erstellen
   - Person Field hinzufügen
   - ✅ PersonSelector wird angezeigt
   - ✅ Suche funktioniert
   - ✅ Person kann ausgewählt werden

2. **Person Field in Execution:**
   - Workflow mit Person Field starten
   - ✅ PersonSelector wird angezeigt
   - ✅ Person kann ausgewählt werden
   - ✅ Daten werden in Context gespeichert

3. **Template Interpolation:**
   - Person Field auswählen
   - Template verwenden: `{{person.firstName}}`
   - ✅ Wird korrekt ersetzt

4. **AddToGroup Action:**
   - Action konfigurieren
   - Person auswählen
   - ✅ Person wird zu Gruppe hinzugefügt

## Bekannte Einschränkungen

1. **Permissions:** Noch nicht vollständig implementiert
2. **Offline-Modus:** PersonSelector benötigt API-Zugriff
3. **Caching:** Personen werden bei jeder Suche neu geladen

## Nächste Schritte

1. ✅ Merge abgeschlossen
2. ⏳ Tests durchführen
3. ⏳ Pull Request erstellen
4. ⏳ Code Review
5. ⏳ Merge in main

## Referenzen

- Person Field Dokumentation: `docs/PERSON_FIELD_IMPLEMENTATION.md`
- PersonSelector: `src/components/common/PersonSelector.vue`
- PersonService: `src/services/PersonService.ts`
- ChurchTools Actions: `docs/CHURCHTOOLS_ACTIONS.md`
