import {
  Event,
  type LogLevel,
  Logger as SkyWayLogger,
} from "@skyway-sdk/common";
import WebSocket from "isomorphic-ws";
import type { STTResultReceivedEvent } from "./event";
import { LoggerWrapper } from "./loggerWrapper";
import type { Logger, SkyWayContextInterface, STTResult } from "./types";
import { PACKAGE_VERSION } from "./version";

const API_DOMAIN = "stt-dispatcher.skyway.ntt.com";
const API_VERSION = "v1";

type CloseEventCode = {
  code: number;
  shouldReconnect: boolean;
  closeCase: "normal" | "non-normal" | "unexpected";
};

const CloseEventCode = {
  from: (code: CloseEvent["code"]): CloseEventCode => {
    // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code
    // 1000, 4000~4099             : normal case     (should not reconnect)
    // 1006(server timeout), 1012  : normal case     (should reconnect)
    // 1009, 4100~4199             : non-normal case (should not reconnect)
    // 4200~4299                   : non-normal case (should reconnect)
    // others                      : unexpected case (should reconnect)
    if (code === 1000 || (4000 <= code && code <= 4099)) {
      return {
        code,
        shouldReconnect: false,
        closeCase: "normal",
      };
    } else if (code === 1009 || (4100 <= code && code <= 4199)) {
      return {
        code,
        shouldReconnect: false,
        closeCase: "non-normal",
      };
    } else if (4200 <= code && code <= 4299) {
      return {
        code,
        shouldReconnect: true,
        closeCase: "non-normal",
      };
    } else if (code === 1006 || code === 1012) {
      return {
        code,
        shouldReconnect: true,
        closeCase: "normal",
      };
    } else {
      return {
        code,
        shouldReconnect: true,
        closeCase: "unexpected",
      };
    }
  },
};

/**
 * STTクライアントのオプション設定
 */
export type STTClientOptions = {
  /** ルームID */
  roomId: string;
  /** ルーム名（オプション） */
  roomName?: string;
  /** メンバーID */
  memberId: string;
  /** メンバー名（オプション） */
  memberName?: string;
  /** APIドメイン（デフォルト: stt-dispatcher.skyway.ntt.com） */
  domain?: string;
  /** WSSを使用するか（デフォルト: true） */
  secure?: boolean;
  /** カスタムロガー（オプション） */
  logger?: Logger;
  /** ログレベル（オプション） */
  logLevel?: LogLevel;
  /** 最大再試行回数（デフォルト: 3） */
  maxRetryAttempts?: number;
  /** 再試行間隔を算出する関数（デフォルト: 指数バックオフ） */
  getRetryIntervalMs?: (retryCount: number) => number;
};

/**
 * STT (Speech-to-Text) クライアント
 *
 * WebSocketを使用してSTT APIサーバーに接続し、
 * 文字起こし結果をリアルタイムで受信します。
 * 自動再接続機能やエラーハンドリングを含みます。
 *
 * @internal このクラスは内部用です。直接使用せず、SkyWaySTTClientを使用してください。
 */
export class STTClient {
  #options: Required<Omit<STTClientOptions, "roomName" | "memberName">> &
    Pick<STTClientOptions, "roomName" | "memberName">;
  #token: string;
  #ws: WebSocket | undefined = undefined;
  #retryAttempts = 0;
  #removeTokenUpdatedListener: () => void;

  /** STT結果受信時に発生するイベント */
  readonly onSTTResultReceived = new Event<STTResultReceivedEvent>();
  /** エラー発生時に発生するイベント */
  readonly onError = new Event<Error>();
  /** WebSocket接続成功時に発生するイベント */
  readonly onOpen = new Event<void>();
  /** WebSocket接続終了時に発生するイベント */
  readonly onClose = new Event<CloseEventCode>();

  /**
   * STTクライアントを初期化します
   *
   * @param context - SkyWayコンテキスト
   * @param options - クライアントオプション
   */
  constructor(context: SkyWayContextInterface, options: STTClientOptions) {
    const baseLogger = options.logger ?? new SkyWayLogger("skyway-stt-client");
    const logLevel = options.logLevel ?? context.config.log.level;
    const logger = new LoggerWrapper(baseLogger, logLevel);

    this.#options = {
      roomId: options.roomId,
      roomName: options.roomName,
      memberId: options.memberId,
      memberName: options.memberName,
      domain: options.domain ?? API_DOMAIN,
      secure: options.secure ?? true,
      logger,
      logLevel,
      maxRetryAttempts: options.maxRetryAttempts ?? 3,
      getRetryIntervalMs:
        options.getRetryIntervalMs ??
        ((retryCount) => {
          return (2 ** retryCount + Math.random()) * 1000;
        }),
    };
    this.#token = context.authTokenString;
    const { removeListener } = context._onTokenUpdated.add(() => {
      this.#token = context.authTokenString;
      if (this.#ws) {
        this.#ws.close(4200);
      } else {
        this.#connect();
      }
    });
    this.#removeTokenUpdatedListener = removeListener;

    this.onOpen.add(() => {
      this.#retryAttempts = 0;
    });
    this.onClose.add((closeEventCode) => {
      if (closeEventCode.closeCase === "unexpected") {
        this.#options.logger.warn(
          `Failed to connect to server. WebSocket closed with unexpected code ${closeEventCode.code}.`,
        );
      }
      if (closeEventCode.shouldReconnect) {
        if (this.#retryAttempts < this.#options.maxRetryAttempts) {
          this.#retryAttempts++;
          const interval = this.#options.getRetryIntervalMs(
            this.#retryAttempts,
          );
          this.#options.logger.debug(
            `Retrying connection in ${interval}ms... (attempts=${
              this.#retryAttempts
            })`,
          );
          setTimeout(this.#connect, interval);
          return;
        }

        this.#options.logger.error(
          `Failed to connect to server. All retry attempts failed (attempts=${
            this.#options.maxRetryAttempts
          })`,
        );
        this.onError.emit(
          new Error(
            `Failed to connect to server. All retry attempts failed (attempts=${
              this.#options.maxRetryAttempts
            })`,
          ),
        );
        return;
      }
      if (closeEventCode.closeCase === "non-normal") {
        this.#options.logger.error(
          `Failed to connect to server. WebSocket closed with non-normal code ${closeEventCode.code}.`,
          new Error(
            `Failed to connect to server. WebSocket closed with non-normal code ${closeEventCode.code}.`,
          ),
        );
        this.onError.emit(new Error(`Failed to connect server.`));
        return;
      }
    });

    this.#connect();
  }

  #connect = () => {
    const wsProtocol = this.#options.secure ? "wss" : "ws";
    const queryParams = new URLSearchParams({
      roomId: this.#options.roomId,
      ...(this.#options.roomName && { roomName: this.#options.roomName }),
      memberId: this.#options.memberId,
      ...(this.#options.memberName && { memberName: this.#options.memberName }),
      sdkPlatform: "js",
      sdkVersion: PACKAGE_VERSION,
    });
    const wsUrl = `${wsProtocol}://${
      this.#options.domain
    }/${API_VERSION}/ws?${queryParams.toString()}`;

    this.#ws = new WebSocket(wsUrl, `SkyWayAuthToken!${this.#token}`);
    this.#ws.onopen = () => {
      this.#options.logger.debug("WebSocket connected to server.");
      this.onOpen.emit();
    };
    this.#ws.onmessage = ({ data }) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "TEXT" && msg.data) {
          // Convert timestamp from number to Date if needed
          const resultData = { ...msg.data };
          if (typeof resultData.timestamp === "string") {
            resultData.timestamp = new Date(resultData.timestamp);
          }

          resultData.mode = resultData.mode.toLowerCase();

          this.onSTTResultReceived.emit({
            result: resultData as STTResult,
          });
        }
      } catch (error) {
        this.#options.logger.error(
          "Failed to parse message from server.",
          error,
        );
      }
    };

    this.#ws.onclose = (event) => {
      this.#options.logger.debug(
        `WebSocket closed: ${JSON.stringify({
          code: event.code,
          reason: event.reason,
          type: event.type,
        })}`,
      );

      const closeEventCode = CloseEventCode.from(event.code);
      this.onClose.emit(closeEventCode);
    };

    this.#ws.onerror = (event) => {
      this.#options.logger.error("WebSocket error event:", event);
    };
  };

  /**
   * クライアントを破棄し、リソースをクリーンアップします
   * WebSocket接続を閉じ、イベントリスナーを削除します。
   */
  dispose() {
    this.#removeTokenUpdatedListener();
    this.onSTTResultReceived.removeAllListeners();
    this.onError.removeAllListeners();
    this.#ws?.close(1000);
    this.#ws = undefined;
    this.#retryAttempts = 0;
  }

  /**
   * WebSocketの現在の接続状態を返します
   * @returns WebSocketの状態（CONNECTING, OPEN, CLOSING, CLOSED）
   */
  get readyState() {
    return this.#ws?.readyState ?? WebSocket.CLOSED;
  }
}
