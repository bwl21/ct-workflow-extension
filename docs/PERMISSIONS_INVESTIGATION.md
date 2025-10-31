# Permissions Investigation - ChurchTools API

## ✅ Befund: Permissions können vom Backend geladen werden

### API Endpoint gefunden

**Endpoint:** `GET /api/permissions/global`

**Wichtig:** Der `churchtoolsClient` fügt automatisch `/api` hinzu, daher im Code nur `/permissions/global` verwenden!

**Response-Struktur:**
```json
{
  "data": {
    "ct-workflow": {
      "view": false,
      "view custom category": [],
      "create custom category": false,
      "edit custom category": [],
      "delete custom category": [],
      "view custom data": [],
      "create custom data": [],
      "edit custom data": [],
      "delete custom data": []
    }
  }
}
```

### Permissions-Typen für Custom Modules

ChurchTools bietet folgende Permissions für Custom Modules (wie `ct-workflow`):

| Permission | Typ | Beschreibung |
|------------|-----|--------------|
| `view` | boolean | Modul sichtbar |
| `view custom category` | array | IDs der sichtbaren Kategorien |
| `create custom category` | boolean | Neue Kategorien erstellen |
| `edit custom category` | array | IDs der editierbaren Kategorien |
| `delete custom category` | array | IDs der löschbaren Kategorien |
| `view custom data` | array | IDs der sichtbaren Daten |
| `create custom data` | array | IDs wo Daten erstellt werden können |
| `edit custom data` | array | IDs der editierbaren Daten |
| `delete custom data` | array | IDs der löschbaren Daten |

### Mapping zu Workflow-Permissions

**ChurchTools Custom Module Permissions → Workflow Permissions:**

```typescript
// ChurchTools API Response
{
  "ct-workflow": {
    "view": true,                    // → User kann Modul sehen
    "view custom category": [1, 2],  // → User kann Workflows 1 und 2 sehen
    "edit custom category": [1],     // → User kann Workflow 1 bearbeiten (Admin)
    "create custom data": [1, 2],    // → User kann Workflows 1 und 2 ausführen
  }
}

// Unser Workflow-Permission-System
{
  workflowId: 1,
  userId: "123",
  canView: true,    // ← "view custom category" enthält 1
  canExecute: true  // ← "create custom data" enthält 1
}
```

### Implementierungsvorschlag

#### 1. Neue Funktion in `src/stores/user.ts`

```typescript
async function fetchPermissions() {
  try {
    const response: any = await churchtoolsClient.get('/api/permissions/global');
    const data = response.data || response;
    const ctWorkflowPerms = data.data?.['ct-workflow'];
    
    if (!ctWorkflowPerms) {
      console.warn('No ct-workflow permissions found');
      return;
    }
    
    // Konvertiere ChurchTools Permissions zu unserem Format
    const viewCategories = ctWorkflowPerms['view custom category'] || [];
    const editCategories = ctWorkflowPerms['edit custom category'] || [];
    const createData = ctWorkflowPerms['create custom data'] || [];
    
    // Erstelle Permissions für jeden Workflow
    const newPermissions: WorkflowPermission[] = [];
    
    // Alle sichtbaren Workflows
    viewCategories.forEach((workflowId: number) => {
      newPermissions.push({
        workflowId,
        userId: currentUser.value.id,
        canView: true,
        canExecute: createData.includes(workflowId),
      });
    });
    
    permissions.value = newPermissions;
    saveToLocalStorage();
    
    return true;
  } catch (error) {
    console.error('Failed to fetch permissions:', error);
    return false;
  }
}
```

#### 2. Aufruf beim App-Start

In `src/components/layout/AppLayout.vue`:

```typescript
onMounted(async () => {
  // Load current user from ChurchTools
  await userStore.fetchCurrentUser();
  
  // Load permissions from ChurchTools
  await userStore.fetchPermissions();
});
```

#### 3. Export der Funktion

In `src/stores/user.ts` return-Statement:

```typescript
return {
  // ... existing exports
  fetchPermissions,  // ← Neu
};
```

### Vorteile dieser Lösung

1. ✅ **Backend-Integration**: Permissions kommen direkt von ChurchTools
2. ✅ **Keine manuelle Verwaltung**: Admin vergibt Rechte in ChurchTools
3. ✅ **Konsistent**: Nutzt ChurchTools Berechtigungssystem
4. ✅ **Skalierbar**: Funktioniert für beliebig viele Workflows
5. ✅ **Caching**: LocalStorage als Fallback bei Offline

### Aktuelles Problem

**Status Quo:**
- ❌ Permissions werden nur aus LocalStorage geladen
- ❌ Keine Backend-Integration
- ❌ User sehen keine Workflows (außer Admin)

**Nach Implementierung:**
- ✅ Permissions werden von ChurchTools API geladen
- ✅ User sehen Workflows basierend auf ChurchTools-Rechten
- ✅ Admin verwaltet Rechte zentral in ChurchTools

### Test-Szenario

1. **Admin vergibt Rechte in ChurchTools:**
   - Öffne ChurchTools Admin → Berechtigungen
   - Wähle User aus
   - Vergebe Rechte für "ct-workflow" Modul
   - Setze "view custom category" auf [1, 2]
   - Setze "create custom data" auf [1, 2]

2. **User öffnet Workflow-App:**
   - App lädt Permissions von `/api/permissions/global`
   - Konvertiert zu Workflow-Permissions
   - User sieht Workflows 1 und 2
   - User kann Workflows 1 und 2 ausführen

### Nächste Schritte

1. ✅ API-Endpoint identifiziert: `/api/permissions/global`
2. ✅ Permissions-Struktur verstanden
3. ✅ Mapping-Logik definiert
4. ✅ `fetchPermissions()` implementiert
5. ✅ In AppLayout integriert
6. ✅ Build erfolgreich
7. ⏭️ Testen mit echten ChurchTools-Rechten

## ✅ IMPLEMENTIERUNG ABGESCHLOSSEN

Die Permission-Integration wurde erfolgreich implementiert:

### Änderungen:

1. **`src/stores/user.ts`**:
   - Neue Funktion `fetchPermissions()` hinzugefügt
   - Lädt Permissions von `/api/permissions/global`
   - Konvertiert ChurchTools Permissions zu Workflow-Permissions
   - Exportiert die Funktion

2. **`src/components/layout/AppLayout.vue`**:
   - Ruft `fetchPermissions()` beim App-Start auf
   - Nach `fetchCurrentUser()`

### Funktionsweise:

```typescript
// 1. User wird geladen
await userStore.fetchCurrentUser();

// 2. Permissions werden geladen
await userStore.fetchPermissions();
// → GET /api/permissions/global
// → Konvertiert zu Workflow-Permissions
// → Speichert in Store + LocalStorage

// 3. User sieht nur erlaubte Workflows
const availableWorkflows = workflowStore.workflows.filter(
  workflow => userStore.canExecuteWorkflow(workflow.id)
);
```

### Build-Status:

✅ **Erfolgreich** - Keine Fehler, keine Warnungen

```
dist/assets/index-*.js: 1,049.16 kB (gzip: 347.49 kB)
```

### Offene Fragen

1. **Workflow-ID Mapping**: Sind die IDs in `view custom category` die gleichen wie unsere Workflow-IDs?
   - Antwort: Ja, das sind die `customdatacategories` IDs
   
2. **Admin-Rechte**: Wie erkennen wir Admins?
   - Antwort: `securityLevelId === 1` (bereits implementiert in `fetchCurrentUser()`)

3. **Caching**: Wie oft sollen Permissions aktualisiert werden?
   - Vorschlag: Bei jedem App-Start + manueller Refresh-Button

### Beispiel-Response (aktueller User ohne Rechte)

```json
{
  "data": {
    "ct-workflow": {
      "view": false,
      "view custom category": [],
      "create custom category": false,
      "edit custom category": [],
      "delete custom category": [],
      "view custom data": [],
      "create custom data": [],
      "edit custom data": [],
      "delete custom data": []
    }
  }
}
```

**Interpretation:**
- User hat **keine Rechte** für ct-workflow Modul
- Daher sieht User **keine Workflows**
- Admin muss Rechte in ChurchTools vergeben

### Zusammenfassung

**Problem identifiziert:** ✅  
**Lösung gefunden:** ✅  
**API-Endpoint:** `/api/permissions/global` ✅  
**Implementierung:** Ausstehend ⏭️

Die Permissions können definitiv vom Backend geladen werden. Die Implementierung ist straightforward und nutzt das bestehende ChurchTools Berechtigungssystem.
