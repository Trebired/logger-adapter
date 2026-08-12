# Changelog

This project follows semantic versioning once published.

## 0.4.4

- Adopted the external `@trebired/code-discipline-config` preset and updated Code Discipline tooling to `@trebired/code-discipline@^6.0.9`.

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
