# @trebired/logger-adapter

Generic adapter that normalizes logger calls across TypeScript, browser, bridge, and Rust runtimes.

This package owns logger input normalization, group prefix application, a JSONL bridge process, and the Rust client wrapper. Callers own logger storage, retention, transport policy, and application-specific log groups.

## Install

Runtime support: Bun 1+.

```sh
bun i @trebired/logger-adapter @trebired/logger
```

## Quick Start

```ts
import { resolveLogger } from "@trebired/logger-adapter";

const log = resolveLogger({
  groupPrefix: "service",
  logger: console,
  source: "service",
});

log.info("runtime", "started", { pid: process.pid });
```

## Concepts

### Adapter Model

`resolveLogger()` accepts logger objects with level methods, event sink functions, sink objects, object-first logger APIs, message-first logger APIs, and custom adapter functions.

### Browser Runtime

The browser entrypoint avoids Node-only modules. Pass a browser logger explicitly, pass `defaultLogger`, or expose a factory on `globalThis`.

### Bridge Runtime

The bridge is a long-lived Bun process that reads newline-delimited JSON commands from stdin, forwards log events to the installed JavaScript logger package, and writes acknowledgements or errors to stdout.

### Rust Runtime

The Rust crate under `rust/logger-adapter` manages the bridge process, JSONL protocol, acknowledgements, flushing, shutdown, and bridge errors for native callers.

## Runtime

The package resolves the logger package at runtime. Applications that use the bridge keep `@trebired/logger` installed beside the adapter.

`groupPrefix` prepends a package or application namespace unless the group already starts with that prefix.

## Public API

Entrypoints:

- `@trebired/logger-adapter`
- `@trebired/logger-adapter/browser`
- `@trebired/logger-adapter/bridge`
- `@trebired/logger-adapter/bridge/protocol`

The normalized logger exposes `info`, `warn`, `error`, `fail`, and `log`.

## CLI

```sh
bunx logger-adapter-bridge
```

The bridge command reads protocol messages from stdin and writes JSON results to stdout.

## What It Does Not Do

This package does not:

- Replace `@trebired/logger`.
- Define retention or rotation policy.
- Own application log directory choices.
- Invent application-specific logging groups.
