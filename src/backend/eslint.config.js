/**
 * ESLint flat config for Mixtape backend (TypeScript, Node.js)
 * See: https://eslint.org/docs/latest/use/configure/configuration-files-new
 */

/**
 * NOTE: Flat config files must use CommonJS (require/module.exports) or .cjs extension for ESLint v9+.
 * This file should be named eslint.config.js and use module.exports, not ES module syntax.
 */

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parser: require('@typescript-eslint/parser'),
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'off',
    },
    ignores: ['node_modules/', 'dist/', '_server-data/', 'tests/streamed/'],
  },
];
