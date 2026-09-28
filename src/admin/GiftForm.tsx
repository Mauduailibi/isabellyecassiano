import { useState, type ChangeEvent, type FormEvent } from 'react'
import type { Gift } from '../../shared/types'
import { api } from '../lib/api'
import { centsToInput, formatPrice, parsePrice } from '../lib/format'
import { compressImage } from '../lib/image'

export function GiftForm({
  gift,
  imageUpload,
  onDone,
}: {
  gift: Gift | null
  imageUpload: boolean
  onDone: () => void
}) {
  const [title, setTitle] = useState(gift?.title ?? '')
  const [description, setDescription] = useState(gift?.description ?? '')
  const [price, setPrice] = useState(gift ? centsToInput(gift.price) : '')
  const [imageUrl, setImageUrl] = useState(gift?.imageUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const blob = await compressImage(file)
      const { url } = await api.uploadImage(blob, file.name.replace(/\.\w+$/, '.webp'))
      setImageUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no upload')
    } finally {
      setUploading(false)
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const body = { title, description, price: parsePrice(price), imageUrl }
    try {
      if (gift) await api.updateGift(gift.id, body)
      else await api.createGift(body)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const cents = parsePrice(price)

  return (
    <form className="form gift-form" onSubmit={submit}>
      <h2 className="flow__title">{gift ? 'Editar presente' : 'Novo presente'}</h2>

      <div className="gift-form__grid">
        <div className="gift-form__image">
          <div className="gift-form__preview">
            {imageUrl ? <img src={imageUrl} alt="" /> : <span>Sem imagem</span>}
            {uploading && <div className="gift-form__uploading">Enviando…</div>}
          </div>
          {imageUpload && (
            <label className="btn btn--ghost btn--sm btn--block file-btn">
              {imageUrl ? 'Trocar imagem' : 'Enviar imagem'}
              <input type="file" accept="image/*" onChange={onFile} disabled={uploading} />
            </label>
          )}
          <label className="field field--sm">
            <span>{imageUpload ? 'ou cole a URL da imagem' : 'URL da imagem'}</span>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" type="url" />
          </label>
        </div>

        <div className="gift-form__fields">
          <label className="field">
            <span>Nome do presente</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} autoFocus />
          </label>
          <label className="field">
            <span>
              Descrição <em>(opcional)</em>
            </span>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
          </label>
          <label className="field">
            <span>Valor (R$)</span>
            <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="349,90" required />
            {cents > 0 && <small className="field__hint">{formatPrice(cents)}</small>}
          </label>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      <div className="form__actions">
        <button className="btn btn--solid" disabled={saving || uploading}>
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
