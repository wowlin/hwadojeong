// 화도정 3D 회귀 하네스 — Node 내장 테스트 러너(node --test).
// 잡는 것: ① 문법 ② 빌드/임포트 무결성 ③ 썬룸 용어 ④ 레이아웃 기하 감사(audit-layout.mjs).
// 못 잡는 것: 실행시 WebGL 런타임 오류·말뚝 정렬 같은 시각 결과 → `npm run shot`으로 렌더해 눈으로 확인.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mainJs = resolve(root, 'src/main.js');

test('① src/main.js 문법 오류 없음 (node --check)', () => {
  execFileSync('node', ['--check', mainJs], { stdio: 'pipe' });
});

test('② vite build 성공 — 전체 모듈 그래프/임포트 무결성', { timeout: 120000 }, () => {
  execSync('npm run build', { cwd: root, stdio: 'pipe' });
});

test('③ 썬룸 용어 규칙 — pergola/canopy/porch 잔존 0건', () => {
  const src = readFileSync(mainJs, 'utf8');
  const hits = [...new Set([...src.matchAll(/pergola|canopy|porch/gi)].map((m) => m[0]))];
  assert.equal(hits.length, 0, `금지 용어 발견: ${hits.join(', ')} — 전부 "썬룸"으로 바꿀 것`);
});

test('④ 레이아웃 기하 감사 (audit-layout.mjs) — 치수·정렬 회귀 0건', () => {
  // 실패 시 audit-layout.mjs가 process.exit(1) → execFileSync가 throw.
  execFileSync('node', [resolve(root, 'scripts/audit-layout.mjs')], { stdio: 'pipe' });
});
