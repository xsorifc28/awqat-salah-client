import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylisticJs from '@stylistic/eslint-plugin-js';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.config.js',
      '*.config.ts'
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      '@stylistic/js': stylisticJs,
    },
    languageOptions: {
      parserOptions: {
        sourceType: 'module',
      },
    },
    rules: {
      'object-curly-spacing': ['error', 'always'],
      '@stylistic/js/indent': ['error', 2],
    },
  }
);
