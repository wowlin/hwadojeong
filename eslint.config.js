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
  {
    // 게이트·검사 스크립트와 테스트도 같은 버그성 규칙으로 — 형해화(죽은 참조·미사용) 조기 검출
    files: ['scripts/**/*.mjs', 'test/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },   // 스크립트는 Node + page.evaluate 안 브라우저 코드 혼재
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { args: 'none', ignoreRestSiblings: true }],
      'no-undef': 'error',
    },
  },
];
