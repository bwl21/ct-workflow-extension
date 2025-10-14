import type { WorkflowDefinition } from '@/types/workflow.types';
import { NodeType } from '@/types/workflow.types';

/**
 * Interpoliert {{variableName}} mit Werten aus Context
 * 
 * @param template - Template-String mit Platzhaltern
 * @param context - Objekt mit Variablen
 * @returns Interpolierter String
 * 
 * @example
 * interpolate("Hallo {{name}}", { name: "Max" })
 * // => "Hallo Max"
 */
export function interpolate(
  template: string | undefined,
  context: Record<string, any>
): string {
  if (!template) return '';
  
  return template.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
    const value = context[variableName];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Extrahiert alle Platzhalter aus einem Template
 * 
 * @param template - Template-String
 * @returns Array mit Variablennamen
 * 
 * @example
 * extractPlaceholders("Hallo {{name}}, {{email}}")
 * // => ["name", "email"]
 */
export function extractPlaceholders(template: string): string[] {
  const matches = template.matchAll(/\{\{(\w+)\}\}/g);
  return Array.from(matches, m => m[1]);
}

/**
 * Sammelt alle verfügbaren Variablen aus vorherigen Tasks UND dem aktuellen Task
 * 
 * @param workflow - Workflow-Definition
 * @param currentNodeId - ID des aktuellen Nodes
 * @returns Array mit verfügbaren Variablennamen (sortiert)
 * 
 * @example
 * getAvailableVariables(workflow, "task2")
 * // => ["email", "name", "phone"]
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
      });
    }
  }
  
  // Auch Felder des aktuellen Nodes hinzufügen (für Beschreibung und defaultValues)
  if (currentIndex >= 0) {
    const currentNode = nodes[currentIndex];
    if (currentNode.type === NodeType.TASK && currentNode.data.fields) {
      currentNode.data.fields.forEach(field => {
        variables.add(field.name);
      });
    }
  }
  
  return Array.from(variables).sort();
}
