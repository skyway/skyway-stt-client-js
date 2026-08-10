# SkyWay STT チュートリアルアプリ

SkyWay Room SDKとSkyWay STT Clientを使用した基本的なビデオ会議とリアルタイム文字起こしのチュートリアルアプリケーションです。Vanilla-JS（フレームワーク不使用）で実装されています。

## 機能

- 🎥 **ビデオ会議** - 複数参加者でのビデオ・音声通話
- 🗣️ **リアルタイム文字起こし** - 音声をリアルタイムでテキストに変換
- 🌐 **翻訳モード** - 選択した2言語間の自動翻訳サポート
- 📝 **文字起こし結果表示** - タイムスタンプと話者名付きの文字起こし結果

## 前提条件

- Node.js 22以上、npm、yarn、またはpnpm
- SkyWayアカウントとAPIクレデンシャル
- バックエンドサーバーの起動（ [examples/server](../server/) を参照）

## インストール

依存関係をインストール:

```bash
npm install
# または
yarn install
# または
pnpm install
```

## 使い方

### 1. バックエンドサーバーを起動

[examples/serverのREADME](../server/README.md)に従ってバックエンドサーバーをセットアップし、起動してください。

### 2. フロントエンドサーバーを起動

フロントエンドサーバーを起動します。

```bash
npm run dev
# または
yarn dev
# または
pnpm dev
```

### 3. アプリケーションにアクセス

ブラウザで <http://localhost:5173> を開きます。

### 3. ルームに参加

1. **Room Name**を入力（例: `my-room`）
2. **Member Name**を入力（例: `Taro`）
3. **Join**ボタンをクリック

### 4. 文字起こしを使用

1. **Mode**を選択:
   - `transcription`: 文字起こしのみ
   - `translation`: 翻訳付き文字起こし
2. `translation`を選択した場合は、**Locale 1**と**Locale 2**で翻訳する2つの言語を選択（異なる言語を選択してください）
3. **Start**ボタンをクリックして文字起こしを開始
4. 話すと右側のパネルに文字起こし結果が表示されます
5. **End**ボタンをクリックして文字起こしを終了

### 5. ルームを退出

**Leave**ボタンをクリックしてルームを退出します。

## アプリケーションの構造

```
tutorial/
├── src/
│   └── main.js          # メインアプリケーションロジック
├── index.html           # HTMLテンプレート
├── style.css            # スタイルシート
├── package.json         # 依存関係とスクリプト
└── vite.config.js       # Vite設定
```

## 主な実装内容

### ビデオ通話の実装

- `SkyWayContext`でSkyWayに接続
- `SkyWayRoom.Find`でルームを検索
- `room.join`でルームに参加
- `me.publish`でローカルメディアを配信
- `me.subscribe`でリモートメディアを受信

### STTの実装

```javascript
// STT Clientの初期化
const sttClient = new SkyWaySTTClient(context, me);

// 文字起こし結果の受信
sttClient.onSTTResultReceived.add(({ result }) => {
  console.log(result.text);
});
```

### 文字起こしセッションの制御

```javascript
// 開始
// translationモードの場合は翻訳する2つの言語をlocalesに指定する
// 例: body: JSON.stringify({ sttMode: "translation", locales: ["ja-JP", "en-US"] })
await fetch(`${SERVER_HOST}/rooms/${roomName}/start`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ sttMode: "transcription" }),
});

// 終了
await fetch(`${SERVER_HOST}/rooms/${roomName}/end`, {
  method: "DELETE",
  headers: { Authorization: `Bearer ${token}` },
});
```

## STTモード

- **transcription**: リアルタイム音声認識（文字起こし）
- **translation**: リアルタイム音声認識と翻訳（選択した2言語間で翻訳）

## 技術スタック

- Vanilla-JS（フレームワーク不使用）
- @skyway-sdk/room - WebRTC通信
- skyway-stt-client - 音声認識クライアント
- Vite - ビルドツール

## 学習リソース

このチュートリアルアプリは、SkyWay STT Clientの基本的な使い方を学ぶために設計されています。より高度な実装例については、[examples/advanced ディレクトリ](../advanced/) のReactアプリケーションを参照してください。
