# migrate-angular

> Incrementally migrate Angular projects from v8 to v20, step by step.

[![npm version](https://img.shields.io/npm/v/migrate-angular.svg)](https://www.npmjs.com/package/migrate-angular)
[![CI](https://github.com/srikarphanikumarmarti/migrate-angular/actions/workflows/ci.yml/badge.svg)](https://github.com/srikarphanikumarmarti/migrate-angular/actions)
[![Node >=18](https://img.shields.io/node/v/migrate-angular)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## What it does

`migrate-angular` takes an Angular project at an older version and walks it through every major version increment up to your target — one step at a time. After each step it verifies the project still builds and all tests pass, then writes a structured migration log into your project.

```
v8 → v9 → v10 → v11 → v12 → v13 → v14 → v15 → v16 → v17 → v18 → v19 → v20
```

Each step:
- Runs the official `ng update` schematics for `@angular/core`, `@angular/cli`, and your selected ecosystem packages
- Applies hand-written codemods for syntax and API changes not covered by the schematics
- Verifies the project builds cleanly and all tests pass
- Writes `migration-docs/vN-vM-changes.md` with a full record of what changed

---

## Installation

```bash
# Run without installing (recommended for one-off migrations)
npx migrate-angular ./my-app --from=8 --to=20

# Or install globally
npm install -g migrate-angular
migrate-angular ./my-app --from=8 --to=20
```

**Requirements:** Node.js 18 or higher.

---

## Usage

```
migrate-angular [project-path] [options]

Arguments:
  project-path               Path to the Angular project root (not required with --demo)

Options:
  --from <version>           Source Angular major version (auto-detected if omitted)
  --to   <version>           Target Angular major version (default: 20)
  --apply                    Execute the migration (default: dry-run, shows plan only)
  --skip-tests               Skip test verification after each step
  --skip-build               Skip build verification after each step
  --packages <list>          Comma-separated packages, skips the interactive wizard
                             e.g. --packages material,ngrx,rxjs
  --demo                     Run a simulated migration without project files
  -v, --version              Print the installed version
  -h, --help                 Display help
```

### Default mode is dry-run

Without `--apply`, the tool detects your project, runs the interactive wizard, and prints the full migration plan — without touching any files. This lets you preview exactly what will happen before committing.

```bash
# Preview the migration plan (no files changed)
migrate-angular ./my-app --from=8 --to=20

# Preview the terminal UI without an Angular project
migrate-angular --demo

# Execute the migration
migrate-angular ./my-app --from=8 --to=20 --apply
```

---

## Ecosystem packages

The interactive wizard will detect which packages are installed and let you select which to migrate alongside Angular core:

| Package | Wizard key | Migration type |
|---|---|---|
| `@angular/material` + CDK | `material` | `ng update` schematic |
| `@ngrx/store` + effects + entity | `ngrx` | `ng update` schematic |
| `ag-grid-angular` | `ag-grid` | Manual steps |
| `rxjs` (6 → 7) | `rxjs` | `ng update` schematic |
| `@angular/fire` | `fire` | `ng update` schematic |
| `@ng-bootstrap/ng-bootstrap` | `ng-bootstrap` | Manual steps |
| `primeng` | `primeng` | Manual steps |

Pass `--packages` to skip the wizard:

```bash
migrate-angular ./my-app --from=8 --to=20 --apply --packages material,ngrx
```

---

## Migration docs

After each step, a structured log is written into your project:

```
your-project/
  migration-docs/
    v8-v9-changes.md
    v9-v10-changes.md
    ...
    v19-v20-changes.md
```

Each doc records: packages updated, files changed, syntax transforms applied, build status, test status, and links to the official Angular migration guide for that version.

---

## Recovering from a failure

If a build or test step fails, the tool stops and reports the errors. An `⚠️ INCOMPLETE` migration doc is written with the errors captured inside. Fix the issue in your project, then resume:

```bash
# Resume from the version where the failure occurred
migrate-angular ./my-app --from=12 --to=20 --apply
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add a new migration step or codemod.

---

## License

MIT © [Srikar Phanikumar Marti](https://github.com/srikarphanikumarmarti)
