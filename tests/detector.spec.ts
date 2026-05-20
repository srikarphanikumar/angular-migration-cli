import { join } from 'node:path';
import { detectProject, DetectionError } from '../src/detector.js';

const FIXTURES = join(process.cwd(), 'tests/fixtures');

// ─── Happy path ───────────────────────────────────────────────────────────────

describe('detectProject() — v8 project with material + ngrx', () => {
  const result = detectProject(join(FIXTURES, 'v8-with-packages'));

  it('detects Angular major version 8', () => {
    expect(result.angularVersion).toBe(8);
  });

  it('returns full version string', () => {
    expect(result.angularVersionFull).toBe('8.2.14');
  });

  it('defaults to npm when no lockfile is present', () => {
    expect(result.packageManager).toBe('npm');
  });

  it('reads project name from angular.json defaultProject', () => {
    expect(result.projectName).toBe('my-angular-app');
  });

  it('builds correct build command', () => {
    expect(result.buildCommand).toBe('ng build my-angular-app');
  });

  it('builds correct test command', () => {
    expect(result.testCommand).toBe('ng test my-angular-app --watch=false');
  });

  it('is not a monorepo', () => {
    expect(result.isMonorepo).toBe(false);
  });

  it('detects @angular/material as installed', () => {
    expect(result.installedPackages['@angular/material']).toBeDefined();
  });

  it('detects @ngrx/store as installed', () => {
    expect(result.installedPackages['@ngrx/store']).toBeDefined();
  });

  it('merges both dependencies and devDependencies into installedPackages', () => {
    // devDep
    expect(result.installedPackages['@angular/cli']).toBeDefined();
    // dep
    expect(result.installedPackages.rxjs).toBeDefined();
  });
});

// ─── Bare project (Angular 14, no ecosystem packages) ────────────────────────

describe('detectProject() — v14 bare project', () => {
  const result = detectProject(join(FIXTURES, 'v14-bare'));

  it('detects Angular major version 14', () => {
    expect(result.angularVersion).toBe(14);
  });

  it('returns correct full version', () => {
    expect(result.angularVersionFull).toBe('14.3.0');
  });

  it('does not include material in installedPackages', () => {
    expect(result.installedPackages['@angular/material']).toBeUndefined();
  });
});

// ─── Monorepo ─────────────────────────────────────────────────────────────────

describe('detectProject() — v12 monorepo', () => {
  const result = detectProject(join(FIXTURES, 'v12-monorepo'));

  it('flags isMonorepo as true', () => {
    expect(result.isMonorepo).toBe(true);
  });

  it('uses defaultProject as projectName', () => {
    expect(result.projectName).toBe('dashboard');
  });
});

// ─── Package manager detection ────────────────────────────────────────────────

describe('detectProject() — yarn project', () => {
  it('detects yarn from yarn.lock', () => {
    const result = detectProject(join(FIXTURES, 'v10-yarn'));
    expect(result.packageManager).toBe('yarn');
  });
});

describe('detectProject() — pnpm project', () => {
  it('detects pnpm from pnpm-lock.yaml', () => {
    const result = detectProject(join(FIXTURES, 'v10-pnpm'));
    expect(result.packageManager).toBe('pnpm');
  });
});

// ─── Fallback: no angular.json ────────────────────────────────────────────────

describe('detectProject() — Angular project without angular.json', () => {
  const result = detectProject(join(FIXTURES, 'no-angular-json'));

  it('still detects Angular version', () => {
    expect(result.angularVersion).toBe(16);
  });

  it('falls back to default build command', () => {
    expect(result.buildCommand).toBe('ng build');
  });

  it('falls back to default test command', () => {
    expect(result.testCommand).toBe('ng test --watch=false');
  });

  it('is not a monorepo', () => {
    expect(result.isMonorepo).toBe(false);
  });
});

// ─── Error cases ─────────────────────────────────────────────────────────────

describe('detectProject() — error handling', () => {
  it('throws DetectionError for a non-existent path', () => {
    expect(() => detectProject('/totally/fake/path')).toThrow(DetectionError);
  });

  it('throws DetectionError when package.json is missing', () => {
    // The FIXTURES dir itself has no package.json
    expect(() => detectProject(FIXTURES)).toThrow(DetectionError);
  });

  it('throws DetectionError when @angular/core is absent', () => {
    expect(() =>
      detectProject(join(FIXTURES, 'no-angular-core')),
    ).toThrow(DetectionError);
  });

  it('throws DetectionError for Angular version below 8', () => {
    expect(() =>
      detectProject(join(FIXTURES, 'v7-unsupported')),
    ).toThrow(DetectionError);
  });

  it('DetectionError carries the correct name', () => {
    try {
      detectProject('/totally/fake/path');
    } catch (err) {
      expect(err).toBeInstanceOf(DetectionError);
      expect((err as DetectionError).name).toBe('DetectionError');
    }
  });
});
