# Person Address Fields

## Übersicht

Personen-Objekte enthalten jetzt Adressfelder (Straße, PLZ, Ort), die über Platzhalter in Workflows verwendet werden können.

## Neue Felder

- `street` - Straße
- `zip` - PLZ
- `city` - Ort

## Verfügbare Platzhalter

```
{{person.street}}  → Straße
{{person.zip}}     → PLZ
{{person.city}}    → Ort
```

## Verwendung

### In ChurchToolsApi Action

**JSON Body:**
```json
{
  "personId": {{person.id}},
  "street": "{{person.street}}",
  "zip": "{{person.zip}}",
  "city": "{{person.city}}"
}
```

**URL:**
```
/persons/{{person.id}}/address
```

### In E-Mail-Templates

```
Hallo {{person.firstName}},

Ihre Adresse:
{{person.street}}
{{person.zip}} {{person.city}}
```

## PlaceholderDropdown

Die Felder erscheinen automatisch im Dropdown mit deutschen Labels.

## Implementierung

**Geänderte Dateien:**
- `src/services/PersonService.ts` - Interface erweitert
- `src/components/workflow/PlaceholderDropdown.vue` - Labels hinzugefügt
- `src/utils/template-interpolation.ts` - Properties hinzugefügt
