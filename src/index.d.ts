import * as Debug from "debug";

declare var createLogger: debugLevels.createLogger;

export = createLogger;
export as namespace debugLevels;

declare namespace debugLevels {
  interface createLogger {
    (namespace: string): Logger;

    debug: Debug.Debug;

    level: string;
    getLevel(): string;
    setLevel(level: string): void;
    levelEnabled(level: number | string): boolean;

    enable(namespace: string): void;
    disable(namespace: string): string;
    enabled(namespace: string): boolean;
  }

  interface Logger {
    namespace: string;
    level: string;

    getLevel(): string;
    setLevel(level: string): void;

    logger: this;

    trace(...msgs: any[]): void;
    debug(...msgs: any[]): void;
    info(...msgs: any[]): void;
    warn(...msgs: any[]): void;
    error(...msgs: any[]): void;
    fatal(...msgs: any[]): void;

    createLogger(namespace: string): Logger;
  }
}
