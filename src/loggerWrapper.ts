import { type LogLevel, logLevelTypes } from "@skyway-sdk/common";
import type { Logger } from "./types";

/**
 * ログレベルに基づいてログ出力を制御するラッパー
 */
export class LoggerWrapper implements Logger {
  #logger: Logger;
  #logLevel: LogLevel;

  constructor(logger: Logger, logLevel: LogLevel) {
    this.#logger = logger;
    this.#logLevel = logLevel;
  }

  debug(...args: unknown[]): void {
    this.#log("debug", ...args);
  }

  warn(...args: unknown[]): void {
    this.#log("warn", ...args);
  }

  error(...args: unknown[]): void {
    this.#log("error", ...args);
  }

  #log(level: Exclude<LogLevel, "disable" | "info">, ...args: unknown[]): void {
    const logLevelIndex = logLevelTypes.indexOf(level);
    const thisLogLevelIndex = logLevelTypes.indexOf(this.#logLevel);

    if (logLevelIndex > thisLogLevelIndex) {
      return;
    }

    this.#logger[level](...args);
  }
}
