import { defineConfig } from 'tsup';

export default defineConfig([
  // CLI binary — gets a shebang, no type declarations needed
  {
    entry: { cli: 'src/cli.ts' },
    format: ['esm'],
    dts: false,
    splitting: false,
    sourcemap: true,
    clean: true,
    target: 'node18',
    outDir: 'dist',
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
  // Public API — no shebang, full type declarations
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    target: 'node18',
    outDir: 'dist',
  },
]);
