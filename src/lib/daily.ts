import { challenges } from '../challenges';
import type { Challenge, Level } from '../types';

export const FIRST_DAY = '2026-09-01';
const MS_PER_DAY = 86_400_000;

export function formatKey(y: number, monthIndex: number, d: number): string {
  return `${y}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Keys are zero-padded, so string comparison follows calendar order. */
export function isPlayable(key: string, today: string): boolean {
  return key >= FIRST_DAY && key <= today;
}

export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dayNumber(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

export function previousDay(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const prev = new Date(Date.UTC(y, m - 1, d) - MS_PER_DAY);
  return prev.toISOString().slice(0, 10);
}

export function challengeNumber(key: string): number {
  return dayNumber(key) - dayNumber(FIRST_DAY) + 1;
}

export function pickChallenge(level: Level, key: string): Challenge {
  const pool = challenges
    .filter((c) => c.level === level)
    .sort((a, b) => a.id.localeCompare(b.id));
  if (pool.length === 0) throw new Error(`No challenges for level ${level}`);

  // A prime stride spreads consecutive days across the pool instead of walking it in order.
  const salt = level === 'light' ? 0 : 31;
  return pool[(dayNumber(key) * 7919 + salt) % pool.length];
}
