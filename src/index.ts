/**
 * migrate-angular — Public API
 *
 * Re-exports the types and key functions that are useful when using
 * migrate-angular programmatically. Migration logic is added here as each
 * phase is built.
 */

// Version
export const VERSION = '0.1.0';

// Shared types — useful for consumers building tooling on top of migrate-angular
export type {
  PackageKey,
  PackageManager,
  ProjectInfo,
  WizardResult,
  MigrationStep,
  StepResult,
  VerifyResult,
  SyntaxChange,
  PackageChange,
  ShellCommand,
  TaskDefinition,
} from './types.js';

// Detection
export { detectProject, DetectionError } from './detector.js';

// Package catalog
export { PACKAGE_CATALOG, getCatalogEntry } from './packages/catalog.js';
export type { PackageCatalogEntry } from './packages/catalog.js';
