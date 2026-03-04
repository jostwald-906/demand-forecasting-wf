import { useState, useMemo, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Zap, Ship, AlertTriangle, MapPin, ArrowRight, Package } from 'lucide-react';

interface NetworkNode {
  id: string;
  label: string;
  type: 'base' | 'depot' | 'supplier' | 'port';
  x: number;
  y: number;
  inventory: number;
  capacity: number;
  weeklyConsumption: number; // units consumed per week (bases) or produced (suppliers)
  status: 'nominal' | 'stressed' | 'critical';
}

interface NetworkLink {
  from: string;
  to: string;
  flow: number;
  capacity: number;
  leadTimeDays: number;
  disrupted: boolean;
}

interface InjectedEvent {
  id: string;
  label: string;
  type: 'disruption' | 'surge' | 'delay';
  targetNode: string;
  severity: number;
  description: string;
}

const INITIAL_NODES: NetworkNode[] = [
  // Suppliers (left) — produce inventory
  { id: 'supplier-1', label: 'Timken (OH)', type: 'supplier', x: 60, y: 60, inventory: 500, capacity: 800, weeklyConsumption: -40, status: 'nominal' },
  { id: 'supplier-2', label: 'Parker (CA)', type: 'supplier', x: 60, y: 180, inventory: 300, capacity: 500, weeklyConsumption: -30, status: 'nominal' },
  { id: 'supplier-3', label: 'Northrop (CA)', type: 'supplier', x: 60, y: 300, inventory: 100, capacity: 200, weeklyConsumption: -15, status: 'nominal' },

  // Distribution hubs — pass-through
  { id: 'port-1', label: 'DLA Hub East', type: 'port', x: 260, y: 100, inventory: 800, capacity: 1000, weeklyConsumption: 0, status: 'nominal' },
  { id: 'port-2', label: 'DLA Hub West', type: 'port', x: 260, y: 260, inventory: 600, capacity: 800, weeklyConsumption: 0, status: 'nominal' },

  // Depots — moderate consumption for repair
  { id: 'depot-1', label: 'Tinker AFB', type: 'depot', x: 440, y: 60, inventory: 350, capacity: 500, weeklyConsumption: 8, status: 'nominal' },
  { id: 'depot-2', label: 'Warner Robins', type: 'depot', x: 440, y: 180, inventory: 280, capacity: 400, weeklyConsumption: 10, status: 'nominal' },
  { id: 'depot-3', label: 'Ogden ALC', type: 'depot', x: 440, y: 300, inventory: 420, capacity: 500, weeklyConsumption: 7, status: 'nominal' },

  // Bases — consume inventory
  { id: 'base-1', label: 'Eglin AFB', type: 'base', x: 620, y: 40, inventory: 45, capacity: 80, weeklyConsumption: 5, status: 'nominal' },
  { id: 'base-2', label: 'Hill AFB', type: 'base', x: 620, y: 120, inventory: 38, capacity: 60, weeklyConsumption: 4, status: 'nominal' },
  { id: 'base-3', label: 'Nellis AFB', type: 'base', x: 620, y: 200, inventory: 22, capacity: 50, weeklyConsumption: 6, status: 'nominal' },
  { id: 'base-4', label: 'JBSA Lackland', type: 'base', x: 620, y: 280, inventory: 55, capacity: 70, weeklyConsumption: 3, status: 'nominal' },
  { id: 'base-5', label: 'Kadena AB', type: 'base', x: 620, y: 360, inventory: 15, capacity: 40, weeklyConsumption: 4, status: 'nominal' },
];

const INITIAL_LINKS: NetworkLink[] = [
  { from: 'supplier-1', to: 'port-1', flow: 35, capacity: 50, leadTimeDays: 14, disrupted: false },
  { from: 'supplier-2', to: 'port-1', flow: 20, capacity: 40, leadTimeDays: 21, disrupted: false },
  { from: 'supplier-2', to: 'port-2', flow: 15, capacity: 30, leadTimeDays: 18, disrupted: false },
  { from: 'supplier-3', to: 'port-2', flow: 12, capacity: 25, leadTimeDays: 30, disrupted: false },
  { from: 'port-1', to: 'depot-1', flow: 25, capacity: 35, leadTimeDays: 5, disrupted: false },
  { from: 'port-1', to: 'depot-2', flow: 28, capacity: 40, leadTimeDays: 7, disrupted: false },
  { from: 'port-2', to: 'depot-2', flow: 12, capacity: 25, leadTimeDays: 6, disrupted: false },
  { from: 'port-2', to: 'depot-3', flow: 18, capacity: 30, leadTimeDays: 4, disrupted: false },
  { from: 'depot-1', to: 'base-1', flow: 5, capacity: 10, leadTimeDays: 3, disrupted: false },
  { from: 'depot-1', to: 'base-2', flow: 4, capacity: 8, leadTimeDays: 4, disrupted: false },
  { from: 'depot-2', to: 'base-3', flow: 6, capacity: 10, leadTimeDays: 5, disrupted: false },
  { from: 'depot-2', to: 'base-4', flow: 3, capacity: 8, leadTimeDays: 3, disrupted: false },
  { from: 'depot-3', to: 'base-4', flow: 3, capacity: 6, leadTimeDays: 4, disrupted: false },
  { from: 'depot-3', to: 'base-5', flow: 4, capacity: 8, leadTimeDays: 14, disrupted: false },
];

const EVENT_PRESETS: InjectedEvent[] = [
  { id: 'evt-1', label: 'Supplier Shutdown', type: 'disruption', targetNode: 'supplier-1', severity: 0.9, description: 'Timken production halted — zero output' },
  { id: 'evt-2', label: 'Port Congestion', type: 'delay', targetNode: 'port-1', severity: 0.6, description: 'DLA Hub East throughput reduced 60%' },
  { id: 'evt-3', label: 'Deployment Surge', type: 'surge', targetNode: 'base-5', severity: 0.8, description: 'Kadena AB consumption doubles' },
  { id: 'evt-4', label: 'Quality Hold', type: 'disruption', targetNode: 'depot-2', severity: 0.7, description: 'Warner Robins outbound shipments frozen' },
  { id: 'evt-5', label: 'Typhoon (PACAF)', type: 'disruption', targetNode: 'base-5', severity: 0.95, description: 'Kadena AB inbound shipments blocked' },
];

const NODE_STYLES: Record<NetworkNode['type'], { fill: string; stroke: string; darkFill: string; darkStroke: string; icon: typeof MapPin }> = {
  supplier: { fill: '#dbeafe', stroke: '#3b82f6', darkFill: '#1e3a5f', darkStroke: '#60a5fa', icon: Package },
  port: { fill: '#fef3c7', stroke: '#f59e0b', darkFill: '#5c3d10', darkStroke: '#fbbf24', icon: Ship },
  depot: { fill: '#dcfce7', stroke: '#22c55e', darkFill: '#14532d', darkStroke: '#4ade80', icon: MapPin },
  base: { fill: '#f3e8ff', stroke: '#8b5cf6', darkFill: '#3b1764', darkStroke: '#a78bfa', icon: MapPin },
};

export default function DigitalTwinSandbox() {
  const [timeStep, setTimeStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeEvents, setActiveEvents] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  // Simulate time progression
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTimeStep((prev) => {
        if (prev >= 52) { setIsPlaying(false); return 52; }
        return prev + 1;
      });
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Compute network state by simulating week-by-week
  const { nodes, links, readinessScore, affectedNiins, statusLog } = useMemo(() => {
    // Deep copy initial state
    let simNodes = INITIAL_NODES.map((n) => ({ ...n }));
    let simLinks = INITIAL_LINKS.map((l) => ({ ...l }));
    const log: string[] = [];

    // Simulate each week up to current timeStep
    for (let week = 0; week <= timeStep; week++) {
      // Determine which events are active
      const eventMap = new Map<string, InjectedEvent>();
      activeEvents.forEach((evtId) => {
        const evt = EVENT_PRESETS.find((e) => e.id === evtId);
        if (evt) eventMap.set(evt.targetNode, evt);
      });

      // 1. Suppliers produce (negative consumption = production), unless disrupted
      for (const node of simNodes) {
        if (node.type === 'supplier') {
          const evt = eventMap.get(node.id);
          if (evt && evt.type === 'disruption') {
            // Supplier shut down: zero production
            node.inventory = Math.max(0, node.inventory * 0.95); // inventory slowly runs out
          } else {
            // Normal production: add to inventory (capped at capacity)
            node.inventory = Math.min(node.capacity, node.inventory + Math.abs(node.weeklyConsumption));
          }
        }
      }

      // 2. Flow along links: transfer inventory downstream
      for (const link of simLinks) {
        const fromNode = simNodes.find((n) => n.id === link.from)!;
        const toNode = simNodes.find((n) => n.id === link.to)!;
        const fromEvt = eventMap.get(link.from);
        const toEvt = eventMap.get(link.to);

        // Lead time delay: flow only arrives after lead time in weeks
        const leadWeeks = Math.ceil(link.leadTimeDays / 7);

        // Disruptions reduce flow
        let flowMultiplier = 1;
        if (fromEvt) {
          if (fromEvt.type === 'disruption') flowMultiplier = 1 - fromEvt.severity;
          else if (fromEvt.type === 'delay') flowMultiplier = 1 - fromEvt.severity * 0.6;
        }
        if (toEvt && toEvt.type === 'disruption') {
          flowMultiplier *= (1 - toEvt.severity * 0.5);
        }

        const actualFlow = Math.round(link.flow * flowMultiplier);
        link.disrupted = flowMultiplier < 0.7;

        // Transfer: remove from source, add to destination (respecting available inventory)
        if (week >= leadWeeks) {
          const transferable = Math.min(actualFlow, fromNode.inventory);
          fromNode.inventory = Math.max(0, fromNode.inventory - transferable);
          toNode.inventory = Math.min(toNode.capacity, toNode.inventory + transferable);
        }
      }

      // 3. Consumption: bases and depots consume inventory
      for (const node of simNodes) {
        if (node.weeklyConsumption > 0) {
          const evt = eventMap.get(node.id);
          let consumption = node.weeklyConsumption;
          if (evt && evt.type === 'surge') {
            consumption = Math.round(consumption * (1 + evt.severity));
          }
          node.inventory = Math.max(0, node.inventory - consumption);
        }
      }

      // 4. Update node status
      for (const node of simNodes) {
        const fillPct = node.inventory / node.capacity;
        if (fillPct < 0.15) node.status = 'critical';
        else if (fillPct < 0.4) node.status = 'stressed';
        else node.status = 'nominal';
      }
    }

    // Generate status log
    const criticalNodes = simNodes.filter((n) => n.status === 'critical');
    const stressedNodes = simNodes.filter((n) => n.status === 'stressed');
    if (criticalNodes.length > 0) {
      log.push(`CRITICAL: ${criticalNodes.map((n) => n.label).join(', ')} at dangerously low inventory`);
    }
    if (stressedNodes.length > 0) {
      log.push(`STRESSED: ${stressedNodes.map((n) => n.label).join(', ')} below 40% capacity`);
    }
    activeEvents.forEach((evtId) => {
      const evt = EVENT_PRESETS.find((e) => e.id === evtId);
      if (evt) log.push(`EVENT: ${evt.description}`);
    });
    if (log.length === 0) log.push('All nodes operating within normal parameters');

    // Readiness: base fill rates
    const baseNodes = simNodes.filter((n) => n.type === 'base');
    const totalCap = baseNodes.reduce((s, n) => s + n.capacity, 0);
    const totalInv = baseNodes.reduce((s, n) => s + n.inventory, 0);
    const readiness = Math.round((totalInv / totalCap) * 100);

    // Affected NIINs estimate: critical + stressed nodes
    const affected = Math.min(20, criticalNodes.length * 4 + stressedNodes.length * 2);

    return {
      nodes: simNodes,
      links: simLinks,
      readinessScore: readiness,
      affectedNiins: affected,
      statusLog: log,
    };
  }, [timeStep, activeEvents]);

  const toggleEvent = useCallback((evtId: string) => {
    setActiveEvents((prev) => {
      const next = new Set(prev);
      if (next.has(evtId)) next.delete(evtId);
      else next.add(evtId);
      return next;
    });
  }, []);

  const resetSim = () => {
    setTimeStep(0);
    setIsPlaying(false);
    setActiveEvents(new Set());
    setSelectedNode(null);
  };

  const currentWeek = `Week ${timeStep}`;
  const currentMonth = new Date(2026, 2 + Math.floor(timeStep / 4), 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Digital Twin Simulation</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Logistics network with inventory physics — inject events and watch disruptions cascade</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${readinessScore >= 70 ? 'text-green-600 dark:text-green-400' : readinessScore >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
              {readinessScore}%
            </div>
            <span className="text-[9px] text-gray-500 dark:text-gray-400 uppercase font-medium">Base Readiness</span>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${affectedNiins === 0 ? 'text-green-600 dark:text-green-400' : affectedNiins <= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
              {affectedNiins}
            </div>
            <span className="text-[9px] text-gray-500 dark:text-gray-400 uppercase font-medium">NIINs Affected</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {/* Network visualization */}
        <div className="col-span-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <svg viewBox="0 0 700 400" className="w-full h-auto">
            {/* Links */}
            {links.map((link) => {
              const from = nodes.find((n) => n.id === link.from)!;
              const to = nodes.find((n) => n.id === link.to)!;
              return (
                <g key={`${link.from}-${link.to}`}>
                  <line
                    x1={from.x + 40} y1={from.y} x2={to.x} y2={to.y}
                    stroke={link.disrupted ? '#ef4444' : (isDark ? '#4b5563' : '#d1d5db')}
                    strokeWidth={link.disrupted ? 2 : 1.5}
                    strokeDasharray={link.disrupted ? '4 3' : undefined}
                    opacity={0.6}
                  />
                  <text
                    x={(from.x + 40 + to.x) / 2}
                    y={(from.y + to.y) / 2 - 4}
                    textAnchor="middle"
                    fontSize="7"
                    fill={link.disrupted ? '#ef4444' : (isDark ? '#6b7280' : '#9ca3af')}
                  >
                    {link.flow}/wk
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const styles = NODE_STYLES[node.type];
              const isSelected = selectedNode === node.id;
              const fillPct = (node.inventory / node.capacity) * 100;
              const statusColor = node.status === 'critical' ? '#ef4444' : node.status === 'stressed' ? '#f59e0b' : (isDark ? styles.darkStroke : styles.stroke);

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNode(isSelected ? null : node.id)}
                  className="cursor-pointer"
                >
                  {node.status !== 'nominal' && (
                    <circle cx={node.x + 20} cy={node.y} r={24} fill={statusColor} opacity={0.15}>
                      <animate attributeName="r" values="24;28;24" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}

                  <rect
                    x={node.x} y={node.y - 18} width={80} height={36} rx={6}
                    fill={isDark ? styles.darkFill : styles.fill}
                    stroke={isSelected ? '#2563eb' : statusColor}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />

                  {/* Inventory bar */}
                  <rect x={node.x + 2} y={node.y + 12} width={76} height={3} rx={1.5} fill={isDark ? '#374151' : '#e5e7eb'} />
                  <rect
                    x={node.x + 2} y={node.y + 12}
                    width={Math.max(0, 76 * fillPct / 100)} height={3} rx={1.5}
                    fill={fillPct > 50 ? '#22c55e' : fillPct > 25 ? '#f59e0b' : '#ef4444'}
                  />

                  <text
                    x={node.x + 40} y={node.y - 2}
                    textAnchor="middle" fontSize="8" fontWeight="600"
                    fill={isDark ? styles.darkStroke : styles.stroke}
                  >
                    {node.label}
                  </text>
                  <text
                    x={node.x + 40} y={node.y + 9}
                    textAnchor="middle" fontSize="7"
                    fill={isDark ? '#9ca3af' : '#6b7280'}
                  >
                    {node.inventory}/{node.capacity}
                  </text>
                </g>
              );
            })}

            {/* Layer labels */}
            <text x={60} y={390} fontSize="8" fontWeight="600" fill={isDark ? '#4b5563' : '#9ca3af'}>SUPPLIERS</text>
            <text x={260} y={390} fontSize="8" fontWeight="600" fill={isDark ? '#4b5563' : '#9ca3af'}>DISTRIBUTION</text>
            <text x={440} y={390} fontSize="8" fontWeight="600" fill={isDark ? '#4b5563' : '#9ca3af'}>DEPOTS</text>
            <text x={620} y={390} fontSize="8" fontWeight="600" fill={isDark ? '#4b5563' : '#9ca3af'}>BASES</text>
          </svg>
        </div>

        {/* Control panel */}
        <div className="space-y-3">
          {/* Time controls */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-3">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
              Simulation Time
            </h4>
            <div className="text-center mb-2">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{currentWeek}</div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400">{currentMonth}</div>
            </div>
            <input
              type="range"
              min={0}
              max={52}
              value={timeStep}
              onChange={(e) => setTimeStep(parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex items-center justify-center gap-2 mt-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={resetSim}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Event injection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-3">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
              Inject Events
            </h4>
            <div className="space-y-1.5">
              {EVENT_PRESETS.map((evt) => {
                const isActive = activeEvents.has(evt.id);
                return (
                  <button
                    key={evt.id}
                    onClick={() => toggleEvent(evt.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium text-left transition-colors ${
                      isActive
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700'
                        : 'border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {evt.type === 'disruption' ? <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      : evt.type === 'surge' ? <Zap className="w-3 h-3 flex-shrink-0" />
                      : <ArrowRight className="w-3 h-3 flex-shrink-0" />}
                    <span className="flex-1">{evt.label}</span>
                    {isActive && <span className="text-[8px] bg-red-500 text-white px-1 py-0.5 rounded">ACTIVE</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status log */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-3">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
              Status
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {statusLog.map((msg, i) => (
                <p key={i} className={`text-[10px] leading-relaxed ${
                  msg.startsWith('CRITICAL') ? 'text-red-600 dark:text-red-400 font-medium' :
                  msg.startsWith('STRESSED') ? 'text-amber-600 dark:text-amber-400' :
                  msg.startsWith('EVENT') ? 'text-blue-600 dark:text-blue-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                  {msg}
                </p>
              ))}
            </div>
          </div>

          {/* Selected node detail */}
          {selectedNode && (() => {
            const node = nodes.find((n) => n.id === selectedNode);
            if (!node) return null;
            const inLinks = links.filter((l) => l.to === node.id);
            const outLinks = links.filter((l) => l.from === node.id);
            const fillPct = Math.round((node.inventory / node.capacity) * 100);
            return (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-3">
                <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">{node.label}</h4>
                <div className="space-y-1 text-[10px] text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Inventory:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{node.inventory} / {node.capacity} ({fillPct}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{node.weeklyConsumption < 0 ? 'Weekly Output:' : 'Weekly Consumption:'}</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{Math.abs(node.weeklyConsumption)}/wk</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-medium ${node.status === 'critical' ? 'text-red-600 dark:text-red-400' : node.status === 'stressed' ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                      {node.status.charAt(0).toUpperCase() + node.status.slice(1)}
                    </span>
                  </div>
                  {inLinks.length > 0 && (
                    <div><span className="font-medium">Inbound:</span> {inLinks.map((l) => `${nodes.find((n) => n.id === l.from)?.label} (${l.flow}/wk)`).join(', ')}</div>
                  )}
                  {outLinks.length > 0 && (
                    <div><span className="font-medium">Outbound:</span> {outLinks.map((l) => `${nodes.find((n) => n.id === l.to)?.label} (${l.flow}/wk)`).join(', ')}</div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-gray-500 dark:text-gray-400">
        {Object.entries(NODE_STYLES).map(([type, styles]) => (
          <span key={type} className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded border" style={{ backgroundColor: isDark ? styles.darkFill : styles.fill, borderColor: isDark ? styles.darkStroke : styles.stroke }} />
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        ))}
        <span className="ml-2">|</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-0.5 bg-gray-300 inline-block" /> Normal flow</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 inline-block" /> Disrupted</span>
      </div>
    </div>
  );
}
