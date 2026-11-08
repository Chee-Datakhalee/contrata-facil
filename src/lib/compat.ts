import type { Job, Req } from './types';

export type CompatItem = { label: string; essential: boolean; pct: number | null }; 

// ---------------------------------------------------------------------------
// Compatibilidade v2: comparação de TEXTO LIVRE.
// O profissional digita as habilidades dele ("vendas", "atendimento ao cliente", "CNH B")
// e a empresa digita os requisitos da vaga. Para cada requisito, procuramos a habilidade
// que mais se parece (ignorando acento, maiúscula e palavras genéricas como "experiência em").
// ---------------------------------------------------------------------------
const GENERICAS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'em', 'e', 'a', 'o', 'as', 'os', 'com', 'para', 'por', 'na', 'no', 'nas', 'nos',
  'ao', 'aos', 'um', 'uma', 'ou', 'que', 'ter', 'tem',
  'experiencia', 'conhecimento', 'conhecimentos', 'habilidade', 'habilidades', 'nivel', 'boa', 'bom', 'basico', 'basica',
  'avancado', 'avancada', 'categoria', 'minimo', 'desejavel', 'obrigatorio',
]);

const normalizar = (t: string) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Radical: tira os finais mais comuns do português para aproximar palavras da mesma família.
// "vendas", "vendedor" e "vender" viram "vend"; "atendimento" e "atender" viram "atend";
// "comunicação", "comunicativo" e "comunicar" viram "comunic".
const SUFIXOS = [
  'imentos', 'amentos', 'mentos', 'imento', 'amento', 'mento',
  'adores', 'edores', 'idores', 'adoras', 'edoras', 'idoras', 'ador', 'edor', 'idor', 'adora', 'edora', 'idora',
  'acoes', 'icoes', 'ucoes', 'coes', 'acao', 'icao', 'ucao', 'cao',
  'ativos', 'ativas', 'ativo', 'ativa', 'ivos', 'ivas', 'ivo', 'iva',
  'istas', 'ista', 'ntes', 'nte', 'orias', 'oria',
  'ando', 'endo', 'indo', 'ados', 'adas', 'ado', 'ada', 'idos', 'idas', 'ido', 'ida',
  'ar', 'er', 'ir', 'as', 'es', 'os', 'a', 'o', 'e', 's',
].sort((a, b) => b.length - a.length);

function radical(t: string): string {
  for (const suf of SUFIXOS) {
    if (t.length - suf.length >= 3 && t.endsWith(suf)) return t.slice(0, -suf.length);
  }
  return t;
}

function radicais(texto: string): string[] {
  const out = new Set<string>();
  for (const t of normalizar(texto).split(' ')) {
    if (t.length < 2 || GENERICAS.has(t)) continue;
    out.add(radical(t));
  }
  return Array.from(out);
}

// dois radicais são "a mesma palavra" se forem iguais, se um começar pelo outro (e tiver tamanho parecido),
// ou, nas palavras longas, se começarem igual na maior parte ("disponivel" ~ "disponibilidad")
function mesmoRadical(a: string, b: string): boolean {
  if (a === b) return true;
  const [curto, longo] = a.length <= b.length ? [a, b] : [b, a];
  if (curto.length < 4) return false;
  if (longo.startsWith(curto) && curto.length / longo.length >= 0.6) return true;
  if (curto.length >= 8) {
    let i = 0;
    while (i < curto.length && a[i] === b[i]) i++;
    return i >= 6 && i >= Math.ceil(curto.length * 0.6);
  }
  return false;
}

// 0 a 1: que parte das palavras-chave do requisito aparece na habilidade
function parecido(requisito: string, habilidade: string): number | null {
  const r = radicais(requisito);
  if (!r.length) return null; // requisito só com palavras genéricas: não dá para comparar
  const h = radicais(habilidade);
  const acertos = r.filter((x) => h.some((y) => mesmoRadical(x, y))).length;
  return acertos / r.length;
}

// Compatibilidade: média ponderada (requisito essencial pesa 2x) do melhor casamento de cada requisito
// com as habilidades declaradas. Habilidades antigas guardadas com nível (ex.: 80) continuam valendo proporcionalmente.
export function calcCompat(reqs: Req[], skills: Record<string, number> | null | undefined) {
  const lista = Object.entries(skills || {}).filter(([, nivel]) => Number(nivel) > 0);
  const items: CompatItem[] = (reqs || []).map((r) => {
    let melhor: number | null = null;
    for (const [hab, nivel] of lista) {
      const s = parecido(r.label, hab);
      if (s === null) { melhor = null; break; }
      const v = s * Math.min(Number(nivel), 100) / 100;
      if (melhor === null || v > melhor) melhor = v;
    }
    const comparavel = radicais(r.label).length > 0;
    return {
      label: r.label,
      essential: !!r.essential,
      pct: !comparavel ? null : Math.round((melhor ?? 0) * 100),
    };
  });
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
  const todas = nome.trim().split(/\s+/);
  const letras = todas.filter((x) => /^[A-Za-zÀ-ÿ]/.test(x));
  const p = letras.length ? letras : todas;
  return ((p[0]?.[0] || '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}

export function whatsappLink(phone: string | null | undefined, texto: string) {
  const d = (phone || '').replace(/\D/g, '');
  if (!d) return null;
  const num = d.startsWith('55') ? d : `55${d}`;
  return `https://wa.me/${num}?text=${encodeURIComponent(texto)}`;
}
