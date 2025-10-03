import dagre from '@dagrejs/dagre';
import type { WorkflowNode, WorkflowEdge } from '@/types/workflow.types';

export interface LayoutOptions {
  direction?: 'TB' | 'LR' | 'BT' | 'RL'; // Top-Bottom, Left-Right, etc.
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number; // Vertical spacing between ranks
  nodeSep?: number; // Horizontal spacing between nodes
  align?: 'UL' | 'UR' | 'DL' | 'DR'; // Alignment
  ranker?: 'network-simplex' | 'tight-tree' | 'longest-path';
}

const DEFAULT_OPTIONS: Required<LayoutOptions> = {
  direction: 'TB',
  nodeWidth: 180,
  nodeHeight: 100,
  rankSep: 150,
  nodeSep: 120,
  align: 'UL',
  ranker: 'network-simplex',
};

/**
 * Berechnet automatisches Layout für Workflow-Nodes mit Dagre
 */
export function calculateAutoLayout(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  options: LayoutOptions = {}
): WorkflowNode[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Erstelle Dagre-Graph
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  
  // Setze Graph-Optionen
  graph.setGraph({
    rankdir: opts.direction,
    ranksep: opts.rankSep,
    nodesep: opts.nodeSep,
    align: opts.align,
    ranker: opts.ranker,
    marginx: 50,
    marginy: 50,
  });

  // Füge Nodes hinzu mit tatsächlichen oder Standard-Dimensionen
  nodes.forEach((node) => {
    graph.setNode(node.id, {
      width: node.dimensions?.width || opts.nodeWidth,
      height: node.dimensions?.height || opts.nodeHeight,
    });
  });

  // Füge Edges hinzu
  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  // Berechne Layout
  dagre.layout(graph);

  // Aktualisiere Node-Positionen
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = graph.node(node.id);
    const width = node.dimensions?.width || opts.nodeWidth;
    const height = node.dimensions?.height || opts.nodeHeight;
    
    return {
      ...node,
      position: {
        // Dagre gibt die Mitte des Nodes zurück, wir brauchen die obere linke Ecke
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  return layoutedNodes;
}

/**
 * Berechnet Bounding Box aller Nodes
 */
export function getNodesBounds(nodes: WorkflowNode[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + 180); // Angenommene Node-Breite
    maxY = Math.max(maxY, node.position.y + 100); // Angenommene Node-Höhe
  });

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Zentriert Nodes um (0, 0)
 */
export function centerNodes(nodes: WorkflowNode[]): WorkflowNode[] {
  const bounds = getNodesBounds(nodes);
  const centerX = bounds.minX + bounds.width / 2;
  const centerY = bounds.minY + bounds.height / 2;

  return nodes.map((node) => ({
    ...node,
    position: {
      x: node.position.x - centerX,
      y: node.position.y - centerY,
    },
  }));
}
