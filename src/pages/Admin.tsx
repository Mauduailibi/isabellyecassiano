import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Contribution, Gift } from '../../shared/types'
import { ContributionsPanel } from '../admin/ContributionsPanel'
import { GiftsPanel } from '../admin/GiftsPanel'
import { Ornament } from '../components/Ornament'
import { site } from '../config'
import { api, ApiError } from '../lib/api'
import { formatPrice } from '../lib/format'

export function Admin() {
  const [auth, setAuth] = useState<boolean | null>(null)

  useEffect(() => {
    api
      .session()
      .then((s) => setAuth(s.authenticated))
      .catch(() => setAuth(false))
  }, [])

  if (auth === null) return <div className="admin-loading" />
  return auth ? <Dashboard onLogout={() => setAuth(false)} /> : <Login onSuccess={() => setAuth(true)} />
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.login(password)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={submit}>
        <p className="eyebrow">Painel dos noivos</p>
        <p className="script script--md">
          {site.bride} &amp; {site.groom}
        </p>
        <Ornament />
        <label className="field">
          <span>Senha</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus required />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn--solid btn--block" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
        <a className="link" href="/">
          ← Voltar ao site
        </a>
      </form>
    </div>
  )
}

type Tab = 'contributions' | 'gifts'

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('contributions')
  const [gifts, setGifts] = useState<Gift[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [config, setConfig] = useState<{ imageUpload: boolean; storage: string } | null>(null)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    try {
      const [g, c] = await Promise.all([api.listGifts(), api.listContributions()])
      setGifts(g)
      setContributions(c)
      setError('')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onLogout()
      setError(err instanceof Error ? err.message : 'Erro ao carregar')
    }
  }, [onLogout])

  useEffect(() => {
    reload()
    api.adminConfig().then(setConfig).catch(() => {})
    const id = setInterval(reload, 30_000)
    return () => clearInterval(id)
  }, [reload])

  const stats = useMemo(() => {
    const pending = contributions.filter((c) => c.status === 'pending').length
    const confirmed = contributions.filter((c) => c.status === 'confirmed')
    return {
      total: gifts.length,
      purchased: gifts.filter((g) => g.status === 'purchased').length,
      pending,
      raised: confirmed.reduce((sum, c) => sum + c.amount, 0),
    }
  }, [gifts, contributions])

  async function logout() {
    await api.logout().catch(() => {})
    onLogout()
  }

  return (
    <div className="admin">
      <header className="admin__header">
        <div>
          <p className="eyebrow">Painel dos noivos</p>
          <p className="script script--sm">
            {site.bride} &amp; {site.groom}
          </p>
        </div>
        <div className="admin__header-actions">
          <a className="btn btn--ghost btn--sm" href="/" target="_blank" rel="noreferrer">
            Ver site
          </a>
          <button className="btn btn--ghost btn--sm" onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      {config?.storage === 'memory' && (
        <p className="notice notice--warn">
          Modo demonstração: o Firebase ainda não está configurado e os dados ficam apenas em memória.
        </p>
      )}
      {error && <p className="notice notice--warn">{error}</p>}

      <section className="stats">
        <Stat label="Presentes" value={String(stats.total)} />
        <Stat label="Presenteados" value={String(stats.purchased)} />
        <Stat label="Aguardando confirmação" value={String(stats.pending)} highlight={stats.pending > 0} />
        <Stat label="Recebido" value={formatPrice(stats.raised)} />
      </section>

      <nav className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'contributions'}
          className={`tab ${tab === 'contributions' ? 'is-active' : ''}`}
          onClick={() => setTab('contributions')}
        >
          Confirmações de PIX {stats.pending > 0 && <span className="tab__count">{stats.pending}</span>}
        </button>
        <button
          role="tab"
          aria-selected={tab === 'gifts'}
          className={`tab ${tab === 'gifts' ? 'is-active' : ''}`}
          onClick={() => setTab('gifts')}
        >
          Presentes
        </button>
      </nav>

      {tab === 'contributions' ? (
        <ContributionsPanel contributions={contributions} onChanged={reload} />
      ) : (
        <GiftsPanel gifts={gifts} imageUpload={config?.imageUpload ?? false} onChanged={reload} />
      )}
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`stat ${highlight ? 'stat--highlight' : ''}`}>
      <span className="stat__value">{value}</span>
      <span className="stat__label">{label}</span>
    </div>
  )
}
