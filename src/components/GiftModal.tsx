import { useState, type FormEvent } from 'react'
import type { Gift } from '../../shared/types'
import { site } from '../config'
import { api, ApiError } from '../lib/api'
import { formatPrice } from '../lib/format'
import { Modal } from './Modal'
import { Ornament } from './Ornament'

type Step = 'pay' | 'confirm' | 'done'

export function GiftModal({
  gift,
  onClose,
  onChanged,
}: {
  gift: Gift | null
  onClose: () => void
  onChanged: () => void
}) {
  return (
    <Modal open={Boolean(gift)} onClose={onClose} label="Presentear">
      {gift && <GiftFlow key={gift.id} gift={gift} onClose={onClose} onChanged={onChanged} />}
    </Modal>
  )
}

function GiftFlow({ gift, onClose, onChanged }: { gift: Gift; onClose: () => void; onChanged: () => void }) {
  const [step, setStep] = useState<Step>('pay')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function copyPix() {
    await navigator.clipboard.writeText(site.pix.copyPaste || site.pix.key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      await api.createContribution({ giftId: gift.id, guestName: name, message, website })
      setStep('done')
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado.')
      if (err instanceof ApiError && err.status === 409) onChanged()
    } finally {
      setSending(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="flow flow--center">
        <p className="script script--lg">Obrigado!</p>
        <Ornament />
        <p className="lead">
          {name.split(' ')[0]}, recebemos o seu carinho. Assim que confirmarmos o PIX, o presente será marcado como
          presenteado.
        </p>
        <p className="signature">
          Com amor, {site.bride} &amp; {site.groom}
        </p>
        <button className="btn btn--solid" onClick={onClose}>
          Voltar à lista
        </button>
      </div>
    )
  }

  return (
    <div className="flow">
      <header className="flow__header">
        <p className="eyebrow">Você escolheu</p>
        <h2 className="flow__title">{gift.title}</h2>
        <p className="flow__price">{formatPrice(gift.price)}</p>
      </header>

      {step === 'pay' && (
        <>
          <div className="qr">
            <div className="qr__frame">
              <img src={site.pix.qrImage} alt="QR Code PIX" width={220} height={220} />
              {site.pix.isPlaceholder && <span className="qr__tag">Ilustrativo</span>}
            </div>
            <ol className="qr__steps">
              <li>Abra o app do seu banco e escolha pagar com PIX.</li>
              <li>
                Escaneie o QR Code e informe o valor de <strong>{formatPrice(gift.price)}</strong>.
              </li>
              <li>Depois, volte aqui e confirme o seu presente.</li>
            </ol>
          </div>

          {site.pix.isPlaceholder && (
            <p className="notice">Em breve, o QR Code definitivo dos noivos estará disponível aqui.</p>
          )}

          {(site.pix.copyPaste || site.pix.key) && (
            <div className="copy">
              <div className="copy__text">
                <span className="copy__label">{site.pix.copyPaste ? 'PIX copia e cola' : 'Chave PIX'}</span>
                <code>{site.pix.copyPaste || site.pix.key}</code>
                <span className="copy__holder">{site.pix.holder}</span>
              </div>
              <button className="btn btn--ghost btn--sm" onClick={copyPix}>
                {copied ? 'Copiado ✓' : 'Copiar'}
              </button>
            </div>
          )}

          <button className="btn btn--solid btn--block" onClick={() => setStep('confirm')}>
            Já fiz o PIX
          </button>
        </>
      )}

      {step === 'confirm' && (
        <form className="form" onSubmit={submit}>
          <label className="field">
            <span>Seu nome</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} autoFocus />
          </label>
          <label className="field">
            <span>
              Deixe uma mensagem aos noivos <em>(opcional)</em>
            </span>
            <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} />
          </label>
          <input
            className="hp"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            aria-hidden="true"
          />
          {error && <p className="error">{error}</p>}
          <div className="form__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setStep('pay')}>
              Voltar
            </button>
            <button className="btn btn--solid" disabled={sending}>
              {sending ? 'Enviando…' : 'Confirmar presente'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
