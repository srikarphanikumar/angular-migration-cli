import type { ProjectInfo, VerifyResult } from './types.js';

export interface CommandResult {
  exitCode: number;
  output: string;
}

export type CommandRunner = (command: string, cwd: string) => Promise<CommandResult>;

export async function runBuild(
  projectInfo: ProjectInfo,
  commandRunner: CommandRunner = runShellCommand,
): Promise<VerifyResult> {
  return runVerificationCommand(projectInfo.buildCommand, projectInfo.projectPath, commandRunner);
}

export async function runTests(
  projectInfo: ProjectInfo,
  commandRunner: CommandRunner = runShellCommand,
): Promise<VerifyResult> {
  return runVerificationCommand(projectInfo.testCommand, projectInfo.projectPath, commandRunner);
}

async function runVerificationCommand(
  command: string,
  cwd: string,
  commandRunner: CommandRunner,
): Promise<VerifyResult> {
  const startedAt = Date.now();

  try {
    const result = await commandRunner(command, cwd);
    const output = result.output;

    return {
      passed: result.exitCode === 0,
      errorCount: result.exitCode === 0 ? 0 : countMatches(output, /error/gi),
      warningCount: countMatches(output, /warning/gi),
      output,
      duration: Date.now() - startedAt,
    };
  } catch (error) {
    const output = error instanceof Error ? error.message : String(error);
    return {
      passed: false,
      errorCount: 1,
      warningCount: 0,
      output,
      duration: Date.now() - startedAt,
    };
  }
}

function countMatches(value: string, pattern: RegExp): number {
  return value.match(pattern)?.length ?? 0;
}

async function runShellCommand(command: string, cwd: string): Promise<CommandResult> {
  const { execaCommand } = await import('execa');
  const result = await execaCommand(command, {
    cwd,
    all: true,
    reject: false,
  });

  return {
    exitCode: result.exitCode ?? 1,
    output: result.all,
  };
}
