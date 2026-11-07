import { BadgeCheck, Star } from 'lucide-react';
import { compatTexto, type CompatItem } from '@/lib/compat';

export function CompatBadge({ pct, showPct = false }: { pct: number; showPct?: boolean }) {
  const alta = pct >= 80;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${
        alta ? 'bg-emerald-100 text-emerald-800' : pct >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
      }`}
    >
      <Star size={14} fill="currentColor" />
      {compatTexto(pct)}
      {showPct && ` (${pct}%)`}
    </span>
  );
}

export function CompatPill({ pct }: { pct: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800">
      <BadgeCheck size={15} /> {pct}% compatível
    </span>
  );
}

export function CompatBars({ items }: { items: CompatItem[] }) {
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-3 text-sm">
          <span className="w-[46%] shrink-0 leading-tight text-ink">{it.label}</span>
          {it.pct === null ? (
            <span className="text-xs font-semibold text-brand-500">a confirmar na entrevista</span>
          ) : (
            <>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-emerald-600" style={{ width: `${it.pct}%` }} />
              </div>
              <span className="w-10 text-right font-semibold text-ink">{it.pct}%</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
