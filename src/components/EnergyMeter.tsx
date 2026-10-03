const BARS = 4;

export default function EnergyMeter({ level, label }: { level: number; label: string }) {
  return (
    <span className="energy" role="img" aria-label={`Esforço ${level} de ${BARS}: ${label}`}>
      {Array.from({ length: BARS }, (_, i) => (
        <span key={i} className={`energy-bar ${i < level ? 'on' : ''}`} />
      ))}
    </span>
  );
}
