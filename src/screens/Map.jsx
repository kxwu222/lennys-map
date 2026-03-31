import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as d3 from 'd3';
import { getGraphData, getClusterCount } from '../utils/mapData';

export default function Map() {
  const svgRef = useRef(null);
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState(null);
  const [graphState, setGraphState] = useState('empty'); // empty, early, mature
  const simulationRef = useRef(null);

  useEffect(() => {
    const { nodes, edges } = getGraphData();

    if (nodes.length === 0) {
      setGraphState('empty');
      renderGhostConstellation();
      return;
    }
    if (nodes.length < 6) {
      setGraphState('early');
    } else {
      setGraphState('mature');
    }

    renderGraph(nodes, edges);

    return () => {
      simulationRef.current?.stop();
    };
  }, []);

  function renderGhostConstellation() {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const w = svgRef.current.clientWidth;
    const h = svgRef.current.clientHeight;

    // Ambient stars
    for (let i = 0; i < 40; i++) {
      svg.append('circle')
        .attr('cx', Math.random() * w)
        .attr('cy', Math.random() * h)
        .attr('r', 1 + Math.random() * 0.5)
        .attr('fill', '#C4783A')
        .attr('opacity', 0.04 + Math.random() * 0.04);
    }

    // Ghost nodes
    const ghostNodes = [
      { x: w * 0.3, y: h * 0.3 },
      { x: w * 0.5, y: h * 0.45 },
      { x: w * 0.7, y: h * 0.35 },
      { x: w * 0.4, y: h * 0.6 },
      { x: w * 0.6, y: h * 0.55 },
    ];

    ghostNodes.forEach((n, i) => {
      svg.append('circle')
        .attr('cx', n.x)
        .attr('cy', n.y)
        .attr('r', 6)
        .attr('fill', '#C4783A')
        .attr('opacity', 0.12);
      if (i < ghostNodes.length - 1) {
        svg.append('line')
          .attr('x1', n.x).attr('y1', n.y)
          .attr('x2', ghostNodes[i + 1].x).attr('y2', ghostNodes[i + 1].y)
          .attr('stroke', '#C4783A')
          .attr('stroke-width', 0.5)
          .attr('opacity', 0.08);
      }
    });
  }

  function renderGraph(nodes, edges) {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const w = svgRef.current.clientWidth;
    const h = svgRef.current.clientHeight;

    // Ambient stars
    for (let i = 0; i < 30; i++) {
      svg.append('circle')
        .attr('cx', Math.random() * w)
        .attr('cy', Math.random() * h)
        .attr('r', 1 + Math.random() * 0.5)
        .attr('fill', '#C4783A')
        .attr('opacity', 0.04 + Math.random() * 0.04);
    }

    const now = Date.now();
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

    const simNodes = nodes.map(n => ({ ...n }));
    const simEdges = edges.map(e => ({
      source: simNodes.find(n => n.id === e.source),
      target: simNodes.find(n => n.id === e.target),
    })).filter(e => e.source && e.target);

    const simulation = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink(simEdges).id(d => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(w / 2, h / 2));

    simulationRef.current = simulation;

    const g = svg.append('g');

    // Zoom
    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);

    const link = g.selectAll('.edge')
      .data(simEdges)
      .join('line')
      .attr('class', 'edge')
      .attr('stroke', '#C4783A')
      .attr('stroke-width', 1)
      .attr('opacity', 0.3);

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
        setSelectedNode(d);

        // Dim non-connected
        const connected = new Set([d.id]);
        simEdges.forEach(e => {
          if (e.source.id === d.id) connected.add(e.target.id);
          if (e.target.id === d.id) connected.add(e.source.id);
        });

        node.attr('opacity', n => connected.has(n.id) ? 1 : 0.08);
        link.attr('opacity', e =>
          (e.source.id === d.id || e.target.id === d.id) ? 0.6 : 0.03
        );
        label.attr('opacity', n => connected.has(n.id) ? 1 : 0.08);
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
      .attr('dy', d => -radiusScale(d.visitCount) - 6);

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
      label
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });

    // Click backdrop to deselect
    svg.on('click', () => {
      setSelectedNode(null);
      node.attr('opacity', 1);
      link.attr('opacity', 0.3);
      label.attr('opacity', 1);
      simulation.alpha(0.3).restart();
    });
  }

  function handleGoDeeper() {
    if (selectedNode) {
      navigate('/ask', { state: { question: `Tell me more about ${selectedNode.label}` } });
    }
  }

  const clusters = getClusterCount();
  const { nodes } = getGraphData();

  return (
    <div className="map-screen">
      <svg ref={svgRef} className="map-svg" />

      {graphState === 'empty' && (
        <div className="map-empty">
          <p className="map-empty-text">Your ideas will constellation here</p>
        </div>
      )}

      {graphState === 'early' && !selectedNode && (
        <div className="map-hint">
          <p>Tap any idea to explore</p>
        </div>
      )}

      {selectedNode && (
        <div className="map-tooltip">
          <span className="map-tooltip-category">{selectedNode.category}</span>
          <h3 className="map-tooltip-label">{selectedNode.label}</h3>
          <div className="map-tooltip-stats">
            <span>{selectedNode.visitCount} visit{selectedNode.visitCount !== 1 ? 's' : ''}</span>
            <span>{(selectedNode.relatedIds || []).length} connection{(selectedNode.relatedIds || []).length !== 1 ? 's' : ''}</span>
            <span>Last: {new Date(selectedNode.timestamp).toLocaleDateString()}</span>
          </div>
          <button className="map-tooltip-cta" onClick={handleGoDeeper}>
            Go deeper &rarr;
          </button>
          <button className="map-tooltip-dismiss" onClick={() => setSelectedNode(null)}>
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
