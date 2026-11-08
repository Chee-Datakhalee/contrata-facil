'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';

export type Role = 'empresa' | 'profissional';

export function useRequireRole(role: Role) {
  const router = useRouter();
  const [state, setState] = useState<{ ready: boolean; user: any; profile: any }>({ ready: false, user: null, profile: null });

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }
      const { data: profile } = await supabase.from('profiles').select('id, role, full_name, phone, city, avatar_url').eq('id', session.user.id).maybeSingle();
      if (!alive) return;
      if (!profile) {
        await supabase.auth.signOut();
        try { sessionStorage.setItem('cf_aviso', 'Esta conta não tem perfil no Contrata Fácil. Crie uma conta nova em "Criar conta" (use outro e-mail se este já foi usado antes).'); } catch {}
        router.replace('/login');
        return;
      }
      if (profile.role !== role) { router.replace(profile.role === 'empresa' ? '/empresa' : '/candidato'); return; }
      setState({ ready: true, user: session.user, profile });
    })();
    return () => { alive = false; };
  }, [role, router]);

  return state;
}

export async function sair(router: ReturnType<typeof useRouter>) {
  await supabase.auth.signOut();
  router.replace('/');
}
