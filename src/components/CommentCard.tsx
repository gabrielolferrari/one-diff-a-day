import { highlightLine } from '../lib/highlight';
import { CATEGORIES } from '../lib/labels';
import type { ReviewComment } from '../types';

interface Props {
  comment: ReviewComment;
  rangeLabel: string;
  original: string[];
  language: string;
  onEdit: () => void;
  onDelete: () => void;
}

type Part = { type: 'text' | 'suggestion'; value: string };

function splitSuggestions(body: string): Part[] {
  const parts: Part[] = [];
  const pattern = /```suggestion\n([\s\S]*?)\n?```/g;
  let last = 0;
  for (const match of body.matchAll(pattern)) {
    parts.push({ type: 'text', value: body.slice(last, match.index) });
    parts.push({ type: 'suggestion', value: match[1] });
    last = match.index + match[0].length;
  }
  parts.push({ type: 'text', value: body.slice(last) });
  return parts.filter((p) => p.type === 'suggestion' || p.value.trim());
}

function CodeRow({ kind, code, language }: { kind: 'add' | 'del'; code: string; language: string }) {
  return (
    <div className={`suggestion-line ${kind}`}>
      <span className="marker" aria-hidden>
        {kind === 'add' ? '+' : '-'}
      </span>
      <span dangerouslySetInnerHTML={{ __html: highlightLine(code, language) || ' ' }} />
    </div>
  );
}

export default function CommentCard({ comment, rangeLabel, original, language, onEdit, onDelete }: Props) {
  return (
    <article className="thread">
      <header className="thread-head">
        <span className="avatar avatar-you" aria-hidden>
          V
        </span>
        <strong>Você</strong>
        <span className="muted">{rangeLabel}</span>
        {comment.category && <span className={`category cat-${comment.category}`}>{CATEGORIES[comment.category]}</span>}
        <span className="spacer" />
        <button type="button" className="text-btn" onClick={onEdit}>
          Editar
        </button>
        <button type="button" className="text-btn danger" onClick={onDelete}>
          Excluir
        </button>
      </header>
      <div className="thread-body">
        {splitSuggestions(comment.body).map((part, i) =>
          part.type === 'text' ? (
            <p key={i} className="thread-text">
              {part.value.trim()}
            </p>
          ) : (
            <div key={i} className="suggestion">
              <div className="suggestion-title">Alteração sugerida</div>
              {original.map((code, j) => (
                <CodeRow key={`o${j}`} kind="del" code={code} language={language} />
              ))}
              {part.value.split('\n').map((code, j) => (
                <CodeRow key={`n${j}`} kind="add" code={code} language={language} />
              ))}
            </div>
          ),
        )}
      </div>
    </article>
  );
}
