import type { Gift } from '../../shared/types'
import { formatPrice } from '../lib/format'

const badges = {
  reserved: 'Reservado',
  purchased: 'Presenteado',
} as const

export function GiftCard({ gift, onChoose }: { gift: Gift; onChoose: (gift: Gift) => void }) {
  const unavailable = gift.status !== 'available'

  return (
    <article className={`gift-card ${unavailable ? 'is-unavailable' : ''}`}>
      <div className="gift-card__media">
        {gift.imageUrl ? (
          <img src={gift.imageUrl} alt="" loading="lazy" />
        ) : (
          <div className="gift-card__placeholder" aria-hidden="true">
            <span>{gift.title.charAt(0)}</span>
          </div>
        )}
        {unavailable && <span className="gift-card__badge">{badges[gift.status as keyof typeof badges]} ♡</span>}
      </div>
      <div className="gift-card__body">
        <h3 className="gift-card__title">{gift.title}</h3>
        {gift.description && <p className="gift-card__desc">{gift.description}</p>}
        <div className="gift-card__footer">
          <span className="gift-card__price">{formatPrice(gift.price)}</span>
          <button className="btn btn--outline btn--sm" disabled={unavailable} onClick={() => onChoose(gift)}>
            {unavailable ? badges[gift.status as keyof typeof badges] : 'Presentear'}
          </button>
        </div>
      </div>
    </article>
  )
}
