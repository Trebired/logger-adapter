# Changelog

This project follows semantic versioning once published.

## 0.4.0

- Added a Bun JSONL bridge entrypoint for forwarding structured commands into the real JavaScript logger package.
- Added bridge protocol types and validation helpers.
- Added a Rust crate that manages bridge spawning, JSONL serialization, acknowledgements, flush, close, and error handling.
- Added generic `log(level, group, message, metadata?)` support to the normalized TypeScript adapter.
- Added bridge and Rust verification to the publish checks.

## Earlier Releases

Earlier releases provided the TypeScript server and browser adapter APIs.
