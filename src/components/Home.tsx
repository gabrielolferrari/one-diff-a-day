import { challengeNumber, parseKey, pickChallenge } from '../lib/daily';
import { diffStats, parseDiff } from '../lib/diff';
import { LEVELS, languageLabel } from '../lib/labels';
import { challengeHref } from '../lib/routes';
import { currentStreak, loadDraft, loadHistory, type History } from '../lib/storage';
import type { Challenge, Level } from '../types';
import Calendar from './Calendar';
import DayDetail from './DayDetail';
import EnergyMeter from './EnergyMeter';
import { ArrowRightIcon, CheckIcon } from './Icons';
import TopBar from './TopBar';

interface Props {
  today: string;
  selected: string | null;
}

const LEVEL_ORDER: Level[] = ['light', 'challenger'];

function formatLongDate(key: string): string {
  return parseKey(key).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function challengeStats(challenge: Challenge) {
  const stats = challenge.files.map((f) => diffStats(parseDiff(f.diff)));
  return {
    files: challenge.files.length,
    additions: stats.reduce((n, s) => n + s.additions, 0),
    deletions: stats.reduce((n, s) => n + s.deletions, 0),
  };
}

export default function Home({ today, selected }: Props) {
  const history = loadHistory();
  const streak = currentStreak(history, today);

  return (
    <div className="page">
      <TopBar>
        <span className="streak-chip" title="Dias seguidos com pelo menos uma revisão">
          <span className="streak-count">{streak}</span>
          {streak === 1 ? 'dia seguido' : 'dias seguidos'}
        </span>
      </TopBar>

      <main className="home">
        <section aria-labelledby="pick-title">
          <p className="day-line">
            Desafio #{challengeNumber(today)}, {formatLongDate(today)}
          </p>
          <h1 id="pick-title" className="section-title">
            Como está a sua energia hoje?
          </h1>
          <div className="level-cards">
            {LEVEL_ORDER.map((level) => (
              <LevelCard
                key={level}
                level={level}
                date={today}
                today={today}
                challenge={pickChallenge(level, today)}
                history={history}
              />
            ))}
          </div>
        </section>

        <section aria-labelledby="calendar-title" className="panel calendar-panel">
          <h2 id="calendar-title" className="panel-title">
            Desafios anteriores
          </h2>
          <div className="calendar-layout">
            <Calendar today={today} selected={selected} history={history} />
            <DayDetail date={selected} today={today} history={history} />
          </div>
        </section>

        <footer className="home-footer">
          Seu progresso e seus rascunhos ficam salvos só neste navegador.
        </footer>
      </main>
    </div>
  );
}

function LevelCard({
  level,
  date,
  today,
  challenge,
  history,
}: {
  level: Level;
  date: string;
  today: string;
  challenge: Challenge;
  history: History;
}) {
  const info = LEVELS[level];
  const stats = challengeStats(challenge);
  const done = Boolean(history[date]?.[level]);
  const commentCount = loadDraft(date, challenge.id).comments.length;

  const status = done
    ? 'Concluído'
    : commentCount > 0
      ? `Em andamento, ${commentCount} ${commentCount === 1 ? 'comentário' : 'comentários'}`
      : 'Ainda não começou';
  const action = done ? 'Ver revisão' : commentCount > 0 ? 'Continuar' : 'Revisar';

  return (
    <a
      className={`level-card level-card-${level} ${done ? 'is-done' : ''}`}
      href={challengeHref(date, level, today)}
    >
      <div className="level-card-top">
        <EnergyMeter level={info.energy} label={info.label} />
        <span className="level-name">{info.label}</span>
        <span className="level-minutes">{info.minutes}</span>
      </div>
      <p className="level-effort">{info.effort}</p>

      <div className="level-pr">
        <h3>{challenge.title}</h3>
        <div className="level-pr-meta">
          <span className="lang-tag">{languageLabel(challenge.language)}</span>
          <span>
            {stats.files} {stats.files === 1 ? 'arquivo' : 'arquivos'}
          </span>
          <span className="num-add">+{stats.additions}</span>
          <span className="num-del">−{stats.deletions}</span>
        </div>
      </div>

      <div className="level-card-footer">
        <span className={`level-status ${done ? 'done' : ''}`}>
          {done && <CheckIcon width={14} height={14} />}
          {status}
        </span>
        <span className="level-action">
          {action}
          <ArrowRightIcon />
        </span>
      </div>
    </a>
  );
}
