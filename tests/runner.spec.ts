import { jest } from '@jest/globals';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runMigration } from '../src/runner.js';
import type { ProjectInfo, WizardResult } from '../src/types.js';

function makeProjectInfo(): ProjectInfo {
  return {
    projectPath: mkdtempSync(join(tmpdir(), 'migrate-angular-runner-')),
    angularVersion: 8,
    angularVersionFull: '8.2.14',
    packageManager: 'npm',
    buildCommand: 'node -e "console.log(\'build ok\')"',
    testCommand: 'node -e "console.log(\'test ok\')"',
    installedPackages: { '@angular/core': '8.2.14' },
    isMonorepo: false,
    projectName: 'app',
  };
}

function makeWizardResult(): WizardResult {
  return {
    selectedPackages: [],
    confirmed: true,
    fromVersion: 8,
    toVersion: 9,
  };
}

describe('runner', () => {
  it('runs stub pipeline and writes a migration doc', async () => {
    const projectInfo = makeProjectInfo();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runMigration(projectInfo, makeWizardResult(), {
      toolVersion: '0.1.0',
      skipBuild: true,
      skipTests: true,
    });

    logSpy.mockRestore();

    expect(existsSync(join(projectInfo.projectPath, 'migration-docs/v8-v9-changes.md'))).toBe(true);
  });
});
