# Person-Feld: Daten-Konsistenz Problem

## Problem-Beschreibung

Bei der Implementierung des Person-Feldes wurde entschieden, das **vollständige Person-Objekt** in den Workflow-Variablen zu speichern, nicht nur die Person-ID.

### Aktuelle Implementierung

```typescript
// In context.variables wird gespeichert:
{
  assignedPerson: {
    id: 123,
    firstName: "Max",
    lastName: "Mustermann",
    email: "max@example.com",
    nickname: "Maxi",
    imageUrl: "https://..."
  }
}
```

### Das Konsistenz-Problem

**Szenario:**
1. User startet Workflow und wählt Person "Max Mustermann" aus
2. Person-Daten werden in `context.variables` gespeichert
3. Workflow läuft mehrere Tage/Wochen
4. In ChurchTools wird die Person geändert:
   - E-Mail-Adresse geändert
   - Name geändert
   - Person wird gelöscht
5. Workflow-Actions verwenden die **veralteten Daten** aus `context.variables`

**Konsequenzen:**
- ❌ E-Mails werden an alte E-Mail-Adresse gesendet
- ❌ Falsche Namen in generierten Dokumenten
- ❌ Referenzen auf gelöschte Personen
- ❌ Inkonsistenz zwischen ChurchTools-Datenbank und Workflow-Daten

## Warum wurde diese Lösung gewählt?

**Vorteile der aktuellen Implementierung:**
- ✅ Einfache Template-Verwendung: `{{assignedPerson.firstName}}`
- ✅ Keine zusätzlichen API-Calls in Actions
- ✅ Bessere Performance
- ✅ Einfachere Implementierung

**Entscheidung:**
Das Konsistenz-Problem wird **bewusst in Kauf genommen** für:
- Einfachheit der Implementierung
- Bessere Developer Experience
- Bessere Performance

## Mögliche Lösungsansätze (für später)

### Lösung 1: Refresh-Mechanismus

**Konzept:** Person-Daten bei jedem Action-Schritt neu laden.

```typescript
// Vor jeder Action-Ausführung:
async function refreshPersonData(context: ExecutionContext) {
  for (const [key, value] of Object.entries(context.variables)) {
    if (isPersonObject(value)) {
      const freshData = await PersonService.getPerson(value.id);
      if (freshData) {
        context.variables[key] = freshData;
      }
    }
  }
}
```

**Vorteile:**
- ✅ Immer aktuelle Daten
- ✅ Automatisch für alle Actions

**Nachteile:**
- ❌ Zusätzliche API-Calls
- ❌ Performance-Impact
- ❌ Was tun bei gelöschten Personen?

### Lösung 2: Snapshot + ID Hybrid

**Konzept:** Beide Werte speichern mit Timestamp.

```typescript
{
  assignedPerson: {
    id: 123,
    snapshot: {
      firstName: "Max",
      lastName: "Mustermann",
      email: "max@example.com",
      capturedAt: "2025-11-01T12:00:00Z"
    }
  }
}
```

**In Actions:**
```typescript
// Option 1: Snapshot verwenden (schnell, evtl. veraltet)
const name = context.assignedPerson.snapshot.firstName;

// Option 2: Frische Daten laden (langsam, aktuell)
const person = await helpers.getPerson(context.assignedPerson.id);
const name = person.firstName;
```

**Vorteile:**
- ✅ Flexibilität für Action-Entwickler
- ✅ Snapshot als Fallback bei gelöschten Personen
- ✅ Timestamp zeigt Alter der Daten

**Nachteile:**
- ❌ Komplexere Datenstruktur
- ❌ Action-Entwickler müssen Entscheidung treffen

### Lösung 3: Validation-Step

**Konzept:** Vor kritischen Actions (Email, REST API) Validierung durchführen.

```typescript
// In Action-Konfiguration:
{
  type: 'email',
  validatePersonData: true,  // Optional
  config: {
    to: '{{assignedPerson.email}}'
  }
}
```

**Workflow:**
1. Action wird ausgeführt
2. Wenn `validatePersonData: true`: Prüfe alle Person-Objekte
3. Bei Änderungen: Zeige Warning oder aktualisiere automatisch
4. Führe Action mit aktuellen Daten aus

**Vorteile:**
- ✅ Opt-in: Nur wo nötig
- ✅ User-Kontrolle über Verhalten
- ✅ Warnings bei Inkonsistenzen

**Nachteile:**
- ❌ Zusätzliche Konfiguration
- ❌ Komplexere Action-Logik

### Lösung 4: Cache mit TTL

**Konzept:** Person-Daten mit Time-To-Live cachen.

```typescript
{
  assignedPerson: {
    id: 123,
    data: { firstName: "Max", ... },
    cachedAt: "2025-11-01T12:00:00Z",
    ttl: 3600  // 1 Stunde
  }
}
```

**Logik:**
- Wenn `cachedAt + ttl > now`: Verwende Cache
- Sonst: Lade neu und aktualisiere Cache

**Vorteile:**
- ✅ Balance zwischen Performance und Aktualität
- ✅ Automatisch
- ✅ Konfigurierbar

**Nachteile:**
- ❌ Komplexere Implementierung
- ❌ Immer noch Inkonsistenz-Fenster

## Empfehlung für zukünftige Implementierung

**Kurzfristig (aktuell):**
- ✅ Vollständiges Person-Objekt speichern
- ✅ Dokumentation des Problems
- ✅ Hinweis in User-Dokumentation

**Mittelfristig:**
- Implementierung von **Lösung 2 (Snapshot + ID Hybrid)**
- Grund: Beste Balance zwischen Einfachheit und Flexibilität

**Langfristig:**
- Zusätzlich **Lösung 3 (Validation-Step)** für kritische Actions
- Grund: User-Kontrolle und Transparenz

## Betroffene Dateien

- `src/components/common/PersonSelector.vue` - Emittiert Person-Objekt
- `src/stores/execution.ts` - Speichert Person-Objekt in context.variables
- `src/actions/email/EmailExecute.vue` - Verwendet Person-Daten
- `src/actions/rest-api/RestApiExecute.vue` - Verwendet Person-Daten
- `src/utils/template-interpolation.ts` - Interpoliert Person-Felder

## Status

- **Aktuell:** Problem dokumentiert, keine Lösung implementiert
- **Priorität:** Niedrig (für MVP akzeptabel)
- **Nächster Review:** Nach ersten Produktiv-Einsätzen

## Siehe auch

- [PERSON_FIELD_IMPLEMENTATION.md](./PERSON_FIELD_IMPLEMENTATION.md) - Implementierungsdetails
- [persistierung-konzept-v2.md](./persistierung-konzept-v2.md) - Persistierung von Execution-Daten
