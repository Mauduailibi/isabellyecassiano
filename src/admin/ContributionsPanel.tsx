import { useState } from 'react'
import type { Contribution } from '../../shared/types'
import { api } from '../lib/api'
import { formatDate, formatPrice } from '../lib/format'

const statusLabel = {
  pending: 'Aguardando',
  confirmed: 'Recebido',
  rejected: 'Não recebido',
} as const

export function ContributionsPanel({
  contributions,
  onChanged,
}: {
  contributions: Contribution[]
  onChanged: () => void
}) {
  const [showAll, setShowAll] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  const list = showAll ? contributions : contributions.filter((c) => c.status === 'pending')

  async function review(id: string, decision: 'confirmed' | 'rejected') {
    setBusy(id)
    setError('')
    try {
      await api.reviewContribution(id, decision)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro')
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="panel">
      <div className="panel__head">
        <p className="panel__hint">
          Quando um convidado informa que fez o PIX, o presente fica <strong>reservado</strong>. Confira no extrato do
          banco e confirme — ou marque como não recebido para liberá-lo novamente.
        </p>
        <div className="chips">
          <button className={`chip ${!showAll ? 'is-active' : ''}`} onClick={() => setShowAll(false)}>
            Pendentes
          </button>
          <button className={`chip ${showAll ? 'is-active' : ''}`} onClick={() => setShowAll(true)}>
            Todas
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {list.length === 0 && (
        <p className="empty">{showAll ? 'Nenhuma confirmação ainda.' : 'Nenhuma confirmação pendente. ♡'}</p>
      )}

      <ul className="contribs">
        {list.map((c) => (
          <li key={c.id} className={`contrib contrib--${c.status}`}>
            <div className="contrib__main">
              <div className="contrib__top">
                <strong className="contrib__name">{c.guestName}</strong>
                <span className={`pill pill--${c.status}`}>{statusLabel[c.status]}</span>
              </div>
              <p className="contrib__gift">
                {c.giftTitle} · <strong>{formatPrice(c.amount)}</strong>
              </p>
              {c.message && <blockquote className="contrib__msg">“{c.message}”</blockquote>}
              <time className="contrib__date">{formatDate(c.createdAt)}</time>
            </div>
            {c.status === 'pending' && (
              <div className="contrib__actions">
                <button className="btn btn--solid btn--sm" disabled={busy === c.id} onClick={() => review(c.id, 'confirmed')}>
                  Recebi o PIX
                </button>
                <button className="btn btn--ghost btn--sm" disabled={busy === c.id} onClick={() => review(c.id, 'rejected')}>
                  Não recebi
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
