# Workflow-Assistent Dokumentation

Willkommen zur Dokumentation des Workflow-Assistenten für ChurchTools.

## Übersicht

Der Workflow-Assistent ist eine ChurchTools Extension, die es Administratoren ermöglicht, visuelle Workflows zu erstellen und Benutzern eine geführte Ausführung dieser Workflows bietet.

## Dokumentationsstruktur

### 1. [Konzept](./konzept.md)
Umfassende Beschreibung des Projekts mit:
- Zielgruppen und Use Cases
- Hauptkomponenten und Features
- Workflow-Beispiele
- Implementierungsphasen
- Offene Fragen

### 2. [Diagramme](./diagramme.md)
Visuelle Darstellungen der Architektur:
- **Komponentendiagramm** - Übersicht aller Frontend- und Backend-Komponenten
- **Systemarchitektur** - High-Level Architektur mit externen Systemen
- **Datenmodell** - Entity-Relationship-Diagramm
- **Sequenzdiagramme** - Workflow-Ausführung und Editor-Interaktionen
- **Zustandsdiagramm** - Workflow-Execution Lifecycle
- **Deployment-Diagramm** - Infrastruktur und Deployment
- **Aktivitätsdiagramm** - Detaillierter Ablauf eines Workflow-Schritts
- **Use Case Diagramm** - Akteure und ihre Interaktionen
- **Klassendiagramm** - Core Entities und ihre Beziehungen

### 3. [Technische Spezifikation](./technische-spezifikation.md)
Detaillierte technische Dokumentation:
- Technologie-Stack (Vue 3, TypeScript, Pinia)
- Projektstruktur und Dateiorganisation
- TypeScript Interfaces und Typen
- API-Spezifikation mit Beispielen
- Workflow Engine Implementierung
- Vue Composables
- Sicherheit und Berechtigungen
- Performance-Optimierungen
- Testing-Strategie
- Deployment-Prozess
- Monitoring und Logging

### 4. [Plugin-System](./plugin-system.md)
Erweiterbarkeit durch Custom Actions:
- Plugin-Architektur für Aktions-Knoten
- Base Interfaces und Types
- Action Registry System
- Beispiel-Implementierungen (REST API, E-Mail)
- Entwickler-Guide für eigene Actions
- Best Practices

## Schnellstart

### Für Entwickler

1. **Repository klonen:**
   ```bash
   git clone https://github.com/bwl21/ct-workflow-extension.git
   cd ct-workflow-extension
   ```

2. **Dependencies installieren:**
   ```bash
   npm install
   ```

3. **Development Server starten:**
   ```bash
   npm run dev
   ```

4. **Dokumentation lesen:**
   - Beginne mit [Konzept](./konzept.md) für Überblick
   - Siehe [Diagramme](./diagramme.md) für visuelle Architektur
   - Nutze [Technische Spezifikation](./technische-spezifikation.md) für Implementierung

### Für Administratoren

1. **Extension installieren:**
   - ZIP-Datei aus Releases herunterladen
   - In ChurchTools Admin-Bereich hochladen
   - Extension aktivieren

2. **Ersten Workflow erstellen:**
   - Workflow-Editor öffnen
   - Knoten per Drag & Drop hinzufügen
   - Knoten konfigurieren und verbinden
   - Workflow speichern und veröffentlichen

3. **Workflow ausführen:**
   - Workflow aus Liste auswählen
   - "Starten" klicken
   - Schritte durchlaufen
   - Ergebnis überprüfen

## Hauptfeatures

### ✅ Visueller Workflow-Editor
- Drag & Drop Interface
- Verschiedene Knotentypen (Start, Task, Decision, Action, End)
- Bedingte Verzweigungen
- Visuelle Verbindungen zwischen Schritten

### ✅ Geführte Workflow-Ausführung
- Dynamische Arbeitsfläche für aktuellen Schritt
- Workflow-Visualisierung mit Fortschrittsanzeige
- Chronologie aller durchlaufenen Schritte
- Validierung von Benutzereingaben

### ✅ Externe Integrationen
- ChurchTools API Integration
- REST API Calls
- Webhooks
- E-Mail-Versand
- **Plugin-System für eigene Aktionen**

### ✅ Reaktive Updates
- Automatische UI-Aktualisierung
- Echtzeit-Statusanzeige
- Synchronisation zwischen Komponenten

### ✅ Zugriffssteuerung
- Rollenbasierte Berechtigungen
- Workflow-spezifische Rechte
- Admin- und Benutzer-Rollen

## Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Vue 3)                      │
├──────────────────────┬──────────────────────────────────┤
│   Workflow-Editor    │    Workflow-Executor             │
│   (Admin)            │    (Benutzer)                    │
├──────────────────────┴──────────────────────────────────┤
│              State Management (Pinia)                    │
├─────────────────────────────────────────────────────────┤
│                    REST API                              │
├─────────────────────────────────────────────────────────┤
│              Workflow Engine                             │
├─────────────────────────────────────────────────────────┤
│    Datenbank    │    ChurchTools    │    Externe APIs   │
└─────────────────────────────────────────────────────────┘
```

## Technologie-Stack

- **Frontend:** Vue 3, TypeScript, Pinia, Vue Router
- **UI:** ChurchTools Design System, Vue Flow
- **Build:** Vite
- **Backend:** Node.js, Express (optional)
- **Datenbank:** PostgreSQL / MySQL
- **Testing:** Vitest, Playwright

## Workflow-Beispiele

### Mitgliederaufnahme
1. Persönliche Daten erfassen
2. Gruppenzuordnung
3. Dokumente hochladen
4. Admin-Freigabe
5. ChurchTools-Integration
6. Benachrichtigungen versenden

### Event-Planung
1. Event-Details eingeben
2. Ressourcen buchen
3. Team zuweisen
4. Budget prüfen
5. ChurchTools-Event erstellen
6. Kommunikation versenden

## Entwicklungs-Roadmap

### Phase 1: MVP (4-6 Wochen)
- ✅ Grundgerüst und Projektstruktur
- ⏳ Einfacher Workflow-Editor
- ⏳ Basis-Ausführungs-UI
- ⏳ Lokale Speicherung

### Phase 2: Erweiterte Features (4-6 Wochen)
- ⏳ Bedingte Verzweigungen
- ⏳ ChurchTools API Integration
- ⏳ Bearbeitungschronologie
- ⏳ Backend-Persistierung

### Phase 3: Produktionsreife (4-6 Wochen)
- ⏳ Vollständige Zugriffssteuerung
- ⏳ Erweiterte Integrationen
- ⏳ Echtzeit-Updates
- ⏳ Fehlerbehandlung

### Phase 4: Optimierung (2-4 Wochen)
- ⏳ Performance-Optimierung
- ⏳ Workflow-Templates
- ⏳ Analytics und Reporting
- ⏳ Mobile-Optimierung

## Beitragen

Contributions sind willkommen! Bitte beachte:

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## Support

- **Issues:** [GitHub Issues](https://github.com/bwl21/ct-workflow-extension/issues)
- **Diskussionen:** [GitHub Discussions](https://github.com/bwl21/ct-workflow-extension/discussions)
- **ChurchTools Forum:** [forum.church.tools](https://forum.church.tools)

## Lizenz

Dieses Projekt steht unter der MIT-Lizenz.

## Autoren

- Entwickelt für ChurchTools
- Basierend auf [ChurchTools Extension Template](https://github.com/bwl21/ct-extension-template-ona)

---

**Hinweis:** Diese Dokumentation wird kontinuierlich erweitert und aktualisiert.
