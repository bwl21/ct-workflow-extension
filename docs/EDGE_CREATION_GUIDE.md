# Anleitung: Edges (Verbindungen) erstellen

## So erstellst du neue Verbindungen zwischen Nodes

### 1. Normale Nodes (Start, Task, Action, End)

1. **Fahre mit der Maus über einen Node**
   - Du siehst kleine Kreise (Handles) an den Nodes
   - Oben: Eingang (Target Handle)
   - Unten: Ausgang (Source Handle)

2. **Klicke auf den Ausgangs-Handle** (unten am Node)
   - Der Handle wird grün
   - Eine Linie folgt deiner Maus

3. **Ziehe die Linie zum Ziel-Node**
   - Fahre über den Eingangs-Handle (oben) des Ziel-Nodes
   - Der Handle wird grün wenn die Verbindung möglich ist

4. **Lasse die Maustaste los**
   - Die Verbindung wird erstellt
   - Sie erscheint sofort im Diagramm

### 2. Decision Nodes (Entscheidungsknoten)

Decision Nodes haben **zwei Ausgangs-Handles**:

#### TRUE Handle (Links, ✓ JA)
- Position: 30% von links
- Für Bedingungen die erfüllt sind
- Automatisch wird eine Bedingung hinzugefügt (kann später bearbeitet werden)

#### FALSE Handle (Rechts, ✗ NEIN)
- Position: 70% von links
- Für den Standard-Fall (Default)
- Wird als `isDefault: true` markiert

**So verbindest du:**
1. Klicke auf den gewünschten Handle (TRUE oder FALSE)
2. Ziehe zum Ziel-Node
3. Lasse los

### 3. Verbindungen bearbeiten

**Bedingungen hinzufügen:**
1. Klicke auf die Verbindung (Edge)
2. Der Edge-Editor öffnet sich
3. Füge Bedingungen hinzu (für TRUE-Verbindungen)

**Verbindungen löschen:**
1. Klicke auf die Verbindung
2. Klicke auf den Löschen-Button 🗑️

### 4. Tipps

✅ **Handles sind sichtbar wenn:**
- Du mit der Maus über einen Node fährst
- Du eine Verbindung ziehst

✅ **Handles werden grün wenn:**
- Eine Verbindung möglich ist
- Du über einem kompatiblen Handle schwebst

⚠️ **Beachte:**
- Start-Nodes haben nur Ausgang (unten)
- End-Nodes haben nur Eingang (oben)
- Decision-Nodes haben zwei Ausgänge (TRUE/FALSE)
- Alle anderen Nodes haben Eingang und Ausgang

### 5. Beispiel-Workflow

```
Start
  ↓
Task (Formular)
  ↓
Decision (Prüfung)
  ├─ TRUE → Action (Genehmigen)
  └─ FALSE → Action (Ablehnen)
       ↓
      End
```

**Schritte:**
1. Start → Task verbinden
2. Task → Decision verbinden
3. Decision (TRUE Handle) → Action "Genehmigen" verbinden
4. Decision (FALSE Handle) → Action "Ablehnen" verbinden
5. Action "Ablehnen" → End verbinden

### 6. Fehlerbehebung

**Problem: Handles sind nicht sichtbar**
- Lösung: Fahre mit der Maus über den Node

**Problem: Verbindung wird nicht erstellt**
- Lösung: Stelle sicher, dass du auf dem Ziel-Handle (oben) loslässt
- Lösung: Prüfe ob der Handle grün wird

**Problem: Falsche Verbindung erstellt**
- Lösung: Klicke auf die Verbindung und lösche sie
- Lösung: Erstelle eine neue Verbindung

### 7. Keyboard Shortcuts (VueFlow)

- **Entf/Delete**: Ausgewählte Verbindung löschen
- **Strg + Mausrad**: Zoomen
- **Leertaste + Ziehen**: Diagramm verschieben
- **Strg + Z**: Rückgängig (wenn implementiert)

## Technische Details

### Edge-Struktur

```typescript
interface WorkflowEdge {
  id: string;
  source: string;        // Node-ID
  target: string;        // Node-ID
  sourceHandle?: string; // 'true' oder 'false' für Decision Nodes
  condition?: {
    engine: 'simple' | 'jsonlogic' | 'custom';
    rule: any;
  };
  isDefault?: boolean;   // TRUE für FALSE-Handle von Decision Nodes
}
```

### Automatische Edge-Konfiguration

Wenn du eine Verbindung von einem Decision Node erstellst:

**TRUE Handle:**
```typescript
{
  condition: {
    engine: 'simple',
    rule: {
      conditions: [],
      logic: 'AND'
    }
  }
}
```

**FALSE Handle:**
```typescript
{
  isDefault: true
}
```
