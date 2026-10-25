# Album Wiki

画像アルバム＋wiki アプリ（ワンピースのキャラ図鑑など）。
テキストは **Firestore**、画像は **Cloudinary** に保存します。

## すぐ試す（デモモード）

```bash
npm install
npm run dev
```

`.env` がなければ **デモモード** で動きます（データはブラウザ内の IndexedDB に保存。ログイン不要）。
スマホで試すときは、同じ Wi-Fi で `npm run dev` に表示される `Network:` の URL を開いてください。

## 本番設定

### 1. Cloudinary
1. https://cloudinary.com で無料登録 → ダッシュボードの **Cloud name** を控える
2. Settings → Upload → **Upload presets** → Add upload preset
   - Signing mode: **Unsigned**
   - 名前（例 `album_wiki`）を控える

### 2. Firebase（Spark＝無料プランのまま使えます）
1. https://console.firebase.google.com でプロジェクト作成
2. **Firestore Database** を作成（本番モード、リージョンは `asia-northeast1` など）
3. **Authentication** → ログイン方法 → **Google** を有効化
4. プロジェクトの設定 → マイアプリ → **ウェブアプリを追加** → 表示される `firebaseConfig` の値を控える
5. `firestore.rules` の `YOUR_EMAIL@gmail.com` を自分のメールに書き換え、
   コンソールの Firestore →「ルール」に貼り付けて公開（または `firebase deploy --only firestore:rules`）

### 3. .env
`.env.example` をコピーして `.env` を作り、上で控えた値を入れます。

```bash
cp .env.example .env
```

### 4. デプロイ（Firebase Hosting の例）
```bash
npm install -g firebase-tools
firebase login
firebase use --add      # 作ったプロジェクトを選択
npm run build
firebase deploy
```
デプロイ後、Authentication →「設定」→「承認済みドメイン」に公開 URL が入っているか確認してください。
（Vercel / Netlify でも `dist` を置くだけで動きます。その場合は SPA のリライト設定と承認済みドメインの追加が必要です）

## 使い方
- **Albums**：＋でアルバム作成。⋮ → テーマ・設定で全体の背景色／背景画像
- **アルバム内**：＋でカメラロールから写真を追加（1枚＝1アイテム）。
  長押し or ☑ で複数選択 → 移動／コピー／並び替え（前へ・後へ）／アルバムから外す／削除
- **ピンチイン・アウト**（PCは Ctrl＋ホイール、または ⋮ メニュー）でグリッドの大きさを変更
- **画像をタップ** → 全画面表示。下にスクロールすると wiki（STATISTICS・本文）
- 本文は Markdown。`## 見出し` を書くと上部にセクションリンク（Description • History …）が出ます
- スマホを横にすると左に画像、右に wiki の2カラム表示
- 同じタグを持つアイテムは wiki の下に「Similar Items」として表示

## データ構造（Firestore）
```
albums/{id}       name, order, createdAt, theme{bgColor, bgImageUrl}
items/{id}        title, albumIds[], tags[], stats[{key,value}], body(Markdown),
                  images[{id,url,publicId,width,height}], coverIndex, order,
                  bgImageUrl, createdAt, updatedAt
settings/global   bgColor, bgImageUrl
```
- 1アイテムが複数アルバムに入れます（コピー＝albumIds に追加、移動＝付け替え）
- 閲覧は誰でも、編集は `firestore.rules` に書いたアカウントだけ

## 注意
- 署名なしアップロードでは Cloudinary 上の画像を削除できません。アプリで画像を外しても Cloudinary には残るので、気になる場合は Cloudinary の管理画面（Media Library の `album-wiki` フォルダ）で整理してください。
- 画像はアップロード前に最大 2400px に縮小してから送るので、無料枠を節約できます。
