import { existsSync, readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import devServer from '@hono/vite-dev-server'

/**
 * Disponibiliza as variáveis do .env / .env.local para a API (process.env) no dev.
 * Usa o parser do Node em vez do loadEnv do Vite, que expande "$" e quebraria
 * senhas com esse caractere. Variáveis já definidas no shell têm prioridade.
 */
function loadServerEnv(mode: string) {
  const merged: Record<string, string> = {}
  for (const file of ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`]) {
    if (existsSync(file)) Object.assign(merged, parseEnv(readFileSync(file, 'utf8')))
  }
  for (const [key, value] of Object.entries(merged)) {
    if (process.env[key] === undefined) process.env[key] = value
  }
}

export default defineConfig(({ mode }) => {
  loadServerEnv(mode)

  return {
    plugins: [
      react(),
      // Em desenvolvimento, a API Hono roda dentro do próprio servidor do Vite.
      // Na Vercel, ela roda como Function em api/index.ts.
      devServer({
        entry: 'server/app.ts',
        exclude: [/^(?!\/api(\/|$)).*/],
        injectClientScript: false,
      }),
    ],
  }
})
