export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;
export const NIGHT_START_HOUR = 17;
export const DAY_START_HOUR = 5;
const NIGHT_WINDOW_HOURS = 12;

export const clamp = (n: number, min: number, max: number): number => Math.max(min, Math.min(max, n));

export function currentGameTime(offsetMs = 0): number {
  return Date.now() + offsetMs;
}

export function gameDay(firstSaveAt: number, now: number): number {
  return Math.floor((now - firstSaveAt) / DAY) + 1;
}

export function gameHour(now: number): number {
  return new Date(now).getHours();
}

export function isNightPhase(now: number): boolean {
  const hour = gameHour(now);
  return hour >= NIGHT_START_HOUR || hour < DAY_START_HOUR;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function locationSeed(locationId: string): number {
  return locationId.split('').reduce((sum, ch, index) => sum + ch.charCodeAt(0) * (index + 1), 0);
}

export function locationNightOpenHours(locationId: string, reputation: number, firstSaveAt: number, now: number): [number, number] {
  const dayIndex = gameDay(firstSaveAt, now);
  const level = clamp(Math.floor(reputation / 5) + 1, 1, 6);
  const minDuration = clamp(2 + (level - 1) * 2, 2, NIGHT_WINDOW_HOURS);
  const maxDuration = clamp(4 + (level - 1) * 2, minDuration, NIGHT_WINDOW_HOURS);

  const seedBase = locationSeed(locationId) + dayIndex * 131;
  const duration = Math.floor(minDuration + seededRandom(seedBase) * (maxDuration - minDuration + 1));

  if (duration >= NIGHT_WINDOW_HOURS) return [NIGHT_START_HOUR, DAY_START_HOUR];

  const startOffsetMax = NIGHT_WINDOW_HOURS - duration;
  const startOffset = Math.floor(seededRandom(seedBase + 17) * (startOffsetMax + 1));
  const start = (NIGHT_START_HOUR + startOffset) % 24;
  const end = (start + duration) % 24;
  return [start, end];
}

export function isLocationOpen(openHours: [number, number], now: number): boolean {
  const h = gameHour(now);
  const [start, end] = openHours;
  if (start < end) {
    return h >= start && h < end;
  }
  return h >= start || h < end;
}
