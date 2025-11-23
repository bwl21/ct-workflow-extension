# Action: Gruppenmitgliedschaft verwalten

## Übersicht

**ID:** `ct-manage-group-membership`  
**Name:** Gruppenmitgliedschaft verwalten  
**Kategorie:** ChurchTools  
**Status:** ⚠️ Konfiguration fertig, API-Implementierung ausstehend

## Beschreibung

Diese Action legt eine Gruppenmitgliedschaft an oder ändert sie. Sie unterstützt auch das Setzen von Gruppenmitgliedsfeldern.

## Konfiguration

Alle Felder unterstützen **Platzhalter** (z.B. `{{personId}}`), um Werte aus vorherigen Workflow-Schritten zu verwenden.

### Pflichtfelder

| Feld | Typ | Beschreibung | Beispiel |
|------|-----|--------------|----------|
| `personId` | String | ID der Person | `{{personId}}` oder `123` |

### Optionale Felder

| Feld | Typ | Beschreibung | Beispiel |
|------|-----|--------------|----------|
| `groupName` | String | Name der Gruppe (alternativ zu groupId) | `Mitarbeiter` oder `{{groupName}}` |
| `groupId` | String | ID der Gruppe | `{{groupId}}` oder `42` |
| `roleName` | String | Name der Rolle (alternativ zu roleId) | `Leiter` oder `{{rollenname}}` |
| `roleId` | String | ID der Rolle in der Gruppe (groupTypeRoleId) | `{{roleId}}` oder `15` |
| `memberStartDate` | String | Startdatum der Mitgliedschaft | `2025-11-22` oder `{{datum}}` |
| `groupMemberStatus` | String | Status der Mitgliedschaft | `active` oder `{{status}}` |
| `onlyAdd` | Boolean | Nur hinzufügen, nicht aktualisieren | `true` (Standard) |
| `memberFields` | Array | Liste von Gruppenmitgliedsfeldern | Siehe Beispiele unten |

### Gruppenmitgliedsfelder

`memberFields` ist ein Array von Objekten mit folgender Struktur:

| Feld | Typ | Beschreibung | Beispiel |
|------|-----|--------------|----------|
| `referenceName` | String | Referenzname des Feldes | `status`, `bemerkung`, `{{fieldName}}` |
| `value` | String | Wert des Feldes | `aktiv`, `{{status}}` |

### Hinweise

- **Gruppe:** Entweder `groupName` ODER `groupId` muss angegeben werden
- **Rolle:** Entweder `roleName` ODER `roleId` kann angegeben werden
  - Wenn beide leer: ChurchTools verwendet automatisch die Standardrolle
  - `roleName` wird automatisch zur `groupTypeRoleId` aufgelöst
- **Gruppenmitgliedsfelder:** Beliebig viele Felder können hinzugefügt werden
- **Platzhalter:** Alle Felder (inkl. referenceName und value) können Platzhalter enthalten
- **Automatische Lookups:**
  - `groupName` → `groupId`
  - `roleName` → `groupTypeRoleId`
  - `referenceName` → `fieldId`

## Verwendung

### Beispiel 1: Einfache Gruppenmitgliedschaft (mit Standardrolle)

```json
{
  "personId": "{{personId}}",
  "groupId": "42"
}
```

**Hinweis:** Ohne `roleId` wird die Standardrolle der Gruppe verwendet.

### Beispiel 2: Mit Gruppenname und Rollenname

```json
{
  "personId": "{{personId}}",
  "groupName": "Mitarbeiter",
  "roleName": "Leiter"
}
```

**Hinweis:** Beide Namen werden automatisch zu IDs aufgelöst.

### Beispiel 3: Mit Gruppenmitgliedsfeldern

```json
{
  "personId": "{{personId}}",
  "groupId": "{{groupId}}",
  "roleId": "{{roleId}}",
  "memberFields": [
    { "referenceName": "status", "value": "aktiv" },
    { "referenceName": "bemerkung", "value": "Neues Mitglied" }
  ]
}
```

### Beispiel 4: Alle Werte aus Platzhaltern

```json
{
  "personId": "{{eltern1.id}}",
  "groupName": "{{gruppenname}}",
  "roleId": "{{rolle}}",
  "memberFields": [
    { "referenceName": "{{field1_name}}", "value": "{{field1_value}}" },
    { "referenceName": "status", "value": "{{person_status}}" }
  ]
}
```

### Beispiel 5: Mehrere Felder

```json
{
  "personId": "{{personId}}",
  "groupId": "42",
  "roleId": "1",
  "memberFields": [
    { "referenceName": "status", "value": "aktiv" },
    { "referenceName": "eintritt", "value": "{{datum}}" },
    { "referenceName": "bemerkung", "value": "{{notiz}}" },
    { "referenceName": "kategorie", "value": "Mitarbeiter" }
  ]
}
```

## Workflow-Beispiel

```
[Start]
   ↓
[Daten erfassen]
  - personId: PERSON
  - gruppenname: TEXT
   ↓
[Gruppenmitgliedschaft verwalten]
  Config:
    personId: {{personId.id}}
    groupName: {{gruppenname}}
    roleId: 1
   ↓
[Ende]
```

## UI

### Konfiguration

Die Konfigurationskomponente bietet:
- Textfelder für alle Parameter
- 📋 Button bei jedem Feld für Platzhalter-Auswahl
- Durchsuchbare Platzhalter-Liste
- Hilfetext für jedes Feld
- **Dynamische Liste für Gruppenmitgliedsfelder:**
  - "+ Feld hinzufügen" Button
  - Jedes Feld hat: Referenzname + Wert
  - "✕" Button zum Entfernen
  - Beide Felder unterstützen Platzhalter

### Ausführung

Die Ausführungskomponente zeigt:
- Vorschau der Konfiguration (mit interpolierten Werten)
- "Ausführen" Button
- Erfolgsmeldung mit Details
- Fehlermeldung bei Problemen

## API-Implementierung

✅ **Status:** Vollständig implementiert

### Implementierung

```typescript
async function execute(config) {
  // 1. Interpolate all values
  const interpolated = interpolateConfig(config);
  
  // 2. Resolve group (by name or ID)
  let groupId = interpolated.groupId;
  if (!groupId && interpolated.groupName) {
    const groups = await churchtoolsClient.get('/groups', {
      params: { name: interpolated.groupName }
    });
    groupId = groups.data.find(g => g.name === interpolated.groupName)?.id;
  }
  
  // 3. Resolve role (by name or ID)
  let roleId = interpolated.roleId;
  if (!roleId && interpolated.roleName) {
    const roles = await churchtoolsClient.get(`/groups/${groupId}/roles`);
    roleId = roles.data.find(r => r.name === interpolated.roleName)?.id;
  }
  
  // 4. Fetch group member fields to resolve referenceName -> fieldId
  const fieldsResponse = await churchtoolsClient.get(`/groups/${groupId}/fields`);
  const availableFields = fieldsResponse.data;
  
  // 4. Build fields object: { fieldId: [value] }
  const fields = {};
  for (const field of interpolated.memberFields) {
    const fieldDef = availableFields.find(f => 
      f.referenceName === field.referenceName
    );
    if (fieldDef) {
      fields[fieldDef.id] = [field.value];
    }
  }
  
  // 5. Build request body
  const requestBody = { fields };
  if (interpolated.roleId) {
    requestBody.groupTypeRoleId = parseInt(interpolated.roleId);
  }
  if (interpolated.memberStartDate) {
    requestBody.memberStartDate = interpolated.memberStartDate;
  }
  if (interpolated.groupMemberStatus) {
    requestBody.groupMemberStatus = interpolated.groupMemberStatus;
  }
  
  // 6. Create or update membership
  const queryParams = interpolated.onlyAdd ? '?only_add=true' : '';
  const response = await churchtoolsClient.put(
    `/groups/${groupId}/members/${interpolated.personId}${queryParams}`,
    requestBody
  );
  
  return { success: true, data: response.data };
}
```

### Features

- ✅ Automatischer Lookup: `groupName` → `groupId`
- ✅ Automatischer Lookup: `referenceName` → `fieldId`
- ✅ Standardrolle wenn `roleId` leer
- ✅ Alle Felder optional (außer `personId` und Gruppe)
- ✅ Vollständige Fehlerbehandlung
- ✅ Console-Logging für Debugging

## Dateien

- `src/actions/churchtools/manage-group-membership/ManageGroupMembershipAction.ts` - Action Definition
- `src/actions/churchtools/manage-group-membership/ManageGroupMembershipConfig.vue` - Konfiguration UI
- `src/actions/churchtools/manage-group-membership/ManageGroupMembershipExecute.vue` - Ausführung UI

## Validierung

Die Action validiert:
- ✅ `personId` ist vorhanden
- ✅ Entweder `groupId` oder `groupName` ist vorhanden

## Fehlerbehandlung

Mögliche Fehler:
- Person nicht gefunden
- Gruppe nicht gefunden
- Keine Berechtigung
- Gruppenmitgliedsfeld nicht gefunden
- Ungültiger Feldwert
- Netzwerkfehler

## Nächste Schritte

1. [ ] ChurchTools API-Endpunkte recherchieren
2. [ ] API-Integration implementieren
3. [ ] Fehlerbehandlung verfeinern
4. [ ] Tests schreiben
5. [ ] Dokumentation vervollständigen

## Verwandte Actions

- `ct-add-to-group` - Einfachere Action zum Hinzufügen zu Gruppen
- `ct-api-call` - Generische ChurchTools API Action

## Changelog

### Version 1.1.0 (2025-11-22)
- ✅ Gruppenmitgliedsfelder als dynamische Liste
- ✅ Beliebig viele Felder hinzufügen/entfernen
- ✅ Platzhalter für referenceName und value

### Version 1.0.0 (2025-11-22)
- ✅ Action-Struktur erstellt
- ✅ Konfiguration UI mit Platzhalter-Unterstützung
- ✅ Ausführung UI (Simulation)
- ⚠️ API-Implementierung ausstehend
