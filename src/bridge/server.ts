#!/usr/bin/env bun
import { createInterface } from "node:readline";
import { inspect } from "node:util";

import { defaultLoggerPackageCandidates } from "#baraacncu5kl";
import {
  createLoggerBridgeAck,
  createLoggerBridgeError,
  parseLoggerBridgeCommand,
  type LoggerBridgeCommand,
  type LoggerBridgeLoggerConfig,
  type LoggerBridgeLogCommand,
  type LoggerBridgeResponse,
} from "./protocol.js";

type BridgeLogInstance = Record<string, unknown> & {
  close?: () => Promise<void> | void;
  flush?: () => Promise<void> | void;
};

type BridgeLoggerModule = {
  createLog?: (options?: LoggerBridgeLoggerConfig) => BridgeLogInstance;
};

type BridgeState = {
  logger: BridgeLogInstance | null;
};

function redirectConsoleToStderr(): void {
  const write = (level: string, values: unknown[]) => {
    const line = values.map((value) => typeof value === "string" ? value : inspect(value, { colors: false, depth: 6 })).join(" ");
    process.stderr.write(`${level}: ${line}\n`);
  };

  for (const level of ["debug", "error", "info", "log", "warn"] as const) {
    console[level] = (...values: unknown[]) => write(level, values);
  }
}

function writeResponse(response: LoggerBridgeResponse): void {
  process.stdout.write(`${JSON.stringify(response)}\n`);
}

async function resolveLoggerModule(): Promise<BridgeLoggerModule> {
  for (const packageName of defaultLoggerPackageCandidates()) {
    try {
      const mod = await import(packageName) as BridgeLoggerModule;
      if (typeof mod.createLog === "function") return mod;
    } catch {}
  }
  throw new Error("logger package could not be resolved");
}

async function closeLogger(logger: BridgeLogInstance | null): Promise<void> {
  if (typeof logger?.close === "function") {
    await logger.close();
    return;
  }
  if (typeof logger?.flush === "function") await logger.flush();
}

async function configureLogger(state: BridgeState, command: Extract<LoggerBridgeCommand, { type: "configure" }>): Promise<void> {
  await closeLogger(state.logger);
  const mod = await resolveLoggerModule();
  state.logger = mod.createLog?.(command.logger) ?? null;
  if (!state.logger) throw new Error("logger package did not create a logger");
}

function metadataWithTimestamp(command: LoggerBridgeLogCommand): unknown {
  if (!command.timestamp) return command.metadata;
  if (command.metadata && typeof command.metadata === "object" && !Array.isArray(command.metadata)) {
    const metadata = command.metadata as Record<string, unknown>;
    return {
      ...metadata,
      timestamp: metadata.timestamp ?? command.timestamp,
    };
  }
  if (command.metadata === undefined) return { timestamp: command.timestamp };
  return {
    metadata: command.metadata,
    timestamp: command.timestamp,
  };
}

function emitLog(state: BridgeState, command: LoggerBridgeLogCommand): void {
  if (!state.logger) throw new Error("logger is not configured");
  const method = state.logger[command.level];
  if (typeof method !== "function") throw new Error(`logger does not support level ${command.level}`);
  method.call(state.logger, command.group, command.message, metadataWithTimestamp(command));
}

async function flushLogger(state: BridgeState): Promise<void> {
  if (!state.logger) throw new Error("logger is not configured");
  if (typeof state.logger.flush === "function") await state.logger.flush();
}

async function handleCommand(state: BridgeState, command: LoggerBridgeCommand): Promise<boolean> {
  if (command.type === "configure") {
    await configureLogger(state, command);
    writeResponse(createLoggerBridgeAck(command.type, command.id));
    return true;
  }

  if (command.type === "log") {
    emitLog(state, command);
    if (command.id) writeResponse(createLoggerBridgeAck(command.type, command.id));
    return true;
  }

  if (command.type === "flush") {
    await flushLogger(state);
    writeResponse(createLoggerBridgeAck(command.type, command.id));
    return true;
  }

  await closeLogger(state.logger);
  state.logger = null;
  writeResponse(createLoggerBridgeAck(command.type, command.id));
  return false;
}

async function handleLine(state: BridgeState, line: string): Promise<boolean> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch (error) {
    writeResponse(createLoggerBridgeError({
      code: "invalid-json",
      message: error instanceof Error ? error.message : String(error),
    }));
    return true;
  }

  let command: LoggerBridgeCommand;
  try {
    command = parseLoggerBridgeCommand(parsed);
  } catch (error) {
    writeResponse(createLoggerBridgeError({
      code: "invalid-command",
      message: error instanceof Error ? error.message : String(error),
    }));
    return true;
  }

  try {
    return await handleCommand(state, command);
  } catch (error) {
    writeResponse(createLoggerBridgeError({
      code: command.type === "log" && !state.logger ? "logger-not-configured" : "command-failed",
      command: command.type,
      id: command.id,
      message: error instanceof Error ? error.message : String(error),
    }));
    return true;
  }
}

async function runLoggerBridge(): Promise<void> {
  redirectConsoleToStderr();
  const state: BridgeState = { logger: null };
  const input = createInterface({
    crlfDelay: Infinity,
    input: process.stdin,
  });

  for await (const rawLine of input) {
    const line = String(rawLine || "").trim();
    if (!line) continue;
    const keepRunning = await handleLine(state, line);
    if (!keepRunning) {
      input.close();
      break;
    }
  }

  await closeLogger(state.logger);
}

if (import.meta.main) {
  await runLoggerBridge();
}

export { runLoggerBridge };
