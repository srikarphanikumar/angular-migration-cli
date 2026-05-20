import type { ProjectInfo, WizardResult } from './types.js';
import { getMigrationSteps } from './migrations/registry.js';
import { buildStepTaskList } from './display/tasks.js';
import { OverallProgress } from './display/progress.js';
import {
  printError,
  printFinalSummary,
  printStepBanner,
  printStepSummary,
} from './display/messages.js';
import { runBuild, runTests } from './verifier.js';
import { writeStepDoc } from './doc-generator.js';

export interface RunnerOptions {
  skipBuild?: boolean;
  skipTests?: boolean;
  toolVersion: string;
}

export async function runMigration(
  projectInfo: ProjectInfo,
  wizardResult: WizardResult,
  options: RunnerOptions,
): Promise<void> {
  const steps = getMigrationSteps(wizardResult.fromVersion, wizardResult.toVersion);
  const progress = new OverallProgress();
  const startedAt = Date.now();
  const docs: string[] = [];

  progress.start(steps.length);

  for (const [index, step] of steps.entries()) {
    const stepStartedAt = Date.now();
    printStepBanner(index + 1, steps.length, step.fromVersion, step.toVersion);

    const taskList = buildStepTaskList(step, wizardResult.selectedPackages);
    await taskList.run({ projectInfo });

    const stepResult = await step.execute(projectInfo, wizardResult.selectedPackages);
    stepResult.duration = Date.now() - stepStartedAt;

    const buildResult = options.skipBuild ? undefined : await runBuild(projectInfo);
    if (buildResult && !buildResult.passed) {
      const docPath = await writeStepDoc({
        projectPath: projectInfo.projectPath,
        stepResult: { ...stepResult, success: false },
        buildResult,
        toolVersion: options.toolVersion,
        targetVersion: wizardResult.toVersion,
        failureStage: 'build',
      });
      printError({
        fromVersion: step.fromVersion,
        toVersion: step.toVersion,
        stage: 'build',
        errors: buildResult.output.trim().split('\n').filter(Boolean).slice(0, 10),
        docPath,
        projectPath: projectInfo.projectPath,
        targetVersion: wizardResult.toVersion,
      });
      return;
    }

    const testResult = options.skipTests ? undefined : await runTests(projectInfo);
    if (testResult && !testResult.passed) {
      const docPath = await writeStepDoc({
        projectPath: projectInfo.projectPath,
        stepResult: { ...stepResult, success: false },
        buildResult,
        testResult,
        toolVersion: options.toolVersion,
        targetVersion: wizardResult.toVersion,
        failureStage: 'test',
      });
      printError({
        fromVersion: step.fromVersion,
        toVersion: step.toVersion,
        stage: 'test',
        errors: testResult.output.trim().split('\n').filter(Boolean).slice(0, 10),
        docPath,
        projectPath: projectInfo.projectPath,
        targetVersion: wizardResult.toVersion,
      });
      return;
    }

    const docPath = await writeStepDoc({
      projectPath: projectInfo.projectPath,
      stepResult,
      buildResult,
      testResult,
      toolVersion: options.toolVersion,
      targetVersion: wizardResult.toVersion,
    });
    const docName = `v${step.fromVersion}-v${step.toVersion}-changes.md`;
    docs.push(docName);

    printStepSummary({
      fromVersion: step.fromVersion,
      toVersion: step.toVersion,
      durationMs: stepResult.duration,
      docPath,
    });
    progress.advance(1, steps.length);
  }

  progress.stop();
  printFinalSummary({
    fromVersion: wizardResult.fromVersion,
    toVersion: wizardResult.toVersion,
    steps: steps.length,
    durationMs: Date.now() - startedAt,
    buildPassed: true,
    testsPassed: true,
    testSummary: buildTestSummary(options.skipTests),
    docsDir: `${projectInfo.projectPath}/migration-docs/`,
    docs,
  });
}

function buildTestSummary(skipTests: boolean | undefined): string {
  return skipTests ? 'skipped' : 'passed';
}
