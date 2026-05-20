import {
  intro,
  outro,
  note,
  log,
  spinner,
  multiselect,
  isCancel,
  cancel,
} from '@clack/prompts';
import { execa } from 'execa';
import type { PackageKey, ProjectInfo, WizardResult } from './types.js';
import { PACKAGE_CATALOG } from './packages/catalog.js';

// ─── Node version requirements per target Angular major ───────────────────────
// Source: .claude/docs/migration-paths.md

const NODE_REQUIREMENTS: Partial<Record<number, string>> = {
  16: '16.14.0',
  17: '18.13.0',
  18: '18.19.0',
  19: '18.19.0',
  20: '18.19.0',
};

// ─── Public API ───────────────────────────────────────────────────────────────

export interface WizardOptions {
  /** Value of --packages flag, bypasses multi-select prompt when provided. */
  packagesArg?: string;
  fromVersion: number;
  toVersion: number;
  isDryRun: boolean;
}

/**
 * Runs the full interactive wizard:
 *   1. Prints the intro banner
 *   2. Shows detected project info
 *   3. Runs pre-flight checks (Node compat, git status)
 *   4. Shows multi-select package prompt (or parses --packages flag)
 *   5. Shows the migration plan note
 *
 * In dry-run mode, prints the outro and expects the caller to exit.
 * In apply mode, returns WizardResult for the migration engine to consume.
 *
 * Exits process on Ctrl+C.
 */
export async function runWizard(
  projectInfo: ProjectInfo,
  options: WizardOptions,
): Promise<WizardResult> {
  intro('migrate-angular — Angular Incremental Migration Tool');

  // ── Show detected project info ────────────────────────────────────────────
  const detectedLines: string[] = [
    `Angular version : ${projectInfo.angularVersionFull}  (v${projectInfo.angularVersion})`,
    `Package manager : ${projectInfo.packageManager}`,
    `Project name    : ${projectInfo.projectName}`,
    `Project path    : ${projectInfo.projectPath}`,
  ];
  if (projectInfo.isMonorepo) {
    detectedLines.push(`⚠  Monorepo detected — only "${projectInfo.projectName}" will be migrated in v1`);
  }
  note(detectedLines.join('\n'), 'Detected project');

  // ── Pre-flight checks ─────────────────────────────────────────────────────
  await runPreflightChecks(projectInfo, options.toVersion);

  // ── Package selection ─────────────────────────────────────────────────────
  let selectedPackages: PackageKey[];

  if (options.packagesArg) {
    selectedPackages = parsePackagesArg(options.packagesArg);
    log.info(`Packages from --packages flag: ${selectedPackages.join(', ') || 'none'}`);
  } else {
    selectedPackages = await runPackageSelection(projectInfo);
  }

  // ── Migration plan ────────────────────────────────────────────────────────
  const stepCount = options.toVersion - options.fromVersion;
  const planLines = [
    `From     : Angular ${options.fromVersion}`,
    `To       : Angular ${options.toVersion}`,
    `Steps    : ${stepCount}`,
    `Packages : ${selectedPackages.length > 0 ? selectedPackages.join(', ') : 'none (core only)'}`,
    `Mode     : ${options.isDryRun ? 'dry-run  (no files changed — add --apply to execute)' : 'APPLY — project files will be modified'}`,
  ];
  note(planLines.join('\n'), 'Migration Plan');

  if (options.isDryRun) {
    outro('Dry-run complete. Re-run with --apply to execute the migration.');
  }

  return {
    selectedPackages,
    confirmed: true,
    fromVersion: options.fromVersion,
    toVersion: options.toVersion,
  };
}

// ─── Pre-flight checks ────────────────────────────────────────────────────────

async function runPreflightChecks(
  projectInfo: ProjectInfo,
  toVersion: number,
): Promise<void> {
  const s = spinner();
  s.start('Running pre-flight checks');

  interface CheckResult { label: string; level: 'success' | 'warn' | 'info'; }
  const checks: CheckResult[] = [];

  // Node version compatibility
  const nodeResult = checkNodeVersion(toVersion);
  checks.push(nodeResult);

  // Git working tree status
  const gitResult = await checkGitStatus(projectInfo.projectPath);
  checks.push(gitResult);

  s.stop('Pre-flight checks complete');

  for (const check of checks) {
    if (check.level === 'success') log.success(check.label);
    else if (check.level === 'warn') log.warn(check.label);
    else log.info(check.label);
  }
}

function checkNodeVersion(toVersion: number): {
  label: string;
  level: 'success' | 'warn' | 'info';
} {
  const currentNode = process.versions.node;
  const required = NODE_REQUIREMENTS[toVersion];

  if (!required) {
    return {
      label: `Node ${currentNode} — no specific version constraint for Angular ${toVersion}`,
      level: 'success',
    };
  }

  if (nodeSatisfies(currentNode, required)) {
    return {
      label: `Node ${currentNode} meets Angular ${toVersion} requirements (≥${required})`,
      level: 'success',
    };
  }

  return {
    label: `Node ${currentNode} may be too old for Angular ${toVersion} (requires ≥${required}). Consider upgrading Node before running --apply.`,
    level: 'warn',
  };
}

/** Simple semver gte without pulling in the full semver package. */
function nodeSatisfies(current: string, required: string): boolean {
  const parse = (v: string): [number, number, number] => {
    const parts = v.split('.').map(Number);
    return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
  };
  const [cMaj, cMin, cPat] = parse(current);
  const [rMaj, rMin, rPat] = parse(required);
  if (cMaj !== rMaj) return cMaj > rMaj;
  if (cMin !== rMin) return cMin > rMin;
  return cPat >= rPat;
}

async function checkGitStatus(projectPath: string): Promise<{
  label: string;
  level: 'success' | 'warn' | 'info';
}> {
  try {
    const { stdout } = await execa('git', ['status', '--short'], {
      cwd: projectPath,
    });
    if (stdout.trim().length > 0) {
      return {
        label:
          'Working tree has uncommitted changes — commit or stash before running --apply',
        level: 'warn',
      };
    }
    return { label: 'Working tree is clean', level: 'success' };
  } catch {
    return {
      label: 'Not a git repository — you are responsible for backup and recovery',
      level: 'info',
    };
  }
}

// ─── Package multi-select ─────────────────────────────────────────────────────

async function runPackageSelection(projectInfo: ProjectInfo): Promise<PackageKey[]> {
  const installedNames = Object.keys(projectInfo.installedPackages);

  const options = PACKAGE_CATALOG.map((entry) => {
    const detectedPkg = entry.npmPackages.find((p) => installedNames.includes(p));
    const version = detectedPkg ? projectInfo.installedPackages[detectedPkg] : undefined;
    return {
      value: entry.key,
      label: entry.label,
      hint: version ? `installed: ${version}` : 'not detected in package.json',
    };
  });

  const initialValues = PACKAGE_CATALOG
    .filter((entry) => entry.npmPackages.some((p) => installedNames.includes(p)))
    .map((entry) => entry.key);

  const result = await multiselect<PackageKey>({
    message:
      'Which ecosystem packages should be migrated?\n  (detected packages are pre-selected — deselect any you want to skip)',
    options,
    initialValues,
    required: false,
  });

  if (isCancel(result)) {
    cancel('Migration cancelled.');
    process.exit(0);
  }

  return result;
}

// ─── --packages flag parser ───────────────────────────────────────────────────

function parsePackagesArg(packagesArg: string): PackageKey[] {
  const validKeys = new Set(PACKAGE_CATALOG.map((e) => e.key));
  const unknown: string[] = [];

  const parsed = packagesArg
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .filter((key) => {
      if (validKeys.has(key as PackageKey)) return true;
      unknown.push(key);
      return false;
    }) as PackageKey[];

  if (unknown.length > 0) {
    log.warn(
      `Unknown package key(s) in --packages flag, ignored: ${unknown.join(', ')}\n` +
        `  Valid keys: ${[...validKeys].join(', ')}`,
    );
  }

  return parsed;
}
