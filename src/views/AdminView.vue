<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useWorkflowStore } from '@/stores/workflow';
import WorkflowEditor from '@/components/workflow/WorkflowEditor.vue';
import type { Workflow } from '@/types/workflow.types';

const workflowStore = useWorkflowStore();

// Check for unsaved snapshot on mount
onMounted(() => {
  const snapshot = workflowStore.loadSnapshotFromLocalStorage();
  if (snapshot) {
    const workflow = workflowStore.getWorkflowById(snapshot.workflowId);
    if (workflow) {
      const message = `Es gibt ungespeicherte Änderungen am Workflow "${workflow.name}" vom ${new Date(snapshot.timestamp).toLocaleString('de-DE')}.\n\nMöchtest du diese wiederherstellen?`;
      if (confirm(message)) {
        workflowStore.restoreSnapshot(snapshot);
        selectedWorkflow.value = workflow;
        showEditModal.value = true;
      } else {
        workflowStore.clearSnapshot();
      }
    } else {
      // Workflow doesn't exist anymore, clear snapshot
      workflowStore.clearSnapshot();
    }
  }
});

const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedWorkflow = ref<Workflow | null>(null);
const isSaving = ref(false);

const newWorkflow = ref({
  name: '',
  description: '',
  category: 'Allgemein',
});

const workflows = computed(() => workflowStore.workflows);

function openCreateModal() {
  newWorkflow.value = { name: '', description: '', category: 'Allgemein' };
  showCreateModal.value = true;
}

async function createWorkflow() {
  if (!newWorkflow.value.name) return;

  console.log('[AdminView] Creating workflow:', newWorkflow.value);
  try {
    await workflowStore.createWorkflow(
      newWorkflow.value.name, 
      newWorkflow.value.description,
      newWorkflow.value.category
    );
    console.log('[AdminView] Workflow created successfully');
    showCreateModal.value = false;
    newWorkflow.value = { name: '', description: '', category: 'Allgemein' };
  } catch (error) {
    console.error('[AdminView] Failed to create workflow:', error);
    alert('Fehler beim Erstellen des Workflows: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
  }
}

function openEditModal(workflow: Workflow) {
  selectedWorkflow.value = workflow;
  workflowStore.setCurrentWorkflow(workflow.id);
  workflowStore.createSnapshot(workflow.id);
  showEditModal.value = true;
}

async function saveAndClose() {
  if (!selectedWorkflow.value) return;
  
  isSaving.value = true;
  try {
    const workflow = workflowStore.getWorkflowById(selectedWorkflow.value.id);
    if (!workflow) throw new Error('Workflow not found');
    
    // Update workflow in backend
    await workflowStore.updateWorkflow(workflow.id, workflow);
    
    workflowStore.clearSnapshot();
    showEditModal.value = false;
    selectedWorkflow.value = null;
    workflowStore.setCurrentWorkflow(null);
  } catch (error) {
    console.error('Failed to save workflow:', error);
    alert('Fehler beim Speichern des Workflows.');
  } finally {
    isSaving.value = false;
  }
}

function cancelEdit() {
  workflowStore.revertToSnapshot();
  workflowStore.clearSnapshot();
  showEditModal.value = false;
  selectedWorkflow.value = null;
  workflowStore.setCurrentWorkflow(null);
}

function openDeleteModal(workflow: Workflow) {
  selectedWorkflow.value = workflow;
  showDeleteModal.value = true;
}

async function deleteWorkflow() {
  if (!selectedWorkflow.value) return;

  await workflowStore.deleteWorkflow(selectedWorkflow.value.id);
  showDeleteModal.value = false;
  selectedWorkflow.value = null;
}

function resetDemoData() {
  alert('Demo-Daten sind mit Backend-First Architektur nicht mehr verfügbar. Erstelle Workflows manuell.');
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<template>
  <div class="admin-view">
    <!-- Header -->
    <div class="ct-card ct-mb-3">
      <div class="ct-card-header">
        <div class="header-content">
          <div>
            <h2 class="ct-h4 ct-mb-0">Workflow-Verwaltung</h2>
            <p class="ct-text-muted ct-mb-0">Erstelle und verwalte Workflows für deine Organisation</p>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="ct-btn ct-btn-secondary" @click="resetDemoData" title="Demo-Daten neu laden">
              🔄 Demo-Daten
            </button>
            <button class="ct-btn ct-btn-primary" @click="openCreateModal">
              <span class="icon">+</span> Neuer Workflow
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Workflows List -->
    <div class="ct-card">
      <div class="ct-card-body">
        <div v-if="workflows.length > 0">
          <table class="ct-table ct-table-hover">
            <thead>
              <tr>
                <th>Name</th>
                <th>Kategorie</th>
                <th>Beschreibung</th>
                <th>Schritte</th>
                <th>Erstellt</th>
                <th>Aktualisiert</th>
                <th class="actions-column">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="workflow in workflows" :key="workflow.id" :class="{ 'corrupted-workflow': workflow.isCorrupted }">
                <td>
                  <strong>{{ workflow.name }}</strong>
                  <span v-if="workflow.isCorrupted" class="ct-badge ct-badge-danger ct-ml-2" title="Dieser Workflow ist fehlerhaft">⚠️ Fehlerhaft</span>
                </td>
                <td>
                  <span class="ct-badge" :class="workflow.isCorrupted ? 'ct-badge-danger' : 'ct-badge-secondary'">{{ workflow.category }}</span>
                </td>
                <td>
                  <span class="description-text">{{ workflow.isCorrupted ? workflow.corruptionReason : (workflow.description || '-') }}</span>
                </td>
                <td>
                  <span class="ct-badge ct-badge-primary">{{ workflow.definition?.nodes?.length || 0 }} Schritte</span>
                </td>
                <td>
                  <small class="ct-text-muted">{{ formatDate(workflow.createdAt) }}</small>
                </td>
                <td>
                  <small class="ct-text-muted">{{ formatDate(workflow.updatedAt) }}</small>
                </td>
                <td class="actions-column">
                  <div class="action-buttons">
                    <button
                      v-if="!workflow.isCorrupted"
                      class="ct-btn ct-btn-sm ct-btn-secondary"
                      title="Bearbeiten"
                      @click="openEditModal(workflow)"
                    >
                      ✏️
                    </button>
                    <button
                      class="ct-btn ct-btn-sm"
                      :class="workflow.isCorrupted ? 'ct-btn-danger' : 'ct-btn-secondary'"
                      :title="workflow.isCorrupted ? 'Fehlerhaften Workflow löschen' : 'Löschen'"
                      @click="openDeleteModal(workflow)"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-else class="ct-empty-state">
          <div class="ct-empty-state-icon">📋</div>
          <h3 class="ct-empty-state-title">Noch keine Workflows</h3>
          <p class="ct-empty-state-text">
            Erstelle deinen ersten Workflow, um loszulegen.
          </p>
          <button class="ct-btn ct-btn-primary" @click="openCreateModal">
            <span class="icon">+</span> Ersten Workflow erstellen
          </button>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="ct-modal-overlay" @click.self="showCreateModal = false">
      <div class="ct-modal">
        <div class="ct-modal-header">
          <h3 class="ct-modal-title">Neuer Workflow</h3>
          <button class="ct-btn-close" @click="showCreateModal = false"></button>
        </div>
        <div class="ct-modal-body">
          <div class="ct-form-group">
            <label class="ct-form-label">Name *</label>
            <input
              v-model="newWorkflow.name"
              type="text"
              class="ct-form-control"
              placeholder="z.B. Mitgliederaufnahme"
              autofocus
            />
          </div>
          <div class="ct-form-group">
            <label class="ct-form-label">Kategorie *</label>
            <input
              v-model="newWorkflow.category"
              type="text"
              class="ct-form-control"
              placeholder="z.B. Mitgliederverwaltung"
            />
          </div>
          <div class="ct-form-group ct-mb-0">
            <label class="ct-form-label">Beschreibung</label>
            <textarea
              v-model="newWorkflow.description"
              class="ct-form-control"
              rows="3"
              placeholder="Beschreibe den Zweck dieses Workflows..."
            />
          </div>
        </div>
        <div class="ct-modal-footer">
          <button class="ct-btn ct-btn-secondary" @click="showCreateModal = false">Abbrechen</button>
          <button
            class="ct-btn ct-btn-primary"
            :disabled="!newWorkflow.name"
            @click="createWorkflow"
          >
            Erstellen
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="ct-modal-overlay" @click.self="cancelEdit">
      <div class="ct-modal ct-modal-xl">
        <div class="ct-modal-header">
          <h3 class="ct-modal-title">Workflow bearbeiten: {{ selectedWorkflow?.name }}</h3>
          <button class="ct-btn-close" @click="cancelEdit"></button>
        </div>
        <div class="ct-modal-body editor-modal-body">
          <WorkflowEditor />
        </div>
        <div class="ct-modal-footer">
          <button class="ct-btn ct-btn-secondary" @click="cancelEdit">Abbrechen</button>
          <button class="ct-btn ct-btn-primary" @click="saveAndClose" :disabled="isSaving">
            {{ isSaving ? 'Speichert...' : 'Speichern & Schließen' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="ct-modal-overlay" @click.self="showDeleteModal = false">
      <div class="ct-modal">
        <div class="ct-modal-header">
          <h3 class="ct-modal-title">Workflow löschen</h3>
          <button class="ct-btn-close" @click="showDeleteModal = false"></button>
        </div>
        <div class="ct-modal-body">
          <div class="ct-alert ct-alert-warning">
            <strong>Achtung!</strong> Diese Aktion kann nicht rückgängig gemacht werden.
          </div>
          <p>
            Möchtest du den Workflow <strong>{{ selectedWorkflow?.name }}</strong> wirklich löschen?
          </p>
        </div>
        <div class="ct-modal-footer">
          <button class="ct-btn ct-btn-secondary" @click="showDeleteModal = false">Abbrechen</button>
          <button class="ct-btn ct-btn-primary" style="background-color: var(--ct-danger); border-color: var(--ct-danger)" @click="deleteWorkflow">
            Löschen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-view {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.icon {
  font-size: 1.2rem;
  margin-right: 0.25rem;
}

.description-text {
  display: block;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions-column {
  width: 120px;
  text-align: right;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
  justify-content: flex-end;
}

.editor-modal-body {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.editor-modal-body :deep(.workflow-editor) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.editor-modal-body :deep(.editor-content) {
  flex: 1;
  min-height: 0;
}

@media (max-width: 768px) {
  .admin-view {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .ct-table {
    font-size: 0.85rem;
  }

  .description-text {
    max-width: 150px;
  }
}

/* Corrupted workflow styling */
.corrupted-workflow {
  background-color: #fff3cd !important;
}

.corrupted-workflow:hover {
  background-color: #ffe69c !important;
}
</style>
