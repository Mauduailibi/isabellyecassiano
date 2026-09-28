import { useState } from 'react'
import type { Gift, GiftStatus } from '../../shared/types'
import { Modal } from '../components/Modal'
import { api } from '../lib/api'
import { formatPrice } from '../lib/format'
import { GiftForm } from './GiftForm'

const statusOptions: { value: GiftStatus; label: string }[] = [
  { value: 'available', label: 'Disponível' },
  { value: 'reserved', label: 'Reservado' },
  { value: 'purchased', label: 'Comprado' },
]

export function GiftsPanel({
  gifts,
  imageUpload,
  onChanged,
}: {
  gifts: Gift[]
  imageUpload: boolean
  onChanged: () => void
}) {
  const [editing, setEditing] = useState<Gift | 'new' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function run(action: () => Promise<unknown>) {
    setError('')
    try {
      await action()
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro')
    }
  }

  return (
    <section className="panel">
      <div className="panel__head">
        <p className="panel__hint">
          Adicione os presentes que desejam receber. Você pode marcar manualmente um presente como comprado a
          qualquer momento.
        </p>
        <button className="btn btn--solid btn--sm" onClick={() => setEditing('new')}>
          + Novo presente
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {gifts.length === 0 && <p className="empty">Nenhum presente cadastrado ainda.</p>}

      <ul className="gift-rows">
        {gifts.map((g) => (
          <li key={g.id} className="gift-row">
            <div className="gift-row__thumb">{g.imageUrl ? <img src={g.imageUrl} alt="" /> : <span>{g.title[0]}</span>}</div>
            <div className="gift-row__info">
              <strong>{g.title}</strong>
              <span>{formatPrice(g.price)}</span>
            </div>
            <label className={`select select--sm status--${g.status}`}>
              <span className="sr-only">Status</span>
              <select
                value={g.status}
                onChange={(e) => run(() => api.updateGift(g.id, { status: e.target.value as GiftStatus }))}
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="gift-row__actions">
              <button className="btn btn--ghost btn--sm" onClick={() => setEditing(g)}>
                Editar
              </button>
              {confirmDelete === g.id ? (
                <button
                  className="btn btn--danger btn--sm"
                  onClick={() => run(() => api.deleteGift(g.id))}
                  onBlur={() => setConfirmDelete(null)}
                  autoFocus
                >
                  Confirmar exclusão
                </button>
              ) : (
                <button className="btn btn--ghost btn--sm" onClick={() => setConfirmDelete(g.id)}>
                  Excluir
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Modal open={editing !== null} onClose={() => setEditing(null)} label="Presente" wide>
        {editing !== null && (
          <GiftForm
            gift={editing === 'new' ? null : editing}
            imageUpload={imageUpload}
            onDone={() => {
              setEditing(null)
              onChanged()
            }}
          />
        )}
      </Modal>
    </section>
  )
}
