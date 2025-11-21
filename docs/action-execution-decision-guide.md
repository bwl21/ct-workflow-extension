# Entscheidungshilfe: ChurchTools API Actions

## Quick Decision Tree

```
Brauche ich diese Operation häufig (>10x)?
│
├─ JA → Ist die UI wichtig?
│      │
│      ├─ JA → Spezialisierte Action
│      │      Beispiel: CreatePersonAction
│      │
│      └─ NEIN → Service-Methode + Generische Action
│             Beispiel: GroupService.addMember()
│
└─ NEIN → Generische ChurchTools API Action
          Beispiel: ChurchToolsApiAction
```

## Ansatz-Übersicht

### 1. Spezialisierte Action

**Wann verwenden:**
- ✅ Operation wird häufig genutzt (>10x)
- ✅ Benutzerfreundliche UI ist wichtig
- ✅ Komplexe Validierung erforderlich
- ✅ Viele Felder mit spezifischen Typen

**Beispiele:**
- Person erstellen
- Person zu Gruppe hinzufügen
- Event erstellen
- Dienst zuweisen

**Aufwand:** 🔴🔴🔴 Hoch (2-4 Stunden pro Action)

**Code-Beispiel:**
```typescript
export const CreatePersonAction: ActionPlugin = {
  id: 'ct-create-person',
  name: 'Person erstellen',
  configComponent: CreatePersonConfig,
  defaultConfig: {
    firstName: '',
    lastName: '',
    email: '',
    statusId: null,
    campusId: null
  }
};
```

---

### 2. Generische ChurchTools API Action

**Wann verwenden:**
- ✅ Operation wird selten genutzt (<5x)
- ✅ Flexibilität wichtiger als Benutzerfreundlichkeit
- ✅ Schnelles Prototyping
- ✅ Power-User / Entwickler als Zielgruppe

**Beispiele:**
- Custom Module Daten abrufen
- Ressource buchen
- Spezielle API-Calls
- Einmalige Operationen

**Aufwand:** 🟢 Niedrig (einmalig 4-6 Stunden für die Action)

**Code-Beispiel:**
```typescript
export const ChurchToolsApiAction: ActionPlugin = {
  id: 'ct-api-call',
  name: 'ChurchTools API Call',
  configComponent: ChurchToolsApiConfig,
  defaultConfig: {
    method: 'GET',
    endpoint: '/persons',
    params: {},
    body: null
  }
};
```

---

### 3. Hybrid-Ansatz (Empfohlen)

**Wann verwenden:**
- ✅ Immer! Beste Balance für die meisten Projekte
- ✅ Mix aus häufigen und seltenen Operationen
- ✅ Verschiedene Benutzergruppen (Anfänger + Power-User)

**Strategie:**
- Spezialisierte Actions für Top 5-10 Operationen
- Generische Action für alles andere

**Aufwand:** 🟡 Mittel (initial höher, langfristig optimal)

**Beispiel-Mix:**
```
Spezialisiert:
- CreatePersonAction
- AddToGroupAction
- CreateEventAction
- AssignToServiceAction

Generisch:
- ChurchToolsApiAction (für alles andere)
```

---

### 4. Service-basierte Actions

**Wann verwenden:**
- ✅ Großes Projekt mit vielen API-Calls
- ✅ Services werden auch außerhalb von Actions genutzt
- ✅ Typsicherheit und Testbarkeit sind kritisch
- ✅ Langfristige Wartbarkeit wichtig

**Beispiele:**
- Alle Actions nutzen Services
- Services in UI-Komponenten
- Services in anderen Extensions

**Aufwand:** 🔴🔴 Hoch (Service-Layer + Actions)

**Code-Beispiel:**
```typescript
// Service
export class GroupService {
  static async addMemberToGroup(
    groupId: number, 
    personId: number, 
    roleId?: number
  ): Promise<void> {
    await churchtoolsClient.post(`/groups/${groupId}/members`, {
      personId, roleId
    });
  }
}

// Action nutzt Service
const execute = async () => {
  await GroupService.addMemberToGroup(groupId, personId, roleId);
};
```

---

## Vergleichstabelle

| Kriterium | Spezialisiert | Generisch | Hybrid | Service-basiert |
|-----------|:-------------:|:---------:|:------:|:---------------:|
| **Benutzerfreundlichkeit** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Flexibilität** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Wartbarkeit** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Initialer Aufwand** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Typsicherheit** | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Testbarkeit** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Wiederverwendbarkeit** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## Empfehlung für verschiedene Szenarien

### Szenario 1: Kleines Projekt, wenige Workflows
**Empfehlung:** Generische Action  
**Begründung:** Schnell implementiert, ausreichend flexibel

### Szenario 2: Mittleres Projekt, Standard-Workflows
**Empfehlung:** Hybrid-Ansatz  
**Begründung:** Beste Balance, erweiterbar

### Szenario 3: Großes Projekt, viele komplexe Workflows
**Empfehlung:** Service-basiert + Hybrid  
**Begründung:** Langfristig wartbar, wiederverwendbar

### Szenario 4: Prototyping / MVP
**Empfehlung:** Generische Action  
**Begründung:** Schnell, flexibel, später erweiterbar

### Szenario 5: Enterprise-Lösung
**Empfehlung:** Service-basiert  
**Begründung:** Typsicher, testbar, professionell

## Implementierungs-Roadmap

### Phase 1: Foundation (Woche 1-2)
```
1. Service-Layer erweitern
   - GroupService
   - EventService
   
2. Generische ChurchTools API Action
   - Config-Komponente
   - Execute-Komponente
   - Response-Mapping
```

### Phase 2: Spezialisierte Actions (Woche 3-4)
```
3. Top 3 häufigste Operationen
   - CreatePersonAction
   - AddToGroupAction
   - CreateEventAction
```

### Phase 3: Optimierung (Woche 5-6)
```
4. ActionHelpers erweitern
   - ChurchToolsClient vollständig
   - Error Handling
   - Retry-Logik
   
5. Dokumentation & Tests
   - API-Mapping
   - Beispiel-Workflows
   - Unit-Tests
```

## Kosten-Nutzen-Analyse

### Spezialisierte Action
- **Entwicklungszeit:** 2-4 Stunden
- **Wartungszeit:** 1-2 Stunden/Jahr
- **Nutzen:** Hohe Benutzerfreundlichkeit
- **ROI:** Gut bei häufiger Nutzung (>10x)

### Generische Action
- **Entwicklungszeit:** 4-6 Stunden (einmalig)
- **Wartungszeit:** 0.5 Stunden/Jahr
- **Nutzen:** Maximale Flexibilität
- **ROI:** Exzellent für seltene Operationen

### Service-Layer
- **Entwicklungszeit:** 8-12 Stunden
- **Wartungszeit:** 2-3 Stunden/Jahr
- **Nutzen:** Wiederverwendbarkeit, Typsicherheit
- **ROI:** Exzellent bei großen Projekten

## Häufige Fehler vermeiden

### ❌ Fehler 1: Zu früh spezialisieren
**Problem:** Viele spezialisierte Actions für seltene Operationen  
**Lösung:** Erst generische Action, später spezialisieren

### ❌ Fehler 2: Keine Services
**Problem:** API-Logik in Actions dupliziert  
**Lösung:** Service-Layer für wiederverwendbare Logik

### ❌ Fehler 3: Zu generisch
**Problem:** Nur generische Action, schlechte UX  
**Lösung:** Hybrid-Ansatz mit Top-Operationen spezialisiert

### ❌ Fehler 4: Keine Variable Interpolation
**Problem:** Statische Werte in Actions  
**Lösung:** `{{variableName}}` Syntax unterstützen

### ❌ Fehler 5: Schlechtes Error Handling
**Problem:** Workflows brechen bei Fehlern ab  
**Lösung:** Konfigurierbare Error-Strategien

## Checkliste für neue Actions

### Spezialisierte Action
- [ ] Config-Komponente mit allen Feldern
- [ ] Execute-Komponente mit Error Handling
- [ ] Validierung implementiert
- [ ] Variable Interpolation unterstützt
- [ ] Icon und Beschreibung definiert
- [ ] Beispiel-Config in Metadata
- [ ] Tests geschrieben
- [ ] Dokumentation erstellt

### Generische Action
- [ ] Endpoint-Auswahl implementiert
- [ ] Alle HTTP-Methoden unterstützt
- [ ] Query-Parameter Editor
- [ ] Request Body Editor (JSON)
- [ ] Response-Mapping Editor
- [ ] Error Handling konfigurierbar
- [ ] Variable Interpolation
- [ ] Dokumentation mit Beispielen

### Service
- [ ] Typsichere Interfaces
- [ ] Error Handling
- [ ] Daten-Transformation
- [ ] JSDoc-Kommentare
- [ ] Unit-Tests
- [ ] Verwendungsbeispiele

## Weitere Ressourcen

- [Vollständiges Konzept](./action-execution-concept.md)
- [ChurchTools API Dokumentation](https://api.church.tools/)
- [Action Plugin System](./plugin-system.md)
- [Beispiel-Workflows](./examples/)

## Fragen?

Bei Unklarheiten:
1. Prüfe das [vollständige Konzept](./action-execution-concept.md)
2. Schaue dir vorhandene Actions an (RestApiAction, EmailAction)
3. Teste mit der generischen Action
4. Spezialisiere bei Bedarf
