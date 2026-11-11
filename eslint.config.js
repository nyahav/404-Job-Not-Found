import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['dist/**', '.astro/**', 'node_modules/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs['flat/recommended'],
  {
    files: ['src/**/*.{astro,js,jsx,ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['*.config.{js,mjs,cjs}'],
    languageOptions: {
      globals: globals.node,
    },
  },
];
