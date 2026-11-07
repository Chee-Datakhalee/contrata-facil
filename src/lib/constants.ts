const BASE = 'https://sophsctlnwdbidpzgquh.supabase.co/storage/v1/object/public/logos';

export const LOGO_DEITADA = `${BASE}/deitada.png`;
export const LOGO_EM_PE = `${BASE}/empe.png`;
export const IMG_CIDADE = `${BASE}/cidade.png`;
// Ilustração do homem e da mulher (tela "Como você quer usar o app?").
// Quando tiver o arquivo, suba no bucket "logos" e coloque a URL aqui.
export const IMG_PERFIS = '';

export const LIMITE_CANDIDATURAS_DIA = 2;

export const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export type Requisito = { label: string; binary?: boolean };

export const REQUISITOS_PADRAO: Requisito[] = [
  { label: 'Experiência em vendas' },
  { label: 'Boa comunicação' },
  { label: 'Negociação' },
  { label: 'Atendimento ao cliente' },
  { label: 'Conhecimento automotivo' },
  { label: 'Informática básica' },
  { label: 'Trabalho em equipe' },
  { label: 'Experiência com metas e comissão' },
  { label: 'CNH categoria B', binary: true },
  { label: 'Disponibilidade aos sábados', binary: true },
];

export const BENEFICIOS_PADRAO = [
  'Comissão',
  'Vale-alimentação',
  'Vale-refeição',
  'Vale-transporte',
  'Treinamento',
  'Plano de carreira',
  'Plano de saúde',
];

export const NIVEIS = [
  { v: 0, l: 'Não tenho' },
  { v: 50, l: 'Básico' },
  { v: 80, l: 'Bom' },
  { v: 100, l: 'Avançado' },
];

export const EXPERIENCIAS = ['Sem experiência', 'Até 1 ano', '1 a 3 anos', 'Mais de 3 anos'];
export const FORMACOES = ['Ensino Fundamental', 'Ensino Médio', 'Técnico', 'Superior incompleto', 'Superior completo'];
export const DISPONIBILIDADES = ['Manhã', 'Tarde', 'Manhã e Tarde', 'Noite', 'Integral', 'Fins de semana'];
export const CONTRATOS = ['CLT', 'PJ', 'Temporário', 'Estágio', 'Freelancer'];
