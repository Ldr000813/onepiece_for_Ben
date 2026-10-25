import { getPassword } from './config'
import type { Album, Backend, Item, Settings } from './types'
import { uploadToBlob } from './upload'

type Data = { albums: Album[]; items: Item[]; settings: Settings }

/** Vercel Functions（/api）＋ Neon ＋ Vercel Blob を使うバックエンド */
export function createServerBackend(initial: Data): Backend {
  let state = initial
  const listeners = new Set<(s: Data) => void>()
  const emit = () => listeners.forEach((l) => l(state))

  const refresh = async () => {
    const r = await fetch('/api/data', { cache: 'no-store' })
    if (!r.ok) return
    const j = await r.json()
    state = { albums: j.albums, items: j.items, settings: j.settings }
    emit()
  }
  // 別の端末で更新した内容を、画面に戻ってきたときに取り込む
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && refresh())

  const mutate = async (body: object): Promise<string | undefined> => {
    const r = await fetch('/api/mutate', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-password': getPassword() },
      // undefined は null にして「削除」として送る
      body: JSON.stringify(body, (_k, v) => (v === undefined ? null : v)),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j.error ?? '保存に失敗しました')
    state = { albums: j.albums, items: j.items, settings: j.settings }
    emit()
    return j.createdId
  }

  return {
    mode: 'server',
    subscribe(cb) {
      listeners.add(cb)
      cb(state)
      return () => listeners.delete(cb)
    },
    addAlbum: async (album) => (await mutate({ op: 'addAlbum', album }))!,
    updateAlbum: async (id, patch) => { await mutate({ op: 'updateAlbum', id, patch }) },
    deleteAlbums: async (ids, withItems) => { await mutate({ op: 'deleteAlbums', ids, withItems }) },
    addItem: async (item) => (await mutate({ op: 'addItem', item }))!,
    updateItems: async (patches) => { await mutate({ op: 'updateItems', patches }) },
    deleteItems: async (ids) => { await mutate({ op: 'deleteItems', ids }) },
    saveSettings: async (settings) => { await mutate({ op: 'saveSettings', settings }) },
    uploadImage: uploadToBlob,
  }
}
