'use client';
import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Company } from '@/lib/types';

// Confirma o CNPJ da empresa na Receita (pelo servidor). Sem verificação, a empresa não publica vagas.
export default function VerificacaoCnpj({
  company, onVerificado, mostrarOk = false,
}: {
  company: Company | null;
  onVerificado: () => void;
  mostrarOk?: boolean;
}) {
  const [estado, setEstado] = useState<'parado' | 'verificando' | 'erro'>('parado');
  const [msg, setMsg] = useState('');

  const verificar = useCallback(async () => {
    setEstado('verificando'); setMsg('');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setEstado('erro'); setMsg('Sessão expirada. Entre de novo.'); return; }
    try {
      const r = await fetch('/api/cnpj/verificar', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) { setEstado('parado'); onVerificado(); return; }
      setEstado('erro'); setMsg(j.erro || 'Não foi possível verificar agora.');
    } catch {
      setEstado('erro'); setMsg('Sem conexão. Tente de novo.');
    }
  }, [onVerificado]);

  useEffect(() => {
    if (company && !company.cnpj_verificado && estado === 'parado') verificar();
  }, [company]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!company) return null;

  if (company.cnpj_verificado) {
    return mostrarOk ? (
      <p className="mt-3 flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800"><ShieldCheck size={18} /> CNPJ verificado na Receita Federal</p>
    ) : null;
  }

  if (estado === 'verificando') {
    return <p className="mt-4 flex items-center gap-2 rounded-2xl bg-brand-100 p-3 text-sm font-bold text-brand-800"><Loader2 size={18} className="animate-spin" /> Verificando seu CNPJ na Receita...</p>;
  }

  return (
    <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900" role="alert">
      <p className="flex items-center gap-2 font-bold"><ShieldAlert size={18} /> Seu CNPJ ainda não foi verificado</p>
      <p className="mt-1">{msg || 'Precisamos confirmar sua empresa para liberar a publicação de vagas.'}</p>
      <button onClick={verificar} className="mt-2 font-bold underline">Verificar agora</button>
    </div>
  );
}
