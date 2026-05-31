# @trebired/logger-adapter

Logger adapter for `@trebired/logger`-compatible calls.

This package is for cases where you want to write logs in the `@trebired/logger` call style, but you do not want to require the final runtime logger to be `@trebired/logger`.

It takes log calls written like `@trebired/logger`:

```ts
log.info("group", "message", metadata);
log.warn("group", "message", metadata);
log.error("group", "message", metadata);
log.fail("group", "message", metadata);
```

and emits them through either:

- `@trebired/logger`
- common logger objects such as `console`, pino-style, or sink-style loggers
- a caller-defined custom writer

It does not manage log directories, file output, retention, or persistence.

It is not a logger by itself. It is a compatibility layer between:

- code that wants to log with `info(group, message, metadata)`
- the actual logger or sink you want to use at runtime

## What It Is For

Use this when:

- your codebase wants one stable internal logging call shape
- you want to support `@trebired/logger` directly
- you also want to accept user-provided loggers such as `console`, pino-style loggers, sink functions, or custom writer callbacks
- you want callers to define the exact final emitted log structure without changing your internal log calls

In practice, it lets you keep code like this:

```ts
log.info("server", "started", { port: 3000 });
```

while still allowing the runtime output to become:

- an `@trebired/logger` call
- a pino-style object-first call
- a single formatted console string
- a custom object shape
- an event callback payload

## What It Does Not Do

This package does not:

- save logs to disk
- manage log directories
- rotate files
- keep retention rules
- replace `@trebired/logger`

If you want actual log storage and Trebired's full logger runtime, use `@trebired/logger`. If you want compatibility with that calling style while adapting to other outputs, use `@trebired/logger-adapter`.

## Install

```sh
npm install @trebired/logger-adapter
```

## Use

```ts
import { resolveLogger } from "@trebired/logger-adapter";

const log = resolveLogger({
  logger: console,
  source: "my-app",
});

log.info("server", "started", { port: 3000 });
log.warn("auth", "permission denied", { userId: "42" });
```

That means your application code can always speak one logging dialect, while the adapter decides how that log should be delivered.

The normalized logger always exposes:

```ts
type NormalizedLogger = {
  info(group: string, message: string, metadata?: unknown): void;
  warn(group: string, message: string, metadata?: unknown): void;
  error(group: string, message: string, metadata?: unknown): void;
  fail(group: string, message: string, metadata?: unknown): void;
};
```

## Supported Inputs

`resolveLogger()` accepts:

- a Trebired-style logger
- an event sink function `(event) => void`
- sink objects with `write(event)` or `log(event)`
- object-first loggers such as pino-style level methods
- plain message-first logger methods
- a custom writer through `adapter(logger, event)`

## Exact Output Shape

If you want exact control over the emitted structure, pass both `logger` and `adapter`:

```ts
import { resolveLogger } from "@trebired/logger-adapter";

const rows: unknown[] = [];

const log = resolveLogger({
  logger: rows,
  adapter(logger, event) {
    (logger as unknown[]).push({
      when: event.timestamp,
      scope: event.group,
      severity: event.level,
      text: event.message,
      extra: event.metadata,
    });
  },
});

log.info("server", "started", { port: 3000 });
```

That lets you control:

- field names
- field order
- string vs object output
- timestamp placement
- metadata nesting
- method routing

## Notes

- `source` is only used when `@trebired/logger` is auto-created at runtime.
- If `@trebired/logger` is not available, the adapter falls back according to the configured fallback mode.
- `fail` maps to `fatal` automatically when the target logger uses that name instead.
