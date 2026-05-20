import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getStepDocPath, writeStepDoc } from '../src/doc-generator.js';
import type { StepResult, VerifyResult } from '../src/types.js';

function makeStepResult(): StepResult {
  return {
    fromVersion: 8,
    toVersion: 9,
    success: true,
    changedFiles: ['src/app/app.component.ts'],
    syntaxChanges: [
      {
        description: '`TestBed.get()` → `TestBed.inject()`',
        occurrences: 2,
        files: ['src/app/app.component.spec.ts'],
      },
    ],
    packageChanges: [
      {
        name: '@angular/core',
        from: '8.x',
        to: '9.x',
      },
    ],
    duration: 1200,
  };
}

function makeVerifyResult(passed: boolean): VerifyResult {
  return {
    passed,
    errorCount: passed ? 0 : 1,
    warningCount: 0,
    output: passed ? 'ok' : 'error: failed',
    duration: 500,
  };
}

describe('doc generator', () => {
  it('writes a successful step doc', async () => {
    const projectPath = mkdtempSync(join(tmpdir(), 'migrate-angular-doc-'));
    const docPath = await writeStepDoc({
      projectPath,
      stepResult: makeStepResult(),
      buildResult: makeVerifyResult(true),
      testResult: makeVerifyResult(true),
      toolVersion: '0.1.0',
      targetVersion: 20,
    });

    expect(docPath).toBe(getStepDocPath(projectPath, 8, 9));
    expect(existsSync(docPath)).toBe(true);

    const contents = readFileSync(docPath, 'utf-8');
    expect(contents).toContain('# Migration: v8 → v9');
    expect(contents).toContain('**Status:** ✅ Success');
    expect(contents).toContain('| @angular/core | 8.x | 9.x |');
    expect(contents).toContain('src/app/app.component.ts');
  });

  it('marks failed docs incomplete', async () => {
    const projectPath = mkdtempSync(join(tmpdir(), 'migrate-angular-doc-fail-'));
    const docPath = await writeStepDoc({
      projectPath,
      stepResult: { ...makeStepResult(), success: false },
      buildResult: makeVerifyResult(false),
      toolVersion: '0.1.0',
      targetVersion: 20,
      failureStage: 'build',
    });

    const contents = readFileSync(docPath, 'utf-8');
    expect(contents).toContain('INCOMPLETE');
    expect(contents).toContain('error: failed');
  });
});

