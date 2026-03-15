import { Facility, Location, Route, Vehicle } from '../models/types';

export const vehicles: Vehicle[] = [
  { id: 'push_bike', name: 'Push Bike Courier', cargoCapacity: 8, speed: 18, fuelCapacity: 0, fuelConsumption: 0, batteryCapacity: 10, armour: 4, tyres: 12, ammo: 0, crewCapacity: 1, stealth: 9 },
  { id: 'motorbike', name: 'Motorbike', cargoCapacity: 16, speed: 32, fuelCapacity: 40, fuelConsumption: 5, batteryCapacity: 5, armour: 8, tyres: 20, ammo: 0, crewCapacity: 1, stealth: 8 },
  { id: 'pickup', name: 'Pickup Truck', cargoCapacity: 30, speed: 28, fuelCapacity: 75, fuelConsumption: 9, batteryCapacity: 8, armour: 18, tyres: 30, ammo: 6, crewCapacity: 2, stealth: 5 },
  { id: 'cargo_van', name: 'Cargo Van', cargoCapacity: 48, speed: 25, fuelCapacity: 95, fuelConsumption: 11, batteryCapacity: 10, armour: 22, tyres: 36, ammo: 8, crewCapacity: 3, stealth: 4 },
  { id: 'heavy_truck', name: 'Heavy Cargo Truck', cargoCapacity: 72, speed: 21, fuelCapacity: 140, fuelConsumption: 15, batteryCapacity: 12, armour: 28, tyres: 44, ammo: 12, crewCapacity: 3, stealth: 2 },
  { id: 'armoured_transport', name: 'Armoured Transport', cargoCapacity: 60, speed: 23, fuelCapacity: 130, fuelConsumption: 16, batteryCapacity: 14, armour: 44, tyres: 50, ammo: 18, crewCapacity: 4, stealth: 3 }
];

export const baseLocationId = 'hideout';

export const starterLocations: Location[] = [
  { id: 'hideout', name: 'Hidden Basement', type: 'logistics', contactName: 'Relay 0', personality: 'careful and dry', flavor: 'A reinforced cellar beneath a shuttered workshop.', unlocked: true, reputation: 0, openHours: [17, 19], market: {}, missions: [], x: 50, y: 52 },
  { id: 'river_settlement', name: 'River Settlement', type: 'settlement', contactName: 'Mila Arsen', personality: 'practical quartermaster', flavor: 'A dense riverside district running on barter and generator light.', unlocked: true, reputation: 5, openHours: [17, 20], market: {}, missions: [], x: 72, y: 43 },
  { id: 'field_clinic', name: 'Field Clinic 7', type: 'medical', contactName: 'Dr. Ilya Soren', personality: 'calm under pressure', flavor: 'A triage center hidden in an old school basement.', unlocked: false, reputation: 0, openHours: [17, 21], market: {}, missions: [], x: 64, y: 70 },
  { id: 'iron_ruins', name: 'Iron Ruins', type: 'industrial', contactName: 'Barto K', personality: 'grease-stained realist', flavor: 'Collapsed assembly halls with salvage crews and contested roads.', unlocked: false, reputation: 0, openHours: [17, 22], market: {}, missions: [], x: 34, y: 32 },
  { id: 'night_exchange', name: 'Night Exchange', type: 'black_market', contactName: 'Madam Veil', personality: 'smiling opportunist', flavor: 'A rotating market hidden behind changing shutters.', unlocked: false, reputation: 0, openHours: [17, 23], market: {}, missions: [], x: 26, y: 62 },
  { id: 'signal_watch', name: 'Signal Watch', type: 'intel', contactName: 'Echo-Nine', personality: 'cryptic analyst', flavor: 'An interception post listening to everything at once.', unlocked: false, reputation: 0, openHours: [0, 24], market: {}, missions: [], x: 82, y: 20 }
];

export const starterRoutes: Route[] = [
  { id: 'r0', originId: 'hideout', destinationId: 'river_settlement', distance: 12, baseRisk: 0.12, tripsCompleted: 0, familiarity: 0.05, stability: 0.1 },
  { id: 'r1', originId: 'river_settlement', destinationId: 'field_clinic', distance: 15, baseRisk: 0.18, tripsCompleted: 0, familiarity: 0, stability: 0 },
  { id: 'r2', originId: 'hideout', destinationId: 'iron_ruins', distance: 20, baseRisk: 0.24, tripsCompleted: 0, familiarity: 0, stability: 0 },
  { id: 'r3', originId: 'hideout', destinationId: 'night_exchange', distance: 18, baseRisk: 0.35, tripsCompleted: 0, familiarity: 0, stability: 0 },
  { id: 'r4', originId: 'river_settlement', destinationId: 'signal_watch', distance: 26, baseRisk: 0.3, tripsCompleted: 0, familiarity: 0, stability: 0 }
];

export function getUnlockedVehicles(facilities: Facility[]): Vehicle[] {
  const unlocked: Vehicle[] = [vehicles[0]];
  const vehicleFacility = facilities.find((f) => f.id === 'vehicle_facility');
  const defenceFacility = facilities.find((f) => f.id === 'defence_facility');

  if (vehicleFacility?.unlocked) {
    unlocked.push(vehicles[1], vehicles[2]);
  }

  if ((vehicleFacility?.level ?? 0) >= 2) {
    unlocked.push(vehicles[3]);
  }

  if (defenceFacility?.unlocked) {
    unlocked.push(vehicles[4]);
  }

  if ((defenceFacility?.level ?? 0) >= 2) {
    unlocked.push(vehicles[5]);
  }

  return unlocked;
}
