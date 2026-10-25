import type React from 'react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ItemTile } from '../components/ItemTile'
import { BottomNav, Header, IconButton, Menu, Spinner } from '../components/ui'
import { useGridZoom } from '../components/useGridZoom'
import { useStore } from '../lib/store'

/** 全アイテムの全画像を新しい順に表示 */
export default function PicturesPage() {
  const { items, loaded } = useStore()
  const nav = useNavigate()
  const zoom = useGridZoom('pictures', 4, 2, 6)
  const pics = useMemo(
    () => [...items].sort((a, b) => b.createdAt - a.createdAt).flatMap((it) => it.images.map((img, k) => ({ it, img, k }))),
    [items],
  )
  return (
    <div className="page">
      <Header title="Pictures" right={
        <>
          <IconButton icon="search" label="検索" onClick={() => nav('/search')} />
          <Menu items={[{ label: '大きく表示', onClick: zoom.zoomIn }, { label: '小さく表示', onClick: zoom.zoomOut }]} />
        </>
      } />
      <main className="content" ref={zoom.ref}>
        {!loaded ? <Spinner /> : pics.length === 0 ? (
          <p className="muted center">まだ写真がありません。アルバムを開いて ＋ から追加してください。</p>
        ) : (
          <div className="grid tight" style={{ '--cols': zoom.cols } as React.CSSProperties}>
            {pics.map(({ it, img, k }) => (
              <ItemTile key={img.id} item={it} image={img} showTitle={false} onTap={() => nav(`/item/${it.id}?img=${k}`)} />
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
