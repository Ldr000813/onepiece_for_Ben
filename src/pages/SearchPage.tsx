import type React from 'react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ItemTile } from '../components/ItemTile'
import { Header, IconButton } from '../components/ui'
import { useStore } from '../lib/store'

export default function SearchPage() {
  const { items, albums } = useStore()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const tag = params.get('tag') ?? ''

  const allTags = useMemo(() => {
    const m = new Map<string, number>()
    items.forEach((i) => i.tags.forEach((t) => m.set(t, (m.get(t) ?? 0) + 1)))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [items])

  const s = q.trim().toLowerCase()
  const hits = items.filter((i) =>
    (!tag || i.tags.includes(tag)) &&
    (!s || [i.title, i.body, ...i.tags, ...i.stats.map((x) => `${x.key} ${x.value}`)].join('\n').toLowerCase().includes(s)))
  const albumHits = s ? albums.filter((a) => a.name.toLowerCase().includes(s)) : []

  return (
    <div className="page">
      <Header
        left={<IconButton icon="back" label="戻る" onClick={() => nav(-1)} />}
        title={<input className="input search" autoFocus placeholder="名前・タグ・本文で検索" value={q} onChange={(e) => setQ(e.target.value)} />}
      />
      <main className="content">
        {allTags.length > 0 && (
          <div className="chips">
            {allTags.map(([t, n]) => (
              <button key={t} className={'chip' + (tag === t ? ' on' : '')}
                onClick={() => setParams(tag === t ? {} : { tag: t })}>#{t} <small>{n}</small></button>
            ))}
          </div>
        )}
        {albumHits.length > 0 && (
          <div className="chips">{albumHits.map((a) => <Link key={a.id} className="chip" to={'/album/' + a.id}>アルバム: {a.name}</Link>)}</div>
        )}
        {(s || tag) && (
          hits.length ? (
            <div className="grid" style={{ '--cols': 3 } as React.CSSProperties}>
              {hits.map((it) => <ItemTile key={it.id} item={it} onTap={() => nav('/item/' + it.id)} />)}
            </div>
          ) : <p className="muted center">見つかりませんでした</p>
        )}
      </main>
    </div>
  )
}
