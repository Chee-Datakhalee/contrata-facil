import Link from 'next/link';
import { Home, Heart, Briefcase, User, Search, Users, BarChart3, Bookmark } from 'lucide-react';

type Tab = { href: string; label: string; icon: any };

export const NAV_CANDIDATO: Tab[] = [
  { href: '/candidato', label: 'Início', icon: Home },
  { href: '/candidato/candidaturas', label: 'Minhas Vagas', icon: Heart },
  { href: '/candidato/salvas', label: 'Favoritos', icon: Bookmark },
  { href: '/candidato/perfil', label: 'Meu Perfil', icon: User },
];

export const NAV_EMPRESA: Tab[] = [
  { href: '/empresa', label: 'Início', icon: Home },
  { href: '/empresa/vagas', label: 'Minhas Vagas', icon: Search },
  { href: '/empresa/candidatos', label: 'Candidatos', icon: Users },
  { href: '/empresa/plano', label: 'Meu Plano', icon: BarChart3 },
];

export default function BottomNav({ tabs, active }: { tabs: Tab[]; active: string }) {
  return (
    <nav
      className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 rounded-t-3xl bg-white/95 backdrop-blur"
      style={{ boxShadow: '0 -6px 24px rgba(74,34,174,.10)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="flex items-stretch justify-around px-2 pt-3 pb-3">
        {tabs.map((t) => {
          const on = t.href === active;
          const Icon = t.icon;
          return (
            <li key={t.href} className="flex-1">
              <Link href={t.href} className={`flex flex-col items-center gap-1 text-xs font-semibold ${on ? 'text-brand-700' : 'text-brand-500/70'}`}>
                <Icon size={24} strokeWidth={on ? 2.6 : 2} />
                {t.label}
                <span className={`mt-0.5 h-1 w-10 rounded-full ${on ? 'bg-brand-700' : 'bg-transparent'}`} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
