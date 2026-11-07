import Link from 'next/link';
import { Briefcase, User, ChevronRight } from 'lucide-react';
import { IMG_PERFIS } from '@/lib/constants';

export default function Escolher() {
  return (
    <main className="min-h-[100dvh] px-6 pt-14">
      <h1 className="text-[2rem] font-extrabold leading-tight text-brand-800">Como você quer<br />usar o app?</h1>
      <p className="mt-3 text-base text-ink/80">Escolha seu perfil para começar.</p>

      <div className="mt-8 space-y-4">
        <Link href="/cadastro?tipo=empresa" className="card flex items-center gap-4 p-5">
          <Briefcase size={40} className="shrink-0 text-brand-700" fill="currentColor" strokeWidth={1.5} />
          <div className="flex-1">
            <p className="text-lg font-extrabold text-brand-800">Sou Empresa</p>
            <p className="text-sm leading-snug text-ink/70">Encontre profissionais qualificados para sua empresa.</p>
          </div>
          <ChevronRight className="text-brand-700" />
        </Link>

        <Link href="/cadastro?tipo=profissional" className="card flex items-center gap-4 p-5">
          <User size={40} className="shrink-0 text-brand-700" fill="currentColor" strokeWidth={1.5} />
          <div className="flex-1">
            <p className="text-lg font-extrabold text-brand-800">Sou Profissional</p>
            <p className="text-sm leading-snug text-ink/70">Descubra oportunidades de trabalho na sua região.</p>
          </div>
          <ChevronRight className="text-brand-700" />
        </Link>
      </div>

      {IMG_PERFIS ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={IMG_PERFIS} alt="" aria-hidden className="mx-auto mt-6 w-full max-w-xs" />
      ) : (
        <div className="mt-10 flex justify-center gap-6 opacity-90" aria-hidden>
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-brand-100"><Briefcase size={48} className="text-brand-700" /></div>
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-accent/20"><User size={48} className="text-accent-dark" /></div>
        </div>
      )}

      <p className="mt-10 pb-8 text-center text-sm text-ink/70">
        Já tem conta? <Link href="/login" className="font-bold text-brand-700">Entrar</Link>
      </p>
    </main>
  );
}
