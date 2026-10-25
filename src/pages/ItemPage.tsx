import type React from 'react'
import { Children, isValidElement, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { ItemTile } from '../components/ItemTile'
import { IconButton, Spinner } from '../components/ui'
import { useStore } from '../lib/store'
import { bgStyle } from '../lib/util'
import EditItem from './EditItem'

const textOf = (n: ReactNode): string =>
  Children.toArray(n).map((c) => (typeof c === 'string' || typeof c === 'number' ? String(c) : isValidElement(c) ? textOf((c.props as { children?: ReactNode }).children) : '')).join('')
const secId = (t: string) => 'sec-' + t.trim().replace(/\s+/g, '-')

export default function ItemPage() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const { items, albums, settings, loaded, canEdit } = useStore()
  const nav = useNavigate()
  const item = items.find((i) => i.id === id)
  const [editing, setEditing] = useState(params.get('edit') === '1')
  const [idx, setIdx] = useState(Number(params.get('img') ?? 0) || 0)
  const [chrome, setChrome] = useState(true)
  const strip = useRef<HTMLDivElement>(null)
  const wikiRef = useRef<HTMLElement>(null)

  const fromAlbum = albums.find((a) => a.id === (params.get('from') ?? item?.albumIds[0]))
  const sections = useMemo(() => (item?.body ?? '').split('\n').filter((l) => /^##\s+/.test(l)).map((l) => l.replace(/^##\s+/, '').trim()), [item?.body])
  const similar = useMemo(() => {
    if (!item || !item.tags.length) return []
    return items
      .filter((i) => i.id !== item.id)
      .map((i) => ({ i, n: i.tags.filter((t) => item.tags.includes(t)).length }))
      .filter((x) => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 8).map((x) => x.i)
  }, [items, item])

  // 指定された画像位置へスクロール
  useEffect(() => {
    const el = strip.current
    if (el && !editing) el.scrollTo({ left: idx * el.clientWidth, behavior: 'instant' as ScrollBehavior })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, editing])

  // 回転時に表示中の画像を維持
  useEffect(() => {
    const h = () => { const el = strip.current; if (el) el.scrollLeft = idx * el.clientWidth }
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [idx])

  if (!loaded) return <div className="page"><Spinner /></div>
  if (!item) return <div className="page center"><p className="muted">アイテムが見つかりません</p><button className="btn" onClick={() => nav('/')}>戻る</button></div>
  if (editing) return <EditItem item={item} onDone={(deleted) => (deleted ? nav(fromAlbum ? '/album/' + fromAlbum.id : '/') : setEditing(false))} />

  const bgImage = item.bgImageUrl ?? fromAlbum?.theme?.bgImageUrl ?? settings.bgImageUrl
  const bgColor = fromAlbum?.theme?.bgColor ?? settings.bgColor
  const go = (k: number) => { const el = strip.current; if (el) el.scrollTo({ left: k * el.clientWidth, behavior: 'smooth' }) }
  const back = () => (window.history.length > 1 ? nav(-1) : nav(fromAlbum ? '/album/' + fromAlbum.id : '/'))

  return (
    <div className="item-page" style={bgStyle(bgColor, bgImage)}>
      <section className="viewer">
        <div className="strip" ref={strip}
          onScroll={(e) => { const el = e.currentTarget; setIdx(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))) }}>
          {item.images.length ? item.images.map((img) => (
            <div className="slide" key={img.id} onClick={() => setChrome((c) => !c)}>
              <img src={img.url} alt={item.title} draggable={false} />
            </div>
          )) : <div className="slide"><div className="no-image"><Icon name="image" size={48} /><span>画像なし</span></div></div>}
        </div>
        <div className={'viewer-top' + (chrome ? '' : ' hidden')}>
          <IconButton icon="back" label="戻る" onClick={back} />
          <span className="counter">{item.images.length > 1 ? `${idx + 1} / ${item.images.length}` : ''}</span>
          {canEdit && <IconButton icon="edit" label="編集" onClick={() => setEditing(true)} />}
        </div>
        {item.images.length > 1 && chrome && (
          <>
            {idx > 0 && <button className="nav-arrow l" aria-label="前の画像" onClick={() => go(idx - 1)}><Icon name="left" /></button>}
            {idx < item.images.length - 1 && <button className="nav-arrow r" aria-label="次の画像" onClick={() => go(idx + 1)}><Icon name="right" /></button>}
            <div className="dots">{item.images.map((im, k) => <span key={im.id} className={k === idx ? 'on' : ''} />)}</div>
          </>
        )}
        <button className={'scroll-hint' + (chrome ? '' : ' hidden')} onClick={() => wikiRef.current?.scrollIntoView({ behavior: 'smooth' })}>
          <span>Wiki</span><Icon name="down" size={18} />
        </button>
      </section>

      <section className="wiki" ref={wikiRef}>
        <header className="wiki-head">
          <h1>{item.title || '（無題）'}</h1>
          {fromAlbum && <Link className="wiki-sub" to={'/album/' + fromAlbum.id}>{fromAlbum.name} Wiki</Link>}
        </header>
        <div className="wiki-card">
          {item.tags.length > 0 && (
            <div className="chips">{item.tags.map((t) => <Link key={t} className="chip" to={'/search?tag=' + encodeURIComponent(t)}>#{t}</Link>)}</div>
          )}
          {item.stats.length > 0 && (
            <div className="stats">
              <h3>STATISTICS:</h3>
              <dl>{item.stats.map((s, k) => <div key={k}><dt>{s.key}:</dt><dd>{s.value}</dd></div>)}</dl>
            </div>
          )}
          {sections.length > 1 && (
            <nav className="sec-nav">
              {sections.map((s, k) => (
                <span key={k}>{k > 0 && <i>•</i>}<a href={'#' + secId(s)} onClick={(e) => { e.preventDefault(); document.getElementById(secId(s))?.scrollIntoView({ behavior: 'smooth' }) }}>{s}</a></span>
              ))}
            </nav>
          )}
          {item.body.trim() ? (
            <article className="md">
              <Markdown remarkPlugins={[remarkGfm]} components={{ h2: ({ children }) => <h2 id={secId(textOf(children))}>{children}</h2> }}>{item.body}</Markdown>
            </article>
          ) : (
            <p className="muted">{canEdit ? 'まだwikiがありません。右上の編集ボタンから書けます。' : 'まだwikiがありません。'}</p>
          )}
          {canEdit && <button className="btn block edit-bottom" onClick={() => setEditing(true)}><Icon name="edit" size={18} /> このページを編集</button>}
        </div>
        {similar.length > 0 && (
          <div className="wiki-card">
            <h3 className="similar-title">Similar Items</h3>
            <div className="grid" style={{ '--cols': 4 } as React.CSSProperties}>
              {similar.map((s) => <ItemTile key={s.id} item={s} onTap={() => nav('/item/' + s.id, { replace: true })} />)}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
