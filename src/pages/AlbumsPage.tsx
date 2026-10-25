import type React from 'react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { BottomNav, Header, IconButton, Menu, Sheet, Spinner } from '../components/ui'
import { useGridZoom } from '../components/useGridZoom'
import { coverOf, useAction, useStore } from '../lib/store'
import { thumb } from '../lib/util'

export default function AlbumsPage() {
  const { albums, items, loaded, canEdit, backend } = useStore()
  const nav = useNavigate()
  const run = useAction()
  const zoom = useGridZoom('albums', 3, 2, 5)
  const [open, setOpen] = useState(true)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')

  const stats = useMemo(() => {
    const m = new Map<string, { count: number; cover?: string }>()
    for (const it of items) {
      for (const a of it.albumIds) {
        const s = m.get(a) ?? { count: 0 }
        s.count++
        if (!s.cover && coverOf(it)) s.cover = coverOf(it)!.url
        m.set(a, s)
      }
    }
    return m
  }, [items])

  const create = async () => {
    if (!name.trim() || !backend) return
    const id = await run(() => backend.addAlbum({ name: name.trim(), order: albums.length, createdAt: Date.now() }))
    setName('')
    setCreating(false)
    if (id) nav('/album/' + id)
  }

  return (
    <div className="page">
      <Header
        title="Albums"
        right={
          <>
            <IconButton icon="search" label="検索" onClick={() => nav('/search')} />
            {canEdit && <IconButton icon="plus" label="アルバムを作成" onClick={() => setCreating(true)} />}
            <Menu items={[
              { label: '大きく表示', onClick: zoom.zoomIn },
              { label: '小さく表示', onClick: zoom.zoomOut },
              { label: 'テーマ・設定', onClick: () => nav('/settings') },
            ]} />
          </>
        }
      />
      <main className="content">
        <button className="section-toggle" onClick={() => setOpen((o) => !o)}>
          More albums <span className={'chev' + (open ? ' up' : '')}><Icon name="up" size={16} /></span>
        </button>
        {!loaded ? <Spinner /> : open && (
          <div className="grid" ref={zoom.ref} style={{ '--cols': zoom.cols } as React.CSSProperties}>
            {albums.map((a) => {
              const s = stats.get(a.id)
              return (
                <Link key={a.id} to={'/album/' + a.id} className="album-card" style={a.theme?.bgColor ? { background: a.theme.bgColor } : undefined}>
                  {s?.cover && <img src={thumb(s.cover)} alt="" loading="lazy" />}
                  <div className="album-meta">
                    <span className="count">{s?.count ?? 0}</span>
                    <span className="name">{a.name}</span>
                  </div>
                </Link>
              )
            })}
            {canEdit && (
              <button className="album-card add" onClick={() => setCreating(true)} aria-label="アルバムを作成">
                <Icon name="plus" size={32} />
              </button>
            )}
          </div>
        )}
      </main>
      <BottomNav />
      {creating && (
        <Sheet title="新しいアルバム" onClose={() => setCreating(false)}>
          <input className="input" autoFocus placeholder="アルバム名（例：One Piece）" value={name}
            onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()} />
          <button className="btn primary block" onClick={create} disabled={!name.trim()}>作成</button>
        </Sheet>
      )}
    </div>
  )
}
