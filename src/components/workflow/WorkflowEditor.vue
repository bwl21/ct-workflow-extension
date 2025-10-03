<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWorkflowStore } from '@/stores/workflow';
import VueFlowDiagram from './VueFlowDiagram.vue';
import SimpleRulesEditor from './SimpleRulesEditor.vue';
import EdgeEditor from './EdgeEditor.vue';
import type { WorkflowNode, WorkflowEdge } from '@/types/workflow.types';
import { NodeType, FieldType } from '@/types/workflow.types';
import { calculateAutoLayout } from '@/utils/auto-layout';

const workflowStore = useWorkflowStore();

const workflowName = ref('');
const workflowDescription = ref('');
const showCreateDialog = ref(false);
const selectedNode = ref<WorkflowNode | null>(null);
const showNodeEditor = ref(false);
const showEdgeEditor = ref(false);
const selectedEdgeId = ref<string | null>(null);
const showJsonModal = ref(false);
const workflowJson = ref('');
const showEdgeList = ref(false);
const highlightedEdgeId = ref<string | null>(null);
const edgeRefs = ref<Record<string, any>>({});

const currentWorkflow = computed(() => workflowStore.currentWorkflow);

const nodeTypes = [
  { type: NodeType.START, label: 'Start', icon: '▶' },
  { type: NodeType.TASK, label: 'Aufgabe', icon: '📝' },
  { type: NodeType.ACTION, label: 'Aktion', icon: '⚡' },
  { type: NodeType.DECISION, label: 'Entscheidung', icon: '❓' },
  { type: NodeType.END, label: 'Ende', icon: '✓' },
];

function createNewWorkflow() {
  if (!workflowName.value) return;

  const workflow = workflowStore.createWorkflow(workflowName.value, workflowDescription.value);

  // Add default start node
  const startNode: WorkflowNode = {
    id: generateId(),
    type: NodeType.START,
    label: 'Start',
    position: { x: 100, y: 200 },
    data: {},
  };
  workflowStore.addNode(workflow.id, startNode);

  workflowName.value = '';
  workflowDescription.value = '';
  showCreateDialog.value = false;
}

function addNode(type: NodeType) {
  if (!currentWorkflow.value) return;

  // Check if START node already exists
  if (type === NodeType.START) {
    const hasStartNode = currentWorkflow.value.definition.nodes.some(n => n.type === NodeType.START);
    if (hasStartNode) {
      alert('Es kann nur einen Start-Knoten geben!');
      return;
    }
  }

  const lastNode = currentWorkflow.value.definition.nodes[currentWorkflow.value.definition.nodes.length - 1];
  const x = lastNode ? lastNode.position.x + 200 : 100;
  const y = lastNode ? lastNode.position.y : 200;

  const node: WorkflowNode = {
    id: generateId(),
    type,
    label: getDefaultLabel(type),
    position: { x, y },
    data: type === NodeType.TASK 
      ? { fields: [] } 
      : type === NodeType.DECISION
      ? { 
          outputs: [
            {
              id: 'true',
              label: '✓ JA',
              condition: {
                engine: 'simple',
                rule: { conditions: [], logic: 'AND' }
              },
              isDefault: false
            },
            {
              id: 'false',
              label: '✗ NEIN',
              isDefault: true
            }
          ]
        }
      : {},
  };

  workflowStore.addNode(currentWorkflow.value.id, node);

  // Auto-connect to last node
  if (lastNode && lastNode.type !== NodeType.END) {
    workflowStore.addEdge(currentWorkflow.value.id, {
      id: generateId(),
      source: lastNode.id,
      target: node.id,
    });
  }
}

function getDefaultLabel(type: NodeType): string {
  switch (type) {
    case NodeType.START:
      return 'Start';
    case NodeType.TASK:
      return 'Neue Aufgabe';
    case NodeType.ACTION:
      return 'Neue Aktion';
    case NodeType.DECISION:
      return 'Entscheidung';
    case NodeType.END:
      return 'Ende';
    default:
      return 'Knoten';
  }
}

function editNode(node: WorkflowNode) {
  selectedNode.value = { ...node };
  showNodeEditor.value = true;
}

function saveNode() {
  if (!selectedNode.value || !currentWorkflow.value) return;

  workflowStore.updateNode(currentWorkflow.value.id, selectedNode.value.id, selectedNode.value);
  showNodeEditor.value = false;
  selectedNode.value = null;
}

function deleteNode(nodeId: string) {
  if (!currentWorkflow.value) return;
  if (confirm('Knoten wirklich löschen?')) {
    workflowStore.removeNode(currentWorkflow.value.id, nodeId);
  }
}

function addField() {
  if (!selectedNode.value || !selectedNode.value.data.fields) return;

  selectedNode.value.data.fields.push({
    name: `field${selectedNode.value.data.fields.length + 1}`,
    label: 'Neues Feld',
    type: FieldType.TEXT,
    required: false,
  });
}

function removeField(index: number) {
  if (!selectedNode.value || !selectedNode.value.data.fields) return;
  selectedNode.value.data.fields.splice(index, 1);
}

function updateFieldOptions(index: number, value: string) {
  if (!selectedNode.value || !selectedNode.value.data.fields) return;
  const field = selectedNode.value.data.fields[index];
  field.options = value.split('\n').filter(opt => opt.trim() !== '');
}

// Drag and Drop for field sorting
const draggedFieldIndex = ref<number | null>(null);

function onFieldDragStart(index: number) {
  draggedFieldIndex.value = index;
}

function onFieldDragOver(event: DragEvent, index: number) {
  event.preventDefault();
  if (draggedFieldIndex.value === null || draggedFieldIndex.value === index) return;
  
  if (!selectedNode.value || !selectedNode.value.data.fields) return;
  
  const fields = selectedNode.value.data.fields;
  const draggedField = fields[draggedFieldIndex.value];
  
  // Remove from old position
  fields.splice(draggedFieldIndex.value, 1);
  
  // Insert at new position
  fields.splice(index, 0, draggedField);
  
  // Update dragged index
  draggedFieldIndex.value = index;
}

function onFieldDragEnd() {
  draggedFieldIndex.value = null;
}

function moveFieldUp(index: number) {
  if (!selectedNode.value || !selectedNode.value.data.fields || index === 0) return;
  const fields = selectedNode.value.data.fields;
  [fields[index - 1], fields[index]] = [fields[index], fields[index - 1]];
}

function moveFieldDown(index: number) {
  if (!selectedNode.value || !selectedNode.value.data.fields) return;
  const fields = selectedNode.value.data.fields;
  if (index === fields.length - 1) return;
  [fields[index], fields[index + 1]] = [fields[index + 1], fields[index]];
}

function showWorkflowJson() {
  if (!currentWorkflow.value) return;
  workflowJson.value = JSON.stringify(currentWorkflow.value, null, 2);
  showJsonModal.value = true;
}

function copyJsonToClipboard() {
  navigator.clipboard.writeText(workflowJson.value);
  alert('JSON in Zwischenablage kopiert!');
}

function getAvailableFields() {
  if (!currentWorkflow.value || !selectedNode.value) return [];
  
  const fields: Array<{ name: string; label: string; type: string }> = [];
  
  // Collect all fields from previous TASK nodes
  for (const node of currentWorkflow.value.definition.nodes) {
    if (node.type === NodeType.TASK && node.data.fields) {
      for (const field of node.data.fields) {
        fields.push({
          name: field.name,
          label: `${node.label}: ${field.label}`,
          type: field.type,
        });
      }
    }
    
    // Stop at current node
    if (node.id === selectedNode.value.id) break;
  }
  
  return fields;
}

function getNodeLabel(nodeId: string): string {
  if (!currentWorkflow.value) return nodeId;
  const node = currentWorkflow.value.definition.nodes.find(n => n.id === nodeId);
  return node?.label || nodeId;
}

function editEdge(edgeId: string) {
  // Öffne Edge-Liste falls geschlossen
  showEdgeList.value = true;
  
  // Highlight Edge
  highlightedEdgeId.value = edgeId;
  
  // Scroll zur Edge in der Liste
  setTimeout(() => {
    const edgeElement = edgeRefs.value[edgeId];
    if (edgeElement) {
      edgeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
  
  // Entferne Highlight nach 2 Sekunden
  setTimeout(() => {
    highlightedEdgeId.value = null;
  }, 2000);
  
  // Öffne Editor
  selectedEdgeId.value = edgeId;
  showEdgeEditor.value = true;
}

function deleteEdge(edgeId: string) {
  if (!currentWorkflow.value) return;
  if (confirm('Verbindung wirklich löschen?')) {
    workflowStore.removeEdge(currentWorkflow.value.id, edgeId);
  }
}

function saveEdge(edge: WorkflowEdge) {
  if (!currentWorkflow.value) return;
  
  // Find and update the edge
  const edgeIndex = currentWorkflow.value.definition.edges.findIndex(e => e.id === edge.id);
  if (edgeIndex !== -1) {
    currentWorkflow.value.definition.edges[edgeIndex] = edge;
    workflowStore.updateWorkflow(currentWorkflow.value.id, currentWorkflow.value);
  }
  
  showEdgeEditor.value = false;
  selectedEdgeId.value = null;
}

const selectedEdge = computed(() => {
  if (!currentWorkflow.value || !selectedEdgeId.value) return null;
  return currentWorkflow.value.definition.edges.find(e => e.id === selectedEdgeId.value) || null;
});



function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Decision Node Output Management
function initializeDefaultOutputs() {
  if (!selectedNode.value) return;
  
  selectedNode.value.data.outputs = [
    {
      id: 'true',
      label: '✓ JA',
      condition: {
        engine: 'simple',
        rule: { conditions: [], logic: 'AND' }
      },
      isDefault: false
    },
    {
      id: 'false',
      label: '✗ NEIN',
      isDefault: true
    }
  ];
}

function addOutput() {
  if (!selectedNode.value) return;
  
  if (!selectedNode.value.data.outputs) {
    selectedNode.value.data.outputs = [];
  }
  
  const newOutput = {
    id: `output-${generateId()}`,
    label: `Ausgang ${selectedNode.value.data.outputs.length + 1}`,
    condition: {
      engine: 'simple' as const,
      rule: { conditions: [], logic: 'AND' as const }
    },
    isDefault: false
  };
  
  selectedNode.value.data.outputs.push(newOutput);
}

function removeOutput(index: number) {
  if (!selectedNode.value || !selectedNode.value.data.outputs) return;
  if (selectedNode.value.data.outputs.length <= 1) {
    alert('Mindestens ein Ausgang muss vorhanden sein!');
    return;
  }
  
  selectedNode.value.data.outputs.splice(index, 1);
}

function handleNodeClick(nodeId: string) {
  if (!currentWorkflow.value) return;
  const node = currentWorkflow.value.definition.nodes.find(n => n.id === nodeId);
  if (node) {
    editNode(node);
  }
}

function handleNodesChange(updatedNodes: WorkflowNode[]) {
  if (!currentWorkflow.value) return;
  currentWorkflow.value.definition.nodes = updatedNodes;
  workflowStore.updateWorkflow(currentWorkflow.value.id, currentWorkflow.value);
}

function handleEdgeAdd(connection: { source: string; target: string; sourceHandle?: string }) {
  if (!currentWorkflow.value) return;
  
  const newEdge: WorkflowEdge = {
    id: generateId(),
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle,
  };
  
  workflowStore.addEdge(currentWorkflow.value.id, newEdge);
}

function handleEdgeDelete(edgeId: string) {
  if (!currentWorkflow.value) return;
  workflowStore.removeEdge(currentWorkflow.value.id, edgeId);
}

function handleEdgeUpdate(update: { id: string; source: string; target: string; sourceHandle?: string }) {
  if (!currentWorkflow.value) return;
  
  const edgeIndex = currentWorkflow.value.definition.edges.findIndex(e => e.id === update.id);
  if (edgeIndex !== -1) {
    currentWorkflow.value.definition.edges[edgeIndex] = {
      ...currentWorkflow.value.definition.edges[edgeIndex],
      source: update.source,
      target: update.target,
      sourceHandle: update.sourceHandle,
    };
    workflowStore.updateWorkflow(currentWorkflow.value.id, currentWorkflow.value);
  }
}

function applyAutoLayout() {
  if (!currentWorkflow.value) return;
  
  const layoutedNodes = calculateAutoLayout(
    currentWorkflow.value.definition.nodes,
    currentWorkflow.value.definition.edges,
    {
      direction: 'TB', // Top to Bottom
      nodeWidth: 180,
      nodeHeight: 100,
      rankSep: 150, // Mehr vertikaler Abstand
      nodeSep: 150, // Mehr horizontaler Abstand für bessere Verteilung
      align: 'UL', // Upper Left alignment
      ranker: 'network-simplex', // Besserer Algorithmus für komplexe Graphen
    }
  );
  
  currentWorkflow.value.definition.nodes = layoutedNodes;
  workflowStore.updateWorkflow(currentWorkflow.value.id, currentWorkflow.value);
}
</script>

<template>
  <div class="workflow-editor">
    <!-- Header -->
    <div class="editor-header">
      <h2>Workflow-Editor</h2>
      <button v-if="!currentWorkflow" class="ct-btn ct-btn-primary" @click="showCreateDialog = true">
        + Neuer Workflow
      </button>
      <div v-else class="workflow-info">
        <div>
          <h3>{{ currentWorkflow.name }}</h3>
          <p>{{ currentWorkflow.description }}</p>
        </div>
        <div class="header-actions">
          <button class="ct-btn ct-btn-secondary" @click="applyAutoLayout" title="Automatisches Layout anwenden">
            🔄 Auto-Layout
          </button>
          <button class="ct-btn ct-btn-secondary" @click="showWorkflowJson" title="Workflow als JSON anzeigen">
            📋 JSON anzeigen
          </button>
        </div>
      </div>
    </div>

    <!-- Create Dialog -->
    <div v-if="showCreateDialog" class="modal-overlay" @click.self="showCreateDialog = false">
      <div class="modal-content">
        <h3>Neuer Workflow</h3>
        <div class="ct-form-group">
          <label class="ct-form-label">Name</label>
          <input v-model="workflowName" type="text" class="ct-form-control" />
        </div>
        <div class="ct-form-group">
          <label class="ct-form-label">Beschreibung</label>
          <textarea v-model="workflowDescription" class="ct-form-control" rows="3" />
        </div>
        <div class="modal-actions">
          <button class="ct-btn ct-btn-secondary" @click="showCreateDialog = false">Abbrechen</button>
          <button class="ct-btn ct-btn-primary" @click="createNewWorkflow">Erstellen</button>
        </div>
      </div>
    </div>

    <!-- Editor Content -->
    <div v-if="currentWorkflow" class="editor-content">
      <!-- Toolbar -->
      <div class="editor-toolbar">
        <h4>Knoten hinzufügen:</h4>
        <div class="node-palette">
          <button
            v-for="nodeType in nodeTypes"
            :key="nodeType.type"
            class="node-button"
            :title="nodeType.label"
            @click="addNode(nodeType.type)"
          >
            <span class="node-icon">{{ nodeType.icon }}</span>
            <span class="node-label">{{ nodeType.label }}</span>
          </button>
        </div>
      </div>

      <!-- Diagram -->
      <div class="editor-diagram">
        <VueFlowDiagram 
          :definition="currentWorkflow.definition" 
          :readonly="false"
          @node-click="handleNodeClick"
          @edge-click="editEdge"
          @nodes-change="handleNodesChange"
          @edge-add="handleEdgeAdd"
          @edge-delete="handleEdgeDelete"
          @edge-update="handleEdgeUpdate"
        />
      </div>

      <!-- Node & Edge List -->
      <div class="editor-nodes">
        <h4>Knoten ({{ currentWorkflow.definition.nodes.length }})</h4>
        <div class="node-list">
          <div v-for="node in currentWorkflow.definition.nodes" :key="node.id" class="node-item">
            <span class="node-type">{{ node.type }}</span>
            <span class="node-name">{{ node.label }}</span>
            <div class="node-actions">
              <button class="ct-btn ct-btn-sm" @click="editNode(node)">✏️</button>
              <button
                class="ct-btn ct-btn-sm"
                @click="deleteNode(node.id)"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>

        <div class="edge-section">
          <h4 @click="showEdgeList = !showEdgeList" class="collapsible-header">
            <span>{{ showEdgeList ? '▼' : '▶' }} Verbindungen ({{ currentWorkflow.definition.edges.length }})</span>
          </h4>
          <div v-if="showEdgeList" class="edge-list">
            <div 
              v-for="edge in currentWorkflow.definition.edges" 
              :key="edge.id" 
              :ref="el => { if (el) edgeRefs[edge.id] = el }"
              class="edge-item"
              :class="{ 'edge-highlighted': highlightedEdgeId === edge.id }"
            >
              <div class="edge-info">
                <span class="edge-label">
                  {{ getNodeLabel(edge.source) }} → {{ getNodeLabel(edge.target) }}
                </span>
                <span v-if="edge.sourceHandle" class="badge-handle">
                  {{ edge.sourceHandle }}
                </span>
                <span v-if="edge.label" class="badge-label">
                  {{ edge.label }}
                </span>
              </div>
              <div class="edge-actions">
                <button class="ct-btn ct-btn-sm" @click="editEdge(edge.id)" title="Bearbeiten">
                  ⚙️
                </button>
                <button class="ct-btn ct-btn-sm" @click="deleteEdge(edge.id)" title="Löschen">
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Node Editor Dialog -->
    <div v-if="showNodeEditor && selectedNode" class="modal-overlay" @click.self="showNodeEditor = false">
      <div class="modal-content modal-large">
        <h3>Knoten bearbeiten</h3>

        <div class="ct-form-group">
          <label class="ct-form-label">Label</label>
          <input v-model="selectedNode.label" type="text" class="ct-form-control" />
        </div>

        <div class="ct-form-group">
          <label class="ct-form-label">Beschreibung</label>
          <textarea v-model="selectedNode.description" class="ct-form-control" rows="2" />
        </div>

        <!-- Task Fields -->
        <div v-if="selectedNode.type === NodeType.TASK && selectedNode.data.fields" class="task-fields">
          <h4>Formularfelder</h4>
          <div 
            v-for="(field, index) in selectedNode.data.fields" 
            :key="index" 
            class="field-editor"
            :class="{ 'dragging': draggedFieldIndex === index }"
            draggable="true"
            @dragstart="onFieldDragStart(index)"
            @dragover="onFieldDragOver($event, index)"
            @dragend="onFieldDragEnd"
          >
            <div class="field-row">
              <div class="field-number">{{ index + 1 }}</div>
              <div class="drag-handle" title="Ziehen zum Sortieren">
                ⋮⋮
              </div>
              <input v-model="field.name" type="text" class="ct-form-control" placeholder="Feldname" />
              <input v-model="field.label" type="text" class="ct-form-control" placeholder="Label" />
              <select v-model="field.type" class="ct-form-control">
                <optgroup label="Text-Eingaben">
                  <option :value="FieldType.TEXT">Text (einzeilig)</option>
                  <option :value="FieldType.TEXTAREA">Textarea (mehrzeilig)</option>
                  <option :value="FieldType.EMAIL">E-Mail</option>
                  <option :value="FieldType.TEL">Telefon</option>
                  <option :value="FieldType.URL">URL/Webadresse</option>
                </optgroup>
                <optgroup label="Zahlen & Bereiche">
                  <option :value="FieldType.NUMBER">Zahl</option>
                  <option :value="FieldType.RANGE">Schieberegler</option>
                </optgroup>
                <optgroup label="Datum & Zeit">
                  <option :value="FieldType.DATE">Datum</option>
                  <option :value="FieldType.DATETIME">Datum + Uhrzeit</option>
                  <option :value="FieldType.TIME">Uhrzeit</option>
                </optgroup>
                <optgroup label="Auswahl">
                  <option :value="FieldType.SELECT">Dropdown (Einfachauswahl)</option>
                  <option :value="FieldType.MULTISELECT">Mehrfachauswahl</option>
                  <option :value="FieldType.RADIO">Radio-Buttons</option>
                  <option :value="FieldType.CHECKBOX">Checkbox</option>
                </optgroup>
                <optgroup label="Sonstige">
                  <option :value="FieldType.COLOR">Farbauswahl</option>
                  <option :value="FieldType.FILE">Datei-Upload</option>
                </optgroup>
              </select>
              <label>
                <input v-model="field.required" type="checkbox" />
                Pflicht
              </label>
              <div class="field-actions">
                <button 
                  class="ct-btn ct-btn-sm" 
                  @click="moveFieldUp(index)"
                  :disabled="index === 0"
                  title="Nach oben"
                >
                  ↑
                </button>
                <button 
                  class="ct-btn ct-btn-sm" 
                  @click="moveFieldDown(index)"
                  :disabled="index === selectedNode.data.fields.length - 1"
                  title="Nach unten"
                >
                  ↓
                </button>
                <button class="ct-btn ct-btn-sm" @click="removeField(index)" title="Löschen">✕</button>
              </div>
            </div>
            
            <!-- Additional options based on field type -->
            <div class="field-options">
              <!-- Options for SELECT, MULTISELECT, RADIO -->
              <div v-if="[FieldType.SELECT, FieldType.MULTISELECT, FieldType.RADIO].includes(field.type)" class="ct-form-group">
                <label class="ct-form-label">Optionen (eine pro Zeile)</label>
                <textarea 
                  :value="field.options?.join('\n') || ''"
                  @input="updateFieldOptions(index, ($event.target as HTMLTextAreaElement).value)"
                  class="ct-form-control" 
                  rows="3"
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                />
              </div>
              
              <!-- Options for RANGE -->
              <div v-if="field.type === FieldType.RANGE" class="range-options">
                <div class="ct-form-group">
                  <label class="ct-form-label">Min</label>
                  <input v-model.number="field.min" type="number" class="ct-form-control" placeholder="0" />
                </div>
                <div class="ct-form-group">
                  <label class="ct-form-label">Max</label>
                  <input v-model.number="field.max" type="number" class="ct-form-control" placeholder="100" />
                </div>
                <div class="ct-form-group">
                  <label class="ct-form-label">Schritt</label>
                  <input v-model.number="field.step" type="number" class="ct-form-control" placeholder="1" />
                </div>
              </div>
              
              <!-- Options for FILE -->
              <div v-if="field.type === FieldType.FILE" class="file-options">
                <div class="ct-form-group">
                  <label class="ct-form-label">Akzeptierte Dateitypen</label>
                  <input v-model="field.accept" type="text" class="ct-form-control" placeholder=".pdf,.doc,.docx" />
                  <small class="ct-form-text">z.B. .pdf,.doc,.docx oder image/*</small>
                </div>
                <div class="ct-form-group">
                  <label>
                    <input v-model="field.multiple" type="checkbox" />
                    Mehrere Dateien erlauben
                  </label>
                </div>
              </div>
              
              <!-- Placeholder for text inputs -->
              <div v-if="[FieldType.TEXT, FieldType.TEXTAREA, FieldType.EMAIL, FieldType.TEL, FieldType.URL, FieldType.NUMBER].includes(field.type)" class="ct-form-group">
                <label class="ct-form-label">Platzhalter</label>
                <input v-model="field.placeholder" type="text" class="ct-form-control" placeholder="z.B. Bitte eingeben..." />
              </div>
            </div>
          </div>
          <button class="ct-btn ct-btn-secondary ct-btn-sm" @click="addField">+ Feld hinzufügen</button>
        </div>

        <!-- Decision Node -->
        <div v-if="selectedNode.type === NodeType.DECISION" class="decision-config">
          <h4>Ausgänge</h4>
          <p class="info-text">
            Definiere die möglichen Ausgänge dieses Entscheidungsknotens. Jeder Ausgang kann eine Bedingung haben.
          </p>
          
          <div v-if="!selectedNode.data.outputs || selectedNode.data.outputs.length === 0" class="empty-outputs">
            <p>Noch keine Ausgänge definiert. Standard: JA/NEIN</p>
            <button class="ct-btn ct-btn-secondary ct-btn-sm" @click="initializeDefaultOutputs">
              Standard-Ausgänge erstellen
            </button>
          </div>
          
          <div v-else class="outputs-list">
            <div 
              v-for="(output, index) in selectedNode.data.outputs" 
              :key="output.id"
              class="output-item"
            >
              <div class="output-header">
                <span class="output-number">{{ index + 1 }}</span>
                <input 
                  v-model="output.label" 
                  type="text" 
                  class="ct-form-control" 
                  placeholder="Label (z.B. 'Genehmigt')"
                />
                <label class="checkbox-label">
                  <input v-model="output.isDefault" type="checkbox" />
                  Default
                </label>
                <button 
                  class="ct-btn ct-btn-sm" 
                  @click="removeOutput(index)"
                  :disabled="selectedNode.data.outputs.length <= 1"
                  title="Löschen"
                >
                  🗑️
                </button>
              </div>
              
              <div v-if="!output.isDefault && output.condition" class="output-condition">
                <label class="ct-form-label">Bedingung</label>
                <div class="ct-form-group">
                  <select v-model="output.condition.engine" class="ct-form-control">
                    <option value="simple">Einfache Regeln</option>
                    <option value="jsonlogic" disabled>JSONLogic (coming soon)</option>
                    <option value="custom" disabled>Custom Expression (coming soon)</option>
                  </select>
                </div>
                
                <SimpleRulesEditor
                  v-if="output.condition.engine === 'simple'"
                  v-model="output.condition.rule"
                  :available-fields="getAvailableFields()"
                />
              </div>
              
              <div v-else class="default-info">
                ℹ️ Dieser Ausgang wird verwendet, wenn keine andere Bedingung zutrifft
              </div>
            </div>
          </div>
          
          <button class="ct-btn ct-btn-secondary ct-btn-sm" @click="addOutput">
            + Ausgang hinzufügen
          </button>
        </div>

        <div class="modal-actions">
          <button class="ct-btn ct-btn-secondary" @click="showNodeEditor = false">Abbrechen</button>
          <button class="ct-btn ct-btn-primary" @click="saveNode">Speichern</button>
        </div>
      </div>
    </div>

    <!-- Edge Editor Modal -->
    <div v-if="showEdgeEditor && selectedEdge" class="modal-overlay" @click.self="showEdgeEditor = false">
      <div class="modal-content modal-large">
        <EdgeEditor
          :edge="selectedEdge"
          @save="saveEdge"
          @cancel="showEdgeEditor = false; selectedEdgeId = null"
          @delete="deleteEdge(selectedEdge.id); showEdgeEditor = false; selectedEdgeId = null"
        />
      </div>
    </div>

    <!-- JSON Modal -->
    <div v-if="showJsonModal" class="modal-overlay" @click.self="showJsonModal = false">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h3>Workflow JSON</h3>
          <button class="ct-btn ct-btn-secondary" @click="copyJsonToClipboard">
            📋 Kopieren
          </button>
        </div>
        <div class="json-container">
          <pre><code>{{ workflowJson }}</code></pre>
        </div>
        <div class="modal-actions">
          <button class="ct-btn ct-btn-primary" @click="showJsonModal = false">Schließen</button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!currentWorkflow" class="empty-state">
      <p>Erstelle einen neuen Workflow um zu beginnen</p>
    </div>
  </div>
</template>

<style scoped>
.workflow-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-header {
  padding: 1rem;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.workflow-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.workflow-info h3 {
  margin: 0;
  font-size: 1.2rem;
}

.workflow-info p {
  margin: 0.25rem 0 0;
  color: #666;
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.editor-content {
  flex: 1;
  display: grid;
  grid-template-columns: 250px 1fr 300px;
  gap: 1rem;
  padding: 1rem;
  overflow: hidden;
}

.editor-toolbar {
  border-right: 1px solid #ddd;
  padding-right: 1rem;
}

.node-palette {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.node-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.node-button:hover {
  background: #f5f5f5;
  border-color: var(--ct-primary);
}

.node-icon {
  font-size: 1.5rem;
}

.node-label {
  font-size: 0.9rem;
}

.editor-diagram {
  overflow: auto;
}

.editor-nodes {
  border-left: 1px solid #ddd;
  padding-left: 1rem;
  overflow-y: auto;
}

.node-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
}

.node-type {
  font-size: 0.75rem;
  padding: 2px 6px;
  background: #e3f2fd;
  border-radius: 3px;
  text-transform: uppercase;
}

.node-name {
  flex: 1;
  font-size: 0.9rem;
}

.node-actions {
  display: flex;
  gap: 0.25rem;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-large {
  max-width: 900px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.modal-header h3 {
  margin: 0;
}

.json-container {
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  max-height: 60vh;
  overflow: auto;
  margin-bottom: 1rem;
}

.json-container pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.json-container code {
  color: #333;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.task-fields {
  margin-top: 1rem;
}

.field-editor {
  margin-bottom: 0.5rem;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  background: #fff;
  cursor: move;
  transition: all 0.2s;
}

.field-editor:hover {
  border-color: #bbb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.field-editor.dragging {
  opacity: 0.5;
  border-color: var(--ct-primary);
  background: #f0f8ff;
}

.field-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.field-number {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  background: #e0e0e0;
  border-radius: 50%;
  font-size: 0.85rem;
  font-weight: 600;
  color: #666;
}

.drag-handle {
  cursor: grab;
  color: #999;
  font-size: 1.2rem;
  padding: 0 0.25rem;
  user-select: none;
  line-height: 1;
}

.drag-handle:active {
  cursor: grabbing;
}

.field-row input[type='text'],
.field-row select {
  flex: 1;
}

.field-row label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
}

.field-actions {
  display: flex;
  gap: 0.25rem;
}

.field-actions button {
  min-width: 32px;
  padding: 0.25rem 0.5rem;
}

.field-actions button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.field-options {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #007bff;
}

.range-options,
.file-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
}

.field-options .ct-form-group {
  margin-bottom: 0.5rem;
}

.field-options .ct-form-group:last-child {
  margin-bottom: 0;
}

.field-options .ct-form-text {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: #6c757d;
}

.decision-config {
  margin-top: 1rem;
}

.decision-config h4 {
  margin: 0 0 1rem 0;
}

.coming-soon {
  padding: 2rem;
  text-align: center;
  background: #f8f9fa;
  border-radius: 4px;
  border: 2px dashed #dee2e6;
  color: #6c757d;
}

.coming-soon p {
  margin: 0;
}

.edge-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.edge-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  transition: all 0.2s;
}

.edge-item:hover {
  border-color: #007bff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.edge-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.edge-label {
  font-size: 0.875rem;
  color: #333;
}

.badge-default,
.badge-condition {
  padding: 0.125rem 0.5rem;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-default {
  background: #ffc107;
  color: #000;
}

.badge-condition {
  background: #007bff;
  color: white;
}

.edge-actions {
  display: flex;
  gap: 0.25rem;
}

.edge-section {
  margin-top: 1.5rem;
}

.collapsible-header {
  cursor: pointer;
  user-select: none;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
  transition: background 0.2s;
}

.collapsible-header:hover {
  background: #e9ecef;
}

.collapsible-header span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.edge-highlighted {
  animation: highlight-pulse 1s ease-in-out 2;
  background: #fff3cd !important;
  border-color: #ffc107 !important;
}

@keyframes highlight-pulse {
  0%, 100% {
    background: #fff3cd;
  }
  50% {
    background: #ffe69c;
  }
}

/* Decision Node Outputs */
.decision-config {
  margin-top: 1.5rem;
}

.decision-config .info-text {
  background: #e3f2fd;
  padding: 0.75rem;
  border-radius: 4px;
  border-left: 4px solid #2196f3;
  margin-bottom: 1rem;
  color: #1565c0;
  font-size: 0.875rem;
}

.empty-outputs {
  text-align: center;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 2px dashed #dee2e6;
  margin-bottom: 1rem;
}

.empty-outputs p {
  margin: 0 0 1rem 0;
  color: #6c757d;
}

.outputs-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.output-item {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 1rem;
}

.output-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.output-number {
  background: #6c757d;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.output-header .ct-form-control {
  flex: 1;
}

.output-condition {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: white;
  border-radius: 4px;
}

.output-condition .ct-form-label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: block;
}

.default-info {
  padding: 0.75rem;
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  border-radius: 4px;
  color: #856404;
  font-size: 0.875rem;
  margin-top: 0.75rem;
}

.badge-handle,
.badge-label {
  padding: 0.125rem 0.5rem;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-handle {
  background: #6c757d;
  color: white;
}

.badge-label {
  background: #e9ecef;
  color: #495057;
}
</style>
