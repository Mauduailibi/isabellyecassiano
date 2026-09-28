export type GiftStatus = 'available' | 'reserved' | 'purchased'

export interface Gift {
  id: string
  title: string
  description: string
  /** Valor em centavos */
  price: number
  imageUrl: string
  status: GiftStatus
  createdAt: string
  updatedAt: string
}

export type ContributionStatus = 'pending' | 'confirmed' | 'rejected'

/** Registro criado quando um convidado informa que fez o PIX. */
export interface Contribution {
  id: string
  giftId: string
  giftTitle: string
  amount: number
  guestName: string
  message: string
  status: ContributionStatus
  createdAt: string
  reviewedAt: string | null
}

export type GiftInput = Pick<Gift, 'title' | 'description' | 'price' | 'imageUrl'>
export type ContributionInput = Pick<Contribution, 'giftId' | 'guestName' | 'message'>
