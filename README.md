# Contrata Fácil

App de vagas (empresa x profissional) — Next.js 14 + Supabase + Tailwind. PWA mobile-first.

## Como rodar

1. **Supabase:** crie o projeto e rode, **nesta ordem**, no SQL Editor: `001_init.sql`, `002_seguranca.sql` e `003_cidade_cnpj.sql` (a 002 e a 003 são obrigatórias: fecham as permissões, validam os dados e aplicam as regras de cidade e CNPJ).
2. **Auth:** em Authentication > Providers > Email, desative "Confirm email" só enquanto testa (em produção, deixe LIGADO).
3. **Variáveis:** copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` (esta é SECRETA, só no servidor: sem ela a verificação do CNPJ não funciona e nenhuma empresa consegue publicar vaga).
4. `npm install` e `npm run dev`.
5. **Vercel:** suba o repo e cadastre as 3 variáveis (a `SUPABASE_SERVICE_ROLE_KEY` **sem** `NEXT_PUBLIC_` no nome, marcada como sensível).

## Contador do topo ("+2.000 vagas encontradas hoje")

Hoje vem de `app_settings.contador_vagas_manual` (valor inicial 2000, só para desenvolvimento).
Para mostrar o número real de vagas abertas:

```sql
update public.app_settings set value = '' where key = 'contador_vagas_manual';
```

Para mudar o número manual: `update public.app_settings set value = '500' where key = 'contador_vagas_manual';`

## Onde editar

- Requisitos e benefícios disponíveis: `src/lib/constants.ts`
- Cálculo de compatibilidade: `src/lib/compat.ts`
- Limite de 2 candidaturas/dia: função `candidatar` no SQL
- Imagens (logo, cidade): URLs em `src/lib/constants.ts` (bucket `logos` do Supabase)
- Ilustração de homem e mulher: coloque a URL em `IMG_PERFIS` (tela "Como você quer usar o app?")

## Pendências da v1 (de propósito)

- Pagamento do plano (Asaas): a tela "Meu Plano" está pronta, a conta nasce ativa.
- Upload de foto do candidato e logo/capa da empresa (hoje: iniciais e gradiente roxo).
- Filtro por raio de km (v2, com PostGIS).
- Banco de talentos (empresa buscando candidatos que não se candidataram).
- Barras de compatibilidade usam o nível que o próprio candidato declara (Não tenho / Básico / Bom / Avançado). Perguntas objetivas por vaga ficam para a v2.


## Cidade e CNPJ

**Cada cidade tem as suas vagas.**
- Empresa e profissional escolhem a cidade no cadastro, numa lista oficial do IBGE (estado + cidade). O texto fica sempre idêntico (`Tambaú - SP`), e é isso que faz o encontro entre os dois lados.
- A vaga **herda a cidade da empresa**: não dá para publicar em outra cidade, nem editar a cidade da vaga. Se a empresa mudar de cidade, as vagas dela acompanham.
- O profissional **só enxerga, favorita e se candidata a vagas da própria cidade**. Isso é garantido no banco, não só na tela. Se mudar de cidade no perfil, passa a ver as vagas da cidade nova (as candidaturas e os favoritos que já fez continuam visíveis).

**CNPJ da empresa**
- No cadastro, o CNPJ é conferido (dígitos verificadores) e consultado na Receita Federal (BrasilAPI), preenchendo nome e cidade da empresa. CNPJ que não esteja **ativo** é recusado.
- O banco recusa CNPJ inválido e **um CNPJ só pode ter uma conta**.
- A verificação definitiva é feita **pelo servidor** (rota `/api/cnpj/verificar`, com a `SUPABASE_SERVICE_ROLE_KEY`) e roda sozinha quando a empresa entra. **Empresa sem CNPJ verificado não publica vaga** (travado no banco; a empresa não consegue se auto-verificar).
- O profissional vê só o selo "Empresa verificada". O CNPJ fica visível apenas para a própria empresa.
- Limitação: o CNPJ é verificado na hora do cadastro. Se a empresa for baixada na Receita depois, o app não descobre sozinho (v2: reverificar de tempos em tempos).

## Segurança e privacidade

### O que já está implementado (e foi testado em Postgres local, simulando ataques)
- **Negar por padrão:** o app não tem acesso a nenhuma tabela, função ou coluna que não tenha sido liberada de propósito.
- **Cada um só vê o que deve:** profissional vê só o próprio perfil e as próprias candidaturas. Empresa só vê os dados de quem **se candidatou a uma vaga dela**. Candidato nunca vê dados de outro candidato, nem a empresa de uma vaga que não está visível para ele.
- **Sem escalada de privilégio:** `role`, `plan_status`, `owner_id` e `termos_aceitos_em` não podem ser alterados pelo app. Ninguém vira empresa nem ativa o plano sozinho.
- **Colunas internas ocultas de terceiros:** `owner_id` e `plan_status` da empresa e `termos_aceitos_em` do perfil só aparecem para o dono (função `minha_empresa()`).
- **Limite de 2 candidaturas/dia no banco** (não dá para burlar pelo navegador) e no máximo 20 vagas ativas por empresa.
- **Validação no banco:** tamanho máximo de todos os textos, salário sem valor negativo, idade válida, requisitos e habilidades só no formato esperado (bloqueia lixo e injeção de campos).
- **SQL injection:** o app não monta SQL na mão; tudo passa por consultas parametrizadas e funções do banco.
- **XSS:** o React escapa todo texto; a política de segurança (CSP) só permite scripts do próprio app e imagens do próprio Supabase (bloqueia rastreadores).
- **Clickjacking e afins:** cabeçalhos `X-Frame-Options`, `HSTS`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- **LGPD:** aceite obrigatório no cadastro (gravado com data), página `/privacidade`, e botão **Excluir minha conta** que apaga tudo na hora.
- **Cadastro:** senha com 8+ caracteres, letras e números; o papel (`empresa`/`profissional`) é validado no banco.
- **Login:** bloqueio progressivo após 5 erros (30s, 1min, 2min... até 15min) e mensagem de erro genérica.

### Checklist no painel do Supabase (faça antes de divulgar)
1. Authentication > Sign In / Providers > Email: **Confirm email LIGADO**.
2. Authentication > Attack Protection: ligue **CAPTCHA** (Cloudflare Turnstile ou hCaptcha) e, se o plano permitir, **Leaked password protection**. Esta é a proteção real contra robô tentando senha (o bloqueio do app é só um freio extra).
3. Authentication > Password: tamanho mínimo **8**.
4. Authentication > URL Configuration: coloque **só** o domínio do app em Site URL e Redirect URLs.
5. Authentication > Rate Limits: confira os limites de cadastro e login.
6. Storage: o bucket `logos` deve ter **só leitura pública**. Não crie política de upload para usuários.
7. Settings > API: **nunca** use a `service_role` key no app nem em variável `NEXT_PUBLIC_`. Só a `anon`.
8. Database > Backups: ative backups (point-in-time no plano Pro).
9. Database > Advisors: rode "Security Advisor" e "Performance Advisor" depois de aplicar as migrações.
10. Vercel: confira que `SUPABASE_SERVICE_ROLE_KEY` está só em Environment Variables (nunca no código nem com `NEXT_PUBLIC_`). Ative **Vercel Firewall / Attack Challenge Mode** se sofrer abuso, e mantenha o repositório privado.

### Limites que você precisa saber (honestidade)
- **A empresa pode copiar os dados** (nome, WhatsApp) de quem se candidatou. Tecnicamente não dá para impedir; a proteção é jurídica: os Termos proíbem uso para outra finalidade. Revise com advogado.
- **Candidato descartado continua visível para aquela empresa** (para ela poder restaurar). Se preferir apagar o acesso ao descartar, dá para mudar na v2.
- **O token de login fica no navegador** (padrão do Supabase). O risco é XSS, que a CSP reduz. A CSP precisa de `'unsafe-inline'` por causa do Next.js; endurecer com nonces é melhoria para a v2.
- **Não há 2FA nem registro de auditoria** (quem viu o quê). Recomendado para a v2, principalmente para contas de empresa.
- **O texto da `/privacidade` é um modelo**: preencha os campos entre colchetes e peça revisão de um advogado antes de lançar.
- Segurança não é um estado final: rode o Security Advisor do Supabase de tempos em tempos e atualize as dependências (`npm audit`).
