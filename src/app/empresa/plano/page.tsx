'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, Briefcase, Users, LogOut, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRequireRole, sair } from '@/lib/session';
import { useEmpresaData } from '@/lib/empresa';
import CidadeSelect from '@/components/CidadeSelect';
import VerificacaoCnpj from '@/components/VerificacaoCnpj';
import CapaUpload from '@/components/CapaUpload';
import { mascaraCnpj } from '@/lib/cnpj';
import BottomNav, { NAV_EMPRESA } from '@/components/BottomNav';
import Toast from '@/components/Toast';
import ExcluirConta from '@/components/ExcluirConta';
import Loading from '@/components/Loading';

export default function Plano() {
  const router = useRouter();
  const { ready, user, profile } = useRequireRole('empresa');
  const { company, jobs, apps, loading, recarregar } = useEmpresaData(ready ? user.id : undefined);
  const [nome, setNome] = useState('');
  const [cidade, setCidade] = useState('');
  const [sobre, setSobre] = useState('');
  const [telefone, setTelefone] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!company) return;
    setNome(company.name || '');
    setCidade(company.city || '');
    setSobre(company.about || '');
    setTelefone(profile?.phone || '');
  }, [company, profile]);

  async function salvar() {
    if (!company) return;
    if (!cidade) { setToast('Escolha a cidade da empresa.'); return; }
    setSalvando(true);
    const [a, b] = await Promise.all([
      supabase.from('companies').update({ name: nome.trim(), city: cidade, about: sobre.trim() || null }).eq('id', company.id),
      supabase.from('profiles').update({ phone: telefone.trim(), city: cidade }).eq('id', user.id),
    ]);
    setSalvando(false);
    setToast(a.error || b.error ? 'Não foi possível salvar.' : 'Dados da empresa salvos!');
    recarregar();
  }

  if (!ready || loading) return <Loading />;

  const ativa = company?.plan_status === 'ativo';

  return (
    <>
      <Toast msg={toast} onClose={() => setToast(null)} />
      <main className="safe-bottom px-5 pt-8">
        <h1 className="text-3xl font-extrabold text-brand-900">Olá, {company?.name}!</h1>
        <p className="mt-1 flex items-center gap-2 text-brand-700"><span className={`h-2.5 w-2.5 rounded-full ${ativa ? 'bg-emerald-500' : 'bg-amber-500'}`} /> {ativa ? 'Sua conta está ativa' : 'Sua conta está pendente'}</p>

        <section className="mt-5 flex items-center justify-between rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-5 text-white shadow-lg">
          <div>
            <p className="text-sm font-semibold text-white/80">Acesso Beta Tester</p>
            <p className="mt-1 text-2xl font-extrabold">Liberado grátis</p>
            <p className="mt-1 text-xs text-white/70">Plano Mensal: R$ 49,90/mês depois do beta</p>
          </div>
          <span className="rounded-full bg-accent px-4 py-2 text-sm font-extrabold text-white">BETA</span>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3">
          <div className="card flex flex-col items-center p-4"><Briefcase className="text-brand-700" /><span className="mt-1 text-sm font-semibold">Vagas ativas</span><span className="text-3xl font-extrabold">{jobs.filter((j) => j.status === 'ativa').length}</span></div>
          <div className="card flex flex-col items-center p-4"><Users className="text-brand-700" /><span className="mt-1 text-sm font-semibold">Candidatos interessantes</span><span className="text-3xl font-extrabold">{apps.length}</span></div>
        </section>

        <section className="card mt-6 p-4">
          <h2 className="flex items-center gap-2 text-lg font-extrabold"><ShieldCheck className="text-brand-700" /> Dados da empresa</h2>
          {company?.cnpj && <p className="mt-1 text-sm text-ink/70">CNPJ {mascaraCnpj(company.cnpj)}{company.razao_social ? ` • ${company.razao_social}` : ''}</p>}
          <VerificacaoCnpj company={company} onVerificado={recarregar} mostrarOk />
          <div className="mt-3">
            <p className="mb-2 text-sm font-bold text-brand-900">Capa da empresa (aparece no topo das suas vagas)</p>
            <CapaUpload url={company?.cover_url} onDone={() => recarregar()} onErro={setToast} />
          </div>
          <div className="mt-3 space-y-3">
            <input className="input" maxLength={120} placeholder="Nome da empresa" value={nome} onChange={(e) => setNome(e.target.value)} />
            <input className="input" type="tel" inputMode="tel" maxLength={20} placeholder="WhatsApp da empresa" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            <div>
              <p className="mb-2 text-sm font-bold text-brand-900">Cidade da empresa (onde suas vagas aparecem)</p>
              <CidadeSelect value={cidade} onChange={setCidade} />
            </div>
            <textarea className="input min-h-24" maxLength={2000} placeholder="Sobre a empresa (aparece para os candidatos)" value={sobre} onChange={(e) => setSobre(e.target.value)} />
            <button onClick={salvar} disabled={salvando} className="btn-primary">{salvando ? 'Salvando...' : 'Salvar dados'}</button>
          </div>
        </section>

        <button onClick={() => sair(router)} className="mx-auto mt-6 flex items-center gap-2 py-2 text-sm font-bold text-ink/60"><LogOut size={16} /> Sair da conta</button>
        <ExcluirConta />
      </main>
      <BottomNav tabs={NAV_EMPRESA} active="/empresa/plano" />
    </>
  );
}
