export type Req = { label: string; essential?: boolean };

export type Company = {
  id: string;
  owner_id: string;
  name: string;
  city: string | null;
  about: string | null;
  logo_url: string | null;
  cover_url: string | null;
  plan_status: string;
  cnpj?: string | null;
  razao_social?: string | null;
  cnpj_verificado?: boolean;
};

export type Job = {
  id: string;
  company_id: string;
  title: string;
  city: string;
  description: string | null;
  requirements: Req[];
  benefits: string[];
  salary_mode: 'fixo' | 'faixa' | 'combinar';
  salary_min: number | null;
  salary_max: number | null;
  contract_type: string | null;
  schedule: string | null;
  experience: string | null;
  status: string;
  created_at: string;
  companies?: Company;
};

export type Candidate = {
  user_id: string;
  age: number | null;
  exp_years: number | null;
  exp_area: string | null;
  education: string | null;
  availability: string | null;
  skills: Record<string, number>;
  profiles?: { full_name: string | null; phone: string | null; city: string | null; avatar_url: string | null };
};

export type Application = {
  id: string;
  job_id: string;
  candidate_id: string;
  status: 'novo' | 'em_analise' | 'contatado' | 'descartado' | 'contratado';
  created_at: string;
  candidates?: Candidate;
  jobs?: Job;
};
