-- Contrata Fácil — endurecimento de segurança e privacidade (LGPD)
-- Rode DEPOIS da 001. É seguro rodar mais de uma vez.

-- =====================================================================
-- 1) NEGAR POR PADRÃO: ninguém acessa nada que não seja liberado abaixo
-- =====================================================================
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- =====================================================================
-- 2) VALIDAÇÃO DE DADOS NO BANCO (o front pode ser burlado, o banco não)
-- =====================================================================
alter table public.profiles add column if not exists termos_aceitos_em timestamptz;

create or replace function public.valida_requisitos(r jsonb)
returns boolean language plpgsql immutable as $$
declare el jsonb;
begin
  if jsonb_typeof(r) <> 'array' then return false; end if;
  if jsonb_array_length(r) > 20 then return false; end if;
  for el in select * from jsonb_array_elements(r) loop
    if jsonb_typeof(el) <> 'object' then return false; end if;
    if coalesce(jsonb_typeof(el->'label'), '') <> 'string' then return false; end if;
    if char_length(el->>'label') not between 1 and 60 then return false; end if;
    if exists (select 1 from jsonb_object_keys(el) k where k not in ('label','essential')) then return false; end if;
    if el ? 'essential' and jsonb_typeof(el->'essential') <> 'boolean' then return false; end if;
  end loop;
  return true;
end $$;

create or replace function public.valida_skills(s jsonb)
returns boolean language plpgsql immutable as $$
declare k text; v jsonb;
begin
  if jsonb_typeof(s) <> 'object' then return false; end if;
  if (select count(*) from jsonb_object_keys(s)) > 30 then return false; end if;
  for k, v in select * from jsonb_each(s) loop
    if char_length(k) > 60 then return false; end if;
    if jsonb_typeof(v) <> 'number' then return false; end if;
    if (v #>> '{}')::numeric < 0 or (v #>> '{}')::numeric > 100 then return false; end if;
  end loop;
  return true;
end $$;

alter table public.profiles drop constraint if exists profiles_len;
alter table public.profiles add constraint profiles_len check (
  char_length(coalesce(full_name,'')) <= 120 and char_length(coalesce(phone,'')) <= 20 and char_length(coalesce(city,'')) <= 80
);

alter table public.companies drop constraint if exists companies_len;
alter table public.companies add constraint companies_len check (
  char_length(name) between 1 and 120 and char_length(coalesce(city,'')) <= 80 and char_length(coalesce(about,'')) <= 2000
);

alter table public.candidates drop constraint if exists candidates_val;
alter table public.candidates add constraint candidates_val check (
  (age is null or age between 14 and 100)
  and (exp_years is null or exp_years between 0 and 80)
  and char_length(coalesce(exp_area,'')) <= 80
  and char_length(coalesce(education,'')) <= 40
  and char_length(coalesce(availability,'')) <= 40
  and public.valida_skills(skills)
);

alter table public.jobs drop constraint if exists jobs_val;
alter table public.jobs add constraint jobs_val check (
  char_length(title) between 1 and 120
  and char_length(city) <= 80
  and char_length(coalesce(description,'')) <= 4000
  and public.valida_requisitos(requirements)
  and coalesce(array_length(benefits,1), 0) <= 12
  and (salary_min is null or (salary_min >= 0 and salary_min < 10000000))
  and (salary_max is null or (salary_max >= coalesce(salary_min,0) and salary_max < 10000000))
  and char_length(coalesce(contract_type,'')) <= 30
  and char_length(coalesce(schedule,'')) <= 80
  and char_length(coalesce(experience,'')) <= 30
);

-- Anti-spam: no máximo 20 vagas ativas por empresa
create or replace function public.limite_vagas_ativas()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'ativa' and (
    select count(*) from public.jobs
     where company_id = new.company_id and status = 'ativa' and id <> new.id
  ) >= 20 then
    raise exception 'limite_vagas';
  end if;
  return new;
end $$;
drop trigger if exists trg_limite_vagas on public.jobs;
create trigger trg_limite_vagas before insert or update of status on public.jobs
  for each row execute function public.limite_vagas_ativas();

-- =====================================================================
-- 3) CADASTRO: papel sanitizado + aceite dos termos (LGPD) obrigatório
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role  text := case when new.raw_user_meta_data->>'role' = 'empresa' then 'empresa' else 'profissional' end;
  v_name  text := left(coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)), 120);
  v_city  text := left(new.raw_user_meta_data->>'city', 80);
  v_phone text := left(new.raw_user_meta_data->>'phone', 20);
begin
  if coalesce(new.raw_user_meta_data->>'aceitou_termos', '') <> 'true' then
    raise exception 'termos_nao_aceitos';
  end if;

  insert into public.profiles (id, role, full_name, phone, city, termos_aceitos_em)
  values (new.id, v_role, v_name, v_phone, v_city, now());

  if v_role = 'empresa' then
    insert into public.companies (owner_id, name, city)
    values (new.id, left(coalesce(nullif(trim(new.raw_user_meta_data->>'company_name'), ''), v_name), 120), v_city);
  else
    insert into public.candidates (user_id) values (new.id);
  end if;
  return new;
end $$;

-- =====================================================================
-- 4) VISIBILIDADE: cada um só enxerga o que precisa
-- =====================================================================
-- Candidato vê vaga ativa, ou vaga em que já se candidatou / que salvou (mesmo se encerrada)
create or replace function public.vaga_visivel(p_job uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.jobs j
    where j.id = p_job and (
      j.status = 'ativa'
      or exists (select 1 from public.applications a where a.job_id = j.id and a.candidate_id = auth.uid())
      or exists (select 1 from public.saved_jobs s where s.job_id = j.id and s.candidate_id = auth.uid())
    )
  );
$$;

-- Empresa só aparece para quem vê alguma vaga dela (ou para o próprio dono)
create or replace function public.empresa_visivel(p_company uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.jobs j where j.company_id = p_company and public.vaga_visivel(j.id));
$$;

drop policy if exists jobs_select on public.jobs;
create policy jobs_select on public.jobs for select to authenticated
  using (public.owns_job(id) or public.vaga_visivel(id));

drop policy if exists companies_select on public.companies;
create policy companies_select on public.companies for select to authenticated
  using (owner_id = auth.uid() or public.empresa_visivel(id));

-- Dono lê a própria empresa completa (inclui plano) por função
create or replace function public.minha_empresa()
returns setof public.companies language sql stable security definer set search_path = public as $$
  select * from public.companies where owner_id = auth.uid();
$$;

-- Só empresa do próprio usuário, com plano ativo, pode publicar
create or replace function public.empresa_ativa(p_company uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.companies c where c.id = p_company and c.owner_id = auth.uid() and c.plan_status = 'ativo');
$$;

drop policy if exists jobs_insert on public.jobs;
create policy jobs_insert on public.jobs for insert to authenticated
  with check (public.empresa_ativa(company_id));

-- =====================================================================
-- 5) PERMISSÕES POR COLUNA: papel, plano e donos NUNCA são editáveis pelo app
-- =====================================================================
-- profiles: terceiros nunca leem termos_aceitos_em
grant select (id, role, full_name, phone, city, avatar_url, created_at) on public.profiles to authenticated;
grant update (full_name, phone, city) on public.profiles to authenticated;

-- companies: terceiros nunca leem owner_id nem plan_status (o dono lê tudo via minha_empresa())
grant select (id, name, city, about, logo_url, cover_url, created_at) on public.companies to authenticated;
grant update (name, city, about) on public.companies to authenticated;

grant select on public.candidates to authenticated;
grant update (age, exp_years, exp_area, education, availability, skills, updated_at) on public.candidates to authenticated;

grant select on public.jobs to authenticated;
grant insert (company_id, title, city, description, requirements, benefits, salary_mode, salary_min, salary_max, contract_type, schedule, experience) on public.jobs to authenticated;
grant update (title, city, description, requirements, benefits, salary_mode, salary_min, salary_max, contract_type, schedule, experience, status) on public.jobs to authenticated;
grant delete on public.jobs to authenticated;

grant select on public.applications to authenticated;
grant update (status) on public.applications to authenticated;

grant select, delete on public.saved_jobs to authenticated;
grant insert (candidate_id, job_id) on public.saved_jobs to authenticated;

-- app_settings: nenhum acesso direto (só pela função vagas_contador)

-- =====================================================================
-- 6) DIREITO DE EXCLUSÃO (LGPD): apaga conta e tudo ligado a ela
-- =====================================================================
create or replace function public.excluir_minha_conta()
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'nao_autenticado'; end if;
  delete from auth.users where id = auth.uid();
end $$;

-- =====================================================================
-- 7) EXECUÇÃO DE FUNÇÕES: só o necessário
-- =====================================================================
grant execute on function public.vagas_contador()           to anon, authenticated;
grant execute on function public.candidatar(uuid)           to authenticated;
grant execute on function public.candidaturas_restantes()   to authenticated;
grant execute on function public.excluir_minha_conta()      to authenticated;
-- usadas dentro das políticas RLS (executam como o usuário logado)
grant execute on function public.owns_job(uuid)               to authenticated;
grant execute on function public.company_sees_candidate(uuid) to authenticated;
grant execute on function public.vaga_visivel(uuid)           to authenticated;
grant execute on function public.empresa_visivel(uuid)        to authenticated;
grant execute on function public.minha_empresa()              to authenticated;
grant execute on function public.empresa_ativa(uuid)          to authenticated;
-- validadores usados nas constraints
grant execute on function public.valida_requisitos(jsonb) to authenticated;
grant execute on function public.valida_skills(jsonb)     to authenticated;
