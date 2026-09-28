import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Gift } from '../../shared/types'
import { GiftCard } from '../components/GiftCard'
import { GiftModal } from '../components/GiftModal'
import { Ornament } from '../components/Ornament'
import { site } from '../config'
import { api } from '../lib/api'

type Sort = 'default' | 'asc' | 'desc'

export function Home() {
  const [gifts, setGifts] = useState<Gift[] | null>(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Gift | null>(null)
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [sort, setSort] = useState<Sort>('default')

  const load = useCallback(() => {
    api
      .listGifts()
      .then(setGifts)
      .catch(() => setError('Não foi possível carregar a lista agora. Tente novamente em instantes.'))
  }, [])

  useEffect(load, [load])

  const visible = useMemo(() => {
    let list = gifts ?? []
    if (onlyAvailable) list = list.filter((g) => g.status === 'available')
    if (sort !== 'default') list = [...list].sort((a, b) => (sort === 'asc' ? a.price - b.price : b.price - a.price))
    // Presentes indisponíveis vão para o final, mantendo a ordem escolhida.
    return [...list].sort((a, b) => Number(a.status !== 'available') - Number(b.status !== 'available'))
  }, [gifts, onlyAvailable, sort])

  return (
    <>
      <header className="hero">
        <div className="hero__inner">
          <p className="eyebrow">Lista de Presentes</p>
          <div className="monogram" aria-hidden="true">
            <span>{site.bride[0]}</span>
            <i>&amp;</i>
            <span>{site.groom[0]}</span>
          </div>
          <h1 className="hero__title">
            <span>{site.bride}</span>
            <span className="hero__amp">&amp;</span>
            <span>{site.groom}</span>
          </h1>
          <Ornament className="hero__ornament" />
          {site.date && <p className="hero__date">{site.date}</p>}
          <p className="hero__intro">{site.intro}</p>
          <a className="btn btn--outline" href="#presentes">
            Ver presentes
          </a>
        </div>
      </header>

      <main id="presentes" className="section">
        <div className="section__head">
          <h2 className="section__title">Escolha um presente</h2>
          <p className="section__sub">Cada gesto de carinho fará parte da nossa história.</p>
        </div>

        <div className="toolbar">
          <div className="chips" role="group" aria-label="Filtro">
            <button className={`chip ${!onlyAvailable ? 'is-active' : ''}`} onClick={() => setOnlyAvailable(false)}>
              Todos
            </button>
            <button className={`chip ${onlyAvailable ? 'is-active' : ''}`} onClick={() => setOnlyAvailable(true)}>
              Disponíveis
            </button>
          </div>
          <label className="select">
            <span className="sr-only">Ordenar</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="default">Ordem sugerida</option>
              <option value="asc">Menor valor</option>
              <option value="desc">Maior valor</option>
            </select>
          </label>
        </div>

        {error && <p className="empty">{error}</p>}
        {!gifts && !error && (
          <div className="grid">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="gift-card gift-card--skeleton" />
            ))}
          </div>
        )}
        {gifts && visible.length === 0 && <p className="empty">Nenhum presente por aqui ainda.</p>}
        {gifts && visible.length > 0 && (
          <div className="grid">
            {visible.map((gift) => (
              <GiftCard key={gift.id} gift={gift} onChoose={setSelected} />
            ))}
          </div>
        )}
      </main>

      <footer className="footer">
        <Ornament />
        <p className="footer__note">Com carinho,</p>
        <p className="script script--md">
          {site.bride} &amp; {site.groom}
        </p>
      </footer>

      <GiftModal gift={selected} onClose={() => setSelected(null)} onChanged={load} />
    </>
  )
}
