# ChurchTools Actions

## Übersicht

Die ChurchTools Actions ermöglichen die Integration mit der ChurchTools API direkt aus Workflows heraus.

## Verfügbare Actions

### 1. ChurchTools API Call (Generisch)

**ID:** `ct-api-call`  
**Kategorie:** CHURCHTOOLS  
**Icon:** ⛪ church

#### Beschreibung

Führt einen beliebigen ChurchTools API-Call aus. Diese Action ist flexibel und kann für alle ChurchTools API-Endpoints verwendet werden.

#### Konfiguration

| Feld | Typ | Erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `method` | String | Ja | HTTP-Methode (GET, POST, PUT, PATCH, DELETE) |
| `endpoint` | String | Ja | API-Endpoint (ohne `/api` Prefix) |
| `params` | Object | Nein | Query-Parameter (nur bei GET) |
| `body` | Object | Nein | Request Body (bei POST, PUT, PATCH) |
| `responseMapping` | Object | Nein | Mapping von Response-Feldern auf Variablen |

#### Wichtige Hinweise

⚠️ **Kein `/api` Prefix:** Der ChurchTools Client fügt automatisch `/api` hinzu!

```typescript
// ✅ Richtig
endpoint: '/persons'  // → GET /api/persons

// ❌ Falsch
endpoint: '/api/persons'  // → GET /api/api/persons
```

⚠️ **Authentifizierung:** Verwendet automatisch die aktuelle ChurchTools-Session

#### Variable Interpolation

Variablen aus dem Workflow-Kontext können mit `{{variableName}}` verwendet werden:

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

#### Beispiele

**Beispiel 1: Person abrufen**
```typescript
{
  method: 'GET',
  endpoint: '/persons/{{personId}}'
}
```

**Beispiel 2: Person erstellen**
```typescript
{
  method: 'POST',
  endpoint: '/persons',
  body: {
    firstName: '{{firstName}}',
    lastName: '{{lastName}}',
    email: '{{email}}'
  }
}
```

**Beispiel 3: Personen suchen**
```typescript
{
  method: 'GET',
  endpoint: '/persons',
  params: {
    query: '{{searchQuery}}',
    limit: '10'
  }
}
```

**Beispiel 4: Gruppe aktualisieren**
```typescript
{
  method: 'PUT',
  endpoint: '/groups/{{groupId}}',
  body: {
    name: '{{newGroupName}}'
  }
}
```

#### Output

Die Action speichert die Response automatisch in der Variable `lastApiResponse`:

```typescript
// Nach dem API-Call verfügbar:
context.helpers.getVariable('lastApiResponse')
// → { data: { id: 123, ... } }
```

---

### 2. Person zu Gruppe hinzufügen

**ID:** `ct-add-to-group`  
**Kategorie:** CHURCHTOOLS  
**Icon:** 👤➕ user-plus

#### Beschreibung

Spezialisierte Action zum Hinzufügen einer Person zu einer ChurchTools-Gruppe. Bietet eine benutzerfreundliche UI mit Validierung.

#### Konfiguration

| Feld | Typ | Erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `personId` | Number | Ja* | ID der Person |
| `personIdVariable` | String | Ja* | Variable mit Person ID |
| `groupId` | Number | Ja* | ID der Gruppe |
| `groupIdVariable` | String | Ja* | Variable mit Gruppen ID |
| `roleId` | Number | Nein | ID der Gruppenrolle |

\* Entweder direkte ID oder Variable erforderlich

#### Besonderheiten

- **Flexible Input:** Person und Gruppe können entweder als direkte ID oder aus Variable gelesen werden
- **Toggle-UI:** Einfacher Wechsel zwischen direkter Eingabe und Variable
- **Validierung:** Prüft, dass Person und Gruppe angegeben sind
- **Service-Layer:** Nutzt `GroupService` für typsichere API-Calls

#### Beispiele

**Beispiel 1: Direkte IDs**
```typescript
{
  personId: 123,
  groupId: 42,
  roleId: 1
}
```

**Beispiel 2: Aus Variablen**
```typescript
{
  personIdVariable: 'newPersonId',  // Aus vorherigem Schritt
  groupIdVariable: 'targetGroupId',
  roleId: 7
}
```

**Beispiel 3: Gemischt**
```typescript
{
  personIdVariable: 'personId',  // Aus Variable
  groupId: 42,                   // Fest
  roleId: null                   // Standard-Rolle
}
```

#### Output

Die Action speichert folgende Variablen:

```typescript
{
  lastAddedPersonId: 123,
  lastAddedToGroupId: 42
}
```

---

## Service-Layer

Die ChurchTools Actions nutzen einen Service-Layer für typsichere API-Calls.

### GroupService

```typescript
import { GroupService } from '@/services/GroupService';

// Gruppen suchen
const groups = await GroupService.searchGroups({
  query: 'Jugend',
  limit: 10
});

// Gruppe abrufen
const group = await GroupService.getGroup(42);

// Gruppenmitglieder abrufen
const members = await GroupService.getGroupMembers(42);

// Person zu Gruppe hinzufügen
await GroupService.addMemberToGroup(42, 123, 1);

// Person aus Gruppe entfernen
await GroupService.removeMemberFromGroup(42, 123);

// Gruppe erstellen
const newGroup = await GroupService.createGroup({
  name: 'Neue Gruppe',
  groupTypeId: 5
});

// Gruppe aktualisieren
await GroupService.updateGroup(42, {
  name: 'Neuer Name'
});
```

### PersonService

```typescript
import { PersonService } from '@/services/PersonService';

// Personen suchen
const persons = await PersonService.searchPersons({
  query: 'Max',
  limit: 10
});

// Person abrufen
const person = await PersonService.getPerson(123);

// Person-Namen formatieren
const name = PersonService.formatPersonName(person);
// → "Max Mustermann" oder "Max "Maxi" Mustermann"
```

---

## Workflow-Beispiele

### Beispiel 1: Person erstellen und zu Gruppe hinzufügen

```
┌─────────────────────────────────────────┐
│ Input: Person-Daten erfassen            │
│ → firstName, lastName, email            │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ ChurchTools API: Person erstellen       │
│ POST /persons                           │
│ Body: { firstName, lastName, email }    │
│ → lastApiResponse.data.id               │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Person zu Gruppe hinzufügen             │
│ personIdVariable: lastApiResponse.data.id│
│ groupId: 42                             │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Email: Willkommens-Mail                 │
└─────────────────────────────────────────┘
```

### Beispiel 2: Personen suchen und zu Gruppe hinzufügen

```
┌─────────────────────────────────────────┐
│ Input: Suchbegriff                      │
│ → searchQuery                           │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ ChurchTools API: Personen suchen        │
│ GET /persons?query={{searchQuery}}      │
│ → lastApiResponse.data[0].id            │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Decision: Person gefunden?              │
└────┬───────────────────────────────┬────┘
     │ Ja                            │ Nein
     ▼                               ▼
┌─────────────────────┐    ┌──────────────────┐
│ Zu Gruppe hinzufügen│    │ Fehler-Meldung   │
└─────────────────────┘    └──────────────────┘
```

### Beispiel 3: Gruppe erstellen und Mitglieder hinzufügen

```
┌─────────────────────────────────────────┐
│ Input: Gruppen-Daten                    │
│ → groupName, groupTypeId                │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ ChurchTools API: Gruppe erstellen       │
│ POST /groups                            │
│ Body: { name, groupTypeId }             │
│ → lastApiResponse.data.id               │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Person 1 zu Gruppe hinzufügen           │
│ personId: 123                           │
│ groupIdVariable: lastApiResponse.data.id│
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Person 2 zu Gruppe hinzufügen           │
│ personId: 456                           │
│ groupIdVariable: lastApiResponse.data.id│
└─────────────────────────────────────────┘
```

---

## Best Practices

### 1. Variable Interpolation nutzen

✅ **Gut:**
```typescript
{
  endpoint: '/persons/{{personId}}',
  body: {
    firstName: '{{firstName}}'
  }
}
```

❌ **Schlecht:**
```typescript
{
  endpoint: '/persons/123',  // Fest codiert
  body: {
    firstName: 'Max'  // Fest codiert
  }
}
```

### 2. Fehlerbehandlung mit Decision-Nodes

```
┌─────────────────────────────────────────┐
│ ChurchTools API: Person erstellen       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Decision: Erfolgreich?                  │
└────┬────────────────────────────────┬───┘
     │ Ja                             │ Nein
     ▼                                ▼
┌─────────────────────┐    ┌──────────────────────┐
│ Weiter mit Workflow │    │ Email: Admin         │
│                     │    │ benachrichtigen      │
└─────────────────────┘    └──────────────────────┘
```

### 3. Response-Daten weiterverwenden

```typescript
// Schritt 1: Person erstellen
{
  method: 'POST',
  endpoint: '/persons',
  body: { ... }
}
// → lastApiResponse.data.id = 123

// Schritt 2: Person zu Gruppe hinzufügen
{
  personIdVariable: 'lastApiResponse.data.id',
  groupId: 42
}
```

### 4. Spezialisierte Actions bevorzugen

Für häufige Operationen:

✅ **Gut:** `AddToGroupAction` verwenden  
❌ **Weniger gut:** Generische `ChurchToolsApiAction` mit POST `/groups/{id}/members`

**Warum?** Spezialisierte Actions bieten:
- Bessere UI
- Validierung
- Typsicherheit
- Klarere Workflows

---

## Häufige Endpoints

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/persons` | GET | Personen suchen |
| `/persons/{id}` | GET | Person abrufen |
| `/persons` | POST | Person erstellen |
| `/persons/{id}` | PUT | Person aktualisieren |
| `/groups` | GET | Gruppen abrufen |
| `/groups/{id}` | GET | Gruppe abrufen |
| `/groups/{id}/members` | GET | Gruppenmitglieder |
| `/groups/{id}/members` | POST | Mitglied hinzufügen |
| `/groups/{id}/members/{personId}` | DELETE | Mitglied entfernen |
| `/events` | GET | Events abrufen |
| `/events/{id}` | GET | Event abrufen |
| `/events` | POST | Event erstellen |
| `/events/{id}` | PUT | Event aktualisieren |
| `/custommodules` | GET | Custom Modules |
| `/whoami` | GET | Aktueller User |
| `/permissions/global` | GET | Globale Berechtigungen |

---

## Troubleshooting

### Problem: 404 Not Found

**Ursache:** Falscher Endpoint oder doppeltes `/api`

**Lösung:**
```typescript
// ✅ Richtig
endpoint: '/persons'

// ❌ Falsch
endpoint: '/api/persons'
endpoint: 'persons'  // Fehlt /
```

### Problem: 401 Unauthorized

**Ursache:** Benutzer nicht eingeloggt

**Lösung:** Stelle sicher, dass der Benutzer in ChurchTools eingeloggt ist

### Problem: 403 Forbidden

**Ursache:** Fehlende Berechtigungen

**Lösung:** Prüfe die Berechtigungen des Benutzers in ChurchTools

### Problem: Variable nicht gefunden

**Ursache:** Variable existiert nicht im Workflow-Kontext

**Lösung:**
1. Prüfe, ob vorheriger Schritt die Variable setzt
2. Prüfe Schreibweise (case-sensitive)
3. Verwende verfügbare Variablen aus der Liste

---

## Zukünftige Erweiterungen

### Geplant

- [ ] Response-Mapping implementieren
- [ ] Retry-Mechanismus
- [ ] Batch-Operations (z.B. mehrere Personen zu Gruppe hinzufügen)
- [ ] Weitere spezialisierte Actions:
  - [ ] `CreatePersonAction`
  - [ ] `CreateEventAction`
  - [ ] `UpdatePersonAction`
  - [ ] `SearchPersonsAction`

### In Diskussion

- [ ] Parallele API-Calls
- [ ] Compensation-Pattern für Rollback
- [ ] Sub-Workflows
- [ ] Workflow-Templates

---

## Feedback

Hast du Ideen für neue Actions oder Verbesserungen? Erstelle ein Issue im Repository!
