module.exports = [
  {
    files: ['*.ts', 'models/**/*.ts', 'routes/**/*.ts', 'services/**/*.ts', 'utils/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parser: require('@typescript-eslint/parser'),
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'off',
    },
    ignores: ['node_modules/', 'dist/', '_server-data/'],
  },
];
