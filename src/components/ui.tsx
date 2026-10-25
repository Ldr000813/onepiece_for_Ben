import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Icon } from './Icon'

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/pictures" className={({ isActive }) => (isActive ? 'active' : '')}>
        <Icon name="image" /> <span>Pictures</span>
      </NavLink>
      <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
        <Icon name="folder" fill /> <span>Albums</span>
      </NavLink>
    </nav>
  )
}

export function IconButton({ icon, label, onClick, active }: { icon: Parameters<typeof Icon>[0]['name']; label: string; onClick?: () => void; active?: boolean }) {
  return (
    <button className={'icon-btn' + (active ? ' on' : '')} aria-label={label} title={label} onClick={onClick}>
      <Icon name={icon} />
    </button>
  )
}

export function Header({ title, left, right }: { title: ReactNode; left?: ReactNode; right?: ReactNode }) {
  return (
    <header className="app-header">
      {left}
      <h1>{title}</h1>
      <div className="header-actions">{right}</div>
    </header>
  )
}

/** ⋮ メニュー */
export function Menu({ items }: { items: { label: string; onClick: () => void; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: Event) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('pointerdown', h)
    return () => document.removeEventListener('pointerdown', h)
  }, [open])
  return (
    <div className="menu-wrap" ref={ref}>
      <IconButton icon="more" label="メニュー" onClick={() => setOpen((o) => !o)} />
      {open && (
        <div className="menu">
          {items.map((it) => (
            <button key={it.label} className={it.danger ? 'danger' : ''} onClick={() => { setOpen(false); it.onClick() }}>
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** 下から出るシート */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <IconButton icon="close" label="閉じる" onClick={onClose} />
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}

/** 非表示の file input を開くフック */
export function useFilePicker(onFiles: (files: File[]) => void, multiple = true) {
  const ref = useRef<HTMLInputElement | null>(null)
  const input = (
    <input ref={ref} type="file" accept="image/*" multiple={multiple} hidden
      onChange={(e) => {
        const f = Array.from(e.target.files ?? [])
        e.target.value = ''
        if (f.length) onFiles(f)
      }} />
  )
  return { open: () => ref.current?.click(), input }
}

export function Spinner() {
  return <div className="spinner" aria-label="読み込み中" />
}
