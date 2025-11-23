# Changelog - 22. November 2025

## Workflow-Validierung und Execution-Verbesserungen

### Neue Features

#### 1. Workflow-Validierung mit expliziten JOIN Nodes
- **Regel:** Jeder Node (außer JOIN) darf nur eine eingehende Edge haben
- **Validierung auf 3 Ebenen:**
  - **Editor beim Verbinden:** Warnung mit Bestätigung
  - **Editor beim Speichern:** Alert (nicht-blockierend)
  - **Execution beim Start:** Blockierung bei kritischen Fehlern
- **"✓ Validieren" Button** im Workflow-Editor
- **Validierungsregeln:**
  - Genau ein START Node erforderlich
  - Keine mehrfachen eingehenden Edges ohne JOIN
  - Warnung bei Nodes ohne ausgehende Edges
  - Warnung bei möglichen Endlosschleifen

#### 2. Workflow-Metadaten editierbar
- Name und Beschreibung können direkt im Editor geändert werden
- Auto-Save beim Verlassen des Feldes (onBlur)
- Eingabefelder im Editor-Header

#### 3. Verbessertes Error Handling
- Verwendet `errorHelper.getTranslatedErrorMessage()` aus ChurchTools Client
- Zeigt deutsche Fehlermeldungen bevorzugt an
- Backend-Fehlermeldungen werden korrekt extrahiert und angezeigt
- Validierungsfehler werden in UI-Alerts angezeigt (nicht nur Console)

#### 4. Decision Nodes automatisch
- Decision Nodes werden automatisch durchlaufen (keine User-Interaktion nötig)
- Conditions werden automatisch evaluiert
- Workflow läuft flüssig weiter

#### 5. Aktiver Node Hervorhebung
- Deutlich sichtbarer pulsierender grüner Rahmen um den aktiven Node
- Hintergrund-Gradient für besseren Kontrast
- Mehrere Schatten-Layer für Tiefe
- Leichte Skalierung (scale 1.02)
- Glow-Effekt für maximale Sichtbarkeit

#### 6. END Nodes optional
- Workflow endet automatisch wenn keine ausgehenden Edges vorhanden
- END Nodes dienen nur zur visuellen Klarheit

### Verbesserungen

#### ManageGroupMembership Action
- **Member Fields Fix:** Verwendet korrekten Endpoint `/groups/{groupId}/memberfields`
- Vorher wurden fälschlicherweise Gruppen-Felder statt Member-Felder geholt

#### Workflow Execution
- **Reaktive currentNodeId:** Separates reactive ref für bessere Vue-Reaktivität
- **Node-Wechsel funktioniert:** Aktiver Node wird bei jedem Schritt korrekt aktualisiert
- **PersonSelector Fix:** Felder werden mit `null` (PERSON) oder `[]` (PERSON_MULTI) initialisiert

#### UI/UX
- Workflow-Fortschritt Panel entfernt (überflüssig durch Node-Hervorhebung)
- Pulsierender Rahmen deutlich sichtbarer
- Bessere visuelle Hierarchie

### Technische Änderungen

#### Stores
- `execution.ts`: Separates `currentNodeId` ref für Reaktivität
- Alle Stellen wo `currentNodeId` gesetzt wird, aktualisieren auch das reactive ref

#### Components
- `VueFlowDiagram.vue`: Watch auf `currentNodeId` für Node-Updates
- `WorkflowExecutor.vue`: Verwendet `executionStore.currentNodeId` direkt
- `WorkflowEditor.vue`: Validierungsfunktionen und editierbare Metadaten

#### Types
- `WorkflowExecution.currentNodeId`: Typ geändert zu `string | null`
- `ExecutionContext.error`: Neues optionales Feld für Fehlermeldungen

### Entfernte Features
- Implicit Join Logic (handleImplicitJoin) - nur noch explizite JOIN Nodes
- "Aktueller Schritt" Panel - überflüssig durch Node-Hervorhebung

### Breaking Changes
- **Workflows mit mehreren eingehenden Edges ohne JOIN Node** werden bei der Ausführung blockiert
- Lösung: JOIN Node vor dem betroffenen Node einfügen

### Migration
Bestehende Workflows sollten validiert werden:
1. Workflow im Editor öffnen
2. "✓ Validieren" Button klicken
3. Bei Fehlern: JOIN Nodes an den entsprechenden Stellen einfügen

## Bekannte Probleme
- Keine bekannten kritischen Probleme

## Nächste Schritte
- Weitere Actions implementieren
- Workflow-Templates erstellen
- Performance-Optimierungen für große Workflows
