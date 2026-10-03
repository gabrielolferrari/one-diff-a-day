import { useCallback, useEffect, useMemo, useState } from 'react';
import { challengeNumber, parseKey } from '../lib/daily';
import { dayHref } from '../lib/routes';
import { diffStats, parseDiff } from '../lib/diff';
import { LEVELS, languageLabel } from '../lib/labels';
import { isDone, loadDraft, markDone, saveDraft } from '../lib/storage';
import type { Category, Challenge, ReviewDraft } from '../types';
import DiffFile, { isSelectable, type PendingDraft, type Selection } from './DiffFile';
import EnergyMeter from './EnergyMeter';
import FinishModal from './FinishModal';
import HintsPanel from './HintsPanel';
import { CheckIcon, FileIcon, PullRequestIcon } from './Icons';
import Markdown from './Markdown';
import TopBar from './TopBar';

interface Props {
  date: string;
  today: string;
  challenge: Challenge;
}

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const fileAnchor = (index: number) => `file-${index}`;

export default function ChallengeView({ date, today, challenge }: Props) {
  const level = LEVELS[challenge.level];
  const parsed = useMemo(() => challenge.files.map((f) => parseDiff(f.diff)), [challenge]);
  const stats = parsed.map(diffStats);
  const totals = stats.reduce(
    (acc, s) => ({ additions: acc.additions + s.additions, deletions: acc.deletions + s.deletions }),
    { additions: 0, deletions: 0 },
  );

  const [draft, setDraft] = useState<ReviewDraft>(() => loadDraft(date, challenge.id));
  const [selection, setSelection] = useState<Selection | null>(null);
  const [pendingDraft, setPendingDraft] = useState<PendingDraft>({ body: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [done, setDone] = useState(() => isDone(date, challenge.level));

  useEffect(() => {
    saveDraft(date, challenge.id, draft);
  }, [date, challenge.id, draft]);

  function handleLineClick(fileIndex: number, lineIndex: number, extend: boolean) {
    setEditingId(null);
    const extending = extend && selection !== null && selection.fileIndex === fileIndex;
    if (!extending) setPendingDraft({ body: '' });
    setSelection((current) =>
      extend && current && current.fileIndex === fileIndex
        ? {
            ...current,
            start: Math.min(current.anchor, lineIndex),
            end: Math.max(current.anchor, lineIndex),
          }
        : { fileIndex, anchor: lineIndex, start: lineIndex, end: lineIndex },
    );
  }

  function extendSelection(direction: 'up' | 'down') {
    setSelection((current) => {
      if (!current) return current;
      const lines = parsed[current.fileIndex];
      if (direction === 'up' && isSelectable(lines, current.start - 1)) {
        return { ...current, start: current.start - 1 };
      }
      if (direction === 'down' && isSelectable(lines, current.end + 1)) {
        return { ...current, end: current.end + 1 };
      }
      return current;
    });
  }

  function addComment(body: string, category?: Category) {
    if (!selection) return;
    const { fileIndex, start, end } = selection;
    setDraft((d) => ({ ...d, comments: [...d.comments, { id: newId(), fileIndex, start, end, body, category }] }));
    setSelection(null);
    setPendingDraft({ body: '' });
  }

  function updateComment(id: string, body: string, category?: Category) {
    setDraft((d) => ({
      ...d,
      comments: d.comments.map((c) => (c.id === id ? { ...c, body, category } : c)),
    }));
    setEditingId(null);
  }

  function deleteComment(id: string) {
    setDraft((d) => ({ ...d, comments: d.comments.filter((c) => c.id !== id) }));
  }

  const closeModal = useCallback(() => setFinishing(false), []);

  function handleCopied() {
    markDone(date, challenge.level, challenge.id);
    setDone(true);
  }

  const commentCount = draft.comments.length;
  const commentLabel = `${commentCount} ${commentCount === 1 ? 'comentário' : 'comentários'}`;
  const finishLabel = done ? 'Ver prompt de novo' : 'Finalizar revisão';
  const isToday = date === today;
  const shortDate = parseKey(date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });

  return (
    <div className="page">
      <TopBar back={{ href: isToday ? '#/' : dayHref(date), label: isToday ? 'Hoje' : shortDate }} />

      <div className="pr-layout">
        <header className="pr-header">
          <div className="pr-eyebrow">
            <span className={`level-pill level-pill-${challenge.level}`}>
              <EnergyMeter level={level.energy} label={level.label} />
              {level.label}
            </span>
            <span className="lang-tag">{languageLabel(challenge.language)}</span>
            <span className="muted">
              Desafio #{challengeNumber(date)}
              {!isToday && `, ${shortDate}`}
            </span>
            {done && (
              <span className="done-tag">
                <CheckIcon width={14} height={14} />
                Concluído
              </span>
            )}
          </div>
          <h1 className="pr-title">{challenge.title}</h1>
          <div className="pr-meta">
            <span className="state-pill">
              <PullRequestIcon width={14} height={14} />
              Aberto
            </span>
            <span>
              <strong>{challenge.author}</strong> quer fazer merge de <code className="branch">{challenge.branch}</code>{' '}
              em <code className="branch">main</code>
            </span>
          </div>
        </header>

        <main className="pr-main">
          <article className="card description">
            <div className="card-header">
              <span className="avatar" aria-hidden>
                {challenge.author[0].toUpperCase()}
              </span>
              <strong>{challenge.author}</strong>
              <span className="muted">abriu este PR</span>
            </div>
            <div className="card-body">
              <Markdown text={challenge.description} />
            </div>
          </article>

          <div className="files-bar">
            <h2 className="files-title">
              Arquivos alterados
              <span className="count-badge">{challenge.files.length}</span>
            </h2>
            <span className="num-add">+{totals.additions}</span>
            <span className="num-del">−{totals.deletions}</span>
            <span className="spacer" />
            <span className="files-hint hint-pointer">
              Clique no número de uma linha para comentar. <kbd>Shift</kbd> + clique seleciona um intervalo.
            </span>
            <span className="files-hint hint-touch">Toque numa linha para comentar.</span>
          </div>

          {challenge.files.map((file, fileIndex) => (
            <DiffFile
              key={file.path}
              id={fileAnchor(fileIndex)}
              path={file.path}
              language={challenge.language}
              fileIndex={fileIndex}
              lines={parsed[fileIndex]}
              comments={draft.comments.filter((c) => c.fileIndex === fileIndex)}
              selection={selection?.fileIndex === fileIndex ? selection : null}
              editingId={editingId}
              onLineClick={handleLineClick}
              onAdd={addComment}
              onUpdate={updateComment}
              onDelete={deleteComment}
              onEdit={(id) => {
                setSelection(null);
                setEditingId(id);
              }}
                onCancelSelection={() => setSelection(null)}
              onExtendSelection={extendSelection}
              pendingDraft={pendingDraft}
              onPendingDraftChange={setPendingDraft}
            />
          ))}
        </main>

        <aside className="pr-aside" aria-label="Sua revisão">
          <section className="card review-card">
            <div className="review-card-head">
              <h2 className="aside-title">Sua revisão</h2>
              <span className="muted">{commentLabel}</span>
            </div>
            <ul className="file-index">
              {challenge.files.map((file, i) => {
                const count = draft.comments.filter((c) => c.fileIndex === i).length;
                return (
                  <li key={file.path}>
                    <button type="button" onClick={() => jumpTo(fileAnchor(i))}>
                      <FileIcon width={14} height={14} />
                      <span className="file-index-name" title={file.path}>
                        {file.path.split('/').pop()}
                      </span>
                      {count > 0 && (
                        <span className="comment-dot" aria-label={`${count} comentários`}>
                          {count}
                        </span>
                      )}
                      <span className="num-add">+{stats[i].additions}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <button type="button" className="btn btn-primary btn-block" onClick={() => setFinishing(true)}>
              {finishLabel}
            </button>
            <p className="aside-note">O rascunho é salvo automaticamente.</p>
          </section>

          <HintsPanel
            hints={challenge.hints}
            used={draft.hintsUsed ?? 0}
            onReveal={() => setDraft((d) => ({ ...d, hintsUsed: (d.hintsUsed ?? 0) + 1 }))}
          />
        </aside>
      </div>

      <div className="mobile-bar">
        <span>{commentLabel}</span>
        <button type="button" className="btn btn-primary" onClick={() => setFinishing(true)}>
          {finishLabel}
        </button>
      </div>

      {finishing && (
        <FinishModal
          challenge={challenge}
          draft={draft}
          done={done}
          onChange={setDraft}
          onCopied={handleCopied}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

function jumpTo(id: string) {
  const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
}
