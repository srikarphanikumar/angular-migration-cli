import boxen from 'boxen';
import { theme, symbols } from './theme.js';

const DIVIDER_LENGTH = 52;

export interface StepSummaryOptions {
  fromVersion: number;
  toVersion: number;
  durationMs: number;
  docPath: string;
}

export interface FinalSummaryOptions {
  fromVersion: number;
  toVersion: number;
  steps: number;
  durationMs: number;
  buildPassed: boolean;
  testsPassed: boolean;
  testSummary: string;
  docsDir: string;
  docs: string[];
}

export interface ErrorSummaryOptions {
  fromVersion: number;
  toVersion: number;
  stage: 'build' | 'test' | 'migration';
  errors: string[];
  docPath: string;
  projectPath: string;
  targetVersion: number;
}

export function divider(): string {
  return theme.primary('━'.repeat(DIVIDER_LENGTH));
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

export function printHeader(version: string): void {
  const body = [
    '',
    `  ${theme.primary('migrate-angular')}  ${theme.muted(`v${version}`)}`,
    `  ${theme.info('Angular Incremental Migration Tool')}`,
    '',
    `  ${theme.info('Migrate Angular projects from v8 to v20')}`,
    `  ${theme.info('step-by-step, with docs at every stage.')}`,
    '',
  ].join('\n');

  console.log(boxen(body, {
    borderColor: 'cyan',
    padding: 1,
    margin: 0,
  }));
}

export function printStepBanner(stepNumber: number, totalSteps: number, fromVersion: number, toVersion: number): void {
  console.log(`\n${divider()}\n`);
  console.log(
    `  ${theme.muted(`Step ${stepNumber} / ${totalSteps}`)}  -  ${theme.primary(`Migrating v${fromVersion} → v${toVersion}`)}`,
  );
}

export function printStepSummary(options: StepSummaryOptions): void {
  console.log(
    `\n  ${symbols.success} v${options.fromVersion} → v${options.toVersion} complete  ${theme.muted(`(${formatDuration(options.durationMs)})`)}`,
  );
  console.log(`     See ${theme.highlight(options.docPath)}`);
}

export function printFinalSummary(options: FinalSummaryOptions): void {
  console.log(`\n${divider()}\n`);
  console.log(`  ${theme.successBold('Migration complete!')}`);
  console.log('');
  console.log(
    `  v${options.fromVersion} → v${options.toVersion}   ·   ${options.steps} steps   ·   ${formatDuration(options.durationMs)}`,
  );
  console.log('');
  console.log(
    `  Build:  ${options.buildPassed ? symbols.success : symbols.error} ${options.buildPassed ? 'passing' : 'failed'}`,
  );
  console.log(
    `  Tests:  ${options.testsPassed ? symbols.success : symbols.error} ${options.testSummary}`,
  );
  console.log(`\n  Migration docs generated in ${theme.highlight(options.docsDir)}\n`);
  for (const doc of options.docs) {
    console.log(`  ${symbols.doc} ${doc}`);
  }
  console.log(`\n${divider()}`);
}

export function printError(options: ErrorSummaryOptions): void {
  const errorCount = options.errors.length;

  console.log(`\n${divider()}\n`);
  console.log(
    `  ${symbols.error} ${capitalize(options.stage)} failed at step ${theme.primary(`v${options.fromVersion} → v${options.toVersion}`)}`,
  );
  console.log('\n  Compiler errors:');
  console.log(`  ${theme.muted('─'.repeat(16))}`);

  for (const error of options.errors) {
    console.log(`  ${theme.error(error)}`);
  }

  console.log(`\n  ${theme.muted('─'.repeat(16))}`);
  console.log(`  ${errorCount} error(s) found.`);
  console.log('\n  An incomplete migration doc has been written:');
  console.log(`  -> ${theme.highlight(options.docPath)}  ${theme.warning('(marked INCOMPLETE)')}`);
  console.log('\n  To resume after fixing the errors:');
  console.log(
    `  -> npx migrate-angular ${options.projectPath} --from=${options.fromVersion} ` +
      `--to=${options.targetVersion} --apply`,
  );
  console.log('\n  Official migration guide:');
  console.log(
    `  -> https://update.angular.io/?l=2&f=${options.fromVersion}&t=${options.toVersion}`,
  );
  console.log(`\n${divider()}`);
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
