import { useStore } from '../lib/store'
import { Sheet } from './ui'

export function AlbumPicker({ title, exclude, onPick, onClose }: { title: string; exclude?: string; onPick: (albumId: string) => void; onClose: () => void }) {
  const { albums } = useStore()
  return (
    <Sheet title={title} onClose={onClose}>
      <div className="picker-list">
        {albums.filter((a) => a.id !== exclude).map((a) => (
          <button key={a.id} className="picker-row" onClick={() => onPick(a.id)}>{a.name}</button>
        ))}
        {albums.length <= 1 && <p className="muted">他のアルバムがありません</p>}
      </div>
    </Sheet>
  )
}
