'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRequireRole } from '@/lib/session';
import { calcCompat } from '@/lib/compat';
import type { Candidate, Job } from '@/lib/types';
import Avatar from '@/components/Avatar';
import { CompatPill } from '@/components/Compat';
import BottomNav, { NAV_CANDIDATO } from '@/components/BottomNav';
import Loading from '@/components/Loading';

export default function Salvas() {
  const { ready, user } = useRequireRole('profissional');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [cand, setCand] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const [s, c] = await Promise.all([
        supabase.from('saved_jobs').select('jobs(*, companies(id, name, city, about, logo_url, cover_url))').eq('candidate_id', user.id).order('created_at', { ascending: false }),
        supabase.from('candidates').select('*').eq('user_id', user.id).single(),
      ]);
      setJobs(((s.data as any[]) || []).map((x) => x.jobs).filter(Boolean));
      setCand(c.data as any);
      setLoading(false);
    })();
  }, [ready, user]);

  if (!ready || loading) return <Loading />;

  return (
    <>
      <main className="safe-bottom px-5 pt-8">
        <h1 className="text-3xl font-extrabold text-brand-900">Favoritos</h1>
        <p className="text-brand-700">Vagas que você salvou para ver depois.</p>
        <div className="mt-6 space-y-3">
          {jobs.length === 0 && (
            <div className="card p-8 text-center">
              <p className="text-lg font-extrabold text-brand-800">Nada salvo ainda</p>
              <p className="mt-1 text-ink/70">Abra uma vaga e toque no marcador para salvar.</p>
            </div>
          )}
          {jobs.map((j) => (
            <Link key={j.id} href={`/candidato/vaga/${j.id}`} className="card flex items-center gap-3 p-4">
              <Avatar nome={j.companies?.name} url={j.companies?.logo_url} size={56} square />
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold">{j.title}</p>
                <p className="truncate text-sm text-ink/70">{j.companies?.name}</p>
                <p className="flex items-center gap-1 text-sm text-brand-700"><MapPin size={13} />{j.city}</p>
              </div>
              <CompatPill pct={calcCompat(j.requirements, cand?.skills).total} />
            </Link>
          ))}
        </div>
      </main>
      <BottomNav tabs={NAV_CANDIDATO} active="/candidato/salvas" />
    </>
  );
}
