import { useState } from 'react';
import { FIRST_DAY, formatKey, isPlayable, parseKey } from '../lib/daily';
import { LEVELS } from '../lib/labels';
import { dayHref } from '../lib/routes';
import type { History } from '../lib/storage';
import type { Level } from '../types';
import { ArrowLeftIcon, ArrowRightIcon } from './Icons';

interface Props {
  today: string;
  selected: string | null;
  history: History;
}

const LEVEL_ORDER: Level[] = ['light', 'challenger'];
const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function monthLabel(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export default function Calendar({ today, selected, history }: Props) {
  const [cursor, setCursor] = useState(() => {
    const d = parseKey(selected ?? today);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const { year, month } = cursor;
  const monthKey = formatKey(year, month, 1).slice(0, 7);
  const canGoBack = monthKey > FIRST_DAY.slice(0, 7);
  const canGoForward = monthKey < today.slice(0, 7);

  const leading = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => formatKey(year, month, i + 1));

  const doneThisMonth = days.reduce((n, key) => n + Object.keys(history[key] ?? {}).length, 0);
  const playableThisMonth = days.filter((key) => isPlayable(key, today)).length * LEVEL_ORDER.length;

  function shift(delta: number) {
    const next = new Date(year, month + delta, 1);
    setCursor({ year: next.getFullYear(), month: next.getMonth() });
  }

  return (
    <div className="calendar">
      <div className="calendar-head">
        <button
          type="button"
          className="icon-btn"
          onClick={() => shift(-1)}
          disabled={!canGoBack}
          aria-label="Mês anterior"
        >
          <ArrowLeftIcon />
        </button>
        <div className="calendar-title">
          <span className="calendar-month">{monthLabel(year, month)}</span>
          <span className="calendar-progress">
            {doneThisMonth} de {playableThisMonth} desafios feitos
          </span>
        </div>
        <button
          type="button"
          className="icon-btn"
          onClick={() => shift(1)}
          disabled={!canGoForward}
          aria-label="Próximo mês"
        >
          <ArrowRightIcon />
        </button>
      </div>

      <div className="calendar-grid">
        {WEEKDAYS.map((name) => (
          <span key={name} className="calendar-weekday" aria-hidden>
            {name}
          </span>
        ))}
        {Array.from({ length: leading }, (_, i) => (
          <span key={`pad-${i}`} aria-hidden />
        ))}
        {days.map((key) => {
          const entry = history[key] ?? {};
          const playable = isPlayable(key, today);
          const done = LEVEL_ORDER.filter((l) => entry[l]).map((l) => LEVELS[l].label);
          const dayNumber = Number(key.slice(8));
          const status = done.length > 0 ? `concluiu ${done.join(' e ')}` : 'nenhum desafio feito';
          const className = [
            'calendar-day',
            key === today ? 'is-today' : '',
            key === selected ? 'is-selected' : '',
            done.length === LEVEL_ORDER.length ? 'is-complete' : '',
          ].join(' ');

          if (!playable) {
            return (
              <span key={key} className={`${className} is-disabled`} aria-disabled>
                {dayNumber}
              </span>
            );
          }

          return (
            <a
              key={key}
              href={dayHref(key)}
              className={className}
              aria-current={key === selected ? 'date' : undefined}
              aria-label={`${parseKey(key).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}: ${status}`}
            >
              <span className="calendar-day-number">{dayNumber}</span>
              <span className="calendar-pips" aria-hidden>
                {LEVEL_ORDER.map((l) => (
                  <span key={l} className={`pip pip-${l} ${entry[l] ? 'on' : ''}`} />
                ))}
              </span>
            </a>
          );
        })}
      </div>

      <div className="calendar-legend" aria-hidden>
        <span>
          <span className="pip pip-light on" /> Leve
        </span>
        <span>
          <span className="pip pip-challenger on" /> Challenger
        </span>
      </div>
    </div>
  );
}
