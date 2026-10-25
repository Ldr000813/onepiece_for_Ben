import { useState } from 'react'
import { useAction, useStore } from '../lib/store'
import type { Theme } from '../lib/types'
import { useFilePicker } from './ui'

const PRESETS = ['#0b1026', '#111111', '#1f2a44', '#2b1d3a', '#173a35', '#9fd3cf', '#f4efe6', '#ffd6e0', '#cfe3ff', '#ffffff']

/** 背景色（カラーピッカー＋HEX）と背景画像の設定 */
export function ThemeEditor({ value, onChange, allowColor = true, imageLabel = '背景画像' }: {
  value: Theme
  onChange: (t: Theme) => void
  allowColor?: boolean
  imageLabel?: string
}) {
  const { backend, canEdit } = useStore()
  const run = useAction()
  const [busy, setBusy] = useState(false)
  const [hex, setHex] = useState(value.bgColor ?? '')
  const picker = useFilePicker(async ([f]) => {
    if (!backend) return
    setBusy(true)
    const img = await run(() => backend.uploadImage(f))
    setBusy(false)
    if (img) onChange({ ...value, bgImageUrl: img.url })
  }, false)

  const setColor = (c: string) => {
    setHex(c)
    if (/^#[0-9a-f]{6}$/i.test(c)) onChange({ ...value, bgColor: c })
  }

  return (
    <div className="theme-editor">
      {allowColor && (
        <>
          <label className="field-label">背景色</label>
          <div className="color-row">
            <input type="color" value={/^#[0-9a-f]{6}$/i.test(hex) ? hex : '#0b1026'} onChange={(e) => setColor(e.target.value)} disabled={!canEdit} aria-label="カラーピッカー" />
            <input className="input hex" value={hex} placeholder="#0b1026" onChange={(e) => setColor(e.target.value.trim())} disabled={!canEdit} />
            {value.bgColor && canEdit && (
              <button className="btn ghost small" onClick={() => { setHex(''); onChange({ ...value, bgColor: undefined }) }}>リセット</button>
            )}
          </div>
          <div className="swatches">
            {PRESETS.map((c) => (
              <button key={c} className={'swatch' + (value.bgColor === c ? ' on' : '')} style={{ background: c }} aria-label={c} onClick={() => canEdit && setColor(c)} />
            ))}
          </div>
        </>
      )}
      <label className="field-label">{imageLabel}</label>
      <div className="bg-image-row">
        {value.bgImageUrl ? <img src={value.bgImageUrl} alt="" /> : <div className="bg-empty">なし</div>}
        {canEdit && (
          <div className="col">
            <button className="btn small" onClick={picker.open} disabled={busy}>{busy ? 'アップロード中…' : '画像を選ぶ'}</button>
            {value.bgImageUrl && <button className="btn ghost small" onClick={() => onChange({ ...value, bgImageUrl: undefined })}>外す</button>}
          </div>
        )}
      </div>
      {picker.input}
    </div>
  )
}
