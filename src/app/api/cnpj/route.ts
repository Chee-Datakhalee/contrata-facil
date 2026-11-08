import { NextRequest, NextResponse } from 'next/server';
import { cnpjValido, soDigitos } from '@/lib/cnpj';
import { consultarCnpj } from '@/lib/cnpj-server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Freio simples por IP (por instância do servidor). A proteção forte contra abuso é o CAPTCHA do cadastro.
const janela = new Map<string, { n: number; t: number }>();
function limitado(ip: string) {
  const agora = Date.now();
  const e = janela.get(ip);
  if (!e || agora - e.t > 60_000) { janela.set(ip, { n: 1, t: agora }); return false; }
  e.n += 1;
  return e.n > 8;
}

// GET /api/cnpj?cnpj=00000000000000 — consulta pública para preencher o cadastro (dados de CNPJ já são públicos)
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconhecido';
  if (limitado(ip)) return NextResponse.json({ erro: 'Muitas consultas. Aguarde um minuto.' }, { status: 429 });

  const cnpj = soDigitos(req.nextUrl.searchParams.get('cnpj') || '');
  if (!cnpjValido(cnpj)) return NextResponse.json({ erro: 'CNPJ inválido. Confira os números.' }, { status: 400 });

  const r = await consultarCnpj(cnpj);
  if (!r.ok || !r.dados) return NextResponse.json({ erro: r.erro || 'Falha na consulta.', detalhe: r.detalhe }, { status: r.status || 502 });
  return NextResponse.json(r.dados);
}
