/**
 * SkyWay STT (Speech-to-Text) SDK for JavaScript
 *
 * このSDKは、SkyWayの文字起こしサービスにWebSocketで接続し、
 * リアルタイムで文字起こし結果を受信するためのクライアントライブラリです。
 *
 * @example
 * ```typescript
 * import { SkyWaySTTClient } from 'skyway-stt-client';
 *
 * const client = new SkyWaySTTClient(context, member);
 * client.onSTTResultReceived.add((event) => {
 *   console.log('文字起こし結果:', event.result.text);
 * });
 * ```
 */

export type { LogLevel } from "@skyway-sdk/common";
export type { STTResultReceivedEvent } from "./event";
export {
  SkyWaySTTClient,
  type SkyWaySTTClientOptions,
} from "./skywaySTTClient";
export type {
  Logger,
  STTResult,
  STTResultMessage,
  TranscriptionSTTResult,
  TranslationSTTResult,
} from "./types";
