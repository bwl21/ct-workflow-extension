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
