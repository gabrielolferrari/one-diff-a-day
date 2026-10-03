import { Fragment, useState, type MouseEvent } from 'react';
import { diffStats, markerFor, rangeLabel, replaceableLines } from '../lib/diff';
import { highlightLine } from '../lib/highlight';
import type { Category, DiffLine, ReviewComment } from '../types';
import CommentCard from './CommentCard';
import CommentForm from './CommentForm';
import { ChevronIcon, PlusIcon } from './Icons';

export interface Selection {
  fileIndex: number;
  anchor: number;
  start: number;
  end: number;
}

interface Props {
  id: string;
  path: string;
  language: string;
  fileIndex: number;
  lines: DiffLine[];
  comments: ReviewComment[];
  selection: Selection | null;
  editingId: string | null;
  onLineClick: (fileIndex: number, lineIndex: number, extend: boolean) => void;
  onAdd: (body: string, category?: Category) => void;
  onUpdate: (id: string, body: string, category?: Category) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string | null) => void;
  onCancelSelection: () => void;
  onExtendSelection: (direction: 'up' | 'down') => void;
  pendingDraft: PendingDraft;
  onPendingDraftChange: (draft: PendingDraft) => void;
}

/** Text typed for a new comment; lives outside the form so growing the range does not lose it. */
export interface PendingDraft {
  body: string;
  category?: Category;
}

function splitPath(path: string) {
  const slash = path.lastIndexOf('/');
  return slash === -1 ? { dir: '', name: path } : { dir: path.slice(0, slash + 1), name: path.slice(slash + 1) };
}

export default function DiffFile({
  id,
  path,
  language,
  fileIndex,
  lines,
  comments,
  selection,
  editingId,
  onLineClick,
  onAdd,
  onUpdate,
  onDelete,
  onEdit,
  onCancelSelection,
  onExtendSelection,
  pendingDraft,
  onPendingDraftChange,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const { additions, deletions } = diffStats(lines);
  const isNew = lines.every((l) => l.kind !== 'del' && l.kind !== 'context');
  const commentedLines = new Set(comments.flatMap((c) => range(c.start, c.end)));
  const { dir, name } = splitPath(path);

  return (
    <section id={id} className="diff-file">
      <header className="diff-file-header">
        <button
          type="button"
          className={`icon-btn collapse-btn ${collapsed ? 'is-collapsed' : ''}`}
          onClick={() => setCollapsed(!collapsed)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? `Expandir ${path}` : `Recolher ${path}`}
        >
          <ChevronIcon />
        </button>
        <span className="diff-path">
          <span className="diff-dir">{dir}</span>
          {name}
        </span>
        {isNew && <span className="new-tag">novo</span>}
        <span className="spacer" />
        {comments.length > 0 && (
          <span className="comment-dot" aria-label={`${comments.length} comentários`}>
            {comments.length}
          </span>
        )}
        <span className="num-add">+{additions}</span>
        <span className="num-del">−{deletions}</span>
      </header>

      {!collapsed && (
        <div className="diff-scroll">
          <table className="diff">
            <tbody>
              {lines.map((line, idx) => {
                if (line.kind === 'hunk') {
                  return (
                    <tr key={idx} className="hunk">
                      <td className="num num-old" />
                      <td className="num" />
                      <td className="code">{line.content}</td>
                    </tr>
                  );
                }

                const selected = selection !== null && idx >= selection.start && idx <= selection.end;
                const lineNumber = line.newNo ?? line.oldNo;
                const click = (e: MouseEvent) => {
                  window.getSelection()?.removeAllRanges();
                  onLineClick(fileIndex, idx, e.shiftKey);
                };

                return (
                  <Fragment key={idx}>
                    <tr
                      className={[
                        'line',
                        line.kind,
                        selected ? 'selected' : '',
                        commentedLines.has(idx) ? 'commented' : '',
                      ].join(' ')}
                    >
                      <td className="num num-old" onClick={click}>
                        {line.oldNo ?? ''}
                      </td>
                      <td className="num num-new">
                        <button
                          type="button"
                          className="line-btn"
                          onClick={click}
                          aria-label={`Comentar na linha ${lineNumber}`}
                        >
                          <span className="line-plus" aria-hidden>
                            <PlusIcon width={12} height={12} strokeWidth={3} />
                          </span>
                          {line.newNo ?? ''}
                        </button>
                      </td>
                      <td className="code" onClick={() => isTouch() && onLineClick(fileIndex, idx, false)}>
                        <span className="marker" aria-hidden>
                          {markerFor(line.kind)}
                        </span>
                        <span dangerouslySetInnerHTML={{ __html: highlightLine(line.content, language) }} />
                      </td>
                    </tr>

                    {comments
                      .filter((c) => c.end === idx)
                      .map((c) => (
                        <tr key={c.id} className="thread-row">
                          <td colSpan={3}>
                            {editingId === c.id ? (
                              <CommentForm
                                rangeLabel={rangeLabel(lines, c.start, c.end)}
                                suggestionSource={replaceableLines(lines, c.start, c.end)}
                                initialBody={c.body}
                                initialCategory={c.category}
                                submitLabel="Salvar"
                                onSubmit={(body, category) => onUpdate(c.id, body, category)}
                                onCancel={() => onEdit(null)}
                              />
                            ) : (
                              <CommentCard
                                comment={c}
                                rangeLabel={rangeLabel(lines, c.start, c.end)}
                                original={replaceableLines(lines, c.start, c.end)}
                                language={language}
                                onEdit={() => onEdit(c.id)}
                                onDelete={() => onDelete(c.id)}
                              />
                            )}
                          </td>
                        </tr>
                      ))}

                    {selection !== null && selection.end === idx && (
                      <tr className="thread-row">
                        <td colSpan={3}>
                          <CommentForm
                            rangeLabel={rangeLabel(lines, selection.start, selection.end)}
                            suggestionSource={replaceableLines(lines, selection.start, selection.end)}
                            initialBody={pendingDraft.body}
                            initialCategory={pendingDraft.category}
                            onDraftChange={onPendingDraftChange}
                            onExtend={onExtendSelection}
                            canExtendUp={isSelectable(lines, selection.start - 1)}
                            canExtendDown={isSelectable(lines, selection.end + 1)}
                            submitLabel="Comentar"
                            onSubmit={onAdd}
                            onCancel={onCancelSelection}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function isSelectable(lines: DiffLine[], index: number): boolean {
  return index >= 0 && index < lines.length && lines[index].kind !== 'hunk';
}

/** Touch devices select a line by tapping the code itself; there is no hover affordance on the gutter. */
function isTouch(): boolean {
  return window.matchMedia('(pointer: coarse)').matches;
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
