export default function Range({ label, value, min, max, step = 1, onChange, disabled }: { disabled?: boolean; label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-sm">
      <span className="flex justify-between"><span>{label}</span><span className="text-muted">{value}</span></span>
      <input type="range" disabled={disabled} min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full disabled:opacity-40 accent-[rgb(var(--accent))]" />
    </label>
  );
}
