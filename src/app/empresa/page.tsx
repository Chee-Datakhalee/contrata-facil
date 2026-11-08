'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Briefcase, Users, CheckCircle2, CalendarCheck, ChevronDown, Plus } from 'lucide-react';
import { useRequireRole } from '@/lib/session';
import { useEmpresaData, mudarStatus } from '@/lib/empresa';
import { calcCompat } from '@/lib/compat';
import { LogoDeitada } from '@/components/Logo';
import Avatar from '@/components/Avatar';
import CandidatoCard from '@/components/CandidatoCard';
import BottomNav, { NAV_EMPRESA } from '@/components/BottomNav';
import Loading from '@/components/Loading';
import VerificacaoCnpj from '@/components/VerificacaoCnpj';
import AvatarUpload from '@/components/AvatarUpload';
import FechadasHoje from '@/components/FechadasHoje';
import Toast from '@/components/Toast';

export default function EmpresaHome() {
  const router = useRouter();
  const { ready, user } = useRequireRole('empresa');
  const { company, jobs, apps, loading, setApps, recarregar } = useEmpresaData(ready ? user.id : undefined);
  const [jobId, setJobId] = useState('todas');
  const [ordem, setOrdem] = useState<'relevantes' | 'recentes'>('relevantes');
  const [toast, setToast] = useState<string | null>(null);

  const ativas = jobs.filter((j) => j.status === 'ativa');
  const jobMap = useMemo(() => new Map(jobs.map((j) => [j.id, j])), [jobs]);

  const lista = useMemo(() => {
    const filtrada = apps.filter((a) => a.status !== 'descartado' && (jobId === 'todas' || a.job_id === jobId));
    const comNota = filtrada.map((a) => ({ a, nota: calcCompat(jobMap.get(a.job_id)?.requirements || [], a.candidates?.skills).total }));
    if (ordem === 'relevantes') comNota.sort((x, y) => y.nota - x.nota);
    return comNota.map((x) => x.a);
  }, [apps, jobId, ordem, jobMap]);

  async function atualizar(id: string, status: string) {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status: status as any } : a)));
    await mudarStatus(id, status);
  }

  if (!ready || loading) return <Loading />;

  const novas = apps.filter((a) => a.status === 'novo').length;
  const stats = [
    { icon: Briefcase, n: ativas.length, l: 'Vagas ativas' },
    { icon: Users, n: apps.length, l: 'Candidatos' },
    { icon: CheckCircle2, n: apps.filter((a) => a.status === 'em_analise').length, l: 'Em análise' },
    { icon: CalendarCheck, n: apps.filter((a) => a.status === 'contratado').length, l: 'Contratações' },
  ];

  return (
    <>
      <Toast msg={toast} onClose={() => setToast(null)} />
      <main className="safe-bottom px-5 pt-5">
        <FechadasHoje />
        <header className="flex items-center justify-between">
          <LogoDeitada height={48} />
          <div className="flex items-center gap-3">
            <button aria-label="Notificações" className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white shadow">
              <Bell size={22} className="text-brand-700" />
              {novas > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">{novas}</span>}
            </button>
            <AvatarUpload tipo="empresa" nome={company?.name} url={company?.logo_url} size={44} dark onDone={() => recarregar()} onErro={setToast} />
          </div>
        </header>

        <VerificacaoCnpj company={company} onVerificado={recarregar} />

        <section className="mt-5 flex items-center gap-4 rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-5 text-white shadow-lg">
          <Briefcase size={54} className="shrink-0" strokeWidth={1.5} />
          <div className="flex-1">
            <p className="text-xl font-extrabold leading-tight">Encontre o profissional <span className="text-accent">certo</span> para sua empresa!</p>
            <p className="mt-1 text-sm text-white/80">Rápido. Simples. Sem burocracia.</p>
          </div>
        </section>
        <Link href="/empresa/vagas/nova" className="btn-primary mt-3"><Plus size={20} /> Publicar uma vaga</Link>

        <section className="mt-4 grid grid-cols-4 gap-2">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.l} className="card flex flex-col items-center px-1 py-3 text-center">
                <Icon size={26} className="text-brand-700" />
                <span className="mt-1 text-2xl font-extrabold text-ink">{s.n}</span>
                <span className="text-[11px] font-semibold leading-tight text-ink/70">{s.l}</span>
              </div>
            );
          })}
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-extrabold leading-tight text-ink">Candidatos compatíveis com sua vaga</h2>
          </div>
          <div className="mt-3 flex gap-2">
            <label className="relative flex-1">
              <select value={jobId} onChange={(e) => setJobId(e.target.value)} aria-label="Filtrar por vaga" className="w-full appearance-none rounded-full border border-brand-200 bg-white py-2.5 pl-4 pr-9 text-sm font-semibold text-brand-900">
                <option value="todas">Todas as vagas</option>
                {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-3.5 text-brand-700" />
            </label>
            <label className="relative">
              <select value={ordem} onChange={(e) => setOrdem(e.target.value as any)} aria-label="Ordenar" className="appearance-none rounded-full border border-brand-200 bg-white py-2.5 pl-4 pr-9 text-sm font-semibold text-brand-900">
                <option value="relevantes">Mais relevantes</option>
                <option value="recentes">Mais recentes</option>
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-3.5 text-brand-700" />
            </label>
          </div>

          <div className="mt-4 space-y-4">
            {jobs.length === 0 && (
              <div className="card p-8 text-center">
                <p className="text-lg font-extrabold text-brand-800">Publique sua primeira vaga</p>
                <p className="mt-1 text-ink/70">Em 2 minutos sua vaga já aparece para profissionais da sua cidade.</p>
              </div>
            )}
            {jobs.length > 0 && lista.length === 0 && (
              <div className="card p-8 text-center">
                <p className="text-lg font-extrabold text-brand-800">Ainda não chegaram candidatos</p>
                <p className="mt-1 text-ink/70">Assim que alguém se candidatar, o perfil aparece aqui com a compatibilidade.</p>
              </div>
            )}
            {lista.map((a) => (
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
        </section>
      </main>
      <BottomNav tabs={NAV_EMPRESA} active="/empresa" />
    </>
  );
}
