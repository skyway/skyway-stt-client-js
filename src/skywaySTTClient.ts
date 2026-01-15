import type { LogLevel } from "@skyway-sdk/common";
import { Event } from "@skyway-sdk/common";
import type { LocalRoomMember } from "@skyway-sdk/room";
import type { STTResultReceivedEvent } from "./event";
import { STTClient } from "./sttClient";
import type { Logger, SkyWayContextInterface } from "./types";

/**
 * SkyWay STTクライアントのオプション設定
 */
export type SkyWaySTTClientOptions = {
  /** STT APIのドメイン（オプション） */
  domain?: string;
  /** WSSを使用するか（デフォルト: true） */
  secure?: boolean;
  /** カスタムロガー（オプション） */
  logger?: Logger;
  /** ログレベル（オプション、デフォルト: contextのlog level） */
  logLevel?: LogLevel;
};

/**
 * SkyWay STT (Speech-to-Text) クライアント
 *
 * SkyWayのSTTサーバーに接続し、リアルタイムで文字起こし結果を受信します。
 * SkyWayContextとメンバー情報を使用して初期化します。
 */
export class SkyWaySTTClient {
  #sttClient: STTClient;
  #disposed: boolean = false;

  /** 文字起こし結果受信時に発生するイベント */
  readonly onSTTResultReceived = new Event<STTResultReceivedEvent>();
  /** エラー発生時に発生するイベント */
  readonly onError = new Event<Error>();

  /**
   * SkyWay STTクライアントを初期化します
   *
   * @param context - SkyWayContextインスタンス
   * @param member - LocalRoomMemberインスタンス
   * @param options - クライアントオプション
   */
  constructor(
    context: SkyWayContextInterface,
    member: LocalRoomMember,
    options?: SkyWaySTTClientOptions,
  ) {
    this.#sttClient = new STTClient(context, {
      ...options,
      memberId: member.id,
      memberName: member.name,
      roomId: member.roomId,
      roomName: member.roomName,
    });
    this.#sttClient.onSTTResultReceived.add((event) => {
      this.onSTTResultReceived.emit(event);
    });
    this.#sttClient.onError.add((error) => {
      this.onError.emit(error);
    });
  }

  /**
   * クライアントを破棄し、リソースをクリーンアップします
   *
   * WebSocket接続を閉じ、イベントリスナーを削除します。
   */
  dispose() {
    this.#disposed = true;
    this.onSTTResultReceived.removeAllListeners();
    this.onError.removeAllListeners();
    this.#sttClient.dispose();
  }

  /**
   * クライアントが破棄されているかどうかを返します
   * @returns 破棄されている場合はtrue
   */
  get disposed(): boolean {
    return this.#disposed;
  }
}
