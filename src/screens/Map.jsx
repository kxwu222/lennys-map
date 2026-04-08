import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as d3 from 'd3';
import { getGraphData, getClusterCount } from '../utils/mapData';

export default function Map() {
  const svgRef = useRef(null);
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [graphState, setGraphState] = useState('empty');
  const simulationRef = useRef(null);
  const nodeSelRef = useRef(null);
  const linkSelRef = useRef(null);
  const labelSelRef = useRef(null);
  const glowSelRef = useRef(null);

  useEffect(() => {
    const { nodes, edges } = getGraphData();

    if (nodes.length === 0) {
      setGraphState('empty');
      renderGhostConstellation();
      return;
    }
    setGraphState(nodes.length < 6 ? 'early' : 'mature');
    renderGraph(nodes, edges);

    return () => {
      simulationRef.current?.stop();
    };
  }, []);

  function resetHighlights() {
    nodeSelRef.current?.attr('opacity', 1);
    linkSelRef.current?.attr('opacity', 0.3);
    labelSelRef.current?.attr('opacity', 1);
    glowSelRef.current?.attr('opacity', 0.25);
    simulationRef.current?.alpha(0.3).restart();
  }

  function handleDismissNode() {
    setSelectedNode(null);
    resetHighlights();
  }

  function handleDismissEdge() {
    setSelectedEdge(null);
    resetHighlights();
  }

  function renderGhostConstellation() {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const w = svgRef.current.clientWidth;
    const h = svgRef.current.clientHeight;

    for (let i = 0; i < 40; i++) {
      svg.append('circle')
        .attr('cx', Math.random() * w)
        .attr('cy', Math.random() * h)
        .attr('r', 1 + Math.random() * 0.5)
        .attr('fill', '#C4783A')
        .attr('opacity', 0.04 + Math.random() * 0.04);
    }

    const ghostNodes = [
      { x: w * 0.3, y: h * 0.3 },
      { x: w * 0.5, y: h * 0.45 },
      { x: w * 0.7, y: h * 0.35 },
      { x: w * 0.4, y: h * 0.6 },
      { x: w * 0.6, y: h * 0.55 },
    ];

    ghostNodes.forEach((n, i) => {
      svg.append('circle')
        .attr('cx', n.x).attr('cy', n.y)
        .attr('r', 6)
        .attr('fill', '#C4783A')
        .attr('opacity', 0.12);
      if (i < ghostNodes.length - 1) {
        svg.append('line')
          .attr('x1', n.x).attr('y1', n.y)
          .attr('x2', ghostNodes[i + 1].x).attr('y2', ghostNodes[i + 1].y)
          .attr('stroke', '#C4783A').attr('stroke-width', 0.5).attr('opacity', 0.08);
      }
    });
  }

  function renderGraph(nodes, edges) {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const w = svgRef.current.clientWidth;
    const h = svgRef.current.clientHeight;

    for (let i = 0; i < 30; i++) {
      svg.append('circle')
        .attr('cx', Math.random() * w)
        .attr('cy', Math.random() * h)
        .attr('r', 1 + Math.random() * 0.5)
        .attr('fill', '#C4783A')
        .attr('opacity', 0.04 + Math.random() * 0.04);
    }

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    const twoWeeks = 14 * 24 * 60 * 60 * 1000;

    const colorScale = d3.scaleLinear()
      .domain([0, threeDays, twoWeeks])
      .range(['#C4783A', '#C4783A', '#3A2818'])
      .clamp(true);

    const radiusScale = d3.scaleLinear()
      .domain([1, Math.max(...nodes.map(n => n.visitCount), 4)])
      .range([6, 20])
      .clamp(true);

    const edgeWidthScale = d3.scaleLinear()
      .domain([1, 5]).range([1, 3]).clamp(true);

    const simNodes = nodes.map(n => ({ ...n }));
    const simEdges = edges.map(e => ({
      source: simNodes.find(n => n.id === e.source),
      target: simNodes.find(n => n.id === e.target),
      questions: e.questions || [],
      weight: e.weight || 1,
    })).filter(e => e.source && e.target);

    const simulation = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink(simEdges).id(d => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(w / 2, h / 2));

    simulationRef.current = simulation;

    const g = svg.append('g');

    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);

    // Visible edges
    const link = g.selectAll('.edge')
      .data(simEdges)
      .join('line')
      .attr('class', 'edge')
      .attr('stroke', '#C4783A')
      .attr('stroke-width', d => edgeWidthScale(d.weight))
      .attr('opacity', 0.3);

    // Invisible hit area for edges
    const linkHit = g.selectAll('.edge-hit')
      .data(simEdges)
      .join('line')
      .attr('class', 'edge-hit')
      .attr('stroke', 'transparent')
      .attr('stroke-width', 16)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(null);
        setSelectedEdge({
          sourceLabel: d.source.label,
          targetLabel: d.target.label,
          questions: d.questions || [],
        });
        link.attr('opacity', e => e === d ? 0.8 : 0.06);
        linkHit.attr('cursor', 'pointer');
        nodeSelRef.current?.attr('opacity', n =>
          (n.id === d.source.id || n.id === d.target.id) ? 1 : 0.12
        );
        labelSelRef.current?.attr('opacity', n =>
          (n.id === d.source.id || n.id === d.target.id) ? 1 : 0.12
        );
        glowSelRef.current?.attr('opacity', n =>
          (n.id === d.source.id || n.id === d.target.id) ? 0.45 : 0
        );
      });

    // Today glow rings
    const recentNodes = simNodes.filter(n => now - n.timestamp < oneDayMs);
    const glow = g.selectAll('.node-glow')
      .data(recentNodes)
      .join('circle')
      .attr('class', 'node-glow')
      .attr('r', d => radiusScale(d.visitCount) + 7)
      .attr('fill', 'none')
      .attr('stroke', '#C4783A')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.25);

    const node = g.selectAll('.node')
      .data(simNodes)
      .join('circle')
      .attr('class', 'node')
      .attr('r', d => radiusScale(d.visitCount))
      .attr('fill', d => colorScale(now - d.timestamp))
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        simulation.alpha(0);
        setSelectedEdge(null);

        // Build connection map: group by peer id, collect questions
        const related = d.related ||
          (d.relatedIds || []).map(id => ({ id, question: null }));
        const connMap = {};
        related.forEach(r => {
          if (!simNodes.some(n => n.id === r.id)) return;
          if (!connMap[r.id]) {
            connMap[r.id] = {
              id: r.id,
              label: simNodes.find(n => n.id === r.id)?.label,
              questions: [],
            };
          }
          if (r.question && !connMap[r.id].questions.includes(r.question)) {
            connMap[r.id].questions.push(r.question);
          }
        });
        const connections = Object.values(connMap);

        setSelectedNode({ ...d, connections });

        const connected = new Set([d.id, ...connections.map(c => c.id)]);
        node.attr('opacity', n => connected.has(n.id) ? 1 : 0.08);
        link.attr('opacity', e =>
          (e.source.id === d.id || e.target.id === d.id) ? 0.6 : 0.03
        );
        label.attr('opacity', n => connected.has(n.id) ? 1 : 0.08);
        glow.attr('opacity', n => connected.has(n.id) ? 0.35 : 0.05);
      });

    const label = g.selectAll('.label')
      .data(simNodes)
      .join('text')
      .attr('class', 'label')
      .text(d => d.label)
      .attr('fill', '#3D2E1E')
      .attr('font-size', 11)
      .attr('font-family', 'DM Sans, sans-serif')
      .attr('text-anchor', 'middle')
      .attr('dy', d => -radiusScale(d.visitCount) - 6)
      .attr('pointer-events', 'none');

    // Store refs for reset from outside the closure
    nodeSelRef.current = node;
    linkSelRef.current = link;
    labelSelRef.current = label;
    glowSelRef.current = glow;

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      linkHit
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('cx', d => d.x).attr('cy', d => d.y);
      label.attr('x', d => d.x).attr('y', d => d.y);
      glow.attr('cx', d => d.x).attr('cy', d => d.y);
    });

    svg.on('click', () => {
      setSelectedNode(null);
      setSelectedEdge(null);
      resetHighlights();
    });
  }

  function handleGoDeeper() {
    if (selectedNode) {
      navigate('/ask', { state: { question: `Tell me more about ${selectedNode.label}` } });
    }
  }

  function handleContinueThread(question) {
    navigate('/ask', { state: { question } });
  }

  return (
    <div className="map-screen">
      <svg ref={svgRef} className="map-svg" />

      {graphState === 'empty' && (
        <div className="map-empty">
          <div className="map-empty-inner">
            <p className="map-empty-headline">Your exploration map</p>
            <p className="map-empty-body">
              Topics you explore in Ask appear here as nodes. Topics cited together in the same answer are connected — tap any line to see why.
            </p>
            <button className="map-empty-cta" onClick={() => navigate('/ask')}>
              Start exploring →
            </button>
          </div>
        </div>
      )}

      {graphState !== 'empty' && !selectedNode && !selectedEdge && (
        <div className="map-legend">
          <span className="map-legend-item">
            <span className="map-legend-dot" />Topics
          </span>
          <span className="map-legend-sep">·</span>
          <span className="map-legend-item">
            <span className="map-legend-line" />Asked together
          </span>
          <span className="map-legend-sep">·</span>
          <span className="map-legend-hint">Tap to explore</span>
        </div>
      )}

      {selectedNode && (
        <div className="map-panel map-panel--node">
          <button className="map-panel-dismiss" onClick={handleDismissNode}>×</button>
          <span className="map-panel-category">{selectedNode.category}</span>
          <h3 className="map-panel-title">{selectedNode.label}</h3>
          <div className="map-panel-meta">
            <span>{selectedNode.visitCount} visit{selectedNode.visitCount !== 1 ? 's' : ''}</span>
            {selectedNode.connections?.length > 0 && (
              <span>{selectedNode.connections.length} connection{selectedNode.connections.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {selectedNode.connections?.length > 0 && (
            <div className="map-panel-connections">
              <p className="map-panel-section-label">Connected to</p>
              {selectedNode.connections.slice(0, 3).map((c, i) => (
                <div key={i} className="map-panel-connection-row">
                  <span className="map-panel-connection-name">{c.label}</span>
                  {c.questions[0] && (
                    <span className="map-panel-connection-via">via "{c.questions[0]}"</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <button className="map-panel-cta" onClick={handleGoDeeper}>
            Go deeper →
          </button>
        </div>
      )}

      {selectedEdge && (
        <div className="map-panel map-panel--edge">
          <button className="map-panel-dismiss" onClick={handleDismissEdge}>×</button>
          <div className="map-panel-edge-topics">
            <span className="map-panel-edge-topic">{selectedEdge.sourceLabel}</span>
            <span className="map-panel-edge-connector">—</span>
            <span className="map-panel-edge-topic">{selectedEdge.targetLabel}</span>
          </div>

          {selectedEdge.questions.length > 0 ? (
            <>
              <p className="map-panel-section-label">Linked when you asked</p>
              <div className="map-panel-edge-questions">
                {selectedEdge.questions.slice(0, 3).map((q, i) => (
                  <button
                    key={i}
                    className="map-panel-edge-question"
                    onClick={() => handleContinueThread(q)}
                  >
                    <span className="map-panel-edge-question-text">"{q}"</span>
                    <span className="map-panel-edge-question-cta">Continue →</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="map-panel-section-label">These topics appeared in the same answer.</p>
          )}
        </div>
      )}
    </div>
  );
}
