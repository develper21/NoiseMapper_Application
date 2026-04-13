/**
 * Minimal ESLint flat config to satisfy ESLint v9+ when running `npm run lint`.
 * Intentionally minimal and plugin-free to avoid adding new devDependencies.
 */
module.exports = {
  languageOptions: {
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
      // Intentionally omit `project` to avoid type-aware linting on tooling files.
    },
  },
  // Ignore common config files that are not part of the TS project
  ignores: ['**/babel.config.js', '**/tailwind.config.js', '**/eslint.config.cjs'],
  rules: {},
};
