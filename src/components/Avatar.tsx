import { iniciais } from '@/lib/compat';
import { fotoUrl } from '@/lib/foto';

export default function Avatar({ nome, url, size = 44, square = false, dark = false }: { nome?: string | null; url?: string | null; size?: number; square?: boolean; dark?: boolean }) {
  const radius = square ? 'rounded-2xl' : 'rounded-full';
  const src = fotoUrl(url);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={nome || ''} style={{ width: size, height: size }} className={`${radius} shrink-0 object-cover`} />;
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className={`${radius} flex shrink-0 items-center justify-center font-extrabold ${dark ? 'bg-brand-900 text-white' : 'bg-brand-100 text-brand-700'}`}
    >
      {iniciais(nome)}
    </div>
  );
}
