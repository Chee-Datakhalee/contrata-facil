'use client';
import { useEffect, useState } from 'react';
import { UFS } from '@/lib/constants';

const cache = new Map<string, string[]>();
const norm = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// Cidade no formato "Nome - UF", sempre escrita igual (lista oficial do IBGE).
// É esse texto idêntico que faz a vaga da empresa aparecer para os candidatos da mesma cidade.
export default function CidadeSelect({
  value, onChange, sugestao,
}: {
  value: string;
  onChange: (v: string) => void;
  sugestao?: { municipio: string; uf: string } | null;
}) {
  const [uf, setUf] = useState(value?.split(' - ')[1] || 'SP');
  const [cidades, setCidades] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const nome = value?.split(' - ')[0] || '';

  useEffect(() => {
    const u = value?.split(' - ')[1];
    if (u && u !== uf) setUf(u);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (sugestao?.uf && UFS.includes(sugestao.uf) && !value) setUf(sugestao.uf);
  }, [sugestao]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let vivo = true;
    (async () => {
      if (cache.has(uf)) { setCidades(cache.get(uf)!); setErro(false); return; }
      setLoading(true); setErro(false);
      try {
        const r = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`);
        if (!r.ok) throw new Error('ibge');
        const nomes: string[] = (await r.json()).map((m: any) => String(m.nome));
        cache.set(uf, nomes);
        if (vivo) setCidades(nomes);
      } catch {
        if (vivo) setErro(true);
      } finally {
        if (vivo) setLoading(false);
      }
    })();
    return () => { vivo = false; };
  }, [uf, tentativa]);

  // preenche a cidade sugerida (ex.: vinda do CNPJ) quando a lista carregar
  useEffect(() => {
    if (!sugestao || value || sugestao.uf !== uf || !cidades.length) return;
    const achou = cidades.find((c) => norm(c) === norm(sugestao.municipio));
    if (achou) onChange(`${achou} - ${uf}`);
  }, [cidades, sugestao, uf]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="grid grid-cols-[88px_1fr] gap-3">
        <select className="input" value={uf} onChange={(e) => { setUf(e.target.value); onChange(''); }} aria-label="Estado">
          {UFS.map((u) => <option key={u}>{u}</option>)}
        </select>
        <select className="input" value={cidades.includes(nome) ? nome : ''} onChange={(e) => onChange(e.target.value ? `${e.target.value} - ${uf}` : '')} aria-label="Cidade" disabled={loading || erro}>
          <option value="">{loading ? 'Carregando cidades...' : 'Selecione a cidade'}</option>
          {cidades.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {erro && (
        <p className="mt-2 text-sm font-semibold text-rose-600" role="alert">
          Não foi possível carregar as cidades. <button type="button" onClick={() => setTentativa(tentativa + 1)} className="underline">Tentar de novo</button>
        </p>
      )}
    </div>
  );
}
