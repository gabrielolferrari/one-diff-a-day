import { useEffect, useRef, useState } from 'react';
import { CATEGORIES } from '../lib/labels';
import type { Category } from '../types';

interface Props {
  rangeLabel: string;
  suggestionSource: string[];
  initialBody?: string;
  initialCategory?: Category;
  submitLabel: string;
  onSubmit: (body: string, category?: Category) => void;
  onCancel: () => void;
  onDraftChange?: (draft: { body: string; category?: Category }) => void;
  onExtend?: (direction: 'up' | 'down') => void;
  canExtendUp?: boolean;
  canExtendDown?: boolean;
}

export default function CommentForm({
  rangeLabel,
  suggestionSource,
  initialBody = '',
  initialCategory,
  submitLabel,
  onSubmit,
  onCancel,
  onDraftChange,
  onExtend,
  canExtendUp = false,
  canExtendDown = false,
}: Props) {
  const [body, setBody] = useState(initialBody);
  const [category, setCategory] = useState<Category | undefined>(initialCategory);
  const textarea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textarea.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    onDraftChange?.({ body, category });
  }, [body, category, onDraftChange]);

  function submit() {
    if (!body.trim()) return;
    onSubmit(body, category);
  }

  function insertSuggestion() {
    const position = textarea.current?.selectionStart ?? body.length;
    const before = body.slice(0, position);
    const separator = before && !before.endsWith('\n') ? '\n' : '';
    const block = '```suggestion\n' + suggestionSource.join('\n') + '\n```\n';
    setBody(before + separator + block + body.slice(position));
    textarea.current?.focus();
  }

  return (
    <div className="thread thread-form">
      <div className="form-head">
        <span className="form-range">Comentando {rangeLabel}</span>
        {onExtend && (
          <span className="range-controls" role="group" aria-label="Ajustar as linhas selecionadas">
            <button
              type="button"
              className="range-btn"
              onClick={() => onExtend('up')}
              disabled={!canExtendUp}
              aria-label="Incluir a linha de cima"
              title="Incluir a linha de cima"
            >
              ↑ +1
            </button>
            <button
              type="button"
              className="range-btn"
              onClick={() => onExtend('down')}
              disabled={!canExtendDown}
              aria-label="Incluir a linha de baixo"
              title="Incluir a linha de baixo"
            >
              ↓ +1
            </button>
          </span>
        )}
      </div>
      <textarea
        ref={textarea}
        value={body}
        rows={4}
        aria-label={`Comentário na ${rangeLabel}`}
        placeholder="O que o autor precisa saber sobre este trecho?"
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit();
          if (e.key === 'Escape') onCancel();
        }}
      />
      <div className="form-tools">
        <div className="category-picker" role="radiogroup" aria-label="Categoria (opcional)">
          {(Object.entries(CATEGORIES) as [Category, string][]).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={category === id}
              className={`category-option cat-${id} ${category === id ? 'active' : ''}`}
              onClick={() => setCategory(category === id ? undefined : id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="form-actions">
        <button
          type="button"
          className="btn btn-small"
          onClick={insertSuggestion}
          disabled={suggestionSource.length === 0}
          title="Insere o código atual num bloco para você editar"
        >
          Sugerir alteração
        </button>
        <span className="form-hint">
          <kbd>⌘</kbd> <kbd>Enter</kbd> envia
        </span>
        <span className="spacer" />
        <button type="button" className="btn btn-quiet" onClick={onCancel}>
          Cancelar
        </button>
        <button type="button" className="btn btn-primary" onClick={submit} disabled={!body.trim()}>
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
