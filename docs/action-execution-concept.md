# Konzept: Aktionen in ChurchTools über API ausführen

## Übersicht

Dieses Dokument beschreibt verschiedene Ansätze zur Ausführung von Aktionen in ChurchTools über das API im Kontext der Workflow-Extension.

## Aktuelle Architektur

### Vorhandene Komponenten

1. **ActionPlugin System**
   - Plugin-basierte Architektur für erweiterbare Aktionen
   - ActionRegistry für zentrale Verwaltung
   - Kategorisierung (INTEGRATION, COMMUNICATION, DATA, LOGIC, CHURCHTOOLS, CUSTOM)

2. **Service Layer**
   - `PersonService`: Typsichere Wrapper für Person-API
   - Datenformatierung und Error Handling

3. **Vorhandene Actions**
   - `RestApiAction`: HTTP-Requests zu externen APIs
   - `EmailAction`: E-Mail-Versand

4. **ActionContext & Helpers**
   - Zugriff auf Workflow-Variablen
   - HTTP-Client für externe APIs
   - ChurchToolsClient-Interface (teilweise implementiert)
   - Logger

## Ansatz 1: Spezialisierte Actions (Empfohlen für häufige Operationen)

### Konzept

Für jede häufige ChurchTools-Operation wird eine dedizierte Action erstellt.

### Struktur

```
src/actions/churchtools/
├── person/
│   ├── CreatePersonAction.ts
│   ├── UpdatePersonAction.ts
│   ├── SearchPersonsAction.ts
│   └── AddToGroupAction.ts
├── group/
│   ├── CreateGroupAction.ts
│   ├── GetGroupMembersAction.ts
│   └── UpdateGroupAction.ts
├── event/
│   ├── CreateEventAction.ts
│   ├── UpdateEventAction.ts
│   └── SearchEventsAction.ts
└── service/
    ├── AssignToServiceAction.ts
    └── GetServicePlanAction.ts
```

### Beispiel-Implementierung

```typescript
// actions/churchtools/person/AddToGroupAction.ts
export const AddToGroupAction: ActionPlugin = {
  id: 'ct-add-to-group',
  name: 'Person zu Gruppe hinzufügen',
  description: 'Fügt eine Person einer ChurchTools-Gruppe hinzu',
  icon: 'user-plus',
  category: ActionCategory.CHURCHTOOLS,
  
  configComponent: defineAsyncComponent(() => import('./AddToGroupConfig.vue')),
  executeComponent: defineAsyncComponent(() => import('./AddToGroupExecute.vue')),
  
  defaultConfig: {
    personId: null,
    groupId: null,
    roleId: null,
    personIdVariable: '',  // Alternative: aus Workflow-Kontext
    groupIdVariable: ''
  },
  
  validate: (config) => {
    const errors = [];
    if (!config.personId && !config.personIdVariable) {
      errors.push({ field: 'personId', message: 'Person oder Variable erforderlich' });
    }
    if (!config.groupId && !config.groupIdVariable) {
      errors.push({ field: 'groupId', message: 'Gruppe oder Variable erforderlich' });
    }
    return { valid: errors.length === 0, errors };
  }
};
```

### Vorteile

✅ **Benutzerfreundlich**: Spezifische UI mit passenden Feldern  
✅ **Typsicher**: Validierung auf Feldebene  
✅ **Dokumentiert**: Selbsterklärende Feldnamen  
✅ **Wartbar**: Klare Struktur pro Operation  

### Nachteile

❌ **Viele Actions**: Hoher initialer Aufwand  
❌ **Wartungsaufwand**: Bei API-Änderungen viele Dateien anpassen  
❌ **Unflexibel**: Neue Operationen erfordern neue Actions  

### Wann verwenden?

- Häufig genutzte Operationen (z.B. Person erstellen, zu Gruppe hinzufügen)
- Wenn benutzerfreundliche UI wichtig ist
- Wenn Validierung auf Feldebene benötigt wird

## Ansatz 2: Generische ChurchTools API Action

### Konzept

Eine flexible Action, die beliebige ChurchTools API-Calls ausführen kann.

### Implementierung

```typescript
// actions/churchtools/generic/ChurchToolsApiAction.ts
export const ChurchToolsApiAction: ActionPlugin = {
  id: 'ct-api-call',
  name: 'ChurchTools API Call',
  description: 'Führt einen beliebigen ChurchTools API Call aus',
  icon: 'church',
  category: ActionCategory.CHURCHTOOLS,
  
  configComponent: defineAsyncComponent(() => import('./ChurchToolsApiConfig.vue')),
  executeComponent: defineAsyncComponent(() => import('./ChurchToolsApiExecute.vue')),
  
  defaultConfig: {
    method: 'GET',
    endpoint: '/persons',
    params: {},
    body: null,
    responseMapping: {},
    errorHandling: 'throw'  // 'throw' | 'continue' | 'retry'
  },
  
  validate: (config) => {
    const errors = [];
    if (!config.endpoint) {
      errors.push({ field: 'endpoint', message: 'Endpoint erforderlich' });
    }
    if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method)) {
      errors.push({ field: 'method', message: 'Ungültige HTTP-Methode' });
    }
    return { valid: errors.length === 0, errors };
  }
};
```

### Config-Komponente

```vue
<!-- ChurchToolsApiConfig.vue -->
<template>
  <div class="ct-api-config">
    <div class="form-group">
      <label>HTTP-Methode</label>
      <select v-model="config.method">
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="DELETE">DELETE</option>
        <option value="PATCH">PATCH</option>
      </select>
    </div>
    
    <div class="form-group">
      <label>Endpoint</label>
      <input 
        v-model="config.endpoint" 
        placeholder="/persons"
        @input="validateEndpoint"
      />
      <small>Ohne /api Prefix (wird automatisch hinzugefügt)</small>
    </div>
    
    <div class="form-group" v-if="config.method === 'GET'">
      <label>Query-Parameter</label>
      <KeyValueEditor v-model="config.params" />
    </div>
    
    <div class="form-group" v-if="['POST', 'PUT', 'PATCH'].includes(config.method)">
      <label>Request Body (JSON)</label>
      <JsonEditor v-model="config.body" />
    </div>
    
    <div class="form-group">
      <label>Response Mapping</label>
      <ResponseMappingEditor v-model="config.responseMapping" />
      <small>Mappe Response-Felder auf Workflow-Variablen</small>
    </div>
    
    <div class="form-group">
      <label>Fehlerbehandlung</label>
      <select v-model="config.errorHandling">
        <option value="throw">Workflow abbrechen</option>
        <option value="continue">Fortfahren</option>
        <option value="retry">Wiederholen (3x)</option>
      </select>
    </div>
  </div>
</template>
```

### Vorteile

✅ **Flexibel**: Alle API-Endpoints nutzbar  
✅ **Wenig Code**: Eine Action für alles  
✅ **Schnell**: Neue Endpoints sofort verfügbar  
✅ **Prototyping**: Ideal zum Testen  

### Nachteile

❌ **Weniger benutzerfreundlich**: Benutzer muss API kennen  
❌ **Keine Feld-Validierung**: Nur generische Validierung  
❌ **Fehleranfällig**: Tippfehler in Endpoints möglich  
❌ **Weniger dokumentiert**: Keine Hilfe zu Feldern  

### Wann verwenden?

- Für seltene oder einmalige API-Calls
- Wenn Flexibilität wichtiger als Benutzerfreundlichkeit ist
- Für Power-User und Entwickler
- Zum Prototyping neuer Workflows

## Ansatz 3: Hybrid-Ansatz (Empfohlen)

### Konzept

Kombination aus spezialisierten und generischen Actions.

### Struktur

```
src/actions/churchtools/
├── person/
│   ├── CreatePersonAction.ts       ← Spezialisiert
│   ├── UpdatePersonAction.ts       ← Spezialisiert
│   └── AddToGroupAction.ts         ← Spezialisiert
├── group/
│   ├── CreateGroupAction.ts        ← Spezialisiert
│   └── GetGroupMembersAction.ts    ← Spezialisiert
├── event/
│   └── CreateEventAction.ts        ← Spezialisiert
└── generic/
    └── ChurchToolsApiAction.ts     ← Generisch für alles andere
```

### Entscheidungsmatrix

| Operation | Action-Typ | Begründung |
|-----------|-----------|------------|
| Person erstellen | Spezialisiert | Häufig, viele Felder, Validierung wichtig |
| Person zu Gruppe hinzufügen | Spezialisiert | Sehr häufig, einfache UI |
| Event erstellen | Spezialisiert | Häufig, komplexe Felder |
| Gruppe erstellen | Spezialisiert | Häufig, Validierung wichtig |
| Custom Module Daten abrufen | Generisch | Selten, sehr variabel |
| Ressource buchen | Generisch | Selten, spezifisch |
| Beliebiger API-Call | Generisch | Fallback für alles andere |

### Vorteile

✅ **Best of Both**: Benutzerfreundlich + Flexibel  
✅ **Wartbar**: Nur häufige Operationen spezialisiert  
✅ **Erweiterbar**: Neue spezialisierte Actions bei Bedarf  
✅ **Pragmatisch**: Gute Balance zwischen Aufwand und Nutzen  

### Nachteile

❌ **Komplexität**: Zwei verschiedene Patterns  
❌ **Entscheidung nötig**: Wann spezialisiert, wann generisch?  

### Wann verwenden?

**Immer!** Dies ist der empfohlene Ansatz für die meisten Projekte.

## Ansatz 4: Service-basierte Actions

### Konzept

Actions nutzen einen erweiterten Service-Layer, der die gesamte ChurchTools API abstrahiert.

### Service-Layer

```typescript
// services/GroupService.ts
export class GroupService {
  static async getGroups(params?: GroupSearchParams): Promise<Group[]> {
    const response = await churchtoolsClient.get('/groups', params);
    return this.transformGroups(response.data || response);
  }
  
  static async getGroup(id: number): Promise<Group | null> {
    const response = await churchtoolsClient.get(`/groups/${id}`);
    return this.transformGroup(response.data || response);
  }
  
  static async getGroupMembers(groupId: number): Promise<Person[]> {
    const group = await this.getGroup(groupId);
    return group?.members || [];
  }
  
  static async addMemberToGroup(
    groupId: number, 
    personId: number, 
    roleId?: number
  ): Promise<void> {
    await churchtoolsClient.post(`/groups/${groupId}/members`, {
      personId,
      roleId
    });
  }
  
  static async removeMemberFromGroup(
    groupId: number, 
    personId: number
  ): Promise<void> {
    await churchtoolsClient.delete(`/groups/${groupId}/members/${personId}`);
  }
  
  private static transformGroups(data: any): Group[] {
    const groups = data.data || data;
    return Array.isArray(groups) ? groups.map(this.transformGroup) : [];
  }
  
  private static transformGroup(data: any): Group {
    return {
      id: data.id,
      name: data.name,
      groupTypeId: data.groupTypeId,
      campusId: data.campusId,
      members: data.members || []
    };
  }
}
```

### Action-Implementierung

```typescript
// actions/churchtools/person/AddToGroupAction.ts
export const AddToGroupAction: ActionPlugin = {
  id: 'ct-add-to-group',
  name: 'Person zu Gruppe hinzufügen',
  // ... config ...
};

// AddToGroupExecute.vue
const execute = async () => {
  const personId = resolvePersonId();
  const groupId = resolveGroupId();
  
  // Nutzt Service-Layer
  await GroupService.addMemberToGroup(
    groupId,
    personId,
    props.config.roleId
  );
};
```

### Vorteile

✅ **Wiederverwendbar**: Services in Actions UND anderen Komponenten  
✅ **Typsicher**: Vollständige TypeScript-Typen  
✅ **Testbar**: Services isoliert testbar  
✅ **Konsistent**: Einheitliche Datenformatierung  
✅ **Wartbar**: API-Änderungen nur in Services  

### Nachteile

❌ **Mehr Code**: Service-Layer + Actions  
❌ **Initialer Aufwand**: Alle Services müssen erstellt werden  

### Wann verwenden?

- Bei großen Projekten mit vielen API-Calls
- Wenn Services auch außerhalb von Actions genutzt werden
- Wenn Typsicherheit und Testbarkeit wichtig sind

## Vergleich der Ansätze

| Kriterium | Spezialisiert | Generisch | Hybrid | Service-basiert |
|-----------|---------------|-----------|--------|-----------------|
| **Benutzerfreundlichkeit** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Flexibilität** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Wartbarkeit** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Initialer Aufwand** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Typsicherheit** | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Testbarkeit** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Wiederverwendbarkeit** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## Empfehlung

### Für dieses Projekt: **Hybrid-Ansatz mit Service-Layer**

**Begründung:**
1. **Service-Layer** bereits begonnen (PersonService vorhanden)
2. **Hybrid-Ansatz** bietet beste Balance
3. **Erweiterbar** für zukünftige Anforderungen

### Implementierungsplan

#### Phase 1: Service-Layer erweitern
- [ ] `GroupService` implementieren
- [ ] `EventService` implementieren
- [ ] `ServicePlanService` implementieren (optional)
- [ ] `ResourceService` implementieren (optional)

#### Phase 2: Generische Action
- [ ] `ChurchToolsApiAction` implementieren
- [ ] Config-Komponente mit Endpoint-Auswahl
- [ ] Execute-Komponente mit Error Handling
- [ ] Response-Mapping implementieren

#### Phase 3: Spezialisierte Actions (nach Bedarf)
- [ ] `CreatePersonAction`
- [ ] `AddToGroupAction`
- [ ] `CreateEventAction`
- [ ] Weitere nach Nutzungsstatistik

#### Phase 4: ActionHelpers erweitern
- [ ] ChurchToolsClient-Interface vollständig implementieren
- [ ] Alle Services in Helpers integrieren
- [ ] Error Handling verbessern
- [ ] Retry-Logik hinzufügen

## Technische Details

### ChurchTools API Endpoints

| Kategorie | Endpoint | Methode | Beschreibung |
|-----------|----------|---------|--------------|
| **Personen** | `/persons` | GET | Personen suchen |
| | `/persons/{id}` | GET | Person abrufen |
| | `/persons` | POST | Person erstellen |
| | `/persons/{id}` | PUT | Person aktualisieren |
| **Gruppen** | `/groups` | GET | Gruppen abrufen |
| | `/groups/{id}` | GET | Gruppe mit Mitgliedern |
| | `/groups/{id}/members` | POST | Mitglied hinzufügen |
| | `/groups/{id}/members/{personId}` | DELETE | Mitglied entfernen |
| **Events** | `/events` | GET | Events abrufen |
| | `/events/{id}` | GET | Event abrufen |
| | `/events` | POST | Event erstellen |
| | `/events/{id}` | PUT | Event aktualisieren |
| **Custom Modules** | `/custommodules` | GET | Module abrufen |
| | `/custommodules/{id}/customdatacategories` | GET | Kategorien abrufen |
| **Permissions** | `/permissions/global` | GET | Globale Berechtigungen |
| **Auth** | `/whoami` | GET | Aktueller User |

### Wichtige Hinweise

⚠️ **churchtoolsClient fügt automatisch `/api` Prefix hinzu!**

```typescript
// ✅ Richtig
await churchtoolsClient.get('/persons');  // → GET /api/persons

// ❌ Falsch
await churchtoolsClient.get('/api/persons');  // → GET /api/api/persons
```

### Variable Interpolation

Actions sollten Variable Interpolation unterstützen:

```typescript
// Config
{
  endpoint: '/persons/{{personId}}',
  body: {
    firstName: '{{firstName}}',
    lastName: '{{lastName}}'
  }
}

// Wird zu
{
  endpoint: '/persons/123',
  body: {
    firstName: 'Max',
    lastName: 'Mustermann'
  }
}
```

### Error Handling

```typescript
interface ErrorHandlingConfig {
  strategy: 'throw' | 'continue' | 'retry';
  retryCount?: number;
  retryDelay?: number;
  fallbackValue?: any;
}
```

## Beispiel-Workflows

### Workflow 1: Neue Person anlegen und zu Gruppe hinzufügen

```
1. [Input] Person-Daten erfassen
   → firstName, lastName, email

2. [Action: CreatePersonAction] Person erstellen
   → personId

3. [Action: AddToGroupAction] Zu Gruppe hinzufügen
   Input: personId (aus Schritt 2), groupId: 42

4. [Action: EmailAction] Willkommens-E-Mail senden
   Input: email (aus Schritt 1)
```

### Workflow 2: Event erstellen mit Teilnehmern

```
1. [Input] Event-Daten erfassen
   → title, date, location

2. [Action: CreateEventAction] Event erstellen
   → eventId

3. [Action: SearchPersonsAction] Teilnehmer suchen
   → personIds[]

4. [Action: ChurchToolsApiAction] Teilnehmer hinzufügen
   Endpoint: /events/{{eventId}}/participants
   Method: POST
   Body: { personIds: {{personIds}} }
```

## Nächste Schritte

1. **Entscheidung treffen**: Welcher Ansatz soll implementiert werden?
2. **Service-Layer erweitern**: GroupService, EventService erstellen
3. **Generische Action**: ChurchToolsApiAction als Basis
4. **Spezialisierte Actions**: Nach Bedarf hinzufügen
5. **Dokumentation**: API-Mapping und Beispiele
6. **Tests**: Unit-Tests für Services und Actions

## Fragen zur Klärung

1. Welche ChurchTools-Operationen werden am häufigsten benötigt?
2. Sind die Benutzer technisch versiert (generische Action) oder brauchen sie einfache UIs?
3. Gibt es spezielle Anforderungen an Error Handling oder Retry-Logik?
4. Sollen Actions auch außerhalb von Workflows nutzbar sein?
5. Wie wichtig ist Typsicherheit vs. Flexibilität?
