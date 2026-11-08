'use client';
import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { reduzirImagem } from '@/lib/imagem';
import Avatar from './Avatar';

// Foto do perfil (profissional) ou logo da empresa. Toque para trocar.
export default function AvatarUpload({
  tipo, nome, url, size = 44, dark = false, square = false, onDone, onErro,
}: {
  tipo: 'perfil' | 'empresa';
  nome?: string | null;
  url?: string | null;
  size?: number;
  dark?: boolean;
  square?: boolean;
  onDone?: (caminho: string) => void;
  onErro?: (msg: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);

  async function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    if (!arquivo.type.startsWith('image/')) { onErro?.('Escolha um arquivo de imagem (JPG, PNG ou WebP).'); return; }
    if (arquivo.size > 15 * 1024 * 1024) { onErro?.('Imagem muito grande. Use uma de até 15 MB.'); return; }

    setEnviando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('sessao');
      const blob = await reduzirImagem(arquivo);
      const caminho = `${user.id}/${Date.now()}.jpg`;

      const up = await supabase.storage.from('avatares').upload(caminho, blob, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false });
      if (up.error) throw up.error;

      const r = await supabase.rpc('definir_foto', { p_tipo: tipo, p_path: caminho });
      if (r.error) { await supabase.storage.from('avatares').remove([caminho]); throw r.error; }

      // apaga a foto anterior para não deixar lixo no armazenamento
      if (url && !/^https?:\/\//.test(url) && url.startsWith(`${user.id}/`) && url !== caminho) {
        await supabase.storage.from('avatares').remove([url]);
      }
      onDone?.(caminho);
    } catch {
      onErro?.('Não foi possível enviar a foto. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  const grande = size >= 80;
  return (
    <span className="relative inline-block">
      <button type="button" onClick={() => input.current?.click()} aria-label="Trocar foto" disabled={enviando} className="block">
        <Avatar nome={nome} url={url} size={size} dark={dark} square={square} />
        <span className={`absolute flex items-center justify-center rounded-full bg-accent text-white shadow ${grande ? 'bottom-1 right-1 h-9 w-9' : '-bottom-1 -right-1 h-5 w-5'}`}>
          {enviando ? <Loader2 size={grande ? 18 : 11} className="animate-spin" /> : <Camera size={grande ? 18 : 11} />}
        </span>
      </button>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={escolher} />
    </span>
  );
}
