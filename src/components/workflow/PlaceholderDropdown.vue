<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  availableVariables: string[];
}>();

const emit = defineEmits<{
  select: [variable: string];
}>();

const isOpen = ref(false);
const searchQuery = ref('');

function selectVariable(variable: string) {
  emit('select', variable);
  isOpen.value = false;
  searchQuery.value = '';
}

function formatPlaceholder(variable: string): string {
  return `{{${variable}}}`;
}

// Benutzerfreundliche Labels für Person-Properties
function getPropertyLabel(variable: string): string {
  const property = variable.split('.').pop();
  const labels: Record<string, string> = {
    'id': 'ID',
    'firstName': 'Vorname',
    'lastName': 'Nachname',
    'nickname': 'Spitzname',
    'email': 'E-Mail',
    'imageUrl': 'Avatar-URL',
    'street': 'Straße',
    'zip': 'PLZ',
    'city': 'Ort'
  };
  return labels[property || ''] || property || '';
}

// Gruppiere Variablen nach Basis-Namen (z.B. "assignedPerson" für "assignedPerson.firstName")
const groupedVariables = computed(() => {
  const groups: Record<string, string[]> = {};
  const standalone: string[] = [];
  
  props.availableVariables.forEach(variable => {
    if (variable.includes('.')) {
      // Verschachtelte Variable (z.B. "assignedPerson.firstName")
      const [base] = variable.split('.');
      if (!groups[base]) {
        groups[base] = [];
      }
      groups[base].push(variable);
    } else {
      // Standalone Variable (z.B. "email")
      standalone.push(variable);
    }
  });
  
  return { groups, standalone };
});

// Gefilterte Variablen basierend auf Suchquery
const filteredVariables = computed(() => {
  if (!searchQuery.value) {
    return groupedVariables.value;
  }
  
  const query = searchQuery.value.toLowerCase();
  const filteredGroups: Record<string, string[]> = {};
  const filteredStandalone: string[] = [];
  
  // Filter standalone
  groupedVariables.value.standalone.forEach(variable => {
    if (variable.toLowerCase().includes(query)) {
      filteredStandalone.push(variable);
    }
  });
  
  // Filter groups
  Object.entries(groupedVariables.value.groups).forEach(([base, variables]) => {
    const matchingVars = variables.filter(v => v.toLowerCase().includes(query));
    if (matchingVars.length > 0 || base.toLowerCase().includes(query)) {
      filteredGroups[base] = matchingVars.length > 0 ? matchingVars : variables;
    }
  });
  
  return { groups: filteredGroups, standalone: filteredStandalone };
});

const hasResults = computed(() => {
  return filteredVariables.value.standalone.length > 0 || 
         Object.keys(filteredVariables.value.groups).length > 0;
});

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.placeholder-dropdown')) {
    isOpen.value = false;
    searchQuery.value = '';
  }
}

// Add/remove event listener
function toggleDropdown() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
      // Focus search input
      const searchInput = document.querySelector('.placeholder-search') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }, 0);
  } else {
    document.removeEventListener('click', handleClickOutside);
    searchQuery.value = '';
  }
}

// Cleanup on unmount
import { onUnmounted } from 'vue';
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="placeholder-dropdown">
    <button 
      type="button"
      class="ct-btn ct-btn-sm ct-btn-secondary"
      @click="toggleDropdown"
      title="Platzhalter aus vorherigen Aufgaben einfügen"
    >
      📋 Platzhalter
    </button>
    
    <div v-if="isOpen" class="dropdown-menu">
      <div class="dropdown-header">
        <input
          v-model="searchQuery"
          type="text"
          class="placeholder-search"
          placeholder="Platzhalter suchen..."
        />
      </div>
      
      <div v-if="hasResults" class="dropdown-content">
        <!-- Standalone Variablen -->
        <div v-if="filteredVariables.standalone.length > 0" class="variable-section">
          <div class="section-title">Einfache Felder</div>
          <div 
            v-for="variable in filteredVariables.standalone"
            :key="variable"
            class="dropdown-item"
            @click="selectVariable(variable)"
          >
            <code>{{ formatPlaceholder(variable) }}</code>
          </div>
        </div>
        
        <!-- Gruppierte Variablen (z.B. Person-Objekte) -->
        <div 
          v-for="(variables, base) in filteredVariables.groups"
          :key="base"
          class="variable-section"
        >
          <div class="section-title">
            {{ base }} <span class="section-badge">Objekt</span>
          </div>
          <div 
            v-for="variable in variables"
            :key="variable"
            class="dropdown-item nested"
            @click="selectVariable(variable)"
          >
            <code>{{ formatPlaceholder(variable) }}</code>
            <span class="property-name">{{ getPropertyLabel(variable) }}</span>
          </div>
        </div>
      </div>
      
      <div v-else-if="availableVariables.length === 0" class="empty-state">
        <p>Keine Variablen verfügbar</p>
        <small>Fügen Sie zuerst Aufgaben mit Feldern vor dieser Aufgabe hinzu.</small>
      </div>
      
      <div v-else class="empty-state">
        <p>Keine Ergebnisse</p>
        <small>Versuchen Sie einen anderen Suchbegriff.</small>
      </div>
    </div>
  </div>
</template>

<style scoped>
.placeholder-dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 1000;
  min-width: 300px;
  max-width: 400px;
  max-height: 500px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
}

.dropdown-header {
  padding: 12px;
  border-bottom: 1px solid #eee;
  background: #f9f9f9;
}

.placeholder-search {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9em;
  outline: none;
  transition: border-color 0.2s;
}

.placeholder-search:focus {
  border-color: #2196f3;
}

.dropdown-content {
  overflow-y: auto;
  max-height: 400px;
}

.variable-section {
  border-bottom: 1px solid #f0f0f0;
}

.variable-section:last-child {
  border-bottom: none;
}

.section-title {
  padding: 8px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #666;
  background: #fafafa;
  display: flex;
  align-items: center;
  gap: 8px;
  position: sticky;
  top: 0;
  z-index: 1;
}

.section-badge {
  font-size: 0.7rem;
  font-weight: 500;
  color: #2196f3;
  background: #e3f2fd;
  padding: 2px 6px;
  border-radius: 3px;
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.dropdown-item.nested {
  padding-left: 24px;
}

.dropdown-item:hover {
  background: #f5f5f5;
}

.dropdown-item code {
  font-family: 'Courier New', monospace;
  font-size: 0.85em;
  color: #2196f3;
  background: #f0f7ff;
  padding: 3px 8px;
  border-radius: 3px;
  flex: 1;
}

.property-name {
  font-size: 0.75rem;
  color: #999;
  font-style: italic;
}

.empty-state {
  padding: 24px 16px;
  text-align: center;
  color: #999;
}

.empty-state p {
  margin: 0 0 8px 0;
  font-size: 0.9em;
  font-weight: 500;
}

.empty-state small {
  font-size: 0.8em;
  color: #bbb;
}
</style>
