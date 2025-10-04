# Aufgaben-Agenten (Task Agents)

## Konzept

**Aufgaben-Agenten** sind automatisierte Helfer, die Aufgaben (Tasks) ganz oder teilweise erledigen können.

## Zukünftige Implementierung

### Use Cases

#### 1. **E-Mail-Agent**
```
Aufgabe: "E-Mail an Mitglied senden"

[DISPLAY-Feld: Empfänger-Info]
Name: Max Mustermann
E-Mail: max@example.com
Mitgliedsnummer: 12345

[Eingabe-Felder]
Betreff: [________________]
Nachricht: [________________]

[Senden] [Agent ausführen]
         └─> Agent füllt Betreff + Nachricht automatisch aus
```

#### 2. **Daten-Validierungs-Agent**
```
Aufgabe: "Mitgliedsdaten prüfen"

[DISPLAY-Feld: Zu prüfende Daten]
...

[Agent ausführen]
└─> Agent prüft Daten automatisch
    └─> Füllt Ergebnis-Felder aus
```

#### 3. **Dokumenten-Generator-Agent**
```
Aufgabe: "Mitgliedsausweis erstellen"

[DISPLAY-Feld: Mitgliedsdaten]
...

[Agent ausführen]
└─> Agent generiert PDF automatisch
    └─> Lädt Datei hoch
```

### Technische Umsetzung

#### Agent-Konfiguration in Task-Node

```typescript
interface TaskNode {
  // ... existing fields
  data: {
    fields: FormField[];
    agent?: TaskAgent; // NEU
  }
}

interface TaskAgent {
  id: string;              // z.B. "email-sender", "data-validator"
  name: string;            // z.B. "E-Mail-Assistent"
  description: string;     // Was der Agent tut
  enabled: boolean;        // Kann deaktiviert werden
  autoExecute: boolean;    // Automatisch beim Laden ausführen?
  config: Record<string, any>; // Agent-spezifische Konfiguration
}
```

#### Agent-Typen

**1. Field-Filler Agent**
- Füllt Formularfelder automatisch aus
- Basierend auf Context-Variablen und Regeln
- Benutzer kann Werte noch ändern

**2. Validation Agent**
- Prüft Eingaben
- Zeigt Warnungen/Fehler
- Kann Aufgabe blockieren

**3. Action Agent**
- Führt externe Aktionen aus (E-Mail senden, API-Call, etc.)
- Zeigt Ergebnis in DISPLAY-Feld
- Kann Aufgabe automatisch abschließen

**4. Generator Agent**
- Generiert Dokumente, Berichte, etc.
- Lädt Dateien hoch
- Füllt FILE-Felder

#### UI-Integration

**Im Editor:**
```
┌─────────────────────────────────────────────────────┐
│ Task-Eigenschaften                                  │
├─────────────────────────────────────────────────────┤
│ Label: E-Mail senden                                │
│ Beschreibung: ...                                   │
│                                                     │
│ ☑ Aufgaben-Agent aktivieren                        │
│   ┌───────────────────────────────────────────────┐ │
│   │ Agent: E-Mail-Assistent                       │ │
│   │ ☐ Automatisch beim Laden ausführen           │ │
│   │                                               │ │
│   │ Konfiguration:                                │ │
│   │ - Template: Willkommens-E-Mail                │ │
│   │ - Absender: info@gemeinde.de                  │ │
│   └───────────────────────────────────────────────┘ │
│                                                     │
│ Felder: ...                                         │
└─────────────────────────────────────────────────────┘
```

**Im Executor:**
```
┌─────────────────────────────────────────────────────┐
│ E-Mail an Mitglied senden                           │
├─────────────────────────────────────────────────────┤
│ [Empfänger-Info - DISPLAY]                          │
│ Name: Max Mustermann                                │
│ E-Mail: max@example.com                             │
│                                                     │
│ Betreff: [Willkommen in unserer Gemeinde]          │
│ Nachricht: [Hallo Max, ...]                        │
│                                                     │
│ [🤖 Agent ausführen] [Senden] [Abbrechen]          │
│      └─> Füllt Felder automatisch aus              │
└─────────────────────────────────────────────────────┘
```

### Agent-API

```typescript
interface TaskAgentAPI {
  /**
   * Führt den Agent aus
   */
  execute(context: ExecutionContext): Promise<AgentResult>;
  
  /**
   * Validiert die Konfiguration
   */
  validate(config: Record<string, any>): ValidationResult;
  
  /**
   * Gibt Vorschau der Agent-Aktion
   */
  preview(context: ExecutionContext): Promise<AgentPreview>;
}

interface AgentResult {
  success: boolean;
  message: string;
  fieldValues?: Record<string, any>; // Ausgefüllte Felder
  displayContent?: string;           // Inhalt für DISPLAY-Felder
  error?: string;
}
```

### Beispiel-Implementierung: E-Mail-Agent

```typescript
class EmailAgent implements TaskAgentAPI {
  async execute(context: ExecutionContext): Promise<AgentResult> {
    const { firstName, lastName, email } = context.variables;
    
    // Template laden
    const template = this.config.template;
    
    // Platzhalter ersetzen
    const subject = interpolate(template.subject, context.variables);
    const body = interpolate(template.body, context.variables);
    
    return {
      success: true,
      message: 'E-Mail-Entwurf erstellt',
      fieldValues: {
        subject: subject,
        body: body
      }
    };
  }
  
  async preview(context: ExecutionContext): Promise<AgentPreview> {
    // Zeige Vorschau ohne zu senden
    return {
      title: 'E-Mail-Vorschau',
      content: `Betreff: ${subject}\n\n${body}`
    };
  }
}
```

### Integration mit ChurchTools

**ChurchTools-spezifische Agenten:**

1. **CT-Person-Lookup-Agent**
   - Sucht Person in ChurchTools
   - Füllt Felder mit CT-Daten

2. **CT-Group-Assignment-Agent**
   - Fügt Person zu Gruppe hinzu
   - Zeigt Bestätigung

3. **CT-Event-Registration-Agent**
   - Meldet Person zu Event an
   - Sendet Bestätigungs-E-Mail

4. **CT-Document-Generator-Agent**
   - Generiert Dokumente mit CT-Daten
   - Nutzt CT-Templates

### Sicherheit

**Wichtig:**
- Agenten müssen Berechtigungen prüfen
- Sensible Aktionen erfordern Bestätigung
- Audit-Log für Agent-Aktionen
- Rate-Limiting für externe API-Calls

### Roadmap

**Phase 1: Grundlagen**
- [ ] Agent-Interface definieren
- [ ] Agent-Konfiguration in Task-Node
- [ ] UI für Agent-Aktivierung im Editor

**Phase 2: Basis-Agenten**
- [ ] Field-Filler Agent (Template-basiert)
- [ ] Validation Agent (Regel-basiert)

**Phase 3: ChurchTools-Integration**
- [ ] CT-API-Client für Agenten
- [ ] CT-spezifische Agenten
- [ ] Berechtigungs-System

**Phase 4: Erweiterte Features**
- [ ] Agent-Marketplace
- [ ] Custom Agents (User-defined)
- [ ] Agent-Chaining (mehrere Agenten nacheinander)

## Zusammenhang mit DISPLAY-Feldern

**DISPLAY-Felder** sind perfekt für Agenten:
- Zeigen Agent-Ergebnisse an
- Zeigen Vorschau vor Ausführung
- Zeigen Status/Fortschritt
- Mit Copy-Button für einfaches Kopieren

**Beispiel:**
```
[Agent ausführen]
  ↓
[DISPLAY-Feld: Agent-Ergebnis]
✓ E-Mail-Entwurf erstellt
Betreff: Willkommen Max Mustermann
Nachricht: Hallo Max, ...
[📋 Kopieren]
```

## Offene Fragen

1. Sollen Agenten asynchron laufen (mit Progress-Bar)?
2. Wie gehen wir mit Agent-Fehlern um?
3. Sollen Agenten Kosten verursachen (z.B. API-Credits)?
4. Wie testen wir Agenten (Sandbox-Modus)?
