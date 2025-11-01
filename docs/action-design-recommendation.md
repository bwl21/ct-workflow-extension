# Empfehlung: Action-Design für ChurchTools Workflows

## TL;DR - Kurze Antwort

**❌ NICHT empfohlen:** Multi-API Action (mehrere API-Calls in einer Action)

**✅ EMPFOHLEN:** Single-API Actions (ein API-Call pro Action/Node)

**Begründung:** Workflow-Transparenz, besseres Debugging, flexiblere Fehlerbehandlung

## Die Frage

> "Könnte man eine ChurchTools Action bauen, die mehrere ChurchTools APIs ausführen kann, ähnlich wie es mehrere Felder gibt? Oder schlägst du vor, pro ChurchTools Aufruf eine eigene Action zu machen?"

## Die Antwort

### Für jeden API-Call eine eigene Action! 🎯

**Warum?** Weil dein Projekt ein **visuelles Workflow-System** ist, bei dem:
- Jeder Node im Diagramm sichtbar ist
- Der Ablauf transparent sein soll
- Fehlerbehandlung granular erfolgen muss
- Debugging einfach sein soll

## Visueller Vergleich

### ❌ Multi-API Action (NICHT empfohlen)

```
┌─────────────────────────────────────────┐
│ Input: Person-Daten                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Multi-API Action                        │
│ ┌─────────────────────────────────────┐ │
│ │ ??? Was passiert hier ???           │ │  ← BLACK BOX!
│ │ 1. Person erstellen?                │ │
│ │ 2. Zu Gruppe hinzufügen?            │ │
│ │ 3. Event-Teilnehmer?                │ │
│ └─────────────────────────────────────┘ │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Email: Willkommens-Mail                 │
└─────────────────────────────────────────┘
```

**Problem:** Benutzer sieht nicht, was in der Multi-API Action passiert!

### ✅ Single-API Actions (EMPFOHLEN)

```
┌─────────────────────────────────────────┐
│ Input: Person-Daten                     │
│ → firstName, lastName, email            │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ ChurchTools API: Person erstellen       │  ← KLAR!
│ POST /persons                           │
│ → personId                              │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ ChurchTools API: Zu Gruppe hinzufügen   │  ← KLAR!
│ POST /groups/42/members                 │
│ Input: personId                         │
│ → membershipId                          │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ ChurchTools API: Event-Teilnehmer       │  ← KLAR!
│ POST /events/123/participants           │
│ Input: personId                         │
│ → participantId                         │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Email: Willkommens-Mail                 │
│ Input: email, firstName                 │
└─────────────────────────────────────────┘
```

**Vorteil:** Gesamter Ablauf auf einen Blick sichtbar!

## Hauptargumente

### 1. Workflow-Transparenz ⭐⭐⭐⭐⭐

**Single-API:**
```
Benutzer sieht im Diagramm:
"Ah, zuerst wird die Person erstellt,
dann zur Gruppe hinzugefügt,
dann als Event-Teilnehmer registriert."
```

**Multi-API:**
```
Benutzer sieht im Diagramm:
"Hier passiert irgendwas mit APIs...
was genau? Muss ich in die Config schauen."
```

### 2. Fehlerbehandlung ⭐⭐⭐⭐⭐

**Single-API:**
```
┌─────────────────────────────────────────┐
│ Person erstellen                        │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Decision: Erfolgreich?                  │
└────┬────────────────────────────────┬───┘
     │ Ja                             │ Nein
     ▼                                ▼
┌─────────────────────┐    ┌──────────────────────┐
│ Zu Gruppe hinzufügen│    │ Email: Admin         │
│                     │    │ benachrichtigen      │
└─────────────────────┘    └──────────────────────┘
```

**Vorteil:** Fehler können pro API-Call behandelt werden!

**Multi-API:**
```
┌─────────────────────────────────────────┐
│ Multi-API Action                        │
│ Call 2 von 5 fehlgeschlagen...          │
│ Was jetzt? Rollback? Fortfahren?        │
└─────────────────────────────────────────┘
```

**Problem:** Komplexe Fehlerbehandlung in der Action selbst!

### 3. Debugging ⭐⭐⭐⭐⭐

**Single-API - Execution History:**
```
✅ Input: Person-Daten erfassen
   firstName: "Max", lastName: "Mustermann"

✅ ChurchTools API: Person erstellen
   Request: POST /persons { firstName: "Max", ... }
   Response: { id: 123 }
   Output: personId = 123

✅ ChurchTools API: Zu Gruppe hinzufügen
   Request: POST /groups/42/members { personId: 123 }
   Response: { id: 456 }
   Output: membershipId = 456

❌ ChurchTools API: Event-Teilnehmer
   Request: POST /events/123/participants { personId: 123 }
   Error: Event nicht gefunden (404)
   
   ← HIER ist der Fehler!
```

**Multi-API - Execution History:**
```
✅ Input: Person-Daten erfassen
   firstName: "Max", lastName: "Mustermann"

❌ Multi-API Action
   Error: Einer der API-Calls fehlgeschlagen
   
   ← Welcher? Warum? Keine Details!
```

### 4. Flexibilität ⭐⭐⭐⭐⭐

**Single-API:**
```
┌─────────────────────┐
│ Person erstellen    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Task: Admin-Freigabe│  ← Zwischenschritt möglich!
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Zu Gruppe hinzufügen│
└─────────────────────┘
```

**Multi-API:**
```
┌─────────────────────────────────────────┐
│ Multi-API Action                        │
│ 1. Person erstellen                     │
│ ??? Zwischenschritt ???                 │  ← NICHT möglich!
│ 2. Zu Gruppe hinzufügen                 │
└─────────────────────────────────────────┘
```

## Praktisches Beispiel

### Szenario: Neue Person onboarding

**Anforderung:**
1. Person-Daten erfassen
2. Person in ChurchTools erstellen
3. Zu Gruppe "Neue Mitglieder" hinzufügen
4. Als Teilnehmer für "Willkommens-Event" registrieren
5. Willkommens-E-Mail senden

### Mit Single-API Actions (Empfohlen)

```typescript
// Workflow-Definition
{
  nodes: [
    {
      id: 'input-1',
      type: 'input',
      config: {
        fields: [
          { name: 'firstName', type: 'text', required: true },
          { name: 'lastName', type: 'text', required: true },
          { name: 'email', type: 'email', required: true }
        ]
      }
    },
    {
      id: 'api-1',
      type: 'action',
      actionId: 'ct-api-call',
      config: {
        method: 'POST',
        endpoint: '/persons',
        body: {
          firstName: '{{firstName}}',
          lastName: '{{lastName}}',
          email: '{{email}}'
        },
        outputVariable: 'personId'
      }
    },
    {
      id: 'api-2',
      type: 'action',
      actionId: 'ct-api-call',
      config: {
        method: 'POST',
        endpoint: '/groups/42/members',
        body: {
          personId: '{{personId}}',
          roleId: 1
        },
        outputVariable: 'membershipId'
      }
    },
    {
      id: 'api-3',
      type: 'action',
      actionId: 'ct-api-call',
      config: {
        method: 'POST',
        endpoint: '/events/123/participants',
        body: {
          personId: '{{personId}}'
        },
        outputVariable: 'participantId'
      }
    },
    {
      id: 'email-1',
      type: 'action',
      actionId: 'email',
      config: {
        to: '{{email}}',
        subject: 'Willkommen!',
        body: 'Hallo {{firstName}}, ...'
      }
    }
  ],
  edges: [
    { from: 'input-1', to: 'api-1' },
    { from: 'api-1', to: 'api-2' },
    { from: 'api-2', to: 'api-3' },
    { from: 'api-3', to: 'email-1' }
  ]
}
```

**Vorteile:**
- ✅ Jeder Schritt im Diagramm sichtbar
- ✅ Fehler können pro Schritt behandelt werden
- ✅ Zwischenschritte einfügbar (z.B. Admin-Freigabe nach Person erstellen)
- ✅ Execution History zeigt jeden Schritt

### Mit Multi-API Action (NICHT empfohlen)

```typescript
// Workflow-Definition
{
  nodes: [
    {
      id: 'input-1',
      type: 'input',
      config: { /* ... */ }
    },
    {
      id: 'multi-api-1',
      type: 'action',
      actionId: 'ct-multi-api',
      config: {
        calls: [
          {
            method: 'POST',
            endpoint: '/persons',
            body: { /* ... */ },
            outputVariable: 'personId'
          },
          {
            method: 'POST',
            endpoint: '/groups/42/members',
            body: { personId: '{{personId}}' },
            outputVariable: 'membershipId'
          },
          {
            method: 'POST',
            endpoint: '/events/123/participants',
            body: { personId: '{{personId}}' },
            outputVariable: 'participantId'
          }
        ],
        errorHandling: 'abort'
      }
    },
    {
      id: 'email-1',
      type: 'action',
      actionId: 'email',
      config: { /* ... */ }
    }
  ],
  edges: [
    { from: 'input-1', to: 'multi-api-1' },
    { from: 'multi-api-1', to: 'email-1' }
  ]
}
```

**Nachteile:**
- ❌ API-Calls nicht im Diagramm sichtbar
- ❌ Fehlerbehandlung komplex (welcher Call ist fehlgeschlagen?)
- ❌ Keine Zwischenschritte möglich
- ❌ Execution History zeigt nur einen Eintrag

## Was sagen andere Workflow-Systeme?

### n8n
- ✅ Ein Node = Eine Operation
- ✅ Bietet "Batch"-Nodes für Arrays
- ❌ Keine Multi-API-Nodes

### Zapier
- ✅ Ein Step = Ein API-Call
- ✅ Bietet "Looping" für Batch
- ❌ Keine Multi-API-Steps

### Make.com
- ✅ Ein Module = Eine Operation
- ✅ Bietet "Iterators" für Arrays
- ❌ Keine Multi-API-Modules

### Airflow
- ✅ Ein Task = Eine Operation
- ✅ Bietet "Task Groups" für Gruppierung
- ❌ Tasks bleiben unabhängig

**Fazit:** Alle etablierten Workflow-Systeme verwenden einzelne Nodes!

## Ausnahmen: Wann Multi-API sinnvoll sein könnte

### 1. Batch-Operations auf gleichem Endpoint

**Szenario:** Mehrere Personen zu Gruppe hinzufügen

```typescript
// AddMultiplePersonsToGroupAction
{
  groupId: 42,
  personIds: [1, 2, 3, 4, 5],
  roleId: 7
}

// Führt intern aus:
// POST /groups/42/members { personId: 1 }
// POST /groups/42/members { personId: 2 }
// POST /groups/42/members { personId: 3 }
// ...
```

**Warum sinnvoll:**
- ✅ Gleicher Endpoint, nur verschiedene Parameter
- ✅ Fachlich zusammengehörig ("alle auf einmal")
- ✅ Benutzer will nicht 5 Nodes erstellen

**Implementierung:** Spezialisierte Batch-Action

### 2. Atomare Geschäftslogik (mit Vorsicht!)

**Szenario:** Person erstellen UND zu Gruppe hinzufügen (untrennbar)

```typescript
// CreatePersonAndAddToGroupAction
{
  firstName: 'Max',
  lastName: 'Mustermann',
  groupId: 42
}
```

**Warum sinnvoll:**
- ✅ Fachlich untrennbar
- ✅ Rollback bei Fehler wichtig

**ABER:** Besser als zwei separate Nodes mit Error-Handling!

## Konkrete Empfehlung für dein Projekt

### Phase 1: Basis (Jetzt)

**Implementiere:**
1. ✅ `ChurchToolsApiAction` (generisch, single-call)
   - Ein API-Call pro Action
   - Einfache Config
   - Klare Fehlerbehandlung

2. ✅ Spezialisierte Single-Call Actions (optional):
   - `CreatePersonAction`
   - `AddToGroupAction`
   - `CreateEventAction`

**NICHT implementieren:**
- ❌ Multi-API Action

### Phase 2: Batch-Actions (Bei Bedarf)

**Nur wenn wirklich benötigt:**
- `AddMultiplePersonsToGroupAction`
- `UpdateMultiplePersonsAction`

**Regel:** Nur für Batch-Operations auf **gleichem Endpoint**!

### Phase 3: Workflow-Features (Später)

**Bessere Alternativen zu Multi-API:**
1. **Workflow-Templates**
   - Vordefinierte Workflows für häufige Sequenzen
   - Können kopiert und angepasst werden

2. **Sub-Workflows**
   - Ein Node kann anderen Workflow aufrufen
   - Wiederverwendbar und modular

3. **Parallele Ausführung**
   - Engine-Feature für Performance
   - Unabhängige Nodes parallel ausführen

## Zusammenfassung

| Frage | Antwort |
|-------|---------|
| **Multi-API Action?** | ❌ NEIN |
| **Single-API Actions?** | ✅ JA |
| **Warum?** | Transparenz, Debugging, Flexibilität |
| **Ausnahmen?** | Nur Batch-Operations auf gleichem Endpoint |
| **Alternative?** | Workflow-Templates, Sub-Workflows |

## Nächste Schritte

1. ✅ Implementiere `ChurchToolsApiAction` (single-call)
2. ✅ Teste mit verschiedenen Endpoints
3. ✅ Erstelle Beispiel-Workflows
4. ⏸️ Warte auf Feedback von Benutzern
5. ⏸️ Implementiere Batch-Actions nur bei Bedarf

## Fragen?

**"Aber das Diagramm wird doch riesig bei vielen API-Calls?"**
- Ja, aber das ist gut! Es zeigt die Komplexität.
- Alternative: Workflow-Templates für häufige Sequenzen
- Zukünftig: Sub-Workflows für Modularität

**"Wie handle ich Rollback bei Fehlern?"**
- Explizit mit Decision-Nodes und Compensation-Actions
- Zukünftig: Compensation-Pattern in der Engine

**"Kann ich nicht einfach beide Ansätze anbieten?"**
- Nein, das verwirrt Benutzer
- Entscheide dich für einen Ansatz
- Single-API ist der richtige Weg

## Fazit

**Für jeden ChurchTools API-Call eine eigene Action!**

Das ist der richtige Ansatz für ein transparentes, wartbares und benutzerfreundliches Workflow-System.
