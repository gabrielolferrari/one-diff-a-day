import { useEffect, useMemo, useRef, useState } from 'react';
import { VERDICTS } from '../lib/labels';
import { buildPrompt } from '../lib/prompt';
import type { Challenge, ReviewDraft, Verdict } from '../types';
import { CheckIcon, CopyIcon } from './Icons';

interface Props {
  challenge: Challenge;
  draft: ReviewDraft;
  done: boolean;
  onChange: (draft: ReviewDraft) => void;
  onCopied: () => void;
  onClose: () => void;
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
}

export default function FinishModal({ challenge, draft, done, onChange, onCopied, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const prompt = useMemo(() => buildPrompt(challenge, draft), [challenge, draft]);
  const summaryRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    summaryRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
    };
  }, [onClose]);

  useEffect(() => {
    setCopied(false);
  }, [prompt]);

  async function copy() {
    await copyToClipboard(prompt);
    setCopied(true);
    onCopied();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="finish-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-head">
          <h2 id="finish-title">Finalizar revisão</h2>
          <button type="button" className="text-btn" onClick={onClose}>
            Fechar
          </button>
        </header>

        <div className="modal-body">
          {draft.comments.length === 0 && (
            <p className="notice">Você ainda não comentou nenhuma linha. Dá para seguir assim mesmo.</p>
          )}

          <label className="field-label" htmlFor="summary">
            Resumo para o autor
          </label>
          <textarea
            id="summary"
            ref={summaryRef}
            rows={4}
            value={draft.summary}
            placeholder="O que está bom, o que bloqueia o merge e o que é opcional."
            onChange={(e) => onChange({ ...draft, summary: e.target.value })}
          />

          <fieldset className="verdicts">
            <legend className="field-label">Veredito</legend>
            {(Object.keys(VERDICTS) as Verdict[]).map((verdict) => (
              <label key={verdict} className={`verdict verdict-${verdict} ${draft.verdict === verdict ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="verdict"
                  checked={draft.verdict === verdict}
                  onChange={() => onChange({ ...draft, verdict })}
                />
                <span className="verdict-label">{VERDICTS[verdict].label}</span>
                <span className="verdict-hint">{VERDICTS[verdict].hint}</span>
              </label>
            ))}
          </fieldset>
        </div>

        <footer className="modal-foot">
          <p className="modal-foot-text">
            O prompt leva o diff, os seus comentários, as dicas usadas e os problemas plantados. Cole na IA que
            preferir e converse sobre a revisão.
          </p>
          <details className="prompt-details">
            <summary>Ver o prompt (mostra as respostas)</summary>
            <pre className="prompt-preview">{prompt}</pre>
          </details>
          <button type="button" className={`btn btn-primary btn-block btn-large ${copied ? 'is-copied' : ''}`} onClick={copy}>
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? 'Prompt copiado. Agora cole na sua IA.' : done ? 'Copiar prompt de novo' : 'Copiar prompt e concluir'}
          </button>
        </footer>
      </div>
    </div>
  );
}
