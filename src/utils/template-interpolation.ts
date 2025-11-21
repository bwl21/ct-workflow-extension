import type { WorkflowDefinition } from '@/types/workflow.types';
import { NodeType, FieldType } from '@/types/workflow.types';

/**
 * Interpoliert {{variableName}} oder {{object.property}} mit Werten aus Context
 * 
 * @param template - Template-String mit Platzhaltern
 * @param context - Objekt mit Variablen
 * @returns Interpolierter String
 * 
 * @example
 * interpolate("Hallo {{name}}", { name: "Max" })
 * // => "Hallo Max"
 * 
 * interpolate("Hallo {{person.firstName}}", { person: { firstName: "Max" } })
 * // => "Hallo Max"
 */
export function interpolate(
  template: string | undefined,
  context: Record<string, any>
): string {
  if (!template) return '';
  
  // Unterstützt {{variable}} und {{object.property}} und {{object.nested.property}}
  return template.replace(/\{\{([\w.]+)\}\}/g, (match, path) => {
    const value = getNestedValue(context, path);
    return value !== undefined && value !== null ? String(value) : match;
  });
}

/**
 * Holt einen Wert aus einem verschachtelten Objekt über einen Pfad
 * 
 * @param obj - Objekt
 * @param path - Pfad als String (z.B. "person.firstName")
 * @returns Wert oder undefined
 * 
 * @example
 * getNestedValue({ person: { firstName: "Max" } }, "person.firstName")
 * // => "Max"
 */
function getNestedValue(obj: Record<string, any>, path: string): any {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[key];
  }
  
  return current;
}

/**
 * Extrahiert alle Platzhalter aus einem Template
 * 
 * @param template - Template-String
 * @returns Array mit Variablennamen (inkl. verschachtelte Pfade)
 * 
 * @example
 * extractPlaceholders("Hallo {{name}}, {{email}}")
 * // => ["name", "email"]
 * 
 * extractPlaceholders("Hallo {{person.firstName}}, {{person.email}}")
 * // => ["person.firstName", "person.email"]
 */
export function extractPlaceholders(template: string): string[] {
  const matches = template.matchAll(/\{\{([\w.]+)\}\}/g);
  return Array.from(matches, m => m[1]);
}

/**
 * Sammelt alle verfügbaren Variablen aus vorherigen Tasks UND dem aktuellen Task
 * Für Person-Felder werden auch die Objekt-Properties hinzugefügt
 * 
 * @param workflow - Workflow-Definition
 * @param currentNodeId - ID des aktuellen Nodes
 * @returns Array mit verfügbaren Variablennamen (sortiert)
 * 
 * @example
 * getAvailableVariables(workflow, "task2")
 * // => ["email", "name", "phone", "assignedPerson.firstName", "assignedPerson.email"]
 */
export function getAvailableVariables(
  workflow: WorkflowDefinition,
  currentNodeId: string
): string[] {
  const variables = new Set<string>();
  const nodes = workflow.nodes;
  const currentIndex = nodes.findIndex(n => n.id === currentNodeId);
  
  // Durchlaufe alle Nodes vor dem aktuellen
  for (let i = 0; i < currentIndex; i++) {
    const node = nodes[i];
    if (node.type === NodeType.TASK && node.data.fields) {
      // Sammle alle Feldnamen
      node.data.fields.forEach(field => {
        variables.add(field.name);
        
        // Für Person-Felder: Füge auch die Objekt-Properties hinzu
        if (field.type === FieldType.PERSON || field.type === FieldType.PERSON_MULTI) {
          addPersonProperties(field.name, variables);
        }
      });
    }
  }
  
  // Auch Felder des aktuellen Nodes hinzufügen (für Beschreibung und defaultValues)
  if (currentIndex >= 0) {
    const currentNode = nodes[currentIndex];
    if (currentNode.type === NodeType.TASK && currentNode.data.fields) {
      currentNode.data.fields.forEach(field => {
        variables.add(field.name);
        
        // Für Person-Felder: Füge auch die Objekt-Properties hinzu
        if (field.type === FieldType.PERSON || field.type === FieldType.PERSON_MULTI) {
          addPersonProperties(field.name, variables);
        }
      });
    }
  }
  
  return Array.from(variables).sort();
}

/**
 * Fügt alle verfügbaren Person-Objekt-Properties zu den Variablen hinzu
 * 
 * @param fieldName - Name des Person-Feldes
 * @param variables - Set zum Hinzufügen der Properties
 */
function addPersonProperties(fieldName: string, variables: Set<string>): void {
  // Verfügbare Properties aus PersonService.ts
  const personProperties = [
    'id',
    'firstName',
    'lastName',
    'nickname',
    'email',
    'imageUrl',
    'street',
    'zip',
    'city'
  ];
  
  personProperties.forEach(prop => {
    variables.add(`${fieldName}.${prop}`);
  });
}
