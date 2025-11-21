# Konzept: Multi-API Action vs. Single-API Actions

## Fragestellung

Soll eine ChurchTools Action mehrere API-Calls ausführen können (ähnlich wie mehrere Felder), oder soll für jeden API-Call eine eigene Action im Workflow erstellt werden?

## Ansatz 1: Multi-API Action

### Konzept

Eine Action, die mehrere ChurchTools API-Calls in einer Konfiguration ausführen kann.

### UI-Mockup

```
┌─────────────────────────────────────────────────────────┐
│ ChurchTools Multi-API Action                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ API-Calls:                                              │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Call 1:                                             │ │
│ │ Methode: [POST ▼]  Endpoint: [/persons          ]  │ │
│ │ Body: { "firstName": "{{firstName}}", ... }         │ │
│ │ Output Variable: personId                           │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Call 2:                                             │ │
│ │ Methode: [POST ▼]  Endpoint: [/groups/{{groupId}}/members] │
│ │ Body: { "personId": "{{personId}}", ... }           │ │
│ │ Output Variable: membershipId                       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [+ API-Call hinzufügen]                                 │
│                                                         │
│ Fehlerbehandlung:                                       │
│ ○ Bei Fehler abbrechen                                  │
│ ○ Bei Fehler fortfahren                                 │
│ ○ Rollback bei Fehler (experimentell)                   │
│                                                         │
│ Ausführung:                                             │
│ ○ Sequenziell (nacheinander)                            │
│ ○ Parallel (gleichzeitig, wo möglich)                   │
└─────────────────────────────────────────────────────────┘
```

### Code-Beispiel

```typescript
// actions/churchtools/multi/MultiApiAction.ts
export const MultiApiAction: ActionPlugin = {
  id: 'ct-multi-api',
  name: 'ChurchTools Multi-API',
  description: 'Führt mehrere ChurchTools API-Calls aus',
  icon: 'layers',
  category: ActionCategory.CHURCHTOOLS,
  
  defaultConfig: {
    calls: [
      {
        method: 'GET',
        endpoint: '/persons',
        params: {},
        body: null,
        outputVariable: 'result1'
      }
    ],
    errorHandling: 'abort', // 'abort' | 'continue' | 'rollback'
    execution: 'sequential' // 'sequential' | 'parallel'
  }
};
```

### Vorteile

✅ **Kompakter Workflow**
- Weniger Nodes im Workflow-Diagramm
- Übersichtlicher bei vielen API-Calls

✅ **Atomarität (theoretisch)**
- Alle Calls könnten als Einheit behandelt werden
- Rollback bei Fehler möglich (mit Aufwand)

✅ **Performance (bei Parallel-Modus)**
- Unabhängige Calls können parallel ausgeführt werden
- Schnellere Gesamtausführung

### Nachteile

❌ **Black Box**
- API-Calls nicht im Workflow-Diagramm sichtbar
- Ablauf versteckt in der Action-Konfiguration
- Schwer zu verstehen für andere Benutzer

❌ **Komplexe Fehlerbehandlung**
- Welcher Call ist fehlgeschlagen?
- Wie mit Partial Success umgehen?
- Rollback schwer zu implementieren

❌ **Schlechtes Debugging**
- Nur ein History-Eintrag für alle Calls
- Keine Zwischenergebnisse sichtbar
- Fehlerquelle schwer zu identifizieren

❌ **Weniger flexibel**
- Keine Zwischenschritte zwischen Calls möglich
- Keine bedingten Verzweigungen zwischen Calls
- Keine anderen Actions zwischen Calls

❌ **Weniger wiederverwendbar**
- Kombination von Calls oft use-case-spezifisch
- Andere Workflows brauchen andere Kombinationen
- Schwer zu parametrisieren

❌ **Komplexe Konfiguration**
- Viele Optionen nötig
- Unübersichtliche Config-UI
- Steile Lernkurve

### Beispiel-Workflow

```
┌─────────────────────────────────────────┐
│ Start                                   │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Input: Person-Daten erfassen            │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Multi-API Action                        │
│ ┌─────────────────────────────────────┐ │
│ │ 1. POST /persons                    │ │
│ │ 2. POST /groups/42/members          │ │
│ │ 3. POST /events/123/participants    │ │
│ └─────────────────────────────────────┘ │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Email: Willkommens-Mail                 │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ End                                     │
└─────────────────────────────────────────┘
```

**Problem:** Was passiert in der Multi-API Action? Nicht sichtbar!

## Ansatz 2: Single-API Actions (Empfohlen)

### Konzept

Jeder API-Call ist eine eigene Action (Node) im Workflow.

### Beispiel-Workflow

```
┌─────────────────────────────────────────┐
│ Start                                   │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Input: Person-Daten erfassen            │
│ → firstName, lastName, email            │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ ChurchTools API: Person erstellen       │
│ POST /persons                           │
│ → personId                              │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ ChurchTools API: Zu Gruppe hinzufügen   │
│ POST /groups/42/members                 │
│ Input: personId                         │
│ → membershipId                          │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ ChurchTools API: Als Teilnehmer         │
│ POST /events/123/participants           │
│ Input: personId                         │
│ → participantId                         │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Email: Willkommens-Mail                 │
│ Input: email, firstName                 │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ End                                     │
└─────────────────────────────────────────┘
```

**Vorteil:** Gesamter Ablauf auf einen Blick sichtbar!

### Vorteile

✅ **Workflow-Transparenz**
- Jeder API-Call ist im Diagramm sichtbar
- Ablauf klar erkennbar
- Leicht zu verstehen

✅ **Granulare Fehlerbehandlung**
- Fehler können pro API-Call behandelt werden
- Decision-Nodes nach jedem Call möglich
- Retry einzeln konfigurierbar

✅ **Besseres Debugging**
- Jeder Node in Execution History
- Zwischenergebnisse sichtbar
- Klare Fehlerquelle

✅ **Maximale Flexibilität**
- Zwischenschritte zwischen Calls möglich
- Bedingte Verzweigungen
- Andere Actions einfügbar

✅ **Wiederverwendbar**
- Jede Action in verschiedenen Workflows nutzbar
- Modular und kombinierbar
- Einfach zu testen

✅ **Einfache Konfiguration**
- Jede Action hat klare, fokussierte Config
- Übersichtliche UI
- Flache Lernkurve

### Nachteile

❌ **Mehr Nodes**
- Workflow-Diagramm wird größer
- Mehr Verbindungen zu zeichnen
- Kann unübersichtlich werden bei vielen Calls

⚠️ **Keine Atomarität**
- Jeder Call ist separate Operation
- Kein automatisches Rollback
- Fehlerbehandlung muss explizit modelliert werden

### Mit Fehlerbehandlung

```
┌─────────────────────────────────────────┐
│ ChurchTools API: Person erstellen       │
│ POST /persons                           │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Decision: Erfolgreich?                  │
└────┬────────────────────────────────┬───┘
     │ Ja                             │ Nein
     ▼                                ▼
┌─────────────────────┐    ┌──────────────────────┐
│ Zu Gruppe hinzufügen│    │ Email: Fehler-       │
│                     │    │ Benachrichtigung     │
└─────────────────────┘    └──────────────────────┘
```

## Vergleich

| Kriterium | Multi-API | Single-API |
|-----------|:---------:|:----------:|
| **Workflow-Transparenz** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Fehlerbehandlung** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Debugging** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Flexibilität** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Wiederverwendbarkeit** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Kompaktheit** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Atomarität** | ⭐⭐⭐ | ⭐ |
| **Konfiguration** | ⭐⭐ | ⭐⭐⭐⭐ |
| **Lernkurve** | ⭐⭐ | ⭐⭐⭐⭐⭐ |

## Vergleich mit anderen Workflow-Systemen

### n8n
- ✅ Verwendet **einzelne Nodes** pro Operation
- ✅ Bietet **Batch-Nodes** für Arrays (z.B. "Für jedes Element")
- ❌ Keine Multi-API-Nodes

### Zapier
- ✅ Verwendet **einzelne Steps** pro API-Call
- ✅ Bietet **Looping** für Batch-Operations
- ❌ Keine Multi-API-Steps

### Make.com (Integromat)
- ✅ Verwendet **einzelne Module** pro Operation
- ✅ Bietet **Iterators** für Arrays
- ❌ Keine Multi-API-Module

### Airflow
- ✅ Verwendet **Tasks** (einzelne Operationen)
- ✅ Bietet **Task Groups** für visuelle Gruppierung
- ❌ Tasks bleiben unabhängig, keine Multi-Task-Nodes

**Fazit:** Alle etablierten Workflow-Systeme verwenden einzelne Nodes/Steps/Tasks!

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
// POST /groups/42/members { personId: 1, roleId: 7 }
// POST /groups/42/members { personId: 2, roleId: 7 }
// POST /groups/42/members { personId: 3, roleId: 7 }
// ...
```

**Warum sinnvoll:**
- ✅ Gleicher Endpoint, nur verschiedene Parameter
- ✅ Fachlich zusammengehörig
- ✅ Benutzer will "alle auf einmal" hinzufügen

**Implementierung:** Spezialisierte Batch-Action

### 2. Atomare Geschäftslogik

**Szenario:** Person erstellen UND zu Gruppe hinzufügen (untrennbar)

```typescript
// CreatePersonAndAddToGroupAction
{
  firstName: 'Max',
  lastName: 'Mustermann',
  email: 'max@example.com',
  groupId: 42,
  roleId: 7
}
```

**Warum sinnvoll:**
- ✅ Fachlich untrennbar
- ✅ Rollback bei Fehler wichtig
- ✅ Häufiger Use-Case

**Aber:** Besser als zwei separate Nodes mit Error-Handling!

### 3. Performance-Optimierung

**Szenario:** Parallele API-Calls für unabhängige Daten

```typescript
// Parallel abrufen:
// - GET /persons/123
// - GET /groups/42
// - GET /events/789
```

**Warum sinnvoll:**
- ✅ Performance-Gewinn
- ✅ Unabhängige Calls

**Aber:** Könnte auch durch Workflow-Engine gelöst werden (parallele Node-Ausführung)!

## Empfehlung

### ❌ Generische Multi-API Action: NICHT empfohlen

**Begründung:**
1. Widerspricht Workflow-Transparenz
2. Komplexe Fehlerbehandlung
3. Schlechtes Debugging
4. Weniger wiederverwendbar
5. Atomarität ist Illusion (ChurchTools API hat keine Transaktionen)

### ✅ Empfohlener Ansatz: Single-API Actions + Spezielle Batch-Actions

**Strategie:**

1. **Standard:** Einzelne Actions pro API-Call
   - `ChurchToolsApiAction` (generisch)
   - `CreatePersonAction` (spezialisiert)
   - `AddToGroupAction` (spezialisiert)

2. **Ausnahme:** Spezialisierte Batch-Actions für häufige Szenarien
   - `AddMultiplePersonsToGroupAction`
   - `CreateMultipleEventsAction`
   - `UpdateMultiplePersonsAction`

3. **Zukünftig:** Workflow-Features
   - **Workflow-Templates:** Vordefinierte Sequenzen
   - **Sub-Workflows:** Wiederverwendbare Teil-Workflows
   - **Parallele Ausführung:** Engine-Feature für Performance

## Alternative Lösungen

### 1. Workflow-Templates

Vordefinierte Workflows für häufige Sequenzen:

```
Template: "Person anlegen und zu Gruppe hinzufügen"

┌─────────────────────────────────────────┐
│ Input: Person-Daten                     │
└────────────┬────────────────────────────┘
             ▼
┌─────────────────────────────────────────┐
│ ChurchTools API: Person erstellen       │
└────────────┬────────────────────────────┘
             ▼
┌─────────────────────────────────────────┐
│ Decision: Erfolgreich?                  │
└────┬───────────────────────────────┬────┘
     │ Ja                            │ Nein
     ▼                               ▼
┌─────────────────────┐    ┌──────────────────┐
│ Zu Gruppe hinzufügen│    │ Fehler-Handling  │
└─────────────────────┘    └──────────────────┘
```

**Vorteile:**
- ✅ Wiederverwendbar
- ✅ Transparent (alle Nodes sichtbar)
- ✅ Anpassbar (Benutzer kann Template modifizieren)

### 2. Sub-Workflows

Ein Node kann einen anderen Workflow aufrufen:

```
┌─────────────────────────────────────────┐
│ Sub-Workflow: "Person onboarding"       │
│ ┌─────────────────────────────────────┐ │
│ │ 1. Person erstellen                 │ │
│ │ 2. Zu Gruppe hinzufügen             │ │
│ │ 3. Willkommens-Mail senden          │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Vorteile:**
- ✅ Wiederverwendbar
- ✅ Modular
- ✅ Kann separat getestet werden
- ✅ Bleibt transparent (Sub-Workflow kann geöffnet werden)

### 3. Workflow-Engine-Features

**Parallele Ausführung:**
```
                    ┌─────────────────────┐
                    │ GET /persons/123    │
                    └─────────────────────┘
                              │
┌─────────────────┐           │           ┌─────────────────┐
│ GET /groups/42  │───────────┴───────────│ GET /events/789 │
└─────────────────┘                       └─────────────────┘
                              │
                    ┌─────────────────────┐
                    │ Alle Daten vorhanden│
                    └─────────────────────┘
```

**Retry-Mechanismus:**
```
┌─────────────────────────────────────────┐
│ ChurchTools API: Person erstellen       │
│ Retry: 3x, Delay: 1s                    │
└─────────────────────────────────────────┘
```

**Compensation-Pattern:**
```
┌─────────────────────────────────────────┐
│ Person erstellen                        │
│ Compensation: Person löschen            │
└────────────┬────────────────────────────┘
             ▼
┌─────────────────────────────────────────┐
│ Zu Gruppe hinzufügen                    │
│ Compensation: Aus Gruppe entfernen      │
└────────────┬────────────────────────────┘
             ▼
         [Fehler!]
             │
             ▼
┌─────────────────────────────────────────┐
│ Rollback: Compensations ausführen       │
│ 1. Aus Gruppe entfernen                 │
│ 2. Person löschen                       │
└─────────────────────────────────────────┘
```

## Implementierungsplan

### Phase 1: Basis (Jetzt)
- [x] `ChurchToolsApiAction` (generisch, single-call)
- [ ] Spezialisierte Single-Call Actions:
  - [ ] `CreatePersonAction`
  - [ ] `AddToGroupAction`
  - [ ] `CreateEventAction`

### Phase 2: Batch-Actions (Bei Bedarf)
- [ ] `AddMultiplePersonsToGroupAction`
- [ ] `UpdateMultiplePersonsAction`
- [ ] Nur für häufige Batch-Operationen

### Phase 3: Workflow-Features (Später)
- [ ] Workflow-Templates
- [ ] Sub-Workflows
- [ ] Parallele Node-Ausführung
- [ ] Retry-Mechanismus
- [ ] Compensation-Pattern

## Fazit

**Eine generische Multi-API Action ist NICHT empfohlen.**

**Stattdessen:**
1. ✅ Einzelne Actions pro API-Call (Standard)
2. ✅ Spezialisierte Batch-Actions (Ausnahme)
3. ✅ Workflow-Templates (Wiederverwendung)
4. ✅ Sub-Workflows (Modularität)
5. ✅ Engine-Features (Performance, Fehlerbehandlung)

**Begründung:**
- Workflow-Transparenz ist wichtiger als Kompaktheit
- Debugging und Fehlerbehandlung sind kritisch
- Etablierte Workflow-Systeme verwenden alle einzelne Nodes
- Flexibilität und Wiederverwendbarkeit sind höher zu bewerten

**Die bestehende Architektur mit einzelnen Action-Nodes ist der richtige Ansatz!**
