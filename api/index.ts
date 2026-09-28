import { handle } from 'hono/vercel'
import app from '../server/app.js'

// Vercel Function (Node.js). Todas as rotas /api/* são reescritas para cá (ver vercel.json).
const handler = handle(app)

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const OPTIONS = handler
