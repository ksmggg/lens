export function Chips({ label, values, value, onPick }: { label: string; values: string[]; value: string | null; onPick: (v: string | null) => void }) {
  if (values.length === 0) return null;
  return (
    <div className="chips" role="group" aria-label={label}>
      <button type="button" className="chip" aria-pressed={value === null} onClick={() => onPick(null)}>All</button>
      {values.map((v) => (
        <button key={v} type="button" className="chip" aria-pressed={value === v} onClick={() => onPick(value === v ? null : v)}>{v}</button>
      ))}
    </div>
  );
}
