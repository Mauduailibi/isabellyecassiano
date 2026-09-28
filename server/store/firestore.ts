import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import type { Contribution, Gift } from '../../shared/types.js'
import { StoreError, type Store } from './types.js'

export function hasFirebaseConfig() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  )
}

let db: Firestore | undefined

function firestore(): Firestore {
  if (db) return db
  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // A Vercel guarda a chave com "\n" literais; convertemos para quebras reais.
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }),
    })
  db = getFirestore(app)
  return db
}

const gifts = () => firestore().collection('gifts')
const contributions = () => firestore().collection('contributions')

export const firestoreStore: Store = {
  async listGifts() {
    const snap = await gifts().orderBy('createdAt', 'asc').get()
    return snap.docs.map((d) => ({ ...(d.data() as Gift), id: d.id }))
  },

  async createGift(input) {
    const now = new Date().toISOString()
    const ref = gifts().doc()
    const gift: Gift = { id: ref.id, ...input, status: 'available', createdAt: now, updatedAt: now }
    await ref.set(gift)
    return gift
  },

  async updateGift(id, patch) {
    const ref = gifts().doc(id)
    return firestore().runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      if (!snap.exists) throw new StoreError('not_found', 'Presente não encontrado')
      const gift = { ...(snap.data() as Gift), ...patch, id, updatedAt: new Date().toISOString() }
      tx.set(ref, gift)
      return gift
    })
  },

  async deleteGift(id) {
    const ref = gifts().doc(id)
    const snap = await ref.get()
    if (!snap.exists) throw new StoreError('not_found', 'Presente não encontrado')
    await ref.delete()
    return { ...(snap.data() as Gift), id }
  },

  async listContributions() {
    const snap = await contributions().orderBy('createdAt', 'desc').get()
    return snap.docs.map((d) => ({ ...(d.data() as Contribution), id: d.id }))
  },

  async createContribution(input) {
    const giftRef = gifts().doc(input.giftId)
    const ref = contributions().doc()
    return firestore().runTransaction(async (tx) => {
      const snap = await tx.get(giftRef)
      if (!snap.exists) throw new StoreError('not_found', 'Presente não encontrado')
      const gift = snap.data() as Gift
      if (gift.status !== 'available') {
        throw new StoreError('unavailable', 'Este presente já foi escolhido por outra pessoa')
      }
      const contribution: Contribution = {
        id: ref.id,
        ...input,
        giftTitle: gift.title,
        amount: gift.price,
        status: 'pending',
        createdAt: new Date().toISOString(),
        reviewedAt: null,
      }
      tx.set(ref, contribution)
      tx.update(giftRef, { status: 'reserved', updatedAt: contribution.createdAt })
      return contribution
    })
  },

  async reviewContribution(id, decision) {
    const ref = contributions().doc(id)
    return firestore().runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      if (!snap.exists) throw new StoreError('not_found', 'Confirmação não encontrada')
      const current = snap.data() as Contribution
      if (current.status !== 'pending') {
        throw new StoreError('already_reviewed', 'Esta confirmação já foi revisada')
      }

      const giftRef = gifts().doc(current.giftId)
      const giftSnap = await tx.get(giftRef)
      const pendingSnap = await tx.get(
        contributions().where('giftId', '==', current.giftId).where('status', '==', 'pending'),
      )

      const now = new Date().toISOString()
      const updated: Contribution = { ...current, id, status: decision, reviewedAt: now }
      tx.set(ref, updated)

      if (giftSnap.exists) {
        const gift = giftSnap.data() as Gift
        if (decision === 'confirmed') {
          tx.update(giftRef, { status: 'purchased', updatedAt: now })
        } else if (gift.status === 'reserved') {
          const otherPending = pendingSnap.docs.some((d) => d.id !== id)
          if (!otherPending) tx.update(giftRef, { status: 'available', updatedAt: now })
        }
      }
      return updated
    })
  },
}
