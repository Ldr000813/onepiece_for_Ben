import { useNavigate } from 'react-router-dom'
import { ThemeEditor } from '../components/ThemeEditor'
import { Header, IconButton } from '../components/ui'
import { hasCloudinary, hasFirebase, ownerEmail } from '../lib/config'
import { useAction, useStore } from '../lib/store'

export default function SettingsPage() {
  const { settings, backend, auth, canEdit } = useStore()
  const nav = useNavigate()
  const run = useAction()
  return (
    <div className="page">
      <Header title="テーマ・設定" left={<IconButton icon="back" label="戻る" onClick={() => nav(-1)} />} />
      <main className="content form">
        <section className="card">
          <h2>アプリ全体の背景</h2>
          <p className="muted small">アルバムごと・wikiページごとの背景は、それぞれの設定で上書きできます。</p>
          <ThemeEditor value={settings} onChange={(t) => backend && run(() => backend.saveSettings(t))} />
        </section>

        <section className="card">
          <h2>アカウント</h2>
          {!hasFirebase ? (
            <p className="muted small">デモモードです（データはこのブラウザ内だけに保存されます）。.env に Firebase と Cloudinary の設定を入れると、クラウド保存とログインが有効になります。</p>
          ) : auth.user ? (
            <>
              <p>{auth.user.name}（{auth.user.email}）</p>
              <p className="muted small">{canEdit ? '編集できます' : `閲覧のみ（編集できるのは ${ownerEmail} だけです）`}</p>
              <button className="btn" onClick={() => run(auth.logout, 'ログアウトしました')}>ログアウト</button>
            </>
          ) : (
            <>
              <p className="muted small">閲覧は誰でもできます。編集するには Google でログインしてください。</p>
              <button className="btn primary" onClick={() => run(auth.login)}>Google でログイン</button>
            </>
          )}
        </section>

        <section className="card">
          <h2>接続状態</h2>
          <ul className="status-list">
            <li>データ保存：{hasFirebase ? 'Firestore' : 'ブラウザ内（デモ）'}</li>
            <li>画像保存：{hasFirebase ? (hasCloudinary ? 'Cloudinary' : '未設定（.env を確認）') : 'ブラウザ内（デモ）'}</li>
          </ul>
        </section>
      </main>
    </div>
  )
}
