'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Application, Company, Job } from './types';

export function useEmpresaData(userId?: string) {
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    const { data: c } = await supabase.rpc('minha_empresa').single();
    setCompany(c as any);
    if (!c) { setLoading(false); return; }
    const { data: js } = await supabase.from('jobs').select('*').eq('company_id', (c as any).id).order('created_at', { ascending: false });
    const lista = ((js as any[]) || []) as Job[];
    setJobs(lista);
    if (lista.length) {
      const { data: as } = await supabase
        .from('applications')
        .select('*, candidates(*, profiles(full_name, phone, city, avatar_url))')
        .in('job_id', lista.map((j) => j.id))
        .order('created_at', { ascending: false });
      setApps(((as as any[]) || []) as Application[]);
    } else {
      setApps([]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { recarregar(); }, [recarregar]);

  return { company, jobs, apps, loading, recarregar, setApps };
}

export async function mudarStatus(appId: string, status: string) {
  return supabase.from('applications').update({ status }).eq('id', appId);
}
