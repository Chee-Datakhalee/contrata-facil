'use client';
import Link from 'next/link';
import { MapPin, Users, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRequireRole } from '@/lib/session';
import { useEmpresaData } from '@/lib/empresa';
import BottomNav, { NAV_EMPRESA } from '@/components/BottomNav';
import Loading from '@/components/Loading';

const STATUS: Record<string, string> = {
  ativa: 'bg-emerald-100 text-emerald-800',
  pausada: 'bg-amber-100 text-amber-800',
  encerrada: 'bg-slate-200 text-slate-700',
};

export default function MinhasVagas() {
  const { ready, user } = useRequireRole('empresa');
  const { jobs, apps, loading, recarregar } = useEmpresaData(ready ? user.id : undefined);

  async function mudar(id: string, status: string) {
    await supabase.from('jobs').update({ status }).eq('id', id);
    recarregar();
  }

  if (!ready || loading) return <Loading />;

  return (
    <>
      <main className="safe-bottom px-5 pt-8">
        <h1 className="text-3xl font-extrabold text-brand-900">Minhas vagas</h1>
        <Link href="/empresa/vagas/nova" className="btn-primary mt-5"><Plus size={20} /> Publicar nova vaga</Link>

        <div className="mt-6 space-y-3">
          {jobs.length === 0 && (
            <div className="card p-8 text-center">
              <p className="text-lg font-extrabold text-brand-800">Nenhuma vaga publicada</p>
              <p className="mt-1 text-ink/70">Publique a primeira e comece a receber candidatos.</p>
            </div>
          )}
          {jobs.map((j) => {
            const total = apps.filter((a) => a.job_id === j.id).length;
            return (
              <div key={j.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-extrabold">{j.title}</h2>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${STATUS[j.status]}`}>{j.status}</span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-sm text-brand-700"><MapPin size={14} />{j.city}</p>
                <p className="mt-1 flex items-center gap-1 text-sm text-ink/70"><Users size={14} />{total} {total === 1 ? 'candidato' : 'candidatos'}</p>
                <div className="mt-3 flex gap-4 text-sm font-bold">
                  {j.status === 'ativa' && <button onClick={() => mudar(j.id, 'pausada')} className="text-brand-700 underline">Pausar</button>}
                  {j.status === 'pausada' && <button onClick={() => mudar(j.id, 'ativa')} className="text-brand-700 underline">Reativar</button>}
                  {j.status !== 'encerrada' && <button onClick={() => mudar(j.id, 'encerrada')} className="text-rose-600 underline">Encerrar</button>}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <BottomNav tabs={NAV_EMPRESA} active="/empresa/vagas" />
    </>
  );
}
