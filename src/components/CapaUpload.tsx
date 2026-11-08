'use client';
import { useRef, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { reduzirImagem } from '@/lib/imagem';
import CapaFundo from './CapaFundo';

// Capa da empresa: foto larga que aparece no topo das vagas. Toque para enviar ou trocar.
export default function CapaUpload({
  url, onDone, onErro,
}: {
  url?: string | null;
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
      const blob = await reduzirImagem(arquivo, 1200, 600);
      const caminho = `${user.id}/capa-${Date.now()}.jpg`;

      const up = await supabase.storage.from('avatares').upload(caminho, blob, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false });
      if (up.error) throw up.error;

      const r = await supabase.rpc('definir_foto', { p_tipo: 'capa', p_path: caminho });
      if (r.error) { await supabase.storage.from('avatares').remove([caminho]); throw r.error; }

      if (url && !/^https?:\/\//.test(url) && url.startsWith(`${user.id}/`) && url !== caminho) {
        await supabase.storage.from('avatares').remove([url]);
      }
      onDone?.(caminho);
    } catch {
      onErro?.('Não foi possível enviar a capa. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="relative h-32 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900">
      <CapaFundo url={url} />
      <button type="button" onClick={() => input.current?.click()} disabled={enviando} aria-label={url ? 'Trocar capa' : 'Adicionar capa'} className="absolute inset-0 flex items-end justify-end p-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-sm font-bold text-brand-800 shadow">
          {enviando ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
          {enviando ? 'Enviando...' : url ? 'Trocar capa' : 'Adicionar capa'}
        </span>
      </button>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={escolher} />
    </div>
  );
}
