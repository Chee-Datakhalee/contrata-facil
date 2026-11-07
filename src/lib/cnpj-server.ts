import type { DadosCnpj } from './cnpj';

export type ResultadoCnpj = { ok: boolean; status?: number; erro?: string; dados?: DadosCnpj };

// Consulta a Receita Federal via BrasilAPI (gratuita). Só roda no servidor.
export async function consultarCnpj(cnpj: string): Promise<ResultadoCnpj> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      signal: ctrl.signal,
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (r.status === 404) return { ok: false, status: 404, erro: 'CNPJ não encontrado na Receita Federal.' };
    if (r.status === 429) return { ok: false, status: 429, erro: 'O serviço de consulta está ocupado. Tente de novo em instantes.' };
    if (!r.ok) return { ok: false, status: 502, erro: 'Não foi possível consultar a Receita agora.' };

    const j: any = await r.json();
    const situacao = String(j.descricao_situacao_cadastral ?? '').toUpperCase();
    const ativa = j.situacao_cadastral === 2 || situacao === 'ATIVA';
    return {
      ok: true,
      dados: {
        cnpj,
        razaoSocial: String(j.razao_social ?? '').slice(0, 200),
        nomeFantasia: j.nome_fantasia ? String(j.nome_fantasia).slice(0, 200) : null,
        situacao: situacao || 'DESCONHECIDA',
        ativa,
        municipio: j.municipio ? String(j.municipio).slice(0, 100) : null,
        uf: j.uf ? String(j.uf).slice(0, 2) : null,
      },
    };
  } catch {
    return { ok: false, status: 502, erro: 'Não foi possível consultar a Receita agora.' };
  } finally {
    clearTimeout(timer);
  }
}
