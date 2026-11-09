import type { WeekBar } from "@/lib/progress";

/** Points per week as bars. This week is blue; every bar uses the same scale. */
export function WeeklyChart({ bars }: { bars: WeekBar[] }) {
  const W = 640, H = 200, top = 24, bottom = 30, left = 8, right = 8;
  const max = Math.max(3, ...bars.map((b) => b.points));
  const step = (W - left - right) / bars.length;
  const bw = Math.min(30, step * 0.56);
  const y = (v: number) => top + (H - top - bottom) * (1 - v / max);
  const base = y(0);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img"
      aria-label={`Points per week for the last ${bars.length} weeks. This week: ${bars[bars.length - 1].points}.`}>
      <line x1={left} x2={W - right} y1={y(max)} y2={y(max)} className="stroke-line" strokeDasharray="3 4" />
      <text x={W - right} y={y(max) - 6} textAnchor="end" className="fill-muted text-[11px]">{max} pts</text>
      <line x1={left} x2={W - right} y1={base} y2={base} className="stroke-fg" />
      {bars.map((b, i) => {
        const cx = left + step * i + step / 2;
        return (
          <g key={b.key}>
            {b.points > 0
              ? <rect x={cx - bw / 2} y={y(b.points)} width={bw} height={base - y(b.points)} className={b.current ? "fill-accent" : "fill-fg"} />
              : <rect x={cx - bw / 2} y={base - 2} width={bw} height={2} className="fill-line" />}
            {b.points > 0 && <text x={cx} y={y(b.points) - 6} textAnchor="middle" className={`text-[11px] font-semibold ${b.current ? "fill-accent" : "fill-fg"}`}>{b.points}</text>}
            {(bars.length - 1 - i) % 2 === 0 && (
              <text x={cx} y={H - 10} textAnchor="middle" className={`text-[10.5px] ${b.current ? "fill-accent font-semibold" : "fill-muted"}`}>{b.current ? "This week" : b.label}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
