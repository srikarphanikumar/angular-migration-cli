import type { PackageKey } from '../types.js';

// ─── Catalog entry shape ──────────────────────────────────────────────────────

export interface PackageCatalogEntry {
  /** Unique key used throughout the codebase to refer to this package. */
  key: PackageKey;
  /** Display label shown in the wizard multi-select. */
  label: string;
  /**
   * Actual npm package names to look for in the target project's package.json.
   * The first matching one found is used for the installed-version hint.
   */
  npmPackages: string[];
  /** One-line description shown as hint in the wizard. */
  hint: string;
  /** How migration is performed for this package. */
  migrationType: 'ng-update' | 'manual' | 'both';
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

/**
 * Master registry of all ecosystem packages the tool can migrate.
 * Ordered as they should appear in the wizard.
 *
 * To add a new package:
 *   1. Add a PackageKey to types.ts
 *   2. Add an entry here
 *   3. Create src/packages/<key>.ts
 *   4. Wire into src/migrations/vN-to-vM/index.ts
 *   5. Update .claude/docs/package-catalog.md
 */
export const PACKAGE_CATALOG: PackageCatalogEntry[] = [
  {
    key: 'material',
    label: '@angular/material / CDK',
    npmPackages: ['@angular/material', '@angular/cdk'],
    hint: 'ng update schematic (large step at v14→v15 for MDC migration)',
    migrationType: 'ng-update',
  },
  {
    key: 'ngrx',
    label: '@ngrx/store + effects + entity',
    npmPackages: ['@ngrx/store', '@ngrx/effects', '@ngrx/entity', '@ngrx/router-store'],
    hint: 'ng update schematic',
    migrationType: 'ng-update',
  },
  {
    key: 'rxjs',
    label: 'rxjs  (v6 → v7)',
    npmPackages: ['rxjs'],
    hint: 'ng update schematic — applied at the v12→v13 step',
    migrationType: 'ng-update',
  },
  {
    key: 'ag-grid',
    label: 'ag-grid-angular',
    npmPackages: ['ag-grid-angular', 'ag-grid-community', 'ag-grid-enterprise'],
    hint: 'manual — version bump + migration notes written to migration-docs/',
    migrationType: 'manual',
  },
  {
    key: 'fire',
    label: '@angular/fire',
    npmPackages: ['@angular/fire'],
    hint: 'ng update schematic',
    migrationType: 'ng-update',
  },
  {
    key: 'ng-bootstrap',
    label: '@ng-bootstrap/ng-bootstrap',
    npmPackages: ['@ng-bootstrap/ng-bootstrap'],
    hint: 'manual — version bump + migration notes written to migration-docs/',
    migrationType: 'manual',
  },
  {
    key: 'primeng',
    label: 'primeng',
    npmPackages: ['primeng'],
    hint: 'manual — version bump + migration notes written to migration-docs/',
    migrationType: 'manual',
  },
];

/**
 * Returns the catalog entry for a given key.
 * Returns undefined if the key is not registered (defensive utility).
 */
export function getCatalogEntry(key: PackageKey): PackageCatalogEntry | undefined {
  return PACKAGE_CATALOG.find((e) => e.key === key);
}
