# Action-Ergebnisse in der Bearbeitungschronologie

## Übersicht

Alle Action-Ergebnisse werden prominent in der Bearbeitungschronologie angezeigt. Der Benutzer sieht auf einen Blick:
- ✅ Ob die Action erfolgreich war
- ❌ Welcher Fehler aufgetreten ist
- 📊 Welche Daten zurückgegeben wurden
- ⏱️ Wie lange die Ausführung gedauert hat

## Visuelle Darstellung

### Erfolgreiche Action

```
Bearbeitungschronologie
├─ Person-Daten erfassen
│  ✓ 01.11.2024, 17:30
│  Eingaben:
│  • firstName: Max
│  • lastName: Mustermann
│  • email: max@example.com
│
├─ ChurchTools API Call
│  ✓ 01.11.2024, 17:31
│  ┌─────────────────────────────────────────────┐
│  │ ✓ Erfolgreich ausgeführt                    │
│  │                                             │
│  │ ▼ Ergebnis anzeigen                         │
│  │ ┌─────────────────────────────────────────┐ │
│  │ │ {                                       │ │
│  │ │   "data": {                             │ │
│  │ │     "id": 123,                          │ │
│  │ │     "firstName": "Max",                 │ │
│  │ │     "lastName": "Mustermann"            │ │
│  │ │   }                                     │ │
│  │ │ }                                       │ │
│  │ └─────────────────────────────────────────┘ │
│  │                                             │
│  │ Dauer: 234ms                                │
│  └─────────────────────────────────────────────┘
│
└─ Person zu Gruppe hinzufügen
   ✓ 01.11.2024, 17:32
   ┌─────────────────────────────────────────────┐
   │ ✓ Erfolgreich ausgeführt                    │
   │                                             │
   │ ▼ Ergebnis anzeigen                         │
   │ ┌─────────────────────────────────────────┐ │
   │ │ {                                       │ │
   │ │   "personId": 123,                      │ │
   │ │   "groupId": 42,                        │ │
   │ │   "roleId": 1                           │ │
   │ │ }                                       │ │
   │ └─────────────────────────────────────────┘ │
   │                                             │
   │ Dauer: 156ms                                │
   └─────────────────────────────────────────────┘
```

### Fehlgeschlagene Action

```
Bearbeitungschronologie
├─ Person-Daten erfassen
│  ✓ 01.11.2024, 17:30
│  Eingaben:
│  • firstName: Max
│  • lastName: Mustermann
│  • email: invalid-email
│
├─ ChurchTools API Call
│  ✕ 01.11.2024, 17:31
│  ┌─────────────────────────────────────────────┐
│  │ ✕ Fehler bei Ausführung                     │
│  │                                             │
│  │ ┌─────────────────────────────────────────┐ │
│  │ │ E-Mail-Adresse ist ungültig             │ │
│  │ └─────────────────────────────────────────┘ │
│  │                                             │
│  │ Dauer: 45ms                                 │
│  └─────────────────────────────────────────────┘
│
└─ [Workflow abgebrochen]
```

## Farbcodierung

### Erfolg (Grün)
- **Hintergrund:** Hellgrün (#e8f5e9)
- **Text:** Dunkelgrün (#2e7d32)
- **Border:** Grün (#4caf50)
- **Icon:** ✓

### Fehler (Rot)
- **Hintergrund:** Hellrot (#ffebee)
- **Text:** Dunkelrot (#c62828)
- **Border:** Rot (#f44336)
- **Icon:** ✕

## Details-Anzeige

### Ergebnis-Daten (aufklappbar)

```
▼ Ergebnis anzeigen
┌─────────────────────────────────────────┐
│ {                                       │
│   "data": {                             │
│     "id": 123,                          │
│     "firstName": "Max",                 │
│     "lastName": "Mustermann",           │
│     "email": "max@example.com"          │
│   }                                     │
│ }                                       │
└─────────────────────────────────────────┘
```

**Features:**
- Aufklappbar (Details-Element)
- JSON-formatiert mit Syntax-Highlighting
- Scrollbar bei langen Daten
- Max-Höhe: 200px

### Fehlermeldung (immer sichtbar)

```
┌─────────────────────────────────────────┐
│ E-Mail-Adresse ist ungültig             │
└─────────────────────────────────────────┘
```

**Features:**
- Immer sichtbar (nicht aufklappbar)
- Hervorgehoben mit Hintergrund
- Word-Break für lange Meldungen

## Beispiele verschiedener Actions

### 1. ChurchToolsApiAction - Person erstellen

**Erfolg:**
```
ChurchTools API Call
✓ 01.11.2024, 17:31
┌─────────────────────────────────────────────┐
│ ✓ Erfolgreich ausgeführt                    │
│                                             │
│ ▼ Ergebnis anzeigen                         │
│ ┌─────────────────────────────────────────┐ │
│ │ {                                       │ │
│ │   "data": {                             │ │
│ │     "id": 123,                          │ │
│ │     "firstName": "Max",                 │ │
│ │     "lastName": "Mustermann",           │ │
│ │     "email": "max@example.com",         │ │
│ │     "statusId": 1,                      │ │
│ │     "campusId": 2                       │ │
│ │   }                                     │ │
│ │ }                                       │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Dauer: 234ms                                │
└─────────────────────────────────────────────┘
```

**Fehler:**
```
ChurchTools API Call
✕ 01.11.2024, 17:31
┌─────────────────────────────────────────────┐
│ ✕ Fehler bei Ausführung                     │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Endpoint /persons nicht gefunden (404)  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Dauer: 45ms                                 │
└─────────────────────────────────────────────┘
```

### 2. AddToGroupAction

**Erfolg:**
```
Person zu Gruppe hinzufügen
✓ 01.11.2024, 17:32
┌─────────────────────────────────────────────┐
│ ✓ Erfolgreich ausgeführt                    │
│                                             │
│ ▼ Ergebnis anzeigen                         │
│ ┌─────────────────────────────────────────┐ │
│ │ {                                       │ │
│ │   "personId": 123,                      │ │
│ │   "groupId": 42,                        │ │
│ │   "roleId": 1                           │ │
│ │ }                                       │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Dauer: 156ms                                │
└─────────────────────────────────────────────┘
```

**Fehler:**
```
Person zu Gruppe hinzufügen
✕ 01.11.2024, 17:32
┌─────────────────────────────────────────────┐
│ ✕ Fehler bei Ausführung                     │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Gruppe 42 nicht gefunden                │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Dauer: 67ms                                 │
└─────────────────────────────────────────────┘
```

### 3. EmailAction

**Erfolg:**
```
Email senden
✓ 01.11.2024, 17:33
┌─────────────────────────────────────────────┐
│ ✓ Erfolgreich ausgeführt                    │
│                                             │
│ ▼ Ergebnis anzeigen                         │
│ ┌─────────────────────────────────────────┐ │
│ │ {                                       │ │
│ │   "to": "max@example.com",              │ │
│ │   "subject": "Willkommen!",             │ │
│ │   "sent": true                          │ │
│ │ }                                       │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Dauer: 1234ms                               │
└─────────────────────────────────────────────┘
```

**Fehler:**
```
Email senden
✕ 01.11.2024, 17:33
┌─────────────────────────────────────────────┐
│ ✕ Fehler bei Ausführung                     │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ SMTP-Server nicht erreichbar            │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Dauer: 5000ms                               │
└─────────────────────────────────────────────┘
```

## Kompletter Workflow-Durchlauf

```
Bearbeitungschronologie

├─ Start
│  ✓ 01.11.2024, 17:30:00
│
├─ Person-Daten erfassen
│  ✓ 01.11.2024, 17:30:15
│  Eingaben:
│  • firstName: Max
│  • lastName: Mustermann
│  • email: max@example.com
│
├─ ChurchTools API Call
│  ✓ 01.11.2024, 17:30:20
│  ┌─────────────────────────────────────────────┐
│  │ ✓ Erfolgreich ausgeführt                    │
│  │                                             │
│  │ ▼ Ergebnis anzeigen                         │
│  │ ┌─────────────────────────────────────────┐ │
│  │ │ {                                       │ │
│  │ │   "data": {                             │ │
│  │ │     "id": 123,                          │ │
│  │ │     "firstName": "Max",                 │ │
│  │ │     "lastName": "Mustermann"            │ │
│  │ │   }                                     │ │
│  │ │ }                                       │ │
│  │ └─────────────────────────────────────────┘ │
│  │                                             │
│  │ Dauer: 234ms                                │
│  └─────────────────────────────────────────────┘
│
├─ Person zu Gruppe hinzufügen
│  ✓ 01.11.2024, 17:30:25
│  ┌─────────────────────────────────────────────┐
│  │ ✓ Erfolgreich ausgeführt                    │
│  │                                             │
│  │ ▼ Ergebnis anzeigen                         │
│  │ ┌─────────────────────────────────────────┐ │
│  │ │ {                                       │ │
│  │ │   "personId": 123,                      │ │
│  │ │   "groupId": 42,                        │ │
│  │ │   "roleId": 1                           │ │
│  │ │ }                                       │ │
│  │ └─────────────────────────────────────────┘ │
│  │                                             │
│  │ Dauer: 156ms                                │
│  └─────────────────────────────────────────────┘
│
├─ Email senden
│  ✓ 01.11.2024, 17:30:30
│  ┌─────────────────────────────────────────────┐
│  │ ✓ Erfolgreich ausgeführt                    │
│  │                                             │
│  │ Dauer: 1234ms                               │
│  └─────────────────────────────────────────────┘
│
└─ Ende
   ✓ 01.11.2024, 17:30:32
```

## Vorteile dieser Darstellung

### 1. Sofortige Übersicht
- ✅ Erfolg/Fehler auf einen Blick
- ✅ Keine separate Suche nach Fehlern
- ✅ Chronologische Reihenfolge

### 2. Detaillierte Informationen
- 📊 Vollständige Ergebnis-Daten
- ⏱️ Performance-Metriken
- 🔍 Debugging-Informationen

### 3. Benutzerfreundlich
- 🎨 Farbcodierung (Grün/Rot)
- 📦 Aufklappbare Details
- 📝 Klare Fehlermeldungen

### 4. Nachvollziehbar
- 📅 Zeitstempel für jeden Schritt
- 🔗 Zusammenhang zwischen Schritten
- 📋 Vollständige Audit-Trail

## Technische Details

### Datenstruktur

```typescript
// History Entry mit Action-Result
{
  id: 'entry-123',
  nodeName: 'ChurchTools API Call',
  timestamp: new Date('2024-11-01T17:30:20'),
  status: 'success',
  inputs: {
    _actionResult: {
      success: true,
      data: {
        data: {
          id: 123,
          firstName: 'Max',
          lastName: 'Mustermann'
        }
      },
      duration: 234
    },
    _actionName: 'ChurchTools API Call'
  }
}
```

### CSS-Klassen

```css
.history-action-result     /* Container */
.action-success            /* Erfolg-Box (grün) */
.action-error              /* Fehler-Box (rot) */
.action-header             /* Header mit Icon */
.action-icon               /* ✓ oder ✕ */
.action-data               /* Ergebnis-Daten */
.action-error-msg          /* Fehlermeldung */
.action-meta               /* Dauer-Anzeige */
```

## Best Practices für Action-Entwickler

### 1. Aussagekräftige Fehlermeldungen

```typescript
// ✅ Gut
error: "Person ID ist erforderlich"
error: "Gruppe 42 nicht gefunden"
error: "E-Mail-Adresse ist ungültig"

// ❌ Schlecht
error: "Error"
error: "Failed"
error: "Something went wrong"
```

### 2. Nützliche Ergebnis-Daten

```typescript
// ✅ Gut
data: {
  personId: 123,
  groupId: 42,
  membershipId: 456
}

// ❌ Schlecht
data: true
data: "OK"
```

### 3. Performance-Metriken

```typescript
// Immer duration angeben
const startTime = Date.now();
// ... action logic ...
duration: Date.now() - startTime
```

## Weitere Informationen

- [Action Feedback](./ACTION_FEEDBACK.md)
- [ChurchTools Actions](./churchtools-actions.md)
- [Workflow Editor Actions](./WORKFLOW_EDITOR_ACTIONS.md)
