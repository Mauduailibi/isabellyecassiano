import { Hono } from 'hono'
import { z } from 'zod'
import { checkPassword, endSession, isAuthenticated, requireAdmin, startSession } from './auth.js'
import { MAX_IMAGE_BYTES, deleteImage, hasImageStorage, uploadImage } from './images.js'
import { getStore, StoreError } from './store/index.js'
import { hasFirebaseConfig } from './store/firestore.js'

const giftSchema = z.object({
  title: z.string().trim().min(1, 'Informe o nome do presente').max(120),
  description: z.string().trim().max(500).default(''),
  price: z.number().int().min(100, 'Valor mínimo de R$ 1,00').max(100_000_000),
  imageUrl: z.string().trim().url('URL de imagem inválida').or(z.literal('')).default(''),
})

const contributionSchema = z.object({
  giftId: z.string().min(1),
  guestName: z.string().trim().min(2, 'Informe seu nome').max(120),
  message: z.string().trim().max(1000).default(''),
  // Campo invisível (honeypot) para barrar robôs.
  website: z.string().max(0).optional(),
})

function parse<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body)
  if (!result.success) throw new ValidationError(result.error.issues[0]?.message ?? 'Dados inválidos')
  return result.data
}

class ValidationError extends Error {}

const app = new Hono().basePath('/api')

app.onError((err, c) => {
  if (err instanceof ValidationError) return c.json({ error: err.message }, 400)
  if (err instanceof StoreError) {
    const status = err.code === 'not_found' ? 404 : 409
    return c.json({ error: err.message }, status)
  }
  console.error(err)
  return c.json({ error: 'Erro inesperado. Tente novamente.' }, 500)
})

// ---------- Público ----------

app.get('/gifts', async (c) => {
  const gifts = await getStore().listGifts()
  c.header('Cache-Control', 'no-store')
  return c.json(gifts)
})

app.post('/contributions', async (c) => {
  const { giftId, guestName, message } = parse(contributionSchema, await c.req.json().catch(() => null))
  const contribution = await getStore().createContribution({ giftId, guestName, message })
  return c.json({ id: contribution.id }, 201)
})

// ---------- Administração ----------

app.post('/auth/login', async (c) => {
  const { password } = parse(z.object({ password: z.string() }), await c.req.json().catch(() => null))
  if (!checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 600))
    return c.json({ error: 'Senha incorreta' }, 401)
  }
  await startSession(c)
  return c.json({ ok: true })
})

app.post('/auth/logout', (c) => {
  endSession(c)
  return c.json({ ok: true })
})

app.get('/auth/session',async (c) => c.json({ authenticated: await isAuthenticated(c) }))

const admin = new Hono()
admin.use(requireAdmin)

admin.get('/config', (c) =>
  c.json({
    imageUpload: hasImageStorage(),
    storage: hasFirebaseConfig() ? 'firebase' : 'memory',
  }),
)

admin.get('/contributions', async (c) => c.json(await getStore().listContributions()))

admin.post('/contributions/:id/review', async (c) => {
  const { decision } = parse(
    z.object({ decision: z.enum(['confirmed', 'rejected']) }),
    await c.req.json().catch(() => null),
  )
  return c.json(await getStore().reviewContribution(c.req.param('id'), decision))
})

admin.post('/gifts', async (c) => {
  const input = parse(giftSchema, await c.req.json().catch(() => null))
  return c.json(await getStore().createGift(input), 201)
})

admin.patch('/gifts/:id', async (c) => {
  const patch = parse(
    giftSchema.partial().extend({ status: z.enum(['available', 'reserved', 'purchased']).optional() }),
    await c.req.json().catch(() => null),
  )
  const store = getStore()
  const before = patch.imageUrl !== undefined ? (await store.listGifts()).find((g) => g.id === c.req.param('id')) : undefined
  const gift = await store.updateGift(c.req.param('id'), patch)
  if (before && before.imageUrl && before.imageUrl !== gift.imageUrl) await deleteImage(before.imageUrl)
  return c.json(gift)
})

admin.delete('/gifts/:id', async (c) => {
  const gift = await getStore().deleteGift(c.req.param('id'))
  if (gift.imageUrl) await deleteImage(gift.imageUrl)
  return c.json({ ok: true })
})

admin.post('/upload', async (c) => {
  if (!hasImageStorage()) {
    return c.json({ error: 'Upload não configurado (BLOB_READ_WRITE_TOKEN). Use uma URL de imagem.' }, 501)
  }
  const body = await c.req.parseBody()
  const file = body.file
  if (!(file instanceof File)) return c.json({ error: 'Arquivo não enviado' }, 400)
  if (!file.type.startsWith('image/')) return c.json({ error: 'Envie uma imagem' }, 400)
  if (file.size > MAX_IMAGE_BYTES) return c.json({ error: 'Imagem muito grande (máx. 4 MB)' }, 400)
  return c.json({ url: await uploadImage(file) }, 201)
})

app.route('/admin', admin)

export default app
