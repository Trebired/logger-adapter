# Contributing

Thanks for helping improve the logger adapter.

## Development Setup

```sh
bun install
```

The package is authored in TypeScript and published from `dist`. The Rust crate lives under `rust/logger-adapter`. Generated outputs, package tarballs, temp folders, logs, and caches stay out of Git.

## Common Commands

```sh
bun install --frozen-lockfile
bunx code-discipline check
bun run typecheck
bun run build
bun run verify:bridge
bun run verify:rust
bun run verify:pack
```

Committed `*.spec.ts` and `*.spec.tsx` files are banned by Code Discipline.

## Pull Request Checklist

- Keep public API changes intentional and documented in `README.md`.
- Run Code Discipline, typecheck, build, and package verification when relevant.
- Update `CHANGELOG.md` under the current version or a new version section.
- Do not commit `dist`, package tarballs, temp folders, logs, or caches.

## Code Discipline

- Keep the config at `.trebired/code-discipline/config.ts`.
- Use `syncImports.output.type: "alias-map"`.
- Keep `allowRelative: ["./"]`.
- Do not add rule-level excludes to bypass discipline.
- Keep names, sample data, examples, fixtures, tests, docs, CLI output, and generated files generic, configurable, or derived from package metadata.

## Design Principles

- Keep the package focused on adapting logger calls and owning the native bridge.
- Keep compatibility with the real JavaScript logger package straightforward and explicit.
- Preserve the internal call shape: `level(group, message, metadata?)`.
- Support exact caller-controlled output shapes through custom adapters.
- Avoid external runtime dependencies unless they remove real complexity.

## Release Process

1. Update `package.json` and `CHANGELOG.md` together.
2. Run the verification commands from Common Commands.
3. Push the commit and release tag.
4. Wait for the publish workflow to finish and verify the published package.
