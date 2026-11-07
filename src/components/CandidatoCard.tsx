'use client';
import { Bookmark, MapPin, Car, Clock, Trash2, MessageCircle, BadgeCheck } from 'lucide-react';
import { calcCompat, whatsappLink } from '@/lib/compat';
import type { Application, Job } from '@/lib/types';
import Avatar from './Avatar';
import { CompatBadge, CompatBars } from './Compat';

export default function CandidatoCard({
  app, job, onDescartar, onContato, onAnalise, onContratado,
}: {
  app: Application;
  job: Job;
  onDescartar: () => void;
  onContato: () => void;
  onAnalise: () => void;
  onContratado: () => void;
}) {
  const c = app.candidates;
  const p = c?.profiles;
  const compat = calcCompat(job.requirements, c?.skills);
  const temCnh = (c?.skills?.['CNH categoria B'] ?? 0) > 0;
  const link = whatsappLink(p?.phone, `Olá ${p?.full_name?.split(' ')[0] || ''}! Vi seu perfil no Contrata Fácil e gostei para a vaga de ${job.title}. Podemos conversar?`);
  const emAnalise = app.status === 'em_analise';

  return (
    <article className="card p-4">
      <div className="flex items-start justify-between">
        <CompatBadge pct={compat.total} showPct />
        <button onClick={onAnalise} aria-label={emAnalise ? 'Tirar de em análise' : 'Marcar em análise'} aria-pressed={emAnalise} className="p-1">
          <Bookmark size={26} className="text-brand-800" fill={emAnalise ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="mt-3 flex gap-4">
        <Avatar nome={p?.full_name} url={p?.avatar_url} size={110} square />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xl font-extrabold text-ink">{p?.full_name}</h3>
          <p className="flex items-center gap-1 text-sm text-ink/80">
            <MapPin size={15} className="shrink-0 text-brand-700" />
            {c?.age ? `${c.age} anos • ` : ''}{p?.city}
          </p>
          {c?.exp_years != null && (
            <span className="chip mt-2"><BadgeCheck size={14} />{c.exp_years} {c.exp_years === 1 ? 'ano' : 'anos'} de experiência</span>
          )}
          <p className="mt-2 truncate text-xs font-semibold text-brand-700">Vaga: {job.title}</p>
        </div>
      </div>

      <h4 className="mt-4 text-base font-extrabold">Compatibilidade com sua vaga:</h4>
      <div className="mt-2"><CompatBars items={compat.items.slice(0, 5)} /></div>

      <div className="mt-4 flex items-center justify-around rounded-2xl bg-brand-50 px-2 py-3 text-xs font-semibold text-brand-900">
        <span className="flex items-center gap-1.5"><Car size={20} className="text-brand-700" />{temCnh ? 'Possui CNH B' : 'Sem CNH B'}</span>
        <span className="h-6 w-px bg-brand-200" />
        <span className="flex items-center gap-1.5"><Clock size={20} className="text-brand-700" />{c?.availability || 'A combinar'}</span>
        <span className="h-6 w-px bg-brand-200" />
        <span className="flex items-center gap-1.5"><MapPin size={20} className="text-brand-700" />{p?.city?.split(' - ')[0]}</span>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_1.5fr] gap-3">
        <button onClick={onDescartar} className="btn-outline !py-3.5"><Trash2 size={20} /> Descartar</button>
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer" onClick={onContato} className="btn-primary !py-3.5"><MessageCircle size={20} /> Entrar em contato</a>
        ) : (
          <button disabled className="btn-primary !py-3.5">Sem WhatsApp</button>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs font-semibold text-ink/60">
        <span>{app.status === 'contatado' ? 'Você já entrou em contato' : app.status === 'contratado' ? 'Contratado(a)' : ''}</span>
        {app.status !== 'contratado' && <button onClick={onContratado} className="font-bold text-brand-700 underline">Marcar como contratado</button>}
      </div>
    </article>
  );
}
