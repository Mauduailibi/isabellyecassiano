import { createHash, timingSafeEqual } from 'node:crypto'
import type { Context, MiddlewareHandler } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { sign, verify } from 'hono/jwt'

const COOKIE = 'ic_admin'
const SESSION_DAYS = 14

function env(name: 'ADMIN_PASSWORD' | 'SESSION_SECRET', devFallback: string) {
  const value = process.env[name]
  if (value) return value
  if (process.env.VERCEL) throw new Error(`Variável de ambiente ${name} não definida`)
  return devFallback
}

const secret = () => env('SESSION_SECRET', 'dev-secret-nao-use-em-producao')

export function checkPassword(input: string) {
  const hash = (s: string) => createHash('sha256').update(s).digest()
  const ok = timingSafeEqual(hash(input), hash(env('ADMIN_PASSWORD', 'admin')))
  if (!ok && !process.env.VERCEL) {
    const loaded = process.env.ADMIN_PASSWORD
    console.warn(
      loaded
        ? `[auth] Senha incorreta (ADMIN_PASSWORD carregada com ${loaded.length} caracteres).`
        : '[auth] ADMIN_PASSWORD não encontrada no .env/.env.local — usando a senha padrão "admin".',
    )
  }
  return ok
}

export async function startSession(c: Context) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DAYS * 24 * 60 * 60
  const token = await sign({ role: 'admin', exp }, secret())
  setCookie(c, COOKIE, token, {
    httpOnly: true,
    secure: Boolean(process.env.VERCEL),
    sameSite: 'Lax',
    path: '/api',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  })
}

export function endSession(c: Context) {
  deleteCookie(c, COOKIE, { path: '/api' })
}

export async function isAuthenticated(c: Context) {
  const token = getCookie(c, COOKIE)
  if (!token) return false
  try {
    await verify(token, secret(), 'HS256')
    return true
  } catch {
    return false
  }
}

export const requireAdmin: MiddlewareHandler = async (c, next) => {
  if (!(await isAuthenticated(c))) return c.json({ error: 'Não autorizado' }, 401)
  await next()
}
