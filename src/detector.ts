import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import semver from 'semver';
import type { ProjectInfo, PackageManager } from './types.js';

// ─── Error type ───────────────────────────────────────────────────────────────

/** Thrown by detectProject() when the target project cannot be read or is invalid. */
export class DetectionError extends Error {
  public override readonly name = 'DetectionError';
}

// ─── Raw JSON shapes ──────────────────────────────────────────────────────────

interface RawPackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface RawAngularJson {
  defaultProject?: string;
  projects?: Record<string, unknown>;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Reads the target Angular project at projectPath and returns a ProjectInfo.
 *
 * Throws DetectionError for any condition that prevents migration:
 *   - path does not exist
 *   - no package.json
 *   - @angular/core not found
 *   - Angular version below 8
 *   - unparseable version string
 */
export function detectProject(projectPath: string): ProjectInfo {
  const resolvedPath = resolve(projectPath);

  // ── 1. Path must exist ────────────────────────────────────────────────────
  if (!existsSync(resolvedPath)) {
    throw new DetectionError(`Project path does not exist: "${resolvedPath}"`);
  }

  // ── 2. package.json must exist ────────────────────────────────────────────
  const pkgJsonPath = join(resolvedPath, 'package.json');
  if (!existsSync(pkgJsonPath)) {
    throw new DetectionError(
      `No package.json found at "${pkgJsonPath}". Is this an Angular project root?`,
    );
  }

  let rawPkg: RawPackageJson;
  try {
    rawPkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8')) as RawPackageJson;
  } catch {
    throw new DetectionError(`Failed to parse package.json at "${pkgJsonPath}".`);
  }

  const allDeps: Record<string, string> = {
    ...(rawPkg.dependencies ?? {}),
    ...(rawPkg.devDependencies ?? {}),
  };

  // ── 3. @angular/core must be present ─────────────────────────────────────
  const angularCoreRaw = allDeps['@angular/core'];
  if (!angularCoreRaw) {
    throw new DetectionError(
      `@angular/core not found in package.json. Is this an Angular (v2+) project?`,
    );
  }

  // ── 4. Parse and validate the version ────────────────────────────────────
  const coerced = semver.coerce(angularCoreRaw);
  if (!coerced) {
    throw new DetectionError(
      `Cannot parse @angular/core version "${angularCoreRaw}". Expected a semver string (e.g. "~8.2.14").`,
    );
  }

  if (coerced.major < 8) {
    throw new DetectionError(
      `Angular ${coerced.major} is not supported. migrate-angular supports Angular 8–20. ` +
        `For older projects, upgrade to Angular 8 manually first.`,
    );
  }

  // ── 5. Detect package manager ─────────────────────────────────────────────
  const packageManager = detectPackageManager(resolvedPath);

  // ── 6. Read angular.json ──────────────────────────────────────────────────
  const { buildCommand, testCommand, projectName, isMonorepo } =
    readAngularJson(resolvedPath);

  return {
    projectPath: resolvedPath,
    angularVersion: coerced.major,
    angularVersionFull: coerced.version,
    packageManager,
    buildCommand,
    testCommand,
    installedPackages: allDeps,
    isMonorepo,
    projectName,
  };
}

// ─── Internals ────────────────────────────────────────────────────────────────

function detectPackageManager(projectPath: string): PackageManager {
  if (existsSync(join(projectPath, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(projectPath, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

function readAngularJson(projectPath: string): {
  buildCommand: string;
  testCommand: string;
  projectName: string;
  isMonorepo: boolean;
} {
  const defaults = {
    buildCommand: 'ng build',
    testCommand: 'ng test --watch=false',
    projectName: 'app',
    isMonorepo: false,
  };

  const angularJsonPath = join(projectPath, 'angular.json');
  if (!existsSync(angularJsonPath)) return defaults;

  let angularJson: RawAngularJson;
  try {
    angularJson = JSON.parse(readFileSync(angularJsonPath, 'utf-8')) as RawAngularJson;
  } catch {
    // Malformed angular.json — fall back to defaults rather than blocking migration
    return defaults;
  }

  const projectNames = angularJson.projects
    ? Object.keys(angularJson.projects)
    : [];
  const isMonorepo = projectNames.length > 1;
  const projectName = angularJson.defaultProject ?? projectNames.at(0) ?? 'app';

  return {
    buildCommand: `ng build ${projectName}`,
    testCommand: `ng test ${projectName} --watch=false`,
    projectName,
    isMonorepo,
  };
}
