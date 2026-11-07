'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRequireRole } from '@/lib/session';
import type { Application } from '@/lib/types';
import Avatar from '@/components/Avatar';
import BottomNav, { NAV_CANDIDATO } from '@/components/BottomNav';
import Loading from '@/components/Loading';

const STATUS: Record<string, { txt: string; cls: string }> = {
  novo: { txt: 'Enviada', cls: 'bg-brand-100 text-brand-800' },
  em_analise: { txt: 'Em análise', cls: 'bg-amber-100 text-amber-800' },
  contatado: { txt: 'Empresa entrou em contato', cls: 'bg-emerald-100 text-emerald-800' },
  contratado: { txt: 'Contratado(a)', cls: 'bg-emerald-200 text-emerald-900' },
  descartado: { txt: 'Não seguiu', cls: 'bg-slate-200 text-slate-700' },
};

export default function Candidaturas() {
  const { ready, user } = useRequireRole('profissional');
  const [lista, setLista] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    supabase
      .from('applications')
      .select('*, jobs(*, companies(id, name, city, about, logo_url, cover_url))')
      .eq('candidate_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setLista((data as any) || []); setLoading(false); });
  }, [ready, user]);

  if (!ready || loading) return <Loading />;

  return (
    <>
      <main className="safe-bottom px-5 pt-8">
        <h1 className="text-3xl font-extrabold text-brand-900">Minhas vagas</h1>
        <p className="text-brand-700">Vagas em que você se candidatou.</p>
        <div className="mt-6 space-y-3">
          {lista.length === 0 && (
            <div className="card p-8 text-center">
              <p className="text-lg font-extrabold text-brand-800">Nenhuma candidatura ainda</p>
              <p className="mt-1 text-ink/70">Deslize para a direita nas vagas que combinam com você.</p>
              <Link href="/candidato" className="btn-primary mt-5">Ver oportunidades</Link>
            </div>
          )}
          {lista.map((a) => (
            <Link key={a.id} href={`/candidato/vaga/${a.job_id}`} className="card flex items-center gap-3 p-4">
              <Avatar nome={a.jobs?.companies?.name} url={a.jobs?.companies?.logo_url} size={56} square />
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold">{a.jobs?.title}</p>
                <p className="truncate text-sm text-ink/70">{a.jobs?.companies?.name}</p>
                <p className="flex items-center gap-1 text-sm text-brand-700"><MapPin size={13} />{a.jobs?.city}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS[a.status]?.cls}`}>{STATUS[a.status]?.txt}</span>
            </Link>
          ))}
        </div>
      </main>
      <BottomNav tabs={NAV_CANDIDATO} active="/candidato/candidaturas" />
    </>
  );
}
