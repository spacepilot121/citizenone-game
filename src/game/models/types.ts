export type ResourceKey = 'money' | 'people' | 'electricity' | 'electricityCap' | 'storageCap' | 'gold';

export type GoodCategory =
  | 'industrial'
  | 'medical'
  | 'military'
  | 'electronics'
  | 'energy'
  | 'black_market'
  | 'construction';

export interface Good {
  id: string;
  name: string;
  category: GoodCategory;
  tier: number;
  baseValue: number;
  cargoSize: number;
  legality: 'low' | 'medium' | 'high';
  recipe?: Array<{ goodId: string; amount: number }>;
  facilityRequirement?: string;
}

export interface Facility {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  level: number;
  powerUse: number;
  assignedPeople: number;
  status: 'idle' | 'producing' | 'upgrading' | 'offline';
  upgradeEndsAt?: number;
  production?: ProductionTask;
}

export interface ProductionTask {
  goodId: string;
  startedAt: number;
  endsAt: number;
  quantity: number;
}

export interface Vehicle {
  id: string;
  name: string;
  cargoCapacity: number;
  speed: number;
  fuelCapacity: number;
  fuelConsumption: number;
  batteryCapacity: number;
  armour: number;
  tyres: number;
  ammo: number;
  crewCapacity: number;
  stealth: number;
}

export interface Convoy {
  id: string;
  slot: number;
  vehicleId: string;
  crew: CrewRole[];
  destinationId: string;
  routeId: string;
  cargo: Array<{ goodId: string; amount: number }>;
  startedAt: number;
  eta: number;
  status: 'en_route' | 'returning' | 'idle' | 'damaged';
  fuel: number;
  battery: number;
  armour: number;
  tyres: number;
  ammo: number;
  lastBoostAt?: number;
  log: string[];
}

export type CrewRole = 'Driver' | 'Mechanic' | 'Navigator' | 'Security';

export type LocationType =
  | 'settlement'
  | 'medical'
  | 'military'
  | 'black_market'
  | 'industrial'
  | 'logistics'
  | 'energy'
  | 'intel';

export interface Mission {
  id: string;
  locationId: string;
  requestedGoodId: string;
  quantity: number;
  deadline: number;
  moneyReward: number;
  reputationReward: number;
  specialReward?: 'intel' | 'unlock';
  completed: boolean;
}

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  contactName: string;
  personality: string;
  flavor: string;
  unlocked: boolean;
  reputation: number;
  openHours: [number, number];
  market: Record<string, number>;
  missions: Mission[];
  x: number;
  y: number;
}

export interface Route {
  id: string;
  originId: string;
  destinationId: string;
  distance: number;
  baseRisk: number;
  tripsCompleted: number;
  familiarity: number;
  stability: number;
}

export type MessageCategory = 'base' | 'convoy' | 'relay' | 'market' | 'crew' | 'rumour' | 'private';

export interface GameMessage {
  id: string;
  at: number;
  category: MessageCategory;
  text: string;
}

export interface ResearchTask {
  id: string;
  label: string;
  endsAt: number;
  unlocks: string;
}

export interface GameState {
  firstSaveAt: number;
  lastTickAt: number;
  resources: {
    money: number;
    people: number;
    electricity: number;
    electricityCap: number;
    storageCap: number;
    gold: number;
  };
  goodsInventory: Record<string, number>;
  facilities: Facility[];
  locations: Location[];
  routes: Route[];
  convoys: Convoy[];
  convoySlots: number;
  maxConvoySlots: number;
  lockedConvoySlots: number;
  activeResearch?: ResearchTask;
  unlockedResearch: string[];
  messages: GameMessage[];
  rumourBias: number;
  debug: {
    enabled: boolean;
    timeOffsetMs: number;
  };
}
