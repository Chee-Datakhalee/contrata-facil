// Recorta no centro e reduz a imagem antes de enviar (JPEG).
// Avatar/logo: 512x512 (padrão). Capa: use reduzirImagem(arquivo, 1200, 600).
// Bônus de privacidade: ao redesenhar no canvas, os metadados da foto (GPS, aparelho) são descartados.
export async function reduzirImagem(arquivo: File, largura = 512, altura = largura): Promise<Blob> {
  const url = URL.createObjectURL(arquivo);
  try {
    const img: HTMLImageElement = await new Promise((ok, erro) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => erro(new Error('imagem inválida'));
      i.src = url;
    });
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) throw new Error('imagem inválida');

    // recorte central na proporção desejada
    const alvo = largura / altura;
    let sw = w;
    let sh = h;
    if (w / h > alvo) sw = h * alvo;
    else sh = w / alvo;
    const sx = (w - sw) / 2;
    const sy = (h - sh) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, largura, altura);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, largura, altura);
    return await new Promise((ok, erro) => canvas.toBlob((b) => (b ? ok(b) : erro(new Error('falha ao gerar imagem'))), 'image/jpeg', 0.85));
  } finally {
    URL.revokeObjectURL(url);
  }
}
