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
  const mat = readFileSync(resolve(root, 'src/materials.js'), 'utf8');   // 재질 정의는 materials.js로 분리됨
  assert.match(mat, /deckFoundation:\s*new THREE/, '데크 기초 발자국용 자재(deckFoundation)가 정의돼야 함');
  assert.match(mat, /deckPileHead:\s*new THREE/, '데크 말뚝 두부용 자재(deckPileHead)가 정의돼야 함');
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

test('⑧ 집·데크 발자국 — 단일 출처(footprintObjects), 모든 화면 동일 표시', () => {
  // 발자국은 한 곳(footprintObjects)에만 정의하고 모든 화면에 표시 → 바닥에서 바꾸면 전 화면 반영.
  const src = readFileSync(mainJs, 'utf8');
  assert.match(src, /footprintObjects\.push\(box\(\{ x: 0, z: buildingFrontZ, w: buildingW, d: buildingD,[\s\S]{0,120}materials\.foundation/, '집 발자국은 footprintObjects에 정의');
  assert.match(src, /footprintObjects\.push\(box\(\{ x: f\.x, z: f\.z,[\s\S]{0,120}materials\.deckFoundation/, '데크 발자국은 footprintObjects에 정의');
  assert.match(src, /for \(const item of footprintObjects\) item\.visible = true;/, '발자국은 모든 화면에 항상 표시(단일 출처)');
  // 발자국 색(집·데크 기초재)을 planObjects에 다시 그리지 말 것 — 그러면 바닥 전용으로 이원화됨.
  assert.doesNotMatch(src, /planObjects\.push\([^)]*materials\.(foundation|deckFoundation)/, '발자국을 planObjects(바닥 전용)에 중복 정의 금지');
});

test('⑨ 치수선은 헬퍼 안에서만 — 인라인 치수선 금지(라벨·선 한 세트 강제)', () => {
  // 모든 치수선 box(mat: materials.dimension)는 3가지 표준 치수 함수(planXDim/planYDim/planZDim) 안에서만 그린다.
  //   현재 = 3 + 3 + 3 = 9개. 헬퍼 밖에서 직접 그리면 라벨과 분리(라벨만 지워도 선이 남음)되므로 금지.
  //   ※ 헬퍼 내부 box 수를 의도적으로 바꿨다면 이 숫자도 함께 갱신할 것.
  const src = readFileSync(mainJs, 'utf8');
  const n = (src.match(/mat: materials\.dimension/g) || []).length;
  assert.equal(n, 9, `치수선 box는 헬퍼 안 9개만이어야 함 — 현재 ${n}개. 헬퍼 밖 인라인 치수선이 생기면 라벨과 분리됨(라벨+선 한 세트 위반)`);
});

test('⑩ 집 바닥틀 둘레 — 데크처럼 기초 footprint 끝까지(0~buildingW / 앞~뒤). 벽 중심선 안쪽으로 들이지 말 것', () => {
  // 집 골조 둘레 림장선은 floorFrame()로 footprint 전체(0, buildingFrontZ, buildingW, buildingD)에 두른다.
  //   벽 중심선(frLeftX 등) 좌표로 외곽을 깔면 슬래브 끝보다 안쪽으로 들어가 데크와 어긋남(사용자: "데크처럼").
  const src = readFileSync(mainJs, 'utf8');
  assert.match(src, /floorFrame\(0, buildingFrontZ, buildingW, buildingD, foundationTopY, materials\.houseFloorFrame/, '집 골조 둘레는 footprint 끝까지(floorFrame에 0·buildingW·앞뒤 Z 전달)');
});

test('⑪ 레이어 패널 — 부품별 독립 토글(완전 독립, 누적 없음) + 배치도/전체모델 프리셋', () => {
  // 사용자 지시(레이아웃 재설계): 좌측 메뉴 = 부품 체크박스, 우측 = 렌더.
  //   · 각 부품은 view[key] boolean으로 완전 독립 표시(누적·단계 없음). PARTS 테이블이 [객체배열↔상태]를 일괄 구동.
  //   · 배치도(부감)는 여러 부품을 한 번에 끄는 프리셋 뷰(showPlan). '전체 모델' 프리셋은 제거됨.
  //   회귀 금지: 옛 누적 단계(STAGE_BUTTONS·effBuilding·atLeast·blankStage)로 되돌리지 말 것.
  const src = readFileSync(mainJs, 'utf8');
  // (1) 부품 상태는 view 객체의 독립 boolean — 핵심 부품 키 존재
  assert.match(src, /const view = \{/, '부품 상태는 단일 view 객체');
  for (const k of ['foundation', 'floorFrame', 'firstFloorFinish', 'stair', 'livingWall', 'familyWall', 'extWall', 'roof', 'deck', 'deckFloor', 'deckStairFrame', 'sun']) {
    assert.match(src, new RegExp(`\\b${k}:`), `view에 부품 키 ${k} 존재`);
  }
  // (2) PARTS 테이블이 부품→객체배열을 매핑하고, 가시성은 그 테이블로 일괄(독립)
  assert.match(src, /const PARTS = \[/, '부품→객체배열 매핑 PARTS 테이블');
  assert.match(src, /for \(const p of PARTS\)[\s\S]*?const on = !isPlan && !!view\[p\.key\];/, '각 부품은 view[key]로 독립 표시(배치도일 땐 숨김)');
  // (3) 안방 내력벽·거실측 벽은 분리된 별도 배열(부품별 토글 대상)
  assert.match(src, /key: 'familyWall', arrays: \[familyInnerWallObjects\]/, '안방 내력벽은 familyInnerWallObjects 단독 부품');
  assert.match(src, /key: 'livingWall', arrays: \[livingInnerWallObjects\]/, '거실측 벽은 livingInnerWallObjects 단독 부품');
  // (4) 프리셋 뷰 — 배치도(전부 끄고 plan만). '전체 모델' 버튼·showAll은 제거됨.
  assert.match(src, /function showPlan\(\)/, '배치도 프리셋 showPlan');
  assert.doesNotMatch(src, /function showAll\(\)/, "'전체 모델' 프리셋 showAll 제거됨");
  // (5) 옛 누적 단계 구조 금지 — STAGE_BUTTONS·effBuilding·atLeast·blankStage 모두 제거
  assert.doesNotMatch(src, /STAGE_BUTTONS|effBuilding|blankStage/, '옛 누적 단계 구조(STAGE_BUTTONS·effBuilding·blankStage) 제거');
  assert.doesNotMatch(src, /const atLeast =/, '누적 판정 atLeast 제거(부품 독립 토글)');
});

test('⑫ 데크 테두리 폭 — floorFrame을 실제 실행해 부재 치수를 측정(테두리만 10cm, 가운데 가로보는 5cm 불변)', () => {
  // 회귀: 데크 테두리(둘레 림장선) 폭을 rim 인자로 10cm로 올렸을 때, 같은 인자를 쓰던 '가운데 가로보'까지
  //   덩달아 두꺼워진 적이 있다(요청은 "테두리만"). 정규식이 아니라 floorFrame을 직접 실행해
  //   생성되는 box의 실제 치수를 재서, 굵어진 전폭 부재가 정확히 '앞·뒤 테두리 2개'뿐인지 확인한다.
  const src = readFileSync(resolve(root, 'src/builders.js'), 'utf8');   // floorFrame 정의는 builders.js로 분리됨
  const m = src.match(/function floorFrame\([\s\S]*?\n\}/);
  assert.ok(m, 'floorFrame 함수 소스를 찾지 못함');
  const make = new Function('box', 'FLOOR_RIM_W', 'FLOOR_JOIST_H', 'FLOOR_JOIST_W', 'FLOOR_JOIST_SPACING', m[0] + '\nreturn floorFrame;');
  const boxes = [];
  const ff = make((o) => { boxes.push(o); return {}; }, 0.05, 0.2, 0.045, 0.45);
  const near = (a, b) => Math.abs(a - b) < 1e-9;

  // 데크: w=5, d=4, rim 인자 0.10 → 전폭(w===5) 부재 = 앞 림·뒤 림·가운데 보 3개.
  boxes.length = 0;
  ff(0, 0, 5, 4, 0, 'deck', null, 0.10);
  const deckFull = boxes.filter((b) => near(b.w, 5));
  const thick = deckFull.filter((b) => near(b.d, 0.10));   // 굵은(10cm) 전폭 부재
  const thin = deckFull.filter((b) => near(b.d, 0.05));    // 가는(5cm) 전폭 부재
  assert.equal(thick.length, 2, `데크에서 10cm 전폭 부재는 앞·뒤 테두리 2개뿐이어야 함 — 현재 ${thick.length}개(가운데 보까지 굵어졌으면 3개)`);
  assert.equal(thin.length, 1, `가운데 가로보는 테두리와 무관하게 5cm 1개여야 함 — 현재 ${thin.length}개`);

  // 집: rim 인자 없음(기본 5cm) → 10cm 부재가 하나도 없어야 함.
  boxes.length = 0;
  ff(0, 0, 5, 4, 0, 'house');
  const houseThick = boxes.filter((b) => near(b.w, 5) && near(b.d, 0.10));
  assert.equal(houseThick.length, 0, `집 바닥틀은 테두리 10cm가 없어야(전부 5cm) — 현재 ${houseThick.length}개`);
});

test('⑬ 데크 계단틀 — 데크와 동일 출처(deckFootprints[0])로 정렬. clamp 전 원본 좌표로 데크보다 크게 그리지 말 것', () => {
  // 회귀: 데크 계단틀(flatRectFrame·부채꼴 코너)을 living썬룸.dX0(=거실쪽 마감만큼 집 기초선 밖으로 돌출한 clamp 전 값)
  //   좌표로 그려, 데크 본체 footprint(5.5m)보다 0.06m 크게(5.56m) 그린 적이 있다. 데크 본체는 deckFootprints[0]
  //   = max(dX0,0)으로 잘라 그리므로, 계단틀도 같은 출처(deckFootprints[0])로 정렬해야 어긋나지 않는다.
  //   ※ 실제 포세린 계단(deckStairs)은 데크 실물 가장자리 기준이라 별개 — 여기선 '바닥틀' 표현인 계단틀만 강제.
  const src = readFileSync(resolve(root, 'src/main.js'), 'utf8');
  assert.doesNotMatch(src, /flatRectFrame\([^)]*living썬룸\.d/,
    '데크 계단틀(flatRectFrame)은 clamp 전 원본(living썬룸.dX/dZ)이 아니라 deckFootprints[0] 좌표를 써야 한다');
  assert.doesNotMatch(src, /const cx = living썬룸\./,
    '부채꼴 코너 계단 코너점(cx/cz)도 living썬룸 원본이 아니라 deckFootprints[0] 기준이어야 한다');
  assert.match(src, /데크 계단틀[\s\S]{0,1500}deckFootprints\[0\]/,
    '데크 계단틀 블록이 deckFootprints[0]를 좌표 출처로 참조해야 한다(데크와 동일 정렬)');
});
