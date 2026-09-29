// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  expoConfig,
  // Last, so formatting is Prettier's call and never a lint error.
  prettierConfig,
  {
    // Edge Function entry points run on Deno (npm: imports, Deno globals).
    ignores: [
      'dist/*',
      'android/*',
      'ios/*',
      'coverage/*',
      '.expo/*',
      'drizzle/*',
      'supabase/functions/**/index.ts',
    ],
  },
]);
