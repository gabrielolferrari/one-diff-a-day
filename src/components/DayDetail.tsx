import { useEffect, useRef } from 'react';
import { challengeNumber, parseKey, pickChallenge } from '../lib/daily';
import { LEVELS, languageLabel } from '../lib/labels';
import { challengeHref } from '../lib/routes';
import { loadDraft, type History } from '../lib/storage';
import type { Level } from '../types';
import EnergyMeter from './EnergyMeter';
import { ArrowRightIcon, CheckIcon } from './Icons';

interface Props {
  date: string | null;
  today: string;
  history: History;
}

const LEVEL_ORDER: Level[] = ['light', 'challenger'];

export default function DayDetail({ date, today, history }: Props) {
  const panel = useRef<HTMLDivElement>(null);

  // On narrow screens the panel sits below the calendar, so bring it into view after a pick.
  useEffect(() => {
    if (!date) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    panel.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'nearest' });
  }, [date]);

  if (!date) {
    return (
      <div className="day-detail day-detail-empty" ref={panel}>
        <p className="day-detail-empty-title">Escolha um dia no calendário</p>
        <p className="day-detail-empty-text">
          Os dois PRs daquele dia aparecem aqui, prontos para revisar. Dá para fazer qualquer dia desde o início.
        </p>
      </div>
    );
  }

  const longDate = parseKey(date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="day-detail" ref={panel} key={date} aria-live="polite">
      <header className="day-detail-head">
        <span className="day-detail-number">Desafio #{challengeNumber(date)}</span>
        <h3 className="day-detail-date">{longDate}</h3>
        {date === today && <span className="day-detail-today">Os mesmos desafios de hoje, lá em cima.</span>}
      </header>

      <ul className="day-challenges">
        {LEVEL_ORDER.map((level) => {
          const challenge = pickChallenge(level, date);
          const info = LEVELS[level];
          const done = Boolean(history[date]?.[level]);
          const comments = loadDraft(date, challenge.id).comments.length;
          const action = done ? 'Ver revisão' : comments > 0 ? 'Continuar' : 'Revisar';
          const status = done
            ? 'Concluído'
            : comments > 0
              ? `${comments} ${comments === 1 ? 'comentário' : 'comentários'}`
              : null;

          return (
            <li key={level}>
              <a className={`day-challenge day-challenge-${level}`} href={challengeHref(date, level, today)}>
                <span className="day-challenge-level">
                  <EnergyMeter level={info.energy} label={info.label} />
                  {info.label}
                  <span className="day-challenge-minutes">{info.minutes}</span>
                </span>
                <span className="day-challenge-title">{challenge.title}</span>
                <span className="day-challenge-foot">
                  <span className="lang-tag">{languageLabel(challenge.language)}</span>
                  {status && (
                    <span className={`day-challenge-status ${done ? 'done' : ''}`}>
                      {done && <CheckIcon width={13} height={13} />}
                      {status}
                    </span>
                  )}
                  <span className="day-challenge-action">
                    {action}
                    <ArrowRightIcon width={14} height={14} />
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
