# Actions im Workflow-Editor

## Übersicht

Actions können jetzt direkt im Workflow-Editor konfiguriert werden. Die Konfiguration erfolgt **während der Workflow-Erstellung**, nicht während der Ausführung.

## Workflow: Action hinzufügen und konfigurieren

### 1. Action-Node hinzufügen

1. Öffne den Workflow-Editor
2. Klicke auf **"⚡ Aktion"** in der Toolbar
3. Ein neuer Action-Node wird zum Workflow hinzugefügt

### 2. Action auswählen

1. Klicke auf den Action-Node zum Bearbeiten
2. Im Editor-Dialog siehst du:
   - **Label**: Name des Nodes (z.B. "Person erstellen")
   - **Beschreibung**: Optionale Beschreibung
   - **Action auswählen**: Dropdown mit allen verfügbaren Actions

3. Wähle eine Action aus dem Dropdown:
   - **⛪ ChurchTools**
     - ChurchTools API Call
     - Person zu Gruppe hinzufügen
   - **🌐 Integration**
     - REST API Call
   - **📧 Kommunikation**
     - Email

### 3. Action konfigurieren

Nach der Auswahl einer Action erscheint automatisch die **Konfigurationskomponente** der Action.

#### Beispiel: ChurchTools API Call

```
┌─────────────────────────────────────────────────────┐
│ Action auswählen                                    │
│ [ChurchTools API Call ▼]                           │
│                                                     │
│ ℹ️ Führt einen ChurchTools API-Call aus            │
│                                                     │
│ Tags: churchtools, api, integration                │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Konfiguration                                   │ │
│ │                                                 │ │
│ │ HTTP-Methode: [POST ▼]                          │ │
│ │                                                 │ │
│ │ Endpoint: [/persons                          ]  │ │
│ │ Ohne /api Prefix (wird automatisch hinzugefügt)│ │
│ │                                                 │ │
│ │ Request Body (JSON):                            │ │
│ │ ┌─────────────────────────────────────────────┐ │ │
│ │ │ {                                           │ │ │
│ │ │   "firstName": "{{firstName}}",             │ │ │
│ │ │   "lastName": "{{lastName}}",               │ │ │
│ │ │   "email": "{{email}}"                      │ │ │
│ │ │ }                                           │ │ │
│ │ └─────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [Abbrechen]  [Speichern]                           │
└─────────────────────────────────────────────────────┘
```

#### Beispiel: Person zu Gruppe hinzufügen

```
┌─────────────────────────────────────────────────────┐
│ Action auswählen                                    │
│ [Person zu Gruppe hinzufügen ▼]                    │
│                                                     │
│ ℹ️ Fügt eine Person einer ChurchTools-Gruppe hinzu │
│                                                     │
│ Tags: churchtools, person, group, membership       │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Konfiguration                                   │ │
│ │                                                 │ │
│ │ Person:                                         │ │
│ │ ☐ Aus Variable                                  │ │
│ │ [Person ID: 123                              ]  │ │
│ │                                                 │ │
│ │ Gruppe:                                         │ │
│ │ ☑ Aus Variable                                  │ │
│ │ [Variable: personId ▼]                          │ │
│ │                                                 │ │
│ │ Rolle (optional):                               │ │
│ │ [Rollen ID: 1                                ]  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [Abbrechen]  [Speichern]                           │
└─────────────────────────────────────────────────────┘
```

### 4. Speichern

1. Klicke auf **"Speichern"**
2. Die Action-Konfiguration wird im Workflow gespeichert
3. Der Node zeigt jetzt die ausgewählte Action an

## Verfügbare Variablen

Im Editor werden dir die **verfügbaren Variablen** aus vorherigen Workflow-Schritten angezeigt:

- Variablen aus **Task-Nodes** (Formularfelder)
- Variablen aus **vorherigen Action-Nodes** (Outputs)

Diese kannst du in der Action-Konfiguration verwenden:
- Mit `{{variableName}}` Syntax
- Oder über Dropdown-Auswahl (je nach Action)

## Beispiel-Workflow

### Workflow: Person erstellen und zu Gruppe hinzufügen

```
1. [Start]
   │
   ▼
2. [Task: Person-Daten erfassen]
   Felder:
   - firstName (Text)
   - lastName (Text)
   - email (Email)
   │
   ▼
3. [Action: ChurchTools API Call]
   Config:
   - Method: POST
   - Endpoint: /persons
   - Body: { firstName: "{{firstName}}", ... }
   │
   ▼
4. [Action: Person zu Gruppe hinzufügen]
   Config:
   - personIdVariable: lastApiResponse.data.id
   - groupId: 42
   - roleId: 1
   │
   ▼
5. [Action: Email]
   Config:
   - to: {{email}}
   - subject: Willkommen!
   - body: Hallo {{firstName}}, ...
   │
   ▼
6. [End]
```

### Konfiguration im Editor

**Schritt 3: ChurchTools API Call**
```json
{
  "method": "POST",
  "endpoint": "/persons",
  "body": {
    "firstName": "{{firstName}}",
    "lastName": "{{lastName}}",
    "email": "{{email}}"
  }
}
```

**Schritt 4: Person zu Gruppe hinzufügen**
```json
{
  "personIdVariable": "lastApiResponse.data.id",
  "groupId": 42,
  "roleId": 1
}
```

**Schritt 5: Email**
```json
{
  "to": "{{email}}",
  "subject": "Willkommen!",
  "body": "Hallo {{firstName}}, willkommen in unserer Gemeinde!"
}
```

## Wichtige Hinweise

### ✅ Konfiguration im Editor

Die Action-Konfiguration erfolgt **im Editor**, nicht während der Ausführung:
- ✅ Alle Einstellungen werden im Workflow gespeichert
- ✅ Variablen können verwendet werden (`{{variableName}}`)
- ✅ Konfiguration ist wiederverwendbar

### ⚠️ Variable Interpolation

Variablen werden während der **Workflow-Ausführung** aufgelöst:
- Im Editor: `{{firstName}}` (Platzhalter)
- Bei Ausführung: `Max` (tatsächlicher Wert)

### 🔄 Action-Wechsel

Wenn du eine andere Action auswählst:
- Die alte Konfiguration wird verworfen
- Die neue Action wird mit `defaultConfig` initialisiert
- Du musst die neue Action neu konfigurieren

### 💾 Speichern nicht vergessen

- Klicke **"Speichern"** im Node-Editor
- Dann **"Speichern"** im Workflow-Editor (oben rechts)
- Sonst gehen deine Änderungen verloren!

## Troubleshooting

### Problem: Action-Konfiguration wird nicht angezeigt

**Ursache:** Action wurde nicht ausgewählt

**Lösung:**
1. Wähle eine Action aus dem Dropdown
2. Die Konfigurationskomponente erscheint automatisch

### Problem: Variablen nicht verfügbar

**Ursache:** Keine vorherigen Nodes mit Outputs

**Lösung:**
1. Füge Task-Nodes mit Feldern hinzu
2. Oder Action-Nodes die Outputs erzeugen
3. Variablen sind nur von vorherigen Nodes verfügbar

### Problem: Konfiguration geht verloren

**Ursache:** Nicht gespeichert

**Lösung:**
1. Klicke "Speichern" im Node-Editor
2. Klicke "Speichern" im Workflow-Editor
3. Beide Speicher-Schritte sind nötig!

## Best Practices

### 1. Aussagekräftige Labels

```
✅ Gut: "Person in ChurchTools erstellen"
❌ Schlecht: "Aktion 1"
```

### 2. Beschreibungen nutzen

```
✅ Gut: "Erstellt eine neue Person mit den erfassten Daten"
❌ Schlecht: (leer)
```

### 3. Variablen dokumentieren

```
✅ Gut: Zeige in der Beschreibung welche Variablen verwendet werden
❌ Schlecht: Keine Dokumentation
```

### 4. Testen

1. Erstelle einen Test-Workflow
2. Führe ihn aus
3. Prüfe die Ergebnisse
4. Passe die Konfiguration an

## Weitere Informationen

- [ChurchTools Actions Dokumentation](./churchtools-actions.md)
- [Action Plugin System](./plugin-system.md)
- [Template Interpolation](./template-interpolation/)
