'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { IMG_CIDADE } from '@/lib/constants';
import { LogoEmPe } from '@/components/Logo';
import VagasCounter from '@/components/VagasCounter';

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: p } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (p) router.replace(p.role === 'empresa' ? '/empresa' : '/candidato');
    })();
  }, [router]);

  return (
    <main className="relative flex min-h-[100dvh] flex-col px-6 pt-8">
      <VagasCounter />
      <div className="flex flex-1 flex-col items-center justify-center pb-24 text-center">
        <LogoEmPe height={210} />
        <p className="mt-4 text-lg font-bold text-ink">Encontre. Contrate. Cresça.</p>
        <p className="mt-5 max-w-[16rem] text-base leading-snug text-brand-700">
          Conectando empresas a profissionais qualificados de forma rápida e simples.
        </p>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={IMG_CIDADE} alt="" aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-0 w-full opacity-60" />

      <div className="relative z-10 mb-10 space-y-3">
        <Link href="/escolher" className="btn-primary">Começar</Link>
        <Link href="/login" className="block py-2 text-center text-base font-bold text-brand-800">Entrar</Link>
      </div>
    </main>
  );
}
