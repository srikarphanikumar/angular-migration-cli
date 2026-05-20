# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`angular-migration-cli` is an open-source npm CLI package that automates incremental Angular version upgrades (8 → 9 → 10 → ... → 20). It is published to npmjs.org under the author's open-source profile.

## Internal docs (`.claude/docs/` — git-ignored)

All planning and design decisions live here. Read before coding anything.

| File | What's in it |
|---|---|
| [`product-spec.md`](.claude/docs/product-spec.md) | Canonical product decisions: CLI flags, execution flow, failure behaviour, v1 scope |
| [`build-phases.md`](.claude/docs/build-phases.md) | 9 development phases with deliverables and done-criteria per phase |
| [`architecture.md`](.claude/docs/architecture.md) | Module map, data flow, key types, module responsibility rules, how to add a step |
| [`migration-paths.md`](.claude/docs/migration-paths.md) | What changed in each Angular version, what `ng update` covers, what needs manual codemods |
| [`cli-ux.md`](.claude/docs/cli-ux.md) | Exact terminal output design, color palette, all message templates |
| [`migration-doc-format.md`](.claude/docs/migration-doc-format.md) | Schema for the `migration-docs/vN-vM-changes.md` files written into user projects |
| [`package-catalog.md`](.claude/docs/package-catalog.md) | Supported ecosystem packages, Type A vs B, version mapping tables |
| [`tech-stack.md`](.claude/docs/tech-stack.md) | Every dependency with rationale; build output format; Node version policy |

## Commands

```bash
npm install          # install dependencies
npm run build        # compile TypeScript → dist/
npm run dev          # watch mode build
npm test             # run all tests
npm test -- --testPathPattern=<file>   # run a single test file
npm run lint         # eslint
npm pack             # dry-run package creation (inspect before publish)
npm publish          # publish to npmjs.org (requires login + version bump)
```

After installing globally for local testing:
```bash
npm link             # exposes the CLI binary locally
ng-migrate --help    # smoke-test the linked binary
```

## Architecture

The package exposes a single CLI binary (`ng-migrate`) defined in `package.json#bin`. Entry point is `src/cli.ts`, which uses a commander/yargs command tree.

Migration logic is organized as a chain of **step runners**, one per Angular major version bump (e.g. `src/migrations/v8-to-v9.ts`, `v9-to-v10.ts`, …). Each step runner:
1. Detects the current Angular version in the target project's `package.json`.
2. Runs the official `ng update` schematic for that version bump.
3. Applies any manual codemods (AST transforms via `ts-morph` or `@angular/core/schematics`).
4. Verifies the target project still builds/tests cleanly before proceeding to the next step.

`src/detector.ts` reads the target project's `package.json` and `angular.json` to determine starting version and project shape. `src/runner.ts` orchestrates the step chain, handles rollback on failure, and streams progress to stdout.

## Key conventions

- TypeScript strict mode; `tsconfig.json` targets Node 18+.
- Tests live alongside source in `__tests__/` or `.spec.ts` siblings; Jest is the test runner.
- No default exports — named exports only.
- The CLI never mutates the target project without an explicit `--dry-run=false` flag (dry-run is the default).
