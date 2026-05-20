import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Base recommended rules
  eslint.configs.recommended,

  // TypeScript strict rules applied to src + tests
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.test.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Allow underscore-prefixed unused vars (conventional ignore pattern)
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Explicit return types help with public API clarity
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
      // Allow void-returning async functions (common in CLI code)
      '@typescript-eslint/no-floating-promises': 'error',
      // Prefer template literals over string concatenation
      'prefer-template': 'error',
      // Allow numbers in template literals — `v${version}` is idiomatic and safe
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },

  // Ignore built output and config files
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.ts', '*.config.js'],
  },
);
