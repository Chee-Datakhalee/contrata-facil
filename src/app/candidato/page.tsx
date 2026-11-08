'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, SlidersHorizontal, MapPin, Briefcase, Gift, Building2, X, Check, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRequireRole } from '@/lib/session';
import { calcCompat, perfilCompleto } from '@/lib/compat';
import { candidatar } from '@/lib/apply';
import type { Candidate, Job } from '@/lib/types';
import { LogoDeitada } from '@/components/Logo';
import Avatar from '@/components/Avatar';
import BottomNav, { NAV_CANDIDATO } from '@/components/BottomNav';
import VagasCounter from '@/components/VagasCounter';
import { CompatBadge } from '@/components/Compat';
import Toast from '@/components/Toast';
import AvatarUpload from '@/components/AvatarUpload';
import FechadasHoje from '@/components/FechadasHoje';
import CapaFundo from '@/components/CapaFundo'; // MUDOU: linha nova
import Loading from '@/components/Loading';

const PASSADAS_KEY = 'cf_vagas_passadas';

export default function Oportunidades() {
  const router = useRouter();
  const { ready, user, profile } = useRequireRole('profissional');
  const [cand, setCand] = useState<Candidate | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [aplicadas, setAplicadas] = useState<Set<string>>(new Set());
  const [passadas, setPassadas] = useState<Set<string>>(new Set());
  const [cidade, setCidade] = useState('');
  const [soAlta, setSoAlta] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);
  const moved = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PASSADAS_KEY);
      if (raw) setPassadas(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  useEffect(() => {
    if (!ready) return;
    setCidade(profile?.city || '');
    (async () => {
      const [c, a, j] = await Promise.all([
        supabase.from('candidates').select('*').eq('user_id', user.id).single(),
        supabase.from('applications').select('job_id').eq('candidate_id', user.id),
        supabase.from('jobs').select('*, companies(id, name, city, about, logo_url, cover_url)').eq('status', 'ativa').order('created_at', { ascending: false }).limit(150),
      ]);
      setCand(c.data as any);
      setAplicadas(new Set((a.data || []).map((x: any) => x.job_id)));
      setJobs((j.data as any) || []);
      setLoading(false);
    })();
  }, [ready, user, profile]);

  const fila = useMemo(() => {
    return jobs
      .filter((j) => j.city === cidade)
      .filter((j) => !aplicadas.has(j.id) && !passadas.has(j.id))
      .map((j) => ({ job: j, compat: calcCompat(j.requirements, cand?.skills) }))
      .filter((x) => (soAlta ? x.compat.total >= 70 : true))
      .sort((a, b) => b.compat.total - a.compat.total);
  }, [jobs, cidade, aplicadas, passadas, cand, soAlta]);

  const atual = fila[0];

  function passar() {
    if (!atual) return;
    const novo = new Set(passadas);
    novo.add(atual.job.id);
    setPassadas(novo);
    try { localStorage.setItem(PASSADAS_KEY, JSON.stringify(Array.from(novo))); } catch {}
  }

  async function quero() {
    if (!atual) return;
    if (!perfilCompleto(cand?.skills)) {
      setToast('Complete seu perfil (habilidades) antes de se candidatar.');
      setTimeout(() => router.push('/candidato/perfil'), 1200);
      return;
    }
    const r = await candidatar(atual.job.id);
    if (!r.ok) { setToast(r.msg || 'Erro'); return; }
    router.push(`/candidato/enviada?restantes=${r.restantes}`);
  }

  function onUp() {
    const d = dx;
    const foiToque = !moved.current;
    start.current = null;
    setDx(0);
    if (d > 110) quero();
    else if (d < -110) passar();
    else if (foiToque && atual) router.push(`/candidato/vaga/${atual.job.id}`);
  }

  if (!ready || loading) return <Loading />;

  const primeiroNome = (profile?.full_name || '').split(' ')[0] || 'por aqui';

  return (
    <>
      <Toast msg={toast} onClose={() => setToast(null)} />
      <main className="safe-bottom px-5 pt-5">
        <FechadasHoje />
        <header className="flex items-center justify-between">
          <LogoDeitada height={44} />
          <div className="flex items-center gap-3">
            <button aria-label="Notificações" className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white shadow">
              <Bell size={22} className="text-brand-700" />
            </button>
            <AvatarUpload tipo="perfil" nome={profile?.full_name} url={foto ?? profile?.avatar_url} size={44} onDone={setFoto} onErro={setToast} />
          </div>
        </header>

        <h1 className="mt-5 text-[1.9rem] font-extrabold leading-tight text-brand-900">Olá, {primeiroNome}!</h1>
        <p className="text-base text-brand-700">Encontre a vaga ideal para o seu perfil.</p>

        <div className="mt-4"><VagasCounter /></div>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white px-4 py-3.5 shadow">
            <MapPin size={20} className="shrink-0 text-brand-700" />
            <span className="min-w-0 flex-1 truncate text-base font-semibold text-brand-900">{cidade || 'Escolha sua cidade'}</span>
            <button onClick={() => router.push('/candidato/perfil')} className="shrink-0 text-sm font-bold text-brand-700 underline">Trocar</button>
          </div>
          <button
            onClick={() => setSoAlta(!soAlta)}
            aria-pressed={soAlta}
            aria-label="Mostrar só vagas com alta compatibilidade"
            className={`flex h-[52px] w-[52px] items-center justify-center rounded-2xl shadow ${soAlta ? 'bg-brand-700 text-white' : 'bg-white text-brand-700'}`}
          >
            <SlidersHorizontal size={22} />
          </button>
        </div>

        {!cidade ? (
          <div className="card mt-8 p-8 text-center">
            <p className="text-xl font-extrabold text-brand-800">Escolha sua cidade</p>
            <p className="mt-2 text-ink/70">Você só vê as vagas da cidade do seu perfil.</p>
            <button className="btn-primary mt-6" onClick={() => router.push('/candidato/perfil')}>Ir para o perfil</button>
          </div>
        ) : atual ? (
          <>
            <div
              className="card mt-5 select-none overflow-hidden"
              style={{ touchAction: 'pan-y', transform: `translateX(${dx}px) rotate(${dx / 28}deg)`, transition: start.current === null ? 'transform .2s' : 'none' }}
              onPointerDown={(e) => { start.current = e.clientX; moved.current = false; e.currentTarget.setPointerCapture?.(e.pointerId); }}
              onPointerMove={(e) => { if (start.current === null) return; const d = e.clientX - start.current; if (Math.abs(d) > 6) moved.current = true; setDx(d); }}
              onPointerUp={onUp}
              onPointerCancel={() => { start.current = null; setDx(0); }}
            >
              <div className="relative h-48 bg-gradient-to-br from-brand-700 to-brand-900">
                <CapaFundo url={atual.job.companies?.cover_url} /> {/* MUDOU: no lugar do bloco antigo da imagem */}
                <div className="absolute left-3 top-3"><CompatBadge pct={atual.compat.total} /></div>
                <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/55 px-3 py-1.5 text-sm font-bold text-white">
                  <MapPin size={14} /> {atual.job.city.split(' - ')[0]}
                </div>
              </div>
              <div className="relative -mt-10 rounded-t-[2rem] bg-white px-5 pb-5 pt-4">
                <div className="flex items-center gap-3">
                  <Avatar nome={atual.job.companies?.name} url={atual.job.companies?.logo_url} size={48} square />
                  <div>
                    <p className="text-lg font-extrabold leading-tight text-brand-900">{atual.job.companies?.name}</p>
                  </div>
                </div>
                <h2 className="mt-3 text-2xl font-extrabold text-ink">{atual.job.title}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {atual.job.requirements.slice(0, 2).map((r) => (
                    <span key={r.label} className="chip"><Briefcase size={14} />{r.label}</span>
                  ))}
                  <span className="chip"><MapPin size={14} />{atual.job.city}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-brand-100 pt-4 text-sm">
                  <div>
                    <p className="flex items-center gap-1.5 font-extrabold text-brand-900"><Gift size={16} className="text-brand-700" /> Benefícios</p>
                    <p className="mt-1 text-ink/70">{atual.job.benefits.length ? atual.job.benefits.slice(0, 3).join(', ') : 'Consulte a empresa'}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 font-extrabold text-brand-900"><Building2 size={16} className="text-brand-700" /> Empresa</p>
                    <p className="mt-1 text-ink/70">{atual.job.companies?.name}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-start justify-center gap-16">
              <button onClick={passar} className="flex flex-col items-center gap-2 text-sm font-semibold text-ink">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg"><X size={36} className="text-rose-600" strokeWidth={3} /></span>
                Não tenho<br />interesse
              </button>
              <button onClick={quero} className="flex flex-col items-center gap-2 text-sm font-semibold text-ink">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40"><Check size={40} className="text-white" strokeWidth={3.5} /></span>
                Quero me<br />candidatar
              </button>
            </div>
          </>
        ) : (
          <div className="card mt-8 p-8 text-center">
            <p className="text-xl font-extrabold text-brand-800">Você viu todas as vagas por enquanto</p>
            <p className="mt-2 text-ink/70">{`Ainda não há mais vagas em ${cidade}. Novas vagas aparecem aqui assim que as empresas da sua cidade publicarem.`}</p>
            {passadas.size > 0 && (
              <button
                className="btn-outline mt-6"
                onClick={() => { setPassadas(new Set()); try { localStorage.removeItem(PASSADAS_KEY); } catch {} }}
              >
                Rever vagas que descartei
              </button>
            )}
          </div>
        )}
      </main>
      <BottomNav tabs={NAV_CANDIDATO} active="/candidato" />
    </>
  );
}
