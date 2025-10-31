# Implementierungsplan: Person-Feld

## Übersicht

Dieser Plan beschreibt die schrittweise Implementierung eines Person-Feldes für das Workflow-System, das die Auswahl von Personen aus ChurchTools ermöglicht und deren ID speichert.

## Ziel

- Benutzer können in Workflow-Aufgaben Personen aus ChurchTools auswählen
- Die Person-ID wird im Workflow-Kontext gespeichert
- Unterstützung für Einzel- und Mehrfachauswahl
- Suchfunktion und Filter-Optionen

## Voraussetzungen

- ✅ ChurchTools Client ist bereits integriert (`@churchtools/churchtools-client`)
- ✅ API-Methoden für Personen sind verfügbar (`getPersons`, `getPerson`)
- ✅ Bestehende Feld-Architektur ist vorhanden

## Implementierungsschritte

### Phase 1: Typen und Datenstrukturen

**Datei:** `src/types/workflow.types.ts`

**Aufgaben:**
1. Neue FieldType-Werte hinzufügen:
   - `PERSON = 'person'` - Einzelauswahl
   - `PERSON_MULTI = 'person-multi'` - Mehrfachauswahl

2. `FormField` Interface erweitern:
   ```typescript
   personFilter?: {
     groupIds?: number[];
     statusIds?: number[];
     campusIds?: number[];
   };
   ```

**Geschätzter Aufwand:** 15 Minuten

**Akzeptanzkriterien:**
- [ ] Neue FieldType-Werte sind definiert
- [ ] FormField unterstützt personFilter
- [ ] TypeScript-Kompilierung erfolgreich

---

### Phase 2: Person Service

**Datei:** `src/services/PersonService.ts` (neu)

**Aufgaben:**
1. Person Interface definieren:
   ```typescript
   interface Person {
     id: number;
     firstName: string;
     lastName: string;
     nickname?: string;
     email?: string;
     imageUrl?: string;
   }
   ```

2. PersonService Klasse implementieren:
   - `searchPersons(params)` - Personen suchen
   - `getPerson(id)` - Einzelne Person laden
   - `formatPersonName(person)` - Name formatieren

3. Error Handling implementieren
4. Response-Mapping von ChurchTools API

**Geschätzter Aufwand:** 45 Minuten

**Akzeptanzkriterien:**
- [ ] PersonService kann Personen von ChurchTools API laden
- [ ] Suchparameter (query, groupIds, statusIds) funktionieren
- [ ] Fehlerbehandlung ist implementiert
- [ ] Person-Daten werden korrekt gemappt

**Test:**
```typescript
// In Browser Console testen:
const persons = await PersonService.searchPersons({ query: 'Max' });
console.log(persons);
```

---

### Phase 3: PersonSelector Komponente

**Datei:** `src/components/common/PersonSelector.vue` (neu)

**Aufgaben:**
1. Komponenten-Struktur aufbauen:
   - Props: `modelValue`, `multiple`, `required`, `placeholder`, `filter`
   - Emits: `update:modelValue`

2. UI-Elemente implementieren:
   - Ausgewählte Personen anzeigen (Chips bei Mehrfachauswahl)
   - Dropdown-Trigger
   - Suchfeld
   - Personen-Liste mit Avataren
   - Loading-State

3. Funktionalität implementieren:
   - Personen laden beim Mount
   - Suche mit Debouncing (300ms)
   - Person auswählen/abwählen
   - Ausgewählte Personen laden

4. Styling:
   - ChurchTools Design System verwenden
   - Responsive Design
   - Hover-Effekte
   - Selected-State

**Geschätzter Aufwand:** 2 Stunden

**Akzeptanzkriterien:**
- [ ] Komponente rendert korrekt
- [ ] Suche funktioniert mit Debouncing
- [ ] Einzelauswahl speichert Person-ID
- [ ] Mehrfachauswahl speichert Array von IDs
- [ ] Ausgewählte Personen werden angezeigt
- [ ] Filter werden angewendet
- [ ] Styling passt zum Design System

**Test:**
```vue
<!-- Test in UIShowcase.vue -->
<PersonSelector
  v-model="testPersonId"
  placeholder="Person auswählen"
/>
```

---

### Phase 4: WorkflowEditor Integration

**Datei:** `src/components/workflow/WorkflowEditor.vue`

**Aufgaben:**
1. Person-Feldtypen zum Dropdown hinzufügen:
   ```vue
   <optgroup label="ChurchTools">
     <option :value="FieldType.PERSON">Person</option>
     <option :value="FieldType.PERSON_MULTI">Personen (Mehrfach)</option>
   </optgroup>
   ```

2. Filter-Konfiguration hinzufügen:
   - Gruppen-IDs Eingabefeld
   - Status-IDs Eingabefeld
   - Campus-IDs Eingabefeld (optional)

3. `getFieldTypeLabel()` Funktion erweitern:
   ```typescript
   [FieldType.PERSON]: 'Person',
   [FieldType.PERSON_MULTI]: 'Personen (Mehrfach)',
   ```

4. Feld-Initialisierung anpassen:
   - `personFilter` Objekt initialisieren

**Geschätzter Aufwand:** 45 Minuten

**Akzeptanzkriterien:**
- [ ] Person-Feldtypen erscheinen im Dropdown
- [ ] Filter-Konfiguration wird angezeigt
- [ ] Filter-Werte werden gespeichert
- [ ] Feld-Label wird korrekt angezeigt

**Test:**
1. Neuen Task-Node erstellen
2. Feld hinzufügen
3. Typ "Person" auswählen
4. Filter konfigurieren
5. Speichern und JSON prüfen

---

### Phase 5: WorkflowExecutor Integration

**Datei:** `src/components/workflow/WorkflowExecutor.vue`

**Aufgaben:**
1. PersonSelector importieren:
   ```typescript
   import PersonSelector from '@/components/common/PersonSelector.vue';
   ```

2. Feld-Rendering erweitern:
   ```vue
   <PersonSelector
     v-if="field.type === FieldType.PERSON || field.type === FieldType.PERSON_MULTI"
     v-model="formData[field.name]"
     :multiple="field.type === FieldType.PERSON_MULTI"
     :required="field.required"
     :placeholder="field.placeholder"
     :filter="field.personFilter"
   />
   ```

3. Validierung sicherstellen:
   - Required-Felder prüfen
   - Person-ID(s) im Context speichern

**Geschätzter Aufwand:** 30 Minuten

**Akzeptanzkriterien:**
- [ ] PersonSelector wird korrekt gerendert
- [ ] Ausgewählte Person-ID wird in formData gespeichert
- [ ] Required-Validierung funktioniert
- [ ] Wert wird in Workflow-Context übernommen

**Test:**
1. Workflow mit Person-Feld ausführen
2. Person auswählen
3. Formular absenden
4. Context-Variablen prüfen (sollte Person-ID enthalten)

---

### Phase 6: Template-Interpolation

**Datei:** `src/utils/template-interpolation.ts` (falls Anpassung nötig)

**Aufgaben:**
1. Prüfen ob Person-IDs korrekt interpoliert werden
2. Optional: Helper-Funktion für Person-Namen:
   ```typescript
   // In Template: {{personName(assignedPerson)}}
   ```

**Geschätzter Aufwand:** 30 Minuten

**Akzeptanzkriterien:**
- [ ] Person-ID kann in Templates verwendet werden: `{{assignedPerson}}`
- [ ] Optional: Person-Name kann angezeigt werden

**Test:**
1. Task mit Person-Feld erstellen
2. Zweiten Task mit Display-Feld erstellen
3. Display-Feld: "Zugewiesen an: {{assignedPerson}}"
4. Workflow ausführen und prüfen

---

### Phase 7: Testing & Dokumentation

**Aufgaben:**

1. **Unit Tests** (optional):
   - PersonService Tests
   - PersonSelector Tests

2. **Integration Tests**:
   - Workflow erstellen mit Person-Feld
   - Workflow ausführen
   - Person auswählen
   - Daten prüfen

3. **Dokumentation aktualisieren**:
   - README.md: Person-Feld erwähnen
   - Beispiel-Workflow erstellen

4. **Demo-Setup erweitern**:
   - `src/utils/demo-setup.ts`: Beispiel mit Person-Feld

**Geschätzter Aufwand:** 1 Stunde

**Akzeptanzkriterien:**
- [ ] Alle manuellen Tests bestanden
- [ ] Dokumentation ist aktuell
- [ ] Demo-Workflow zeigt Person-Feld

---

## Gesamtaufwand

| Phase | Aufwand | Priorität |
|-------|---------|-----------|
| Phase 1: Typen | 15 Min | Hoch |
| Phase 2: Service | 45 Min | Hoch |
| Phase 3: Komponente | 2 Std | Hoch |
| Phase 4: Editor | 45 Min | Hoch |
| Phase 5: Executor | 30 Min | Hoch |
| Phase 6: Interpolation | 30 Min | Mittel |
| Phase 7: Testing | 1 Std | Hoch |
| **Gesamt** | **~6 Stunden** | |

## Reihenfolge

Die Phasen sollten in der angegebenen Reihenfolge durchgeführt werden, da sie aufeinander aufbauen:

1. ✅ Phase 1 (Typen) - Grundlage für alle anderen Phasen - **ABGESCHLOSSEN**
2. ✅ Phase 2 (Service) - Benötigt für Komponente - **ABGESCHLOSSEN**
3. ✅ Phase 3 (Komponente) - Benötigt für Editor & Executor - **ABGESCHLOSSEN**
4. ✅ Phase 4 (Editor) - Konfiguration - **ABGESCHLOSSEN**
5. ✅ Phase 5 (Executor) - Ausführung - **ABGESCHLOSSEN**
6. ✅ Phase 6 (Interpolation) - Erweiterte Features - **ABGESCHLOSSEN**
7. ✅ Phase 7 (Testing) - Abschluss - **ABGESCHLOSSEN**

## ✅ IMPLEMENTIERUNG ABGESCHLOSSEN

Alle Phasen wurden erfolgreich implementiert. Das Person-Feld ist nun vollständig funktionsfähig.

## Risiken & Mitigationen

### Risiko 1: ChurchTools API-Änderungen
**Wahrscheinlichkeit:** Niedrig  
**Impact:** Hoch  
**Mitigation:** 
- API-Responses loggen und dokumentieren
- Error Handling implementieren
- Fallback auf Mock-Daten in Entwicklung

### Risiko 2: Performance bei vielen Personen
**Wahrscheinlichkeit:** Mittel  
**Impact:** Mittel  
**Mitigation:**
- Limit auf 50 Personen pro Suche
- Debouncing bei Suche (300ms)
- Lazy Loading implementieren (zukünftig)

### Risiko 3: Offline-Funktionalität
**Wahrscheinlichkeit:** Mittel  
**Impact:** Niedrig  
**Mitigation:**
- Graceful Degradation
- Fehlermeldungen anzeigen
- Caching implementieren (zukünftig)

## Zukünftige Erweiterungen

Nach erfolgreicher Implementierung können folgende Features hinzugefügt werden:

1. **Caching**: Person-Daten im LocalStorage cachen
2. **Lazy Loading**: Mehr Personen beim Scrollen laden
3. **Erweiterte Filter**: Alter, Geschlecht, Tags
4. **Person-Display-Feld**: Read-only Feld zur Anzeige von Person-Infos
5. **Gruppen-Feld**: Ähnliche Komponente für Gruppen-Auswahl
6. **Action-Plugins**: Vorgefertigte Aktionen für Person-Operationen

## Erfolgsmetriken

- [ ] Person-Feld kann in Workflows verwendet werden
- [ ] Personen können gesucht und ausgewählt werden
- [ ] Person-IDs werden korrekt gespeichert
- [ ] Keine Performance-Probleme bei normaler Nutzung
- [ ] Benutzer-Feedback ist positiv

## Nächste Schritte

1. Review dieses Plans mit Team/Stakeholdern
2. Zeitplan festlegen
3. Mit Phase 1 beginnen
4. Nach jeder Phase Review durchführen
5. Bei Problemen Plan anpassen

## Notizen

- ChurchTools API-Dokumentation: https://api.church.tools/
- Bestehende Feld-Implementierungen als Referenz nutzen
- ChurchTools Design System für konsistentes UI verwenden
- Code-Kommentare auf Deutsch schreiben (Projekt-Konvention)
