# Changelog

## 0.2.2

- Enforced the package `tb.code-discipline.ts` policy across source, tests, and examples, including synced import aliases and normalized `tsconfig` path metadata.
- Reduced small event-shaping duplication without changing the public adapter contract.

## 0.2.0

- Added `success`-level adapter support for startup and lifecycle notices.
- Added `logPackageInitialized()` so Trebired packages can emit initialization notices through package-specific `.initialize` groups.

## 0.1.0

- Added shared logger adapter runtime for Trebired packages.
