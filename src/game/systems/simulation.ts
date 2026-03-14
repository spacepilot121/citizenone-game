import { starterFacilities, unlockCosts } from '../data/facilities';
import { goods, goodMap } from '../data/goods';
import { baseLocationId, starterLocations, starterRoutes, vehicles } from '../data/world';
import { Convoy, Facility, GameMessage, GameState, Location, Route } from '../models/types';
import { HOUR, clamp, currentGameTime, gameDay, gameHour, isLocationOpen, isNightPhase } from '../../utils/time';

const storageUsed = (state: GameState): number =>
  Object.entries(state.goodsInventory).reduce((sum, [id, qty]) => sum + (goodMap[id]?.cargoSize ?? 1) * qty, 0);

const makeMessage = (category: GameMessage['category'], text: string, at: number): GameMessage => ({
  id: `${at}-${Math.random().toString(36).slice(2, 7)}`,
  at,
  category,
  text
});

function marketMultiplier(type: Location['type'], category: string): number {
  const profile: Record<Location['type'], Partial<Record<string, number>>> = {
    settlement: { construction: 1.1, medical: 1.1 },
    medical: { medical: 1.35, military: 0.8 },
    military: { military: 1.4, electronics: 1.2 },
    black_market: { black_market: 1.4, military: 1.2 },
    industrial: { industrial: 1.3, construction: 1.2 },
    logistics: { energy: 1.15, industrial: 1.1 },
    energy: { energy: 1.35, electronics: 0.95 },
    intel: { electronics: 1.2, military: 1.1 }
  };
  return profile[type][category] ?? 1;
}

export function createInitialState(): GameState {
  const now = Date.now();
  return {
    firstSaveAt: now,
    lastTickAt: now,
    resources: { money: 140, people: 3, electricity: 0, electricityCap: 4, storageCap: 5, gold: 1 },
    goodsInventory: { plastic_parts: 2, metal_scrap: 2 },
    facilities: structuredClone(starterFacilities),
    locations: structuredClone(starterLocations),
    routes: structuredClone(starterRoutes),
    convoys: [],
    convoySlots: 1,
    maxConvoySlots: 10,
    lockedConvoySlots: 9,
    activeResearch: undefined,
    unlockedResearch: [],
    messages: [makeMessage('relay', 'CitizenOne relay online. Hidden base initialized.', now)],
    rumourBias: 0.45,
    debug: { enabled: true, timeOffsetMs: 0 }
  };
}

export function routeRisk(route: Route): number {
  return clamp(route.baseRisk - route.familiarity * 0.08 - route.stability * 0.1, 0.03, 0.95);
}

function productionDurationMinutes(f: Facility): number {
  return clamp(90 - f.level * 8, 30, 95);
}

function processFacilities(state: GameState, now: number): void {
  for (const facility of state.facilities) {
    if (!facility.unlocked) continue;
    if (facility.upgradeEndsAt && now >= facility.upgradeEndsAt) {
      facility.level += 1;
      facility.upgradeEndsAt = undefined;
      facility.status = 'idle';
      if (facility.id === 'storage_facility') state.resources.storageCap += 6;
      if (facility.id === 'power_facility') state.resources.electricityCap += 3;
      state.messages.unshift(makeMessage('base', `${facility.name} upgrade completed.`, now));
    }

    if (facility.production && now >= facility.production.endsAt) {
      const load = storageUsed(state);
      const goodInfo = goodMap[facility.production.goodId];
      const addSize = facility.production.quantity * (goodInfo?.cargoSize ?? 1);
      if (load + addSize <= state.resources.storageCap) {
        state.goodsInventory[facility.production.goodId] = (state.goodsInventory[facility.production.goodId] ?? 0) + facility.production.quantity;
        state.messages.unshift(makeMessage('base', `${facility.name} produced ${facility.production.quantity}x ${goodInfo?.name ?? 'goods'}.`, now));
      } else {
        state.messages.unshift(makeMessage('base', `${facility.name} halted, storage full.`, now));
      }
      facility.production = undefined;
      facility.status = 'idle';
    }

    if (facility.id === 'radio_recon' && Math.random() < 0.015) {
      const rumourGood = goods[Math.floor(Math.random() * goods.length)];
      state.messages.unshift(makeMessage('rumour', `Chatter: short-term demand spike expected for ${rumourGood.name}.`, now));
    }
  }
}

function maybeGenerateMissions(state: GameState, now: number): void {
  const day = gameDay(state.firstSaveAt, now);
  for (const location of state.locations.filter((l) => l.unlocked && l.id !== baseLocationId)) {
    location.missions = location.missions.filter((m) => !m.completed && m.deadline > now);
    if (location.missions.length < 2 && Math.random() < 0.45) {
      const good = goods[Math.floor(Math.random() * Math.min(goods.length, 10 + day))];
      location.missions.push({
        id: `m-${location.id}-${now}`,
        locationId: location.id,
        requestedGoodId: good.id,
        quantity: 5 + Math.floor(day * 0.8),
        deadline: now + (8 + Math.floor(Math.random() * 20)) * HOUR,
        moneyReward: 70 + day * 10,
        reputationReward: 4 + Math.floor(day / 2),
        specialReward: Math.random() < 0.2 ? 'intel' : undefined,
        completed: false
      });
      state.messages.unshift(makeMessage('relay', `${location.name} posted a new timed contract.`, now));
    }
  }
}

function refreshMarkets(state: GameState, now: number): void {
  const daySeed = gameDay(state.firstSaveAt, now);
  for (const location of state.locations) {
    const market: Record<string, number> = {};
    for (const g of goods.slice(0, 18)) {
      const swing = 0.75 + ((Math.sin(daySeed + g.tier * 1.7 + location.x * 0.02) + 1) / 2) * 0.75;
      market[g.id] = Math.round(g.baseValue * swing * marketMultiplier(location.type, g.category));
    }
    location.market = market;
  }
  state.messages.unshift(makeMessage('market', 'Regional market boards refreshed for the day.', now));
}

function processConvoys(state: GameState, now: number): void {
  const finished: Convoy[] = [];
  for (const convoy of state.convoys) {
    if (convoy.status !== 'en_route' && convoy.status !== 'returning') continue;
    if (now < convoy.eta) continue;

    const route = state.routes.find((r) => r.id === convoy.routeId);
    if (!route) continue;

    if (convoy.status === 'en_route') {
      const risk = routeRisk(route);
      const roll = Math.random();
      if (roll < risk * 0.5) {
        convoy.status = 'damaged';
        convoy.armour = Math.max(0, convoy.armour - 4);
        convoy.tyres = Math.max(0, convoy.tyres - 3);
        convoy.log.unshift('Encountered checkpoint and took damage.');
        state.messages.unshift(makeMessage('convoy', `Convoy ${convoy.id} delayed by security sweep.`, now));
        convoy.eta = now + HOUR;
        continue;
      }
      const destination = state.locations.find((l) => l.id === convoy.destinationId);
      if (destination) {
        for (const c of convoy.cargo) {
          const sold = Math.min(c.amount, state.goodsInventory[c.goodId] ?? 0);
          state.goodsInventory[c.goodId] = Math.max(0, (state.goodsInventory[c.goodId] ?? 0) - sold);
          state.resources.money += sold * (destination.market[c.goodId] ?? goodMap[c.goodId].baseValue);
        }
        destination.reputation += 2;
      }
      route.tripsCompleted += 1;
      route.familiarity = clamp(route.familiarity + 0.03, 0, 1);
      route.stability = clamp(route.stability + 0.02, 0, 1);
      convoy.status = 'returning';
      convoy.eta = now + route.distance * 7 * 60 * 1000;
      state.messages.unshift(makeMessage('convoy', `Convoy ${convoy.id} delivered cargo and is returning.`, now));
    } else {
      finished.push(convoy);
      state.messages.unshift(makeMessage('convoy', `Convoy ${convoy.id} returned to base.`, now));
    }
  }
  state.convoys = state.convoys.filter((c) => !finished.includes(c));
}

function processResearch(state: GameState, now: number): void {
  if (!state.activeResearch || now < state.activeResearch.endsAt) return;
  const unlock = state.activeResearch.unlocks;
  state.unlockedResearch.push(unlock);
  if (unlock === 'convoy_slot') {
    state.convoySlots = clamp(state.convoySlots + 1, 1, state.maxConvoySlots);
    state.lockedConvoySlots = state.maxConvoySlots - state.convoySlots;
  }
  if (unlock.startsWith('facility:')) {
    const facilityId = unlock.split(':')[1];
    const facility = state.facilities.find((f) => f.id === facilityId);
    if (facility) {
      facility.unlocked = true;
      facility.level = 1;
      facility.status = 'idle';
    }
  }
  state.messages.unshift(makeMessage('relay', `Research complete: ${state.activeResearch.label}.`, now));
  state.activeResearch = undefined;
}

export function tickState(state: GameState, now: number): GameState {
  const next = structuredClone(state);
  processFacilities(next, now);
  processResearch(next, now);
  processConvoys(next, now);

  const crossedDay = gameDay(next.firstSaveAt, now) !== gameDay(next.firstSaveAt, next.lastTickAt);
  if (crossedDay) {
    refreshMarkets(next, now);
    maybeGenerateMissions(next, now);
  }
  if (Math.random() < (isNightPhase(now) ? 0.004 : 0.01)) {
    next.messages.unshift(makeMessage('relay', isNightPhase(now) ? 'Night routes quieter, but patrol chatter is rising.' : 'Day shift report: checkpoints active near major roads.', now));
  }

  next.lastTickAt = now;
  next.messages = next.messages.slice(0, 180);
  return next;
}

export function startProduction(state: GameState, facilityId: string, goodId: string, now: number): GameState {
  const next = structuredClone(state);
  const facility = next.facilities.find((f) => f.id === facilityId);
  if (!facility || !facility.unlocked || facility.production || facility.upgradeEndsAt) return state;
  const good = goodMap[goodId];
  if (!good) return state;
  const recipeOk = good.recipe?.every((r) => (next.goodsInventory[r.goodId] ?? 0) >= r.amount) ?? true;
  if (!recipeOk) return state;
  good.recipe?.forEach((r) => (next.goodsInventory[r.goodId] -= r.amount));
  const quantity = Math.max(1, Math.floor(facility.level / 2) + 1);
  const endsAt = now + productionDurationMinutes(facility) * 60 * 1000;
  facility.production = { goodId, startedAt: now, endsAt, quantity };
  facility.status = 'producing';
  next.messages.unshift(makeMessage('base', `${facility.name} started ${good.name}.`, now));
  return next;
}

export function assistProduction(state: GameState, facilityId: string, now: number): GameState {
  const next = structuredClone(state);
  const facility = next.facilities.find((f) => f.id === facilityId);
  if (!facility) return state;

  if (facility.production) {
    facility.production.endsAt = Math.max(now + 60_000, facility.production.endsAt - 5 * 60_000);
    next.messages.unshift(makeMessage('crew', `Crew pushed ${facility.name}; build timer shortened by 5m.`, now));
    return next;
  }

  if (facility.upgradeEndsAt) {
    facility.upgradeEndsAt = Math.max(now + 60_000, facility.upgradeEndsAt - 5 * 60_000);
    next.messages.unshift(makeMessage('crew', `Crew pushed ${facility.name}; upgrade timer shortened by 5m.`, now));
    return next;
  }

  return state;
}

export function startFacilityUpgrade(state: GameState, facilityId: string, now: number): GameState {
  const next = structuredClone(state);
  const facility = next.facilities.find((f) => f.id === facilityId);
  if (!facility?.unlocked || facility.upgradeEndsAt || facility.production) return state;
  const cost = 60 + facility.level * 40;
  if (next.resources.money < cost) return state;
  next.resources.money -= cost;
  facility.status = 'upgrading';
  facility.upgradeEndsAt = now + (2 + facility.level) * HOUR;
  next.messages.unshift(makeMessage('base', `${facility.name} upgrade started.`, now));
  return next;
}

export function unlockFacility(state: GameState, facilityId: string, now: number): GameState {
  const next = structuredClone(state);
  const facility = next.facilities.find((f) => f.id === facilityId);
  const cost = unlockCosts[facilityId];
  if (!facility || facility.unlocked || !cost) return state;
  if (next.resources.money < cost.money) return state;
  if ((cost.people ?? 0) > next.resources.people) return state;
  next.resources.money -= cost.money;
  next.resources.people -= cost.people ?? 0;
  facility.unlocked = true;
  facility.level = 1;
  facility.status = 'idle';
  next.messages.unshift(makeMessage('base', `${facility.name} unlocked and staffed.`, now));
  return next;
}

export function launchConvoy(
  state: GameState,
  routeId: string,
  cargoGoodId: string,
  amount: number,
  now: number,
  vehicleId?: string
): GameState {
  const next = structuredClone(state);
  if (next.convoys.length >= next.convoySlots) return state;
  const route = next.routes.find((r) => r.id === routeId);
  if (!route) return state;
  if ((next.goodsInventory[cargoGoodId] ?? 0) < amount) return state;
  const destination = next.locations.find((l) => l.id === route.destinationId);
  if (!destination || !destination.unlocked || !isLocationOpen(destination.openHours, now)) return state;
  const vehicle = vehicles.find((v) => v.id === vehicleId) ?? vehicles[0];
  const convoy: Convoy = {
    id: `C-${Math.floor(now / 1000).toString(36)}`,
    slot: next.convoys.length + 1,
    vehicleId: vehicle.id,
    crew: ['Driver'],
    destinationId: route.destinationId,
    routeId,
    cargo: [{ goodId: cargoGoodId, amount }],
    startedAt: now,
    eta: now + route.distance * 7 * 60 * 1000,
    status: 'en_route',
    fuel: vehicle.fuelCapacity,
    battery: vehicle.batteryCapacity,
    armour: vehicle.armour,
    tyres: vehicle.tyres,
    ammo: vehicle.ammo,
    log: ['Departed base.']
  };
  next.convoys.push(convoy);
  next.messages.unshift(makeMessage('convoy', `Convoy ${convoy.id} dispatched to ${destination.name}.`, now));
  return next;
}

export function applyDebugAdvance(state: GameState, hours: number): GameState {
  const now = currentGameTime(state.debug.timeOffsetMs) + hours * HOUR;
  const withOffset = structuredClone(state);
  withOffset.debug.timeOffsetMs += hours * HOUR;
  return tickState(withOffset, now);
}

export function triggerEvent(state: GameState, now: number): GameState {
  const next = structuredClone(state);
  if (next.convoys.length === 0) {
    next.messages.unshift(makeMessage('relay', 'No active convoy to apply forced event.', now));
    return next;
  }
  const convoy = next.convoys[0];
  convoy.status = 'damaged';
  convoy.eta += 40 * 60 * 1000;
  convoy.tyres = Math.max(0, convoy.tyres - 4);
  convoy.log.unshift('Forced debug event: tyre blowout near blocked road.');
  next.messages.unshift(makeMessage('convoy', `${convoy.id} hit by tyre blowout event.`, now));
  return next;
}

export function startResearch(state: GameState, unlock: string, label: string, now: number): GameState {
  const next = structuredClone(state);
  if (next.activeResearch) return state;
  if (next.resources.gold < 1) return state;
  next.resources.gold -= 1;
  next.activeResearch = { id: `r-${now}`, unlocks: unlock, label, endsAt: now + 10 * HOUR };
  next.messages.unshift(makeMessage('relay', `Research started: ${label}.`, now));
  return next;
}

export function completeResearchDebug(state: GameState, now: number): GameState {
  if (!state.activeResearch) return state;
  const next = structuredClone(state);
  if (!next.activeResearch) return state;
  next.activeResearch.endsAt = now - 1;
  return tickState(next, now);
}

export function completeUpgradeDebug(state: GameState, now: number): GameState {
  const next = structuredClone(state);
  const upgrading = next.facilities.find((f) => f.upgradeEndsAt);
  if (!upgrading?.upgradeEndsAt) return state;
  upgrading.upgradeEndsAt = now - 1;
  return tickState(next, now);
}

export function unlockNextLocationDebug(state: GameState, now: number): GameState {
  const next = structuredClone(state);
  const lock = next.locations.find((l) => !l.unlocked);
  if (!lock) return state;
  lock.unlocked = true;
  next.messages.unshift(makeMessage('relay', `${lock.name} now reachable from relay graph.`, now));
  return next;
}

export function forceMarketRefreshDebug(state: GameState, now: number): GameState {
  const next = structuredClone(state);
  refreshMarkets(next, now);
  return next;
}

export function canLocationOpen(location: Location, now: number): boolean {
  return isLocationOpen(location.openHours, now);
}

export function stateMetrics(state: GameState, now: number) {
  const used = storageUsed(state);
  const powerUsed = state.facilities.filter((f) => f.unlocked).reduce((sum, f) => sum + f.powerUse, 0);
  return {
    day: gameDay(state.firstSaveAt, now),
    hour: gameHour(now),
    isNight: isNightPhase(now),
    storageUsed: used,
    storageCap: state.resources.storageCap,
    powerUsed,
    powerCap: state.resources.electricityCap
  };
}
