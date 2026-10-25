import { useRef } from 'react'
import { coverOf } from '../lib/store'
import type { Item } from '../lib/types'
import { thumb } from '../lib/util'
import { Icon } from './Icon'

/** タップ／長押し対応のサムネイル */
export function ItemTile({ item, selected, selecting, onTap, onLongPress, imageUrl, showTitle = true }: {
  item: Item
  selected?: boolean
  selecting?: boolean
  onTap: () => void
  onLongPress?: () => void
  imageUrl?: string
  showTitle?: boolean
}) {
  const timer = useRef<number | null>(null)
  const long = useRef(false)
  const url = imageUrl ?? coverOf(item)?.url
  const clear = () => { if (timer.current) clearTimeout(timer.current); timer.current = null }
  return (
    <button
      className={'tile' + (selected ? ' selected' : '') + (selecting ? ' selecting' : '')}
      onPointerDown={() => {
        long.current = false
        if (!onLongPress) return
        timer.current = window.setTimeout(() => { long.current = true; onLongPress() }, 450)
      }}
      onPointerUp={clear}
      onPointerLeave={clear}
      onPointerCancel={clear}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => { if (long.current) { long.current = false; return } onTap() }}
    >
      {url ? <img src={thumb(url)} alt={item.title} loading="lazy" draggable={false} /> : <div className="tile-empty"><Icon name="image" /></div>}
      {showTitle && <span className="tile-title">{item.title}</span>}
      {selecting && <span className="tick">{selected && <Icon name="check" size={16} />}</span>}
    </button>
  )
}
