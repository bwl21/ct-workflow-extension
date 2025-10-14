<script setup lang="ts">
import { computed } from 'vue';
import { Handle, Position } from '@vue-flow/core';
import { NodeResizer } from '@vue-flow/node-resizer';
import type { NodeData } from '@/types/workflow.types';

const props = defineProps<{
  id: string;
  data: NodeData;
  label: string;
  selected?: boolean;
}>();

// Default outputs wenn keine definiert sind
const outputs = computed(() => {
  if (props.data.outputs && props.data.outputs.length > 0) {
    return props.data.outputs;
  }
  // Standard: TRUE und FALSE
  return [
    { id: 'true', label: '✓ JA', isDefault: false },
    { id: 'false', label: '✗ NEIN', isDefault: true }
  ];
});

// Berechne Position für jeden Handle mit mehr Abstand
function getHandlePosition(index: number, total: number): string {
  if (total === 1) return '50%';
  if (total === 2) {
    return index === 0 ? '25%' : '75%';
  }
  // Für mehr als 2 Outputs gleichmäßig verteilen mit mehr Abstand
  const usableWidth = 90; // 90% der Breite nutzen
  const spacing = usableWidth / (total - 1);
  return `${5 + spacing * index}%`;
}

// Hole Farbe für Output (mit Fallback)
function getOutputColor(output: any): string {
  if (output.color) return output.color;
  // Fallback auf alte Logik
  return output.isDefault ? '#f44336' : '#4caf50';
}
</script>

<template>
  <div class="decision-node">
    <NodeResizer v-if="selected" :min-width="180" :min-height="100" />
    
    <!-- Input Handle -->
    <Handle type="target" :position="Position.Top" />
    
    <div class="node-content">
      <div class="node-icon">❓</div>
      <div class="node-label">{{ label }}</div>
      <div v-if="outputs.length > 0" class="node-info">
        {{ outputs.length }} Ausgang{{ outputs.length !== 1 ? 'änge' : '' }}
      </div>
    </div>
    
    <!-- Dynamic Output Handles -->
    <Handle 
      v-for="(output, index) in outputs"
      :key="output.id"
      type="source" 
      :position="Position.Bottom" 
      :id="output.id"
      :style="{ left: getHandlePosition(index, outputs.length) }"
    >
      <div 
        class="handle-label"
        :style="{ 
          backgroundColor: getOutputColor(output),
          color: 'white'
        }"
      >
        {{ output.label }}
      </div>
    </Handle>
  </div>
</template>

<style scoped>
.decision-node {
  background: white;
  border: 2px solid #9c27b0;
  border-radius: 8px;
  padding: 1rem;
  min-width: 180px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  position: relative;
  padding-bottom: 2rem;
}

.decision-node:hover {
  box-shadow: 0 4px 12px rgba(156, 39, 176, 0.3);
  transform: translateY(-2px);
}

.node-content {
  text-align: center;
}

.node-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.node-label {
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #333;
}

.node-info {
  font-size: 0.75rem;
  color: #666;
}

.handle-label {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 0.25rem;
  font-size: 0.65rem;
  font-weight: 600;
  white-space: nowrap;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  pointer-events: none;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
