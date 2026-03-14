import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { GameState } from '../models/types';
import {
  applyDebugAdvance,
  assistProduction,
  completeResearchDebug,
  completeUpgradeDebug,
  createInitialState,
  forceMarketRefreshDebug,
  launchConvoy,
  startFacilityUpgrade,
  startProduction,
  startResearch,
  stateMetrics,
  tickState,
  triggerEvent,
  unlockFacility,
  unlockNextLocationDebug
} from '../systems/simulation';
import { currentGameTime, isLocationOpen } from '../../utils/time';

const SAVE_KEY = 'citizenone.save.v1';

interface GameContextShape {
  state: GameState;
  now: number;
  metrics: ReturnType<typeof stateMetrics>;
  setState: (next: GameState) => void;
  actions: {
    startProduction: (facilityId: string, goodId: string) => void;
    assistProduction: (facilityId: string) => void;
    startUpgrade: (facilityId: string) => void;
    unlockFacility: (facilityId: string) => void;
    launchConvoy: (routeId: string, goodId: string, amount: number, vehicleId?: string) => void;
    startResearch: (unlock: string, label: string) => void;
    isLocationOpen: (hours: [number, number]) => boolean;
    debugAdvance: (hours: number) => void;
    debugGrantMoney: () => void;
    debugFillStorage: () => void;
    debugCompleteUpgrade: () => void;
    debugCompleteResearch: () => void;
    debugTriggerEvent: () => void;
    debugUnlockNextLocation: () => void;
    debugForceMarketRefresh: () => void;
  };
}

const GameContext = createContext<GameContextShape | null>(null);

function loadState(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createInitialState();
    return JSON.parse(raw) as GameState;
  } catch {
    return createInitialState();
  }
}

export function GameStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(() => loadState());
  const [now, setNow] = useState(() => currentGameTime(state.debug.timeOffsetMs));

  useEffect(() => {
    const initialNow = currentGameTime(state.debug.timeOffsetMs);
    setState((prev) => tickState(prev, initialNow));
    setNow(initialNow);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const freshNow = currentGameTime(state.debug.timeOffsetMs);
      setNow(freshNow);
      setState((prev) => tickState(prev, freshNow));
    }, 10000);
    return () => window.clearInterval(timer);
  }, [state.debug.timeOffsetMs]);

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }, [state]);

  const actions = useMemo(
    () => ({
      startProduction: (facilityId: string, goodId: string) => {
        const ts = currentGameTime(state.debug.timeOffsetMs);
        setState((prev) => startProduction(prev, facilityId, goodId, ts));
      },
      assistProduction: (facilityId: string) => {
        const ts = currentGameTime(state.debug.timeOffsetMs);
        setState((prev) => assistProduction(prev, facilityId, ts));
      },
      startUpgrade: (facilityId: string) => {
        const ts = currentGameTime(state.debug.timeOffsetMs);
        setState((prev) => startFacilityUpgrade(prev, facilityId, ts));
      },
      unlockFacility: (facilityId: string) => {
        const ts = currentGameTime(state.debug.timeOffsetMs);
        setState((prev) => unlockFacility(prev, facilityId, ts));
      },
      launchConvoy: (routeId: string, goodId: string, amount: number, vehicleId?: string) => {
        const ts = currentGameTime(state.debug.timeOffsetMs);
        setState((prev) => launchConvoy(prev, routeId, goodId, amount, ts, vehicleId));
      },
      startResearch: (unlock: string, label: string) => {
        const ts = currentGameTime(state.debug.timeOffsetMs);
        setState((prev) => startResearch(prev, unlock, label, ts));
      },
      isLocationOpen: (hours: [number, number]) => isLocationOpen(hours, now),
      debugAdvance: (hours: number) => setState((prev) => applyDebugAdvance(prev, hours)),
      debugGrantMoney: () => setState((prev) => ({ ...prev, resources: { ...prev.resources, money: prev.resources.money + 300 } })),
      debugFillStorage: () =>
        setState((prev) => ({
          ...prev,
          goodsInventory: { ...prev.goodsInventory, plastic_parts: 30, metal_scrap: 25, basic_electronics: 12 }
        })),
      debugCompleteUpgrade: () => {
        const ts = currentGameTime(state.debug.timeOffsetMs);
        setState((prev) => completeUpgradeDebug(prev, ts));
      },
      debugCompleteResearch: () => {
        const ts = currentGameTime(state.debug.timeOffsetMs);
        setState((prev) => completeResearchDebug(prev, ts));
      },
      debugTriggerEvent: () => {
        const ts = currentGameTime(state.debug.timeOffsetMs);
        setState((prev) => triggerEvent(prev, ts));
      },
      debugUnlockNextLocation: () => {
        const ts = currentGameTime(state.debug.timeOffsetMs);
        setState((prev) => unlockNextLocationDebug(prev, ts));
      },
      debugForceMarketRefresh: () => {
        const ts = currentGameTime(state.debug.timeOffsetMs);
        setState((prev) => forceMarketRefreshDebug(prev, ts));
      }
    }),
    [now, state.debug.timeOffsetMs]
  );

  const metrics = stateMetrics(state, now);

  return <GameContext.Provider value={{ state, setState, now, metrics, actions }}>{children}</GameContext.Provider>;
}

export function useGameStore() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('GameStore missing provider');
  return ctx;
}
