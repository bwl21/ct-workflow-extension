# Debug: Keine ausführbaren Workflows angezeigt

## Problem

User sieht keine ausführbaren Workflows, obwohl `fetchPermissions()` implementiert ist.

## Debug-Schritte

### 1. Browser Console öffnen

Öffne die App und schaue in die Browser Console (F12).

### 2. Prüfe die Logs

Nach dem App-Start solltest du folgende Logs sehen:

```
[userStore] Fetching permissions from ChurchTools API...
[userStore] ChurchTools permissions: {...}
[userStore] Loaded permissions: [...]
```

### 3. Prüfe LocalStorage

In der Browser Console:

```javascript
// User prüfen
JSON.parse(localStorage.getItem('currentUser'))

// Permissions prüfen
JSON.parse(localStorage.getItem('permissions'))
```

### 4. Prüfe Workflows

```javascript
// In Browser Console (wenn Vue DevTools installiert)
// Oder direkt in der App Console:
console.log('Workflows:', workflowStore.workflows)
console.log('Permissions:', userStore.permissions)
console.log('Current User:', userStore.currentUser)
```

### 5. Prüfe API-Response

```javascript
// In Browser Console
fetch('https://testbernhard.church.tools/api/permissions/global')
  .then(r => r.json())
  .then(data => console.log('API Response:', data.data['ct-workflow']))
```

## Mögliche Ursachen

### Ursache 1: Keine Workflows vorhanden

**Symptom:** `workflowStore.workflows` ist leer

**Lösung:** 
- Als Admin einloggen
- Workflows erstellen
- Workflows sollten in ChurchTools Custom Module gespeichert werden

### Ursache 2: Keine Permissions vom Backend

**Symptom:** API gibt leere Arrays zurück:
```json
{
  "view custom category": [],
  "create custom data": []
}
```

**Lösung:**
- In ChurchTools Admin → Berechtigungen
- User auswählen
- "ct-workflow" Modul finden
- Rechte vergeben:
  - "view custom category" → Workflow-IDs eingeben (z.B. [1, 2])
  - "create custom data" → Workflow-IDs eingeben (z.B. [1, 2])

### Ursache 3: User-ID stimmt nicht überein

**Symptom:** Permissions werden geladen, aber `canExecuteWorkflow()` gibt `false` zurück

**Problem:** 
```typescript
const permission = permissions.value.find(
  (p) => p.workflowId === workflowId && p.userId === currentUser.value.id
);
```

Die `userId` in den Permissions muss mit `currentUser.value.id` übereinstimmen.

**Prüfen:**
```javascript
// In Browser Console
const user = JSON.parse(localStorage.getItem('currentUser'))
const perms = JSON.parse(localStorage.getItem('permissions'))
console.log('User ID:', user.id)
console.log('Permission User IDs:', perms.map(p => p.userId))
```

**Lösung:** 
- Wenn User-IDs nicht übereinstimmen, liegt ein Bug in `fetchPermissions()` vor
- Die Funktion sollte `currentUser.value.id` verwenden

### Ursache 4: Workflow-IDs stimmen nicht überein

**Symptom:** Permissions sind vorhanden, aber für andere Workflow-IDs

**Prüfen:**
```javascript
const workflows = workflowStore.workflows
const perms = JSON.parse(localStorage.getItem('permissions'))
console.log('Workflow IDs:', workflows.map(w => w.id))
console.log('Permission Workflow IDs:', perms.map(p => p.workflowId))
```

**Problem:** ChurchTools Custom Category IDs ≠ Workflow IDs in der App

**Lösung:** Sicherstellen, dass die IDs übereinstimmen

### Ursache 5: fetchPermissions() wird nicht aufgerufen

**Symptom:** Keine Logs von `fetchPermissions()` in der Console

**Prüfen:**
- Ist `fetchPermissions()` in `AppLayout.vue` `onMounted()` aufgerufen?
- Gibt es einen Fehler beim API-Call?

**Lösung:**
- Prüfe Network-Tab im Browser (F12 → Network)
- Suche nach Request zu `/api/permissions/global`
- Prüfe Response

### Ursache 6: Login-Problem

**Symptom:** User ist nicht eingeloggt

**Prüfen:**
```javascript
// In Browser Console
fetch('https://testbernhard.church.tools/api/whoami')
  .then(r => r.json())
  .then(data => console.log('Whoami:', data))
```

**Lösung:**
- Prüfe `.env` Datei: `VITE_USERNAME` und `VITE_PASSWORD` korrekt?
- Prüfe `src/main.ts`: Login-Code wird ausgeführt?

## Schnell-Check Checkliste

- [ ] Browser Console öffnen (F12)
- [ ] Logs von `fetchPermissions()` sichtbar?
- [ ] API-Call zu `/api/permissions/global` erfolgreich?
- [ ] `permissions` Array nicht leer?
- [ ] `workflowStore.workflows` nicht leer?
- [ ] User-IDs stimmen überein?
- [ ] Workflow-IDs stimmen überein?
- [ ] User ist eingeloggt (`/api/whoami` funktioniert)?

## Erwartetes Verhalten

### Erfolgreicher Flow:

1. **App startet**
   ```
   [userStore] Fetching permissions from ChurchTools API...
   ```

2. **API-Call erfolgreich**
   ```
   [userStore] ChurchTools permissions: {
     "view custom category": [1, 2],
     "create custom data": [1, 2]
   }
   ```

3. **Permissions konvertiert**
   ```
   [userStore] Loaded permissions: [
     { workflowId: 1, userId: "123", canView: true, canExecute: true },
     { workflowId: 2, userId: "123", canView: true, canExecute: true }
   ]
   ```

4. **UserView berechnet verfügbare Workflows**
   ```
   [UserView] Total workflows: 2
   [UserView] Workflow 1 (Test Workflow): canExecute=true
   [UserView] Workflow 2 (Another Workflow): canExecute=true
   [UserView] Available workflows: 2
   ```

5. **User sieht Workflows** ✅

## Nächste Schritte

1. Öffne die App im Browser
2. Öffne Browser Console (F12)
3. Kopiere alle Logs und sende sie mir
4. Führe die Schnell-Checks durch
5. Teile die Ergebnisse

Dann können wir das Problem genau identifizieren!
