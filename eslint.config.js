// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

const nodeGlobals = {
  console: 'readonly',
  process: 'readonly',
  URL: 'readonly',
  Buffer: 'readonly',
  setTimeout: 'readonly',
};

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/out/**',
      '**/test-results/**',
      '**/node_modules/**',
      'vendor/**',
      'playwright-report/**',
      'test-results/**',
      '*.tmp.mjs',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none', varsIgnorePattern: '^_' }],
    },
  },
  {
    // Authoritative rules must stay deterministic: no wall clock, no unseeded randomness.
    files: ['packages/game-core/src/**/*.ts'],
    // game-session may use wall-clock-free browser storage only via injected adapters.
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'Date', message: 'Rules must not read a wall clock.' },
        { name: 'performance', message: 'Rules must not read a wall clock.' },
        { name: 'window', message: 'Rules are DOM-free.' },
        { name: 'document', message: 'Rules are DOM-free.' },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use the runtime random streams.' },
      ],
    },
  },
  {
    files: ['**/*.{js,mjs}', '*.config.ts'],
    languageOptions: { globals: nodeGlobals },
  },
  prettier,
);
