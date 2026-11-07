-- Contrata Fácil — schema inicial
-- Rode no SQL Editor do Supabase.

-- ============ TABELAS ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('empresa','profissional')),
  full_name text,
  phone text,
  city text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(id) on delete cascade,
  name text not null,
  city text,
  about text,
  logo_url text,
  cover_url text,
  plan_status text not null default 'ativo' check (plan_status in ('ativo','pendente','cancelado')),
  created_at timestamptz not null default now()
);

create table if not exists public.candidates (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  age int,
  exp_years int,
  exp_area text,
  education text,
  availability text,
  skills jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  city text not null,
  description text,
  requirements jsonb not null default '[]'::jsonb,
  benefits text[] not null default '{}',
  salary_mode text not null default 'faixa' check (salary_mode in ('fixo','faixa','combinar')),
  salary_min numeric,
  salary_max numeric,
  contract_type text default 'CLT',
  schedule text,
  experience text,
  status text not null default 'ativa' check (status in ('ativa','pausada','encerrada')),
  created_at timestamptz not null default now()
);
create index if not exists jobs_city_status_idx on public.jobs (city, status);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid not null references public.candidates(user_id) on delete cascade,
  status text not null default 'novo' check (status in ('novo','em_analise','contatado','descartado','contratado')),
  created_at timestamptz not null default now(),
  unique (job_id, candidate_id)
);
create index if not exists applications_candidate_idx on public.applications (candidate_id, created_at);

create table if not exists public.saved_jobs (
  candidate_id uuid not null references public.candidates(user_id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (candidate_id, job_id)
);

create table if not exists public.app_settings (
  key text primary key,
  value text
);

-- Contador do topo do app. Valor preenchido = mostra "+N vagas encontradas hoje".
-- Para passar a mostrar o número REAL de vagas abertas: update public.app_settings set value = '' where key = 'contador_vagas_manual';
insert into public.app_settings (key, value) values ('contador_vagas_manual', '2000')
on conflict (key) do nothing;

-- ============ FUNÇÕES AUXILIARES (security definer evita recursão de RLS) ============
create or replace function public.owns_job(p_job uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.jobs j
    join public.companies c on c.id = j.company_id
    where j.id = p_job and c.owner_id = auth.uid()
  );
$$;

create or replace function public.company_sees_candidate(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.applications a
    join public.jobs j on j.id = a.job_id
    join public.companies c on c.id = j.company_id
    where a.candidate_id = p_user and c.owner_id = auth.uid()
  );
$$;

-- ============ CRIAÇÃO AUTOMÁTICA DE PERFIL NO CADASTRO ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role text := coalesce(new.raw_user_meta_data->>'role', 'profissional');
  v_name text := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  v_city text := new.raw_user_meta_data->>'city';
begin
  insert into public.profiles (id, role, full_name, phone, city)
  values (new.id, v_role, v_name, new.raw_user_meta_data->>'phone', v_city);

  if v_role = 'empresa' then
    insert into public.companies (owner_id, name, city)
    values (new.id, coalesce(new.raw_user_meta_data->>'company_name', v_name), v_city);
  else
    insert into public.candidates (user_id) values (new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ RPCs ============
-- Candidatura com limite de 2 por dia (fuso de São Paulo)
create or replace function public.candidatar(p_job_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_count int;
  v_start timestamptz := date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';
begin
  if auth.uid() is null then raise exception 'nao_autenticado'; end if;
  if not exists (select 1 from public.candidates where user_id = auth.uid()) then
    raise exception 'sem_perfil';
  end if;
  if not exists (select 1 from public.jobs where id = p_job_id and status = 'ativa') then
    raise exception 'vaga_indisponivel';
  end if;
  if exists (select 1 from public.applications where job_id = p_job_id and candidate_id = auth.uid()) then
    raise exception 'ja_candidatou';
  end if;

  select count(*) into v_count from public.applications
   where candidate_id = auth.uid() and created_at >= v_start;
  if v_count >= 2 then raise exception 'limite_diario'; end if;

  insert into public.applications (job_id, candidate_id) values (p_job_id, auth.uid());
  return json_build_object('restantes', greatest(0, 2 - (v_count + 1)));
end;
$$;

-- Quantas candidaturas o profissional ainda pode fazer hoje
create or replace function public.candidaturas_restantes()
returns int language sql stable security definer set search_path = public as $$
  select greatest(0, 2 - count(*))::int from public.applications
   where candidate_id = auth.uid()
     and created_at >= (date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo');
$$;

-- Contador do topo (público, usado até na tela inicial)
create or replace function public.vagas_contador()
returns json language plpgsql stable security definer set search_path = public as $$
declare
  v_manual text;
  v_real int;
begin
  select value into v_manual from public.app_settings where key = 'contador_vagas_manual';
  select count(*) into v_real from public.jobs where status = 'ativa';
  if v_manual is not null and v_manual <> '' then
    return json_build_object('total', v_manual::int, 'manual', true);
  end if;
  return json_build_object('total', v_real, 'manual', false);
end;
$$;

grant execute on function public.vagas_contador() to anon, authenticated;
grant execute on function public.candidatar(uuid) to authenticated;
grant execute on function public.candidaturas_restantes() to authenticated;

-- ============ RLS ============
alter table public.profiles     enable row level security;
alter table public.companies    enable row level security;
alter table public.candidates   enable row level security;
alter table public.jobs         enable row level security;
alter table public.applications enable row level security;
alter table public.saved_jobs   enable row level security;
alter table public.app_settings enable row level security;

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.company_sees_candidate(id));
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- companies (todo usuário logado vê nome/logo; só o dono edita)
drop policy if exists companies_select on public.companies;
create policy companies_select on public.companies for select to authenticated using (true);
drop policy if exists companies_update on public.companies;
create policy companies_update on public.companies for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- candidates
drop policy if exists candidates_select on public.candidates;
create policy candidates_select on public.candidates for select to authenticated
  using (user_id = auth.uid() or public.company_sees_candidate(user_id));
drop policy if exists candidates_update on public.candidates;
create policy candidates_update on public.candidates for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- jobs
drop policy if exists jobs_select on public.jobs;
create policy jobs_select on public.jobs for select to authenticated
  using (status = 'ativa' or public.owns_job(id));
drop policy if exists jobs_insert on public.jobs;
create policy jobs_insert on public.jobs for insert to authenticated
  with check (exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid() and c.plan_status = 'ativo'));
drop policy if exists jobs_update on public.jobs;
create policy jobs_update on public.jobs for update to authenticated
  using (public.owns_job(id)) with check (public.owns_job(id));
drop policy if exists jobs_delete on public.jobs;
create policy jobs_delete on public.jobs for delete to authenticated
  using (public.owns_job(id));

-- applications (candidatar só pela RPC; empresa atualiza status)
drop policy if exists applications_select on public.applications;
create policy applications_select on public.applications for select to authenticated
  using (candidate_id = auth.uid() or public.owns_job(job_id));
drop policy if exists applications_update on public.applications;
create policy applications_update on public.applications for update to authenticated
  using (public.owns_job(job_id)) with check (public.owns_job(job_id));

-- saved_jobs
drop policy if exists saved_all on public.saved_jobs;
create policy saved_all on public.saved_jobs for all to authenticated
  using (candidate_id = auth.uid()) with check (candidate_id = auth.uid());

-- app_settings: sem acesso direto (leitura só pela função vagas_contador)
