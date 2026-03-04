import { createContext, useContext, useReducer, useMemo, type ReactNode } from 'react';
import type {
  ScenarioParams,
  FilterState,
  Horizon,
  Granularity,
  DisplayMode,
} from '@/types';
import { DEFAULT_SCENARIO_PARAMS, DEFAULT_FILTERS } from '@/types';
import {
  getNiinById,
  getOperationalData,
  getRiskData,
  getBaselineForecast,
  getBaselineInventory,
  deriveBreachRows,
  getBaselineRecommendations,
  applyScenarioToForecast,
  applyScenarioToRisk,
  applyScenarioToInventory,
  applyScenarioToRecommendations,
  computeScenarioOutputs,
} from '@/data';

// ----- State -----

export type TabId = 'demand' | 'analytics' | 'logistics';

export interface AppState {
  selectedNiinId: string | null;
  filters: FilterState;
  scenarioParams: ScenarioParams;
  activeScenarioParams: ScenarioParams;
  drawerOpen: boolean;
  flyoutActionId: string | null;
  displayMode: DisplayMode;
  granularity: Granularity;
  horizon: Horizon;
  overlayEnabled: boolean;
  isLoading: boolean;
  simulatedError: string | null;
  activeTab: TabId;
  monteCarloEnabled: boolean;
}

const initialState: AppState = {
  selectedNiinId: null,
  filters: DEFAULT_FILTERS,
  scenarioParams: DEFAULT_SCENARIO_PARAMS,
  activeScenarioParams: DEFAULT_SCENARIO_PARAMS,
  drawerOpen: false,
  flyoutActionId: null,
  displayMode: 'units',
  granularity: 'monthly',
  horizon: '5y',
  overlayEnabled: false,
  isLoading: false,
  simulatedError: null,
  activeTab: 'demand',
  monteCarloEnabled: false,
};

// ----- Actions -----

export type AppAction =
  | { type: 'SELECT_NIIN'; niinId: string }
  | { type: 'DESELECT_NIIN' }
  | { type: 'SET_FILTER'; key: keyof FilterState; value: string | null }
  | { type: 'SET_HORIZON'; horizon: Horizon }
  | { type: 'RESET_FILTERS' }
  | { type: 'SET_SCENARIO_PARAM'; key: keyof ScenarioParams; value: number }
  | { type: 'APPLY_SCENARIO' }
  | { type: 'RESET_SCENARIO' }
  | { type: 'TOGGLE_DRAWER' }
  | { type: 'OPEN_FLYOUT'; actionId: string }
  | { type: 'CLOSE_FLYOUT' }
  | { type: 'SET_DISPLAY_MODE'; mode: DisplayMode }
  | { type: 'SET_GRANULARITY'; granularity: Granularity }
  | { type: 'TOGGLE_OVERLAY' }
  | { type: 'APPROVE_ACTION'; actionId: string }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SIMULATE_ERROR'; error: string | null }
  | { type: 'SET_TAB'; tab: TabId }
  | { type: 'TOGGLE_MONTE_CARLO' };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SELECT_NIIN':
      return {
        ...state,
        selectedNiinId: action.niinId,
        flyoutActionId: null,
        isLoading: true,
      };
    case 'DESELECT_NIIN':
      return {
        ...state,
        selectedNiinId: null,
        flyoutActionId: null,
      };
    case 'SET_FILTER':
      if (action.key === 'horizon') {
        return { ...state, horizon: (action.value ?? '5y') as Horizon };
      }
      return {
        ...state,
        filters: { ...state.filters, [action.key]: action.value },
      };
    case 'SET_HORIZON':
      return { ...state, horizon: action.horizon };
    case 'RESET_FILTERS':
      return { ...state, filters: DEFAULT_FILTERS, horizon: '5y' };
    case 'SET_SCENARIO_PARAM':
      return {
        ...state,
        scenarioParams: { ...state.scenarioParams, [action.key]: action.value },
      };
    case 'APPLY_SCENARIO':
      return { ...state, activeScenarioParams: { ...state.scenarioParams }, overlayEnabled: true };
    case 'RESET_SCENARIO':
      return {
        ...state,
        scenarioParams: DEFAULT_SCENARIO_PARAMS,
        activeScenarioParams: DEFAULT_SCENARIO_PARAMS,
      };
    case 'TOGGLE_DRAWER':
      return { ...state, drawerOpen: !state.drawerOpen, flyoutActionId: state.drawerOpen ? state.flyoutActionId : null };
    case 'OPEN_FLYOUT':
      return { ...state, flyoutActionId: action.actionId, drawerOpen: false };
    case 'CLOSE_FLYOUT':
      return { ...state, flyoutActionId: null };
    case 'SET_DISPLAY_MODE':
      return { ...state, displayMode: action.mode };
    case 'SET_GRANULARITY':
      return { ...state, granularity: action.granularity };
    case 'TOGGLE_OVERLAY':
      return { ...state, overlayEnabled: !state.overlayEnabled };
    case 'APPROVE_ACTION':
      return state; // handled in component-level state for recommendations
    case 'SET_LOADING':
      return { ...state, isLoading: action.loading };
    case 'SIMULATE_ERROR':
      return { ...state, simulatedError: action.error };
    case 'SET_TAB':
      return { ...state, activeTab: action.tab };
    case 'TOGGLE_MONTE_CARLO':
      return { ...state, monteCarloEnabled: !state.monteCarloEnabled };
    default:
      return state;
  }
}

// ----- Context -----

const StateContext = createContext<AppState | null>(null);
const DispatchContext = createContext<React.Dispatch<AppAction> | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}

export function useAppDispatch(): React.Dispatch<AppAction> {
  const ctx = useContext(DispatchContext);
  if (!ctx) throw new Error('useAppDispatch must be used within AppProvider');
  return ctx;
}

// ----- Derived data hooks -----

export function useSelectedNiinData() {
  const { selectedNiinId, activeScenarioParams } = useAppState();

  return useMemo(() => {
    if (!selectedNiinId) return null;

    const niin = getNiinById(selectedNiinId);
    if (!niin) return null;

    const operational = getOperationalData(selectedNiinId);
    const risk = getRiskData(selectedNiinId);
    const forecast = getBaselineForecast(selectedNiinId);
    const inventory = getBaselineInventory(selectedNiinId);
    const recommendations = getBaselineRecommendations(selectedNiinId);

    if (!operational || !risk) return null;

    const scenarioForecast = applyScenarioToForecast(forecast, activeScenarioParams);
    const scenarioRisk = applyScenarioToRisk(risk, activeScenarioParams);
    const scenarioInventory = applyScenarioToInventory(inventory, activeScenarioParams);
    const scenarioRecommendations = applyScenarioToRecommendations(recommendations, activeScenarioParams);
    const breachRows = deriveBreachRows(scenarioInventory);
    const scenarioOutputs = computeScenarioOutputs(risk, scenarioRisk, recommendations, scenarioRecommendations);

    return {
      niin,
      operational,
      baselineRisk: risk,
      risk: scenarioRisk,
      baselineForecast: forecast,
      forecast: scenarioForecast,
      baselineInventory: inventory,
      inventory: scenarioInventory,
      breachRows,
      baselineRecommendations: recommendations,
      recommendations: scenarioRecommendations,
      scenarioOutputs,
    };
  }, [selectedNiinId, activeScenarioParams]);
}
