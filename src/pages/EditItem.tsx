import { useState } from 'react'
import { Icon } from '../components/Icon'
import { ThemeEditor } from '../components/ThemeEditor'
import { Header, IconButton, useFilePicker } from '../components/ui'
import { useAction, useStore } from '../lib/store'
import type { Item, Stat } from '../lib/types'
import { thumb } from '../lib/util'

const TEMPLATE = `## Description\n\n\n## History\n\n\n## Episodes\n\n`

export default function EditItem({ item, onDone }: { item: Item; onDone: (deleted?: boolean) => void }) {
  const { albums, backend, items } = useStore()
  const run = useAction()
  const [d, setD] = useState<Item>(() => ({ ...item, stats: item.stats.map((s) => ({ ...s })) }))
  const [tagInput, setTagInput] = useState('')
  const [uploading, setUploading] = useState(0)
  const set = (p: Partial<Item>) => setD((x) => ({ ...x, ...p }))

  const allTags = [...new Set(items.flatMap((i) => i.tags))].filter((t) => !d.tags.includes(t))

  const files = useFilePicker(async (fs) => {
    if (!backend) return
    setUploading(fs.length)
    for (const f of fs) {
      const img = await run(() => backend.uploadImage(f))
      if (img) setD((x) => ({ ...x, images: [...x.images, img] }))
      setUploading((n) => n - 1)
    }
  })

  const addTag = (t: string) => {
    const v = t.trim().replace(/^#/, '')
    if (v && !d.tags.includes(v)) set({ tags: [...d.tags, v] })
    setTagInput('')
  }
  const setStat = (k: number, p: Partial<Stat>) => set({ stats: d.stats.map((s, i) => (i === k ? { ...s, ...p } : s)) })
  const moveImg = (k: number, dir: -1 | 1) => {
    const j = k + dir
    if (j < 0 || j >= d.images.length) return
    const arr = [...d.images]
    ;[arr[k], arr[j]] = [arr[j], arr[k]]
    let cover = d.coverIndex
    if (cover === k) cover = j
    else if (cover === j) cover = k
    set({ images: arr, coverIndex: cover })
  }
  const removeImg = (k: number) => {
    const arr = d.images.filter((_, i) => i !== k)
    set({ images: arr, coverIndex: Math.min(d.coverIndex > k ? d.coverIndex - 1 : d.coverIndex === k ? 0 : d.coverIndex, Math.max(0, arr.length - 1)) })
  }

  const save = async () => {
    if (!backend) return
    const { id, createdAt, ...rest } = d
    void createdAt
    const ok = await run(async () => {
      await backend.updateItems([{
        id,
        patch: { ...rest, bgImageUrl: rest.bgImageUrl, title: rest.title.trim(), stats: rest.stats.filter((s) => s.key.trim() || s.value.trim()), updatedAt: Date.now() },
      }])
      return true
    }, '保存しました')
    if (ok) onDone()
  }

  const remove = async () => {
    if (!backend || !confirm('このアイテムを完全に削除しますか？')) return
    await run(() => backend.deleteItems([item.id]), '削除しました')
    onDone(true)
  }

  return (
    <div className="page edit-page">
      <Header title="編集" left={<IconButton icon="close" label="キャンセル" onClick={() => onDone()} />}
        right={<button className="btn primary small" onClick={save} disabled={uploading > 0}>保存</button>} />
      <main className="content form">
        <label className="field-label">タイトル</label>
        <input className="input" value={d.title} placeholder="例：ロロノア・ゾロ" onChange={(e) => set({ title: e.target.value })} />

        <label className="field-label">画像 <small className="muted">★＝カバー画像</small></label>
        <div className="img-edit">
          {d.images.map((img, k) => (
            <div key={img.id} className={'img-cell' + (k === d.coverIndex ? ' cover' : '')}>
              <img src={thumb(img.url, 200)} alt="" />
              <div className="img-tools">
                <button aria-label="前へ" onClick={() => moveImg(k, -1)}><Icon name="left" size={16} /></button>
                <button aria-label="カバーにする" onClick={() => set({ coverIndex: k })}><Icon name="star" size={16} fill={k === d.coverIndex} /></button>
                <button aria-label="後へ" onClick={() => moveImg(k, 1)}><Icon name="right" size={16} /></button>
                <button aria-label="削除" onClick={() => removeImg(k)}><Icon name="close" size={16} /></button>
              </div>
            </div>
          ))}
          <button className="img-cell add" onClick={files.open} disabled={uploading > 0}>
            {uploading > 0 ? <span>残り {uploading}</span> : <Icon name="plus" size={28} />}
          </button>
        </div>

        <label className="field-label">アルバム</label>
        <div className="chips">
          {albums.map((a) => (
            <button key={a.id} className={'chip' + (d.albumIds.includes(a.id) ? ' on' : '')}
              onClick={() => set({ albumIds: d.albumIds.includes(a.id) ? d.albumIds.filter((x) => x !== a.id) : [...d.albumIds, a.id] })}>{a.name}</button>
          ))}
        </div>

        <label className="field-label">タグ</label>
        <div className="chips">
          {d.tags.map((t) => (
            <button key={t} className="chip on" onClick={() => set({ tags: d.tags.filter((x) => x !== t) })}>#{t} ×</button>
          ))}
        </div>
        <input className="input" value={tagInput} placeholder="タグを入力して Enter（例：麦わらの一味）" list="tag-suggest"
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) } }}
          onBlur={() => tagInput && addTag(tagInput)} />
        <datalist id="tag-suggest">{allTags.map((t) => <option key={t} value={t} />)}</datalist>

        <label className="field-label">STATISTICS（項目と値）</label>
        <div className="stat-edit">
          {d.stats.map((s, k) => (
            <div key={k} className="stat-row">
              <input className="input" value={s.key} placeholder="項目（例：懸賞金）" onChange={(e) => setStat(k, { key: e.target.value })} />
              <input className="input" value={s.value} placeholder="値" onChange={(e) => setStat(k, { value: e.target.value })} />
              <IconButton icon="close" label="行を削除" onClick={() => set({ stats: d.stats.filter((_, i) => i !== k) })} />
            </div>
          ))}
          <button className="btn ghost small" onClick={() => set({ stats: [...d.stats, { key: '', value: '' }] })}><Icon name="plus" size={16} /> 項目を追加</button>
        </div>

        <label className="field-label">本文（Markdown：「## 見出し」でセクション分け）</label>
        {!d.body.trim() && <button className="btn ghost small" onClick={() => set({ body: TEMPLATE })}>テンプレートを入れる</button>}
        <textarea className="input md-input" value={d.body} rows={14} placeholder={'## Description\n説明…\n\n## Episodes\n- 第1話 …'}
          onChange={(e) => set({ body: e.target.value })} />

        <ThemeEditor allowColor={false} imageLabel="このページの背景画像" value={{ bgImageUrl: d.bgImageUrl }} onChange={(t) => set({ bgImageUrl: t.bgImageUrl })} />

        <hr />
        <button className="btn danger block" onClick={remove}><Icon name="trash" size={18} /> このアイテムを削除</button>
      </main>
      {files.input}
    </div>
  )
}
