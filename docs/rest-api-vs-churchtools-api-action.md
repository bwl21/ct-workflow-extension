# Vergleich: RestApiAction vs. ChurchToolsApiAction

## Übersicht

Beide Actions führen HTTP-Requests aus, haben aber unterschiedliche Zielgruppen und Anwendungsfälle.

## Hauptunterschiede

| Aspekt | RestApiAction | ChurchToolsApiAction |
|--------|---------------|----------------------|
| **Ziel** | Externe APIs | ChurchTools API |
| **URL** | Vollständige URL erforderlich | Nur Endpoint (ohne Domain/`/api`) |
| **Authentifizierung** | Manuell (Headers) | Automatisch (Session) |
| **Base URL** | Keine | Automatisch ChurchTools-Domain |
| **API Prefix** | Keine | Automatisch `/api` |
| **Kategorie** | INTEGRATION | CHURCHTOOLS |
| **Icon** | 🌐 globe | ⛪ church |
| **Typische Nutzung** | Webhooks, externe Services | ChurchTools-Daten verwalten |

## Detaillierter Vergleich

### 1. URL-Handling

#### RestApiAction
```typescript
// Config
{
  method: 'GET',
  url: 'https://api.example.com/users/123',
  headers: {
    'Authorization': 'Bearer {{apiToken}}'
  }
}

// Request
GET https://api.example.com/users/123
Authorization: Bearer abc123...
```

**Eigenschaften:**
- ✅ Vollständige URL-Kontrolle
- ✅ Beliebige Domains
- ✅ Eigene Protokolle (http/https)
- ❌ Benutzer muss vollständige URL kennen

#### ChurchToolsApiAction
```typescript
// Config
{
  method: 'GET',
  endpoint: '/persons/123',
  params: {}
}

// Request (automatisch)
GET https://ihre-gemeinde.church.tools/api/persons/123
Cookie: ChurchTools_Session=...
```

**Eigenschaften:**
- ✅ Einfacher: Nur Endpoint angeben
- ✅ Automatische Base-URL (aktuelle ChurchTools-Instanz)
- ✅ Automatisches `/api` Prefix
- ✅ Automatische Authentifizierung (Session)
- ❌ Nur für ChurchTools API

### 2. Authentifizierung

#### RestApiAction
```typescript
// Manuelle Authentifizierung erforderlich
{
  headers: {
    'Authorization': 'Bearer {{apiToken}}',
    'X-API-Key': '{{apiKey}}'
  }
}
```

**Eigenschaften:**
- ✅ Flexibel: Alle Auth-Methoden möglich
- ✅ API-Keys, Bearer Tokens, Basic Auth
- ❌ Benutzer muss Auth-Details kennen
- ❌ Credentials müssen verwaltet werden

#### ChurchToolsApiAction
```typescript
// Keine Auth-Konfiguration nötig
{
  endpoint: '/persons',
  // Session wird automatisch verwendet
}
```

**Eigenschaften:**
- ✅ Automatisch: Nutzt aktuelle ChurchTools-Session
- ✅ Keine Credentials nötig
- ✅ Sicher: Keine API-Keys im Workflow
- ❌ Nur für eingeloggte Benutzer

### 3. Benutzerfreundlichkeit

#### RestApiAction - Config UI
```
┌─────────────────────────────────────┐
│ HTTP-Methode: [GET ▼]               │
│                                     │
│ URL: [https://api.example.com/...] │
│                                     │
│ Headers:                            │
│ ┌─────────────┬─────────────┬───┐  │
│ │Authorization│Bearer {{...}}│ ✕ │  │
│ └─────────────┴─────────────┴───┘  │
│ [+ Header hinzufügen]               │
│                                     │
│ Request Body (JSON):                │
│ ┌─────────────────────────────────┐ │
│ │ { "key": "value" }              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Timeout: [30000] ms                 │
└─────────────────────────────────────┘
```

**Komplexität:** Mittel bis Hoch
- Benutzer muss vollständige URL kennen
- Auth-Header manuell konfigurieren
- Mehr Felder zum Ausfüllen

#### ChurchToolsApiAction - Config UI
```
┌─────────────────────────────────────┐
│ HTTP-Methode: [GET ▼]               │
│                                     │
│ Endpoint: [/persons ▼]              │
│ ┌─────────────────────────────────┐ │
│ │ Häufige Endpoints:              │ │
│ │ • /persons                      │ │
│ │ • /groups                       │ │
│ │ • /events                       │ │
│ │ • /custommodules                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Query-Parameter:                    │
│ ┌─────────┬─────────┬───┐          │
│ │ limit   │ 10      │ ✕ │          │
│ └─────────┴─────────┴───┘          │
│ [+ Parameter hinzufügen]            │
│                                     │
│ Request Body (JSON):                │
│ ┌─────────────────────────────────┐ │
│ │ { "firstName": "Max" }          │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Komplexität:** Niedrig bis Mittel
- Nur Endpoint angeben (mit Autocomplete)
- Keine Auth-Konfiguration
- Weniger Felder

### 4. Anwendungsfälle

#### RestApiAction - Typische Use Cases

**1. Webhook an externen Service**
```typescript
{
  method: 'POST',
  url: 'https://hooks.slack.com/services/...',
  body: {
    text: 'Neue Person erstellt: {{personName}}'
  }
}
```

**2. Daten von externer API abrufen**
```typescript
{
  method: 'GET',
  url: 'https://api.weather.com/forecast',
  headers: {
    'X-API-Key': '{{weatherApiKey}}'
  }
}
```

**3. Integration mit Drittanbieter**
```typescript
{
  method: 'POST',
  url: 'https://api.mailchimp.com/3.0/lists/{{listId}}/members',
  headers: {
    'Authorization': 'Bearer {{mailchimpToken}}'
  },
  body: {
    email_address: '{{email}}',
    status: 'subscribed'
  }
}
```

#### ChurchToolsApiAction - Typische Use Cases

**1. Person erstellen**
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

**2. Person zu Gruppe hinzufügen**
```typescript
{
  method: 'POST',
  endpoint: '/groups/{{groupId}}/members',
  body: {
    personId: '{{personId}}',
    roleId: 1
  }
}
```

**3. Event erstellen**
```typescript
{
  method: 'POST',
  endpoint: '/events',
  body: {
    name: '{{eventName}}',
    startDate: '{{startDate}}',
    eventTypeId: 5
  }
}
```

**4. Personen suchen**
```typescript
{
  method: 'GET',
  endpoint: '/persons',
  params: {
    query: '{{searchQuery}}',
    limit: 10
  }
}
```

### 5. Fehlerbehandlung

#### RestApiAction
```typescript
// Fehler bei externer API
try {
  await fetch('https://api.example.com/...');
} catch (error) {
  // Netzwerkfehler, Timeout, etc.
  // Keine spezielle ChurchTools-Fehlerbehandlung
}
```

**Fehlertypen:**
- Netzwerkfehler (DNS, Timeout)
- HTTP-Fehler (404, 500, etc.)
- Auth-Fehler (401, 403)
- CORS-Fehler (bei Browser-Requests)

#### ChurchToolsApiAction
```typescript
// Fehler bei ChurchTools API
try {
  await churchtoolsClient.get('/persons');
} catch (error) {
  // ChurchTools-spezifische Fehler
  // Bessere Fehlermeldungen möglich
}
```

**Fehlertypen:**
- ChurchTools API-Fehler (strukturiert)
- Permissions-Fehler (403)
- Validierungsfehler (400)
- Session-Fehler (401)

**Vorteil:** Bessere Fehlermeldungen möglich, da ChurchTools-API-Struktur bekannt ist.

### 6. Response-Handling

#### RestApiAction
```typescript
// Response von externer API
{
  data: {
    user: {
      id: 123,
      name: "Max Mustermann"
    }
  }
}

// Response-Mapping
{
  'data.user.id': 'externalUserId',
  'data.user.name': 'externalUserName'
}
```

**Eigenschaften:**
- Beliebige Response-Struktur
- Generisches Response-Mapping
- Keine Typisierung

#### ChurchToolsApiAction
```typescript
// Response von ChurchTools API (bekannte Struktur)
{
  data: {
    id: 123,
    firstName: "Max",
    lastName: "Mustermann"
  }
}

// Response-Mapping (mit Typisierung möglich)
{
  'data.id': 'personId',
  'data.firstName': 'firstName',
  'data.lastName': 'lastName'
}
```

**Eigenschaften:**
- Bekannte ChurchTools-Response-Struktur
- Typisiertes Response-Mapping möglich
- Autocomplete für Response-Felder möglich

### 7. Validierung

#### RestApiAction
```typescript
validate: (config) => {
  const errors = [];
  
  // URL-Validierung
  if (!config.url) {
    errors.push({ field: 'url', message: 'URL erforderlich' });
  }
  
  try {
    new URL(config.url);
  } catch {
    errors.push({ field: 'url', message: 'Ungültige URL' });
  }
  
  return { valid: errors.length === 0, errors };
}
```

**Validierung:**
- Vollständige URL-Validierung
- Protokoll-Prüfung (http/https)
- Domain-Validierung

#### ChurchToolsApiAction
```typescript
validate: (config) => {
  const errors = [];
  
  // Endpoint-Validierung
  if (!config.endpoint) {
    errors.push({ field: 'endpoint', message: 'Endpoint erforderlich' });
  }
  
  // Prüfe ob Endpoint mit / beginnt
  if (!config.endpoint.startsWith('/')) {
    errors.push({ field: 'endpoint', message: 'Endpoint muss mit / beginnen' });
  }
  
  // Prüfe ob /api im Endpoint (Fehler!)
  if (config.endpoint.includes('/api')) {
    errors.push({ 
      field: 'endpoint', 
      message: '/api wird automatisch hinzugefügt - bitte entfernen' 
    });
  }
  
  return { valid: errors.length === 0, errors };
}
```

**Validierung:**
- Endpoint-Format-Prüfung
- Warnung bei `/api` im Endpoint
- Optional: Prüfung gegen bekannte Endpoints

## Wann welche Action verwenden?

### Verwende RestApiAction für:

✅ **Externe Services**
- Slack, Discord, Microsoft Teams
- Mailchimp, SendGrid
- Zapier, Make (Integromat)
- Webhooks

✅ **Drittanbieter-APIs**
- Wetter-APIs
- Zahlungsanbieter
- CRM-Systeme
- Andere Datenbanken

✅ **Custom APIs**
- Eigene Backend-Services
- Microservices
- Legacy-Systeme

### Verwende ChurchToolsApiAction für:

✅ **ChurchTools-Daten verwalten**
- Personen erstellen/aktualisieren
- Gruppen verwalten
- Events erstellen
- Dienste zuweisen

✅ **ChurchTools-Daten abrufen**
- Personen suchen
- Gruppenmitglieder abrufen
- Events abfragen
- Custom Module Daten

✅ **ChurchTools-Workflows**
- Automatisierung innerhalb ChurchTools
- Daten-Synchronisation
- Batch-Operationen

## Beispiel-Szenarien

### Szenario 1: Person erstellen und zu Slack posten

```
1. [Input] Person-Daten erfassen
   → firstName, lastName, email

2. [ChurchToolsApiAction] Person in ChurchTools erstellen
   Endpoint: /persons
   Method: POST
   Body: { firstName, lastName, email }
   → personId

3. [RestApiAction] Slack-Benachrichtigung
   URL: https://hooks.slack.com/services/...
   Method: POST
   Body: { text: "Neue Person: {{firstName}} {{lastName}}" }
```

### Szenario 2: Externe Daten importieren

```
1. [RestApiAction] Daten von externer API abrufen
   URL: https://api.example.com/users
   Method: GET
   → externalUsers[]

2. [Loop] Für jeden User:
   
   3. [ChurchToolsApiAction] Person in ChurchTools erstellen
      Endpoint: /persons
      Method: POST
      Body: { firstName: {{user.firstName}}, ... }
```

### Szenario 3: Event erstellen und E-Mail versenden

```
1. [Input] Event-Daten erfassen
   → eventName, eventDate

2. [ChurchToolsApiAction] Event erstellen
   Endpoint: /events
   Method: POST
   Body: { name: {{eventName}}, startDate: {{eventDate}} }
   → eventId

3. [ChurchToolsApiAction] Gruppenmitglieder abrufen
   Endpoint: /groups/{{groupId}}/members
   Method: GET
   → members[]

4. [EmailAction] E-Mail an alle Mitglieder
   To: {{members[].email}}
   Subject: Neues Event: {{eventName}}
```

## Implementierungs-Empfehlung

### Option 1: Beide Actions beibehalten (Empfohlen)

**Vorteile:**
- ✅ Klare Trennung: Intern vs. Extern
- ✅ Optimierte UX für jeden Use Case
- ✅ Bessere Fehlermeldungen
- ✅ Einfachere Validierung

**Struktur:**
```
src/actions/
├── rest-api/              ← Für externe APIs
│   ├── RestApiAction.ts
│   ├── RestApiConfig.vue
│   └── RestApiExecute.vue
│
└── churchtools/
    └── generic/           ← Für ChurchTools API
        ├── ChurchToolsApiAction.ts
        ├── ChurchToolsApiConfig.vue
        └── ChurchToolsApiExecute.vue
```

### Option 2: RestApiAction erweitern

**Idee:** RestApiAction mit "ChurchTools-Modus"

```typescript
{
  mode: 'external' | 'churchtools',
  
  // External Mode
  url: 'https://api.example.com/...',
  headers: { ... },
  
  // ChurchTools Mode
  endpoint: '/persons',
  // headers und base URL automatisch
}
```

**Nachteile:**
- ❌ Komplexere Config-UI
- ❌ Mehr Logik in einer Action
- ❌ Weniger klare Trennung

**Nicht empfohlen!**

## Zusammenfassung

| Kriterium | RestApiAction | ChurchToolsApiAction |
|-----------|:-------------:|:--------------------:|
| **Externe APIs** | ⭐⭐⭐⭐⭐ | ❌ |
| **ChurchTools API** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Benutzerfreundlichkeit** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Flexibilität** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Sicherheit** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Fehlerbehandlung** | ⭐⭐⭐ | ⭐⭐⭐⭐ |

**Fazit:** Beide Actions haben ihre Berechtigung und sollten parallel existieren. Sie ergänzen sich perfekt für unterschiedliche Anwendungsfälle.
