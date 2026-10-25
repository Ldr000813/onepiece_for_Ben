# Album Wiki

画像アルバム＋wiki アプリ（ワンピースのキャラ図鑑など）。
すべて Vercel 上で完結します：テキストは **Neon (Postgres)**、画像は **Vercel Blob**、API は **Vercel Functions**（`api/` フォルダ）。

## すぐ試す（デモモード）

```bash
npm install
npm run dev
```

ローカルの `npm run dev` は **デモモード** で動きます（データはブラウザ内の IndexedDB に保存。ログイン不要）。
スマ## 本番設定（Vercel の画面だけで完了）

1. Vercel のプロジェクト →「**Storage**」タブ
   - 「Create Database」→ **Blob** を作成（アクセスは **Public**）→ このプロジェクトに Connect
   - 「Create Database」→ **Neon**（Postgres）を作成 → このプロジェクトに Connect
   - → `BLOB_READ_WRITE_TOKEN` と `DATABASE_URL` が自動で環境変数に入ります
2. Settings → Environment Variables に **`ADMIN_PASSWORD`**（編集用パスワード）を追加
3. Deployments → 最新のデプロイの ⋮ → **Redeploy**
4. サイトの ⋮ → テーマ・設定 →「編集ロック」にパスワードを入力すると編集できます（端末に記憶）

テーブルは最初のアクセス時に自動作成されます。
ローカルで本番と同じ構成を動かすときは `vercel link` → `vercel env pull` → `vercel dev`。

/ Netlify でも `dist` を置くだけで動きます。その場合は SPA のリライト設定と承認済みドメインの追加が必要です）

## 使い方
- **Albums**：＋でアルバム作成。⋮ → テーマ・設定で全体の背景色／背景画像
- **アルバム削除**：アルバム内の ⋮ →「アルバムを削除」、または Albums で長押し（⋮ →「アルバムを選択して削除」）で複数まとめて。
  「アルバムだけ削除」か「中のアイテムも一緒に削除」を選べます（他のアルバムにも入っているアイテムは残ります）
- **アルバム内**：＋でカメラロールから写真を追加（1枚＝1アイテム）。
  長押し or ☑ で複数選択 → 移動／コピー／並び替え（前へ・後へ）／アルバムから外す／削除
- **ピンチイン・アウト**（PCは Ctrl＋ホイール、または ⋮ メニュー）でグリッドの大きさを変更
- **画像をタップ** → 全画面表示。下にスクロールすると wiki（STATISTICS・本文）
- 本文は Markdown。`## 見出し` を書くと上部にセクションリンク（Description • History …）が出ます
- スマホを横にすると左に画像、右に wiki の2カラム表示
- 同じタグを持つアイテムは wiki の下に「Similar Items」として表示

## データ構造（Neon：JSON ドキュメント）
```
albums   (id, data)  data = { name, order, createdAt, theme{bgColor, bgImageUrl} }
items    (id, data)  data = { title, albumIds[], tags[], stats[{key,value}], body(Markdown),
                              images[{id,url,thumbUrl,width,height}], coverIndex, order,
                              bgImageUrl, createdAt, updatedAt }
settings (id='global', data = { bgColor, bgImageUrl })
```
- 画像はアップロード時に本体（最大 2400px）とサムネイル（480px）の2枚を Blob に保存
- アイテムや画像を削除すると、Blob 上のファイルも自動で削除されます
- 閲覧は誰でも、編集は `ADMIN_PASSWORD` を知っている人だけ

## 無料枠の目安（Vercel Hobby）
- Blob：保存 1GB・転送 月10GB 程度（アカウント全体で共有）
- Neon：無料プランで個人利用なら十分
