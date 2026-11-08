import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { consultarCnpj } from '@/lib/cnpj-server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// POST /api/cnpj/verificar  (Authorization: Bearer <token do usuário>)
// Confirma na Receita o CNPJ GUARDADO no cadastro da empresa do usuário logado e marca como verificado.
// Só o servidor consegue gravar a verificação (usa a service_role). O navegador nunca envia o CNPJ aqui.
export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) {
    return NextResponse.json({ erro: 'Verificação indisponível: o servidor ainda não foi configurado.' }, { status: 500 });
  }

  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });

  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: u, error: eu } = await admin.auth.getUser(token);
  if (eu || !u?.user) return NextResponse.json({ erro: 'Sessão inválida. Entre de novo.' }, { status: 401 });

  const { data: c } = await admin
    .from('companies')
    .select('id, cnpj, cnpj_verificado, cnpj_ultima_tentativa')
    .eq('owner_id', u.user.id)
    .maybeSingle();
  if (!c) return NextResponse.json({ erro: 'Conta de empresa não encontrada.' }, { status: 403 });
  if (c.cnpj_verificado) return NextResponse.json({ ok: true, verificado: true });
  if (!c.cnpj) return NextResponse.json({ erro: 'Empresa sem CNPJ cadastrado.' }, { status: 400 });

  // no máximo 1 tentativa a cada 15 segundos por empresa
  if (c.cnpj_ultima_tentativa && Date.now() - new Date(c.cnpj_ultima_tentativa).getTime() < 15_000) {
    return NextResponse.json({ erro: 'Aguarde alguns segundos e tente de novo.' }, { status: 429 });
  }
  await admin.from('companies').update({ cnpj_ultima_tentativa: new Date().toISOString() }).eq('id', c.id);

  const r = await consultarCnpj(c.cnpj);
  if (!r.ok || !r.dados) return NextResponse.json({ erro: r.erro || 'Falha na consulta.', detalhe: r.detalhe }, { status: r.status || 502 });

  if (!r.dados.ativa) {
    return NextResponse.json(
      { erro: `Este CNPJ consta como "${r.dados.situacao.toLowerCase()}" na Receita. Só empresas com situação ativa podem publicar vagas.` },
      { status: 422 }
    );
  }

  const { error: ew } = await admin
    .from('companies')
    .update({ cnpj_verificado: true, cnpj_verificado_em: new Date().toISOString(), razao_social: r.dados.razaoSocial })
    .eq('id', c.id);
  if (ew) return NextResponse.json({ erro: 'Não foi possível salvar a verificação.' }, { status: 500 });

  return NextResponse.json({ ok: true, verificado: true });
}
