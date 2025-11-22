# Action: Gruppenmitgliedschaft verwalten

## Übersicht

**ID:** `ct-manage-group-membership`  
**Name:** Gruppenmitgliedschaft verwalten  
**Kategorie:** ChurchTools  
**Status:** ⚠️ Konfiguration fertig, API-Implementierung ausstehend

## Beschreibung

Diese Action legt eine Gruppenmitgliedschaft an oder ändert sie. Sie unterstützt auch das Setzen von Gruppenmerkmalsfeldern (GMF).

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
| `roleId` | String | ID der Rolle in der Gruppe | `{{roleId}}` oder `1` |
| `gmfReferenceName` | String | Referenzname des Gruppenmerkmalfelds | `status` oder `{{gmfReferenceName}}` |
| `gmfId` | String | ID des Gruppenmerkmalfelds | `{{gmfId}}` oder `5` |

### Hinweise

- **Gruppe:** Entweder `groupName` ODER `groupId` muss angegeben werden
- **GMF:** Beide Felder (`gmfReferenceName` und `gmfId`) sind optional
- **Platzhalter:** Alle Felder können Platzhalter enthalten

## Verwendung

### Beispiel 1: Einfache Gruppenmitgliedschaft

```json
{
  "personId": "{{personId}}",
  "groupId": "42",
  "roleId": "1"
}
```

### Beispiel 2: Mit Gruppenname

```json
{
  "personId": "{{personId}}",
  "groupName": "Mitarbeiter",
  "roleId": "{{roleId}}"
}
```

### Beispiel 3: Mit Gruppenmerkmalfeld

```json
{
  "personId": "{{personId}}",
  "groupId": "{{groupId}}",
  "roleId": "{{roleId}}",
  "gmfReferenceName": "status",
  "gmfId": "{{gmfId}}"
}
```

### Beispiel 4: Alle Werte aus Platzhaltern

```json
{
  "personId": "{{eltern1.id}}",
  "groupName": "{{gruppenname}}",
  "roleId": "{{rolle}}",
  "gmfReferenceName": "{{gmf_name}}",
  "gmfId": "{{gmf_id}}"
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

### Ausführung

Die Ausführungskomponente zeigt:
- Vorschau der Konfiguration (mit interpolierten Werten)
- "Ausführen" Button
- Erfolgsmeldung mit Details
- Fehlermeldung bei Problemen

## API-Implementierung

⚠️ **Status:** Noch nicht implementiert

Die tatsächliche ChurchTools API-Integration erfolgt später. Aktuell wird nur eine Simulation ausgeführt.

### Geplante Implementierung

```typescript
// TODO: Implementierung
async function execute(config) {
  // 1. Interpolate all values
  const interpolated = interpolateConfig(config);
  
  // 2. Resolve group (by name or ID)
  const groupId = interpolated.groupId || 
                  await resolveGroupByName(interpolated.groupName);
  
  // 3. Create or update membership
  const membership = await churchtoolsClient.post(
    `/groups/${groupId}/members`,
    {
      personId: interpolated.personId,
      roleId: interpolated.roleId,
    }
  );
  
  // 4. Set GMF if provided
  if (interpolated.gmfId) {
    await churchtoolsClient.put(
      `/groups/${groupId}/members/${interpolated.personId}/fields/${interpolated.gmfId}`,
      {
        value: interpolated.gmfValue,
      }
    );
  }
  
  return { success: true, data: membership };
}
```

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
- GMF nicht gefunden
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

### Version 1.0.0 (2025-11-22)
- ✅ Action-Struktur erstellt
- ✅ Konfiguration UI mit Platzhalter-Unterstützung
- ✅ Ausführung UI (Simulation)
- ⚠️ API-Implementierung ausstehend
