import { getNodes, saveNodes, addNode } from './storage';

export function addExplorationNode(concept) {
  addNode({
    id: concept.id,
    label: concept.label,
    category: concept.category,
    related: concept.related || [],
  });
}

export function getGraphData() {
  const nodes = getNodes();
  const nodeMap = new Set(nodes.map(n => n.id));

  const edgeMap = {};
  nodes.forEach(node => {
    // Support both new `related` and legacy `relatedIds`
    const related = node.related ||
      (node.relatedIds || []).map(id => ({ id, question: null }));
    related.forEach(r => {
      if (!nodeMap.has(r.id)) return;
      const edgeId = [node.id, r.id].sort().join('--');
      if (!edgeMap[edgeId]) {
        edgeMap[edgeId] = { id: edgeId, source: node.id, target: r.id, questions: [] };
      }
      if (r.question && !edgeMap[edgeId].questions.includes(r.question)) {
        edgeMap[edgeId].questions.push(r.question);
      }
    });
  });

  const edges = Object.values(edgeMap).map(e => ({
    ...e,
    weight: Math.max(1, e.questions.length),
  }));

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
