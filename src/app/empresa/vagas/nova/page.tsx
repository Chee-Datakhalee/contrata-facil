'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Search, Plus, Check, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRequireRole } from '@/lib/session';
import { useEmpresaData } from '@/lib/empresa';
import { BENEFICIOS_PADRAO, CONTRATOS, EXPERIENCIAS, REQUISITOS_PADRAO } from '@/lib/constants';
import VerificacaoCnpj from '@/components/VerificacaoCnpj';
import type { Req } from '@/lib/types';
import Toast from '@/components/Toast';
import Loading from '@/components/Loading';

const PASSOS = ['Vaga', 'Requisitos', 'Publicar'];

export default function NovaVaga() {
  const router = useRouter();
  const { ready, user } = useRequireRole('empresa');
  const { company, loading, recarregar } = useEmpresaData(ready ? user.id : undefined);

  const [passo, setPasso] = useState(0);
  const [cargo, setCargo] = useState('');
  const [reqs, setReqs] = useState<Req[]>([]);
  const [custom, setCustom] = useState('');
  const [mostrarCustom, setMostrarCustom] = useState(false);
  const [beneficios, setBeneficios] = useState<string[]>([]);
  const [experiencia, setExperiencia] = useState('');
  const [horario, setHorario] = useState('');
  const [contrato, setContrato] = useState('CLT');
  const [descricao, setDescricao] = useState('');
  const [modo, setModo] = useState<'fixo' | 'faixa' | 'combinar'>('faixa');
  const [salMin, setSalMin] = useState('');
  const [salMax, setSalMax] = useState('');
  const [publicando, setPublicando] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const temReq = (l: string) => reqs.some((r) => r.label === l);
  const alternarReq = (l: string) => setReqs(temReq(l) ? reqs.filter((r) => r.label !== l) : [...reqs, { label: l }]);
  const alternarEssencial = (l: string) => setReqs(reqs.map((r) => (r.label === l ? { ...r, essential: !r.essential } : r)));
  const alternarBeneficio = (b: string) => setBeneficios(beneficios.includes(b) ? beneficios.filter((x) => x !== b) : [...beneficios, b]);

  function addCustom() {
    const l = custom.trim();
    if (!l || temReq(l)) return;
    setReqs([...reqs, { label: l }]);
    setCustom('');
    setMostrarCustom(false);
  }

  function continuar() {
    if (passo === 0) {
      if (!cargo.trim()) { setToast('Informe qual cargo você procura.'); return; }
      if (reqs.length === 0) { setToast('Marque pelo menos 1 requisito.'); return; }
    }
    setPasso(passo + 1);
  }

  async function publicar() {
    if (!company) return;
    if (!company.city) { setToast('Cadastre a cidade da empresa em Meu Plano antes de publicar.'); return; }
    if (!company.cnpj_verificado) { setToast('Verifique o CNPJ da empresa antes de publicar.'); return; }
    if (modo !== 'combinar' && !salMin) { setToast('Informe o salário (a empresa precisa mostrar pelo menos uma faixa).'); return; }
    setPublicando(true);
    const { error } = await supabase.from('jobs').insert({
      company_id: company.id,
      title: cargo.trim(),
      city: company.city,
      description: descricao.trim() || null,
      requirements: reqs,
      benefits: beneficios,
      salary_mode: modo,
      salary_min: modo === 'combinar' ? null : Number(salMin),
      salary_max: modo === 'faixa' && salMax ? Number(salMax) : null,
      contract_type: contrato,
      schedule: horario.trim() || null,
      experience: experiencia || null,
    });
    setPublicando(false);
    if (error) { setToast('Não foi possível publicar. Confira se seu plano está ativo.'); return; }
    router.replace('/empresa/vagas');
  }

  if (!ready || loading) return <Loading />;

  const customs = reqs.filter((r) => !REQUISITOS_PADRAO.some((p) => p.label === r.label));

  return (
    <>
      <Toast msg={toast} onClose={() => setToast(null)} />
      <main className="px-5 pb-12 pt-6">
        <header className="relative flex items-center justify-center">
          <button onClick={() => (passo === 0 ? router.back() : setPasso(passo - 1))} aria-label="Voltar" className="absolute left-0 flex h-10 w-10 items-center justify-center"><ChevronLeft size={28} /></button>
          <h1 className="text-xl font-extrabold">Nova Vaga</h1>
        </header>

        <ol className="mt-6 flex items-start">
          {PASSOS.map((p, i) => (
            <li key={p} className="relative flex flex-1 flex-col items-center text-sm font-semibold">
              {i > 0 && <span className={`absolute right-1/2 top-4 -z-0 h-0.5 w-full ${i <= passo ? 'bg-brand-700' : 'bg-brand-200'}`} />}
              <span className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 font-bold ${i <= passo ? 'border-brand-700 bg-brand-700 text-white' : 'border-brand-200 bg-white text-brand-500'}`}>
                {i < passo ? <Check size={18} /> : i + 1}
              </span>
              <span className={`mt-1 ${i === passo ? 'text-brand-900' : 'text-brand-500'}`}>{p}</span>
            </li>
          ))}
        </ol>

        {passo === 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-extrabold">Qual cargo você procura?</h2>
            <label className="mt-3 flex items-center gap-3 rounded-2xl border border-brand-200 bg-white px-4 py-3.5">
              <Search size={20} className="text-brand-700" />
              <input value={cargo} onChange={(e) => setCargo(e.target.value)} maxLength={120} placeholder="Ex.: Vendedor de Veículos" className="w-full bg-transparent text-base outline-none" />
            </label>

            <h2 className="mt-7 text-lg font-extrabold">Quais são os principais requisitos?</h2>
            <ul className="mt-3 space-y-3">
              {REQUISITOS_PADRAO.map((r) => (
                <li key={r.label} className="flex items-center gap-3">
                  <button
                    onClick={() => alternarReq(r.label)}
                    role="checkbox"
                    aria-checked={temReq(r.label)}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 ${temReq(r.label) ? 'border-brand-700 bg-brand-700 text-white' : 'border-brand-300 bg-white'}`}
                  >
                    {temReq(r.label) && <Check size={18} strokeWidth={3} />}
                  </button>
                  <span className="text-base">{r.label}</span>
                </li>
              ))}
              {customs.map((r) => (
                <li key={r.label} className="flex items-center gap-3">
                  <button onClick={() => alternarReq(r.label)} role="checkbox" aria-checked className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-brand-700 bg-brand-700 text-white"><Check size={18} strokeWidth={3} /></button>
                  <span className="text-base">{r.label}</span>
                </li>
              ))}
            </ul>

            {mostrarCustom ? (
              <div className="mt-3 flex gap-2">
                <input className="input" value={custom} onChange={(e) => setCustom(e.target.value)} maxLength={60} placeholder="Novo requisito" autoFocus />
                <button onClick={addCustom} className="rounded-2xl bg-brand-700 px-5 font-bold text-white">Adicionar</button>
              </div>
            ) : (
              <button onClick={() => setMostrarCustom(true)} className="mt-4 flex items-center gap-2 font-bold text-brand-700"><Plus size={20} /> Adicionar requisito</button>
            )}

            <h2 className="mt-7 text-lg font-extrabold">Quais benefícios oferece?</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {BENEFICIOS_PADRAO.map((b) => (
                <button key={b} onClick={() => alternarBeneficio(b)} aria-pressed={beneficios.includes(b)} className={`chip !px-4 !py-2 ${beneficios.includes(b) ? 'chip-on !border-brand-700' : ''}`}>
                  {beneficios.includes(b) && <Check size={14} />}{b}
                </button>
              ))}
            </div>

            <button onClick={continuar} className="btn-primary mt-8">Continuar</button>
          </section>
        )}

        {passo === 1 && (
          <section className="mt-8">
            <h2 className="text-lg font-extrabold">O que pesa mais?</h2>
            <p className="mt-1 text-sm text-ink/70">Marque a estrela nos requisitos essenciais. Eles pesam o dobro na compatibilidade.</p>
            <ul className="mt-3 space-y-2">
              {reqs.map((r) => (
                <li key={r.label} className="card flex items-center justify-between px-4 py-3">
                  <span className="font-semibold">{r.label}</span>
                  <button onClick={() => alternarEssencial(r.label)} aria-pressed={!!r.essential} aria-label={`Essencial: ${r.label}`} className="p-1">
                    <Star size={26} className={r.essential ? 'text-accent' : 'text-brand-300'} fill={r.essential ? 'currentColor' : 'none'} />
                  </button>
                </li>
              ))}
            </ul>

            <h2 className="mt-7 text-lg font-extrabold">Experiência desejada</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {EXPERIENCIAS.map((e) => (
                <button key={e} onClick={() => setExperiencia(experiencia === e ? '' : e)} aria-pressed={experiencia === e} className={`chip !px-4 !py-2 ${experiencia === e ? 'chip-on !border-brand-700' : ''}`}>{e}</button>
              ))}
            </div>

            <h2 className="mt-7 text-lg font-extrabold">Tipo de contratação</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {CONTRATOS.map((c) => (
                <button key={c} onClick={() => setContrato(c)} aria-pressed={contrato === c} className={`chip !px-4 !py-2 ${contrato === c ? 'chip-on !border-brand-700' : ''}`}>{c}</button>
              ))}
            </div>

            <h2 className="mt-7 text-lg font-extrabold">Horário de trabalho</h2>
            <input className="input mt-3" value={horario} onChange={(e) => setHorario(e.target.value)} maxLength={80} placeholder="Ex.: Seg a sáb, 8h às 18h" />

            <h2 className="mt-7 text-lg font-extrabold">Descrição da vaga</h2>
            <textarea className="input mt-3 min-h-28" value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={4000} placeholder="Conte em poucas linhas o que a pessoa vai fazer e como é a empresa." />

            <button onClick={continuar} className="btn-primary mt-8">Continuar</button>
          </section>
        )}

        {passo === 2 && (
          <section className="mt-8">
            <p className="rounded-2xl bg-brand-100 p-3 text-sm font-semibold text-brand-900">A vaga aparece só para profissionais de <b>{company?.city || 'sua cidade'}</b>, a cidade do cadastro da sua empresa.</p>
            <VerificacaoCnpj company={company} onVerificado={recarregar} />

            <h2 className="mt-7 text-lg font-extrabold">Salário</h2>
            <p className="mt-1 text-sm text-ink/70">Vagas com salário visível recebem mais candidatos.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {([['faixa', 'Faixa salarial'], ['fixo', 'Salário fixo'], ['combinar', 'A combinar']] as const).map(([v, l]) => (
                <button key={v} onClick={() => setModo(v)} aria-pressed={modo === v} className={`chip !px-4 !py-2 ${modo === v ? 'chip-on !border-brand-700' : ''}`}>{l}</button>
              ))}
            </div>
            {modo !== 'combinar' && (
              <div className="mt-3 flex gap-3">
                <input className="input" type="number" inputMode="numeric" placeholder={modo === 'fixo' ? 'Valor (R$)' : 'De (R$)'} value={salMin} onChange={(e) => setSalMin(e.target.value)} />
                {modo === 'faixa' && <input className="input" type="number" inputMode="numeric" placeholder="Até (R$)" value={salMax} onChange={(e) => setSalMax(e.target.value)} />}
              </div>
            )}

            <div className="card mt-7 p-4">
              <p className="text-sm font-bold text-brand-700">Resumo</p>
              <p className="mt-1 text-xl font-extrabold">{cargo}</p>
              <p className="text-sm text-ink/70">{reqs.length} requisitos • {beneficios.length} benefícios • {contrato}</p>
            </div>

            <button onClick={publicar} disabled={publicando || !company?.cnpj_verificado} className="btn-primary mt-6">{publicando ? 'Publicando...' : 'Publicar vaga'}</button>
          </section>
        )}
      </main>
    </>
  );
}
