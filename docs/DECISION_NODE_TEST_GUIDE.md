# Decision Node Test-Anleitung

## Übersicht

Der Decision Node hat jetzt Zugriff auf alle Felder aus vorherigen Task-Nodes und kann beliebig viele Ausgänge mit Bedingungen haben.

## Test-Szenario: Altersgruppen-Workflow

### Schritt 1: Workflow erstellen

1. Öffne den Workflow-Editor
2. Erstelle einen neuen Workflow: "Altersgruppen-Test"

### Schritt 2: Task Node mit Formular

1. Füge einen **Task Node** hinzu
2. Bearbeite den Node:
   - Label: "Persönliche Daten"
   - Füge folgende Felder hinzu:
     - **name** (Text): "Name"
     - **age** (Number): "Alter"
     - **email** (Email): "E-Mail"

### Schritt 3: Decision Node konfigurieren

1. Füge einen **Decision Node** hinzu
2. Verbinde Task → Decision
3. Bearbeite den Decision Node:
   - Label: "Altersgruppe prüfen"
   - Klicke auf "Standard-Ausgänge erstellen" (falls leer)
   
4. **Konfiguriere Ausgang 1 (Erwachsen):**
   - Label: "👨 Erwachsen"
   - Bedingung:
     - Feld: "Persönliche Daten: Alter"
     - Operator: "greaterThanOrEqual"
     - Wert: 18
   - Default: NEIN

5. **Konfiguriere Ausgang 2 (Kind):**
   - Label: "👶 Kind"
   - Default: JA (keine Bedingung)

6. **Optional: Füge dritten Ausgang hinzu:**
   - Klicke "+ Ausgang hinzufügen"
   - Label: "👦 Jugendlich"
   - Bedingung:
     - Regel 1: Alter >= 13
     - Regel 2: Alter < 18
     - Logik: AND
   - Default: NEIN
   - **Wichtig:** Verschiebe diesen Ausgang VOR "Kind" (da Kind der Default ist)

### Schritt 4: Action Nodes hinzufügen

1. Füge 3 **Action Nodes** hinzu:
   - "Erwachsenen-Aktion"
   - "Jugendlichen-Aktion"
   - "Kinder-Aktion"

2. Verbinde Decision Node Ausgänge:
   - "👨 Erwachsen" → "Erwachsenen-Aktion"
   - "👦 Jugendlich" → "Jugendlichen-Aktion"
   - "👶 Kind" → "Kinder-Aktion"

### Schritt 5: End Node

1. Füge einen **End Node** hinzu
2. Verbinde alle Action Nodes → End

### Schritt 6: Workflow testen

1. Wechsle zur Workflow-Ausführung
2. Starte den Workflow

**Test 1: Erwachsener**
- Name: "Max Mustermann"
- Alter: 25
- Email: "max@example.com"
- **Erwartung:** Geht zu "Erwachsenen-Aktion"

**Test 2: Jugendlicher**
- Name: "Anna Schmidt"
- Alter: 15
- Email: "anna@example.com"
- **Erwartung:** Geht zu "Jugendlichen-Aktion"

**Test 3: Kind**
- Name: "Tim Klein"
- Alter: 8
- Email: "tim@example.com"
- **Erwartung:** Geht zu "Kinder-Aktion"

**Test 4: Grenzfall**
- Name: "Lisa Müller"
- Alter: 18
- Email: "lisa@example.com"
- **Erwartung:** Geht zu "Erwachsenen-Aktion" (>= 18)

## Erweiterte Tests

### Test: Mehrere Bedingungen

**Szenario:** VIP-Prüfung

1. Füge weiteres Feld im Task hinzu:
   - **vip** (Checkbox): "VIP-Mitglied"

2. Erstelle Decision Node mit:
   - **VIP Erwachsener:** age >= 18 AND vip = true
   - **VIP Kind:** age < 18 AND vip = true
   - **Normal Erwachsener:** age >= 18
   - **Normal Kind:** Default

### Test: Komplexe Bedingungen

**Szenario:** Rabatt-Berechnung

1. Task Node Felder:
   - **orderValue** (Number): "Bestellwert"
   - **customerType** (Select): "Kundentyp" (Neu, Bestand, Premium)

2. Decision Node Ausgänge:
   - **20% Rabatt:** orderValue >= 1000 AND customerType = "Premium"
   - **10% Rabatt:** orderValue >= 500 AND customerType = "Bestand"
   - **5% Rabatt:** orderValue >= 100
   - **Kein Rabatt:** Default

## Fehlerfälle testen

### Test 1: Keine Bedingung erfüllt, kein Default
- **Setup:** Entferne Default-Markierung von allen Ausgängen
- **Erwartung:** Workflow schlägt fehl mit Fehlermeldung

### Test 2: Mehrere Defaults
- **Setup:** Markiere mehrere Ausgänge als Default
- **Erwartung:** Erster Default wird verwendet

### Test 3: Leere Bedingung
- **Setup:** Ausgang ohne Bedingung und ohne Default
- **Erwartung:** Wird nie ausgewählt

## Visuelle Überprüfung

### Im Editor:
- [ ] Decision Node zeigt Anzahl der Ausgänge
- [ ] Handles sind an korrekten Positionen
- [ ] Labels sind sichtbar an den Handles
- [ ] Edges verbinden sich mit richtigen Handles

### Bei Ausführung:
- [ ] Aktiver Node wird hervorgehoben
- [ ] Aktive Edge wird animiert
- [ ] Richtiger Pfad wird genommen

## Debugging

### Felder nicht verfügbar?
1. Prüfe, ob Task Node VOR Decision Node kommt
2. Prüfe, ob Felder im Task Node gespeichert sind
3. Öffne Browser Console für Fehler

### Falscher Pfad genommen?
1. Prüfe Bedingungen im Decision Node
2. Prüfe Operator (equals vs. greaterThan etc.)
3. Prüfe Datentyp (String vs. Number)
4. Prüfe Default-Markierung

### Edge verbindet nicht?
1. Prüfe, ob sourceHandle korrekt gesetzt ist
2. Prüfe, ob Output-ID mit sourceHandle übereinstimmt
3. Prüfe Browser Console für Fehler

## Erwartete Ergebnisse

✅ **Erfolgreich wenn:**
- Alle Felder aus vorherigen Tasks sind verfügbar
- Bedingungen können auf diese Felder erstellt werden
- Richtiger Ausgang wird basierend auf Bedingungen gewählt
- Default-Ausgang funktioniert als Fallback
- Mehrere Ausgänge können erstellt werden
- Edges verbinden sich mit richtigen Handles

❌ **Fehler wenn:**
- Felder nicht verfügbar
- Bedingungen werden nicht ausgewertet
- Falscher Pfad wird genommen
- Edges verbinden sich nicht
- Workflow bricht ab

## Nächste Schritte

Nach erfolgreichem Test:
1. Dokumentation aktualisieren
2. Beispiel-Workflows erstellen
3. Migration für alte Workflows implementieren
4. UI-Verbesserungen (Drag & Drop für Ausgänge)
5. Validierung hinzufügen
