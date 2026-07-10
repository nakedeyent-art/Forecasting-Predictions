type MetricTileProps = {
  label: string;
  value: string;
  tone?: "green" | "blue" | "amber" | "red";
};

const toneClass = {
  green: "text-[var(--accent)]",
  blue: "text-[var(--accent-2)]",
  amber: "text-[var(--amber)]",
  red: "text-[var(--accent-3)]"
};

export function MetricTile({ label, value, tone = "green" }: MetricTileProps) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-4 shadow-[var(--shadow)]">
      <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${toneClass[tone]}`}>{value}</p>
    </div>
  );
}
