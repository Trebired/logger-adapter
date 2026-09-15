# Changelog

## 0.6.0

- Moved to `@trebired/logger` 3.0.0. The `@package/logger` dependency range is now `^3.0.0` and the optional `@trebired/logger` peer range is `^3.0.0` instead of any version. The adapter only uses `createLog()` and `loadCachedConfigSync()`, which are unchanged. Logger 3.0.0 stores saved logs in SQLite and runs on Bun only on the server.
- Updated the shipped `.trebired/logger/config.ts` `forVersion` to `3.0.0`. The logger checks `forVersion` by major and minor version, so under `@trebired/logger` 3.0 the old `2.7.0` value would fail the check and this package's log prefix would be dropped.

## 0.5.2

- Changed the verification scripts and examples to print through `@trebired/logger` instead of `console` and `process.stdout`.
- Changed `examples/dummy.ts` to resolve the default logger instead of passing `console` as the logger.

## 0.5.1

- Updated the `@trebired/utils` dependency range to `^0.9.0`, keeping every `@trebired` package on one range so a project cannot resolve two copies.
- Updated the shipped `.trebired/logger/config.ts` `forVersion` to `2.7.0` and the `@trebired/code-discipline` / `@trebired/configs` ranges to `^7.2.0` / `^0.4.0`. The logger config named an older release, so under `@trebired/logger` 2.7 the version check threw and this package's log prefix was dropped.

## 0.4.19

### Changed

- Moved the `@trebired/utils` dependency range from `^0.6.0` to `^0.8.0`, matching the rest of
  the `@trebired` packages. For 0.x versions those two ranges are disjoint (`>=0.6.0 <0.7.0` vs
  `>=0.8.0 <0.9.0`), so any project combining this package with one already on `^0.8.0`
  (`@trebired/frontend`, `@trebired/uploads`, `@trebired/env`, `@trebired/security`) resolved two
  copies of `@trebired/utils` — a hoisted 0.6.x alongside a nested 0.8.x — duplicating code and
  letting app-level imports of `@trebired/utils` silently resolve to a different copy than this
  package used internally. Nothing this package uses changed across those releases; the only
  breaking change in 0.8.0 was the env module moving to `@trebired/env`, which this package does
  not import.

## 0.4.18

- Updated the internal logger alias dependency and optional logger peer to the current logger release so consumers do not retain older nested result/logger-adapter installs.

## 0.4.17

- Made package initialization logging idempotent per package source and logger/adapter sink, so packages with multiple entrypoints no longer emit duplicate `initialized` events.

## 0.4.16

- Removed dead `config.creator` from `package.json`.
- Updated shared utilities to `@trebired/utils@^0.6.0` and replaced the removed `readPackageIdentity()` with `readPackageJsonUrl()` + `readOrganizationIdentity()` + `packageSlug()`/`joinLogGroup()`. No change to exported metadata values.

## 0.4.13

- Updated shared utilities to `@trebired/utils@^0.4.4`.
- Updated direct logger dependency to `@trebired/logger@^2.5.28`.

This project follows semantic versioning once published.

## 0.4.12

- Updated shared utilities to `@trebired/utils@^0.4.3`.
- Replaced local value, object, time, and package metadata helpers with shared utilities.

## 0.4.10

- Updated the shared Trebired config dependency to `@trebired/configs@^0.1.2`.

## 0.4.9

- Added browser-side automatic package group prefixing from the package source so browser package logs keep the same ownership shape as server logs.

## 0.4.7

- Updated the internal logger alias dependency to `@trebired/logger@^2.5.22` so package logger configs load correctly under Node runtimes.

## 0.4.5

- Added `groupPrefix` support to the server and browser logger resolvers.
- Added prefixed package initialization logs without requiring packages to prefix each log call manually.

## 0.4.4

- Adopted the external `@trebired/configs` preset and updated Code Discipline tooling to `@trebired/code-discipline@^6.0.9`.

## 0.4.3

- Updated the Code Discipline devDependency and lockfile to public `@trebired/code-discipline@^5.5.2`.
## 0.4.2

- Adopted the shared Trebired Code Discipline preset so package configs only keep repo-specific policy.
- Updated the Code Discipline devDependency and lockfile to public `@trebired/code-discipline@^5.5.1`.

## 0.4.1

- Updated the package Code Discipline config to the platform-aligned rule set, including formatting, redundant path segment cleanup, removable comment checks, structural blank lines, and dry checks.
- Updated the Code Discipline devDependency and lockfile to the current public `@trebired/code-discipline@^5.3.0`.

## 0.4.0

- Added a Bun JSONL bridge entrypoint for forwarding structured commands into the real JavaScript logger package.
- Added bridge protocol types and validation helpers.
- Added a Rust crate that manages bridge spawning, JSONL serialization, acknowledgements, flush, close, and error handling.
- Added generic `log(level, group, message, metadata?)` support to the normalized TypeScript adapter.
- Added bridge and Rust verification to the publish checks.

## Earlier Releases

Earlier releases provided the TypeScript server and browser adapter APIs.
