import type { Level, ReviewDraft } from '../types';
import { previousDay } from './daily';

const PREFIX = 'prc:';

function read<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(PREFIX + key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

const emptyDraft = (): ReviewDraft => ({ comments: [], summary: '', verdict: 'comment' });

export const loadDraft = (date: string, challengeId: string): ReviewDraft =>
  read<ReviewDraft>(`draft:${date}:${challengeId}`, emptyDraft());

export const saveDraft = (date: string, challengeId: string, draft: ReviewDraft) =>
  write(`draft:${date}:${challengeId}`, draft);

/** date -> level -> id of the challenge completed that day */
export type History = Record<string, Partial<Record<Level, string>>>;

export const loadHistory = (): History => read<History>('history', {});

export function markDone(date: string, level: Level, challengeId: string) {
  const history = loadHistory();
  history[date] = { ...history[date], [level]: challengeId };
  write('history', history);
}

export function isDone(date: string, level: Level): boolean {
  return Boolean(loadHistory()[date]?.[level]);
}

/** Consecutive days with at least one review; today still counts as pending. */
export function currentStreak(history: History, today: string): number {
  const hasEntry = (key: string) => Object.keys(history[key] ?? {}).length > 0;
  let key = hasEntry(today) ? today : previousDay(today);
  let streak = 0;
  while (hasEntry(key)) {
    streak++;
    key = previousDay(key);
  }
  return streak;
}
