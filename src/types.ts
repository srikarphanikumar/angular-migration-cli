/**
 * Shared TypeScript interfaces used across all modules.
 * No imports from other src/ files — this is the root of the dependency graph.
 */

// ─── Primitive types ─────────────────────────────────────────────────────────

/** Ecosystem package keys shown in the wizard and used throughout the step chain. */
export type PackageKey =
  | 'material'
  | 'ngrx'
  | 'rxjs'
  | 'ag-grid'
  | 'fire'
  | 'ng-bootstrap'
  | 'primeng';

/** Package manager detected from lockfiles in the target project. */
export type PackageManager = 'npm' | 'yarn' | 'pnpm';

// ─── Detection ───────────────────────────────────────────────────────────────

/**
 * What detector.ts returns after reading the target Angular project.
 * Represents the project's current state — immutable after detection.
 */
export interface ProjectInfo {
  /** Absolute resolved path to the project root. */
  projectPath: string;
  /** Angular major version only (e.g. 8). Derived from @angular/core. */
  angularVersion: number;
  /** Full Angular version string (e.g. "8.2.14"). */
  angularVersionFull: string;
  /** Package manager inferred from lockfile presence. */
  packageManager: PackageManager;
  /** Build command derived from angular.json, e.g. "ng build my-app". */
  buildCommand: string;
  /** Test command derived from angular.json, e.g. "ng test my-app --watch=false". */
  testCommand: string;
  /** All dependencies merged from package.json dependencies + devDependencies. */
  installedPackages: Record<string, string>;
  /** True when angular.json defines more than one project. v1 migrates the first project only. */
  isMonorepo: boolean;
  /** Primary project name from angular.json defaultProject or first project key. */
  projectName: string;
}

// ─── Wizard ───────────────────────────────────────────────────────────────────

/**
 * What wizard.ts returns after the user completes the interactive prompts.
 */
export interface WizardResult {
  /** Packages the user selected in the multi-select prompt. */
  selectedPackages: PackageKey[];
  /** True if the user confirmed the plan (or --packages flag was used to bypass). */
  confirmed: boolean;
  /** Starting Angular major version for this migration run. */
  fromVersion: number;
  /** Target Angular major version. */
  toVersion: number;
}

// ─── Migration steps ─────────────────────────────────────────────────────────

/**
 * A shell command descriptor returned by package modules.
 * Executed by runner.ts — never executed inside package modules directly.
 */
export interface ShellCommand {
  cmd: string;
  args: string[];
  /** Human-readable label for the Listr2 task entry. */
  label: string;
}

/** A single ts-morph syntax transform applied during a migration step. */
export interface SyntaxChange {
  /** Short description of the change, e.g. "TestBed.get() → TestBed.inject()". */
  description: string;
  /** Total number of occurrences replaced across all files. */
  occurrences: number;
  /** Relative file paths that were modified. */
  files: string[];
}

/** A package that was updated during a migration step. */
export interface PackageChange {
  name: string;
  from: string;
  to: string;
}

/**
 * What a migration step returns after execution.
 * Consumed by verifier.ts and doc-generator.ts.
 */
export interface StepResult {
  fromVersion: number;
  toVersion: number;
  success: boolean;
  /** Relative paths of all files changed by ng update + codemods. */
  changedFiles: string[];
  syntaxChanges: SyntaxChange[];
  packageChanges: PackageChange[];
  /** Compiler/test error output, populated when success is false. */
  errors?: string[];
  /** Step wall-clock duration in milliseconds. */
  duration: number;
}

/**
 * What verifier.ts returns after running the project's build or test command.
 */
export interface VerifyResult {
  passed: boolean;
  errorCount: number;
  warningCount: number;
  /** Raw stdout + stderr captured from the command. */
  output: string;
  /** Verification wall-clock duration in milliseconds. */
  duration: number;
}

/**
 * A single task entry shown in the Listr2 task list for a migration step.
 * Defined by each migration step, consumed by display/tasks.ts.
 */
export interface TaskDefinition {
  label: string;
  run: (projectInfo: ProjectInfo, packages: PackageKey[]) => Promise<void>;
}

/**
 * A complete migration step from one Angular major version to the next.
 * Implemented per-step in src/migrations/vN-to-vM/index.ts.
 */
export interface MigrationStep {
  fromVersion: number;
  toVersion: number;
  /** Display label, e.g. "v8 → v9". */
  label: string;
  /** Task list shown in the terminal via Listr2. */
  tasks: TaskDefinition[];
  execute(projectInfo: ProjectInfo, packages: PackageKey[]): Promise<StepResult>;
}
