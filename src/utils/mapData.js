import { getNodes, saveNodes, addNode } from './storage';

export function addExplorationNode(concept) {
  addNode({
    id: concept.id,
    label: concept.label,
    category: concept.category,
    relatedIds: concept.relatedIds || [],
  });
}

export function getGraphData() {
  const nodes = getNodes();
  const nodeMap = new Set(nodes.map(n => n.id));

  const edges = [];
  nodes.forEach(node => {
    (node.relatedIds || []).forEach(relId => {
      if (nodeMap.has(relId)) {
        const edgeId = [node.id, relId].sort().join('--');
        if (!edges.find(e => e.id === edgeId)) {
          edges.push({ id: edgeId, source: node.id, target: relId });
        }
      }
    });
  });

  return { nodes, edges };
}

export function getClusterCount() {
  const { nodes, edges } = getGraphData();
  if (nodes.length === 0) return 0;

  const adj = {};
  nodes.forEach(n => { adj[n.id] = []; });
  edges.forEach(e => {
    adj[e.source]?.push(e.target);
    adj[e.target]?.push(e.source);
  });

  const visited = new Set();
  let clusters = 0;

  nodes.forEach(n => {
    if (!visited.has(n.id)) {
      clusters++;
      const stack = [n.id];
      while (stack.length) {
        const curr = stack.pop();
        if (visited.has(curr)) continue;
        visited.add(curr);
        adj[curr]?.forEach(nb => { if (!visited.has(nb)) stack.push(nb); });
      }
    }
  });

  return clusters;
}
