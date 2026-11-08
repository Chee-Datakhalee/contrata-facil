'use client';
import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const hojeSP = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());

// Faixa do topo: "N vagas fechadas hoje em <cidade do usuário>".
// Modo beta (app_settings.prova_social_simulada = 'sim'): número de 1 a 6, sorteado por dia e cidade (não muda a cada recarga).
// Modo real ('nao'): só contratações marcadas hoje na cidade; se não houver nenhuma, a faixa some.
export default function FechadasHoje() {
  const [info, setInfo] = useState<{ n: number; cidade: string } | null>(null);

  useEffect(() => {
    supabase.rpc('fechadas_hoje').then(({ data }) => {
      const d = data as any;
      if (!d?.cidade) return;
      const n = d.simulado ? 1 + (hash(`${hojeSP()}|${d.cidade}`) % 6) : Number(d.total) || 0;
      if (n > 0) setInfo({ n, cidade: String(d.cidade) });
    });
  }, []);

  if (!info) return null;
  const nome = info.cidade.split(' - ')[0];
  return (
    <div className="mb-3 flex items-center justify-center gap-2 rounded-2xl bg-amber-50 px-4 py-2 text-sm font-bold text-amber-900">
      <Flame size={16} className="shrink-0 text-accent-dark" />
      {info.n} {info.n === 1 ? 'vaga fechada' : 'vagas fechadas'} hoje em {nome}
    </div>
  );
}
