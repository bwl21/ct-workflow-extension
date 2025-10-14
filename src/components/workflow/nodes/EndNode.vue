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
  <div class="end-node">
    <NodeResizer v-if="selected" :min-width="80" :min-height="80" />
    
    <!-- Input Handle -->
    <Handle type="target" :position="Position.Top" />
    
    <div class="node-icon">⬛</div>
    <div class="node-label">{{ label }}</div>
  </div>
</template>

<style scoped>
.end-node {
  background: linear-gradient(135deg, #f44336 0%, #e53935 100%);
  color: white;
  border-radius: 50%;
  width: 80px;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
  transition: all 0.2s;
  position: relative;
}

.end-node:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(244, 67, 54, 0.4);
}

.node-icon {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.node-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
}
</style>
