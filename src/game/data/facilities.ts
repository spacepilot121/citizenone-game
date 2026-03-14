import { Facility } from '../models/types';

export const starterFacilities: Facility[] = [
  { id: 'manufacturing', name: 'Manufacturing', description: 'Produces core goods for contracts and trade.', unlocked: true, level: 1, powerUse: 2, assignedPeople: 1, status: 'idle' },
  { id: 'radio_recon', name: 'Radio Recon', description: 'Scans chatter for missions, rumours, and nearby locations.', unlocked: true, level: 1, powerUse: 1, assignedPeople: 1, status: 'idle' },
  { id: 'smuggler_training', name: 'Smuggler Training', description: 'Recruits and improves convoy crews.', unlocked: false, level: 0, powerUse: 2, assignedPeople: 0, status: 'offline' },
  { id: 'vehicle_facility', name: 'Vehicle Facility', description: 'Repairs and upgrades convoy vehicles.', unlocked: false, level: 0, powerUse: 2, assignedPeople: 0, status: 'offline' },
  { id: 'storage_facility', name: 'Storage Facility', description: 'Increases base storage capacity and reservation handling.', unlocked: false, level: 0, powerUse: 1, assignedPeople: 0, status: 'offline' },
  { id: 'defence_facility', name: 'Defence Facility', description: 'Supports route security and convoy defensive options.', unlocked: false, level: 0, powerUse: 2, assignedPeople: 0, status: 'offline' },
  { id: 'research_facility', name: 'Research Facility', description: 'Unlocks advanced systems, convoy slots, and goods.', unlocked: false, level: 0, powerUse: 3, assignedPeople: 0, status: 'offline' },
  { id: 'power_facility', name: 'Power Facility', description: 'Generates electricity for larger operations.', unlocked: false, level: 0, powerUse: 0, assignedPeople: 0, status: 'offline' }
];

export const unlockCosts: Record<string, { money: number; people?: number }> = {
  smuggler_training: { money: 180, people: 1 },
  vehicle_facility: { money: 220 },
  storage_facility: { money: 140 },
  defence_facility: { money: 260 },
  research_facility: { money: 240, people: 1 },
  power_facility: { money: 160 }
};
