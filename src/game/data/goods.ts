import { Good } from '../models/types';

export const goods: Good[] = [
  { id: 'plastic_parts', name: 'Plastic Parts', category: 'industrial', tier: 1, baseValue: 8, cargoSize: 1, legality: 'low' },
  { id: 'metal_scrap', name: 'Metal Scrap', category: 'industrial', tier: 1, baseValue: 7, cargoSize: 1, legality: 'low' },
  { id: 'basic_pharma', name: 'Basic Pharmaceutical Compounds', category: 'medical', tier: 1, baseValue: 16, cargoSize: 1, legality: 'medium' },
  { id: 'basic_electronics', name: 'Basic Electronics', category: 'electronics', tier: 1, baseValue: 15, cargoSize: 1, legality: 'low' },
  { id: 'wire_bundles', name: 'Wire Bundles', category: 'electronics', tier: 1, baseValue: 10, cargoSize: 1, legality: 'low' },
  { id: 'fuel_components', name: 'Fuel Components', category: 'energy', tier: 1, baseValue: 18, cargoSize: 2, legality: 'medium' },
  { id: 'metal_casings', name: 'Metal Casings', category: 'construction', tier: 2, baseValue: 22, cargoSize: 2, legality: 'low', recipe: [{ goodId: 'metal_scrap', amount: 2 }] },
  { id: 'circuit_boards', name: 'Circuit Boards', category: 'electronics', tier: 2, baseValue: 26, cargoSize: 1, legality: 'medium', recipe: [{ goodId: 'basic_electronics', amount: 1 }, { goodId: 'wire_bundles', amount: 1 }] },
  { id: 'battery_packs', name: 'Battery Packs', category: 'energy', tier: 2, baseValue: 28, cargoSize: 1, legality: 'medium', recipe: [{ goodId: 'fuel_components', amount: 1 }, { goodId: 'plastic_parts', amount: 1 }] },
  { id: 'mechanical_joints', name: 'Mechanical Joints', category: 'industrial', tier: 2, baseValue: 20, cargoSize: 1, legality: 'low', recipe: [{ goodId: 'metal_scrap', amount: 1 }, { goodId: 'plastic_parts', amount: 1 }] },
  { id: 'drone_wings', name: 'Drone Wings', category: 'military', tier: 2, baseValue: 36, cargoSize: 2, legality: 'high', recipe: [{ goodId: 'plastic_parts', amount: 2 }, { goodId: 'wire_bundles', amount: 1 }] },
  { id: 'servo_motors', name: 'Servo Motors', category: 'industrial', tier: 3, baseValue: 42, cargoSize: 2, legality: 'medium', recipe: [{ goodId: 'mechanical_joints', amount: 2 }, { goodId: 'circuit_boards', amount: 1 }] },
  { id: 'navigation_modules', name: 'Navigation Modules', category: 'electronics', tier: 3, baseValue: 45, cargoSize: 1, legality: 'high', recipe: [{ goodId: 'circuit_boards', amount: 2 }] },
  { id: 'armour_plates', name: 'Armour Plates', category: 'military', tier: 3, baseValue: 48, cargoSize: 3, legality: 'high', recipe: [{ goodId: 'metal_casings', amount: 2 }] },
  { id: 'fuel_regulators', name: 'Fuel Regulators', category: 'energy', tier: 3, baseValue: 44, cargoSize: 1, legality: 'high', recipe: [{ goodId: 'fuel_components', amount: 2 }, { goodId: 'circuit_boards', amount: 1 }] },
  { id: 'med_parts', name: 'Medical Equipment Parts', category: 'medical', tier: 3, baseValue: 46, cargoSize: 2, legality: 'medium', recipe: [{ goodId: 'basic_pharma', amount: 2 }, { goodId: 'circuit_boards', amount: 1 }] },
  { id: 'recon_drones', name: 'Recon Drones', category: 'military', tier: 4, baseValue: 75, cargoSize: 3, legality: 'high', recipe: [{ goodId: 'drone_wings', amount: 1 }, { goodId: 'navigation_modules', amount: 1 }] },
  { id: 'counter_drone_units', name: 'Counter-Drone Units', category: 'military', tier: 4, baseValue: 84, cargoSize: 3, legality: 'high', recipe: [{ goodId: 'recon_drones', amount: 1 }, { goodId: 'armour_plates', amount: 1 }] },
  { id: 'secure_comms', name: 'Secure Comms Units', category: 'electronics', tier: 4, baseValue: 80, cargoSize: 2, legality: 'high', recipe: [{ goodId: 'navigation_modules', amount: 1 }, { goodId: 'battery_packs', amount: 1 }] },
  { id: 'full_drones', name: 'Full Drones', category: 'military', tier: 5, baseValue: 120, cargoSize: 4, legality: 'high', recipe: [{ goodId: 'recon_drones', amount: 1 }, { goodId: 'servo_motors', amount: 1 }] },
  { id: 'weapon_systems', name: 'Weapons Systems', category: 'military', tier: 5, baseValue: 145, cargoSize: 5, legality: 'high', recipe: [{ goodId: 'armour_plates', amount: 1 }, { goodId: 'secure_comms', amount: 1 }] },
  { id: 'prefab_braces', name: 'Prefab Braces', category: 'construction', tier: 2, baseValue: 24, cargoSize: 2, legality: 'low' },
  { id: 'field_med_kits', name: 'Field Med Kits', category: 'medical', tier: 2, baseValue: 30, cargoSize: 1, legality: 'medium' },
  { id: 'diesel_cells', name: 'Diesel Cells', category: 'energy', tier: 2, baseValue: 29, cargoSize: 2, legality: 'medium' },
  { id: 'optic_cables', name: 'Optic Cables', category: 'electronics', tier: 2, baseValue: 27, cargoSize: 1, legality: 'low' }
];

export const goodMap = Object.fromEntries(goods.map((g) => [g.id, g]));
