import { firestoreStore, hasFirebaseConfig } from './firestore.js'
import { memoryStore } from './memory.js'
import type { Store } from './types.js'

export * from './types.js'

let warned = false

export function getStore(): Store {
  if (hasFirebaseConfig()) return firestoreStore
  if (process.env.VERCEL) {
    throw new Error('Firebase não configurado: defina FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY')
  }
  if (!warned) {
    console.warn('[store] Firebase não configurado — usando armazenamento em memória (apenas dev).')
    warned = true
  }
  return memoryStore
}
