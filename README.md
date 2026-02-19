# SkyWay STT Client JS

このリポジトリは、SkyWay の 文字起こし（Speech-to-Text）用の JavaScript ライブラリです。

# 本リポジトリの運用方針について

このリポジトリは公開用のミラーリポジトリであり、こちらで開発は行いません。

## Issue / Pull Request

受け付けておりません。

Enterprise プランをご契約のお客様はテクニカルサポートをご利用ください。
詳しくは [SkyWay サポート](https://support.skyway.ntt.com/hc/ja)をご確認ください。

# インストール方法

```sh
npm install skyway-stt-client
```

# 使い方

```javascript
import { SkyWaySTTClient } from 'skyway-stt-client';
import { SkyWayContext, SkyWayRoom } from '@skyway-sdk/room';

// SkyWay の初期化
const context = await SkyWayContext.Create(token);

// Room に参加
const room = await SkyWayRoom.Find(context, {
  name: 'my-room'
});
const member = await room.join();

// STT Client の初期化
const sttClient = new SkyWaySTTClient(context, member);

// 文字起こし結果を受信
sttClient.onSTTResultReceived.add(({ result }) => {
  const member = room.members.find((m) => m.id === result.memberId);
  console.log(`[${member?.name}]: ${result.text}`);
});
```

# ドキュメント


- [ユーザーガイド](https://skyway.ntt.com/ja/docs/user-guide/stt/overview/)
- [API リファレンス](https://skyway.ntt.com/ja/docs/api-reference/stt/)


# サンプルアプリ

- [tutorial](./examples/tutorial/README.md)
- [advanced](./examples/advanced/README.md)


# License

- [LICENSE](/LICENSE)
- [THIRD_PARTY_LICENSE](/THIRD_PARTY_LICENSE)
