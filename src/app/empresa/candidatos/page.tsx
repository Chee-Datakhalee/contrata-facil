'use client';
import { useMemo } from 'react';
import { useRequireRole } from '@/lib/session';
import { useEmpresaData, mudarStatus } from '@/lib/empresa';
import { calcCompat } from '@/lib/compat';
import CandidatoCard from '@/components/CandidatoCard';
import BottomNav, { NAV_EMPRESA } from '@/components/BottomNav';
import Loading from '@/components/Loading';

export default function Candidatos() {
  const { ready, user } = useRequireRole('empresa');
  const { jobs, apps, loading, setApps } = useEmpresaData(ready ? user.id : undefined);
  const jobMap = useMemo(() => new Map(jobs.map((j) => [j.id, j])), [jobs]);

  const ordenados = useMemo(
    () =>
      apps
        .map((a) => ({ a, nota: calcCompat(jobMap.get(a.job_id)?.requirements || [], a.candidates?.skills).total }))
        .sort((x, y) => y.nota - x.nota)
        .map((x) => x.a),
    [apps, jobMap]
  );

  async function atualizar(id: string, status: string) {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status: status as any } : a)));
    await mudarStatus(id, status);
  }

  if (!ready || loading) return <Loading />;

  const ativos = ordenados.filter((a) => a.status !== 'descartado');
  const descartados = ordenados.filter((a) => a.status === 'descartado');

  return (
    <>
      <main className="safe-bottom px-5 pt-8">
        <h1 className="text-3xl font-extrabold text-brand-900">Candidatos</h1>
        <p className="text-brand-700">{ativos.length} {ativos.length === 1 ? 'candidato' : 'candidatos'} em todas as suas vagas.</p>

        <div className="mt-5 space-y-4">
          {ativos.length === 0 && (
            <div className="card p-8 text-center">
              <p className="text-lg font-extrabold text-brand-800">Nenhum candidato ainda</p>
              <p className="mt-1 text-ink/70">Quando alguém se candidatar, aparece aqui.</p>
            </div>
          )}
          {ativos.map((a) => (
            <CandidatoCard
              key={a.id}
              app={a}
              job={jobMap.get(a.job_id)!}
              onDescartar={() => atualizar(a.id, 'descartado')}
              onContato={() => atualizar(a.id, 'contatado')}
              onAnalise={() => atualizar(a.id, a.status === 'em_analise' ? 'novo' : 'em_analise')}
              onContratado={() => atualizar(a.id, 'contratado')}
            />
          ))}
        </div>

        {descartados.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-extrabold text-ink/70">Descartados ({descartados.length})</h2>
            <ul className="mt-2 space-y-2">
              {descartados.map((a) => (
                <li key={a.id} className="card flex items-center justify-between p-3 text-sm">
                  <span className="font-semibold">{a.candidates?.profiles?.full_name}</span>
                  <button onClick={() => atualizar(a.id, 'novo')} className="font-bold text-brand-700 underline">Restaurar</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
      <BottomNav tabs={NAV_EMPRESA} active="/empresa/candidatos" />
    </>
  );
}
