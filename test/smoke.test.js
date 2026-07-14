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

test('⑤ 안방 개방 포치 제거 — 기초(데크) 위에만 프레임·지붕. 안방썬룸·안방 말뚝 부활 금지', () => {
  // 사용자 요청으로 기초 없는 안방쪽 개방 포치(프레임·지붕·땅기둥)를 전부 제거했다. 되살리지 않는다.
  const src = readFileSync(mainJs, 'utf8');
  assert.doesNotMatch(src, /const 안방썬룸 = 썬룸\(/, '안방썬룸(개방 포치)은 제거됨 — 부활 금지');
  assert.doesNotMatch(src, /anbang:/, 'PILE_POS.anbang(안방 말뚝)은 제거됨 — 부활 금지');
  // 포치 지붕은 주방 썬룸 폭(roofW)까지만 — 집 전폭 override로 안방쪽까지 덮지 않는다.
  assert.doesNotMatch(src, /roofPanelW: buildingW \+ 2 \* frSideOverhang/, '지붕 패널을 집 전폭으로 넓혀 안방쪽까지 덮지 말 것');
});

test('⑥ 집 발자국(0.5m)과 데크 발자국(0.4m)은 바닥 평면에서 색이 다르다', () => {
  // 높이 차(집 0.5m / 데크 0.4m)를 발자국 색으로 구분(말뚝기초 제거됨 — 두부 색 구분은 더 이상 없음).
  const src = readFileSync(mainJs, 'utf8');
  const mat = readFileSync(resolve(root, 'src/materials.js'), 'utf8');   // 재질 정의는 materials.js로 분리됨
  assert.match(mat, /deckFoundation:\s*new THREE/, '데크 기초 발자국용 자재(deckFoundation)가 정의돼야 함');
  // 바닥(평면) 데크 발자국은 deckFoundation 색.
  assert.match(src, /deckFootprints\)\s*\{[\s\S]{0,300}materials\.deckFoundation/, '바닥 데크 발자국은 deckFoundation 색이어야 함');
});

test('⑦ 안방 땅 기둥 렌더 제거 — drawGroundPost 호출이 남아있지 않다(개방 포치 삭제)', () => {
  // 안방 개방 포치를 제거했으므로 안방 땅 기둥을 그리는 호출도 없어야 한다.
  const src = readFileSync(mainJs, 'utf8');
  assert.doesNotMatch(src, /drawGroundPost\(px, pz, i === 0\)\)/, '안방 땅 기둥 렌더 호출은 제거됨 — 부활 금지');
});

test('⑧ 집·데크 발자국 — 단일 출처(footprintObjects), 현재 탭(설계안) 전용 표시', () => {
  // 집 배치도는 탭마다 다르므로 발자국은 footprintObjects에 정의하고 현재 탭(s1)에서만 표시. 담장 발자국은 siteBaseObjects로 공통(항상 바탕에 표시).
  const src = readFileSync(mainJs, 'utf8');
  assert.match(src, /footprintObjects\.push\(box\(\{ x: 0, z: buildingFrontZ, w: buildingW, d: buildingD,[\s\S]{0,120}materials\.foundation/, '집 발자국은 footprintObjects에 정의');
  assert.match(src, /footprintObjects\.push\(box\(\{ x: f\.x, z: f\.z,[\s\S]{0,120}materials\.deckFoundation/, '데크 발자국은 footprintObjects에 정의');
  assert.match(src, /for \(const item of footprintObjects\) item\.visible = \(currentScheme === 's1'\);/, '집·데크 발자국은 현재 탭(s1)에서만 표시');
  assert.match(src, /siteBaseObjects\.push\(box\([\s\S]{0,120}materials\.hedge/, '담장 발자국은 siteBaseObjects(공통·항상 표시)에 정의');
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

test('⑪ 레이어 패널 — 부품별 독립 토글(완전 독립, 누적 없음) + 배치도/전체모델 프리셋', () => {
  // 사용자 지시(레이아웃 재설계): 좌측 메뉴 = 부품 체크박스, 우측 = 렌더.
  //   · 각 부품은 view[key] boolean으로 완전 독립 표시(누적·단계 없음). PARTS 테이블이 [객체배열↔상태]를 일괄 구동.
  //   · 배치도(부감)는 여러 부품을 한 번에 끄는 프리셋 뷰(showPlan). '전체 모델' 프리셋은 제거됨.
  //   회귀 금지: 옛 누적 단계(STAGE_BUTTONS·effBuilding·atLeast·blankStage)로 되돌리지 말 것.
  const src = readFileSync(mainJs, 'utf8');
  // (1) 부품 상태는 view 객체의 독립 boolean — 핵심 부품 키 존재
  assert.match(src, /const view = \{/, '부품 상태는 단일 view 객체');
  for (const k of ['matFoundationFull', 'firstFloorFinish', 'stair', 'firstWall', 'atticExtWall', 'roof', 'deck', 'folding']) {
    assert.match(src, new RegExp(`\\b${k}:`), `view에 부품 키 ${k} 존재`);
  }
  // (2) PARTS 테이블이 부품→객체배열을 매핑하고, 가시성은 그 테이블로 일괄(독립)
  assert.match(src, /const PARTS = \[/, '부품→객체배열 매핑 PARTS 테이블');
  assert.match(src, /for \(const p of PARTS\)[\s\S]*?const on = !isPlan && !!view\[p\.key\];/, '각 부품은 view[key]로 독립 표시(배치도일 땐 숨김)');
  // (3) 안방 내력벽·주방측 벽은 '계단' 토글에 합쳐짐(별도 토글 삭제) — stair 배열에 두 벽 그룹 포함
  assert.match(src, /key: 'stair',\s*arrays: \[stairCoreObjects, kitchenInnerWallObjects, familyInnerWallObjects\]/, '주방측 벽·안방 내력벽은 계단(stair) 토글에 합쳐짐');
  assert.doesNotMatch(src, /key: 'kitchenWall'|key: 'familyWall'/, '별도 kitchenWall·familyWall 토글은 제거됨');
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
  // 회귀: 데크 계단틀(flatRectFrame·부채꼴 코너)을 kitchen썬룸.dX0(=주방쪽 마감만큼 집 기초선 밖으로 돌출한 clamp 전 값)
  //   좌표로 그려, 데크 본체 footprint(5.5m)보다 0.06m 크게(5.56m) 그린 적이 있다. 데크 본체는 deckFootprints[0]
  //   = max(dX0,0)으로 잘라 그리므로, 계단틀도 같은 출처(deckFootprints[0])로 정렬해야 어긋나지 않는다.
  //   ※ 실제 포세린 계단(deckStairs)은 데크 실물 가장자리 기준이라 별개 — 여기선 '바닥틀' 표현인 계단틀만 강제.
  const src = readFileSync(resolve(root, 'src/main.js'), 'utf8');
  assert.doesNotMatch(src, /flatRectFrame\([^)]*kitchen썬룸\.d/,
    '데크 계단틀(flatRectFrame)은 clamp 전 원본(kitchen썬룸.dX/dZ)이 아니라 deckFootprints[0] 좌표를 써야 한다');
  assert.doesNotMatch(src, /const cx = kitchen썬룸\./,
    '부채꼴 코너 계단 코너점(cx/cz)도 kitchen썬룸 원본이 아니라 deckFootprints[0] 기준이어야 한다');
  assert.match(src, /데크 계단틀[\s\S]{0,1500}deckFootprints\[0\]/,
    '데크 계단틀 블록이 deckFootprints[0]를 좌표 출처로 참조해야 한다(데크와 동일 정렬)');
});

test('⑭ 작업 도면 격리 — S2(3층) 영역에서 s1(1층+다락) 그룹에 그리는 사고 차단', () => {
  // 사고 방지: s2(3층) 작업 중 s1(1층+다락) 그룹에 부재를 그리면, 두 좌표값이 겹쳐(x=8.5·뒤벽 z=3.3)
  //   에러 없이 s1 도면에 조용히 그려진다 → s2 화면엔 안 보이는데 "추가됐다"고 착각. (부동수전 사고가 이 경우)
  // main.js의 "S2 영역 시작"~"S2 영역 끝" 배너 사이(=3층 전용 구역)에서 s1 전용 그룹에
  //   captureInto()/​.push 하는 코드가 나오면 실패시킨다. s2 부재는 s2*Objects로만 그려야 한다.
  const src = readFileSync(mainJs, 'utf8');
  const begin = src.indexOf('▼▼▼  S2 영역 시작');
  const end = src.indexOf('▲▲▲  S2 영역 끝');
  assert.ok(begin > 0 && end > begin, 'main.js에 "S2 영역 시작"·"S2 영역 끝" 경계 배너가 있어야 함(작업 도면 격리 기준)');
  const s2Zone = src.slice(begin, end);
  // s1(1층+다락) 전용 그룹 — S2 구역에서 이들에 그리면 사고. (s2*Objects·공유 그룹은 허용)
  const s1Groups = [
    'firstFloorObjects', 'firstFloorFinishObjects', 'bathObjects', 'firstWallObjects', 'firstDimObjects',
    'secondFloorObjects', 'roofObjects', 'footprintObjects', 'dimObjects', 'planObjects',
    'stairObjects', 'stairCoreObjects', 'stairWallObjects', 'kitchenInnerWallObjects', 'familyInnerWallObjects',
    'outletObjects', 'atticOutletObjects',
  ];
  const bad = [];
  for (const g of s1Groups) {
    if (new RegExp(`captureInto\\(\\s*${g}\\b`).test(s2Zone) || new RegExp(`\\b${g}\\.push\\b`).test(s2Zone)) bad.push(g);
  }
  if (/\bcaptureSecond\s*\(/.test(s2Zone)) bad.push('captureSecond(다락 캡처)');
  assert.equal(bad.length, 0,
    `S2(3층) 영역에서 s1(1층+다락) 그룹에 그림: ${bad.join(', ')} — s2*Objects로 바꾸거나, s1 부재라면 "S2 영역 끝" 배너 밖으로 옮길 것`);
});

test('⑮ 작업 도면 격리(역방향) — s2(3층) 부재는 S2 영역 안에만 그린다', () => {
  // ⑭의 짝: s2 부재(s2*Objects)를 S2 영역 밖에 그리면, s2 작업이 파일 곳곳에 흩어져
  //   다시 s1과 헷갈리는 원인이 된다. s2 그룹에 그리는 코드는 반드시 배너 안에만 있어야 한다.
  //   (groups.js import·applyVisibility의 가시성 순회는 push/captureInto가 아니라 걸리지 않음)
  const src = readFileSync(mainJs, 'utf8');
  const begin = src.indexOf('▼▼▼  S2 영역 시작');
  const end = src.indexOf('▲▲▲  S2 영역 끝');
  assert.ok(begin > 0 && end > begin, 'main.js에 S2 영역 경계 배너가 있어야 함');
  const outside = src.slice(0, begin) + src.slice(end);   // S2 영역 밖 전체
  const s2Groups = [
    's2FootprintObjects', 's2FoundationObjects', 's2DimObjects', 's2Wall1Objects', 's2Wall2Objects', 's2Wall3Objects',
    's2Stair2Objects', 's2StairLowA', 's2StairMidA', 's2StairLowB', 's2StairMidB', 's2StairUpB',
    's2Floor1Objects', 's2Floor2Objects', 's2Floor3Objects', 's2Roof3Objects', 's2Solar3Objects',
    's2FurnitureObjects', 's2SinkObjects', 's2StoveObjects', 's2Fan1Objects', 's2Fan2Objects',
  ];
  const bad = [];
  for (const g of s2Groups) {
    if (new RegExp(`captureInto\\(\\s*${g}\\b`).test(outside) || new RegExp(`\\b${g}\\.push\\b`).test(outside)) bad.push(g);
  }
  assert.equal(bad.length, 0,
    `S2 영역 밖에서 s2(3층) 그룹에 그림: ${bad.join(', ')} — "S2 영역 시작"~"끝" 배너 안으로 옮길 것`);
});

test('⑯ 메모 숫자 = 코드 연동 — NOTES 안 물리 치수(m·mm·㎡)는 하드코딩 금지, ${} 보간만', () => {
  // CLAUDE.md 원칙 강제: 메모(NOTES)에 적는 치수는 반드시 코드 변수에서 계산(${...})해,
  //   코드가 바뀌면 메모도 같이 바뀌게 한다. 숫자 리터럴에 단위(m·mm·㎡)를 붙여 박아두면
  //   코드값과 어긋나도 아무도 못 잡는다 → 여기서 차단.
  //   (보간 결과 뒤 단위 "${fmtDim(x)} m"는 '}' 뒤라 숫자리터럴이 아니므로 자동 통과)
  const src = readFileSync(mainJs, 'utf8');
  const start = src.indexOf('const NOTES = {');
  const end = src.indexOf('const NOTE_ORDER');
  assert.ok(start >= 0 && end > start, 'NOTES 블록(const NOTES ~ const NOTE_ORDER)을 찾지 못함');
  const notes = src.slice(start, end);
  // 허용: 코드 부재가 아닌 법·규정·참고값만(추가 시 반드시 근거를 주석으로). 이 외 치수 리터럴은 금지.
  const ALLOW = new Set([
    '1.0 m',   // 도로(건축선) 법정 이격 — 모델 부재가 아님(지자체 규정값)
  ]);
  const found = notes.match(/\d+(?:\.\d+)?\s*(?:mm|㎡|m)\b/g) || [];
  const bad = found.map((s) => s.replace(/\s+/g, ' ').trim()).filter((s) => !ALLOW.has(s));
  assert.equal(bad.length, 0,
    `메모에 하드코딩된 치수: ${bad.join(', ')} — 코드 변수로 계산해 \${...}로 넣을 것(불가피한 규정값이면 ALLOW에 근거와 함께 등록)`);
});

test('⑰ 메모 서식 = 보기좋게 — 한 줄에 수치를 `·`로 죽 이어 붙인 run-on 라인 금지', () => {
  // CLAUDE.md §5-3 강제: 항목이 여럿이면 ［구획］ 머리글로 묶고 한 줄에 하나씩 라벨 정렬.
  //   한 줄에 여러 수치를 ' · '로 죽 이어 붙이면(성의 없는 한 줄 나열) 차단한다.
  //   맨 앞 글머리(`· `/`- `)는 세지 않고, 줄 '가운데' ' · ' 구분자만 센다. 3개 이상이면 실패.
  const src = readFileSync(mainJs, 'utf8');
  const start = src.indexOf('const NOTES = {');
  const end = src.indexOf('const NOTE_ORDER');
  assert.ok(start >= 0 && end > start, 'NOTES 블록을 찾지 못함');
  const notes = src.slice(start, end);
  // 따옴표로 감싼 body 라인 문자열만 뽑아, 맨 앞 글머리 기호 제거 후 가운데 ' · ' 개수를 센다.
  const lines = notes.match(/'[^']*'|`[^`]*`/g) || [];
  const runon = lines
    .map((s) => s.slice(1, -1))
    .map((s) => s.replace(/^[·\-]\s*/, ''))
    .filter((s) => (s.match(/ · /g) || []).length >= 3);
  assert.equal(runon.length, 0,
    `메모 한 줄에 수치를 죽 이어 붙임: ${runon.join(' / ')} — ［구획］ 머리글로 묶고 한 줄에 하나씩 라벨 정렬할 것(§5-3)`);
});
