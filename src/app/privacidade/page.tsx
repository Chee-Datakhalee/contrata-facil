import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata = { title: 'Termos e Privacidade — Contrata Fácil' };

export default function Privacidade() {
  return (
    <main className="px-6 pb-16 pt-6">
      <Link href="/" aria-label="Voltar" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow"><ChevronLeft /></Link>
      <h1 className="mt-6 text-3xl font-extrabold text-brand-800">Termos e Política de Privacidade</h1>
      <p className="mt-2 rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">
        Modelo inicial. Antes de lançar, preencha os campos entre colchetes e peça a revisão de um advogado.
      </p>

      <div className="mt-6 space-y-5 leading-relaxed text-ink/85">
        <section>
          <h2 className="text-lg font-extrabold text-brand-900">1. Quem somos</h2>
          <p>O Contrata Fácil conecta empresas e profissionais. Controlador dos dados: [RAZÃO SOCIAL / CNPJ]. Contato do responsável pelos dados: [E-MAIL DE CONTATO].</p>
        </section>
        <section>
          <h2 className="text-lg font-extrabold text-brand-900">2. Quais dados coletamos</h2>
          <p><b>Profissionais:</b> nome, WhatsApp, e-mail, cidade, idade, experiência, habilidades declaradas, formação e disponibilidade. <b>Empresas:</b> nome da empresa, nome do responsável, WhatsApp, e-mail, cidade e dados das vagas.</p>
        </section>
        <section>
          <h2 className="text-lg font-extrabold text-brand-900">3. Para que usamos</h2>
          <p>Para criar sua conta, mostrar vagas, calcular a compatibilidade entre vaga e perfil e permitir o contato entre empresa e profissional. Não vendemos seus dados.</p>
        </section>
        <section>
          <h2 className="text-lg font-extrabold text-brand-900">4. Quem vê seus dados</h2>
          <p>Seu perfil <b>só é mostrado a uma empresa depois que você se candidata a uma vaga dela</b>. Nesse momento, a empresa passa a ver seu nome, WhatsApp, cidade e perfil profissional. Empresas que você não se candidatou não têm acesso. Outros profissionais nunca veem seus dados. A empresa se compromete a usar esses dados apenas para o processo seletivo.</p>
        </section>
        <section>
          <h2 className="text-lg font-extrabold text-brand-900">5. Base legal</h2>
          <p>Seu consentimento (aceite no cadastro) e a execução do serviço que você pediu, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).</p>
        </section>
        <section>
          <h2 className="text-lg font-extrabold text-brand-900">6. Por quanto tempo guardamos</h2>
          <p>Enquanto sua conta existir. Ao excluir a conta, apagamos seu perfil, candidaturas, vagas e favoritos. [Informe aqui se guardará algum dado por obrigação legal.]</p>
        </section>
        <section>
          <h2 className="text-lg font-extrabold text-brand-900">7. Seus direitos</h2>
          <p>Você pode confirmar que tratamos seus dados, acessar, corrigir, pedir a exclusão, retirar o consentimento e pedir informações sobre compartilhamento. Corrigir: edite seu perfil no app. Excluir: use &quot;Excluir minha conta&quot; na tela de perfil. Outros pedidos: [E-MAIL DE CONTATO].</p>
        </section>
        <section>
          <h2 className="text-lg font-extrabold text-brand-900">8. Segurança</h2>
          <p>Usamos conexão criptografada, controle de acesso por usuário no banco de dados e limites de tentativas de acesso. Nenhum sistema é 100% imune, e avisaremos você e a autoridade competente em caso de incidente relevante.</p>
        </section>
        <section>
          <h2 className="text-lg font-extrabold text-brand-900">9. Regras de uso</h2>
          <p>As informações do perfil devem ser verdadeiras. A compatibilidade mostrada no app é uma estimativa baseada no que o profissional declara e não garante qualificação: a empresa deve confirmar na entrevista. É proibido usar dados de profissionais para outra finalidade que não seja contratação.</p>
        </section>
        <section>
          <h2 className="text-lg font-extrabold text-brand-900">10. Menores de idade</h2>
          <p>[Defina com seu advogado a idade mínima de uso e as regras para jovem aprendiz e estágio.]</p>
        </section>
      </div>
    </main>
  );
}
