// ui.js — PARTS(부품→그룹 매핑)·applyVisibility·버튼/탭 바인딩·그룹 전체버튼·카메라 프리셋·버튼 높이 통일.
// (main.js에서 줄 이동. 표시 상태는 ./view-state.js의 view, 메모 렌더는 ./notes.js의 updateNotes.)
import * as THREE from 'three';
import { scene, camera, controls, houseGroup } from './scene.js';
import { view } from './view-state.js';
import { updateNotes } from './notes.js';
import { firstStairRoomLabel, firstBathDimLabel, firstBathClearFill } from './s1/floor1.js';
import { groundTopY, matFoundationH } from './constants.js';
import { foundationTopY, lotX0, lotX1, lotZ0, lotZ1 } from './layout.js';
import {
  firstFloorFinishObjects, firstCeilingObjects, deckFloorObjects, bathObjects, interiorObjects,
  firstWallObjects, firstOutletObjects, firstDimObjects, secondFloorObjects, atticExtWallObjects, atticInnerWallObjects,
  roofObjects, solarObjects, deckObjects, 썬룸FrameObjects, 썬룸RoofObjects, foldingObjects, extrasObjects,
  hedgeObjects, fenceObjects, matFoundationFullObjects, footprintObjects, dimObjects,
  hedgeDimObjects, gapDimObjects, s2FootprintObjects, s2FoundationObjects, s2DimObjects,
  s2Wall1Objects, s2Wall2Objects, s2Wall3Objects, s2Ecu3Objects, s2Stair2Objects,
  s2StairLowA, s2StairMidA, s2StairLowB, s2StairMidB, s2StairUpB,
  s2Floor1Objects, s2Floor2Objects, s2Floor3Objects, s2LiftObjects, s2Roof3Objects, s2Solar3Objects,
  s2FurnitureObjects, s2SinkObjects, s2StoveObjects, s2Fan1Objects, s2Fan2Objects, siteBaseObjects,
  deckStairFrameObjects, stairObjects, stairCoreObjects, kitchenInnerWallObjects, familyInnerWallObjects,
} from './groups.js';

// 보이는 구조물을 화면(버튼 영역 제외 캔버스) 중앙에 꽉 차게 프레이밍한다.
// pos는 '보는 방향'으로만 쓰고 거리는 자동 계산하며, 줌 중심(target)을 경계구 중심에
// 둬서 확대해도 위/아래가 고르게 보이도록 한다.
const _fitBox = new THREE.Box3();
const PARTS = [
  { key: 'matFoundationFull', arrays: [matFoundationFullObjects] },
  { key: 'firstFloorFinish', arrays: [firstFloorFinishObjects, firstDimObjects, stairObjects, interiorObjects] },   // 바닥 + 방 안목치수 + 방·치수 도면 + 실내 가구(안방 침대·주방 싱크대) 합침
  { key: 'firstCeiling', arrays: [firstCeilingObjects] },   // 천장 설비(실링팬·벽걸이 에어컨·실외기)
  { key: 'stair',      arrays: [stairCoreObjects, kitchenInnerWallObjects, familyInnerWallObjects] },   // 주방측 벽·안방 내력벽을 계단 토글에 합침
  { key: 'firstWall',    arrays: [firstWallObjects] },        // 1층 외벽('1층' 그룹 '외벽')
  { key: 'firstOutlet',  arrays: [firstOutletObjects] },      // 1층 콘센트('1층' 그룹 '콘센트')
  { key: 'atticExtWall', arrays: [atticExtWallObjects] },     // 다락 외벽('다락' 그룹 '외벽')
  { key: 'bath',       arrays: [bathObjects] },
  { key: 'loft',       arrays: [secondFloorObjects] },        // 실제 다락 바닥(슬래브·방)
  { key: 'atticInnerWall', arrays: [atticInnerWallObjects] }, // 다락 내벽(칸막이·문·입구벽)
  { key: 'roof',       arrays: [roofObjects] },
  { key: 'solar',      arrays: [solarObjects] },              // 지붕에서 분리한 태양광
  { key: 'deck',       arrays: [deckObjects, deckFloorObjects, deckStairFrameObjects, extrasObjects] },   // 데크바닥·데크계단틀+악세사리(화분·의자·테이블·그릴)를 '데크' 하나로 합침
  { key: 'frame',      arrays: [썬룸FrameObjects] },   // 포치 골조(기둥·보·평프레임) — 폴딩도어·지붕 지지. 데크 기초 위(deckSurfaceY)에 앉음
  { key: 'sunRoof',  arrays: [썬룸RoofObjects] },    // 포치 징크 단물매 지붕(경사 받침 위)
  { key: 'folding',    arrays: [foldingObjects] },
  { key: 'hedge',      arrays: [hedgeObjects] },
  { key: 'fence',      arrays: [fenceObjects] },
  { key: 's2Foundation', arrays: [s2FoundationObjects] },
  { key: 's2Wall1', arrays: [s2Wall1Objects] },
  { key: 's2Wall2', arrays: [s2Wall2Objects] },
  { key: 's2Wall3', arrays: [s2Wall3Objects] },
  { key: 's2Ecu3', arrays: [s2Ecu3Objects] },
  { key: 's2Floor1', arrays: [s2Floor1Objects] },
  { key: 's2Floor2', arrays: [s2Floor2Objects] },
  { key: 's2Floor3', arrays: [s2Floor3Objects] },
  { key: 's2Lift', arrays: [s2LiftObjects] },
  { key: 's2Roof3', arrays: [s2Roof3Objects] },
  { key: 's2Solar3', arrays: [s2Solar3Objects] },
  { key: 's2Furniture', arrays: [s2FurnitureObjects] },
  { key: 's2Sink', arrays: [s2SinkObjects] },
  { key: 's2Stove', arrays: [s2StoveObjects] },
  { key: 's2Fan1', arrays: [s2Fan1Objects] },
  { key: 's2Fan2', arrays: [s2Fan2Objects] },
];
// s1(1층·다락·포치) 부품 토글 — s2처럼 버튼(.seg-btn). [버튼 id → view 키] 단일 출처.
const S1_TOGGLES = [
  ['bDeck', 'deck'],   // 데크(악세사리 합침)
  ['bFolding', 'folding'], ['bSunRoof', 'sunRoof'], ['bFrame', 'frame'],
  ['bLoft', 'loft'], ['bAtticInnerWall', 'atticInnerWall'], ['bAtticExtWall', 'atticExtWall'], ['bRoof', 'roof'], ['bSolar', 'solar'],
  ['bFirstFloorFinish', 'firstFloorFinish'], ['bFirstCeiling', 'firstCeiling'], ['bS1Stair', 'stair'], ['bFirstWall', 'firstWall'], ['bFirstOutlet', 'firstOutlet'], ['bBath', 'bath'],
  ['bMatFull', 'matFoundationFull'],
];

export function applyVisibility() {
  const isPlan = view.plan;
  // 집 높이: 선택된 기초 윗면에 1층 바닥이 앉도록 집 전체(houseGroup)를 Y로 이동.
  // 말뚝기초=기준(오프셋 0), 매트기초(부분/전체)=매트 윗면−말뚝 윗면 만큼 위로. 기초 높이를 바꾸면 자동 반영(하드코딩 없음).
  const activeFoundationTopY = view.matFoundationFull ? (groundTopY + matFoundationH) : foundationTopY;
  houseGroup.position.y = activeFoundationTopY - foundationTopY;
  // 항상 표시(공통 — 모든 탭 공유): 바탕 대지·도로 + 담장 발자국(색상은 늘 바탕에)
  for (const item of siteBaseObjects) item.visible = true;
  // 집·데크 발자국 = 현재 탭(설계안) 것만 — 2층 탭에선 숨겨 집 배치도 분리
  for (const item of footprintObjects) item.visible = (currentScheme === 's1');
  const planDimOn = isPlan || view.matFoundationFull || view.s2Foundation;   // 배치도 + 매트기초(s1) + s2 기초 — 공통 치수·기준선 노출 조건
  // s2 탭 바닥 기준층 — 시작 배치도의 발자국·치수는 어떤 토글(기초·측백담장·옆집담장 포함)에도 사라지지 않고 항상 그대로 유지.
  const s2Ground = (currentScheme === 's2');
  // 집·데크 크기 치수 = 현재 탭 것만(2층 탭에선 숨김)
  for (const item of dimObjects) item.visible = (currentScheme === 's1') && planDimOn;
  for (const item of hedgeDimObjects) item.visible = isPlan || s2Ground;   // 측백 0.5m 치수 — s2 바닥 기준층(항상)·배치도(dimObjects 게이팅을 덮음)
  for (const item of gapDimObjects) item.visible = planDimOn || s2Ground;  // 집-담장 이격(0.5·1.0) — s2 바닥 기준층(항상)+공통 배치도/기초
  // s2 집 발자국·치수 = 바닥 기준층으로 항상 표시(기초 토글과 무관). 기초 0.5m 슬래브(입체)는 PARTS(s2Foundation)에서 별도 처리.
  for (const item of s2FootprintObjects) item.visible = s2Ground;
  for (const item of s2DimObjects) item.visible = s2Ground;
  // 부품: PARTS 테이블 일괄 — 각 부품 독립 토글(배치도일 땐 모두 숨김)
  for (const p of PARTS) {
    const on = !isPlan && !!view[p.key];
    for (const arr of p.arrays) for (const item of arr) item.visible = on;
  }
  // 1층 바닥+계단 동시 표시 → 계단실 라벨 숨기고 그 자리에 화장실 안목치수 표시(둘 다 firstDimObjects=바닥 토글 소속)
  { const bothOn = !isPlan && view.firstFloorFinish && view.stair;
    if (firstStairRoomLabel) firstStairRoomLabel.visible = !isPlan && view.firstFloorFinish && !bothOn;
    if (firstBathDimLabel)   firstBathDimLabel.visible   = bothOn;
    if (firstBathClearFill)  firstBathClearFill.visible  = bothOn;   // 화장실 안목 자홍 바닥칠 — 바닥+계단 동시일 때만
  }
  // s2 계단 — 1·2·3층 런·계단참·공유 라벨 전체를 하나의 '계단' 토글로 함께 표시.
  { const on = !isPlan && view.s2Stair;
    for (const arr of [s2StairLowA, s2StairMidA, s2StairLowB, s2StairMidB, s2StairUpB, s2Stair2Objects])
      for (const item of arr) item.visible = on;
  }
  // 층별 라벨 정리 — 윗층 바닥이 표시되면 아래층의 비치수 라벨(방·가구·설비·개구부)은 숨겨 겹쳐 보임 방지. 치수 라벨은 유지.
  { const hideNonDim = (arrs) => { for (const arr of arrs) for (const item of arr) if (item.userData && item.userData.labelGroup && item.userData.labelGroup !== 'dim') item.visible = false; };
    if (!isPlan && view.s2Floor2) hideNonDim([s2Floor1Objects, s2SinkObjects, s2StoveObjects, s2FurnitureObjects, s2StairLowA]);   // 2층 바닥 표시 → 1층 비치수 라벨 숨김
    if (!isPlan && view.s2Floor3) hideNonDim([s2Floor2Objects]);                                                                  // 3층 바닥 표시 → 2층 비치수 라벨 숨김
  }
  syncSegButtons();   // 계단/바닥 버튼 행 active 상태 동기화
  syncAllButtons();   // 그룹 전체 on/off 버튼 라벨·상태 동기화
  updateNotes(currentScheme);
}

// 계단·바닥 버튼 행(체크박스 대신 버튼) active 상태 동기화. '계단'·'바닥'은 하위 전부 켜졌을 때 active.
function setActive(id, on) { const el = document.querySelector('#' + id); if (el) el.classList.toggle('active', !!on); }
function syncSegButtons() {
  setActive('bHedge', view.hedge); setActive('bFence', view.fence);
  // '1층' 그룹 버튼 — 구조 섹션의 같은 부품을 공유 토글(active 동기화)
  setActive('bF1Foundation', view.s2Foundation); setActive('bF1Floor', view.s2Floor1); setActive('bF1Wall', view.s2Wall1);
  setActive('bF1Furniture', view.s2Furniture); setActive('bF1Sink', view.s2Sink); setActive('bF1Stove', view.s2Stove); setActive('bF1Fan', view.s2Fan1);
  setActive('bF2Floor', view.s2Floor2); setActive('bF2Wall', view.s2Wall2); setActive('bF2Fan', view.s2Fan2);
  setActive('bF3Floor', view.s2Floor3); setActive('bF3Wall', view.s2Wall3); setActive('bF3Ecu', view.s2Ecu3);
  setActive('bF3Roof', view.s2Roof3); setActive('bF3Solar', view.s2Solar3);
  setActive('bStair', view.s2Stair); setActive('bLift', view.s2Lift);
  for (const [id, key] of S1_TOGGLES) setActive(id, view[key]);   // s1 부품 버튼 active 동기화
}


// 배치도(부감) 전용 카메라 — 대지 전체를 상부에서 내려다본다(도로·토지·담장·기초 바닥 한눈에).
function setPlanView() {
  camera.up.set(0, 1, 0);
  const cx = (lotX0 + lotX1) / 2;
  const cz = (lotZ0 + lotZ1) / 2;
  controls.target.set(cx, 0.2, cz);
  // 정남(화면 아래) = 옆집담장·측백담장이 만나는 모서리(낮은 X·뒤쪽 Z). 그 모서리가 화면 맨 아래로
  // 오도록 상부 시점의 살짝 기운 방향을 모서리 쪽으로 돌린다.
  const corner = new THREE.Vector2(lotX0 - cx, lotZ1 - cz);   // 중심→모서리 (X,Z)
  corner.normalize().multiplyScalar(15.3);                    // 남쪽으로 더 물러나 비스듬히(입체감) 내려다봄
  camera.position.set(cx + corner.x, 12.8, cz + corner.y);    // 수직 기준 약 50° 기운 조감
  controls.update();
}

// 줌 중심(target)의 높이를 현재 보이는 구조물 높이의 '중간'에 맞춘다. 지면(바닥)에 박지 않으므로
// 키 큰 부재(골조 등)를 켜고 확대해도 위쪽이 화면 밖으로 밀리지 않는다. x·z는 그대로 둔다.
function centerTargetHeight() {
  scene.updateMatrixWorld(true);
  _fitBox.makeEmpty();
  scene.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    if (o.name === 'ground') return;
    for (let p = o.parent; p; p = p.parent) if (!p.visible) return;
    _fitBox.expandByObject(o);
  });
  if (_fitBox.isEmpty()) return;
  controls.target.y = (_fitBox.min.y + _fitBox.max.y) / 2;
  // 화면에서 집이 아래로 붙어 보여, 프레임 세로의 15%만큼 위로 올려 보이도록 줌 중심을 아래로 내려 팬
  const dist = camera.position.distanceTo(controls.target);
  controls.target.y -= 0.15 * 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  controls.update();
}

// 프리셋 뷰 — 배치도(부감): 모든 부품 끄고 평면만.
function showPlan() {
  for (const k of Object.keys(view)) view[k] = false;
  view.plan = true;
  applyVisibility();
  setPlanView();
}

// 메뉴 그룹 전체 on/off — 제목 오른쪽 버튼. 그룹에 속한 부품 키 전체를 한 번에 켜고/끈다.
const SEG_KEYS = {                              // 버튼 id → 제어하는 view 키(집계 버튼은 leaf 키들의 합집합)
  bHedge: ['hedge'], bFence: ['fence'],
  bStair: ['s2Stair'], bLift: ['s2Lift'],
  bF1Foundation: ['s2Foundation'], bF1Floor: ['s2Floor1'], bF1Wall: ['s2Wall1'],
  bF1Furniture: ['s2Furniture'], bF1Sink: ['s2Sink'], bF1Stove: ['s2Stove'], bF1Fan: ['s2Fan1'],
  bF2Floor: ['s2Floor2'], bF2Wall: ['s2Wall2'], bF2Fan: ['s2Fan2'],
  bF3Floor: ['s2Floor3'], bF3Wall: ['s2Wall3'], bF3Ecu: ['s2Ecu3'],
  bF3Roof: ['s2Roof3'], bF3Solar: ['s2Solar3'],
};
for (const [id, key] of S1_TOGGLES) SEG_KEYS[id] = [key];   // s1 부품 버튼도 그룹 전체버튼 집계에 포함
const groupControls = [];   // [{ btn, getKeys }] — 각 그룹의 전체버튼 + 제어 키 산출(현재 탭에 보이는 버튼만)
for (const sec of document.querySelectorAll('.menu-group')) {
  if (!sec.querySelector('.seg-btn')) continue;
  // '기본' 그룹처럼 탭 전용 버튼이 섞인 곳은 숨겨진(다른 탭) 버튼을 빼고 집계 — s1 탭 '켜기'가 s2 기초를 켜지 않게.
  const getKeys = () => {
    const keys = new Set();
    for (const b of sec.querySelectorAll('.seg-btn')) { if (b.hidden) continue; for (const k of (SEG_KEYS[b.id] || [])) keys.add(k); }
    return [...keys];
  };
  if (!getKeys().length && !sec.querySelectorAll('.seg-btn[data-scheme]').length) continue;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'menu-all';
  sec.querySelector('.menu-title').appendChild(btn);
  btn.addEventListener('click', () => {
    const keyList = getKeys();
    if (!keyList.length) return;
    const target = !keyList.some((k) => view[k]);   // 토글: 하나라도 켜졌으면 모두 끄고, 다 꺼졌으면 모두 켬
    for (const k of keyList) view[k] = target;
    if (target && view.plan) view.plan = false;   // 켜면 부감에서 빠져나옴
    applyVisibility();
    if (target) centerTargetHeight();
  });
  groupControls.push({ btn, getKeys });
}
// 전체버튼 라벨·상태 동기화 — 개별 토글로 view가 바뀌어도 버튼이 따라오게 applyVisibility서 호출.
function syncAllButtons() {
  for (const { btn, getKeys } of groupControls) {
    const keys = getKeys();
    const anyOn = keys.some((k) => view[k]);
    btn.textContent = anyOn ? '끄기' : '켜기';
    btn.classList.toggle('on', anyOn);
  }
}

// 계단·바닥 버튼 행 — 체크박스 대신 버튼. 개별 버튼은 자기 키를 토글, '계단'·'바닥'은 하위 전부를 한 번에 on/off.
function bindSegButton(id, onClick) {
  const el = document.querySelector('#' + id);
  if (!el) return;
  el.addEventListener('click', () => {
    onClick();
    if (view.plan) view.plan = false;   // 부품 켜면 부감에서 빠져나옴
    applyVisibility();
    centerTargetHeight();
  });
}
bindSegButton('bHedge', () => { view.hedge = !view.hedge; });
bindSegButton('bFence', () => { view.fence = !view.fence; });
// '1층' 그룹 버튼 — 구조 섹션의 같은 부품(기초·1층바닥·1>2층계단·식탁·주방·난로)을 공유 토글
bindSegButton('bF1Foundation', () => { view.s2Foundation = !view.s2Foundation; });
bindSegButton('bF1Floor', () => { view.s2Floor1 = !view.s2Floor1; });
bindSegButton('bF1Furniture', () => { view.s2Furniture = !view.s2Furniture; });
bindSegButton('bF1Sink', () => { view.s2Sink = !view.s2Sink; });
bindSegButton('bF1Stove', () => { view.s2Stove = !view.s2Stove; });
bindSegButton('bF1Fan', () => { view.s2Fan1 = !view.s2Fan1; });
bindSegButton('bF2Floor', () => { view.s2Floor2 = !view.s2Floor2; });
bindSegButton('bF2Fan', () => { view.s2Fan2 = !view.s2Fan2; });
bindSegButton('bF3Floor', () => { view.s2Floor3 = !view.s2Floor3; });
bindSegButton('bF3Ecu', () => { view.s2Ecu3 = !view.s2Ecu3; });          // 3층 실외기 = 방열/배기 루버 그릴 + 벽 안쪽 실외기실
bindSegButton('bF3Roof', () => { view.s2Roof3 = !view.s2Roof3; });       // 3층 지붕 = 징크 박공 슬래브 + 처마 + 눈막이
bindSegButton('bF3Solar', () => { view.s2Solar3 = !view.s2Solar3; });    // 3층 태양광 = 뒤 지붕 3kW 패널
bindSegButton('bStair', () => { view.s2Stair = !view.s2Stair; });        // 계단 = 1·2·3층 계단 전체 한 토글
bindSegButton('bF1Wall', () => { view.s2Wall1 = !view.s2Wall1; });       // 외벽 1층
bindSegButton('bF2Wall', () => { view.s2Wall2 = !view.s2Wall2; });       // 외벽 2층
bindSegButton('bF3Wall', () => { view.s2Wall3 = !view.s2Wall3; });       // 외벽 3층
bindSegButton('bLift', () => { view.s2Lift = !view.s2Lift; });           // 홈리프트 = 전체 샤프트(독립)
// s1(1층·다락·포치) 부품 버튼 — 개별 키 토글.
for (const [id, key] of S1_TOGGLES) {
  bindSegButton(id, () => { view[key] = !view[key]; });
}

// ── 최상위 탭(설계안 scheme) ───────────────────────────────────────────────────
// 페이지 가장 바깥 선택: 탭마다 별도 설계안. 대지·측백담·옆집담·이격은 모든 탭 공유.
// 탭 클릭 = 그 설계안의 배치도(부감)부터(켠 부품 전부 리셋). 같은 탭을 다시 눌러도 배치도로 복귀.
// 탭 추가: ① scene.js에 <button class="scheme-tab" data-scheme="sN"> + <section data-scheme="sN"> 그룹
//          ② 그 탭 전용 부재는 applyVisibility에서 currentScheme==='sN'으로 게이팅(s2 예시 참고).
let currentScheme = 's2';
export function setScheme(id) {
  currentScheme = id;
  for (const sec of document.querySelectorAll('.menu-group[data-scheme]')) {
    const ds = sec.dataset.scheme;
    sec.hidden = !(ds === 'shared' || ds === id);   // 공통+현재 탭 그룹만 노출
  }
  // 공통('기본') 그룹 안의 탭 전용 버튼(기초=s2 / 부분·전체=s1)은 현재 탭 것만 노출 — 각 탭에 자기 기초만 보임
  for (const b of document.querySelectorAll('.seg-btn[data-scheme]')) b.hidden = (b.dataset.scheme !== id);
  for (const t of document.querySelectorAll('.scheme-tab')) t.classList.toggle('active', t.dataset.scheme === id);
  showPlan();   // 그 탭의 배치도(부감)로 — 켠 부품 리셋 + 부감 카메라
}
for (const t of document.querySelectorAll('.scheme-tab')) {
  t.addEventListener('click', () => setScheme(t.dataset.scheme));
}



