import type { Contribution, Gift } from '../../shared/types.js'
import { StoreError, type Store } from './types.js'

/**
 * Armazenamento em memória, usado apenas no desenvolvimento local enquanto o
 * Firebase não estiver configurado. Os dados somem ao reiniciar o servidor.
 */
interface MemoryData {
  gifts: Map<string, Gift>
  contributions: Map<string, Contribution>
}

const g = globalThis as typeof globalThis & { __memoryData?: MemoryData }

function data(): MemoryData {
  if (!g.__memoryData) {
    g.__memoryData = { gifts: new Map(), contributions: new Map() }
    seed(g.__memoryData)
  }
  return g.__memoryData
}

function seed(d: MemoryData) {
  const samples: [string, string, number, string][] = [
    ['Jogo de taças de cristal', 'Para brindarmos cada conquista juntos.', 34990, 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=900&q=80'],
    ['Jantar romântico', 'Uma noite especial na lua de mel.', 45000, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80'],
    ['Aparelho de jantar', 'Para receber a família e os amigos em casa.', 89900, 'https://images.unsplash.com/photo-1603199506016-b9a594b593c0?w=900&q=80'],
    ['Cafeteira espresso', 'O primeiro café de todas as manhãs.', 129900, 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=900&q=80'],
  ]
  for (const [title, description, price, imageUrl] of samples) {
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    d.gifts.set(id, { id, title, description, price, imageUrl, status: 'available', createdAt: now, updatedAt: now })
  }
}

function mustGetGift(id: string): Gift {
  const gift = data().gifts.get(id)
  if (!gift) throw new StoreError('not_found', 'Presente não encontrado')
  return gift
}

export const memoryStore: Store = {
  async listGifts() {
    return [...data().gifts.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },

  async createGift(input) {
    const now = new Date().toISOString()
    const gift: Gift = { id: crypto.randomUUID(), ...input, status: 'available', createdAt: now, updatedAt: now }
    data().gifts.set(gift.id, gift)
    return gift
  },

  async updateGift(id, patch) {
    const gift = { ...mustGetGift(id), ...patch, updatedAt: new Date().toISOString() }
    data().gifts.set(id, gift)
    return gift
  },

  async deleteGift(id) {
    const gift = mustGetGift(id)
    data().gifts.delete(id)
    return gift
  },

  async listContributions() {
    return [...data().contributions.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  async createContribution(input) {
    const gift = mustGetGift(input.giftId)
    if (gift.status !== 'available') {
      throw new StoreError('unavailable', 'Este presente já foi escolhido por outra pessoa')
    }
    const contribution: Contribution = {
      id: crypto.randomUUID(),
      ...input,
      giftTitle: gift.title,
      amount: gift.price,
      status: 'pending',
      createdAt: new Date().toISOString(),
      reviewedAt: null,
    }
    data().contributions.set(contribution.id, contribution)
    data().gifts.set(gift.id, { ...gift, status: 'reserved', updatedAt: contribution.createdAt })
    return contribution
  },

  async reviewContribution(id, decision) {
    const d = data()
    const current = d.contributions.get(id)
    if (!current) throw new StoreError('not_found', 'Confirmação não encontrada')
    if (current.status !== 'pending') throw new StoreError('already_reviewed', 'Esta confirmação já foi revisada')

    const now = new Date().toISOString()
    const updated: Contribution = { ...current, status: decision, reviewedAt: now }
    d.contributions.set(id, updated)

    const gift = d.gifts.get(current.giftId)
    if (gift) {
      if (decision === 'confirmed') {
        d.gifts.set(gift.id, { ...gift, status: 'purchased', updatedAt: now })
      } else if (gift.status === 'reserved') {
        const otherPending = [...d.contributions.values()].some(
          (c) => c.giftId === gift.id && c.status === 'pending',
        )
        if (!otherPending) d.gifts.set(gift.id, { ...gift, status: 'available', updatedAt: now })
      }
    }
    return updated
  },
}
