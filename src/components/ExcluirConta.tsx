'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Direito de exclusão (LGPD): apaga a conta e tudo que está ligado a ela, na hora.
export default function ExcluirConta() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function excluir() {
    setErro('');
    setLoading(true);
    // fotos (LGPD): remove os arquivos do armazenamento antes de apagar a conta
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: arquivos } = await supabase.storage.from('avatares').list(user.id);
        if (arquivos?.length) await supabase.storage.from('avatares').remove(arquivos.map((a) => `${user.id}/${a.name}`));
      }
    } catch {}
    const { error } = await supabase.rpc('excluir_minha_conta');
    if (error) {
      setLoading(false);
      setErro('Não foi possível excluir agora. Tente de novo em instantes.');
      return;
    }
    await supabase.auth.signOut({ scope: 'local' });
    router.replace('/');
  }

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)} className="mx-auto mt-1 flex items-center gap-2 py-2 text-sm font-bold text-rose-600">
        <Trash2 size={16} /> Excluir minha conta
      </button>
    );
  }

  return (
    <div className="card mt-3 border border-rose-200 p-4">
      <p className="font-extrabold text-rose-700">Excluir conta definitivamente</p>
      <p className="mt-1 text-sm text-ink/75">
        Isso apaga seu perfil, suas candidaturas, vagas e favoritos. Não dá para desfazer. Digite <b>EXCLUIR</b> para confirmar.
      </p>
      <input className="input mt-3" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="EXCLUIR" aria-label="Digite EXCLUIR para confirmar" />
      {erro && <p className="mt-2 text-sm font-semibold text-rose-600" role="alert">{erro}</p>}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <button onClick={() => { setAberto(false); setTexto(''); }} className="btn-outline !py-3">Cancelar</button>
        <button onClick={excluir} disabled={texto.trim().toUpperCase() !== 'EXCLUIR' || loading} className="flex items-center justify-center rounded-full bg-rose-600 py-3 font-bold text-white disabled:opacity-40">
          {loading ? 'Excluindo...' : 'Excluir'}
        </button>
      </div>
    </div>
  );
}
