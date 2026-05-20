import type { MigrationStep, StepResult } from '../types.js';

export function getMigrationSteps(fromVersion: number, toVersion: number): MigrationStep[] {
  const steps: MigrationStep[] = [];

  for (let version = fromVersion; version < toVersion; version += 1) {
    steps.push(createStubMigrationStep(version, version + 1));
  }

  return steps;
}

function createStubMigrationStep(fromVersion: number, toVersion: number): MigrationStep {
  return {
    fromVersion,
    toVersion,
    label: `v${fromVersion} → v${toVersion}`,
    tasks: [
      {
        label: `Prepare stub migration v${fromVersion} → v${toVersion}`,
        run: () => Promise.resolve(),
      },
    ],
    execute: () => Promise.resolve(createStubStepResult(fromVersion, toVersion)),
  };
}

function createStubStepResult(fromVersion: number, toVersion: number): StepResult {
  return {
    fromVersion,
    toVersion,
    success: true,
    changedFiles: [],
    syntaxChanges: [],
    packageChanges: [
      {
        name: '@angular/core',
        from: `${fromVersion}.x`,
        to: `${toVersion}.x`,
      },
      {
        name: '@angular/cli',
        from: `${fromVersion}.x`,
        to: `${toVersion}.x`,
      },
    ],
    duration: 0,
  };
}

