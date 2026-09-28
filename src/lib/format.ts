const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export const formatPrice = (cents: number) => brl.format(cents / 100)

/** "1.299,90" | "1299.9" | "R$ 50" → centavos */
export function parsePrice(input: string): number {
  let s = input.replace(/[^\d.,]/g, '')
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  const value = Number.parseFloat(s)
  return Number.isFinite(value) ? Math.round(value * 100) : 0
}

export const centsToInput = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
