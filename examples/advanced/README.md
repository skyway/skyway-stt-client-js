# SkyWay STT ビデオ会議アプリ

React、TypeScript、SkyWay Room SDKを使用して構築されたビデオ会議アプリケーションです。

## 機能

- 📹 **HDビデオ会議** - アダプティブグリッドレイアウトによる複数参加者のビデオ通話
- 🎤 **音声制御** - マイクのミュート/ミュート解除
- 📷 **ビデオ制御** - カメラのオン/オフ
- 🗣️ **ライブ文字起こし** - リアルタイム音声認識
- 🌐 **ライブ翻訳** - 多言語翻訳サポート（日本語 ↔️ 英語）

## 前提条件

- Node.js 22以上、npm、yarn、またはpnpm
- SkyWayアカウントとAPIクレデンシャル
- バックエンドサーバーの起動（[examples/server](../server/) を参照）

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

[examples/serverのREADME](../server/README.md) に従ってバックエンドサーバーをセットアップし、起動してください。

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

ブラウザで http://localhost:5173 を開きます。

### 4. ミーティングに参加

- ルーム名を入力
- 名前を入力
- 「Join Meeting」をクリック

### 5. ミーティング中

- コントロールバーを使用して音声/ビデオを切り替え
- ライブ文字起こしの開始/停止
- 文字起こしモードと翻訳モードの切り替え
- サイドパネルで文字起こしを表示
- 退出ボタンをクリックして退出

## アーキテクチャ

### コンポーネント

- **JoinScreen** - ルームとユーザー情報を入力する初期画面
- **VideoGrid** - 参加者のビデオ用レスポンシブグリッドレイアウト
- **VideoTile** - ステータスインジケーター付きの個別参加者ビデオタイル
- **ControlBar** - ミーティングコントロール付き下部コントロールバー
- **TranscriptionPanel** - ライブ文字起こし/翻訳用サイドパネル

### Hooks

- **useMediaDevices** - ローカル音声/ビデオストリームを管理
- **useConference** - ルーム接続、参加者、STTを処理

### 主要技術

- React 19とTypeScript
- @skyway-sdk/room - WebRTC通信
- skyway-stt-client - 音声認識統合
- Vite - ビルドツール

