import { formatLogMessage } from "./event.js";
import type {
  LoggerAdapterFallback,
  LoggerAdapterLogMethod,
} from "./types.js";

function fallbackLogger(mode: LoggerAdapterFallback, level: "error" | "info" | "warn"): LoggerAdapterLogMethod {
  if (mode === "noop") return () => undefined;

  return (group: string, message: string, metadata?: unknown) => {
    const prefix = formatLogMessage(group, message);
    if (metadata !== undefined) console[level](prefix, metadata);
    else console[level](prefix);
  };
}

export { fallbackLogger };
