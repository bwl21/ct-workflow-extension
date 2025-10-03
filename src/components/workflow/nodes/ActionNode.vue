<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';
import { NodeResizer } from '@vue-flow/node-resizer';
import type { NodeData } from '@/types/workflow.types';

defineProps<{
  id: string;
  data: NodeData;
  label: string;
  selected?: boolean;
}>();
</script>

<template>
  <div class="action-node">
    <NodeResizer v-if="selected" :min-width="150" :min-height="80" />
    
    <!-- Input Handle -->
    <Handle type="target" :position="Position.Top" />
    
    <div class="node-content">
      <div class="node-icon">⚡</div>
      <div class="node-label">{{ label }}</div>
      <div v-if="data.actionId" class="node-info">
        {{ data.actionId }}
      </div>
    </div>
    
    <!-- Output Handle -->
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.action-node {
  background: white;
  border: 2px solid #ff9800;
  border-radius: 8px;
  padding: 1rem;
  min-width: 150px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  position: relative;
}

.action-node:hover {
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
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
</style>
