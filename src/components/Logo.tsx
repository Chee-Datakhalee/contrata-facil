import { LOGO_DEITADA, LOGO_EM_PE } from '@/lib/constants';

export function LogoDeitada({ height = 44 }: { height?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={LOGO_DEITADA} alt="Contrata Fácil" style={{ height, width: 'auto' }} />;
}

export function LogoEmPe({ height = 190 }: { height?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={LOGO_EM_PE} alt="Contrata Fácil" style={{ height, width: 'auto' }} />;
}
