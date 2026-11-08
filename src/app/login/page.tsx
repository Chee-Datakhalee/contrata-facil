'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Briefcase, User, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LogoDeitada } from '@/components/Logo';

const CHAVE = 'cf_login_falhas';
function lerBloqueio(): { n: number; ate: number } {
  try { return JSON.parse(localStorage.getItem(CHAVE) || '{"n":0,"ate":0}'); } catch { return { n: 0, ate: 0 }; }
}

type Tipo = 'empresa' | 'profissional';
const NOME: Record<Tipo, string> = { empresa: 'Empresa', profissional: 'Profissional' };

function Conteudo() {
  const router = useRouter();
  const params = useSearchParams();
  const t = params.get('tipo');
  const tipo: Tipo | null = t === 'empresa' || t === 'profissional' ? t : null;

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [outroTipo, setOutroTipo] = useState<Tipo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const aviso = sessionStorage.getItem('cf_aviso');
      if (aviso) { setErro(aviso); sessionStorage.removeItem('cf_aviso'); }
    } catch {}
  }, []);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!tipo) return;
    setErro('');
    setOutroTipo(null);
    const b = lerBloqueio();
    if (b.ate > Date.now()) {
      setErro(`Muitas tentativas. Aguarde ${Math.ceil((b.ate - Date.now()) / 1000)} segundos e tente de novo.`);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    if (error || !data.user) {
      const n = lerBloqueio().n + 1;
      // a partir da 5ª falha: espera 30s, 60s, 120s... (máx. 15 min)
      const espera = n >= 5 ? Math.min(30000 * 2 ** (n - 5), 900000) : 0;
      try { localStorage.setItem(CHAVE, JSON.stringify({ n, ate: Date.now() + espera })); } catch {}
      setLoading(false);
      setErro(error?.message?.includes('Email not confirmed') ? 'Confirme seu e-mail antes de entrar.' : 'E-mail ou senha incorretos.');
      return;
    }
    try { localStorage.removeItem(CHAVE); } catch {}
    const { data: p } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
    if (!p) {
      await supabase.auth.signOut();
      setLoading(false);
      setErro('Esta conta não tem perfil no Contrata Fácil. Crie uma conta nova em "Criar conta" (use outro e-mail se este já foi usado antes).');
      return;
    }
    // a conta precisa ser do tipo escolhido na tela
    if (p.role !== tipo) {
      await supabase.auth.signOut();
      setLoading(false);
      setOutroTipo(p.role as Tipo);
      setErro(p.role === 'empresa'
        ? 'Este e-mail é de uma conta de EMPRESA, não de profissional.'
        : 'Este e-mail é de uma conta de PROFISSIONAL, não de empresa.');
      return;
    }
    router.replace(p.role === 'empresa' ? '/empresa' : '/candidato');
  }

  // Passo 1: quem está entrando?
  if (!tipo) {
    return (
      <main className="min-h-[100dvh] px-6 pt-6">
        <Link href="/" aria-label="Voltar" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow"><ChevronLeft /></Link>
        <div className="mt-6"><LogoDeitada height={56} /></div>
        <h1 className="mt-8 text-3xl font-extrabold text-brand-800">Entrar como</h1>
        <p className="mt-1 text-ink/70">Escolha o tipo da sua conta.</p>

        <div className="mt-8 space-y-4">
          <Link href="/login?tipo=empresa" className="card flex items-center gap-4 p-5">
            <Briefcase size={40} className="shrink-0 text-brand-700" fill="currentColor" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="text-lg font-extrabold text-brand-800">Sou Empresa</p>
              <p className="text-sm leading-snug text-ink/70">Publicar vagas e ver candidatos.</p>
            </div>
            <ChevronRight className="text-brand-700" />
          </Link>
          <Link href="/login?tipo=profissional" className="card flex items-center gap-4 p-5">
            <User size={40} className="shrink-0 text-brand-700" fill="currentColor" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="text-lg font-extrabold text-brand-800">Sou Profissional</p>
              <p className="text-sm leading-snug text-ink/70">Procurar vagas na minha cidade.</p>
            </div>
            <ChevronRight className="text-brand-700" />
          </Link>
        </div>

        <p className="mt-10 text-center text-sm text-ink/70">
          Ainda não tem conta? <Link href="/escolher" className="font-bold text-brand-700">Criar conta</Link>
        </p>
      </main>
    );
  }

  // Passo 2: e-mail e senha, já sabendo o tipo
  return (
    <main className="min-h-[100dvh] px-6 pt-6">
      <Link href="/login" aria-label="Trocar tipo de conta" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow"><ChevronLeft /></Link>
      <div className="mt-6"><LogoDeitada height={56} /></div>
      <h1 className="mt-8 text-3xl font-extrabold text-brand-800">Entrar</h1>
      <p className="mt-2 flex items-center gap-2 text-ink/70">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-sm font-bold text-brand-800">
          {tipo === 'empresa' ? <Briefcase size={14} /> : <User size={14} />} {NOME[tipo]}
        </span>
        <Link href="/login" className="text-sm font-bold text-brand-700 underline">Trocar</Link>
      </p>

      <form onSubmit={entrar} className="mt-6 space-y-4">
        <input className="input" type="email" maxLength={254} placeholder="E-mail" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Senha" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        {erro && <p className="text-sm font-semibold text-rose-600" role="alert">{erro}</p>}
        {outroTipo && (
          <Link href={`/login?tipo=${outroTipo}`} className="btn-outline">Entrar como {NOME[outroTipo]}</Link>
        )}
        <button className="btn-primary" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
      </form>

      <p className="mt-8 text-center text-sm text-ink/70">
        Ainda não tem conta? <Link href={`/cadastro?tipo=${tipo}`} className="font-bold text-brand-700">Criar conta</Link>
      </p>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense fallback={null}>
      <Conteudo />
    </Suspense>
  );
}
