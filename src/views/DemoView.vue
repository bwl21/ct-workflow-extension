<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useWorkflowStore } from '@/stores/workflow';
import WorkflowEditor from '@/components/workflow/WorkflowEditor.vue';
import WorkflowExecutor from '@/components/workflow/WorkflowExecutor.vue';
import { NodeType, FieldType } from '@/types/workflow.types';
import type { Workflow, WorkflowNode } from '@/types/workflow.types';

const workflowStore = useWorkflowStore();
const activeTab = ref<'editor' | 'executor'>('editor');

function createExampleWorkflow() {
  // Demo setup is deprecated with Backend-First architecture
  alert('Demo-Daten sind nicht mehr verfügbar. Erstelle Workflows manuell in der Admin-Ansicht.');
  return;
  
  // Create example workflow
  const workflow: Workflow = {
    id: 0 as any, // generateId(),
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

  // Task 3: Interests
  const taskInterests = {
    id: 'node-interests',
    type: NodeType.TASK,
    label: 'Interessen',
    description: 'Erzähle uns von deinen Interessen',
    position: { x: 700, y: 200 },
    data: {
      fields: [
        {
          name: 'interests',
          label: 'Deine Interessen',
          type: FieldType.TEXTAREA,
          required: false,
          placeholder: 'Musik, Sport, ...',
        },
        {
          name: 'newsletter',
          label: 'Newsletter abonnieren',
          type: FieldType.CHECKBOX,
          required: false,
        },
      ],
    },
  } as WorkflowNode;

  // End Node
  const endNode = {
    id: 'node-end',
    type: NodeType.END,
    label: 'Fertig',
    position: { x: 900, y: 200 },
    data: {},
  } as WorkflowNode;

  // Add nodes
  workflow.definition.nodes = [startNode, taskPersonal, taskAddress, taskInterests, endNode];

  // Add edges
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
      target: 'node-interests',
    },
    {
      id: 'edge-4',
      source: 'node-interests',
      target: 'node-end',
    },
  ];

  // Add to store
  workflowStore.workflows.push(workflow);
  workflowStore.setCurrentWorkflow(workflow.id);

  // Save to localStorage
  localStorage.setItem('workflows', JSON.stringify(workflowStore.workflows));

  alert('Beispiel-Workflow erstellt!');
}

function clearAllWorkflows() {
  alert('Diese Funktion ist mit Backend-First Architektur nicht mehr verfügbar.');
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

onMounted(() => {
  // Workflows are now loaded from backend automatically
});
</script>

<template>
  <div class="demo-view">
    <!-- Header -->
    <div class="demo-header">
      <h1>Workflow-Assistent Demo</h1>
      <div class="demo-actions">
        <button class="ct-btn ct-btn-secondary" @click="createExampleWorkflow">
          📝 Beispiel-Workflow erstellen
        </button>
        <button class="ct-btn ct-btn-secondary" @click="clearAllWorkflows">🗑️ Alle löschen</button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="demo-tabs">
      <button
        :class="['tab-button', { active: activeTab === 'editor' }]"
        @click="activeTab = 'editor'"
      >
        🎨 Editor (Admin)
      </button>
      <button
        :class="['tab-button', { active: activeTab === 'executor' }]"
        @click="activeTab = 'executor'"
      >
        ▶️ Ausführung (Benutzer)
      </button>
    </div>

    <!-- Content -->
    <div class="demo-content">
      <WorkflowEditor v-if="activeTab === 'editor'" />
      <WorkflowExecutor v-else />
    </div>

    <!-- Info Box -->
    <div class="info-box">
      <h3>ℹ️ Hinweise</h3>
      <ul>
        <li><strong>Editor:</strong> Erstelle und bearbeite Workflows mit Drag & Drop</li>
        <li><strong>Ausführung:</strong> Führe Workflows Schritt für Schritt aus</li>
        <li><strong>Speicherung:</strong> Workflows werden im localStorage gespeichert</li>
        <li>
          <strong>Beispiel:</strong> Klicke auf "Beispiel-Workflow erstellen" für einen
          vorkonfigurierten Workflow
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.demo-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.demo-header {
  background: var(--ct-primary);
  color: #fff;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.demo-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.demo-actions {
  display: flex;
  gap: 0.5rem;
}

.demo-tabs {
  display: flex;
  background: #fff;
  border-bottom: 2px solid #ddd;
}

.tab-button {
  padding: 1rem 2rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  color: #666;
  transition: all 0.2s;
  border-bottom: 3px solid transparent;
}

.tab-button:hover {
  background: #f5f5f5;
  color: #333;
}

.tab-button.active {
  color: var(--ct-primary);
  border-bottom-color: var(--ct-primary);
}

.demo-content {
  flex: 1;
  background: #fff;
  overflow: hidden;
}

.info-box {
  background: #e3f2fd;
  padding: 1rem 2rem;
  border-top: 1px solid #90caf9;
}

.info-box h3 {
  margin: 0 0 0.5rem;
  color: #1976d2;
}

.info-box ul {
  margin: 0;
  padding-left: 1.5rem;
}

.info-box li {
  margin-bottom: 0.25rem;
  color: #1565c0;
}
</style>
