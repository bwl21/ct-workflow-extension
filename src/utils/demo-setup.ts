import { useWorkflowStore } from '@/stores/workflow';
import { useUserStore } from '@/stores/user';
import type { Workflow, WorkflowNode } from '@/types/workflow.types';
import { NodeType, FieldType } from '@/types/workflow.types';

/**
 * Setup demo data for testing
 */
export function setupDemoData() {
  const workflowStore = useWorkflowStore();
  const userStore = useUserStore();

  // Only setup if no workflows exist
  const allWorkflows = workflowStore.getAllWorkflows();
  if (allWorkflows.length > 0) {
    // Grant permissions for existing workflows
    allWorkflows.forEach((workflow) => {
      userStore.grantPermission(workflow.id, userStore.currentUser.id, true, true);
    });
    return;
  }

  // Create example workflow with V2 structure
  const workflowId = generateId();
  const workflow: Workflow = {
    id: workflowId,
    name: 'Mitgliederaufnahme',
    description: 'Beispiel-Workflow für die Aufnahme neuer Mitglieder',
    category: 'Mitgliederverwaltung',
    definition: {
      version: '1.0.0',
      nodes: [],
      edges: [],
      metadata: {
        description: 'Beispiel-Workflow für die Aufnahme neuer Mitglieder',
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Start Node
  const startNode = {
    id: 'node-start',
    type: NodeType.START,
    label: 'Start',
    position: { x: 100, y: 200 },
    data: {},
  } as WorkflowNode;

  // Task 1: Personal Data (mit Markdown und Live-Interpolation)
  const taskPersonal = {
    id: 'node-personal',
    type: NodeType.TASK,
    label: 'Persönliche Daten',
    description: `# Willkommen {{firstName}} {{lastName}}!

Bitte vervollständigen Sie Ihre **persönlichen Daten** für die Mitgliederaufnahme.

## Was wir benötigen:
- Vorname und Nachname
- E-Mail-Adresse für die Kommunikation

*Alle Daten werden vertraulich behandelt.*`,
    position: { x: 300, y: 200 },
    data: {
      fields: [
        {
          name: 'firstName',
          label: 'Vorname',
          type: FieldType.TEXT,
          required: true,
          placeholder: 'Max',
        },
        {
          name: 'lastName',
          label: 'Nachname',
          type: FieldType.TEXT,
          required: true,
          placeholder: 'Mustermann',
        },
        {
          name: 'email',
          label: 'E-Mail',
          type: FieldType.EMAIL,
          required: true,
          placeholder: 'max@example.com',
        },
      ],
    },
  } as WorkflowNode;

  // Task 2: Address (mit Markdown, Template-Interpolation und langem Text)
  const taskAddress = {
    id: 'node-address',
    type: NodeType.TASK,
    label: 'Adresse',
    description: `## Hallo {{firstName}} {{lastName}}!

Vielen Dank für Ihre Registrierung! 

### Ihre bisherigen Angaben:
- **Name:** {{firstName}} {{lastName}}
- **E-Mail:** {{email}}

### Nächster Schritt: Adressdaten

Um Ihre Mitgliedschaft zu vervollständigen, benötigen wir noch Ihre **Adressdaten**. 

> Diese Informationen werden vertraulich behandelt und nur für administrative Zwecke verwendet.

Bitte geben Sie Ihre vollständige Adresse ein:`,
    position: { x: 500, y: 200 },
    data: {
      fields: [
        {
          name: 'street',
          label: 'Straße',
          type: FieldType.TEXT,
          required: true,
          placeholder: 'Musterstraße 123',
        },
        {
          name: 'city',
          label: 'Stadt',
          type: FieldType.TEXT,
          required: true,
          placeholder: 'Musterstadt',
        },
        {
          name: 'zip',
          label: 'PLZ',
          type: FieldType.TEXT,
          required: true,
          placeholder: '12345',
        },
        {
          name: 'email',
          label: 'E-Mail (Bestätigung)',
          type: FieldType.EMAIL,
          required: true,
          defaultValue: '{{email}}',
        },
      ],
    },
  } as WorkflowNode;

  // End Node
  const endNode = {
    id: 'node-end',
    type: NodeType.END,
    label: 'Fertig',
    position: { x: 700, y: 200 },
    data: {},
  } as WorkflowNode;

  // Add nodes to definition
  workflow.definition.nodes = [startNode, taskPersonal, taskAddress, endNode];

  // Add edges to definition
  workflow.definition.edges = [
    {
      id: 'edge-1',
      source: 'node-start',
      target: 'node-personal',
    },
    {
      id: 'edge-2',
      source: 'node-personal',
      target: 'node-address',
    },
    {
      id: 'edge-3',
      source: 'node-address',
      target: 'node-end',
    },
  ];

  // Add to store using the new structure
  workflowStore.addWorkflow(workflow);

  // Grant permission to current user
  userStore.grantPermission(workflow.id, userStore.currentUser.id, true, true);

  console.info('✓ Demo workflow created and permissions granted');
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
