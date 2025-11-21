# Agent-Richtlinien für dieses Projekt

## Dokumentation

### Speicherort
Alle Dokumentationsdateien MÜSSEN im Verzeichnis `/docs` erstellt werden.

**Richtig:**
```
/docs/FEATURE_NAME.md
/docs/API_DOCUMENTATION.md
/docs/MIGRATION_GUIDE.md
```

**Falsch:**
```
/FEATURE_NAME.md
/API_DOCUMENTATION.md
/MIGRATION_GUIDE.md
```

### Unterverzeichnisse für zusammenhängende Dokumentation
Wenn mehrere Dokumentationsdateien zu einem Feature/Thema gehören, MÜSSEN diese in einem Unterverzeichnis organisiert werden.

**Richtig:**
```
/docs/template-interpolation/
  ├── README.md                    # Übersicht
  ├── FEATURE_SPEC.md             # Feature-Spezifikation
  ├── IMPLEMENTATION.md           # Implementierungsplan
  └── UI_UX.md                    # UI/UX Spezifikation
```

**Falsch:**
```
/docs/TEMPLATE_INTERPOLATION.md
/docs/IMPLEMENTATION_TEMPLATE_INTERPOLATION.md
/docs/UI_UX_TEMPLATE_INTERPOLATION.md
```

**Regel:** Ab 3 zusammenhängenden Dokumenten → Unterverzeichnis erstellen

### Ausnahmen
Nur folgende Dateien dürfen im Root-Verzeichnis bleiben:
- `README.md` - Projekt-Übersicht
- `AGENTS.md` - Diese Datei
- `GITHUB-SETUP.md` - GitHub-spezifische Anleitung
- `prompt-for-*.md` - Prompt-Dateien für verschiedene Tools

## Weitere Richtlinien

(Hier können weitere projektspezifische Richtlinien für Agents ergänzt werden)

### Code-Stil
- TypeScript strict mode verwenden
- Vue 3 Composition API bevorzugen
- Konsistente Namenskonventionen einhalten

### Dependencies Management
**KRITISCH:** Beim Hinzufügen von Imports MUSS sofort die entsprechende Dependency hinzugefügt werden:

1. **Vor dem Commit prüfen:**
   - Alle neuen `import` Statements identifizieren
   - Für jeden externen Import: `package.json` prüfen, ob Dependency existiert
   - Fehlende Dependencies sofort hinzufügen

2. **Workflow für neue Dependencies:**
   ```bash
   # 1. Code mit Import schreiben
   # 2. Dependency hinzufügen
   npm install <package-name>
   # 3. Build testen
   npm run build
   # 4. Erst dann committen
   ```

3. **Vor jedem Commit MUSS ausgeführt werden:**
   - `npm run build` - muss erfolgreich durchlaufen
   - Nur wenn Build erfolgreich → committen

**Beispiel-Fehler (NIEMALS so):**
- Code mit `import { useQuery } from '@tanstack/vue-query'` schreiben
- Committen ohne `@tanstack/vue-query` in package.json

**Richtig:**
- Code mit Import schreiben
- `npm install @tanstack/vue-query` ausführen
- `npm run build` testen
- Dann committen (inkl. package.json + package-lock.json)

### Commit-Nachrichten
- Co-authored-by: Ona <no-reply@ona.com> hinzufügen
- Konventionen des Repositories befolgen
- **NIEMALS ohne explizite Erlaubnis committen**
- Immer erst fragen: "Soll ich committen?"
- Auch wenn einmal Erlaubnis erteilt wurde, gilt das NICHT für weitere Commits

### Testing
- **ZWINGEND:** Vor JEDEM Commit `npm run build` ausführen
- Build muss erfolgreich sein, sonst NICHT committen
- Bei Build-Fehlern: Ursache beheben, dann erneut testen

## ChurchTools API Integration

### churchtoolsClient Verwendung

**WICHTIG:** Der `churchtoolsClient` aus `@churchtools/churchtools-client` fügt automatisch das `/api` Prefix zu allen Requests hinzu.

**Richtig:**
```typescript
import { churchtoolsClient } from '@churchtools/churchtools-client';

// ✅ Korrekt - wird zu: GET /api/permissions/global
await churchtoolsClient.get('/permissions/global');

// ✅ Korrekt - wird zu: GET /api/whoami
await churchtoolsClient.get('/whoami');

// ✅ Korrekt - wird zu: POST /api/custommodules/123/customdatacategories
await churchtoolsClient.post('/custommodules/123/customdatacategories', data);
```

**Falsch:**
```typescript
// ❌ FALSCH - wird zu: GET /api/api/permissions/global (doppeltes /api)
await churchtoolsClient.get('/api/permissions/global');

// ❌ FALSCH - wird zu: GET /api/api/whoami
await churchtoolsClient.get('/api/whoami');
```

**Regel:** Beim Verwenden von `churchtoolsClient` NIEMALS `/api` im Pfad angeben, da es automatisch hinzugefügt wird.

### API-Endpoints

Dokumentierte ChurchTools API-Endpoints für dieses Projekt:

| Endpoint | Methode | Beschreibung | Code-Verwendung |
|----------|---------|--------------|-----------------|
| `/api/whoami` | GET | Aktueller User | `churchtoolsClient.get('/whoami')` |
| `/api/permissions/global` | GET | Globale Permissions | `churchtoolsClient.get('/permissions/global')` |
| `/api/persons` | GET | Personen-Liste | `churchtoolsClient.get('/persons')` |
| `/api/persons/{id}` | GET | Einzelne Person | `churchtoolsClient.get('/persons/123')` |
| `/api/custommodules/{id}/customdatacategories` | GET | Workflow-Kategorien | `churchtoolsClient.get('/custommodules/123/customdatacategories')` |

### Debugging von API-Calls

Bei Problemen mit API-Calls:

1. **Network-Tab prüfen** (Browser DevTools → Network)
   - Suche nach dem Request
   - Prüfe die URL: Ist `/api` doppelt vorhanden?
   - Prüfe Response-Status und Body

2. **Console-Logs hinzufügen:**
   ```typescript
   console.log('[Service] Calling API...');
   const response = await churchtoolsClient.get('/endpoint');
   console.log('[Service] Response:', response);
   ```

3. **Häufige Fehler:**
   - `404 Not Found` → Falscher Pfad oder doppeltes `/api`
   - `401 Unauthorized` → User nicht eingeloggt
   - `403 Forbidden` → Fehlende Permissions
