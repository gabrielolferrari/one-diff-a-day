import type { Level } from '../types';
import { isPlayable } from './daily';

export type Route =
  | { view: 'home'; selected: string | null }
  | { view: 'challenge'; date: string; level: Level };

const CHALLENGE = /^#\/(?:(\d{4}-\d{2}-\d{2})\/)?(light|challenger)$/;
const DAY = /^#\/day\/(\d{4}-\d{2}-\d{2})$/;

/** Dates outside the playable range fall back to the plain home. */
export function parseRoute(hash: string, today: string): Route {
  const challenge = hash.match(CHALLENGE);
  if (challenge) {
    const date = challenge[1] ?? today;
    if (isPlayable(date, today)) return { view: 'challenge', date, level: challenge[2] as Level };
  }

  const day = hash.match(DAY);
  if (day && isPlayable(day[1], today)) return { view: 'home', selected: day[1] };

  return { view: 'home', selected: null };
}

export function dayHref(date: string): string {
  return `#/day/${date}`;
}

export function challengeHref(date: string, level: Level, today: string): string {
  return date === today ? `#/${level}` : `#/${date}/${level}`;
}
