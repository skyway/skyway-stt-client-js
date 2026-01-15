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
const channelApiUrl = "https://channel.skyway.ntt.com/v1/json-rpc";

// Channel API と STT API を操作するためのトークン
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

  // リクエストされたroomNameのRoom(Channel)を作成する
  const response = await fetch(channelApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${createSkyWayAdminAuthToken()}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: uuidV4(),
      method: "findOrCreateChannel",
      params: {
        name: roomName,
      },
    }),
  });
  const {
    result: {
      channel: { id: roomId },
    },
  } = await response.json();
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
  const { sttMode } = req.body;
  const response = await fetch(`${sttApiBaseUrl}/rooms/${roomId}/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${createSkyWayAdminAuthToken()}`,
    },
    body: JSON.stringify({
      mode: sttMode.toUpperCase(),
    }),
  });

  const json = await response.json();
  if (!response.ok) {
    console.error(json.error);
    res.status(500).send({ message: json.error.message });
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
    res.status(500).send({ message: "Failed to end transcription" });
    return;
  }

  delete roomNameRecordingMap[roomName];

  res.status(200).send({ message: "Transcription ended successfully" });
});

app.listen(9090);
console.log("Server is running on http://localhost:9090");
