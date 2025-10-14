<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  availableVariables: string[];
}>();

const emit = defineEmits<{
  select: [variable: string];
}>();

const isOpen = ref(false);

function selectVariable(variable: string) {
  emit('select', variable);
  isOpen.value = false;
}

function formatPlaceholder(variable: string): string {
  return `{{${variable}}}`;
}

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.placeholder-dropdown')) {
    isOpen.value = false;
  }
}

// Add/remove event listener
function toggleDropdown() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
  } else {
    document.removeEventListener('click', handleClickOutside);
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
        Verfügbare Variablen
      </div>
      <div 
        v-for="variable in availableVariables"
        :key="variable"
        class="dropdown-item"
        @click="selectVariable(variable)"
      >
        <code>{{ formatPlaceholder(variable) }}</code>
      </div>
      <div v-if="availableVariables.length === 0" class="empty-state">
        <p>Keine Variablen verfügbar</p>
        <small>Fügen Sie zuerst Aufgaben mit Feldern vor dieser Aufgabe hinzu.</small>
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
  min-width: 200px;
  max-width: 300px;
  max-height: 300px;
  overflow-y: auto;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.dropdown-header {
  padding: 8px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #666;
  border-bottom: 1px solid #eee;
  background: #f9f9f9;
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f5f5f5;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: #f5f5f5;
}

.dropdown-item code {
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
  color: #2196f3;
  background: #f0f7ff;
  padding: 2px 6px;
  border-radius: 3px;
}

.empty-state {
  padding: 16px;
  text-align: center;
  color: #999;
}

.empty-state p {
  margin: 0 0 8px 0;
  font-size: 0.9em;
}

.empty-state small {
  font-size: 0.8em;
  color: #bbb;
}
</style>
