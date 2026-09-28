/**
 * Conteúdo editável do site. Ajuste aqui textos, data e dados do PIX.
 */
export const site = {
  bride: 'Isabelly',
  groom: 'Cassiano',
  /** Ex.: '12 de dezembro de 2026'. Deixe vazio para ocultar. */
  date: '',
  intro:
    'Sua presença é o nosso maior presente. Mas, se quiser nos presentear, preparamos esta lista com muito carinho para o começo da nossa vida a dois.',

  pix: {
    /**
     * Imagem em public/pix-qr.png. Ao substituí-la pelo QR Code definitivo,
     * marque isPlaceholder como false (remove o selo "Ilustrativo").
     */
    qrImage: '/pix-qr.png',
    isPlaceholder: true,
    /** Código "PIX copia e cola" (opcional). */
    copyPaste: '',
    /** Chave PIX exibida por extenso (opcional). */
    key: '',
    holder: 'Isabelly & Cassiano',
  },
}
