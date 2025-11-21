# ChurchTools API Action - Verbesserungen

## Übersicht

Die ChurchToolsApi Action wurde mit mehreren Features erweitert, um die Arbeit mit der ChurchTools API zu vereinfachen.

## Neue Features

### 1. Response-Variable konfigurierbar

**Problem:** Response wurde immer als `lastApiResponse` gespeichert.

**Lösung:** Konfigurierbarer Variablenname im Feld "Response speichern als".

**Verwendung:**
- Response speichern als: `createdPerson`
- In folgenden Schritten: `{{createdPerson.id}}`, `{{createdPerson.firstName}}`

**Default:** `lastApiResponse` (wenn leer)

### 2. Alle Endpoints aus OpenAPI-Spezifikation

**Problem:** Nur 10 hardcodierte Endpoints verfügbar.

**Lösung:** Alle 423 Endpoints werden aus `/system/runtime/swagger/openapi.json` geladen.

**Features:**
- Automatisches Laden beim ersten Aufruf
- Caching (nur einmal pro Session)
- Vite-Proxy für CORS im Dev-Mode

**Service:** `OpenApiService` (`src/services/OpenApiService.ts`)

### 3. Searchable Dropdown für Endpoints

**Problem:** Datalist zeigt nur ~100 Einträge.

**Lösung:** Custom Dropdown mit Suchfunktion.

**Features:**
- 📋 Button zum Öffnen
- Suchfeld mit Echtzeit-Filterung
- Zeigt erste 50 Endpoints (oder 50 gefilterte)
- Click zum Auswählen
- ESC zum Schließen

### 4. PlaceholderDropdown im JSON-Body

**Problem:** Platzhalter mussten manuell eingegeben werden.

**Lösung:** Dropdown-Button neben "Request Body (JSON)" Label.

**Features:**
- Zeigt alle verfügbaren Variablen
- Unterstützt verschachtelte Properties (`person.street`)
- Fügt Platzhalter an Cursor-Position ein

### 5. Platzhalter in URLs

**Problem:** Nur einfache Variablen (`{{varName}}`) funktionierten.

**Lösung:** Unterstützung für verschachtelte Properties.

**Beispiele:**
- `/persons/{{person.id}}`
- `/groups/{{apiResponse.data.id}}/members`

### 6. Platzhalter in JSON-Body

**Problem:** Platzhalter wurden nach JSON-Parsing interpoliert → Fehler.

**Lösung:** Interpolation **vor** JSON-Parsing.

**Jetzt möglich:**
```json
{
  "personId": {{person.id}},
  "name": "{{person.firstName}}"
}
```

## Technische Details

### OpenApiService

**Caching-Strategie:**
- Singleton-Instanz
- Lädt einmal beim ersten Aufruf
- Speichert Endpoints im Memory
- Verhindert doppeltes Laden (Promise-Tracking)

**CORS-Lösung:**
- Dev-Mode: Vite-Proxy (`vite.config.ts`)
- Production: Direct Fetch (same-origin)

### Template-Interpolation

**Reihenfolge:**
1. Interpoliere Platzhalter im String
2. Parse JSON
3. Sende Request

**Unterstützt:**
- Einfache Variablen: `{{name}}`
- Verschachtelte Properties: `{{person.street}}`
- Arrays: `{{items.0.name}}`

## Geänderte Dateien

- `src/actions/churchtools/ChurchToolsApiConfig.vue`
- `src/actions/churchtools/ChurchToolsApiExecute.vue`
- `src/services/OpenApiService.ts` (neu)
- `vite.config.ts`

## Bekannte Einschränkungen

- OpenAPI-Spezifikation muss verfügbar sein
- Endpoints werden nur beim App-Start geladen (kein Auto-Refresh)
- Platzhalter müssen im Context existieren (sonst bleiben sie unverändert)
