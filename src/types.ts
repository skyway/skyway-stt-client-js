import type { Event } from "@skyway-sdk/common";
import type { ContextConfig } from "@skyway-sdk/room";

/**
 * STTサーバーから受信するメッセージの型定義
 */
export type STTResultMessage = {
  /** メッセージタイプ（現在は"TEXT"のみサポート） */
  type: "TEXT";
  /** STT結果データ */
  data: STTResult;
};

/**
 * 文字起こし結果の型定義
 *
 * 音声をテキストに変換した結果を表します
 */
export type TranscriptionSTTResult = {
  /** 動作モード（文字起こし） */
  mode: "transcription";
  /** 認識されたテキスト */
  text: string;
  /** 結果の一意識別子 */
  id: string;
  /** 音声が送信された日時 */
  timestamp: Date;
  /** ルームID */
  roomId: string;
  /** メンバーID */
  memberId: string;
  /** ルーム名 */
  roomName?: string;
  /** メンバー名 */
  memberName?: string;
};

/**
 * 音声翻訳結果の型定義
 *
 * 音声を複数の言語に翻訳した結果を表します
 */
export type TranslationSTTResult = {
  /** 動作モード（翻訳） */
  mode: "translation";
  /** 各言語での翻訳結果の配列 */
  texts: { language: string; text: string }[];
  /** 結果の一意識別子 */
  id: string;
  /** 音声が送信された日時 */
  timestamp: Date;
  /** ルームID */
  roomId: string;
  /** メンバーID */
  memberId: string;
  /** ルーム名 */
  roomName?: string;
  /** メンバー名 */
  memberName?: string;
};

/**
 * STT結果の統合型
 *
 * 文字起こし結果または翻訳結果のいずれかを表します
 */
export type STTResult = TranscriptionSTTResult | TranslationSTTResult;

/**
 * ログ出力用のインターフェース
 *
 * カスタムログ出力を実装する場合に使用します
 */
export type Logger = {
  /** デバッグ情報をログ出力 */
  debug(...args: unknown[]): void;
  /** 警告メッセージをログ出力 */
  warn(...args: unknown[]): void;
  /** エラーメッセージをログ出力 */
  error(...args: unknown[]): void;
};

// temporarily defined in this lib for backward compatibility, will be removed in future versions.
export interface SkyWayContextInterface {
  authTokenString: string;
  config: ContextConfig;
  readonly _onTokenUpdated: Event<string>;
}
