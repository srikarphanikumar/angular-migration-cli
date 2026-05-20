import { runBuild, runTests, type CommandRunner } from '../src/verifier.js';
import type { ProjectInfo } from '../src/types.js';

function makeProjectInfo(command: string): ProjectInfo {
  return {
    projectPath: '/tmp/project',
    angularVersion: 8,
    angularVersionFull: '8.2.14',
    packageManager: 'npm',
    buildCommand: command,
    testCommand: command,
    installedPackages: { '@angular/core': '8.2.14' },
    isMonorepo: false,
    projectName: 'app',
  };
}

describe('verifier', () => {
  it('returns passed build result when command exits zero', async () => {
    const runner: CommandRunner = () => Promise.resolve({ exitCode: 0, output: 'ok' });
    const result = await runBuild(makeProjectInfo('npm run build'), runner);

    expect(result.passed).toBe(true);
    expect(result.errorCount).toBe(0);
    expect(result.output).toContain('ok');
  });

  it('returns failed test result when command exits non-zero', async () => {
    const runner: CommandRunner = () => Promise.resolve({ exitCode: 1, output: 'error: nope' });
    const result = await runTests(makeProjectInfo('npm test'), runner);

    expect(result.passed).toBe(false);
    expect(result.errorCount).toBeGreaterThanOrEqual(1);
    expect(result.output).toContain('nope');
  });
});
