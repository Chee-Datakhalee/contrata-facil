'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ShieldCheck, ChevronLeft, Bookmark, Briefcase, Car, Gift, Building2, Target, Send, ChevronRight, Wallet, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRequireRole } from '@/lib/session';
import { calcCompat, perfilCompleto, salarioTexto } from '@/lib/compat';
import { candidatar } from '@/lib/apply';
import type { Candidate, Job } from '@/lib/types';
import Avatar from '@/components/Avatar';
import CapaFundo from '@/components/CapaFundo'; // MUDOU: linha nova
import { CompatBadge, CompatPill } from '@/components/Compat';
import Toast from '@/components/Toast';
import Loading from '@/components/Loading';

export default function DetalheVaga() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { ready, user } = useRequireRole('profissional');
  const [job, setJob] = useState<Job | null>(null);
  const [outras, setOutras] = useState<Job[]>([]);
  const [cand, setCand] = useState<Candidate | null>(null);
  const [salva, setSalva] = useState(false);
  const [jaCandidatou, setJaCandidatou] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const [j, c, s, a, o] = await Promise.all([
        supabase.from('jobs').select('*, companies(id, name, city, about, logo_url, cover_url, cnpj_verificado)').eq('id', id).single(),
        supabase.from('candidates').select('*').eq('user_id', user.id).single(),
        supabase.from('saved_jobs').select('job_id').eq('candidate_id', user.id).eq('job_id', id),
        supabase.from('applications').select('id').eq('candidate_id', user.id).eq('job_id', id),
        supabase.from('jobs').select('*, companies(id, name, city, about, logo_url, cover_url)').eq('status', 'ativa').neq('id', id).limit(30),
      ]);
      setJob(j.data as any);
      setCand(c.data as any);
      setSalva((s.data || []).length > 0);
      setJaCandidatou((a.data || []).length > 0);
      const mesmaCidade = ((o.data as any[]) || []).filter((x) => x.city === (j.data as any)?.city);
      setOutras(mesmaCidade.slice(0, 3));
      setLoading(false);
    })();
  }, [ready, user, id]);

  const compat = useMemo(() => (job ? calcCompat(job.requirements, cand?.skills) : null), [job, cand]);

  async function alternarSalva() {
    if (salva) await supabase.from('saved_jobs').delete().eq('candidate_id', user.id).eq('job_id', id);
    else await supabase.from('saved_jobs').insert({ candidate_id: user.id, job_id: id });
    setSalva(!salva);
  }

  async function candidatarAgora() {
    if (!perfilCompleto(cand?.skills)) {
      setToast('Complete seu perfil (habilidades) antes de se candidatar.');
      setTimeout(() => router.push('/candidato/perfil'), 1200);
      return;
    }
    setEnviando(true);
    const r = await candidatar(id);
    setEnviando(false);
    if (!r.ok) { setToast(r.msg || 'Erro'); return; }
    router.push(`/candidato/enviada?restantes=${r.restantes}`);
  }

  if (!ready || loading) return <Loading />;
  if (!job) return <main className="p-8 text-center">Vaga não encontrada. <Link href="/candidato" className="font-bold text-brand-700">Voltar</Link></main>;

  const temCnh = job.requirements.some((r) => r.label.toLowerCase().includes('cnh'));

  return (
    <>
      <Toast msg={toast} onClose={() => setToast(null)} />
      <main className="pb-10">
        <div className="relative h-52 bg-gradient-to-br from-brand-700 to-brand-900">
          <CapaFundo url={job.companies?.cover_url} /> {/* MUDOU: no lugar do bloco antigo da imagem */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/40 to-transparent px-4 pb-6 pt-4">
            <button onClick={() => router.back()} aria-label="Voltar" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90"><ChevronLeft /></button>
            <p className="text-lg font-extrabold text-white">Detalhes da Vaga</p>
            <button onClick={alternarSalva} aria-label={salva ? 'Remover dos favoritos' : 'Salvar vaga'} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90">
              <Bookmark className="text-brand-800" fill={salva ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        <div className="relative -mt-12 rounded-t-[2rem] bg-white px-5 pb-2 pt-0">
          <div className="-mt-10 inline-block rounded-2xl bg-white p-2 shadow-lg">
            <Avatar nome={job.companies?.name} url={job.companies?.logo_url} size={64} square />
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-brand-700">{job.companies?.name}{job.companies?.cnpj_verificado && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800"><ShieldCheck size={13} /> Empresa verificada</span>}</p>
          <h1 className="text-[1.8rem] font-extrabold leading-tight text-ink">{job.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 font-semibold text-brand-700"><MapPin size={18} />{job.city}</span>
            {compat && <CompatBadge pct={compat.total} />}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-y border-brand-100 py-4">
            <div className="flex items-center gap-3">
              <Briefcase className="text-brand-700" size={30} fill="currentColor" strokeWidth={1.5} />
              <div><p className="text-lg font-extrabold">Experiência</p><p className="text-ink/70">{job.experience || 'Não exigida'}</p></div>
            </div>
            <div className="flex items-center gap-3 border-l border-brand-100 pl-3">
              {temCnh ? <Car className="text-brand-700" size={30} /> : <Wallet className="text-brand-700" size={30} />}
              <div>
                <p className="text-lg font-extrabold">{temCnh ? 'CNH' : 'Salário'}</p>
                <p className="text-ink/70">{temCnh ? 'Categoria B' : salarioTexto(job)}</p>
              </div>
            </div>
          </div>

          {temCnh && (
            <p className="mt-4 flex items-center gap-2 font-semibold"><Wallet size={20} className="text-brand-700" /> Salário: <span className="font-extrabold text-brand-900">{salarioTexto(job)}</span></p>
          )}

          <h2 className="mt-5 flex items-center gap-2 text-lg font-extrabold"><Gift className="text-brand-700" /> Benefícios</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {job.benefits.length ? job.benefits.map((b) => <span key={b} className="chip">{b}</span>) : <span className="text-ink/60">Não informados</span>}
          </div>

          {job.requirements.length > 0 && (
            <>
              <h2 className="mt-5 text-lg font-extrabold">Requisitos</h2>
              <ul className="mt-2 space-y-1 text-ink/80">
                {job.requirements.map((r) => <li key={r.label}>• {r.label}{r.essential ? ' (essencial)' : ''}</li>)}
              </ul>
            </>
          )}

          <h2 className="mt-5 flex items-center gap-2 text-lg font-extrabold"><Building2 className="text-brand-700" /> Sobre a empresa</h2>
          <p className="mt-1 leading-relaxed text-ink/75">{job.description || job.companies?.about || 'A empresa ainda não adicionou uma descrição.'}</p>

          {compat && (
            <div className="mt-5 flex items-center gap-4 rounded-2xl bg-emerald-50 p-4">
              <Target size={40} className="shrink-0 text-brand-700" />
              <div>
                <p className="text-xl font-extrabold text-brand-900">{compat.total}% de compatibilidade</p>
                <p className="text-sm text-ink/70">Com base no seu perfil profissional</p>
              </div>
            </div>
          )}

          <button onClick={candidatarAgora} disabled={enviando || jaCandidatou} className="btn-primary mt-5">
            <Send size={20} /> {jaCandidatou ? 'Candidatura enviada' : enviando ? 'Enviando...' : 'Me candidatar agora'}
          </button>

          {outras.length > 0 && (
            <>
              <div className="mt-7 flex items-center justify-between">
                <h2 className="text-xl font-extrabold">Outras vagas para você</h2>
                <Link href="/candidato" className="flex items-center text-sm font-semibold text-brand-700">Ver todas <ChevronRight size={16} /></Link>
              </div>
              <div className="mt-3 space-y-3">
                {outras.map((o) => {
                  const c = calcCompat(o.requirements, cand?.skills);
                  return (
                    <Link key={o.id} href={`/candidato/vaga/${o.id}`} className="card flex items-center gap-3 p-3">
                      <Avatar nome={o.companies?.name} url={o.companies?.logo_url} size={56} square />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-extrabold">{o.title}</p>
                        <p className="flex items-center gap-1 text-sm text-brand-700"><MapPin size={13} />{o.city}</p>
                      </div>
                      <CompatPill pct={c.total} />
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
