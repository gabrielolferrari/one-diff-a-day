import { BulbIcon } from './Icons';

interface Props {
  hints: string[];
  used: number;
  onReveal: () => void;
}

export default function HintsPanel({ hints, used, onReveal }: Props) {
  if (hints.length === 0) return null;
  const remaining = hints.length - used;

  return (
    <section className="card hints">
      <div className="hints-head">
        <BulbIcon />
        <h2 className="aside-title">Dicas</h2>
        <span className="hints-meter" aria-label={`${used} de ${hints.length} dicas usadas`}>
          {hints.map((_, i) => (
            <span key={i} className={`hint-pip ${i < used ? 'on' : ''}`} />
          ))}
        </span>
      </div>

      {used === 0 && <p className="aside-note">Travou? Cada dica aponta um pouco mais perto do problema.</p>}

      {used > 0 && (
        <ol className="hints-list">
          {hints.slice(0, used).map((hint, i) => (
            <li key={i} className="hint-item">
              {hint}
            </li>
          ))}
        </ol>
      )}

      {remaining > 0 && (
        <button type="button" className="btn btn-block" onClick={onReveal}>
          Mostrar dica {used + 1} de {hints.length}
        </button>
      )}
    </section>
  );
}
