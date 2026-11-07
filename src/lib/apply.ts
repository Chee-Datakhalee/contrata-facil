import { supabase } from './supabase';

export async function candidatar(jobId: string): Promise<{ ok: boolean; restantes?: number; msg?: string }> {
  const { data, error } = await supabase.rpc('candidatar', { p_job_id: jobId });
  if (error) {
    const m = error.message || '';
    if (m.includes('limite_diario')) return { ok: false, msg: 'Você já usou suas 2 candidaturas de hoje. Volte amanhã para se candidatar a mais vagas.' };
    if (m.includes('ja_candidatou')) return { ok: false, msg: 'Você já se candidatou a esta vaga.' };
    if (m.includes('vaga_indisponivel')) return { ok: false, msg: 'Esta vaga não está mais disponível.' };
    return { ok: false, msg: 'Não foi possível enviar sua candidatura. Tente de novo.' };
  }
  return { ok: true, restantes: (data as any)?.restantes ?? 0 };
}
