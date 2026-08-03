# Logger Adapter

Generic structured logger adapter for runtimes that use:

```ts
log.info(group, message, metadata);
log.warn(group, message, metadata);
log.error(group, message, metadata);
log.fail(group, message, metadata);
log.log(level, group, message, metadata);
```

The JavaScript logger package remains the real logger. This adapter normalizes TypeScript logger inputs and also owns the JSONL bridge plus Rust client wrapper for native applications.

## Install

```sh
bun i <logger-adapter-package> <logger-package>
```

The adapter resolves the logger package at runtime. Keep the logger package installed in applications that use the bridge.

## TypeScript

```ts
import { resolveLogger } from "<logger-adapter-package>";

const log = resolveLogger({
  logger: console,
  source: "service",
});

log.info("service.start", "started", { pid: process.pid });
log.warn("service.request", "slow", { durationMs: 1250 });
log.error("service.task", "failed", { recoverable: true });
log.fail("service.shutdown", "stopped");
log.log("audit", "service.event", "recorded", { count: 1 });
```

`resolveLogger()` accepts:

- logger objects with level methods
- event sink functions
- sink objects with `write(event)` or `log(event)`
- object-first logger APIs
- message-first logger APIs
- a custom `adapter(logger, event)` writer

## Browser

```ts
import { resolveLogger } from "<logger-adapter-package>/browser";

const log = resolveLogger({
  logger: console,
  source: "frontend.runtime",
});

log.info("frontend.runtime", "bound");
```

The browser entrypoint does not import Node-only modules and does not auto-create the server logger. Pass a browser logger explicitly, pass `defaultLogger`, or expose a factory as `globalThis.__logger_adapter_logger__` or `globalThis.loggerAdapterLogger`.

## Bridge

The bridge is a long-lived Bun process that reads newline-delimited JSON commands from stdin and writes JSON acknowledgements/errors to stdout. It forwards log events to the installed JavaScript logger package.

```sh
bunx <logger-adapter-bridge-bin>
```

Protocol examples:

```json
{"type":"configure","id":"1","logger":{"source":"native-app","dir":"/path/to/logs","save":true,"console":true}}
{"type":"log","level":"info","group":"app.start","message":"started","metadata":{"pid":123},"timestamp":"2026-08-03T12:00:00.000Z"}
{"type":"flush","id":"2"}
{"type":"close","id":"3"}
```

Commands with an `id` receive either:

```json
{"type":"ack","ok":true,"command":"flush","id":"2"}
```

or:

```json
{"type":"error","ok":false,"command":"flush","id":"2","error":{"code":"command-failed","message":"..."}}
```

## Rust

The package includes a Rust crate under `rust/logger-adapter`. Rust applications depend on that crate and let it manage the bridge process, JSONL protocol, acknowledgements, flushing, shutdown, and errors.

```toml
[dependencies]
logger-adapter = { path = "node_modules/<logger-adapter-package>/rust/logger-adapter" }
serde_json = "1"
```

```rust
use logger_adapter::{LoggerAdapter, LoggerConfig};
use serde_json::json;

fn main() -> logger_adapter::Result<()> {
    let config = LoggerConfig::new("native-app")
        .dir("./logs")
        .save(true)
        .console(true);

    let mut log = LoggerAdapter::builder(config).start()?;
    log.info("app.start", "started", json!({ "pid": std::process::id() }))?;
    log.warn("app.request", "slow", json!({ "duration_ms": 1250 }))?;
    log.error("app.task", "failed", json!({ "recoverable": true }))?;
    log.fail("app.shutdown", "stopped", serde_json::Value::Null)?;
    log.log("audit", "app.event", "recorded", json!({ "count": 1 }))?;
    log.flush()?;
    log.close()?;
    Ok(())
}
```

The default Rust bridge path points to the built JavaScript bridge in the installed package. Override it with `LoggerAdapterBuilder::bridge_script(path)` when embedding the bridge elsewhere, and override the Bun executable with `LoggerAdapterBuilder::bun_executable(command)` when needed.

## Public API

Entrypoints:

- package root
- `/browser`
- `/bridge`
- `/bridge/protocol`

The normalized TypeScript logger exposes `info`, `warn`, `error`, `fail`, and `log`.

## Scope

This package adapts logger calls and owns the native bridge. It does not replace the JavaScript logger package, define retention policy, rotate files, or make application-specific logging decisions.
