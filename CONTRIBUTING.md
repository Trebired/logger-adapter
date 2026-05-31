# Contributing

Thanks for helping improve `@trebired/logger-adapter`.

## Development Setup

```sh
bun install
```

The package is authored in TypeScript and published from `dist`.

## Common Commands

```sh
bun run typecheck
bun test
bun run build
bun run demo
```

## Pull Request Checklist

- Keep public API changes intentional and documented in `README.md`.
- Add or update tests for behavior changes.
- Run typecheck, tests, and build before opening a PR.
- Update `CHANGELOG.md` under the next version section.
- Do not commit generated package tarballs.

## Design Principles

- Keep the package focused on adapting logger calls, not storing logs.
- Keep `@trebired/logger` compatibility straightforward and explicit.
- Preserve a small internal log call shape: `level(group, message, metadata?)`.
- Support exact caller-controlled output shapes through custom adapters.
- Avoid external runtime dependencies unless they remove real complexity.

## Release Process

1. Move changelog entries into a versioned section.
2. Update the package version:

   ```sh
   npm version patch
   ```

   Use `minor` or `major` instead of `patch` when appropriate.

3. Verify the package:

   ```sh
   bun run typecheck
   bun test
   bun run build
   npm pack --dry-run
   ```

4. Publish with:

   ```sh
   npm publish
   ```

`npm publish` runs `prepublishOnly`, which typechecks, tests, and builds before publishing.
