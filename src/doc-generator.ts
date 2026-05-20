import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { StepResult, VerifyResult } from './types.js';
import { formatDuration } from './display/messages.js';

export interface WriteStepDocOptions {
  projectPath: string;
  stepResult: StepResult;
  buildResult?: VerifyResult;
  testResult?: VerifyResult;
  toolVersion: string;
  targetVersion: number;
  failureStage?: 'build' | 'test' | 'migration';
}

export function getStepDocPath(projectPath: string, fromVersion: number, toVersion: number): string {
  return join(projectPath, 'migration-docs', `v${fromVersion}-v${toVersion}-changes.md`);
}

export async function writeStepDoc(options: WriteStepDocOptions): Promise<string> {
  const docsDir = join(options.projectPath, 'migration-docs');
  mkdirSync(docsDir, { recursive: true });

  const docPath = getStepDocPath(
    options.projectPath,
    options.stepResult.fromVersion,
    options.stepResult.toVersion,
  );
  const changedFiles = options.stepResult.changedFiles.length > 0
    ? options.stepResult.changedFiles
    : await readChangedFiles(options.projectPath);

  writeFileSync(docPath, renderStepDoc({
    ...options,
    changedFiles,
  }));

  return docPath;
}

interface RenderStepDocOptions extends WriteStepDocOptions {
  changedFiles: string[];
}

function renderStepDoc(options: RenderStepDocOptions): string {
  const { stepResult } = options;
  const incomplete = options.failureStage !== undefined || !stepResult.success;
  const status = incomplete
    ? `⚠️ INCOMPLETE — stopped at ${options.failureStage ?? 'migration'} verification`
    : '✅ Success';

  return [
    `# Migration: v${stepResult.fromVersion} → v${stepResult.toVersion}`,
    '',
    `**Status:** ${status}  `,
    `**Date:** ${new Date().toISOString().slice(0, 10)}  `,
    `**Duration:** ${formatDuration(stepResult.duration)}  `,
    `**Tool:** migrate-angular v${options.toolVersion}`,
    '',
    ...(incomplete ? renderIncompleteNotice(options) : []),
    '---',
    '',
    '## Packages Updated',
    '',
    ...renderPackageChanges(stepResult),
    '',
    '---',
    '',
    `## Files Changed (${options.changedFiles.length} files)`,
    '',
    ...renderFilesChanged(options.changedFiles),
    '',
    '---',
    '',
    '## Syntax Changes Applied',
    '',
    ...renderSyntaxChanges(stepResult),
    '',
    '---',
    '',
    '## Build Verification',
    '',
    ...renderVerification(options.buildResult),
    '',
    '---',
    '',
    '## Test Verification',
    '',
    ...renderVerification(options.testResult),
    '',
    ...renderFailureOutput(options),
    '---',
    '',
    '## Reference',
    '',
    `- [Official Angular ${stepResult.fromVersion}→${stepResult.toVersion} Migration Guide](https://update.angular.io/?l=2&f=${stepResult.fromVersion}&t=${stepResult.toVersion})`,
    '',
  ].join('\n');
}

function renderIncompleteNotice(options: RenderStepDocOptions): string[] {
  return [
    '',
    '> This migration step did not complete. Fix the errors below and re-run:',
    '> ```',
    `> npx migrate-angular ${options.projectPath} --from=${options.stepResult.fromVersion} --to=${options.targetVersion} --apply`,
    '> ```',
    '',
  ];
}

function renderPackageChanges(stepResult: StepResult): string[] {
  if (stepResult.packageChanges.length === 0) {
    return ['_(No package changes recorded for this stub step)_'];
  }

  return [
    '| Package | Before | After |',
    '|---|---|---|',
    ...stepResult.packageChanges.map((change) => (
      `| ${change.name} | ${change.from} | ${change.to} |`
    )),
  ];
}

function renderFilesChanged(files: string[]): string[] {
  if (files.length === 0) return ['_(No files changed)_'];
  return files.map((file) => `- \`${file}\` — changed during migration step`);
}

function renderSyntaxChanges(stepResult: StepResult): string[] {
  if (stepResult.syntaxChanges.length === 0) {
    return ['_(No syntax changes recorded)_'];
  }

  return [
    '| Pattern | Occurrences | Files |',
    '|---|---:|---:|',
    ...stepResult.syntaxChanges.map((change) => (
      `| ${change.description} | ${change.occurrences} | ${change.files.length} |`
    )),
  ];
}

function renderVerification(result: VerifyResult | undefined): string[] {
  if (!result) return ['**Status:** Skipped'];

  return [
    `**Status:** ${result.passed ? '✅ Passed' : '❌ Failed'}  `,
    `**Errors:** ${result.errorCount}  `,
    `**Warnings:** ${result.warningCount}  `,
    `**Duration:** ${formatDuration(result.duration)}`,
  ];
}

function renderFailureOutput(options: RenderStepDocOptions): string[] {
  const failedResult = options.failureStage === 'build'
    ? options.buildResult
    : options.testResult;
  if (!failedResult || failedResult.passed) return [];

  return [
    '---',
    '',
    `## ❌ ${options.failureStage === 'test' ? 'Test' : 'Build'} Errors`,
    '',
    '```',
    failedResult.output.trim(),
    '```',
    '',
  ];
}

async function readChangedFiles(projectPath: string): Promise<string[]> {
  try {
    const { execa } = await import('execa');
    const { stdout } = await execa('git', ['diff', '--name-only'], {
      cwd: projectPath,
      reject: false,
    });
    return stdout.split('\n').map((file) => file.trim()).filter(Boolean);
  } catch {
    return [];
  }
}
