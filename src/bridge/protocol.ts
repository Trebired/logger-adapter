import { cleanString } from "#aus7fuq3sblr";

type LoggerBridgeLevel = "error" | "fail" | "info" | "success" | "warn" | string;

type LoggerBridgeLoggerConfig = {
  console?: boolean | Record<string, unknown>;
  dir?: string;
  quiet?: boolean;
  save?: boolean;
  source?: string;
  [key: string]: unknown;
};

type LoggerBridgeConfigureCommand = {
  id?: string;
  logger: LoggerBridgeLoggerConfig;
  type: "configure";
};

type LoggerBridgeLogCommand = {
  group: string;
  id?: string;
  level: LoggerBridgeLevel;
  message: string;
  metadata?: unknown;
  timestamp?: string;
  type: "log";
};

type LoggerBridgeFlushCommand = {
  id?: string;
  type: "flush";
};

type LoggerBridgeCloseCommand = {
  id?: string;
  type: "close";
};

type LoggerBridgeCommand =
|LoggerBridgeCloseCommand
|LoggerBridgeConfigureCommand
|LoggerBridgeFlushCommand
|LoggerBridgeLogCommand;

type LoggerBridgeAck = {
  command: LoggerBridgeCommand["type"];
  id?: string;
  ok: true;
  type: "ack";
};

type LoggerBridgeError = {
  command?: string;
  error: {
    code: string;
    message: string;
  };
  id?: string;
  ok: false;
  type: "error";
};

type LoggerBridgeResponse = LoggerBridgeAck | LoggerBridgeError;

function isBridgeRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function bridgeId(value: unknown): string | undefined {
  const id = cleanString(value);
  return id || undefined;
}

function parseLoggerBridgeCommand(value: unknown): LoggerBridgeCommand {
  if (!isBridgeRecord(value)) throw new Error("command must be an object");
  const type = cleanString(value.type);
  const id = bridgeId(value.id);

  if (type === "configure") {
    if (!isBridgeRecord(value.logger)) throw new Error("configure.logger must be an object");
    return {
      id,
      logger: value.logger as LoggerBridgeLoggerConfig,
      type,
    };
  }

  if (type === "log") {
    const level = cleanString(value.level);
    const group = cleanString(value.group);
    const message = cleanString(value.message);
    if (!level) throw new Error("log.level must be a non-empty string");
    if (!group) throw new Error("log.group must be a non-empty string");
    if (!message) throw new Error("log.message must be a non-empty string");
    const timestamp = cleanString(value.timestamp);
    return {
      group,
      id,
      level,
      message,
      ...(Object.prototype.hasOwnProperty.call(value, "metadata") ? { metadata: value.metadata } : {}),
      ...(timestamp ? { timestamp } : {}),
      type,
    };
  }

  if (type === "flush" || type === "close") {
    return { id, type };
  }

  throw new Error(`unsupported command type ${type || "(missing)"}`);
}

function createLoggerBridgeAck(command: LoggerBridgeCommand["type"], id?: string): LoggerBridgeAck {
  return {
    command,
    ...(id ? { id } : {}),
    ok: true,
    type: "ack",
  };
}

function createLoggerBridgeError(args: {
    code: string;
    command?: string;
    id?: string;
    message: string;
}): LoggerBridgeError {
  return {
    ...(args.command ? { command: args.command } : {}),
    error: {
      code: args.code,
      message: args.message,
    },
    ...(args.id ? { id: args.id } : {}),
    ok: false,
    type: "error",
  };
}

export {
  createLoggerBridgeAck,
  createLoggerBridgeError,
  parseLoggerBridgeCommand,
};
export type {
  LoggerBridgeAck,
  LoggerBridgeCloseCommand,
  LoggerBridgeCommand,
  LoggerBridgeConfigureCommand,
  LoggerBridgeError,
  LoggerBridgeFlushCommand,
  LoggerBridgeLevel,
  LoggerBridgeLogCommand,
  LoggerBridgeLoggerConfig,
  LoggerBridgeResponse,
};
