import { describe, expect, test } from "bun:test";

import { logPackageInitialized, resolveLogger } from "#zphq3sccnajd";

describe("@trebired/logger-adapter", () => {
  test("supports trebired-style level methods", () => {
    const rows: Array<{ group: string; level: string; message: string; metadata?: unknown }> = [];
    const logger = {
      info(group: string, message: string, metadata?: unknown) {
        rows.push({ group, level: "info", message, metadata });
      },
      warn(group: string, message: string, metadata?: unknown) {
        rows.push({ group, level: "warn", message, metadata });
      },
      error(group: string, message: string, metadata?: unknown) {
        rows.push({ group, level: "error", message, metadata });
      },
      fail(group: string, message: string, metadata?: unknown) {
        rows.push({ group, level: "fail", message, metadata });
      },
      flush() {},
    };

    const resolved = resolveLogger({
      logger,
      source: "@trebired/test",
    });

    resolved.info("bootstrap", "hello", { ok: true });
    expect(rows[0]).toEqual({
      group: "bootstrap",
      level: "info",
      message: "hello",
      metadata: { ok: true },
    });
  });

  test("supports event-sink logger callbacks with timestamps", () => {
    const rows: Array<Record<string, unknown>> = [];
    const resolved = resolveLogger({
      logger(event) {
        rows.push(event as Record<string, unknown>);
      },
      source: "@trebired/test",
    });

    resolved.warn("git-host", "denied", { status: 403 });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      group: "git-host",
      level: "warn",
      message: "denied",
      metadata: { status: 403 },
    });
    expect(typeof rows[0].timestamp).toBe("string");
  });

  test("supports sink objects", () => {
    const rows: Array<Record<string, unknown>> = [];
    const resolved = resolveLogger({
      logger: {
        write(event: unknown) {
          rows.push(event as Record<string, unknown>);
        },
      },
      source: "@trebired/test",
    });

    resolved.error("dev-mode", "failed");
    expect(rows[0]).toMatchObject({
      group: "dev-mode",
      level: "error",
      message: "failed",
    });
    expect(typeof rows[0].timestamp).toBe("string");
  });

  test("supports object-first logger styles", () => {
    const rows: Array<{ level: string; payload: Record<string, unknown>; message: string }> = [];
    const resolved = resolveLogger({
      logger: {
        child() {},
        info(payload: Record<string, unknown>, message: string) {
          rows.push({ level: "info", payload, message });
        },
      },
      source: "@trebired/test",
    });

    resolved.info("bootstrap", "scan started", { dir: "/tmp/demo" });
    expect(rows[0].level).toBe("info");
    expect(rows[0].message).toBe("scan started");
    expect(rows[0].payload.group).toBe("bootstrap");
    expect(rows[0].payload.dir).toBe("/tmp/demo");
    expect(typeof rows[0].payload.timestamp).toBe("string");
  });

  test("maps fail onto fatal when needed", () => {
    const rows: Array<{ message: string; metadata?: unknown }> = [];
    const resolved = resolveLogger({
      logger: {
        fatal(message: string, metadata?: unknown) {
          rows.push({ message, metadata });
        },
      },
      source: "@trebired/test",
    });

    resolved.fail("bootstrap", "missing-dir");
    expect(rows[0]).toEqual({
      message: "[bootstrap] missing-dir",
      metadata: undefined,
    });
  });

  test("supports explicit custom writers for exact output shape", () => {
    const rows: Array<{ level: string; line: string }> = [];
    const resolved = resolveLogger({
      adapter(logger, event) {
        (logger as Array<{ level: string; line: string }>).push({
          level: event.level,
          line: `${event.timestamp} ${event.group} ${event.message}`,
        });
      },
      logger: rows as any,
      source: "@trebired/test",
    });

    resolved.info("bootstrap", "custom");
    expect(rows).toHaveLength(1);
    expect(rows[0].level).toBe("info");
    expect(rows[0].line).toContain("bootstrap custom");
  });

  test("falls back to console output when no logger is available", () => {
    const infoRows: unknown[][] = [];
    const originalInfo = console.info;

    try {
      console.info = (...args: unknown[]) => {
        infoRows.push(args);
      };

      const resolved = resolveLogger({
        fallback: "console",
        source: "@trebired/test",
      });

      resolved.info("bootstrap", "console fallback");
    } finally {
      console.info = originalInfo;
    }

    expect(infoRows).toHaveLength(1);
    expect(infoRows[0][0]).toBe("[bootstrap] console fallback");
  });

  test("supports noop fallback", () => {
    const infoRows: unknown[][] = [];
    const originalInfo = console.info;

    try {
      console.info = (...args: unknown[]) => {
        infoRows.push(args);
      };

      const resolved = resolveLogger({
        fallback: "noop",
        source: "@trebired/test",
      });

      resolved.info("bootstrap", "quiet");
    } finally {
      console.info = originalInfo;
    }

    expect(infoRows).toEqual([]);
  });

  test("emits package initialization notices through success-compatible loggers", () => {
    const rows: Array<{ group: string; level: string; message: string; metadata?: unknown }> = [];
    logPackageInitialized({
      logger: {
        fail() {},
        flush() {},
        info() {},
        warn() {},
        success(group: string, message: string, metadata?: unknown) {
          rows.push({ group, level: "success", message, metadata });
        },
      },
      source: "@trebired/test",
    });

    expect(rows).toEqual([{
      group: "test.initialize",
      level: "success",
      message: "@trebired/test initialized",
      metadata: undefined,
    }]);
  });
});
