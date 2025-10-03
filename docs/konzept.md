# Workflow-Assistent für ChurchTools - Konzept

## Übersicht

Ein workflowgetriebener Assistent für ChurchTools, der es Administratoren ermöglicht, visuelle Workflows zu erstellen und Benutzern eine geführte Ausführung dieser Workflows bietet.

## Zielgruppen

### Administratoren
- Erstellen und bearbeiten Workflows visuell
- Definieren Workflow-Schritte und deren Logik
- Konfigurieren externe Integrationen
- Verwalten Zugriffsrechte

### Benutzer
- Führen vordefinierte Workflows aus
- Sehen aktuellen Fortschritt und Historie
- Interagieren mit Workflow-Schritten
- Erhalten Feedback zu Aktionen

## Hauptkomponenten

### 1. Workflow-Editor (Admin)

**Funktionalität:**
- Drag & Drop Interface für Workflow-Erstellung
- Visuelle Darstellung von Workflow-Knoten
- Verbindungen zwischen Knoten (sequenziell/bedingt)
- Konfiguration von Schritt-Eigenschaften
- Speichern und Laden von Workflows

**Knotentypen:**
- **Start-Knoten:** Einstiegspunkt des Workflows
- **Aufgaben-Knoten:** Benutzerinteraktion erforderlich
- **Entscheidungs-Knoten:** Bedingte Verzweigung
- **Aktions-Knoten:** Automatische Aktionen (API-Calls, etc.)
- **End-Knoten:** Workflow-Abschluss

**Eigenschaften pro Knoten:**
- Titel und Beschreibung
- Eingabefelder (Typ, Validierung, Pflichtfelder)
- Ausgabedaten (für nachfolgende Schritte)
- Bedingungen (für Verzweigungen)
- Aktionen (externe System-Integrationen)

### 2. Workflow-Ausführung (Benutzer)

**UI-Layout:**
```
┌─────────────────────────────────────────────────────────┐
│                    Workflow-Titel                        │
├──────────────────────┬──────────────────────────────────┤
│                      │                                  │
│   Workflow-Diagram   │      Aktuelle Arbeitsfläche      │
│   (Visualisierung)   │      (Schritt-Interaktion)       │
│                      │                                  │
│   - Aktueller Schritt│      - Eingabefelder             │
│   - Abgeschlossene   │      - Informationen             │
│   - Kommende         │      - Aktionen                  │
│                      │                                  │
├──────────────────────┴──────────────────────────────────┤
│              Bearbeitungschronologie                     │
│              (Historie aller Schritte)                   │
└─────────────────────────────────────────────────────────┘
```

**Arbeitsfläche:**
- Dynamische Formularfelder basierend auf Schritt-Definition
- Validierung von Eingaben
- Aktionsbuttons (Weiter, Zurück, Abbrechen)
- Kontextuelle Hilfe und Anweisungen

**Workflow-Visualisierung:**
- Grafische Darstellung des gesamten Workflows
- Hervorhebung des aktuellen Schritts
- Statusindikatoren für abgeschlossene Schritte:
  - ✅ Erfolgreich abgeschlossen
  - ⏳ In Bearbeitung
  - ⏸️ Ausstehend
  - ❌ Fehler
- Anzeige von Zwischenergebnissen bei Hover

**Bearbeitungschronologie:**
- Chronologische Liste aller durchlaufenen Schritte
- Zeitstempel für jeden Schritt
- Eingaben und Ergebnisse pro Schritt
- Möglichkeit zur Navigation zu vorherigen Schritten (falls erlaubt)

### 3. Externe System-Integration

**Aktionstypen:**
- **REST API Calls:** GET, POST, PUT, DELETE
- **Webhooks:** Trigger externe Services
- **Datenabfragen:** ChurchTools API Integration
- **Benachrichtigungen:** E-Mail, Push-Notifications

**Konfiguration:**
- Endpoint-URL
- HTTP-Methode
- Header und Authentication
- Request-Body (mit Variablen aus Workflow-Kontext)
- Response-Mapping (Daten für nachfolgende Schritte)
- Fehlerbehandlung

**Beispiel-Integrationen:**
- ChurchTools API (Personen, Gruppen, Events)
- E-Mail-Versand
- Externe Datenbanken
- Drittanbieter-Services (Slack, Teams, etc.)

### 4. Workflow-Engine

**Zustandsverwaltung:**
- Aktueller Schritt
- Workflow-Kontext (alle gesammelten Daten)
- Benutzer-Session
- Historie der durchlaufenen Schritte

**Ablaufsteuerung:**
- Schritt-Validierung
- Bedingungsauswertung für Verzweigungen
- Ausführung von Aktionen
- Fehlerbehandlung und Rollback
- Persistierung des Workflow-Status

**Datenfluss:**
- Variablen-System für Datenweitergabe zwischen Schritten
- Kontext-Objekt mit allen Workflow-Daten
- Zugriff auf vorherige Schritt-Ergebnisse
- Globale Variablen (z.B. aktueller Benutzer)

### 5. Zugriffssteuerung

**Rollen:**
- **Admin:** Vollzugriff auf Workflow-Editor und -Verwaltung
- **Benutzer:** Ausführung zugewiesener Workflows
- **Gast:** Nur Lesezugriff (optional)

**Berechtigungen:**
- Workflow erstellen/bearbeiten/löschen (Admin)
- Workflow ausführen (Benutzer, konfigurierbar pro Workflow)
- Workflow-Historie einsehen (Admin, Benutzer für eigene Workflows)
- System-Integrationen konfigurieren (Admin)

## Technische Architektur

### Frontend (Vue 3 + TypeScript)

**Komponenten:**
- `WorkflowEditor.vue` - Drag & Drop Editor für Admins
- `WorkflowExecutor.vue` - Ausführungs-UI für Benutzer
- `WorkflowDiagram.vue` - Visuelle Workflow-Darstellung
- `WorkflowHistory.vue` - Chronologie-Komponente
- `StepWorkspace.vue` - Arbeitsfläche für aktuellen Schritt
- `NodeEditor.vue` - Konfiguration einzelner Knoten

**State Management (Pinia):**
- `workflowStore` - Workflow-Definitionen
- `executionStore` - Laufende Workflow-Instanzen
- `userStore` - Benutzer und Berechtigungen

**Libraries:**
- **Vue Flow / VueUse:** Für Workflow-Diagramme
- **Vuelidate:** Formular-Validierung
- **Axios:** HTTP-Requests für externe Integrationen

### Backend / API

**Endpoints:**
- `GET /api/workflows` - Liste aller Workflows
- `POST /api/workflows` - Neuen Workflow erstellen
- `PUT /api/workflows/:id` - Workflow aktualisieren
- `DELETE /api/workflows/:id` - Workflow löschen
- `POST /api/workflows/:id/execute` - Workflow-Instanz starten
- `GET /api/executions/:id` - Workflow-Instanz abrufen
- `POST /api/executions/:id/step` - Schritt abschließen
- `GET /api/executions/:id/history` - Historie abrufen

**Datenmodell:**

```typescript
interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  permissions: Permission[];
}

interface WorkflowNode {
  id: string;
  type: 'start' | 'task' | 'decision' | 'action' | 'end';
  label: string;
  description: string;
  config: NodeConfig;
  position: { x: number; y: number };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
  label?: string;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  userId: string;
  currentNodeId: string;
  context: Record<string, any>;
  history: StepHistory[];
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
}

interface StepHistory {
  nodeId: string;
  timestamp: Date;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  status: 'success' | 'error';
  error?: string;
}
```

### Persistierung

**Speicherung:**
- Workflow-Definitionen in ChurchTools Datenbank
- Workflow-Instanzen (Executions) mit aktuellem Status
- Historie für Audit und Nachvollziehbarkeit

**Caching:**
- Workflow-Definitionen im Frontend-Store
- Aktive Executions im Session-Storage

## Reaktive Aktualisierung

**Mechanismen:**
- **Vue Reactivity:** Automatische UI-Updates bei State-Änderungen
- **WebSockets (optional):** Echtzeit-Updates für kollaborative Workflows
- **Polling (Fallback):** Regelmäßige Status-Abfragen

**Update-Trigger:**
- Schritt-Abschluss → Workflow-Diagramm aktualisieren
- Neue Historie-Einträge → Chronologie erweitern
- Kontext-Änderungen → Arbeitsfläche neu rendern
- Externe Aktionen → Status-Benachrichtigungen

## Workflow-Beispiele

### Beispiel 1: Mitgliederaufnahme

**Schritte:**
1. **Start:** Neue Mitgliederaufnahme
2. **Persönliche Daten:** Formular (Name, Adresse, Kontakt)
3. **Gruppenzuordnung:** Auswahl aus ChurchTools-Gruppen
4. **Dokumente:** Upload von Dokumenten
5. **Prüfung:** Admin-Freigabe (Entscheidungsknoten)
   - Genehmigt → Weiter zu Schritt 6
   - Abgelehnt → Zurück zu Schritt 2
6. **ChurchTools-Integration:** API-Call zum Anlegen der Person
7. **Benachrichtigung:** E-Mail an Mitglied und Admin
8. **Ende:** Aufnahme abgeschlossen

### Beispiel 2: Event-Planung

**Schritte:**
1. **Start:** Neues Event planen
2. **Event-Details:** Titel, Datum, Beschreibung
3. **Ressourcen:** Raum- und Material-Buchung
4. **Team:** Mitarbeiter zuweisen
5. **Budget-Prüfung:** Automatische Berechnung und Freigabe
6. **ChurchTools-Event:** API-Call zum Erstellen des Events
7. **Kommunikation:** Automatische Benachrichtigungen
8. **Ende:** Event erstellt

## Implementierungsphasen

### Phase 1: Grundgerüst (MVP)
- Einfacher Workflow-Editor mit sequenziellen Schritten
- Basis-Ausführungs-UI mit Arbeitsfläche
- Einfache Workflow-Visualisierung
- Lokale Speicherung (ohne Backend)

### Phase 2: Erweiterte Features
- Bedingte Verzweigungen
- Externe Aktionen (ChurchTools API)
- Bearbeitungschronologie
- Persistierung im Backend

### Phase 3: Produktionsreife
- Vollständige Zugriffssteuerung
- Erweiterte externe Integrationen
- WebSocket-basierte Echtzeit-Updates
- Umfassende Fehlerbehandlung

### Phase 4: Optimierung
- Performance-Optimierung
- Erweiterte Workflow-Templates
- Analytics und Reporting
- Mobile-Optimierung

## Offene Fragen

1. **Backend-Technologie:** Soll ein separates Backend entwickelt werden oder ChurchTools API erweitern?
2. **Workflow-Persistierung:** Wie werden Workflows in ChurchTools gespeichert (Custom Tables)?
3. **Echtzeit-Updates:** WebSockets oder Polling für Status-Updates?
4. **Workflow-Templates:** Sollen vordefinierte Templates bereitgestellt werden?
5. **Versionierung:** Wie werden Änderungen an Workflows versioniert?
6. **Migration:** Wie werden laufende Workflows bei Änderungen der Definition behandelt?

## Nächste Schritte

1. Detaillierte Diagramme erstellen (Komponenten, Sequenz, Architektur)
2. Prototyp des Workflow-Editors entwickeln
3. Datenmodell finalisieren
4. API-Spezifikation erstellen
5. MVP implementieren
