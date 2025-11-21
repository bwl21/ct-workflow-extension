<script setup lang="ts">
import { ref, watch, onMounted, markRaw } from 'vue';
import { VueFlow, useVueFlow, Panel } from '@vue-flow/core';
import type { Node, Edge, NodeChange, EdgeChange } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import type { WorkflowDefinition, WorkflowNode, WorkflowEdge } from '@/types/workflow.types';
import { NodeType } from '@/types/workflow.types';

// Import custom node components
import StartNode from './nodes/StartNode.vue';
import TaskNode from './nodes/TaskNode.vue';
import ActionNode from './nodes/ActionNode.vue';
import DecisionNode from './nodes/DecisionNode.vue';
import JoinNode from './nodes/JoinNode.vue';
import EndNode from './nodes/EndNode.vue';

interface Props {
  definition: WorkflowDefinition;
  readonly?: boolean;
  currentNodeId?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: true,
  currentNodeId: null,
});

const emit = defineEmits<{
  nodeClick: [nodeId: string];
  nodeDelete: [nodeId: string];
  edgeClick: [edgeId: string];
  nodesChange: [nodes: WorkflowNode[]];
  edgeAdd: [edge: { source: string; target: string; sourceHandle?: string }];
  edgeDelete: [edgeId: string];
  edgeUpdate: [edge: { id: string; source: string; target: string; sourceHandle?: string }];
}>();

// VueFlow instance
const { fitView, onNodesChange, onConnect, onEdgesChange, onEdgeUpdate, updateNodeInternals } = useVueFlow();

// Fit view with better defaults
function handleFitView() {
  setTimeout(() => {
    fitView({ 
      padding: 0.15, 
      duration: 500,
      maxZoom: 1.2,
      minZoom: 0.3
    });
  }, 50);
}

// Local state for VueFlow
const vueFlowNodes = ref<Node[]>([]);
const vueFlowEdges = ref<Edge[]>([]);

// Convert workflow nodes to VueFlow nodes
function convertNodes(): Node[] {
  return props.definition.nodes.map((node: WorkflowNode) => {
    let type = 'default';
    switch (node.type) {
      case NodeType.START:
        type = 'start';
        break;
      case NodeType.TASK:
        type = 'task';
        break;
      case NodeType.ACTION:
        type = 'action';
        break;
      case NodeType.DECISION:
        type = 'decision';
        break;
      case NodeType.END:
        type = 'end';
        break;
    }

    const vueFlowNode: any = {
      id: node.id,
      type,
      position: node.position || { x: 0, y: 0 },
      label: node.label,
      data: {
        ...node.data,
        isActive: props.currentNodeId === node.id,
      },
      draggable: !props.readonly,
      selectable: !props.readonly,
      deletable: !props.readonly,
      resizable: !props.readonly,
      class: props.currentNodeId === node.id ? 'active-node' : '',
    };
    
    // Dimensions setzen (entweder gespeichert oder als style)
    if (node.dimensions) {
      vueFlowNode.style = {
        width: `${node.dimensions.width}px`,
        height: `${node.dimensions.height}px`,
      };
    }
    
    return vueFlowNode;
  });
}

// Convert workflow edges to VueFlow edges
function convertEdges(): Edge[] {
  return props.definition.edges.map((edge: WorkflowEdge) => {
    let label = edge.label || '';

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      label,
      animated: props.currentNodeId === edge.source,
      markerEnd: 'arrow',
      style: {
        stroke: props.currentNodeId === edge.source ? '#4caf50' : '#b1b1b7',
        strokeWidth: props.currentNodeId === edge.source ? 3 : 2,
      },
      labelStyle: {
        fill: '#666',
        fontSize: '12px',
        fontWeight: 600,
      },
      labelBgStyle: {
        fill: 'white',
      },
    };
  });
}

// Update VueFlow nodes and edges when definition changes
watch(
  () => props.definition,
  () => {
    vueFlowNodes.value = convertNodes();
    vueFlowEdges.value = convertEdges();
    
    // Force VueFlow to recalculate edge positions for all nodes
    // This is needed when output order changes in decision nodes
    setTimeout(() => {
      props.definition.nodes.forEach(node => {
        if (node.type === NodeType.DECISION) {
          updateNodeInternals([node.id]);
        }
      });
    }, 0);
  },
  { deep: true, immediate: true }
);

// Node types mapping (use markRaw to prevent Vue from making components reactive)
const nodeTypes = markRaw({
  start: StartNode,
  task: TaskNode,
  action: ActionNode,
  decision: DecisionNode,
  join: JoinNode,
  end: EndNode,
}) as any;

// Handle node click (only for selection, not editing)
const onNodeClick = () => {
  // Single click does nothing - only selection is handled by VueFlow
};

// Handle node double-click for editing
const onNodeDoubleClick = (event: any) => {
  if (!props.readonly) {
    emit('nodeClick', event.node.id);
  }
};

// Handle edge click
const onEdgeClick = (event: any) => {
  if (!props.readonly) {
    emit('edgeClick', event.edge.id);
  }
};

// Handle new connection
onConnect((connection) => {
  if (!props.readonly) {
    emit('edgeAdd', {
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle || undefined,
    });
  }
});

// Handle node position and dimension changes
onNodesChange((changes: NodeChange[]) => {
  if (!props.readonly) {
    // Handle node deletion
    changes.forEach(change => {
      if (change.type === 'remove' && 'id' in change) {
        emit('nodeDelete', change.id);
      }
    });
    
    const relevantChanges = changes.filter(c => 
      (c.type === 'position' && 'position' in c && c.position) ||
      (c.type === 'dimensions' && 'dimensions' in c && c.dimensions)
    );
    
    if (relevantChanges.length > 0) {
      const updatedNodes = props.definition.nodes.map(node => {
        const positionChange = relevantChanges.find(c => 
          c.type === 'position' && 'id' in c && c.id === node.id
        );
        const dimensionChange = relevantChanges.find(c => 
          c.type === 'dimensions' && 'id' in c && c.id === node.id
        );
        
        let updatedNode = { ...node };
        
        if (positionChange && 'position' in positionChange && positionChange.position) {
          updatedNode.position = positionChange.position;
        }
        
        if (dimensionChange && 'dimensions' in dimensionChange && dimensionChange.dimensions) {
          updatedNode.dimensions = dimensionChange.dimensions;
        }
        
        return updatedNode;
      });
      emit('nodesChange', updatedNodes);
    }
  }
});

// Handle edge changes (deletion)
onEdgesChange((changes: EdgeChange[]) => {
  if (!props.readonly) {
    changes.forEach(change => {
      if (change.type === 'remove' && 'id' in change) {
        emit('edgeDelete', change.id);
      }
    });
  }
});

// Handle edge reconnection (umhängen)
onEdgeUpdate(({ edge, connection }) => {
  if (!props.readonly) {
    emit('edgeUpdate', {
      id: edge.id,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle || undefined,
    });
  }
});

// Fit view on mount and when nodes change
watch(
  () => vueFlowNodes.value.length,
  () => {
    handleFitView();
  }
);

onMounted(() => {
  handleFitView();
  
  // Keyboard shortcut for fit view
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'f' || e.key === 'F') {
      handleFitView();
    }
  };
  
  window.addEventListener('keydown', handleKeyPress);
  
  // Cleanup
  return () => {
    window.removeEventListener('keydown', handleKeyPress);
  };
});
</script>

<template>
  <div class="vue-flow-diagram">
    <VueFlow
      v-model:nodes="vueFlowNodes"
      v-model:edges="vueFlowEdges"
      :node-types="nodeTypes"
      :fit-view-on-init="true"
      :zoom-on-scroll="!readonly"
      :pan-on-scroll="readonly"
      :pan-on-drag="!readonly"
      :edges-updatable="!readonly"
      :edges-reconnectable="!readonly"
      :snap-to-grid="true"
      :snap-grid="[15, 15]"
      @node-click="onNodeClick"
      @node-double-click="onNodeDoubleClick"
      @edge-click="onEdgeClick"
    >
      <Background pattern-color="#aaa" :gap="15" />
      <Controls />
      <MiniMap v-if="!readonly" />

      <!-- Fit View Button -->
      <Panel position="top-left" class="fit-view-panel">
        <button @click="handleFitView" class="fit-view-button" title="Gesamtes Diagramm anzeigen (F)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
        </button>
      </Panel>

      <Panel v-if="readonly && currentNodeId" position="top-right" class="info-panel">
        <div class="panel-content">
          <div class="panel-icon">▶️</div>
          <div class="panel-text">Aktueller Schritt</div>
        </div>
      </Panel>
    </VueFlow>
  </div>
</template>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';
@import '@vue-flow/minimap/dist/style.css';
@import '@vue-flow/node-resizer/dist/style.css';

.vue-flow-diagram {
  width: 100%;
  height: 100%;
  background: #f5f5f5;
}

.active-node {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
  }
}

.fit-view-panel {
  background: transparent;
  padding: 0;
}

.fit-view-button {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.fit-view-button:hover {
  background: #f5f5f5;
  border-color: #999;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.fit-view-button:active {
  transform: scale(0.95);
}

.info-panel {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.panel-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.panel-icon {
  font-size: 1.5rem;
}

.panel-text {
  font-weight: 600;
  color: #333;
}

.vue-flow__node {
  cursor: pointer;
}

/* Node resizing */
.vue-flow__resize-control {
  width: 10px;
  height: 10px;
  border: 2px solid #4caf50;
  border-radius: 50%;
  background: white;
}

.vue-flow__resize-control:hover {
  width: 12px;
  height: 12px;
  background: #4caf50;
}

.vue-flow__resize-control.handle {
  width: 8px;
  height: 8px;
}

.vue-flow__resize-control.handle:hover {
  width: 10px;
  height: 10px;
}

.vue-flow__edge-path {
  transition: stroke 0.3s, stroke-width 0.3s;
}

.vue-flow__edge:hover .vue-flow__edge-path {
  stroke: #4caf50 !important;
  stroke-width: 3px !important;
}

/* Make handles visible and easier to grab */
.vue-flow__handle {
  width: 14px;
  height: 14px;
  background: #555;
  border: 3px solid white;
  border-radius: 50%;
  transition: all 0.2s;
}

.vue-flow__handle:hover {
  width: 18px;
  height: 18px;
  background: #4caf50;
  border-color: white;
  box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.2);
}

.vue-flow__handle-connecting {
  background: #4caf50;
  width: 18px;
  height: 18px;
}

.vue-flow__handle-valid {
  background: #4caf50;
  box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.3);
}

/* Show handles when hovering over node */
.vue-flow__node:hover .vue-flow__handle {
  opacity: 1;
  background: #4caf50;
}
</style>
