import type { PackageKey, ProjectInfo } from './types.js';
import { PACKAGE_CATALOG } from './packages/catalog.js';

// Source: .claude/docs/migration-paths.md
export const NODE_REQUIREMENTS: Partial<Record<number, string>> = {
  9: '10.13.0',
  10: '10.13.0',
  11: '10.13.0',
  12: '12.20.0',
  13: '12.20.0',
  14: '14.15.0',
  15: '14.20.0',
  16: '16.14.0',
  17: '18.13.0',
  18: '18.19.0',
  19: '18.19.0',
  20: '20.11.0',
};

export interface PackageOption {
  value: PackageKey;
  label: string;
  hint: string;
}

export interface ParsedPackagesArg {
  selectedPackages: PackageKey[];
  unknownKeys: string[];
}

export function getInstalledPackageOptions(projectInfo: ProjectInfo): PackageOption[] {
  const installedNames = Object.keys(projectInfo.installedPackages);

  return PACKAGE_CATALOG.flatMap((entry) => {
    const detectedPkg = entry.npmPackages.find((p) => installedNames.includes(p));
    if (!detectedPkg) return [];

    return [{
      value: entry.key,
      label: entry.label,
      hint: `installed: ${projectInfo.installedPackages[detectedPkg]}`,
    }];
  });
}

export function parsePackagesArg(packagesArg: string): ParsedPackagesArg {
  const validKeys = new Set(PACKAGE_CATALOG.map((entry) => entry.key));
  const unknownKeys: string[] = [];

  const selectedPackages = packagesArg
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .filter((key) => {
      if (validKeys.has(key as PackageKey)) return true;
      unknownKeys.push(key);
      return false;
    }) as PackageKey[];

  return { selectedPackages, unknownKeys };
}

export function nodeSatisfies(current: string, required: string): boolean {
  const parse = (version: string): [number, number, number] => {
    const parts = version.split('.').map(Number);
    return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
  };
  const [currentMajor, currentMinor, currentPatch] = parse(current);
  const [requiredMajor, requiredMinor, requiredPatch] = parse(required);
  if (currentMajor !== requiredMajor) return currentMajor > requiredMajor;
  if (currentMinor !== requiredMinor) return currentMinor > requiredMinor;
  return currentPatch >= requiredPatch;
}
