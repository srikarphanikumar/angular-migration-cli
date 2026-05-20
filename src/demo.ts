import type { MigrationStep, PackageKey, ProjectInfo, StepResult } from './types.js';
import { buildStepTaskList } from './display/tasks.js';
import { OverallProgress } from './display/progress.js';
import {
  printFinalSummary,
  printHeader,
  printStepBanner,
  printStepSummary,
} from './display/messages.js';

const DEMO_PACKAGES: PackageKey[] = ['material', 'ngrx', 'rxjs'];

export async function runDemoMigration(version: string): Promise<void> {
  const fromVersion = 8;
  const toVersion = 20;
  const steps = createDemoSteps(fromVersion, toVersion);
  const projectInfo = createDemoProjectInfo();
  const progress = new OverallProgress();
  const startedAt = Date.now();
  const docs: string[] = [];

  printHeader(version);
  progress.start(steps.length);

  for (const [index, step] of steps.entries()) {
    const stepStartedAt = Date.now();
    printStepBanner(index + 1, steps.length, step.fromVersion, step.toVersion);

    const taskList = buildStepTaskList(step, DEMO_PACKAGES);
    await taskList.run({ projectInfo });

    const docName = `v${step.fromVersion}-v${step.toVersion}-changes.md`;
    docs.push(docName);
    printStepSummary({
      fromVersion: step.fromVersion,
      toVersion: step.toVersion,
      durationMs: Date.now() - stepStartedAt,
      docPath: `migration-docs/${docName}`,
    });
    progress.advance(1, steps.length);
  }

  progress.stop();
  printFinalSummary({
    fromVersion,
    toVersion,
    steps: steps.length,
    durationMs: Date.now() - startedAt,
    buildPassed: true,
    testsPassed: true,
    testSummary: '142 passed, 0 failed',
    docsDir: './demo-app/migration-docs/',
    docs,
  });
}

function createDemoSteps(fromVersion: number, toVersion: number): MigrationStep[] {
  const steps: MigrationStep[] = [];
  for (let version = fromVersion; version < toVersion; version += 1) {
    steps.push(createDemoStep(version, version + 1));
  }
  return steps;
}

function createDemoStep(fromVersion: number, toVersion: number): MigrationStep {
  return {
    fromVersion,
    toVersion,
    label: `v${fromVersion} → v${toVersion}`,
    tasks: [
      {
        label: 'Update @angular/core + @angular/cli',
        run: async () => {
          await sleep(80);
        },
      },
      {
        label: 'Update selected ecosystem packages',
        run: async () => {
          await sleep(70);
        },
      },
      {
        label: 'Apply codemods',
        run: async () => {
          await sleep(90);
        },
      },
      {
        label: 'Build verification',
        run: async () => {
          await sleep(60);
        },
      },
      {
        label: 'Test verification',
        run: async () => {
          await sleep(60);
        },
      },
      {
        label: `Generate migration-docs/v${fromVersion}-v${toVersion}-changes.md`,
        run: async () => {
          await sleep(40);
        },
      },
    ],
    execute: () => Promise.resolve(createDemoStepResult(fromVersion, toVersion)),
  };
}

function createDemoProjectInfo(): ProjectInfo {
  return {
    projectPath: './demo-app',
    angularVersion: 8,
    angularVersionFull: '8.2.14',
    packageManager: 'npm',
    buildCommand: 'ng build demo-app',
    testCommand: 'ng test demo-app --watch=false',
    installedPackages: {
      '@angular/core': '8.2.14',
      '@angular/cli': '8.3.29',
      '@angular/material': '8.2.3',
      '@ngrx/store': '8.6.0',
      rxjs: '6.5.5',
    },
    isMonorepo: false,
    projectName: 'demo-app',
  };
}

function createDemoStepResult(fromVersion: number, toVersion: number): StepResult {
  return {
    fromVersion,
    toVersion,
    success: true,
    changedFiles: [],
    syntaxChanges: [],
    packageChanges: [],
    duration: 0,
  };
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
