'use client';
import { useEffect, useState } from 'react';
import { Briefcase } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function VagasCounter() {
  const [info, setInfo] = useState<{ total: number; manual: boolean } | null>(null);

  useEffect(() => {
    supabase.rpc('vagas_contador').then(({ data }) => {
      if (data) setInfo(data as any);
    });
  }, []);

  if (!info) return <div className="h-11" />;

  const texto = info.manual
    ? `+${info.total.toLocaleString('pt-BR')} vagas encontradas hoje`
    : info.total > 0
    ? `${info.total.toLocaleString('pt-BR')} ${info.total === 1 ? 'vaga aberta' : 'vagas abertas'} agora`
    : 'Novas vagas chegando na sua cidade';

  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl bg-brand-800 px-4 py-2.5 text-sm font-bold text-white">
      <Briefcase size={16} className="text-accent" />
      {texto}
    </div>
  );
}
