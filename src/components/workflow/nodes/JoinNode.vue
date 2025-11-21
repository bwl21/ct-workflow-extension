<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';
import { NodeResizer } from '@vue-flow/node-resizer';

defineProps<{
  id: string;
  data: any;
  label: string;
  selected?: boolean;
}>();
</script>

<template>
  <div class="join-node">
    <NodeResizer v-if="selected" :min-width="120" :min-height="60" />
    
    <!-- Input Handles (multiple) -->
    <Handle type="target" :position="Position.Top" id="input-1" :style="{ left: '30%' }" />
    <Handle type="target" :position="Position.Top" id="input-2" :style="{ left: '70%' }" />
    
    <!-- Output Handle -->
    <Handle type="source" :position="Position.Bottom" />
    
    <div class="node-content">
      <div class="node-icon">⚡</div>
      <div class="node-label">{{ label }}</div>
      <div class="node-description">Wartet auf alle Branches</div>
    </div>
  </div>
</template>

<style scoped>
.join-node {
  background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
  color: white;
  border-radius: 8px;
  min-width: 120px;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(156, 39, 176, 0.3);
  transition: all 0.2s;
  position: relative;
  padding: 0.75rem;
}

.join-node:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(156, 39, 176, 0.4);
}

.node-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.node-icon {
  font-size: 1.5rem;
}

.node-label {
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
}

.node-description {
  font-size: 0.625rem;
  opacity: 0.8;
  text-align: center;
}
</style>
