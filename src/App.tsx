import { useState, useEffect } from 'react';
import { AppProvider, useAppDispatch } from '@/context/AppContext';
import NiinControlView from '@/components/NiinControlView';
import NiinSelector from '@/components/NiinSelector';
import GlobalFilters from '@/components/GlobalFilters';
import ActionDetailFlyout from '@/components/ActionDetailFlyout';
import ScenarioDrawer from '@/components/ScenarioDrawer';
import TabNavigation from '@/components/TabNavigation';
import ScenarioPresets from '@/components/ScenarioPresets';
import PortfolioHeatmap from '@/components/PortfolioHeatmap';
import AICopilotPanel from '@/components/AICopilotPanel';
import ScenarioComparison from '@/components/ScenarioComparison';
import DigitalTwinSandbox from '@/components/DigitalTwinSandbox';
import { SlidersHorizontal, Moon, Sun, Bug, Bot, GitCompareArrows } from 'lucide-react';
import { useAppState } from '@/context/AppContext';

function DarkModeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(dark));
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

function ErrorSimToggle() {
  const { simulatedError } = useAppState();
  const dispatch = useAppDispatch();
  const isActive = simulatedError !== null;

  return (
    <button
      onClick={() => dispatch({ type: 'SIMULATE_ERROR', error: isActive ? null : 'Failed to load data. The forecast service is temporarily unavailable.' })}
      className={`p-2 rounded-lg border ${isActive ? 'border-red-400 dark:border-red-600 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
      title={isActive ? 'Clear simulated error' : 'Simulate API error'}
    >
      <Bug className="w-4 h-4" />
    </button>
  );
}

function AppContent() {
  const { activeTab } = useAppState();
  const dispatch = useAppDispatch();
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Advanced Demand Forecasting
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Supply Chain Control Tower</p>
          </div>
          <div className="flex items-center gap-3">
            <NiinSelector />
            <ScenarioPresets />
            <button
              onClick={() => dispatch({ type: 'TOGGLE_DRAWER' })}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Edit Scenario
            </button>
            <button
              onClick={() => setComparisonOpen(true)}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              title="Compare Scenarios"
            >
              <GitCompareArrows className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCopilotOpen(!copilotOpen)}
              className={`p-2 rounded-lg border ${copilotOpen ? 'border-primary-400 dark:border-primary-600 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              title="AI Copilot"
            >
              <Bot className="w-4 h-4" />
            </button>
            <ErrorSimToggle />
            <DarkModeToggle />
          </div>
        </div>
      </header>

      <TabNavigation />
      <GlobalFilters />

      <main className={activeTab === 'demand' ? 'p-6' : ''}>
        {activeTab === 'demand' && <NiinControlView />}
        {activeTab === 'analytics' && <PortfolioHeatmap />}
        {activeTab === 'logistics' && <DigitalTwinSandbox />}
      </main>

      <ScenarioDrawer />
      <ActionDetailFlyout />
      <AICopilotPanel open={copilotOpen} onClose={() => setCopilotOpen(false)} />
      <ScenarioComparison open={comparisonOpen} onClose={() => setComparisonOpen(false)} />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
