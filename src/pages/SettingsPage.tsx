import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemeEditor } from '../components/ThemeEditor'
import { Header, IconButton } from '../components/ui'
import { useAction, useStore } from '../lib/store'

export default function SettingsPage() {
  const { settings, backend, canEdit, authRequired, blobReady, demoReason, login, logout, toast } = useStore()
  const nav = useNavigate()
  const run = useAction()
  const [pw, setPw] = useState('')
  const server = backend?.mode === 'server'

  return (
    <div className="page">
      <Header title="テーマ・設定" left={<IconButton icon="back" label="戻る" onClick={() => nav(-1)} />} />
      <main className="content form">
        <section className="card">
          <h2>アプリ全体の背景</h2>
          <p className="muted small">アルバムごと・wikiページごとの背景は、それぞれの設定で上書きできます。</p>
          <ThemeEditor value={settings} onChange={(t) => backend && run(() => backend.saveSettings(t))} />
        </section>

        {server && (
          <section className="card">
            <h2>編集ロック</h2>
            {!authRequired ? (
              <p className="warn">今は誰でも編集できる状態です。Vercel の環境変数に <b>ADMIN_PASSWORD</b> を追加して再デプロイすると、パスワードを知っている人だけが編集できるようになります。</p>
            ) : canEdit ? (
              <>
                <p className="small">このブラウザでは編集できます。</p>
                <button className="btn" onClick={() => { logout(); toast('ロックしました') }}>この端末で編集をロック</button>
              </>
            ) : (
              <>
                <p className="muted small">閲覧は誰でもできます。編集するにはパスワードを入力してください（この端末に記憶されます）。</p>
                <div className="password-row">
                  <input className="input" type="password" value={pw} placeholder="パスワード" onChange={(e) => setPw(e.target.value)}
                    onKeyDown={async (e) => { if (e.key === 'Enter') toast((await login(pw)) ? '編集できるようになりました' : 'パスワードが違います') }} />
                  <button className="btn primary" onClick={async () => toast((await login(pw)) ? '編集できるようになりました' : 'パスワードが違います')}>解除</button>
                </div>
              </>
            )}
          </section>
        )}

        <section className="card">
          <h2>接続状態</h2>
          <ul className="status-list">
            <li>データ保存：{server ? 'Neon (Postgres)' : 'ブラウザ内（デモ）'}</li>
            <li>画像保存：{server ? (blobReady ? 'Vercel Blob' : '未設定（Blob ストアをプロジェクトに接続してください）') : 'ブラウザ内（デモ）'}</li>
          </ul>
          {demoReason === 'not_configured' && (
            <p className="warn">Vercel 上で動いていますが、データベースが未接続のためデモモードです。Vercel の Storage タブで Neon と Blob をこのプロジェクトに接続し、再デプロイしてください。</p>
          )}
          {demoReason === 'error' && <p className="warn">サーバーに接続できなかったため、デモモードで表示しています。</p>}
          {demoReason === 'local' && <p className="muted small">デモモードです（データはこのブラウザ内だけに保存されます）。</p>}
        </section>
      </main>
    </div>
  )
}
