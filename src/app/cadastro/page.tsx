'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cnpjValido, mascaraCnpj, soDigitos, type DadosCnpj } from '@/lib/cnpj';
import CidadeSelect from '@/components/CidadeSelect';

function Form() {
  const router = useRouter();
  const params = useSearchParams();
  const tipo = params.get('tipo') === 'empresa' ? 'empresa' : 'profissional';
  const empresa = tipo === 'empresa';

  const [nome, setNome] = useState('');
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [consulta, setConsulta] = useState<{ estado: 'parado' | 'buscando' | 'ok' | 'inativa' | 'erro'; dados?: DadosCnpj; msg?: string }>({ estado: 'parado' });
  const [telefone, setTelefone] = useState('');
  const [cidade, setCidade] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [aceitou, setAceitou] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [loading, setLoading] = useState(false);

  // Consulta o CNPJ na Receita assim que os 14 dígitos estiverem corretos
  useEffect(() => {
    if (!empresa) return;
    const d = soDigitos(cnpj);
    if (d.length < 14) { setConsulta({ estado: 'parado' }); return; }
    if (!cnpjValido(d)) { setConsulta({ estado: 'erro', msg: 'CNPJ inválido. Confira os números.' }); return; }
    let vivo = true;
    setConsulta({ estado: 'buscando' });
    fetch(`/api/cnpj?cnpj=${d}`)
      .then(async (r) => ({ ok: r.ok, j: await r.json().catch(() => ({})) }))
      .then(({ ok, j }) => {
        if (!vivo) return;
        if (!ok) {
          // Receita fora do ar: deixa continuar (a verificação é refeita depois, antes de publicar vagas)
          setConsulta({ estado: 'erro', msg: j.erro || 'Não foi possível consultar a Receita agora. Você pode continuar e a verificação será feita depois.' });
          return;
        }
        const dados = j as DadosCnpj;
        if (!dados.ativa) { setConsulta({ estado: 'inativa', dados }); return; }
        setConsulta({ estado: 'ok', dados });
        setNomeEmpresa((atual) => atual || (dados.nomeFantasia || dados.razaoSocial).slice(0, 120));
      })
      .catch(() => vivo && setConsulta({ estado: 'erro', msg: 'Não foi possível consultar a Receita agora. Você pode continuar e a verificação será feita depois.' }));
    return () => { vivo = false; };
  }, [cnpj, empresa]);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (!cidade) { setErro('Escolha a sua cidade. É ela que define onde as vagas aparecem.'); return; }
    if (empresa) {
      if (!cnpjValido(cnpj)) { setErro('Informe um CNPJ válido.'); return; }
      if (consulta.estado === 'inativa') { setErro('Este CNPJ não está ativo na Receita. Só empresas ativas podem se cadastrar.'); return; }
    }
    if (!aceitou) { setErro('Para continuar, aceite os Termos e a Política de Privacidade.'); return; }
    if (senha.length < 8 || !/[A-Za-z]/.test(senha) || !/\d/.test(senha)) { setErro('A senha precisa ter pelo menos 8 caracteres, com letras e números.'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        data: {
          role: tipo,
          full_name: nome.trim(),
          company_name: empresa ? nomeEmpresa.trim() : null,
          cnpj: empresa ? soDigitos(cnpj) : null,
          phone: telefone.trim(),
          city: cidade,
          aceitou_termos: 'true',
        },
      },
    });
    if (error) {
      setLoading(false);
      if (error.message.includes('already')) setErro('Este e-mail já tem cadastro. Use "Entrar".');
      else if (error.message.includes('Database error')) setErro(empresa ? 'Não foi possível criar a conta. Confira o CNPJ: ele pode já estar cadastrado.' : 'Não foi possível criar a conta. Confira os dados.');
      else setErro('Não foi possível criar a conta. Confira os dados.');
      return;
    }
    if (!data.session) {
      setLoading(false);
      setAviso('Conta criada! Enviamos um link de confirmação para o seu e-mail. Confirme e depois entre.');
      return;
    }
    router.replace(empresa ? '/empresa' : '/candidato/perfil');
  }

  return (
    <main className="min-h-[100dvh] px-6 pb-10 pt-6">
      <Link href="/escolher" aria-label="Voltar" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow"><ChevronLeft /></Link>
      <h1 className="mt-6 text-3xl font-extrabold text-brand-800">{empresa ? 'Cadastro da empresa' : 'Cadastro do profissional'}</h1>
      <p className="mt-1 text-ink/70">{empresa ? 'Suas vagas aparecem para os profissionais da sua cidade.' : 'Você vê as vagas da cidade que escolher aqui.'}</p>

      {aviso ? (
        <div className="card mt-8 p-5">
          <p className="font-semibold text-brand-800">{aviso}</p>
          <Link href="/login" className="btn-primary mt-5">Ir para o login</Link>
        </div>
      ) : (
        <form onSubmit={criar} className="mt-6 space-y-4">
          {empresa && (
            <div>
              <input className="input" inputMode="numeric" placeholder="CNPJ da empresa" value={mascaraCnpj(cnpj)} onChange={(e) => setCnpj(e.target.value)} maxLength={18} required aria-label="CNPJ" />
              {consulta.estado === 'buscando' && <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-brand-700"><Loader2 size={16} className="animate-spin" /> Consultando a Receita Federal...</p>}
              {consulta.estado === 'ok' && consulta.dados && (
                <p className="mt-2 flex items-start gap-2 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"><ShieldCheck size={18} className="mt-0.5 shrink-0" /> <span>{consulta.dados.razaoSocial}<br /><span className="font-medium">Situação: ativa</span></span></p>
              )}
              {consulta.estado === 'inativa' && consulta.dados && (
                <p className="mt-2 flex items-start gap-2 rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700" role="alert"><ShieldAlert size={18} className="mt-0.5 shrink-0" /> <span>{consulta.dados.razaoSocial}<br />Situação na Receita: {consulta.dados.situacao.toLowerCase()}. Só empresas ativas podem se cadastrar.</span></p>
              )}
              {consulta.estado === 'erro' && <p className="mt-2 text-sm font-semibold text-amber-800" role="alert">{consulta.msg}</p>}
            </div>
          )}
          {empresa && <input className="input" maxLength={120} placeholder="Nome da empresa" value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} required />}
          <input className="input" maxLength={120} placeholder={empresa ? 'Seu nome (responsável)' : 'Seu nome completo'} value={nome} onChange={(e) => setNome(e.target.value)} required />
          <input className="input" type="tel" inputMode="tel" maxLength={20} placeholder="WhatsApp com DDD" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />

          <div>
            <p className="mb-2 text-sm font-bold text-brand-900">{empresa ? 'Cidade da empresa (onde as vagas vão aparecer)' : 'Sua cidade (onde você procura emprego)'}</p>
            <CidadeSelect value={cidade} onChange={setCidade} sugestao={empresa && consulta.dados?.municipio && consulta.dados?.uf ? { municipio: consulta.dados.municipio, uf: consulta.dados.uf } : null} />
          </div>

          <input className="input" type="email" maxLength={254} placeholder="E-mail" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="input" type="password" minLength={8} maxLength={72} placeholder="Senha (mín. 8, com letras e números)" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} required />

          <label className="flex items-start gap-3 text-sm leading-snug text-ink/80">
            <input type="checkbox" checked={aceitou} onChange={(e) => setAceitou(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-brand-700" />
            <span>
              Li e aceito os <Link href="/privacidade" target="_blank" className="font-bold text-brand-700 underline">Termos e a Política de Privacidade</Link>.
              {empresa
                ? ' Sei que só vou ver os dados dos profissionais que se candidatarem às minhas vagas e que devo usá-los apenas para contratação.'
                : ' Sei que, ao me candidatar, a empresa da vaga verá meu nome, WhatsApp, cidade e perfil profissional.'}
            </span>
          </label>
          {erro && <p className="text-sm font-semibold text-rose-600" role="alert">{erro}</p>}
          <button className="btn-primary" disabled={loading || consulta.estado === 'buscando'}>{loading ? 'Criando...' : 'Criar conta'}</button>
        </form>
      )}
    </main>
  );
}

export default function Cadastro() {
  return (
    <Suspense fallback={null}>
      <Form />
    </Suspense>
  );
}
