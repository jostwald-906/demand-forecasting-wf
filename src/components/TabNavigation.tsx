import { BarChart3, Package, ShieldAlert, Truck, TrendingUp } from 'lucide-react';
import { useAppState, useAppDispatch } from '@/context/AppContext';
import type { TabId } from '@/context/AppContext';

const TABS: { id: TabId | string; label: string; icon: typeof TrendingUp; enabled: boolean }[] = [
  { id: 'demand', label: 'Advanced Demand Forecasting', icon: TrendingUp, enabled: true },
  { id: 'inventory', label: 'Inventory Optimization', icon: Package, enabled: false },
  { id: 'supplier', label: 'Supplier Risk', icon: ShieldAlert, enabled: false },
  { id: 'logistics', label: 'Logistics Planning', icon: Truck, enabled: true },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, enabled: true },
];

export default function TabNavigation() {
  const { activeTab } = useAppState();
  const dispatch = useAppDispatch();

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6">
      <div className="flex gap-0 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              disabled={!tab.enabled}
              onClick={() => tab.enabled && dispatch({ type: 'SET_TAB', tab: tab.id as TabId })}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-primary-600 text-primary-700 dark:text-primary-400'
                  : tab.enabled
                    ? 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer'
                    : 'border-transparent text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
