import type { DadosCnpj } from './cnpj';

export type ResultadoCnpj = { ok: boolean; status?: number; erro?: string; detalhe?: string; dados?: DadosCnpj };

type Parcial = Omit<DadosCnpj, 'cnpj'>;
type Fonte = { nome: string; url: (c: string) => string; ler: (j: any) => Parcial | null };

const txt = (v: any, max = 200) => (v === null || v === undefined || v === '' ? null : String(v).slice(0, max));
// igualdade exata: "INATIVA" nunca pode contar como "ATIVA"
const ehAtiva = (s: string) => s.trim().toUpperCase() === 'ATIVA';

// Fontes gratuitas da Receita Federal, tentadas em ordem. A primeira que responder vale.
// Se uma bloquear o servidor (ou estiver fora do ar), a próxima assume.
const FONTES: Fonte[] = [
  {
    nome: 'brasilapi',
    url: (c) => `https://brasilapi.com.br/api/cnpj/v1/${c}`,
    ler: (j) => {
      if (!j?.razao_social) return null;
      const s = String(j.descricao_situacao_cadastral ?? '').toUpperCase();
      return { razaoSocial: txt(j.razao_social)!, nomeFantasia: txt(j.nome_fantasia), situacao: s || 'DESCONHECIDA', ativa: j.situacao_cadastral === 2 || ehAtiva(s), municipio: txt(j.municipio, 100), uf: txt(j.uf, 2) };
    },
  },
  {
    nome: 'cnpjws',
    url: (c) => `https://publica.cnpj.ws/cnpj/${c}`,
    ler: (j) => {
      const e = j?.estabelecimento;
      if (!j?.razao_social || !e) return null;
      const s = String(e.situacao_cadastral ?? '').toUpperCase();
      return { razaoSocial: txt(j.razao_social)!, nomeFantasia: txt(e.nome_fantasia), situacao: s || 'DESCONHECIDA', ativa: ehAtiva(s), municipio: txt(e.cidade?.nome, 100), uf: txt(e.estado?.sigla, 2) };
    },
  },
  {
    nome: 'receitaws',
    url: (c) => `https://receitaws.com.br/v1/cnpj/${c}`,
    ler: (j) => {
      if (!j || j.status === 'ERROR' || !j.nome) return null;
      const s = String(j.situacao ?? '').toUpperCase();
      return { razaoSocial: txt(j.nome)!, nomeFantasia: txt(j.fantasia), situacao: s || 'DESCONHECIDA', ativa: ehAtiva(s), municipio: txt(j.municipio, 100), uf: txt(j.uf, 2) };
    },
  },
  {
    nome: 'cnpja',
    url: (c) => `https://open.cnpja.com/office/${c}`,
    ler: (j) => {
      const nome = j?.company?.name;
      if (!nome) return null;
      const s = String(j?.status?.text ?? '').toUpperCase();
      return { razaoSocial: txt(nome)!, nomeFantasia: txt(j.alias), situacao: s || 'DESCONHECIDA', ativa: j?.status?.id === 2 || ehAtiva(s), municipio: txt(j?.address?.city, 100), uf: txt(j?.address?.state, 2) };
    },
  },
];

const MSG_FALHA = 'Não foi possível consultar a Receita agora. Você pode continuar o cadastro e a verificação será feita depois.';

export async function consultarCnpj(cnpj: string): Promise<ResultadoCnpj> {
  const detalhes: string[] = [];
  let naoEncontrado = 0;

  for (const f of FONTES) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    try {
      const r = await fetch(f.url(cnpj), {
        signal: ctrl.signal,
        cache: 'no-store',
        headers: { Accept: 'application/json', 'User-Agent': 'ContrataFacil/1.0 (verificacao de CNPJ)' },
      });
      if (r.status === 404) { naoEncontrado++; detalhes.push(`${f.nome}:404`); continue; }
      if (!r.ok) { detalhes.push(`${f.nome}:${r.status}`); console.error(`[cnpj] ${f.nome} respondeu ${r.status}`); continue; }
      const parcial = f.ler(await r.json());
      if (!parcial) { detalhes.push(`${f.nome}:formato`); console.error(`[cnpj] ${f.nome} respondeu num formato inesperado`); continue; }
      return { ok: true, dados: { cnpj, ...parcial } };
    } catch (e: any) {
      detalhes.push(`${f.nome}:${e?.name === 'AbortError' ? 'timeout' : 'rede'}`);
      console.error(`[cnpj] ${f.nome} falhou: ${e?.name || e}`);
    } finally {
      clearTimeout(timer);
    }
  }

  const detalhe = detalhes.join(', ');
  if (naoEncontrado > 0) return { ok: false, status: 404, erro: 'CNPJ não encontrado na Receita Federal.', detalhe };
  return { ok: false, status: 502, erro: MSG_FALHA, detalhe };
}
