import { useMemo, useState } from 'react'
import { useAction, useStore } from '../lib/store'
import { Sheet } from './ui'

/** アルバム削除の確認（アルバムだけ／中のアイテムも） */
export function DeleteAlbumsSheet({ ids, onClose, onDeleted }: { ids: string[]; onClose: () => void; onDeleted: () => void }) {
  const { albums, items, backend } = useStore()
  const run = useAction()
  const [busy, setBusy] = useState(false)
  const names = albums.filter((a) => ids.includes(a.id)).map((a) => a.name)
  const { inside, onlyHere } = useMemo(() => {
    const s = new Set(ids)
    const hit = items.filter((i) => i.albumIds.some((a) => s.has(a)))
    return { inside: hit.length, onlyHere: hit.filter((i) => i.albumIds.every((a) => s.has(a))).length }
  }, [items, ids])

  const go = async (withItems: boolean) => {
    if (!backend) return
    setBusy(true)
    const ok = await run(async () => { await backend.deleteAlbums(ids, withItems); return true }, 'アルバムを削除しました')
    setBusy(false)
    if (ok) onDeleted()
  }

  return (
    <Sheet title={ids.length > 1 ? `${ids.length} 個のアルバムを削除` : 'アルバムを削除'} onClose={onClose}>
      <p className="del-names">{names.map((n) => `「${n}」`).join('')}</p>
      <p className="muted small">中のアイテム：{inside} 件{inside > onlyHere ? `（うち ${inside - onlyHere} 件は他のアルバムにも入っています）` : ''}</p>
      <button className="btn block" disabled={busy} onClick={() => go(false)}>アルバムだけ削除（アイテムは残す）</button>
      {onlyHere > 0 && (
        <button className="btn danger block" disabled={busy} onClick={() => go(true)}>
          中のアイテム {onlyHere} 件も一緒に削除
        </button>
      )}
      {onlyHere > 0 && <p className="muted small">※ 一緒に削除すると画像とwikiも消え、元に戻せません。他のアルバムにも入っているアイテムは残ります。</p>}
      <button className="btn ghost block" onClick={onClose}>キャンセル</button>
    </Sheet>
  )
}
