'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LogoDeitada } from '@/components/Logo';

const CHAVE = 'cf_login_falhas';
function lerBloqueio(): { n: number; ate: number } {
  try { return JSON.parse(localStorage.getItem(CHAVE) || '{"n":0,"ate":0}'); } catch { return { n: 0, ate: 0 }; }
}

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const aviso = sessionStorage.getItem('cf_aviso');
      if (aviso) { setErro(aviso); sessionStorage.removeItem('cf_aviso'); }
    } catch {}
  }, []);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
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
    router.replace(p.role === 'empresa' ? '/empresa' : '/candidato');
  }

  return (
    <main className="min-h-[100dvh] px-6 pt-6">
      <Link href="/" aria-label="Voltar" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow"><ChevronLeft /></Link>
      <div className="mt-6"><LogoDeitada height={56} /></div>
      <h1 className="mt-8 text-3xl font-extrabold text-brand-800">Entrar</h1>
      <p className="mt-1 text-ink/70">Use o e-mail e a senha do seu cadastro.</p>

      <form onSubmit={entrar} className="mt-8 space-y-4">
        <input className="input" type="email" maxLength={254} placeholder="E-mail" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Senha" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        {erro && <p className="text-sm font-semibold text-rose-600" role="alert">{erro}</p>}
        <button className="btn-primary" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
      </form>

      <p className="mt-8 text-center text-sm text-ink/70">
        Ainda não tem conta? <Link href="/escolher" className="font-bold text-brand-700">Criar conta</Link>
      </p>
    </main>
  );
}
