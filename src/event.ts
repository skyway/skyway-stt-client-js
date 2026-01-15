import type { STTResult } from "./types";

/**
 * 文字起こし結果受信イベントの型定義
 *
 * STTサーバーから文字起こし結果を受信した際に発生します
 */
export type STTResultReceivedEvent = {
  /** 受信した文字起こし結果 */
  result: STTResult;
};
