import crypto from "node:crypto";
import { nowInSec, SkyWayAuthToken, uuidV4 } from "@skyway-sdk/token";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import jsrsasign from "jsrsasign";

// 環境変数を読み込み
dotenv.config();

const appId = process.env.APP_ID;
const secret = process.env.SECRET;

const sttApiBaseUrl = "https://speech-to-text.skyway.ntt.com/v1";
const roomApiUrl = "https://room.skyway.ntt.com/v1/json-rpc";

// 任意: アーカイブ機能を利用する場合のストレージ設定

const gcsConfig = {
  service: "GOOGLE_CLOUD_STORAGE",
  credential: JSON.stringify({
    // サービスアカウントの鍵のJSONファイルの内容をコピーペーストする
    type: "",
    project_id: "",
    private_key_id: "",
    private_key: "",
    client_email: "",
    client_id: "",
    auth_uri: "",
    token_uri: "",
    auth_provider_x509_cert_url: "",
    client_x509_cert_url: "",
  }),
  bucket: "",
};

const s3Config = {
  service: "AMAZON_S3",
  bucket: "",
  accessKeyId: "",
  secretAccessKey: "",
  region: "",
};

const wasabiConfig = {
  service: "WASABI",
  bucket: "",
  accessKeyId: "",
  secretAccessKey: "",
  endpoint: "",
};

// Room API と STT API を操作するためのトークン
const createSkyWayAdminAuthToken = () => {
  const token = jsrsasign.KJUR.jws.JWS.sign(
    "HS256",
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
    JSON.stringify({
      exp: nowInSec() + 60,
      iat: nowInSec(),
      jti: uuidV4(),
      appId,
    }),
    secret,
  );
  return token;
};

// クライアント用のトークン
const createSkywayAuthToken = (roomId) => {
  const token = new SkyWayAuthToken({
    jti: uuidV4(),
    iat: nowInSec(),
    exp: nowInSec() + 60 * 60 * 24,
    version: 3,
    scope: {
      appId,
      rooms: [
        {
          id: roomId,
          methods: ["create", "close", "updateMetadata"],
          member: {
            id: "*",
            // subscribeを許可する
            methods: ["publish", "subscribe", "updateMetadata"],
          },
          // sttをenabledまたは省略（デフォルトでenabled）する
          stt: {
            enabled: true,
          },
          // sfuをenabledまたは省略（デフォルトでenabled）する
          sfu: {
            enabled: true,
          },
        },
      ],
    },
  }).encode(secret);
  return token;
};

const app = express();
app.use(cors());
app.use(express.json());

const tokenHashRoomIdMap = {};
const roomNameIdMap = {};
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

app.post("/rooms/:roomName/create", async (req, res) => {
  const { roomName } = req.params;

  console.log("create", { roomName });

  // リクエストされたroomNameのRoomを作成する
  const response = await fetch(roomApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${createSkyWayAdminAuthToken()}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: uuidV4(),
      method: "findOrCreateRoom",
      params: {
        name: roomName,
      },
    }),
  });

  const json = await response.json();
  if (!response.ok) {
    console.error(json);
    res.status(500).send({ message: "Failed to create room" });
    return;
  }
  const roomId = json.result.room.id;
  roomNameIdMap[roomName] = roomId;

  // 入室できるroomIdを制限したトークンを作成する
  const token = createSkywayAuthToken(roomId);
  // 今後の文字起こしの開始、終了操作を認証するためにtokenとroomIdの紐付けを行う
  tokenHashRoomIdMap[sha256(token)] = roomId;

  res.send({ token });
});

const roomNameRecordingMap = {};

app.post("/rooms/:roomName/start", async (req, res) => {
  const { roomName } = req.params;
  const { authorization } = req.headers;
  const roomId = roomNameIdMap[roomName];

  console.log("start", { roomName, roomId, body: req.body });

  if (roomNameRecordingMap[roomName]) {
    res.status(200).send({ message: "STT already started" });
    return;
  }

  // roomIdとtokenの紐付けを確認する
  const tokenStr = (authorization ?? "").replace(/^Bearer\s*/, "");
  if (roomId !== tokenHashRoomIdMap[sha256(tokenStr)]) {
    res.status(403).send({ message: "Forbidden" });
    return;
  }
  // 文字起こしを開始する
  const { sttMode, locales } = req.body;
  const response = await fetch(`${sttApiBaseUrl}/rooms/${roomId}/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${createSkyWayAdminAuthToken()}`,
    },
    body: JSON.stringify({
      mode: sttMode.toUpperCase(),
      // TRANSLATION の場合は異なる2つの言語の指定が必須
      // TRANSCRIPTION の場合は省略可能（省略時は言語を自動判定して文字起こしを行う）
      // 指定可能な言語については https://skyway.ntt.com/ja/docs/user-guide/stt/support-languages を参照してください
      locales,
      // 文字起こし結果のアーカイブ機能を利用する場合は archive にストレージ設定を指定する
      // Amazon S3 を使う場合は s3Config
      // Wasabi を使う場合は wasabiConfig
      // archive: { storageConfig: gcsConfig },
    }),
  });

  const json = await response.json();
  if (!response.ok) {
    console.error(json);
    res.status(500).send({ message: "Failed to start transcription" });
    return;
  }
  roomNameRecordingMap[roomName] = json.id;

  res.status(200).send({ id: json.id });
});

app.delete("/rooms/:roomName/end", async (req, res) => {
  const { roomName } = req.params;
  const { authorization } = req.headers;
  const roomId = roomNameIdMap[roomName];
  const sessionId = roomNameRecordingMap[roomName];

  console.log("end", { roomName, roomId, sessionId });

  // roomIdとtokenの紐付けを確認する
  const tokenStr = (authorization ?? "").replace(/^Bearer\s*/, "");
  if (roomId !== tokenHashRoomIdMap[sha256(tokenStr)]) {
    res.status(403).send({ message: "Forbidden" });
    return;
  }

  // 文字起こしを終了する
  const response = await fetch(
    `${sttApiBaseUrl}/rooms/${roomId}/sessions/${sessionId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${createSkyWayAdminAuthToken()}`,
      },
    },
  );

  if (!response.ok) {
    const json = await response.json();
    console.error(json);
    res.status(500).send({ message: "Failed to end transcription" });
    return;
  }

  delete roomNameRecordingMap[roomName];

  res.status(200).send({ message: "Transcription ended successfully" });
});

app.listen(9090);
console.log("Server is running on http://localhost:9090");
