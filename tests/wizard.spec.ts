import type { ProjectInfo } from '../src/types.js';
import {
  getInstalledPackageOptions,
  nodeSatisfies,
  parsePackagesArg,
} from '../src/wizard-utils.js';

function makeProjectInfo(installedPackages: Record<string, string>): ProjectInfo {
  return {
    projectPath: '/tmp/project',
    angularVersion: 8,
    angularVersionFull: '8.2.14',
    packageManager: 'npm',
    buildCommand: 'ng build app',
    testCommand: 'ng test app --watch=false',
    installedPackages,
    isMonorepo: false,
    projectName: 'app',
  };
}

describe('wizard package selection helpers', () => {
  it('returns only supported packages installed in the target project', () => {
    const options = getInstalledPackageOptions(
      makeProjectInfo({
        '@angular/core': '8.2.14',
        '@angular/material': '8.2.3',
        '@ngrx/store': '8.6.0',
        lodash: '4.17.21',
      }),
    );

    expect(options.map((option) => option.value)).toEqual(['material', 'ngrx']);
    expect(options.every((option) => option.hint.startsWith('installed: '))).toBe(true);
  });

  it('includes rxjs when it is installed', () => {
    const options = getInstalledPackageOptions(
      makeProjectInfo({
        '@angular/core': '14.3.0',
        rxjs: '7.5.0',
      }),
    );

    expect(options.map((option) => option.value)).toEqual(['rxjs']);
  });

  it('returns an empty list when no supported ecosystem packages are installed', () => {
    const options = getInstalledPackageOptions(
      makeProjectInfo({
        '@angular/core': '14.3.0',
        lodash: '4.17.21',
      }),
    );

    expect(options).toEqual([]);
  });

  it('parses known package keys and ignores unknown keys', () => {
    expect(parsePackagesArg('material, unknown, ngrx')).toEqual({
      selectedPackages: ['material', 'ngrx'],
      unknownKeys: ['unknown'],
    });
  });
});

describe('wizard Node version helper', () => {
  it('accepts versions equal to or above the required version', () => {
    expect(nodeSatisfies('20.11.0', '20.11.0')).toBe(true);
    expect(nodeSatisfies('20.12.0', '20.11.0')).toBe(true);
    expect(nodeSatisfies('21.0.0', '20.11.0')).toBe(true);
  });

  it('rejects versions below the required version', () => {
    expect(nodeSatisfies('20.10.9', '20.11.0')).toBe(false);
    expect(nodeSatisfies('18.19.0', '20.11.0')).toBe(false);
  });
});
