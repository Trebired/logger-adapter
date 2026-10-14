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

## The Organization Namespace

The log group that starts with the organization's own name belongs to the organization's
packages. Importing this package installs a guard with `@trebired/logger` and checks every
claim the adapter routes itself, so a package that is not published under the organization's
npm scope cannot log under that namespace.

The rule is one question: does the calling package's own `package.json` name start with the
scope. Nothing else qualifies, including an application that declares the organization in its
own metadata, because the namespace belongs to the packages rather than to the products built
with them. A refusal throws at the call that made it, naming the package, its path and the
group it claimed.

The claim is read where the group is final, so a group assembled at runtime from pieces is
treated exactly like a literal one. The verdict is cached per calling package, which leaves a
boolean and one string test per record afterwards.

What this is and is not: the npm scope is owned on the registry, so nobody else can publish
under it, and a package that writes the name into its own `package.json` without publishing is
making a claim in a file anyone can read. Code already running in the same process can patch
the logger, so this is attribution rather than a sandbox. `TREBIRED_LOG_GUARD=off` turns the
guard off for an incident, with the weakening that implies.

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
