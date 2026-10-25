import type React from 'react'
import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DeleteAlbumsSheet } from '../components/DeleteAlbumsSheet'
import { Icon } from '../components/Icon'
import { BottomNav, Header, IconButton, Menu, Sheet, Spinner } from '../components/ui'
import { useGridZoom } from '../components/useGridZoom'
import { coverOf, useAction, useStore } from '../lib/store'
import type { Album } from '../lib/types'
import { thumbOf } from '../lib/util'

function AlbumCard({ a, count, cover, selecting, selected, onToggle, onLongPress }: {
  a: Album; count: number; cover?: string; selecting: boolean; selected: boolean; onToggle: () => void; onLongPress?: () => void
}) {
  const timer = useRef<number | null>(null)
  const long = useRef(false)
  const clear = () => { if (timer.current) clearTimeout(timer.current); timer.current = null }
  const inner = (
    <>
      {cover && <img src={cover} alt="" loading="lazy" draggable={false} />}
      <div className="album-meta">
        <span className="count">{count}</span>
        <span className="name">{a.name}</span>
      </div>
      {selecting && <span className="tick">{selected && <Icon name="check" size={16} />}</span>}
    </>
  )
  const style = a.theme?.bgColor ? { background: a.theme.bgColor } : undefined
  const press = {
    onPointerDown: () => { long.current = false; if (onLongPress) timer.current = window.setTimeout(() => { long.current = true; onLongPress() }, 450) },
    onPointerUp: clear, onPointerLeave: clear, onPointerCancel: clear,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  }
  if (selecting)
    return <button className={'album-card' + (selected ? ' selected' : '')} style={style} onClick={onToggle}>{inner}</button>
  return (
    <Link to={'/album/' + a.id} className="album-card" style={style} {...press}
      onClick={(e) => { if (long.current) { e.preventDefault(); long.current = false } }}>
      {inner}
    </Link>
  )
}

export default function AlbumsPage() {
  const { albums, items, loaded, canEdit, backend } = useStore()
  const nav = useNavigate()
  const run = useAction()
  const zoom = useGridZoom('albums', 3, 2, 5)
  const [open, setOpen] = useState(true)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [selecting, setSelecting] = useState(false)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  const stats = useMemo(() => {
    const m = new Map<string, { count: number; cover?: string }>()
    for (const it of items) {
      for (const a of it.albumIds) {
        const s = m.get(a) ?? { count: 0 }
        s.count++
        if (!s.cover && coverOf(it)) s.cover = thumbOf(coverOf(it))
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
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const exitSelect = () => { setSelecting(false); setSel(new Set()) }

  return (
    <div className="page">
      <Header
        title={selecting ? `${sel.size} 件選択` : 'Albums'}
        left={selecting ? <IconButton icon="close" label="選択を終了" onClick={exitSelect} /> : undefined}
        right={
          selecting ? (
            <button className="btn small" onClick={() => setSel(sel.size === albums.length ? new Set() : new Set(albums.map((a) => a.id)))}>
              {sel.size === albums.length ? '選択解除' : 'すべて選択'}
            </button>
          ) : (
            <>
              <IconButton icon="search" label="検索" onClick={() => nav('/search')} />
              {canEdit && <IconButton icon="plus" label="アルバムを作成" onClick={() => setCreating(true)} />}
              <Menu items={[
                { label: '大きく表示', onClick: zoom.zoomIn },
                { label: '小さく表示', onClick: zoom.zoomOut },
                ...(canEdit && albums.length ? [{ label: 'アルバムを選択して削除', onClick: () => setSelecting(true) }] : []),
                { label: 'テーマ・設定', onClick: () => nav('/settings') },
              ]} />
            </>
          )
        }
      />
      <main className="content">
        <button className="section-toggle" onClick={() => setOpen((o) => !o)}>
          More albums <span className={'chev' + (open ? ' up' : '')}><Icon name="up" size={16} /></span>
        </button>
        {!loaded ? <Spinner /> : open && (
          <div className="grid" ref={zoom.ref} style={{ '--cols': zoom.cols } as React.CSSProperties}>
            {albums.map((a) => (
              <AlbumCard key={a.id} a={a} count={stats.get(a.id)?.count ?? 0} cover={stats.get(a.id)?.cover}
                selecting={selecting} selected={sel.has(a.id)} onToggle={() => toggle(a.id)}
                onLongPress={canEdit ? () => { setSelecting(true); toggle(a.id) } : undefined} />
            ))}
            {canEdit && !selecting && (
              <button className="album-card add" onClick={() => setCreating(true)} aria-label="アルバムを作成">
                <Icon name="plus" size={32} />
              </button>
            )}
          </div>
        )}
      </main>
      {selecting ? (
        <div className="action-bar">
          <button disabled={!sel.size} className="danger" onClick={() => setDeleting(true)}><Icon name="trash" /><span>削除</span></button>
        </div>
      ) : <BottomNav />}
      {deleting && <DeleteAlbumsSheet ids={[...sel]} onClose={() => setDeleting(false)} onDeleted={() => { setDeleting(false); exitSelect() }} />}
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
