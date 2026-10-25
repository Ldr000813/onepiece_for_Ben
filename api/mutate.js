import { fromRequest, json } from './_lib/auth.js'
import { deleteBlobs, imagesOf } from './_lib/blob.js'
import { dbConfigured, loadAll, newId, remove, upsert } from './_lib/db.js'

/** patch を適用（null のキーは削除扱い） */
const merge = (base, patch) => {
  const out = { ...base }
  for (const [k, v] of Object.entries(patch ?? {})) {
    if (k === 'id') continue
    if (v === null) delete out[k]
    else out[k] = v
  }
  return out
}

export async function POST(req) {
  if (!dbConfigured()) return json({ error: 'データベースが未設定です' }, 503)
  if (!fromRequest(req)) return json({ error: '編集にはパスワードが必要です' }, 401)
  const body = await req.json().catch(() => null)
  if (!body?.op) return json({ error: 'bad request' }, 400)

  try {
    const db = await loadAll()
    const albums = new Map(db.albums.map((a) => [a.id, a]))
    const items = new Map(db.items.map((i) => [i.id, i]))
    const trash = []
    let createdId

    switch (body.op) {
      case 'addAlbum': {
        createdId = newId()
        await upsert('albums', createdId, body.album)
        break
      }
      case 'updateAlbum': {
        const old = albums.get(body.id)
        if (!old) return json({ error: 'アルバムが見つかりません' }, 404)
        const next = merge(old, body.patch)
        if (old.theme?.bgImageUrl && old.theme.bgImageUrl !== next.theme?.bgImageUrl) trash.push(old.theme.bgImageUrl)
        await upsert('albums', body.id, next)
        break
      }
      case 'deleteAlbums': {
        const ids = new Set(body.ids ?? [])
        const delItems = []
        for (const it of items.values()) {
          if (!it.albumIds?.some((a) => ids.has(a))) continue
          const rest = it.albumIds.filter((a) => !ids.has(a))
          if (body.withItems && rest.length === 0) {
            delItems.push(it.id)
            trash.push(...imagesOf(it))
          } else {
            await upsert('items', it.id, { ...it, albumIds: rest })
          }
        }
        for (const id of ids) { const a = albums.get(id); if (a?.theme?.bgImageUrl) trash.push(a.theme.bgImageUrl) }
        await remove('items', delItems)
        await remove('albums', [...ids])
        break
      }
      case 'addItem': {
        createdId = newId()
        await upsert('items', createdId, body.item)
        break
      }
      case 'updateItems': {
        for (const { id, patch } of body.patches ?? []) {
          const old = items.get(id)
          if (!old) continue
          const next = merge(old, patch)
          const keep = new Set(imagesOf(next))
          trash.push(...imagesOf(old).filter((u) => !keep.has(u)))
          await upsert('items', id, next)
        }
        break
      }
      case 'deleteItems': {
        const ids = (body.ids ?? []).filter((id) => items.has(id))
        ids.forEach((id) => trash.push(...imagesOf(items.get(id))))
        await remove('items', ids)
        break
      }
      case 'saveSettings': {
        if (db.settings.bgImageUrl && db.settings.bgImageUrl !== body.settings?.bgImageUrl) trash.push(db.settings.bgImageUrl)
        await upsert('settings', 'global', body.settings ?? {})
        break
      }
      default:
        return json({ error: 'unknown op' }, 400)
    }

    await deleteBlobs(trash)
    return json({ ...(await loadAll()), createdId })
  } catch (e) {
    console.error(e)
    return json({ error: '保存に失敗しました: ' + String(e?.message ?? e) }, 500)
  }
}
