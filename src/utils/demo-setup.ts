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
  if (workflowStore.workflows.length > 0) {
    // Grant permissions for existing workflows
    workflowStore.workflows.forEach((workflow) => {
      userStore.grantPermission(workflow.id, userStore.currentUser.id, true, true);
    });
    return;
  }

  // Create example workflow
  const workflow = {
    id: generateId(),
    name: 'Mitgliederaufnahme',
    description: 'Beispiel-Workflow für die Aufnahme neuer Mitglieder',
    nodes: [],
    edges: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Workflow;

  // Start Node
  const startNode = {
    id: 'node-start',
    type: NodeType.START,
    label: 'Start',
    position: { x: 100, y: 200 },
    data: {},
  } as WorkflowNode;

  // Task 1: Personal Data
  const taskPersonal = {
    id: 'node-personal',
    type: NodeType.TASK,
    label: 'Persönliche Daten',
    description: 'Bitte gib deine persönlichen Daten ein',
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

  // Task 2: Address
  const taskAddress = {
    id: 'node-address',
    type: NodeType.TASK,
    label: 'Adresse',
    description: 'Bitte gib deine Adresse ein',
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

  // Add nodes
  workflow.nodes = [startNode, taskPersonal, taskAddress, endNode];

  // Add edges
  workflow.edges = [
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

  // Add to store
  workflowStore.workflows.push(workflow);

  // Grant permission to current user
  userStore.grantPermission(workflow.id, userStore.currentUser.id, true, true);

  // Save to localStorage
  localStorage.setItem('workflows', JSON.stringify(workflowStore.workflows));

  console.log('✓ Demo workflow created and permissions granted');
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
