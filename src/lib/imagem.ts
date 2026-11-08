// Recorta no centro e reduz para 512x512 em JPEG antes de enviar.
// Bônus de privacidade: ao redesenhar no canvas, os metadados da foto (GPS, aparelho) são descartados.
export async function reduzirImagem(arquivo: File, lado = 512): Promise<Blob> {
  const url = URL.createObjectURL(arquivo);
  try {
    const img: HTMLImageElement = await new Promise((ok, erro) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => erro(new Error('imagem inválida'));
      i.src = url;
    });
    const lim = Math.min(img.naturalWidth, img.naturalHeight);
    if (!lim) throw new Error('imagem inválida');
    const sx = (img.naturalWidth - lim) / 2;
    const sy = (img.naturalHeight - lim) / 2;
    const canvas = document.createElement('canvas');
    canvas.width = lado;
    canvas.height = lado;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, lado, lado);
    ctx.drawImage(img, sx, sy, lim, lim, 0, 0, lado, lado);
    return await new Promise((ok, erro) => canvas.toBlob((b) => (b ? ok(b) : erro(new Error('falha ao gerar imagem'))), 'image/jpeg', 0.85));
  } finally {
    URL.revokeObjectURL(url);
  }
}
