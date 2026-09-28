import type {
  Contribution,
  ContributionInput,
  Gift,
  GiftInput,
  GiftStatus,
} from '../../shared/types.js'

export type GiftPatch = Partial<GiftInput> & { status?: GiftStatus }
export type ReviewDecision = 'confirmed' | 'rejected'

export interface Store {
  listGifts(): Promise<Gift[]>
  createGift(input: GiftInput): Promise<Gift>
  updateGift(id: string, patch: GiftPatch): Promise<Gift>
  deleteGift(id: string): Promise<Gift>

  listContributions(): Promise<Contribution[]>
  /** Registra o aviso de PIX do convidado e reserva o presente. */
  createContribution(input: ContributionInput): Promise<Contribution>
  /** Noivos confirmam (presente comprado) ou recusam (presente volta a ficar disponível). */
  reviewContribution(id: string, decision: ReviewDecision): Promise<Contribution>
}

export class StoreError extends Error {
  constructor(
    public code: 'not_found' | 'unavailable' | 'already_reviewed',
    message: string,
  ) {
    super(message)
  }
}
