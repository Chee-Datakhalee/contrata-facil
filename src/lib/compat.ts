import { REQUISITOS_PADRAO } from './constants';
import type { Job, Req } from './types';

const catalogo = new Set(REQUISITOS_PADRAO.map((r) => r.label));

export type CompatItem = { label: string; essential: boolean; pct: number | null };

// Compatibilidade v1: média ponderada do nível que o candidato declarou em cada requisito
// da vaga (essencial pesa 2x). Requisitos fora do catálogo ficam "a confirmar" e não entram na nota.
export function calcCompat(reqs: Req[], skills: Record<string, number> | null | undefined) {
  const items: CompatItem[] = (reqs || []).map((r) => ({
    label: r.label,
    essential: !!r.essential,
    pct: catalogo.has(r.label) ? Math.round(skills?.[r.label] ?? 0) : null,
  }));
  let soma = 0;
  let pesos = 0;
  for (const it of items) {
    if (it.pct === null) continue;
    const w = it.essential ? 2 : 1;
    soma += it.pct * w;
    pesos += w;
  }
  return { total: pesos ? Math.round(soma / pesos) : 0, items };
}

export function compatTexto(n: number) {
  if (n >= 80) return 'Alta compatibilidade';
  if (n >= 50) return 'Boa compatibilidade';
  return 'Compatibilidade baixa';
}

export function perfilCompleto(skills: Record<string, number> | null | undefined) {
  return Object.values(skills || {}).some((v) => v > 0);
}

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export function salarioTexto(j: Pick<Job, 'salary_mode' | 'salary_min' | 'salary_max'>) {
  if (j.salary_mode === 'combinar') return 'A combinar';
  if (j.salary_mode === 'fixo' && j.salary_min) return brl(j.salary_min);
  if (j.salary_min && j.salary_max) return `${brl(j.salary_min)} a ${brl(j.salary_max)}`;
  if (j.salary_min) return `A partir de ${brl(j.salary_min)}`;
  return 'A combinar';
}

export function iniciais(nome?: string | null) {
  if (!nome) return '?';
  const p = nome.trim().split(/\s+/);
  return ((p[0]?.[0] || '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}

export function whatsappLink(phone: string | null | undefined, texto: string) {
  const d = (phone || '').replace(/\D/g, '');
  if (!d) return null;
  const num = d.startsWith('55') ? d : `55${d}`;
  return `https://wa.me/${num}?text=${encodeURIComponent(texto)}`;
}
