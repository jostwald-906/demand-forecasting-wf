import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, GitBranch } from 'lucide-react';
import SectionWrapper from './SectionWrapper';

interface CausalNode {
  id: string;
  label: string;
  category: 'upstream' | 'intermediate' | 'target';
  x: number;
  y: number;
  influence: number; // 0-1 strength
  description: string;
}

interface CausalEdge {
  from: string;
  to: string;
  strength: number; // 0-1
  direction: 'positive' | 'negative';
}

function getCausalData(niinId: string): { nodes: CausalNode[]; edges: CausalEdge[] } {
  const seed = parseInt(niinId.replace('niin-', ''), 10) || 1;
  const s = (seed * 29 + 5) % 100;

  const nodes: CausalNode[] = [
    // Upstream factors (left column)
    { id: 'fleet_hours', label: 'Fleet Flying Hours', category: 'upstream', x: 50, y: 40, influence: 0.7 + (s % 20) / 100, description: 'Total operational flying hours across supported platforms' },
    { id: 'failure_rate', label: 'Failure Rate', category: 'upstream', x: 50, y: 120, influence: 0.5 + (s * 3 % 30) / 100, description: 'Component mean time between failures (MTBF) trend' },
    { id: 'fleet_age', label: 'Fleet Age', category: 'upstream', x: 50, y: 200, influence: 0.3 + (s * 7 % 25) / 100, description: 'Average aircraft age increases maintenance frequency' },
    { id: 'deployment', label: 'Deployment Tempo', category: 'upstream', x: 50, y: 280, influence: 0.4 + (s * 11 % 20) / 100, description: 'Planned and active deployment operations' },
    { id: 'lead_time', label: 'Supplier Lead Time', category: 'upstream', x: 50, y: 360, influence: 0.6 + (s * 13 % 15) / 100, description: 'Average supplier delivery time from order to receipt' },

    // Intermediate factors (middle column)
    { id: 'maintenance_demand', label: 'Maintenance Demand', category: 'intermediate', x: 260, y: 80, influence: 0.8 + (s % 15) / 100, description: 'Derived maintenance workload from operations and age' },
    { id: 'supply_pipeline', label: 'Supply Pipeline', category: 'intermediate', x: 260, y: 200, influence: 0.65 + (s * 5 % 20) / 100, description: 'On-order and in-transit inventory pipeline health' },
    { id: 'seasonal_pattern', label: 'Seasonal Pattern', category: 'intermediate', x: 260, y: 320, influence: 0.35 + (s * 9 % 25) / 100, description: 'Cyclical demand patterns from fiscal year and exercise schedules' },

    // Target (right column)
    { id: 'demand', label: 'Part Demand', category: 'target', x: 470, y: 200, influence: 1.0, description: 'Forecasted demand for this NIIN' },
  ];

  const edges: CausalEdge[] = [
    // Upstream → Intermediate
    { from: 'fleet_hours', to: 'maintenance_demand', strength: 0.8 + (s % 15) / 100, direction: 'positive' },
    { from: 'failure_rate', to: 'maintenance_demand', strength: 0.7 + (s * 3 % 15) / 100, direction: 'positive' },
    { from: 'fleet_age', to: 'maintenance_demand', strength: 0.5 + (s * 5 % 20) / 100, direction: 'positive' },
    { from: 'deployment', to: 'maintenance_demand', strength: 0.45 + (s * 7 % 15) / 100, direction: 'positive' },
    { from: 'lead_time', to: 'supply_pipeline', strength: 0.75 + (s * 9 % 10) / 100, direction: 'negative' },
    { from: 'deployment', to: 'seasonal_pattern', strength: 0.3 + (s * 11 % 15) / 100, direction: 'positive' },

    // Intermediate → Target
    { from: 'maintenance_demand', to: 'demand', strength: 0.9 + (s % 8) / 100, direction: 'positive' },
    { from: 'supply_pipeline', to: 'demand', strength: 0.55 + (s * 3 % 15) / 100, direction: 'positive' },
    { from: 'seasonal_pattern', to: 'demand', strength: 0.4 + (s * 7 % 15) / 100, direction: 'positive' },

    // Some direct upstream → target connections
    { from: 'fleet_hours', to: 'demand', strength: 0.3 + (s % 10) / 100, direction: 'positive' },
  ];

  return { nodes, edges };
}

const CATEGORY_COLORS = {
  upstream: { fill: '#dbeafe', stroke: '#3b82f6', text: '#1e40af', darkFill: '#1e3a5f', darkStroke: '#60a5fa', darkText: '#93c5fd' },
  intermediate: { fill: '#fef3c7', stroke: '#f59e0b', text: '#92400e', darkFill: '#5c3d10', darkStroke: '#fbbf24', darkText: '#fcd34d' },
  target: { fill: '#dcfce7', stroke: '#22c55e', text: '#166534', darkFill: '#14532d', darkStroke: '#4ade80', darkText: '#86efac' },
};

interface CausalGraphProps {
  niinId: string;
}

export default function CausalGraph({ niinId }: CausalGraphProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const { nodes, edges } = useMemo(() => getCausalData(niinId), [niinId]);

  const selectedEdges = useMemo(() => {
    if (!selectedNode) return edges;
    return edges.filter((e) => e.from === selectedNode || e.to === selectedNode);
  }, [selectedNode, edges]);

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  return (
    <SectionWrapper
      title="Causal AI Graph"
      headerRight={
        <div className="flex items-center gap-2">
          <GitBranch className="w-3 h-3 text-primary-500" />
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      }
    >
      {!expanded ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Interactive causal graph showing how {nodes.filter((n) => n.category === 'upstream').length} upstream factors influence demand through {nodes.filter((n) => n.category === 'intermediate').length} intermediate variables. Click expand to explore.
        </p>
      ) : (
        <div className="space-y-3">
          <svg viewBox="0 0 540 400" className="w-full h-auto max-h-80">
            {/* Edges */}
            {selectedEdges.map((edge) => {
              const fromNode = nodes.find((n) => n.id === edge.from)!;
              const toNode = nodes.find((n) => n.id === edge.to)!;
              const isHighlighted = selectedNode === edge.from || selectedNode === edge.to;
              const strokeWidth = 1 + edge.strength * 3;
              const color = edge.direction === 'positive' ? '#22c55e' : '#ef4444';
              const opacity = isHighlighted || !selectedNode ? 0.6 : 0.15;

              // Curved path
              const midX = (fromNode.x + 70 + toNode.x) / 2;
              const midY = (fromNode.y + toNode.y) / 2;
              const path = `M ${fromNode.x + 70} ${fromNode.y} Q ${midX} ${midY - 10} ${toNode.x} ${toNode.y}`;

              return (
                <g key={`${edge.from}-${edge.to}`}>
                  <path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                    markerEnd="url(#arrowhead)"
                  />
                  {/* Strength label */}
                  {(isHighlighted || !selectedNode) && (
                    <text
                      x={midX}
                      y={midY - 5}
                      textAnchor="middle"
                      fontSize="8"
                      fill={isDark ? '#9ca3af' : '#6b7280'}
                      opacity={opacity + 0.2}
                    >
                      {(edge.strength * 100).toFixed(0)}%
                    </text>
                  )}
                </g>
              );
            })}

            {/* Arrow marker definition */}
            <defs>
              <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill={isDark ? '#9ca3af' : '#6b7280'} />
              </marker>
            </defs>

            {/* Nodes */}
            {nodes.map((node) => {
              const colors = CATEGORY_COLORS[node.category];
              const isSelected = selectedNode === node.id;
              const isConnected = selectedNode ? edges.some(
                (e) => (e.from === selectedNode && e.to === node.id) || (e.to === selectedNode && e.from === node.id)
              ) || node.id === selectedNode : true;
              const opacity = isConnected ? 1 : 0.3;

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                  className="cursor-pointer"
                  opacity={opacity}
                >
                  <rect
                    x={node.x}
                    y={node.y - 15}
                    width={node.category === 'target' ? 80 : 140}
                    height={30}
                    rx={6}
                    fill={isDark ? colors.darkFill : colors.fill}
                    stroke={isSelected ? '#2563eb' : (isDark ? colors.darkStroke : colors.stroke)}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                  <text
                    x={node.x + (node.category === 'target' ? 40 : 70)}
                    y={node.y + 1}
                    textAnchor="middle"
                    fontSize={node.category === 'target' ? 10 : 9}
                    fontWeight={node.category === 'target' ? 700 : 500}
                    fill={isDark ? colors.darkText : colors.text}
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}

            {/* Category labels */}
            <text x={50} y={18} fontSize="9" fontWeight="600" fill={isDark ? '#6b7280' : '#9ca3af'} style={{ textTransform: 'uppercase' }}>
              Upstream Factors
            </text>
            <text x={260} y={45} fontSize="9" fontWeight="600" fill={isDark ? '#6b7280' : '#9ca3af'} style={{ textTransform: 'uppercase' }}>
              Intermediate
            </text>
            <text x={470} y={170} fontSize="9" fontWeight="600" fill={isDark ? '#6b7280' : '#9ca3af'} style={{ textTransform: 'uppercase' }}>
              Target
            </text>
          </svg>

          {/* Selected node detail */}
          {selectedNode && (() => {
            const node = nodes.find((n) => n.id === selectedNode);
            if (!node) return null;
            const incomingEdges = edges.filter((e) => e.to === selectedNode);
            const outgoingEdges = edges.filter((e) => e.from === selectedNode);
            return (
              <div className="rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{node.label}</span>
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full uppercase ${
                    CATEGORY_COLORS[node.category] ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''
                  }`}>
                    {node.category}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 mb-2">{node.description}</p>
                <div className="flex gap-4 text-[10px]">
                  {incomingEdges.length > 0 && (
                    <span className="text-gray-500 dark:text-gray-400">
                      Influenced by: {incomingEdges.map((e) => nodes.find((n) => n.id === e.from)?.label).join(', ')}
                    </span>
                  )}
                  {outgoingEdges.length > 0 && (
                    <span className="text-gray-500 dark:text-gray-400">
                      Influences: {outgoingEdges.map((e) => nodes.find((n) => n.id === e.to)?.label).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="flex items-center gap-4 text-[10px] text-gray-500 dark:text-gray-400">
            <span className="font-medium">Click a node to explore its connections</span>
            <span className="inline-flex items-center gap-1"><span className="w-8 h-0.5 bg-green-500 inline-block" /> Positive</span>
            <span className="inline-flex items-center gap-1"><span className="w-8 h-0.5 bg-red-500 inline-block" /> Negative</span>
            <span>Edge width = influence strength</span>
          </div>
        </div>
      )}
    </SectionWrapper>
  );
}
