import { fotoUrl } from '@/lib/foto';
import { IMG_CIDADE } from '@/lib/constants';

// Fundo da faixa roxa no topo da vaga: a CAPA da empresa (foto larga) ou, se ela ainda não enviou, o desenho da cidade.
// Use dentro de um contêiner "relative" com altura definida.
export default function CapaFundo({ url }: { url?: string | null }) {
  const src = fotoUrl(url);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={IMG_CIDADE} alt="" aria-hidden draggable={false} className="pointer-events-none absolute inset-x-0 bottom-0 w-full opacity-30" />;
}
