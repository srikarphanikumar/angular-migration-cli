import { jest } from '@jest/globals';
import { cleanseAnsi } from 'listr2';
import type { MigrationStep, PackageKey, ProjectInfo, StepResult } from '../src/types.js';
import { buildStepTaskList } from '../src/display/tasks.js';
import { divider, formatDuration, printHeader } from '../src/display/messages.js';

function stripAnsi(value: string): string {
  return cleanseAnsi(value);
}

function makeProjectInfo(): ProjectInfo {
  return {
    projectPath: '/tmp/project',
    angularVersion: 8,
    angularVersionFull: '8.2.14',
    packageManager: 'npm',
    buildCommand: 'ng build app',
    testCommand: 'ng test app --watch=false',
    installedPackages: { '@angular/core': '8.2.14' },
    isMonorepo: false,
    projectName: 'app',
  };
}

describe('display messages', () => {
  it('formats short and minute durations', () => {
    expect(formatDuration(400)).toBe('0s');
    expect(formatDuration(12_300)).toBe('12s');
    expect(formatDuration(72_000)).toBe('1m 12s');
  });

  it('prints a fixed-width divider', () => {
    expect(stripAnsi(divider())).toHaveLength(52);
  });

  it('prints the application header with version and product name', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    printHeader('0.1.0');

    const output = spy.mock.calls.map(([line]) => String(line)).join('\n');
    expect(stripAnsi(output)).toContain('migrate-angular');
    expect(stripAnsi(output)).toContain('v0.1.0');

    spy.mockRestore();
  });
});

describe('display task list', () => {
  it('runs migration step task definitions with selected packages', async () => {
    const calls: PackageKey[][] = [];
    const step: MigrationStep = {
      fromVersion: 8,
      toVersion: 9,
      label: 'v8 -> v9',
      tasks: [
        {
          label: 'Fake task',
          run: (_projectInfo, packages) => {
            calls.push(packages);
            return Promise.resolve();
          },
        },
      ],
      execute: (): Promise<StepResult> => Promise.resolve({
        fromVersion: 8,
        toVersion: 9,
        success: true,
        changedFiles: [],
        syntaxChanges: [],
        packageChanges: [],
        duration: 0,
      }),
    };

    const taskList = buildStepTaskList(step, ['material']);
    await taskList.run({ projectInfo: makeProjectInfo() });

    expect(calls).toEqual([['material']]);
  });
});
