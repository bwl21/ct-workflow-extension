<script setup lang="ts">
import { computed } from 'vue';
import type { Workflow, WorkflowNode } from '@/types/workflow.types';
import { NodeType } from '@/types/workflow.types';

interface Props {
  workflow: Workflow;
  currentNodeId?: string;
  completedNodeIds?: string[];
}

const props = defineProps<Props>();

const getNodeClass = (node: WorkflowNode) => {
  const classes = ['workflow-node', `node-${node.type}`];

  if (props.currentNodeId === node.id) {
    classes.push('node-current');
  }

  if (props.completedNodeIds?.includes(node.id)) {
    classes.push('node-completed');
  }

  return classes.join(' ');
};

const getNodeIcon = (type: NodeType) => {
  switch (type) {
    case NodeType.START:
      return '▶';
    case NodeType.TASK:
      return '📝';
    case NodeType.ACTION:
      return '⚡';
    case NodeType.DECISION:
      return '❓';
    case NodeType.END:
      return '✓';
    default:
      return '●';
  }
};

// Calculate SVG viewBox based on node positions
const viewBox = computed(() => {
  if (props.workflow.nodes.length === 0) {
    return '0 0 800 600';
  }

  const padding = 100;
  const minX = Math.min(...props.workflow.nodes.map((n) => n.position.x)) - padding;
  const minY = Math.min(...props.workflow.nodes.map((n) => n.position.y)) - padding;
  const maxX = Math.max(...props.workflow.nodes.map((n) => n.position.x)) + padding;
  const maxY = Math.max(...props.workflow.nodes.map((n) => n.position.y)) + padding;

  return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
});
</script>

<template>
  <div class="workflow-diagram">
    <svg :viewBox="viewBox" xmlns="http://www.w3.org/2000/svg">
      <!-- Edges -->
      <g class="edges">
        <g v-for="edge in workflow.edges" :key="edge.id" class="edge">
          <line
            :x1="workflow.nodes.find((n) => n.id === edge.source)?.position.x"
            :y1="workflow.nodes.find((n) => n.id === edge.source)?.position.y"
            :x2="workflow.nodes.find((n) => n.id === edge.target)?.position.x"
            :y2="workflow.nodes.find((n) => n.id === edge.target)?.position.y"
            stroke="#999"
            stroke-width="2"
            marker-end="url(#arrowhead)"
          />
          <text
            v-if="edge.label"
            :x="
              ((workflow.nodes.find((n) => n.id === edge.source)?.position.x || 0) +
                (workflow.nodes.find((n) => n.id === edge.target)?.position.x || 0)) /
              2
            "
            :y="
              ((workflow.nodes.find((n) => n.id === edge.source)?.position.y || 0) +
                (workflow.nodes.find((n) => n.id === edge.target)?.position.y || 0)) /
              2
            "
            class="edge-label"
            text-anchor="middle"
          >
            {{ edge.label }}
          </text>
        </g>
      </g>

      <!-- Nodes -->
      <g class="nodes">
        <g
          v-for="node in workflow.nodes"
          :key="node.id"
          :class="getNodeClass(node)"
          :transform="`translate(${node.position.x}, ${node.position.y})`"
        >
          <circle r="30" />
          <text class="node-icon" text-anchor="middle" dy="0.3em">
            {{ getNodeIcon(node.type) }}
          </text>
          <text class="node-label" text-anchor="middle" dy="50">
            {{ node.label }}
          </text>
        </g>
      </g>

      <!-- Arrow marker -->
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#999" />
        </marker>
      </defs>
    </svg>
  </div>
</template>

<style scoped>
.workflow-diagram {
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 4px;
}

svg {
  width: 100%;
  height: 100%;
}

.workflow-node circle {
  fill: #fff;
  stroke: #999;
  stroke-width: 2;
  transition: all 0.3s;
}

.workflow-node:hover circle {
  stroke: var(--ct-primary);
  stroke-width: 3;
}

.node-start circle {
  fill: #4caf50;
  stroke: #388e3c;
}

.node-task circle {
  fill: #2196f3;
  stroke: #1976d2;
}

.node-action circle {
  fill: #ff9800;
  stroke: #f57c00;
}

.node-decision circle {
  fill: #9c27b0;
  stroke: #7b1fa2;
}

.node-end circle {
  fill: #f44336;
  stroke: #d32f2f;
}

.node-current circle {
  stroke: #ffc107;
  stroke-width: 4;
  filter: drop-shadow(0 0 8px #ffc107);
}

.node-completed circle {
  opacity: 0.6;
}

.node-icon {
  font-size: 20px;
  fill: #fff;
  pointer-events: none;
}

.node-label {
  font-size: 12px;
  fill: #333;
  font-weight: 500;
  pointer-events: none;
}

.edge-label {
  font-size: 11px;
  fill: #666;
  background: #fff;
}
</style>
