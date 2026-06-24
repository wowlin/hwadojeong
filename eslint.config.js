// 최소 구성 — 버그성 규칙만. 스타일 규칙은 끔(거대 단일 파일 재포맷 방지).
import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    rules: {
      ...js.configs.recommended.rules,
      // 버그성만 남기고 스타일/취향 규칙은 끔
      'no-unused-vars': ['error', { args: 'none', ignoreRestSiblings: true }],
      'no-undef': 'error',
    },
  },
];
