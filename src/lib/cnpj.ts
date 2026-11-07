// Utilitários de CNPJ usados no navegador e no servidor.
export const soDigitos = (v: string) => (v || '').replace(/\D/g, '').slice(0, 14);

export function mascaraCnpj(v: string) {
  const d = soDigitos(v);
  let o = d.slice(0, 2);
  if (d.length > 2) o += '.' + d.slice(2, 5);
  if (d.length > 5) o += '.' + d.slice(5, 8);
  if (d.length > 8) o += '/' + d.slice(8, 12);
  if (d.length > 12) o += '-' + d.slice(12, 14);
  return o;
}

// Valida os dígitos verificadores (mesma regra do banco de dados)
export function cnpjValido(v: string) {
  const d = soDigitos(v);
  if (!/^\d{14}$/.test(d) || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (base: string, pesos: number[]) => {
    const soma = base.split('').reduce((acc, n, i) => acc + Number(n) * pesos[i], 0);
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = calc(d.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calc(d.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === Number(d[12]) && d2 === Number(d[13]);
}

export type DadosCnpj = {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  situacao: string;
  ativa: boolean;
  municipio: string | null;
  uf: string | null;
};
