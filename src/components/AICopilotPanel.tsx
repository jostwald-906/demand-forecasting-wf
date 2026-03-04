import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react';
import { useAppDispatch, useSelectedNiinData } from '@/context/AppContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  chips?: ScenarioChip[];
  sparkline?: number[];
}

interface ScenarioChip {
  label: string;
  params: Partial<{ failureRateMultiplier: number; utilizationMultiplier: number; leadTimeShockDays: number; capacityCapPercent: number; seasonalityStrength: number }>;
}

const SUGGESTED_PROMPTS = [
  { text: 'What if F-35 deployment surges 40%?', icon: TrendingUp },
  { text: 'When will we stock out at current rate?', icon: AlertTriangle },
  { text: 'What\'s the cheapest way to avoid breach?', icon: Sparkles },
  { text: 'Show me worst-case lead time scenario', icon: AlertTriangle },
];

function MiniSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 24;
  const w = 80;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="inline-block ml-1">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary-500" />
    </svg>
  );
}

function generateResponse(query: string, data: ReturnType<typeof useSelectedNiinData>): Message {
  const q = query.toLowerCase();
  const id = `msg-${Date.now()}`;

  if (!data) {
    return { id, role: 'assistant', content: 'Select a NIIN first to enable analysis. I can help you explore scenarios, forecast risks, and optimize actions once a part is selected.' };
  }

  const { niin, risk, operational, recommendations } = data;

  if (q.includes('surge') || q.includes('deployment') || q.includes('40%')) {
    const surgedDemand = Math.round(operational.demand90d * 1.4);
    const newStockout = Math.min(99, Math.round(risk.stockoutProb90d * 1.6));
    return {
      id, role: 'assistant',
      content: `A 40% deployment surge on ${niin.platforms[0]} would increase 90-day demand from ${operational.demand90d} to ~${surgedDemand} units. Stockout probability jumps from ${risk.stockoutProb90d}% to ~${newStockout}%. I recommend applying a surge scenario to see full impact.`,
      chips: [
        { label: 'Apply Surge Scenario', params: { utilizationMultiplier: 1.4, failureRateMultiplier: 1.2 } },
        { label: 'Moderate Surge (+20%)', params: { utilizationMultiplier: 1.2 } },
      ],
      sparkline: Array.from({ length: 12 }, (_, i) => operational.demand90d / 3 * (1 + 0.4 * (i / 12)) + (Math.random() - 0.5) * 5),
    };
  }

  if (q.includes('stock out') || q.includes('stockout') || q.includes('breach')) {
    const daysOfSupply = operational.onHand > 0 ? Math.round((operational.onHand / (operational.demand90d / 90))) : 0;
    return {
      id, role: 'assistant',
      content: `At current consumption rate, ${niin.nomenclature} has ~${daysOfSupply} days of supply. ${risk.firstProjectedStockout ? `First projected stockout: ${new Date(risk.firstProjectedStockout).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : 'No stockout projected within the planning horizon.'}. Current 90-day stockout probability: ${risk.stockoutProb90d}%.`,
      sparkline: Array.from({ length: 12 }, (_, i) => Math.max(0, operational.onHand - (operational.demand90d / 3) * (i + 1) / 4)),
    };
  }

  if (q.includes('cheap') || q.includes('cost') || q.includes('lowest') || q.includes('budget')) {
    const sortedRecs = [...recommendations].sort((a, b) => (a.serviceUplift / a.costImpact) - (b.serviceUplift / b.costImpact)).reverse();
    const best = sortedRecs[0];
    if (best) {
      return {
        id, role: 'assistant',
        content: `The most cost-effective action is **${best.actionType}** (${best.quantity} units) at $${best.costImpact.toLocaleString()} for +${best.serviceUplift}% service uplift. That's $${Math.round(best.costImpact / best.serviceUplift).toLocaleString()} per percentage point of improvement. ${sortedRecs.length > 1 ? `There are ${sortedRecs.length - 1} additional actions available.` : ''}`,
      };
    }
    return { id, role: 'assistant', content: 'No recommendations available for this NIIN yet. Try running a scenario to generate action options.' };
  }

  if (q.includes('lead time') || q.includes('worst case') || q.includes('worst-case')) {
    return {
      id, role: 'assistant',
      content: `Current lead time for ${niin.nomenclature} is ${niin.leadTimeDays} days from ${niin.supplier}. ${niin.singleSource ? '**Warning: Single source supplier.** ' : ''}A worst-case lead time shock (+90 days) combined with capacity constraints would significantly increase stockout risk.`,
      chips: [
        { label: 'Worst-Case Lead Time', params: { leadTimeShockDays: 90, capacityCapPercent: 70 } },
        { label: 'Extreme Disruption', params: { leadTimeShockDays: 180, capacityCapPercent: 50 } },
      ],
    };
  }

  // Default response
  return {
    id, role: 'assistant',
    content: `For ${niin.nomenclature} (${niin.niin}): Current on-hand is ${operational.onHand} units with ${risk.stockoutProb90d}% 90-day stockout probability. Service level is ${risk.serviceLevelActual}% vs ${risk.serviceLevelPolicy}% target. ${recommendations.length} actions are recommended. What specific aspect would you like to explore?`,
  };
}

export default function AICopilotPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const data = useSelectedNiinData();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text?: string) => {
    const query = text || input.trim();
    if (!query) return;

    const userMsg: Message = { id: `msg-${Date.now()}-u`, role: 'user', content: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const response = generateResponse(query, data);
      setMessages((prev) => [...prev, response]);
      setIsTyping(false);
    }, 600 + Math.random() * 800);
  };

  const handleChipClick = (chip: ScenarioChip) => {
    Object.entries(chip.params).forEach(([key, value]) => {
      dispatch({ type: 'SET_SCENARIO_PARAM', key: key as any, value: value as number });
    });
    dispatch({ type: 'APPLY_SCENARIO' });

    const confirmMsg: Message = {
      id: `msg-${Date.now()}-chip`,
      role: 'assistant',
      content: `Applied "${chip.label}" scenario. The forecast chart and risk tiles have been updated. Toggle the scenario overlay on the chart to compare against baseline.`,
    };
    setMessages((prev) => [...prev, confirmMsg]);
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[520px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Forecast Copilot</h3>
            <p className="text-[10px] text-primary-200">AI-powered demand analysis</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-white/20 text-white/80 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3 border border-primary-100 dark:border-primary-800">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">How can I help?</span>
              </div>
              <p className="text-xs text-primary-600 dark:text-primary-400">
                Ask me about demand scenarios, stockout risks, or cost-optimal actions. I can apply scenarios directly to the forecast.
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Suggested</span>
              {SUGGESTED_PROMPTS.map((prompt) => {
                const Icon = prompt.icon;
                return (
                  <button
                    key={prompt.text}
                    onClick={() => handleSend(prompt.text)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <Icon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    {prompt.text}
                    <ChevronRight className="w-3 h-3 text-gray-400 dark:text-gray-500 ml-auto flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.sparkline && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <MiniSparkline data={msg.sparkline} />
                  <span className="text-[9px] text-gray-500 dark:text-gray-400 ml-1">12-month projection</span>
                </div>
              )}
              {msg.chips && msg.chips.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 flex flex-wrap gap-1.5">
                  {msg.chips.map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => handleChipClick(chip)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-[10px] font-medium hover:bg-primary-200 dark:hover:bg-primary-800/60 transition-colors"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about demand, risk, scenarios..."
            className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
