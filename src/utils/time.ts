export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

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
  return hour >= 18 || hour < 6;
}

export function isLocationOpen(openHours: [number, number], now: number): boolean {
  const h = gameHour(now);
  const [start, end] = openHours;
  if (start < end) {
    return h >= start && h < end;
  }
  return h >= start || h < end;
}
