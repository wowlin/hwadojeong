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

test('⑤ 안방 평면 말뚝 — 사용자가 맞춘 위치 고정(앞=데크앞+0.1, 뒤=데크앞+깊이−0.1). 위치 변경 금지', () => {
  // 절대 불변식: 사용자가 시간 들여 맞춘 안방 앞/뒤 말뚝 위치를 옮기지 않는다.
  //  · 앞(예전 파랑) Z = deckFootprints[0].z + 0.1
  //  · 뒤(예전 초록) Z = deckFootprints[0].z + deckFootprints[0].d - 0.1
  //  · 가운데 = groundPosts 그대로
  const src = readFileSync(mainJs, 'utf8');
  assert.match(src, /const _abFrontZ = deckFootprints\[0\]\.z \+ 0\.1;/, '안방 앞 말뚝 Z = deckFootprints[0].z + 0.1');
  assert.match(src, /const _abBackZ = deckFootprints\[0\]\.z \+ deckFootprints\[0\]\.d - 0\.1;/, '안방 뒤 말뚝 Z = deckFootprints[0].z + d - 0.1');
  assert.match(src, /anbang: 안방썬룸\.groundPosts\.map\(\(\[px, pz\], i\) => \[px, i === 0 \? _abFrontZ : i === 2 \? _abBackZ : pz\]\)/, '안방 Z = [앞=_abFrontZ, 가운데=원위치, 뒤=_abBackZ]');
  // 위치(PILE_POS)와 색이 분리되어, 색 렌더 줄엔 위치 식이 없어야 함(planPileMark 인자에 deckFootprints/buildingFrontZ 직접 계산 금지).
  assert.doesNotMatch(src, /planPileMark\([^)]*deckFootprints\[0\]\.z[^)]*\)/, '색 렌더 줄에 위치 계산식을 쓰지 말 것(위치는 PILE_POS에서만)');
});

test('⑥ 집 기초(0.5m)와 데크 기초(0.4m)는 모든 뷰에서 색이 다르다', () => {
  // 높이 차(집 0.5m / 데크 0.4m)를 색으로 구분: 바닥 발자국·기초 두부 모두 데크 전용 자재를 써야 한다.
  const src = readFileSync(mainJs, 'utf8');
  assert.match(src, /deckFoundation:\s*new THREE/, '데크 기초 발자국용 자재(deckFoundation)가 정의돼야 함');
  assert.match(src, /deckPileHead:\s*new THREE/, '데크 말뚝 두부용 자재(deckPileHead)가 정의돼야 함');
  // 바닥(평면) 데크 발자국은 deckFoundation, 입체 데크 말뚝은 deckPileHead.
  assert.match(src, /deckFootprints\)\s*\{[\s\S]{0,300}materials\.deckFoundation/, '바닥 데크 발자국은 deckFoundation 색이어야 함');
  assert.match(src, /pileFoundation\([^)]*headMat:\s*materials\.deckPileHead/, '입체 데크 말뚝 두부는 deckPileHead 색이어야 함');
});

test('⑦ 안방 말뚝 — 바닥 마커와 입체 말뚝이 같은 출처(PILE_POS.anbang)를 읽는다(도면 간 어긋남 방지)', () => {
  // 과거 회귀의 근본 원인: 안방 말뚝 위치가 두 곳에 따로 있었다(바닥 마커만 보정, 입체 말뚝은 원좌표).
  // → 위치 정의는 PILE_POS.anbang 한 곳뿐이고, 바닥(planPileMark)·입체(drawGroundPost)가 둘 다 그걸 읽어야 한다.
  const src = readFileSync(mainJs, 'utf8');
  // 바닥 안방 마커: PILE_POS.anbang에서.
  assert.match(src, /PILE_POS\.anbang\.forEach\(\(\[px, pz\]\) => planPileMark\(px, pz, materials\.deckPileHead\)\)/, '바닥 안방 마커는 PILE_POS.anbang에서 읽어야 함');
  // 입체 안방 말뚝·기둥: 같은 PILE_POS.anbang에서(단일 출처).
  assert.match(src, /PILE_POS\.anbang\.forEach\(\(\[px, pz\], i\) => 안방썬룸\.drawGroundPost\(px, pz, i === 0\)\)/, '입체 안방 말뚝/기둥도 같은 PILE_POS.anbang에서 읽어야 함(단일 출처)');
  // 썬룸 내부에서 땅 기둥 말뚝(systemPile)을 옛 방식(foundationLocal 루프)으로 직접 그리면 안 된다 — 좌표 이원화 부활 금지.
  assert.doesNotMatch(src, /captureInto\(foundationLocal[\s\S]{0,120}systemPile\(/, '땅 기둥 말뚝을 PILE_POS 밖에서 직접 그리지 말 것(이원화 회귀)');
});
