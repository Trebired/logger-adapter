import type {
  LoggerAdapterLevel,
  LoggerAdapterResolvedEvent,
} from "./types.js";
import { isPlainObject } from "./values.js";

function buildLogEvent(level: LoggerAdapterLevel, group: string, message: string, metadata?: unknown): LoggerAdapterResolvedEvent {
  return metadata === undefined
    ? {
        group,
        level,
        message,
        timestamp: new Date().toISOString(),
      }
    : {
        group,
        level,
        message,
        metadata,
        timestamp: new Date().toISOString(),
      };
}

function formatLogMessage(group: string, message: string): string {
  return `[${group}] ${message}`;
}

function buildStructuredPayload(event: LoggerAdapterResolvedEvent): Record<string, unknown> {
  if (isPlainObject(event.metadata)) {
    return {
      group: event.group,
      timestamp: event.timestamp,
      ...event.metadata,
    };
  }

  return event.metadata === undefined
    ? {
        group: event.group,
        timestamp: event.timestamp,
      }
    : {
        group: event.group,
        metadata: event.metadata,
        timestamp: event.timestamp,
      };
}

export { buildLogEvent, buildStructuredPayload, formatLogMessage };
