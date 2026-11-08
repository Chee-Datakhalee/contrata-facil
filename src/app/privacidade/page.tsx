import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata = { title: 'Termos e Política de Privacidade — Contrata Fácil' };

// ============================================================================
// DADOS DA EMPRESA — edite só aqui. Campo vazio ('') não aparece na página.
// ============================================================================
const EMPRESA = {
  nome: 'Contrata Fácil',
  razaoSocial: '',  // ex.: 'NOME EMPRESARIAL LTDA'
  cnpj: '',         // ex.: '00.000.000/0001-00'
  email: '',        // e-mail para pedidos sobre dados pessoais (LGPD)
};
const ATUALIZADO_EM = '8 de novembro de 2026';

function Secao({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-extrabold text-brand-900">{n}. {titulo}</h2>
      <div className="mt-1 space-y-2">{children}</div>
    </section>
  );
}

export default function Privacidade() {
  const identificacao = [EMPRESA.razaoSocial, EMPRESA.cnpj && `CNPJ ${EMPRESA.cnpj}`].filter(Boolean).join(', ');

  return (
    <main className="px-6 pb-16 pt-6">
      <Link href="/" aria-label="Voltar" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow"><ChevronLeft /></Link>
      <h1 className="mt-6 text-3xl font-extrabold text-brand-800">Termos e Política de Privacidade</h1>
      <p className="mt-1 text-sm text-ink/60">Última atualização: {ATUALIZADO_EM}</p>

      <div className="mt-6 space-y-6 leading-relaxed text-ink/85">
        <Secao n={1} titulo="Quem somos">
          <p>
            O <b>{EMPRESA.nome}</b> é uma plataforma que conecta empresas e profissionais da mesma cidade. A responsável pelo tratamento dos seus dados pessoais (controladora, nos termos da Lei Geral de Proteção de Dados, Lei 13.709/2018) é o {EMPRESA.nome}
            {identificacao ? <>, {identificacao}</> : null}.
          </p>
          <p>
            {EMPRESA.email ? (
              <>Para falar sobre seus dados, escreva para <b>{EMPRESA.email}</b>.</>
            ) : (
              <>Você pode corrigir e apagar seus dados diretamente no app, em Meu Perfil ou Meu Plano.</>
            )}
          </p>
        </Secao>

        <Secao n={2} titulo="Quais dados coletamos">
          <p><b>Profissionais:</b> nome, WhatsApp, e-mail, cidade, idade, profissão e tempo de experiência, habilidades que você digita, formação, disponibilidade e foto (opcional).</p>
          <p><b>Empresas:</b> nome da empresa, CNPJ, nome do responsável, WhatsApp, e-mail, cidade, logo e capa (opcionais), descrição da empresa e as vagas publicadas.</p>
          <p>Também guardamos o aceite destes termos (com data) e as candidaturas feitas, com a data de cada uma.</p>
        </Secao>

        <Secao n={3} titulo="Para que usamos">
          <p>Para criar e manter sua conta, mostrar vagas da sua cidade, calcular a compatibilidade entre vaga e perfil, permitir o contato entre empresa e profissional e manter o serviço seguro. Não vendemos seus dados e não usamos publicidade de terceiros no app.</p>
        </Secao>

        <Secao n={4} titulo="Quem vê seus dados">
          <p>Seu perfil <b>só é mostrado a uma empresa depois que você se candidata a uma vaga dela</b>. Nesse momento a empresa passa a ver seu nome, WhatsApp, cidade, foto e perfil profissional. Empresas às quais você não se candidatou não têm acesso, e outros profissionais nunca veem seus dados.</p>
          <p>A empresa se compromete a usar esses dados apenas para o processo seletivo daquela vaga.</p>
          <p>Os profissionais veem das empresas apenas o nome, a cidade, a descrição, a logo, a capa, as vagas e se o CNPJ foi verificado. O CNPJ em si não é exibido.</p>
        </Secao>

        <Secao n={5} titulo="Compatibilidade entre vaga e perfil">
          <p>A porcentagem de compatibilidade é calculada automaticamente, comparando o texto que a empresa escreveu como requisito com as habilidades que o profissional declarou. É uma estimativa e não garante qualificação. Não há decisão automática de contratação: quem decide é sempre a empresa, depois de conversar com o candidato.</p>
        </Secao>

        <Secao n={6} titulo="Base legal">
          <p>Seu consentimento, dado ao criar a conta, e a execução do serviço que você pediu, conforme a LGPD.</p>
        </Secao>

        <Secao n={7} titulo="Com quem compartilhamos para o app funcionar">
          <p>Usamos prestadores de infraestrutura: <b>Supabase</b> (banco de dados, login e armazenamento de fotos) e <b>Vercel</b> (hospedagem do site). Seus dados ficam nesses serviços, cujos servidores podem estar fora do Brasil.</p>
          <p>Para conferir o CNPJ da empresa, consultamos bases públicas da Receita Federal por meio de serviços como a BrasilAPI. Só o número do CNPJ é enviado. A lista de cidades vem do IBGE, sem enviar dados pessoais. As fontes de letra são carregadas do Google Fonts, que pode receber seu endereço de IP ao abrir uma página.</p>
        </Secao>

        <Secao n={8} titulo="Armazenamento no seu aparelho">
          <p>O app guarda no seu aparelho apenas o necessário para manter você conectado e lembrar das vagas que você descartou. No momento não usamos cookies de rastreamento nem de publicidade.</p>
        </Secao>

        <Secao n={9} titulo="Por quanto tempo guardamos">
          <p>Enquanto sua conta existir. Ao excluir a conta, apagamos seu perfil, candidaturas, vagas, favoritos e fotos. Registros técnicos de acesso podem ser mantidos pelo prazo que a lei exigir.</p>
        </Secao>

        <Secao n={10} titulo="Seus direitos">
          <p>Você pode confirmar que tratamos seus dados, acessar, corrigir, pedir a exclusão, retirar o consentimento e pedir informações sobre com quem compartilhamos.</p>
          <p><b>Corrigir:</b> edite seu perfil no app. <b>Excluir tudo:</b> use &quot;Excluir minha conta&quot; em Meu Perfil (profissionais) ou em Meu Plano (empresas). A exclusão é imediata e não pode ser desfeita.{EMPRESA.email ? <> <b>Outros pedidos:</b> {EMPRESA.email}.</> : null}</p>
        </Secao>

        <Secao n={11} titulo="Segurança">
          <p>Usamos conexão criptografada, controle de acesso por usuário no banco de dados, limites de tentativas de login e conferência do CNPJ das empresas. Nenhum sistema é totalmente imune. Em caso de incidente relevante, avisaremos você e a autoridade competente.</p>
        </Secao>

        <Secao n={12} titulo="Regras de uso">
          <p>As informações do perfil devem ser verdadeiras. É proibido usar dados de profissionais para qualquer finalidade que não seja a contratação e publicar vagas falsas ou enganosas. Contas que descumprirem estas regras podem ser suspensas.</p>
        </Secao>

        <Secao n={13} titulo="Mudanças neste texto">
          <p>Se estas regras mudarem de forma relevante, avisaremos no app. A data da última atualização está no topo desta página.</p>
        </Secao>
      </div>
    </main>
  );
}
