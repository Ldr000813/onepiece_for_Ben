import type React from 'react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlbumPicker } from '../components/AlbumPicker'
import { Icon } from '../components/Icon'
import { ItemTile } from '../components/ItemTile'
import { ThemeEditor } from '../components/ThemeEditor'
import { BottomNav, Header, IconButton, Menu, Sheet, Spinner, useFilePicker } from '../components/ui'
import { useGridZoom } from '../components/useGridZoom'
import { useAction, useStore } from '../lib/store'
import { bgStyle, fileTitle, isLight } from '../lib/util'

export default function AlbumPage() {
  const { id = '' } = useParams()
  const { albums, items, loaded, canEdit, backend, settings, toast } = useStore()
  const nav = useNavigate()
  const run = useAction()
  const zoom = useGridZoom('album', 3, 2, 6)
  const album = albums.find((a) => a.id === id)
  const list = useMemo(() => items.filter((i) => i.albumIds.includes(id)), [items, id])
  const [selecting, setSelecting] = useState(false)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [picker, setPicker] = useState<null | 'move' | 'copy'>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [rename, setRename] = useState('')
  const [progress, setProgress] = useState<string | null>(null)

  const files = useFilePicker(async (fs) => {
    if (!backend) return
    const maxOrder = Math.max(0, ...items.map((i) => i.order))
    let done = 0
    for (const f of fs) {
      setProgress(`アップロード中 ${done + 1}/${fs.length}`)
      const img = await run(() => backend.uploadImage(f))
      if (!img) continue
      const now = Date.now()
      await run(() => backend.addItem({
        title: fileTitle(f.name), albumIds: [id], tags: [], stats: [], body: '',
        images: [img], coverIndex: 0, order: maxOrder + 1 + done, createdAt: now, updatedAt: now,
      }))
      done++
    }
    setProgress(null)
    if (done) toast(`${done} 件追加しました`)
  })

  if (!loaded) return <div className="page"><Spinner /></div>
  if (!album) return <div className="page"><Header title="見つかりません" left={<IconButton icon="back" label="戻る" onClick={() => nav('/')} />} /></div>

  const theme = { bgColor: album.theme?.bgColor ?? settings.bgColor, bgImageUrl: album.theme?.bgImageUrl ?? settings.bgImageUrl }
  const ids = [...sel]
  const toggle = (iid: string) => setSel((s) => { const n = new Set(s); n.has(iid) ? n.delete(iid) : n.add(iid); return n })
  const exitSelect = () => { setSelecting(false); setSel(new Set()) }

  const moveCopy = async (target: string) => {
    if (!backend) return
    const mode = picker
    setPicker(null)
    await run(() => backend.updateItems(list.filter((i) => sel.has(i.id)).map((i) => ({
      id: i.id,
      patch: {
        albumIds: mode === 'move'
          ? [...new Set([...i.albumIds.filter((a) => a !== id), target])]
          : [...new Set([...i.albumIds, target])],
      },
    }))), mode === 'move' ? '移動しました' : 'コピーしました')
    exitSelect()
  }

  const removeFromAlbum = async () => {
    if (!backend || !confirm(`${ids.length} 件をこのアルバムから外しますか？（アイテム自体は残ります）`)) return
    await run(() => backend.updateItems(list.filter((i) => sel.has(i.id)).map((i) => ({ id: i.id, patch: { albumIds: i.albumIds.filter((a) => a !== id) } }))), 'アルバムから外しました')
    exitSelect()
  }

  const deleteItems = async () => {
    if (!backend || !confirm(`${ids.length} 件を完全に削除しますか？（全アルバムから消え、wikiも削除されます）`)) return
    await run(() => backend.deleteItems(ids), '削除しました')
    exitSelect()
  }

  /** 選択中のアイテムを前（-1）／後ろ（+1）へずらす */
  const shift = async (dir: -1 | 1) => {
    if (!backend) return
    const arr = [...list]
    const idx = arr.map((x, i) => (sel.has(x.id) ? i : -1)).filter((i) => i >= 0)
    const order = dir === -1 ? idx : idx.reverse()
    for (const i of order) {
      const j = i + dir
      if (j < 0 || j >= arr.length || sel.has(arr[j].id)) continue
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    // 並び順はアルバム内の相対順として order を振り直す
    const slots = list.map((x) => x.order).sort((a, b) => a - b)
    const fixed = slots.map((o, k) => (k > 0 && o <= slots[k - 1] ? slots[k - 1] + 1 : o))
    for (let k = 1; k < fixed.length; k++) if (fixed[k] <= fixed[k - 1]) fixed[k] = fixed[k - 1] + 1
    await run(() => backend.updateItems(arr.map((x, k) => ({ id: x.id, patch: { order: fixed[k] } })).filter((p, k) => arr[k].order !== p.patch.order)))
  }

  const saveTheme = (t: { bgColor?: string; bgImageUrl?: string }) => backend && run(() => backend.updateAlbum(id, { theme: t }))

  return (
    <div className={'page themed' + (isLight(theme.bgColor) && !theme.bgImageUrl ? ' light' : '')} style={bgStyle(theme.bgColor, theme.bgImageUrl)}>
      <Header
        title={selecting ? `${sel.size} 件選択` : album.name}
        left={selecting
          ? <IconButton icon="close" label="選択を終了" onClick={exitSelect} />
          : <IconButton icon="back" label="戻る" onClick={() => nav('/')} />}
        right={
          <>
            {canEdit && <IconButton icon="check" label="選択" active={selecting} onClick={() => (selecting ? exitSelect() : setSelecting(true))} />}
            {canEdit && !selecting && <IconButton icon="plus" label="写真を追加" onClick={files.open} />}
            {!selecting && (
              <Menu items={[
                { label: '大きく表示', onClick: zoom.zoomIn },
                { label: '小さく表示', onClick: zoom.zoomOut },
                ...(canEdit ? [{ label: 'アルバム設定（名前・背景）', onClick: () => { setRename(album.name); setSettingsOpen(true) } }] : []),
              ]} />
            )}
          </>
        }
      />
      <main className="content" ref={zoom.ref}>
        {progress && <div className="progress">{progress}</div>}
        {list.length === 0 ? (
          <div className="empty-grid">
            {[0, 1, 2, 3].map((k) => (
              <button key={k} className="add-big" onClick={canEdit ? files.open : undefined}>
                <Icon name="plus" size={40} /><span>[ADD FIRST ITEM]</span>
              </button>
            ))}
            {Array.from({ length: 8 }).map((_, k) => (
              <button key={'s' + k} className="add-small" onClick={canEdit ? files.open : undefined} aria-label="追加"><Icon name="plus" /></button>
            ))}
          </div>
        ) : (
          <div className="grid" style={{ '--cols': zoom.cols } as React.CSSProperties}>
            {list.map((it) => (
              <ItemTile key={it.id} item={it} selecting={selecting} selected={sel.has(it.id)} showTitle={zoom.cols <= 4}
                onTap={() => (selecting ? toggle(it.id) : nav(`/item/${it.id}?from=${id}`))}
                onLongPress={canEdit ? () => { setSelecting(true); toggle(it.id) } : undefined} />
            ))}
          </div>
        )}
      </main>

      {selecting ? (
        <div className="action-bar">
          <button disabled={!sel.size} onClick={() => setPicker('move')}><Icon name="move" /><span>移動</span></button>
          <button disabled={!sel.size} onClick={() => setPicker('copy')}><Icon name="copy" /><span>コピー</span></button>
          <button disabled={!sel.size} onClick={() => shift(-1)}><Icon name="left" /><span>前へ</span></button>
          <button disabled={!sel.size} onClick={() => shift(1)}><Icon name="right" /><span>後へ</span></button>
          <button disabled={!sel.size} onClick={removeFromAlbum}><Icon name="remove" /><span>外す</span></button>
          <button disabled={!sel.size} className="danger" onClick={deleteItems}><Icon name="trash" /><span>削除</span></button>
        </div>
      ) : <BottomNav />}

      {files.input}
      {picker && <AlbumPicker title={picker === 'move' ? '移動先のアルバム' : 'コピー先のアルバム'} exclude={id} onPick={moveCopy} onClose={() => setPicker(null)} />}
      {settingsOpen && (
        <Sheet title="アルバム設定" onClose={() => setSettingsOpen(false)}>
          <label className="field-label">名前</label>
          <div className="row">
            <input className="input" value={rename} onChange={(e) => setRename(e.target.value)} />
            <button className="btn" disabled={!rename.trim() || rename === album.name}
              onClick={() => backend && run(() => backend.updateAlbum(id, { name: rename.trim() }), '名前を変更しました')}>保存</button>
          </div>
          <ThemeEditor value={album.theme ?? {}} onChange={saveTheme} />
          <hr />
          <button className="btn danger block" onClick={async () => {
            if (!backend || !confirm(`アルバム「${album.name}」を削除しますか？（中のアイテムは残ります）`)) return
            await run(() => backend.deleteAlbum(id), 'アルバムを削除しました')
            nav('/')
          }}>アルバムを削除</button>
        </Sheet>
      )}
    </div>
  )
}
