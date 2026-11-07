'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Bell, Check } from 'lucide-react';
import { IMG_CIDADE } from '@/lib/constants';

const CORES = ['#6B3FE0', '#F7A12B', '#10B981', '#3B82F6', '#F43F5E'];

function Conteudo() {
  const params = useSearchParams();
  const restantes = Number(params.get('restantes') ?? 0);
  const [pecas, setPecas] = useState<{ left: number; top: number; cor: string; delay: number; rot: number }[]>([]);

  useEffect(() => {
    setPecas(Array.from({ length: 22 }, (_, i) => ({
      left: 6 + Math.random() * 88,
      top: Math.random() * 40,
      cor: CORES[i % CORES.length],
      delay: Math.random() * 0.5,
      rot: Math.random() * 360,
    })));
  }, []);

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center overflow-hidden px-6 pt-24 text-center">
      <div className="pointer-events-none absolute inset-x-0 top-10 h-48" aria-hidden>
        {pecas.map((p, i) => (
          <span key={i} className="confete" style={{ left: `${p.left}%`, top: `${p.top}%`, background: p.cor, animationDelay: `${p.delay}s`, transform: `rotate(${p.rot}deg)` }} />
        ))}
      </div>

      <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-emerald-500 shadow-xl shadow-emerald-500/40">
        <Check size={72} className="text-white" strokeWidth={4} />
      </div>
      <h1 className="mt-8 text-[2.3rem] font-extrabold leading-tight text-brand-900">Candidatura<br />enviada!</h1>
      <p className="mt-3 text-lg text-brand-700">Agora é só aguardar<br />o contato da empresa.</p>

      <div className="mt-8 flex w-full items-center gap-3 rounded-2xl bg-brand-100/80 p-4 text-left">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white"><Bell className="text-amber-500" fill="currentColor" size={22} /></span>
        <p className="font-semibold text-ink/80">
          {restantes > 0
            ? `Você pode se candidatar a mais ${restantes} ${restantes === 1 ? 'vaga' : 'vagas'} hoje.`
            : 'Você usou suas 2 candidaturas de hoje. Amanhã tem mais.'}
        </p>
      </div>

      <div className="relative z-10 mt-8 w-full space-y-3">
        <Link href="/candidato" className="btn-primary">Ver outras oportunidades</Link>
        <Link href="/candidato/candidaturas" className="block py-2 font-bold text-brand-800">Ver minhas candidaturas</Link>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={IMG_CIDADE} alt="" aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 w-full opacity-60" />
    </main>
  );
}

export default function Enviada() {
  return (
    <Suspense fallback={null}>
      <Conteudo />
    </Suspense>
  );
}
