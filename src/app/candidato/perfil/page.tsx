'use client';
import { useEffect, useState } from 'react'; 
import { useRouter } from 'next/navigation';
import { Briefcase, Users, GraduationCap, Clock, MapPin, ChevronRight, ChevronDown, X, UserRound, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRequireRole, sair } from '@/lib/session';
import { DISPONIBILIDADES, FORMACOES } from '@/lib/constants';
import CidadeSelect from '@/components/CidadeSelect';
import type { Candidate } from '@/lib/types';
import AvatarUpload from '@/components/AvatarUpload';
import BottomNav, { NAV_CANDIDATO } from '@/components/BottomNav';
import Toast from '@/components/Toast';
import ExcluirConta from '@/components/ExcluirConta';
import Loading from '@/components/Loading';

type Secao = 'dados' | 'exp' | 'hab' | 'form' | 'disp' | 'local' | null;

export default function Perfil() {
  const router = useRouter();
  const { ready, user, profile } = useRequireRole('profissional');
  const [aberta, setAberta] = useState<Secao>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [nome, setNome] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [telefone, setTelefone] = useState('');
  const [idade, setIdade] = useState('');
  const [expAnos, setExpAnos] = useState('');
  const [expArea, setExpArea] = useState('');
  const [skills, setSkills] = useState<Record<string, number>>({});
  const [novaHab, setNovaHab] = useState('');
  const [formacao, setFormacao] = useState('');
  const [disp, setDisp] = useState('');
  const [cidade, setCidade] = useState('');

  useEffect(() => {
    if (!ready) return;
    setNome(profile.full_name || '');
    setFoto(profile.avatar_url || null);
    setTelefone(profile.phone || '');
    setCidade(profile.city || '');
    supabase.from('candidates').select('*').eq('user_id', user.id).single().then(({ data }) => {
      const c = data as Candidate | null;
      if (c) {
        setIdade(c.age ? String(c.age) : '');
        setExpAnos(c.exp_years != null ? String(c.exp_years) : '');
        setExpArea(c.exp_area || '');
        setSkills(c.skills || {});
        setFormacao(c.education || '');
        setDisp(c.availability || '');
      }
      setLoading(false);
    });
  }, [ready, user, profile]);

  // Habilidades: texto livre, digitado pelo profissional (até 30). Pode colar várias separadas por vírgula.
  function adicionarHab() {
    const partes = novaHab.split(/[,;\n]/).map((t) => t.replace(/\s+/g, ' ').trim().slice(0, 60)).filter(Boolean);
    if (!partes.length) return;
    const novo: Record<string, number> = { ...skills };
    let total = Object.values(novo).filter((v) => v > 0).length;
    let cheio = false;
    for (const p of partes) {
      if (Object.keys(novo).some((k) => k.toLowerCase() === p.toLowerCase() && novo[k] > 0)) continue;
      if (total >= 30) { cheio = true; break; }
      novo[p] = 100;
      total++;
    }
    setSkills(novo);
    setNovaHab('');
    if (cheio) setToast('Limite de 30 habilidades.');
  }

  function removerHab(k: string) {
    const resto = { ...skills };
    delete resto[k];
    setSkills(resto);
  }

  async function salvar() {
    if (!cidade) { setToast('Escolha sua cidade para ver as vagas.'); setAberta('local'); return; }
    setSalvando(true);
    const [p, c] = await Promise.all([
      supabase.from('profiles').update({ full_name: nome.trim(), phone: telefone.trim(), city: cidade }).eq('id', user.id),
      supabase.from('candidates').update({
        age: idade ? Number(idade) : null,
        exp_years: expAnos !== '' ? Number(expAnos) : null,
        exp_area: expArea.trim() || null,
        education: formacao || null,
        availability: disp || null,
        skills: Object.fromEntries(Object.entries(skills).filter(([, v]) => v > 0)),
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id),
    ]);
    setSalvando(false);
    if (p.error || c.error) { setToast('Não foi possível salvar. Tente de novo.'); return; }
    setToast('Perfil salvo!');
    setAberta(null);
  }

  const toggle = (s: Secao) => setAberta(aberta === s ? null : s);

  if (!ready || loading) return <Loading />;

  const listaHab = Object.entries(skills).filter(([, v]) => v > 0).map(([k]) => k);
  const habilidadesResumo = listaHab.slice(0, 3).join(', ') || 'Toque para preencher';

  const linhas: { id: Secao; icon: any; titulo: string; resumo: string }[] = [
    { id: 'dados', icon: UserRound, titulo: 'Dados pessoais', resumo: [nome, telefone].filter(Boolean).join(' • ') || 'Toque para preencher' },
    { id: 'exp', icon: Briefcase, titulo: 'Experiência Profissional', resumo: expAnos !== '' ? `${expAnos} ${Number(expAnos) === 1 ? 'ano' : 'anos'}${expArea ? ' em ' + expArea : ''}` : 'Toque para preencher' },
    { id: 'hab', icon: Users, titulo: 'Habilidades', resumo: habilidadesResumo },
    { id: 'form', icon: GraduationCap, titulo: 'Formação', resumo: formacao || 'Toque para preencher' },
    { id: 'disp', icon: Clock, titulo: 'Disponibilidade', resumo: disp || 'Toque para preencher' },
    { id: 'local', icon: MapPin, titulo: 'Localização', resumo: cidade || 'Toque para escolher' },
  ];

  return (
    <>
      <Toast msg={toast} onClose={() => setToast(null)} />
      <main className="safe-bottom px-5 pt-8">
        <h1 className="text-center text-2xl font-extrabold text-ink">Seu Perfil</h1>
        <p className="mt-2 text-center text-brand-700">Complete seu perfil para receber<br />as melhores oportunidades.</p>

        <div className="mx-auto mt-5 w-fit">
          <AvatarUpload tipo="perfil" nome={nome} url={foto} size={120} onDone={setFoto} onErro={setToast} />
        </div>

        <div className="mt-6 space-y-3">
          {linhas.map((l) => {
            const Icon = l.icon;
            const on = aberta === l.id;
            return (
              <div key={l.id} className="card overflow-hidden">
                <button onClick={() => toggle(l.id)} aria-expanded={on} className="flex w-full items-center gap-4 p-4 text-left">
                  <Icon size={26} className="shrink-0 text-brand-700" />
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold">{l.titulo}</p>
                    <p className="truncate text-sm text-ink/70">{l.resumo}</p>
                  </div>
                  {on ? <ChevronDown className="text-brand-700" /> : <ChevronRight className="text-brand-700" />}
                </button>

                {on && (
                  <div className="space-y-3 border-t border-brand-100 p-4">
                    {l.id === 'dados' && (
                      <>
                        <input className="input" maxLength={120} placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} />
                        <input className="input" type="tel" inputMode="tel" maxLength={20} placeholder="WhatsApp com DDD" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
                        <input className="input" type="number" inputMode="numeric" placeholder="Idade" value={idade} onChange={(e) => setIdade(e.target.value)} />
                      </>
                    )}
                    {l.id === 'exp' && (
                      <>
                        <p className="text-sm text-ink/70">Conte rápido: qual a sua profissão ou área e há quantos anos você trabalha nela.</p>
                        <input className="input" maxLength={80} placeholder="Sua profissão ou área (ex.: vendedor, atendente)" value={expArea} onChange={(e) => setExpArea(e.target.value)} />
                        <div className="grid grid-cols-[110px_1fr] items-center gap-3">
                          <input className="input" type="number" inputMode="numeric" min={0} max={80} placeholder="Anos" value={expAnos} onChange={(e) => setExpAnos(e.target.value)} />
                          <span className="text-sm text-ink/70">anos de experiência (coloque 0 se nunca trabalhou na área)</span>
                        </div>
                      </>
                    )}
                    {l.id === 'hab' && (
                      <div className="space-y-3">
                        <p className="text-sm text-ink/70">Escreva o que você sabe fazer e toque em Adicionar. Pode separar por vírgula. Ex.: vendas, atendimento ao cliente, Excel, CNH B.</p>
                        <div className="flex gap-2">
                          <input
                            className="input"
                            maxLength={200}
                            placeholder="Ex.: atendimento ao cliente"
                            value={novaHab}
                            onChange={(e) => setNovaHab(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarHab(); } }}
                          />
                          <button type="button" onClick={adicionarHab} className="shrink-0 rounded-2xl bg-brand-700 px-5 font-bold text-white">Adicionar</button>
                        </div>
                        {listaHab.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {listaHab.map((k) => (
                              <span key={k} className="chip !border-brand-700 !bg-brand-700 !text-white">
                                {k}
                                <button type="button" onClick={() => removerHab(k)} aria-label={`Remover ${k}`}><X size={14} /></button>
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-ink/60">{listaHab.length}/30 habilidades. Quanto mais completas, melhor a compatibilidade com as vagas.</p>
                      </div>
                    )}
                    {l.id === 'form' && (
                      <select className="input" value={formacao} onChange={(e) => setFormacao(e.target.value)}>
                        <option value="">Selecione</option>
                        {FORMACOES.map((f) => <option key={f}>{f}</option>)}
                      </select>
                    )}
                    {l.id === 'disp' && (
                      <div className="flex flex-wrap gap-2">
                        {DISPONIBILIDADES.map((d) => (
                          <button key={d} type="button" onClick={() => setDisp(d)} className={`chip ${disp === d ? 'chip-on !bg-brand-700 !text-white' : ''}`}>{d}</button>
                        ))}
                      </div>
                    )}
                    {l.id === 'local' && (
                      <>
                        <CidadeSelect value={cidade} onChange={setCidade} />
                        <p className="text-sm text-ink/70">Você só vê as vagas da cidade escolhida aqui.</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={salvar} disabled={salvando} className="btn-primary mt-6">{salvando ? 'Salvando...' : 'Salvar Perfil'}</button>
        <button onClick={() => sair(router)} className="mx-auto mt-4 flex items-center gap-2 py-2 text-sm font-bold text-ink/60"><LogOut size={16} /> Sair da conta</button>
        <ExcluirConta />
      </main>
      <BottomNav tabs={NAV_CANDIDATO} active="/candidato/perfil" />
    </>
  );
}
