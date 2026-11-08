import { supabase } from './supabase';

// O banco guarda só o CAMINHO da foto (ex.: "<id-do-usuario>/1700000000.jpg") no bucket "avatares".
// Aqui montamos o endereço público. Links externos antigos (http...) continuam funcionando.
export function fotoUrl(valor?: string | null) {
  if (!valor) return null;
  if (/^https?:\/\//.test(valor)) return valor;
  return supabase.storage.from('avatares').getPublicUrl(valor).data.publicUrl;
}
