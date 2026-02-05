# SkyWay STT サンプルサーバー

SkyWay STT（音声認識）のセッションを管理するNode.jsサーバーです。ルームの作成、文字起こしセッションの開始と終了のためのREST APIエンドポイントを提供します。

## 機能

- **ルーム管理**: 一意の名前でSkyWayのチャネル/ルームを作成
- **トークン生成**: 適切な権限を持つクライアント用の認証トークンを生成
- **STTセッション制御**: 異なるモード（文字起こし/翻訳）で文字起こしセッションを開始・停止
- **認証**: トークンベースの安全な認証によるAPI操作

## 前提条件

- Node.js (v18以上)
- npm、yarn、またはpnpm
- SkyWayアカウントとAPIクレデンシャル

## セットアップ

1. 依存関係をインストール:

```bash
npm install
# または
yarn install
# または
pnpm install
```

2. このディレクトリに`.env`ファイルを作成し、SkyWayのクレデンシャルを設定:

```env
APP_ID=your_app_id
SECRET=your_secret_key
```

3. main.jsの`sttApiBaseUrl`に利用開始案内メールに記載されている接続先情報URLを指定:

```ts
const sttApiBaseUrl = ""; // 利用開始案内メールに記載されている接続先情報URLを指定してください
```


## サーバーの起動

サーバーを起動:

```bash
npm start
# または
yarn start
# または
pnpm start
```

サーバーは `http://localhost:9090` で起動します。

## APIエンドポイント

### ルームの作成

新しいSkyWayチャネル/ルームを作成し、認証トークンを返します。

**エンドポイント**: `POST /rooms/:roomName/create`

**パラメータ**:
- `roomName` (path): 作成するルームの名前

**レスポンス**:
```json
{
  "token": "eyJhbGc..."
}
```

**例**:
```bash
curl -X POST http://localhost:9090/rooms/my-room/create
```

### 文字起こしの開始

指定されたルームの文字起こしセッションを開始します。

**エンドポイント**: `POST /rooms/:roomName/start`

**ヘッダー**:
- `Authorization`: Bearerトークン（ルーム作成エンドポイントから取得）

**ボディ**:
```json
{
  "sttMode": "transcription" // または "translation"
}
```

**レスポンス**:
```json
{
  "id": "session_id"
}
```

**例**:
```bash
curl -X POST http://localhost:9090/rooms/my-room/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sttMode": "transcription"}'
```

### 文字起こしの終了

指定されたルームの文字起こしセッションを終了します。

**エンドポイント**: `DELETE /rooms/:roomName/end`

**ヘッダー**:
- `Authorization`: Bearerトークン（ルーム作成エンドポイントから取得）

**レスポンス**:
```json
{
  "message": "Transcription ended successfully"
}
```

**例**:
```bash
curl -X DELETE http://localhost:9090/rooms/my-room/end \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## STTモード

- **transcription**: リアルタイム音声認識（文字起こし）
- **translation**: リアルタイム音声認識と翻訳（日本語と英語をサポート）

## セキュリティ

サーバーはトークンベースの認証を実装しています：
- トークンはルーム作成時に生成されます
- トークンはハッシュ化され、ルームIDにマッピングされます
- 文字起こしの開始/終了操作には有効なトークン認証が必要です
- トークンの有効期限は24時間です
