-- Contrata Fácil — regra de cidade + CNPJ verificado
-- Rode DEPOIS da 001 e da 002. É seguro rodar mais de uma vez.

-- =====================================================================
-- 1) CIDADE: formato único "Nome da Cidade - UF" (vem da lista do IBGE no app)
-- =====================================================================
alter table public.profiles  drop constraint if exists profiles_city_fmt;
alter table public.profiles  add constraint profiles_city_fmt  check (city is null or city ~ '^.{2,70} - [A-Z]{2}$');
alter table public.companies drop constraint if exists companies_city_fmt;
alter table public.companies add constraint companies_city_fmt check (city is null or city ~ '^.{2,70} - [A-Z]{2}$');
alter table public.jobs      drop constraint if exists jobs_city_fmt;
alter table public.jobs      add constraint jobs_city_fmt      check (city ~ '^.{2,70} - [A-Z]{2}$');

-- A vaga SEMPRE herda a cidade da empresa (ninguém publica vaga em cidade diferente da sua)
create or replace function public.job_city_da_empresa()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_city text;
begin
  select city into v_city from public.companies where id = new.company_id;
  if v_city is null then raise exception 'empresa_sem_cidade'; end if;
  new.city := v_city;
  return new;
end $$;
drop trigger if exists trg_job_city on public.jobs;
create trigger trg_job_city before insert or update of company_id, city on public.jobs
  for each row execute function public.job_city_da_empresa();

-- Se a empresa mudar de cidade, as vagas acompanham
create or replace function public.propaga_cidade_empresa()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.city is distinct from old.city then
    update public.jobs set city = new.city where company_id = new.id;
  end if;
  return new;
end $$;
drop trigger if exists trg_company_city on public.companies;
create trigger trg_company_city after update of city on public.companies
  for each row execute function public.propaga_cidade_empresa();

-- Candidato só vê vaga ATIVA da SUA cidade (ou vaga em que já se candidatou / que salvou)
create or replace function public.vaga_visivel(p_job uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.jobs j
    where j.id = p_job and (
      (j.status = 'ativa' and j.city is not distinct from (select p.city from public.profiles p where p.id = auth.uid()))
      or exists (select 1 from public.applications a where a.job_id = j.id and a.candidate_id = auth.uid())
      or exists (select 1 from public.saved_jobs s where s.job_id = j.id and s.candidate_id = auth.uid())
    )
  );
$$;

-- Candidatura só vale para vaga ativa da cidade do candidato (a função roda como admin, então a checagem é explícita)
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
  if not exists (
    select 1 from public.jobs j join public.profiles p on p.id = auth.uid()
    where j.id = p_job_id and j.status = 'ativa' and j.city = p.city
  ) then
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

-- Favoritos: só dá para salvar vaga que o candidato consegue ver (mesma cidade)
drop policy if exists saved_all on public.saved_jobs;
drop policy if exists saved_select on public.saved_jobs;
drop policy if exists saved_insert on public.saved_jobs;
drop policy if exists saved_delete on public.saved_jobs;
create policy saved_select on public.saved_jobs for select to authenticated using (candidate_id = auth.uid());
create policy saved_insert on public.saved_jobs for insert to authenticated
  with check (candidate_id = auth.uid() and public.vaga_visivel(job_id));
create policy saved_delete on public.saved_jobs for delete to authenticated using (candidate_id = auth.uid());

-- a cidade da vaga não é mais editável pelo app (vem da empresa)
revoke update (city) on public.jobs from authenticated;

-- =====================================================================
-- 2) CNPJ: validado no cadastro e confirmado na Receita (via servidor)
-- =====================================================================
create or replace function public.valida_cnpj(p text)
returns boolean language plpgsql immutable as $$
declare
  d  text := coalesce(p, '');
  w1 int[] := array[5,4,3,2,9,8,7,6,5,4,3,2];
  w2 int[] := array[6,5,4,3,2,9,8,7,6,5,4,3,2];
  s int; r int; i int; d1 int; d2 int;
begin
  if d !~ '^[0-9]{14}$' then return false; end if;
  if d ~ '^([0-9])\1{13}$' then return false; end if;
  s := 0;
  for i in 1..12 loop s := s + substr(d, i, 1)::int * w1[i]; end loop;
  r := s % 11; d1 := case when r < 2 then 0 else 11 - r end;
  if d1 <> substr(d, 13, 1)::int then return false; end if;
  s := 0;
  for i in 1..13 loop s := s + substr(d, i, 1)::int * w2[i]; end loop;
  r := s % 11; d2 := case when r < 2 then 0 else 11 - r end;
  return d2 = substr(d, 14, 1)::int;
end $$;

alter table public.companies add column if not exists cnpj text;
alter table public.companies add column if not exists razao_social text;
alter table public.companies add column if not exists cnpj_verificado boolean not null default false;
alter table public.companies add column if not exists cnpj_verificado_em timestamptz;
alter table public.companies add column if not exists cnpj_ultima_tentativa timestamptz;

alter table public.companies drop constraint if exists companies_cnpj_valido;
alter table public.companies add constraint companies_cnpj_valido check (cnpj is null or public.valida_cnpj(cnpj));
-- um CNPJ = uma conta (impede cadastro duplicado e se passar por outra empresa)
create unique index if not exists companies_cnpj_unico on public.companies (cnpj) where cnpj is not null;

-- Cadastro: empresa precisa de CNPJ válido (dígitos verificadores); profissional ignora
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role  text := case when new.raw_user_meta_data->>'role' = 'empresa' then 'empresa' else 'profissional' end;
  v_name  text := left(coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)), 120);
  v_city  text := left(new.raw_user_meta_data->>'city', 80);
  v_phone text := left(new.raw_user_meta_data->>'phone', 20);
  v_cnpj  text := regexp_replace(coalesce(new.raw_user_meta_data->>'cnpj', ''), '[^0-9]', '', 'g');
begin
  if coalesce(new.raw_user_meta_data->>'aceitou_termos', '') <> 'true' then
    raise exception 'termos_nao_aceitos';
  end if;
  if v_city is null or v_city !~ '^.{2,70} - [A-Z]{2}$' then
    raise exception 'cidade_invalida';
  end if;

  insert into public.profiles (id, role, full_name, phone, city, termos_aceitos_em)
  values (new.id, v_role, v_name, v_phone, v_city, now());

  if v_role = 'empresa' then
    if not public.valida_cnpj(v_cnpj) then raise exception 'cnpj_invalido'; end if;
    insert into public.companies (owner_id, name, city, cnpj)
    values (new.id, left(coalesce(nullif(trim(new.raw_user_meta_data->>'company_name'), ''), v_name), 120), v_city, v_cnpj);
  else
    insert into public.candidates (user_id) values (new.id);
  end if;
  return new;
end $$;

-- Só empresa do próprio usuário, com CNPJ VERIFICADO e plano ativo, pode publicar vaga
create or replace function public.empresa_ativa(p_company uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.companies c
    where c.id = p_company and c.owner_id = auth.uid()
      and c.plan_status = 'ativo' and c.cnpj_verificado
  );
$$;

-- Candidatos podem ver o selo "empresa verificada", nunca o CNPJ (só o dono lê via minha_empresa())
revoke select on public.companies from authenticated;
grant select (id, name, city, about, logo_url, cover_url, created_at, cnpj_verificado) on public.companies to authenticated;
-- cnpj, razao_social e controle de verificação: o app NÃO escreve (só o servidor, com a service_role)
-- (a permissão de update continua apenas em name, city, about)

grant execute on function public.valida_cnpj(text) to authenticated;
grant execute on function public.candidatar(uuid)   to authenticated;
