import { createRequire } from 'node:module';
import { Command, type OptionValues } from 'commander';
import { outro } from '@clack/prompts';
import { detectProject, DetectionError } from './detector.js';
import { runWizard } from './wizard.js';

// Read version from package.json at runtime (not bundled)
const require = createRequire(import.meta.url);
const pkg = require('../package.json') as { version: string; description: string };

// ─── Program definition ──────────────────────────────────────────────────────

const program = new Command();

program
  .name('migrate-angular')
  .description(pkg.description)
  .version(pkg.version, '-v, --version', 'Print the installed version')
  .argument('<project-path>', 'Path to the Angular project root to migrate')
  .option(
    '--from <version>',
    'Source Angular major version — auto-detected from package.json if omitted',
  )
  .option('--to <version>', 'Target Angular major version', '20')
  .option(
    '--apply',
    'Execute the migration (default mode is dry-run — shows plan without changing files)',
  )
  .option('--skip-tests', 'Skip test verification after each migration step')
  .option('--skip-build', 'Skip build verification after each migration step')
  .option(
    '--packages <list>',
    'Comma-separated ecosystem packages to migrate — skips the interactive wizard (e.g. material,ngrx,rxjs)',
  )
  .option(
    '--demo',
    'Run a fully simulated migration with no file changes — useful for previewing the output',
  )
  .addHelpText(
    'after',
    `
Examples:
  # Dry-run: show what would happen migrating from v8 to v20
  $ migrate-angular ./my-app --from=8 --to=20

  # Execute the migration
  $ migrate-angular ./my-app --from=8 --to=20 --apply

  # Skip the wizard, specify packages directly
  $ migrate-angular ./my-app --from=8 --to=20 --apply --packages material,ngrx

  # Resume after a failure at v12
  $ migrate-angular ./my-app --from=12 --to=20 --apply
    `,
  )
  .action(async (projectPath: string, options: OptionValues) => {
    await run(projectPath, options);
  });

// ─── Main action ─────────────────────────────────────────────────────────────

async function run(projectPath: string, options: OptionValues): Promise<void> {
  const isDryRun = !(options.apply as boolean | undefined);

  try {
    // ── Step 1: Detect project ──────────────────────────────────────────────
    const projectInfo = detectProject(projectPath);

    // ── Step 2: Resolve --from version ─────────────────────────────────────
    const fromVersion = resolveFromVersion(
      options.from as string | undefined,
      projectInfo.angularVersion,
    );

    const toVersion = parseVersion(options.to as string, '--to');

    // ── Step 3: Validate version range ─────────────────────────────────────
    validateVersionRange(fromVersion, toVersion);

    // ── Step 4: Run wizard ──────────────────────────────────────────────────
    const wizardResult = await runWizard(projectInfo, {
      packagesArg: options.packages as string | undefined,
      fromVersion,
      toVersion,
      isDryRun,
    });

    if (!wizardResult.confirmed) {
      process.exit(0);
    }

    // ── Step 5: Dry-run exits after wizard; apply continues to migration ────
    if (isDryRun) {
      // outro was already printed by wizard — just exit cleanly
      process.exit(0);
    }

    // ── Phase 4+: Migration engine (coming soon) ────────────────────────────
    outro('Phase 2 complete — migration engine coming in Phase 4.');
    process.exit(0);
  } catch (err: unknown) {
    handleError(err);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveFromVersion(
  fromArg: string | undefined,
  detectedVersion: number,
): number {
  if (!fromArg) return detectedVersion;
  const parsed = parseVersion(fromArg, '--from');
  return parsed;
}

function parseVersion(value: string, flag: string): number {
  const n = parseInt(value, 10);
  if (isNaN(n) || n < 8 || n > 20) {
    console.error(
      `\n  Error: ${flag} must be an Angular major version between 8 and 20 (got "${value}")\n`,
    );
    process.exit(1);
  }
  return n;
}

function validateVersionRange(from: number, to: number): void {
  if (from >= to) {
    console.error(
      `\n  Error: --from (${from}) must be less than --to (${to}).\n` +
        `  Example: --from=8 --to=20\n`,
    );
    process.exit(1);
  }
}

function handleError(err: unknown): void {
  if (err instanceof DetectionError) {
    console.error(`\n  ✖  ${err.message}\n`);
    process.exit(1);
  }
  // Unexpected errors — rethrow for visibility
  throw err;
}

// ─── Entry ───────────────────────────────────────────────────────────────────

await program.parseAsync();
