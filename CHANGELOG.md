# Changelog

## 0.2.10

- Fixed the restored `logPackageInitialized` export leaking an internal `#hash`-alias type import into its published `.d.ts`, which only resolves inside this repo's own `tsconfig.json` and broke typecheck for any external consumer. It now imports the type via a plain relative path instead, matching `resolve-logger.ts`'s existing convention.

## 0.2.9

- Restored the `logPackageInitialized` export from the package root. It was silently dropped from `src/index.ts` in 0.2.6 (undocumented at the time), breaking every consumer that imports it directly, including `@trebired/bootstrap`, `@trebired/bundler`, `@trebired/code-server-kit`, and `@trebired/git-host`.
- Fixed a broken published-package build: a fresh checkout has no committed `.code-discipline/generated/` output, and nothing regenerated it before `typecheck`/`build`, so every internal `#hash` import failed to resolve. `typecheck` and `build` now run `prepare:generated` first.
- Standardized package metadata (author field, config-driven organization name, dropped the Node engine constraint) and migrated `.code-discipline/config.ts` to `defineCodeDisciplineConfig`.
- Normalized README structure and removed the license footer.
- Updated the `@trebired/code-discipline` devDependency to 4.8.0.

## 0.2.6

- Standardized package metadata ordering and contributing guidance around the Trebired writing style.
- Added package-owned organization metadata and used it for fallback package-initialization groups.
- Updated Code Discipline to the current package release.

## 0.2.5

- Removed dead test scripts and stale test commands from publish workflows and maintainer docs.

## 0.2.4

- Removed package test suites and banned committed `*.spec.ts`/`*.spec.tsx` files through Code Discipline.
- Added Code Discipline enforcement for hardcoded `trebired` strings outside package metadata.
- Migrated Code Discipline to `.code-discipline/config.ts` with alias-map sync output.
- Updated package-generated artifact ignores and internal package dependency ranges.

## 0.2.3

- Updated `logPackageInitialized()` so `@trebired/*` sources emit package initialization notices under the `trebired.<package>.initialize` group root by default.

## 0.2.2

- Enforced the package `tb.code-discipline.ts` policy across source, tests, and examples, including synced import aliases and normalized `tsconfig` path metadata.
- Reduced small event-shaping duplication without changing the public adapter contract.

## 0.2.0

- Added `success`-level adapter support for startup and lifecycle notices.
- Added `logPackageInitialized()` so Trebired packages can emit initialization notices through package-specific `.initialize` groups.

## 0.1.0

- Added shared logger adapter runtime for Trebired packages.
