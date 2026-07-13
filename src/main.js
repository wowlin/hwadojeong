// ════════════════════════════════════════════════════════════════════════════
// 화도정 3D 개념 모형 — 편집 가이드 (자주 바뀌는 도면이라 수정 포인트를 여기 정리)
// ════════════════════════════════════════════════════════════════════════════
// ▌좌표계 (단위 m)
//   X = 동서 :  +X = 동(도로측) / −X = 서      (평면도에선 동이 화면 왼쪽 = 미러)
//   Z = 남북 :  +Z = 남(집 뒤)  / −Z = 북(정면·현관·썬룸)
//   Y = 상하 :  지면 상단 groundTopY=0.08, 1층 바닥 firstFloorY=0.88
//   집 발자국 : X 0~8.5, Z −0.7~3.3 (8.5×4.0m). 정면(−Z=북)에 데크/썬룸.
//   ★ 좌우/앞뒤 (주 출입문 보는 시점 — 사용자 확정, 절대 헷갈리지 말 것):
//     왼쪽(좌) = 동 = 높은 X(8.5쪽) = 도로·안방측 │ 오른쪽(우) = 서 = 낮은 X(0쪽) = 주방측
//     앞 = 정면(−Z, 현관·썬룸·마당) │ 뒤 = 집뒤(+Z, 측백·도로 — 마당 없음)
//
// ▌치수는 어디서 바꾸나
//   · 건물·층고·기초·바닥재 : "주요 제원" 블록 (buildingW, foundationHeight, firstWallHeight …)
//   · 다락·지붕 각도/두께   : secondWallHeight, roofSlopeDeg, roofThickness
//   · 대지(부지) 형상       : lotNW/lotNE/lotSE/lotSW 코너 (도로·측백·치수 자동 추종)
//   · 창호/문 크기·위치     : 1층 섹션의 yardSash*, familyWindow*, sideDoor*, kitchenRearWindow*, entryDoor*
//   · 썬룸                : 썬룸() 내부 targetFrontPostH / targetWallPostH / roofSlopeLength
//   · 데크 계단             : deckStairs({...}) 호출부
//   · 색·재질               : 상단 materials = { … } 객체
//   · 버튼 라벨/업체         : 상단 app.innerHTML 의 <button>
//
// ▌객체 추가/제거 — 토글 그룹 시스템
//   표시는 "그룹 배열 + applyVisibility()" 로 제어. 객체는 한 그룹에 속함:
//     firstFloorObjects/secondFloorObjects/roofObjects/deckObjects/썬룸Objects/
//     wallObjects/foldingObjects/outletObjects/hedgeObjects/fenceObjects/foundationObjects/planObjects/extrasObjects
//   · 추가 : 해당 위치에서 box({…})/label(…) → 캡처범위에 자동 분류, 또는 group.push(box({…}))(콘센트·담장식).
//            캡처 패턴: const _s = scene.children.length; … ; group.push(...scene.children.slice(_s));
//            (1층=_firstFloorStart, 다락=captureSecond(), 썬룸=썬룸() 내부)
//   · 제거 : 그 box()/label() 줄 삭제(딸린 치수·라벨도 함께).
//   · 토글 추가: ① app.innerHTML <button id="toggleX"> ② 그룹배열 const ③ applyVisibility() 규칙 ④ 하단 addEventListener.
//
// ▌헬퍼 (x·z는 최소 모서리, 단위 m) — 무클로저 빌더는 모듈에서 import, 나머지는 main.js 전역
//   primitives.js : box({x,z,w,d,y,h,mat,name,cast}) · flatPoly({points:[[x,z]…],y,h,mat,name}) · lerpPoint · fmtDim …
//   builders.js   : floorFrame · systemPile/pileFoundation · yzWallPrism · roofSlab · slopedWallTopCap …
//   main.js 전역  : label(text,x,y,z,size) · room/frontSash/sideSash/sideDoor/germanSlidingDoor/entryDoor/pocketDoor* · planYDim/planXDim · setView/applyVisibility
//
// ▌주의 (ES모듈·strict)
//   · 같은 이름 function/const 재정의 금지 → 앱 전체가 깨짐. 새 헬퍼는 새 이름으로.
//   · const는 쓰기 전에 정의(파생값은 원본 뒤). "수치만" 변경은 안전, "줄 이동"은 의존성 확인.
//   · 수정 후 콘솔 에러 0 + 해당 뷰 스크린샷으로 검증.
// ════════════════════════════════════════════════════════════════════════════
import * as THREE from 'three';
import { materials } from './materials.js';
import { stage, scene, houseGroup, camera, renderer, controls } from './scene.js';
import { box, addGeometryEdges, lerpPoint, flatPoly, fmtDim, stairWallTopCap, railCylinder } from './primitives.js';
import {
  pileGridCoords, systemPile, pileFoundation,
  addStairRailingSegment, yzWallPrism, gableEndWallThicknessCap, slopedWallTopCap, wallEndThicknessFace, roofSlab,
} from './builders.js';
import {
  buildingW, buildingD, buildingBackZ, groundTopY, pileR,
  pileCapW, pileCapH, floorFinishH, deckFinishT, deckFoundationH, lotW,
  lotD, roadW, firstWallHeight, exteriorWall, interiorWall,
  stairRunW, entryDoorLeafW, entryFrameOuterW, entryFrameH, interiorDoorW, interiorDoorH,
  yardSashW, yardSashH, secondFloorThickness, secondWallHeight, roofSlopeDeg,
  roofThickness, stairRiserCount, stairRiserHeight, lowerStraightTreadCount, winderTreadCount, landingTreadCount, upperStraightTreadCount, stairTreadDepth, floorSurfaceH,
  floorOverlayLift, familyWindowW, kitchenSinkW, kitchenSinkD, kitchenSinkH, kitchenRearWindowW,
  familyRearWindowW, sideDoorW, sideDoorH, secondAtticDoorH, secondCorridorWindowH, secondCorridorWindowSillOffset, atticCorridorWallT,
  atticVentWindowW, atticSkyWindowW, atticSkyWindowH, atticSkyWindowSillOffset, atticRearWindowW, atticRearWindowH,
  atticRearWindowSillOffset, sideGableWindowW, sideGableWindowH, sideGableWindowSillOffset, STUD_SPACING,
  FRAME_WEB, FRAME_FLANGE, TRACK_H, frEaveOverhang, frSideOverhang, FRAME_ROOM_W,
  FLOOR_JOIST_H, FLOOR_JOIST_W, FLOOR_RIM_W, DECK_RIM_W, FLOOR_JOIST_SPACING, planMarkW,
  hedgeThickness, deckW, deckD, matFoundationH
} from './constants.js';
import {
  buildingFrontZ, lotX0, foundationTopY, firstFloorY, deckTopY0, lotX1, lotZ1,
  lotZ0, firstWallY, insideX0, insideZ0, insideX1, insideZ1,
  insideD, sideRoomW,
  stairLowXRunX, stairHighXRunX, stairHighXWallX, stairClearW,
  planRightKitchenX, firstKitchenW, firstKitchenD, firstFamilyW, firstFamilyD,
  innerWallW, familyInnerWallW, kitchenInnerWallX, familyInnerWallX,
  firstKitchenX, firstFamilyX, entryGapStart, entryGapEnd, familyDoorZ, yardSashSillY,
  stairTurnD, stairTurnStart, stairFirstRunStart, stairOpeningStart, stairBottomLandingD,
  stairBathX, stairBathZ, stairBathW, stairBathD, stairBathDoorW, stairBathDoorX,
  stairBathDoorEndX, stairBathDoorH, stairBathWallH, kitchenYardSashX, yardSashTopY, familyWindowX,
  familyWindowSillY, familyWindowTopY, familyWindowH, entryDoorBaseY, kitchenSinkX, kitchenSinkZ,
  kitchenCounterY, kitchenRearWindowX, kitchenRearWindowSillY, kitchenRearWindowTopY, kitchenRearWindowH, familyRearWindowX,
  familyRearWindowSillY, familyRearWindowTopY, familyRearWindowH, sideDoorZ, sideDoorBaseY, sideDoorTopY,
  secondRoom2X, secondRoom2W, secondCorridorX, secondCorridorZ, secondCorridorW, secondCorridorD,
  secondAtticWallZ, secondAtticZ, secondAtticD, secondRoom1DoorX, secondRoom2DoorX, secondCorridorWindowTopOffset, atticCorridorWallShift, secondCorridorClearD,
  atticVentWindowX, atticSkyWindowX, atticRearWindowTopOffset, atticRoom1RearWindowX, atticRoom2RearWindowX, frontCornerDimX,
  frontCornerDimZ, frontCornerDimTickX, frontCornerDimLabelX, frontCornerDimLabelZ, secondY, frFrontZ,
  frBackZ, frLeftX, frRightX, frSecondWallY, frGableBaseY, frRidgeZ,
  frEaveZFront, frEaveZBack, deckFootprints, firstCeilingY, atticSecondWallTop, atticRidgeZ, deckSurfaceY,
  stairwellFanX, stairwellFanZ, outletLowY, outletCounterY, curtainOutletY,
  atticOutletY
} from './layout.js';
import {
  firstFloorFinishObjects, deckFloorObjects, firstFloorObjects, bathObjects, interiorObjects, firstWallObjects, firstDimObjects, secondFloorObjects, atticExtWallObjects, atticInnerWallObjects, roofObjects, solarObjects, deckObjects,
  썬룸Objects, 썬룸FrameObjects, wallObjects, foldingObjects, extrasObjects,
  outletObjects, atticOutletObjects, hedgeObjects, fenceObjects, foundationObjects, matFoundationHouseObjects, matFoundationFullObjects,
  foundationDimObjects, footprintObjects, planObjects, dimObjects,
  planOnlyDimObjects, hedgeDimObjects, gapDimObjects, s2FootprintObjects, s2FoundationObjects, s2DimObjects, s2Wall1Objects, s2Wall2Objects, s2Wall3Objects, s2Ecu3Objects, s2Stair2Objects, s2StairLowA, s2StairMidA, s2StairLowB, s2StairMidB, s2StairUpB, s2Floor1Objects, s2Floor2Objects, s2Floor3Objects, s2LiftObjects, s2Roof3Objects, s2Solar3Objects, s2FurnitureObjects, s2SinkObjects, s2StoveObjects, s2Fan1Objects, s2Fan2Objects, siteBaseObjects, deckStairFrameObjects,
  stairObjects, stairCoreObjects, stairWallObjects, kitchenInnerWallObjects, familyInnerWallObjects,
} from './groups.js';
import './styles.css';

// DOM 셸 + scene/camera/renderer/controls 싱글톤은 ./scene.js에서 import(거기서 1회 초기화).
// 렌더 가시성 그룹 배열(floorFinishObjects 등)은 ./groups.js에서 import — 빌더가 push, applyVisibility가 visible 제어.

// 재질(materials)은 ./materials.js 단일 출처에서 import — 색·골조재·텍스처재 전부 그쪽에서 정의.

scene.add(new THREE.HemisphereLight(0xffffff, 0xc4b49a, 2.1));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(5, 9, -6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0001;
sun.shadow.normalBias = 0.035;
sun.shadow.camera.left = -10;
sun.shadow.camera.right = 10;
sun.shadow.camera.top = 10;
sun.shadow.camera.bottom = -10;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 24;
scene.add(sun);

function gableEndWallWithWindow({
  x,
  z,
  d,
  y,
  rise,
  thickness = 0.08,
  mat,
  windowZ,
  windowW,
  windowBottomY,
  windowH,
  sashSide = 1
}) {
  const z0 = z;
  const z1 = z + d;
  const zMid = z + d / 2;
  const y0 = y;
  const y1 = y + rise;
  const halfD = d / 2;
  const windowZ0 = windowZ - windowW / 2;
  const windowZ1 = windowZ + windowW / 2;
  const windowTopY = windowBottomY + windowH;
  const topAt = (itemZ) => y0 + rise * Math.max(0, 1 - Math.abs(itemZ - zMid) / halfD);
  const zAtHeight = (itemY, side) => {
    const t = Math.max(0, Math.min(1, (itemY - y0) / rise));
    return zMid + side * halfD * (1 - t);
  };
  const leftAtBottom = zAtHeight(windowBottomY, -1);
  const rightAtBottom = zAtHeight(windowBottomY, 1);

  yzWallPrism({
    x,
    thickness,
    mat,
    points: [
      [z0, y0],
      [z1, y0],
      [rightAtBottom, windowBottomY],
      [leftAtBottom, windowBottomY]
    ]
  });
  yzWallPrism({
    x,
    thickness,
    mat,
    points: [
      [leftAtBottom, windowBottomY],
      [windowZ0, windowBottomY],
      [windowZ0, topAt(windowZ0)]
    ]
  });
  yzWallPrism({
    x,
    thickness,
    mat,
    points: [
      [windowZ1, windowBottomY],
      [rightAtBottom, windowBottomY],
      [windowZ1, topAt(windowZ1)]
    ]
  });
  yzWallPrism({
    x,
    thickness,
    mat,
    points: [
      [windowZ0, windowTopY],
      [windowZ1, windowTopY],
      [windowZ1, topAt(windowZ1)],
      [zMid, y1],
      [windowZ0, topAt(windowZ0)]
    ]
  });

  gableEndWallThicknessCap({ x0: x, x1: x + thickness, z0, zMid, z1, y0, y1, mat: materials.wallTop });
  sideSash(x + (sashSide > 0 ? thickness + 0.04 : 0), windowZ0, windowW, windowBottomY, windowH);
}

// 창 없는 통짜 박공 삼각벽(외벽 창 제거용)
function gableEndWallSolid({ x, z, d, y, rise, thickness = 0.08, mat }) {
  const z0 = z, z1 = z + d, zMid = z + d / 2, y0 = y, y1 = y + rise;
  yzWallPrism({ x, thickness, mat, points: [[z0, y0], [z1, y0], [zMid, y1]] });
  gableEndWallThicknessCap({ x0: x, x1: x + thickness, z0, zMid, z1, y0, y1, mat: materials.wallTop });
}

function roofRiseAtZ(z) {
  const ridgeZ = buildingFrontZ + buildingD / 2;
  const halfDepth = buildingD / 2;
  return roofSlopeTan * Math.max(0, halfDepth - Math.abs(z - ridgeZ));
}

function gableLongWallX({ x, z, d, y, baseH, thickness = 0.08, mat }) {
  const x0 = x;
  const x1 = x + thickness;
  const z0 = z;
  const z1 = z + d;
  const ridgeZ = buildingFrontZ + buildingD / 2;
  const topStops = [z0];
  if (ridgeZ > z0 && ridgeZ < z1) topStops.push(ridgeZ);
  topStops.push(z1);

  const profile = [
    [z0, y],
    [z1, y],
    ...topStops.reverse().map((itemZ) => [itemZ, y + baseH + roofRiseAtZ(itemZ)])
  ];
  const vertices = [];
  for (const [itemZ, itemY] of profile) vertices.push(x0, itemY, itemZ);
  for (const [itemZ, itemY] of profile) vertices.push(x1, itemY, itemZ);

  const n = profile.length;
  const indices = [];
  for (let i = 1; i < n - 1; i += 1) indices.push(0, i, i + 1);
  for (let i = 1; i < n - 1; i += 1) indices.push(n, n + i + 1, n + i);
  for (let i = 0; i < n; i += 1) {
    const next = (i + 1) % n;
    indices.push(i, next, n + next, i, n + next, n + i);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  const faceIndexCount = (n - 2) * 3;
  geometry.clearGroups();
  geometry.addGroup(0, faceIndexCount * 2, 0);
  geometry.addGroup(faceIndexCount * 2, n * 6, 1);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, [mat, materials.wallSide]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  addGeometryEdges(mesh);
  wallEndThicknessFace({
    x,
    z: z0,
    y,
    topY: y + baseH + roofRiseAtZ(z0),
    thickness,
    mat: materials.wallTop,
    offset: -0.006
  });
  wallEndThicknessFace({
    x,
    z: z1,
    y,
    topY: y + baseH + roofRiseAtZ(z1),
    thickness,
    mat: materials.wallTop,
    offset: 0.006
  });

  const capStops = [z0];
  if (ridgeZ > z0 && ridgeZ < z1) capStops.push(ridgeZ);
  capStops.push(z1);
  for (let i = 0; i < capStops.length - 1; i += 1) {
    const startZ = capStops[i];
    const endZ = capStops[i + 1];
    slopedWallTopCap({
      x,
      z0: startZ,
      z1: endZ,
      y0: y + baseH + roofRiseAtZ(startZ),
      y1: y + baseH + roofRiseAtZ(endZ),
      thickness,
      mat: materials.wallTop
    });
  }

  return mesh;
}


function label(text, x, y, z, group = 'dim') {
  const { bg, size } = LABEL_GROUPS[group] || LABEL_GROUPS.dim;   // 그룹이 배경색·글자크기 결정
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const H = 192;                                                // 캔버스 높이(세로)는 고정 — 월드 높이 불변
  const lines = String(text).split('\n');                      // '\n'으로 여러 줄 지원
  let fontSize = 62;
  const setFont = () => { ctx.font = `800 ${fontSize}px Apple SD Gothic Neo, Noto Sans KR, Arial`; };
  setFont();
  while (fontSize * 1.18 * lines.length > H * 0.92 && fontSize > 30) {   // 줄 수에 맞춰 세로 축소(가로는 캔버스를 늘려 맞춤)
    fontSize -= 2;
    setFont();
  }
  const pad = 40;                                              // 좌우 여백(px) — 글자에 딱 붙지 않게
  const textW = Math.max(...lines.map((l) => ctx.measureText(l).width));
  canvas.width = Math.max(120, Math.ceil(textW + pad * 2));    // 가로폭 = 텍스트 폭 + 여백(고정 768 폐기)
  canvas.height = H;
  setFont();                                                   // 캔버스 리사이즈로 컨텍스트 초기화됨 → 재설정
  // 배경 박스 없음(투명) → 뒤 구조가 안 가려짐. 대신 글자에 외곽선 + 옅은 입체 두께로 어디서나 또렷.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const faceColor = bg.replace(/[\d.]+\)\s*$/, '1)');   // 그룹색을 불투명으로 → 글자 윗면 색(그룹 구분 유지)
  const depth = Math.max(2, Math.round(fontSize * 0.07));   // 입체 두께(px)
  const lineH = fontSize * 1.18;
  const startY = canvas.height / 2 - lineH * (lines.length - 1) / 2;
  const cx = canvas.width / 2;
  lines.forEach((l, i) => {
    const ly = startY + i * lineH;
    for (let d = depth; d >= 1; d -= 1) {            // 옆면(아래·오른쪽으로 밀린 어두운 복제) = 두께
      ctx.fillStyle = '#374151';
      ctx.fillText(l, cx + d, ly + d);
    }
    ctx.lineWidth = Math.max(4, fontSize * 0.16);    // 외곽선 — 배경 없이도 밝/어두운 바탕 모두에서 또렷
    ctx.strokeStyle = '#1f2937';
    ctx.strokeText(l, cx, ly);
    ctx.fillStyle = faceColor;                        // 윗면(그룹색)
    ctx.fillText(l, cx, ly);
  });
  const texture = new THREE.CanvasTexture(canvas);
  const isDim = group === 'dim';   // 치수 라벨은 항상 맨 위에 그려 땅·두부·구조에 안 묻히게(깊이 무시)
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: !isDim, depthWrite: !isDim }));
  sprite.userData.labelGroup = group;   // 라벨 그룹(치수/방/가구/설비/개구부…) 기록 — 층별 라벨 정리에 사용
  if (isDim) sprite.renderOrder = 10;
  const readableSize = Math.max(size, 0.28);
  const worldH = readableSize * 1.2;                           // 세로(월드 높이) — 기존과 동일
  sprite.position.set(x, y, z);
  sprite.scale.set(worldH * (canvas.width / canvas.height), worldH, 1);   // 가로폭만 텍스트 비율에 맞춤
  scene.add(sprite);
  return sprite;
}

function lowWall(x, z, w, d, y = 0.08, h = 0.7, mat = materials.wall) {
  return box({ x, z, w, d, y, h, mat });
}

// ★라벨 그룹★ — 그룹별 배경색(bg) + 글자(스프라이트) 크기(size)를 한 곳에서 통일 관리.
//   크기·색을 바꾸려면 해당 그룹의 size/bg만 고치면 그 그룹 전체에 적용된다.
// 라벨 글자 크기 = 단일 표준(LABEL_SIZE). 종류(치수·방·가구·설비·개구부·구조)는 배경색으로만 구분하고,
// 폰트 크기는 모두 이 한 값을 쓴다. 크기를 바꾸려면 여기 한 곳만 고친다.
const LABEL_SIZE = 0.50;
const LABEL_GROUPS = {
  dim:       { bg: 'rgba(255,255,255,0.88)', size: LABEL_SIZE },   // 치수
  room:      { bg: 'rgba(255,243,196,0.92)', size: LABEL_SIZE },   // 방 이름 — 연노랑
  furniture: { bg: 'rgba(205,227,247,0.92)', size: LABEL_SIZE },   // 가구·집기 — 연파랑
  mep:       { bg: 'rgba(255,224,189,0.92)', size: LABEL_SIZE },   // 설비(전기·수도·냉난방·태양광·배수) — 연주황
  opening:   { bg: 'rgba(213,237,209,0.92)', size: LABEL_SIZE },   // 개구부(문·창) — 연녹
  struct:    { bg: 'rgba(226,226,226,0.92)', size: LABEL_SIZE },   // 구조·마감·사양 — 연회색
};

// 세로(높이) 치수 — 한 모서리에 수직선 + 상·하 틱(X방향) + 라벨. name:'ground'로 프레이밍 제외.
function planYDim(x, z, y0, y1, text, labelDx = -0.55) {
  const lw = 0.025;   // 치수선 굵기 — 가로·세로와 동일
  box({ x: x - lw / 2, z: z - lw / 2, w: lw, d: lw, y: y0, h: y1 - y0, mat: materials.dimension, cast: false, name: 'ground' });
  box({ x: x - 0.13, z: z - lw / 2, w: 0.26, d: lw, y: y0, h: lw, mat: materials.dimension, cast: false, name: 'ground' });
  box({ x: x - 0.13, z: z - lw / 2, w: 0.26, d: lw, y: y1 - lw, h: lw, mat: materials.dimension, cast: false, name: 'ground' });
  label(text, x, y1 + 0.2, z, 'dim');   // 라벨은 수직 치수선 위쪽 끝(y1)에서 가깝게(0.2) — 가로·세로와 동일
}


// ── 시스템 말뚝기초(독립기초) — KC금강컨테이너 주택용 ──────────────────────────
// 통슬래브(매트) 대신 강관 말뚝을 격자로 박고, 두부 헤드 브래킷 위에 스틸 골조가 바로 얹혀
// 볼트로 체결된다(별도 받침 각관 없음). 그 위에 바닥(집)·포세린(데크)이 올라간다.
// 말뚝/두부는 그림자 생략(가벼움).
// 평면(배치도) 가로(x축) 치수 — 가로선 + 양끝 틱 + 라벨. 라벨은 치수선 중앙(x 가운데, z=선 위치), y축으로 살짝 위(0.5).
function planXDim(fixed, a, b, text) {
  const y = 0.012, h = 0.002, lw = 0.025, tick = 0.3;
  box({ x: a, z: fixed - lw / 2, w: b - a, d: lw, y, h, mat: materials.dimension, cast: false, name: 'ground' });   // 가로선
  box({ x: a, z: fixed - tick / 2, w: lw, d: tick, y, h, mat: materials.dimension, cast: false, name: 'ground' });  // a끝 틱
  box({ x: b - lw, z: fixed - tick / 2, w: lw, d: tick, y, h, mat: materials.dimension, cast: false, name: 'ground' });  // b끝 틱
  label(text, (a + b) / 2, 0.2, fixed, 'dim');   // 라벨은 치수선 중앙, y축으로 치수선보다 살짝 위(배경 없으니 가깝게)
}
// 평면(배치도) 세로(z축) 치수 — 가로와 별개. 라벨은 선 위쪽 끝(+Z=화면 상단) 위에. 카드가 땅에 안 박히게 y로 띄움.
function planZDim(fixed, a, b, text) {
  const y = 0.012, h = 0.002, lw = 0.025, tick = 0.3;
  box({ x: fixed - lw / 2, z: a, w: lw, d: b - a, y, h, mat: materials.dimension, cast: false, name: 'ground' });   // 세로선
  box({ x: fixed - tick / 2, z: a, w: tick, d: lw, y, h, mat: materials.dimension, cast: false, name: 'ground' });  // 아래 틱(−Z)
  box({ x: fixed - tick / 2, z: b - lw, w: tick, d: lw, y, h, mat: materials.dimension, cast: false, name: 'ground' });  // 위 틱(+Z)
  label(text, fixed, 0.2, (a + b) / 2, 'dim');   // 라벨은 치수선 중앙(z 가운데, x=선 위치), y축으로 치수선보다 살짝 위(배경 없으니 가깝게)
}

function horizontalWallWithGaps(x, z, w, y, gaps = [], h = 0.7, thickness = 0.08, mat = materials.wall) {
  let cursor = x;
  const sortedGaps = gaps
    .map(([start, end]) => [Math.max(x, start), Math.min(x + w, end)])
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0]);

  for (const [start, end] of sortedGaps) {
    if (start > cursor) lowWall(cursor, z, start - cursor, thickness, y, h, mat);
    cursor = Math.max(cursor, end);
  }
  if (cursor < x + w) lowWall(cursor, z, x + w - cursor, thickness, y, h, mat);
}

function verticalWallWithGaps(x, z, d, y, gaps = [], h = 0.7, thickness = 0.08, mat = materials.wall) {
  let cursor = z;
  const sortedGaps = gaps
    .map(([start, end]) => [Math.max(z, start), Math.min(z + d, end)])
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0]);

  for (const [start, end] of sortedGaps) {
    if (start > cursor) lowWall(x, cursor, thickness, start - cursor, y, h, mat);
    cursor = Math.max(cursor, end);
  }
  if (cursor < z + d) lowWall(x, cursor, thickness, z + d - cursor, y, h, mat);
}

function room({ x, z, w, d, y, mat, text, surfaceH = 0.02 }) {
  box({ x, z, w, d, y: y - surfaceH, h: surfaceH, mat, cast: false });
  if (text) label(text, x + w / 2, y + 0.16, z + d / 2, 'room');   // text 없으면 색면만(라벨은 바닥 토글이 단독으로 담당)
}

function roomText(name, w, d) {
  return `${name} ${fmtDim(w)}x${fmtDim(d)}m`;
}

function interiorDoorHorizontal(x, z, y, w = interiorDoorW, h = interiorDoorH, mat = materials.interiorDoor) {
  box({ x, z: z - 0.03, w, d: 0.06, y, h, mat });
  box({ x: x + w - 0.18, z: z - 0.06, w: 0.05, d: 0.035, y: y + Math.min(1.02, h * 0.58), h: 0.05, mat: materials.handle });
}

function pocketDoorHorizontal(x, z, y, w = interiorDoorW, h = interiorDoorH, slideDir = 1, mat = materials.pocketDoor) {
  const pocketW = w;
  const trackX = slideDir > 0 ? x : x - pocketW;
  const panelX = slideDir > 0 ? x + w + 0.04 : x - pocketW + 0.04;
  const panelW = Math.max(0.12, pocketW - 0.08);
  box({ x: trackX, z: z - 0.055, w: w + pocketW, d: 0.03, y: y + h + 0.03, h: 0.035, mat: materials.entryFrame });
  box({ x: panelX, z: z - 0.035, w: panelW, d: 0.045, y, h, mat });
  box({ x: panelX + (slideDir > 0 ? 0.08 : panelW - 0.13), z: z - 0.065, w: 0.05, d: 0.03, y: y + Math.min(0.95, h * 0.5), h: 0.05, mat: materials.handle });
  box({ x, z: z - 0.065, w, d: 0.02, y: y + 0.08, h: 0.035, mat: materials.openingEdge });
}

function pocketDoorVertical(x, z, y, h = interiorDoorH, slideDir = 1, dw = interiorDoorW, mat = materials.pocketDoor) {
  const pocketD = dw;
  const trackZ = slideDir > 0 ? z : z - pocketD;
  const panelZ = slideDir > 0 ? z + dw + 0.04 : z - pocketD + 0.04;
  const panelD = Math.max(0.12, pocketD - 0.08);
  box({ x: x - 0.055, z: trackZ, w: 0.03, d: dw + pocketD, y: y + h + 0.03, h: 0.035, mat: materials.entryFrame });
  box({ x: x - 0.035, z: panelZ, w: 0.045, d: panelD, y, h, mat });
  box({ x: x - 0.065, z: panelZ + (slideDir > 0 ? 0.08 : panelD - 0.13), w: 0.03, d: 0.05, y: y + Math.min(0.95, h * 0.5), h: 0.05, mat: materials.handle });
  box({ x: x - 0.065, z, w: 0.02, d: dw, y: y + 0.08, h: 0.035, mat: materials.openingEdge });
}

function entryDoor(x, z, outerW, leafW, y) {
  const frameW = (outerW - leafW) / 2;
  const doorH = 2.1;
  const frameH = 2.18;
  box({ x, z: z - 0.02, w: frameW, d: 0.12, y, h: frameH, mat: materials.windowFrame });
  box({ x: x + outerW - frameW, z: z - 0.02, w: frameW, d: 0.12, y, h: frameH, mat: materials.windowFrame });
  box({ x, z: z - 0.02, w: outerW, d: 0.12, y: y + doorH, h: frameH - doorH, mat: materials.windowFrame });
  box({ x: x + frameW, z, w: leafW, d: 0.08, y, h: doorH, mat: materials.windowFrame });   // 문짝 색 = 다른 문·창과 동일(회색)
  box({ x: x + frameW + leafW - 0.18, z: z - 0.035, w: 0.06, d: 0.04, y: y + 1.02, h: 0.06, mat: materials.handle });
}

function frontSash(x, z, w, sillY, h) {
  const frame = 0.05;
  const glassZ = z - 0.035;
  box({ x, z: z - 0.04, w: frame, d: 0.1, y: sillY, h, mat: materials.windowFrame });
  box({ x: x + w - frame, z: z - 0.04, w: frame, d: 0.1, y: sillY, h, mat: materials.windowFrame });
  box({ x, z: z - 0.04, w, d: 0.1, y: sillY, h: frame, mat: materials.windowFrame });
  box({ x, z: z - 0.04, w, d: 0.1, y: sillY + h - frame, h: frame, mat: materials.windowFrame });
  box({ x: x + w / 2 - frame / 2, z: z - 0.04, w: frame, d: 0.1, y: sillY, h, mat: materials.windowFrame });
  box({ x: x + frame, z: glassZ, w: w - frame * 2, d: 0.04, y: sillY + frame, h: h - frame * 2, mat: materials.glass });
}

// 정면 픽스창(X스팬·-Z면) — 미들바 없는 단일 고정 유리. 비개폐(픽스).
function frontFixSash(x, z, w, sillY, h) {
  const frame = 0.05, glassZ = z - 0.035;
  box({ x, z: z - 0.04, w: frame, d: 0.1, y: sillY, h, mat: materials.windowFrame });                    // 좌 세로틀
  box({ x: x + w - frame, z: z - 0.04, w: frame, d: 0.1, y: sillY, h, mat: materials.windowFrame });      // 우 세로틀
  box({ x, z: z - 0.04, w, d: 0.1, y: sillY, h: frame, mat: materials.windowFrame });                     // 하부틀
  box({ x, z: z - 0.04, w, d: 0.1, y: sillY + h - frame, h: frame, mat: materials.windowFrame });         // 상부틀
  box({ x: x + frame, z: glassZ, w: w - frame * 2, d: 0.04, y: sillY + frame, h: h - frame * 2, mat: materials.glass });   // 단일 유리
}

// 정면/배면 프로젝트(어닝)창 — X스팬·±Z면. 상부 경첩·하부 바깥으로 밀림. outZ = 외부 방향(+1: 뒤 高Z 바깥, -1: 앞 低Z 바깥)
function frontAwningSash(x, z, w, sillY, h, outZ) {
  const frame = 0.05, F = materials.windowFrame;
  box({ x, z: z - 0.04, w: frame, d: 0.1, y: sillY, h, mat: F });                    // 좌 세로틀
  box({ x: x + w - frame, z: z - 0.04, w: frame, d: 0.1, y: sillY, h, mat: F });      // 우 세로틀
  box({ x, z: z - 0.04, w, d: 0.1, y: sillY, h: frame, mat: F });                     // 하부틀
  box({ x, z: z - 0.04, w, d: 0.1, y: sillY + h - frame, h: frame, mat: F });         // 상부틀
  // 여는 유리짝 — 상부(경첩) 고정, 하부가 바깥(outZ·Z)으로 젖혀짐. 상단 모서리 기준 X축 회전으로 어닝 개방 표현.
  const a = 0.35, paneW = w - frame * 2, paneH = h - frame * 2, topY = sillY + h - frame, xc = x + w / 2, zc = z - 0.015;
  const pane = new THREE.Mesh(new THREE.BoxGeometry(paneW, paneH, 0.04), materials.glass);
  pane.position.set(xc, topY - Math.cos(a) * paneH / 2, zc + outZ * Math.sin(a) * paneH / 2);
  pane.rotation.x = -outZ * a;
  scene.add(pane);
  box({ x: xc - 0.025, z: (z - 0.04) - outZ * 0.06, w: 0.05, d: 0.04, y: sillY + frame + 0.03, h: 0.14, mat: materials.handle });   // 하부 실내측 손잡이
}

// 주방 전면: 독일식 수평밀착 슬라이딩 시스템도어(출입 가능) — VATON(제이제이시스템) AL PS 타입.
// 굵은 80mm 프로파일 + 2짝 미닫이 만남대(인터록) + 하부 레일 + 세로 손잡이로 일반창과 구분.
function germanSlidingDoor(x, z, w, sillY, h) {
  const frame = 0.08;            // 80mm 독일식 알루미늄 프로파일
  const fd = 0.13;               // 프레임 깊이
  const fz = z - 0.05;
  const glassZ = z - 0.04;
  const F = materials.windowFrame;
  box({ x, z: fz, w: frame, d: fd, y: sillY, h, mat: F });                            // 좌 세로 프레임
  box({ x: x + w - frame, z: fz, w: frame, d: fd, y: sillY, h, mat: F });             // 우 세로 프레임
  box({ x, z: fz, w, d: fd, y: sillY + h - frame, h: frame, mat: F });                // 상부
  box({ x, z: fz, w, d: fd, y: sillY, h: frame * 1.4, mat: F });                      // 하부 레일(출입 문턱)
  const cx = x + w / 2;
  box({ x: cx - frame, z: glassZ + 0.015, w: frame, d: 0.05, y: sillY + frame, h: h - frame * 2, mat: F });  // 앞짝 만남대
  box({ x: cx, z: glassZ - 0.025, w: frame, d: 0.05, y: sillY + frame, h: h - frame * 2, mat: F });          // 뒷짝 만남대
  box({ x: x + frame, z: glassZ + 0.015, w: w / 2 - frame * 1.5, d: 0.045, y: sillY + frame, h: h - frame * 2, mat: materials.glass });  // 좌(앞짝) 유리
  box({ x: cx + frame, z: glassZ - 0.025, w: w / 2 - frame * 1.5, d: 0.045, y: sillY + frame, h: h - frame * 2, mat: materials.glass });  // 우(뒷짝) 유리
  box({ x: cx - frame - 0.04, z: glassZ + 0.07, w: 0.04, d: 0.04, y: sillY + h * 0.4, h: h * 0.22, mat: materials.handle });             // 세로 손잡이
}

function sideSash(x, z, d, sillY, h) {
  const frame = 0.05;
  const frameX = x - 0.04;
  const glassX = x - 0.035;
  box({ x: frameX, z, w: 0.1, d: frame, y: sillY, h, mat: materials.windowFrame });
  box({ x: frameX, z: z + d - frame, w: 0.1, d: frame, y: sillY, h, mat: materials.windowFrame });
  box({ x: frameX, z, w: 0.1, d, y: sillY, h: frame, mat: materials.windowFrame });
  box({ x: frameX, z, w: 0.1, d, y: sillY + h - frame, h: frame, mat: materials.windowFrame });
  box({ x: frameX, z: z + d / 2 - frame / 2, w: 0.1, d: frame, y: sillY, h, mat: materials.windowFrame });
  box({ x: glassX, z: z + frame, w: 0.04, d: d - frame * 2, y: sillY + frame, h: h - frame * 2, mat: materials.glass });
}

// 프로젝트(어닝) 시스템창 — Z스팬·+X(안방쪽 高X)면. 상부 경첩·하부 바깥으로 밀어 열림. 창짝을 바깥으로 젖혀 어닝 형태 표현 + 하부 실내측 손잡이.
function awningSash(x, z, d, sillY, h) {
  const frame = 0.05, frameX = x - 0.04;
  box({ x: frameX, z, w: 0.1, d: frame, y: sillY, h, mat: materials.windowFrame });                  // 앞 세로틀(低Z)
  box({ x: frameX, z: z + d - frame, w: 0.1, d: frame, y: sillY, h, mat: materials.windowFrame });    // 뒤 세로틀(高Z)
  box({ x: frameX, z, w: 0.1, d, y: sillY, h: frame, mat: materials.windowFrame });                   // 하부틀
  box({ x: frameX, z, w: 0.1, d, y: sillY + h - frame, h: frame, mat: materials.windowFrame });       // 상부틀
  // 여는 유리짝 — 상부(경첩) 고정, 하부가 바깥(+X)으로 젖혀짐. 상단 모서리 기준 Z축 회전으로 어닝 개방 표현.
  const a = 0.35, paneH = h - frame * 2, paneD = d - frame * 2, topY = sillY + h - frame, zc = z + d / 2;
  const pane = new THREE.Mesh(new THREE.BoxGeometry(0.04, paneH, paneD), materials.glass);
  pane.position.set(frameX + Math.sin(a) * paneH / 2, topY - Math.cos(a) * paneH / 2, zc);
  pane.rotation.z = a;
  scene.add(pane);
  box({ x: x - 0.12, z: z + frame + 0.02, w: 0.05, d: 0.04, y: sillY + frame + 0.03, h: 0.14, mat: materials.handle });   // 하부 실내측 손잡이(밀어 열기)
}

// 안방 측면(도로측, 고X 벽) 작은 출입문 — JJ시스템(VATON) AL 시스템도어 SD 여닫이형. 바닥까지 내려오는 유리 leaf + 하부 문턱 + 손잡이.
function sideDoor(x, z, d, baseY, h) {
  const frame = 0.06;
  const frameX = x - 0.04;
  const glassX = x - 0.035;
  const F = materials.windowFrame;
  box({ x: frameX, z, w: 0.1, d: frame, y: baseY, h, mat: F });                       // 앞(저Z) 세로 프레임
  box({ x: frameX, z: z + d - frame, w: 0.1, d: frame, y: baseY, h, mat: F });        // 뒤(고Z) 세로 프레임
  box({ x: frameX, z, w: 0.1, d, y: baseY + h - frame, h: frame, mat: F });           // 상부
  box({ x: frameX, z, w: 0.1, d, y: baseY, h: frame, mat: F });                       // 하부 문턱
  box({ x: glassX, z: z + frame, w: 0.04, d: d - frame * 2, y: baseY + frame, h: h - frame * 2, mat: materials.glass });   // 유리 leaf
  box({ x: glassX - 0.02, z: z + d - 0.2, w: 0.05, d: 0.04, y: baseY + h * 0.42, h: h * 0.16, mat: materials.handle });    // 세로 손잡이
}

function captureSecond(fn) {
  const start = scene.children.length;
  const result = fn();
  secondFloorObjects.push(...scene.children.slice(start));
  return result;
}

// Orientation contract for every future edit and answer:
// Use the plan as displayed with the entrance/deck at the bottom.
// Plan-left = family room. Plan-right = kitchen+kitchen.
// Bottom = front/yard/entrance. Top = rear wall/stair-back wall.
// Do not reinterpret plan-left/plan-right by camera angle or viewer position.

// ═══════════ 주요 제원 (여기서 치수 수정 — 단위 m) ═══════════
//   건물 외형
//   기초·바닥
//   시스템 말뚝기초(독립기초, KC금강컨테이너 주택용) — 강관 말뚝 + 두부 헤드 브래킷(골조 볼트 체결)

// 부지(흙색 지면): 집 너비 방향(X) 9.95m × 정면 방향(Z) 9m. 집을 X로 중앙 배치, 뒤로 1m 여유.
// siteBaseObjects는 ./groups.js에 정의됨(여기선 빌더가 push만).
siteBaseObjects.push(box({ x: lotX0, z: lotZ0, w: lotW, d: lotD, h: 0.002, mat: materials.site, cast: false, name: 'ground' }));   // 평면(높이 0 취급) — 깜빡임만 막는 2mm
// 도로(접도) — 부지 바깥. 우측면 + 후면 ㄱ자.
siteBaseObjects.push(box({ x: lotX1, z: lotZ0, w: roadW, d: lotD, h: 0.002, mat: materials.road, cast: false, name: 'ground' }));          // 우측 도로(부지 밖)
siteBaseObjects.push(box({ x: lotX0, z: lotZ1, w: lotW + roadW, d: roadW, h: 0.002, mat: materials.road, cast: false, name: 'ground' }));   // 후면 도로(부지 밖, 모서리 연결)

// 경계 — 측백담장(측백 생울타리)·옆집담장(우측 콘크리트) 두 토글로 분리.
// 옆집담장(경계벽) — 대지 오른쪽(주방 쪽, 낮은 X) 바깥. 폭 0.2m × 높이 fenceH, 경계선 전체 길이.
const fenceMat = new THREE.MeshLambertMaterial({ color: 0xb0a692 });
const fenceH = 1.1;   // 옆집담장 높이 — 그리기·메모 단일 출처
const hedgeH = 1.5;   // 측백담장(생울타리) 높이 — 그리기·메모 단일 출처
fenceObjects.push(box({ x: lotX0 - 0.2, z: lotZ0, w: 0.2, d: lotD, y: groundTopY, h: fenceH, mat: fenceMat, name: 'ground' }));
// 측백나무 생울타리(상록) — 뒤쪽 + 왼쪽(안방 쪽, 높은 X) 경계 안쪽 50cm.
hedgeObjects.push(box({ x: lotX0, z: lotZ1 - hedgeThickness, w: lotW, d: hedgeThickness, y: groundTopY, h: hedgeH, mat: materials.hedge, name: 'ground' }));   // 후면 생울타리
hedgeObjects.push(box({ x: lotX1 - hedgeThickness, z: lotZ0, w: hedgeThickness, d: lotD, y: groundTopY, h: hedgeH, mat: materials.hedge, name: 'ground' }));   // 왼쪽(안방) 생울타리

// 입체 집 기초(시스템말뚝 + 두부)는 1층 벽·실 좌표가 정의된 뒤(아래)에서 만든다 — 하중 경로에 말뚝 정렬.
// 기초 가로/세로 길이 치수 — 제거(라벨 정리)

// 1층 바닥(바닥 시공 10cm) — 골조(장선) 위 마감층. '1층 바닥' 토글(firstFloorFinishObjects). 1층 벽·계단·가구는 이 위(firstFloorY)에서 시작.
captureInto(firstFloorFinishObjects, () => {
  box({ x: 0, z: buildingFrontZ, w: buildingW, d: buildingD, y: foundationTopY, h: floorFinishH, mat: materials.floorFinish });
});

// 1층 외벽(반투명) — 방 바닥 테두리선(집 발자국 0~buildingW / buildingFrontZ~+buildingD)에 맞춰 바깥면을 두고, 막대는 모두 안쪽으로만(밖으로 안 튀어나옴). 두께 0.3·높이 2.4·firstFloorY에서 시작. 1층·다락·지붕 단계 표시.
{
  const wt = exteriorWall, wh = firstWallHeight + secondFloorThickness, z0 = buildingFrontZ, z1 = buildingFrontZ + buildingD;   // 두께·높이를 단일 상수에서 읽음. 높이는 다락 바닥 슬래브 두께만큼 더 올려 1층↔다락 외벽이 끊기지 않고 하나로 이어지게(슬래브 옆면을 감쌈)
  const wy = firstWallY + 0.003;   // 바닥 윗면과 정확히 같은 평면(z-fighting 떨림)을 피해 3mm 띄움 — 바깥면은 테두리에 그대로 맞춤
  const W = materials.firstExtWall;
  // 앞(−Z) 외벽 — 정면 중앙에 방화출입문 개구부(표준 외짝 방화문+문틀: 폭 1.0m·높이 2.1m). 좌·우 벽 + 상부 인방으로 나누고 가운데를 비움.
  const ow = 1.0, oh = 2.1, ox0 = (buildingW - ow) / 2, ox1 = ox0 + ow;   // 개구 폭/높이, 중앙 정렬
  firstWallObjects.push(box({ x: 0, z: z0, w: ox0, d: wt, y: wy, h: wh, mat: W }));                     // 앞 외벽 — 개구 왼쪽(주방측)
  firstWallObjects.push(box({ x: ox1, z: z0, w: buildingW - ox1, d: wt, y: wy, h: wh, mat: W }));       // 앞 외벽 — 개구 오른쪽(안방측)
  firstWallObjects.push(box({ x: ox0, z: z0, w: ow, d: wt, y: wy + oh, h: wh - oh, mat: W }));          // 앞 외벽 — 개구 상부 인방(문 위)
  firstWallObjects.push(box({ x: 0, z: z1 - wt, w: buildingW, d: wt, y: wy, h: wh, mat: W }));          // 뒤(+Z) 외벽 — 바깥면 z=z1
  firstWallObjects.push(box({ x: 0, z: z0 + wt, w: wt, d: buildingD - 2 * wt, y: wy, h: wh, mat: W }));         // 우(주방, x=0) 외벽 — 바깥면 x=0
  firstWallObjects.push(box({ x: buildingW - wt, z: z0 + wt, w: wt, d: buildingD - 2 * wt, y: wy, h: wh, mat: W })); // 좌(안방, x=buildingW) 외벽 — 바깥면 x=buildingW
  // 계단실 양쪽 세로 내벽 2개(주방|계단실·계단실|안방)는 여기서 그리지 않음 — buildStairWalls()에서 동적으로 그림.
  //   윗면이 다락 바닥 밑면(loftY - 30cm)에 맞도록 계단 높이에 따라 벽 높이가 변하기 때문(계단·1층 공유).
}

// 1층 방 크기 라벨 — 단일 경로(roomText '이름 크기')로만 표기. 주방·안방은 drawStairAnno의 방 라벨이 담당하므로
// 여기선 그리지 않는다(중복 제거). 방 라벨이 없던 '계단실'만 같은 방 이름 라벨 방식으로 추가한다. 1층·다락·지붕 단계 표시.
let firstStairRoomLabel, firstBathDimLabel, firstBathClearFill;   // 계단실 라벨 ↔ 화장실 안목(자홍 바닥칠+안목치수)(applyVisibility에서 전환)
captureInto(firstDimObjects, () => {
  const ly = firstFloorY + 0.4;                                // 라벨 높이(방바닥 위)
  const cx = stairLowXRunX, cw = stairHighXWallX - stairLowXRunX;   // 계단실 안목: 주방측 벽면(stairLowXRunX)~안방측 벽면(stairHighXWallX) — 실제 계단·다락 슬래브와 동일 격자
  const zSplit = insideZ0 + stairBottomLandingD;               // 계단 앞(여유)↔계단실(계단 있는 공간) 경계 = 계단 시작선
  const y0 = firstFloorY + floorOverlayLift;
  // 화장실 안목(벽 뺀 실바닥) — 계단쪽 분리벽·앞 문벽(각 interiorWall) 뺀 안쪽 사각형
  const bcX = stairBathX + interiorWall, bcW = stairBathW - interiorWall;
  const bcZ = stairBathZ + interiorWall, bcD = stairBathD - interiorWall;
  // 계단 앞 사용가능 공간 색면(연녹) — 앞쪽 여유(계단 없는 공간)
  box({ x: cx, z: insideZ0, w: cw, d: stairBottomLandingD, y: y0, h: floorSurfaceH, mat: materials.stairFront, cast: false });
  // 계단실 색면(연주황) — 계단이 있는 공간(계단 시작선~뒤벽)
  box({ x: cx, z: zSplit, w: cw, d: insideZ1 - zSplit, y: y0, h: floorSurfaceH, mat: materials.stairRoom, cast: false });
  label(roomText('계단 앞', cw, stairBottomLandingD), cx + cw / 2, ly, insideZ0 + stairBottomLandingD / 2, 'room');
  firstStairRoomLabel = label(roomText('계단실', cw, insideZ1 - zSplit), cx + cw / 2, ly, (zSplit + insideZ1) / 2, 'room');
  // 바닥+계단 동시 표시 땐 계단실 라벨 대신 화장실 안목(자홍 바닥칠 + 안목치수)을 보여줌(applyVisibility에서 전환)
  firstBathClearFill = box({ x: bcX, z: bcZ, w: bcW, d: bcD, y: y0 + 0.006, h: floorSurfaceH, mat: materials.bathClear, cast: false });
  firstBathDimLabel = label(roomText('화장실', bcW, bcD), bcX + bcW / 2, ly, bcZ + bcD / 2, 'room');
});

const _firstFloorStart = scene.children.length;   // 여기부터 다락 빌드 직전까지가 1층 그룹

// 1F measured plan. Dimensions are in meters within an 8.5m x 4.0m footprint.
//   1층 층고·벽 두께 (제원)
// World x is mirrored in the front camera. With the entrance at the bottom,
// plan-left/family is the larger x side and plan-right/kitchen is the smaller x side.
//   다락·지붕 (제원)
const roofSlopeTan = Math.tan(THREE.MathUtils.degToRad(roofSlopeDeg));
const gableRise = roofSlopeTan * (buildingD / 2);
// 안방 전면은 출입창이 아니라 일반 창문 — 통상 규격: 폭 1800, 창대(sill) 바닥+900, 상단은 현관·주방 도어와 동일선
// 싱크대 창: 상판+백스플래시 위에서 시작, 윗선은 전면 도어와 동일선(2.18), 싱크대 위로 센터링
// 안방 측면(도로측) 전면쪽 작은 출입문 — 800×2100 여닫이. 바깥 작은 공간으로 출입.
const secondAtticFrontWallH = secondWallHeight + roofRiseAtZ(secondAtticWallZ);
// 다락 정면 복도쪽: 기존 창 2개 제거 → 중앙 환기창 1개
// 계단 픽스창 — 1층에서 올라갈 때 첫 구간(저-X 런)은 후면(+Z)을 보고 오르므로, 후면에 둬야 올라가며 하늘이 보임
// 높이 치수 라벨은 세로 치수 막대(frontCornerDim*)가 있는 평면 왼쪽(도로 쪽, 높은 X) 뒤쪽
// 모서리 바깥에 나란히 붙여, 치수 막대와 라벨이 같은 모서리에 모이게 한다.

// 1층 높이는 바닥재(20cm)를 포함 — 기초 상단(바닥재 하단)부터 천장까지 2.8m
planYDim(frontCornerDimX, frontCornerDimZ, foundationTopY, firstWallY + firstWallHeight, `1층 높이 ${fmtDim((firstWallY + firstWallHeight) - foundationTopY)}m`);

room({ x: firstKitchenX, z: insideZ0, w: firstKitchenW, d: firstKitchenD, y: firstFloorY + floorOverlayLift, mat: materials.kitchen });   // 색면만 — 주방 크기 라벨은 '바닥' 토글이 단독 표시(중복 제거)
// 주방 벽걸이 에어컨(실내기) — 오른쪽(서측) 외벽 x=insideX0 안쪽, 천장 가까이. 실외기는 통풍 좋은 곳에 별도.
{
  const acW = 0.85, acH = 0.30, acD = 0.22;
  const acZ = insideZ0 + 1.2;
  const acY = firstFloorY + firstWallHeight - 0.45;
  box({ x: insideX0, z: acZ, w: acD, d: acW, y: acY, h: acH, mat: materials.wall });                                           // 본체(흰색)
  box({ x: insideX0 + 0.05, z: acZ + 0.06, w: acD - 0.04, d: acW - 0.12, y: acY - 0.015, h: 0.025, mat: materials.openingEdge });   // 하부 토출 슬릿
  label('벽걸이 에어컨', insideX0 + 0.55, acY + 0.17, acZ + acW / 2, 'mep');
}
// 에어컨 실외기 — 후면(뒤) 주방(서)쪽 코너, 측백 향해(+Z) 토출. 배관은 서측 외벽 따라 뒤로.
{
  const esW = 0.8, esD = 0.35, esH = 0.6;
  const esX = 0.3;                          // 서(주방)측 코너
  const esZ = buildingBackZ + 0.1;          // 집 뒤 벽 바로 뒤(집~측백 사이)
  box({ x: -0.04, z: 1.0, w: 0.06, d: (esZ + 0.1) - 1.0, y: groundTopY + 0.35, h: 0.06, mat: materials.guard });        // 배관(서측 외벽 따라 뒤로)
  box({ x: esX, z: esZ, w: esW, d: esD, y: groundTopY, h: esH, mat: materials.guard });                                 // 실외기 본체
  box({ x: esX + 0.15, z: esZ + esD - 0.02, w: esW - 0.3, d: 0.025, y: groundTopY + 0.13, h: 0.42, mat: materials.openingEdge });   // 토출 팬그릴(측백쪽 +Z)
  label('에어컨 실외기', esX + esW / 2, groundTopY + esH + 0.28, esZ + 0.2, 'mep');
}
captureInto(interiorObjects, () => {   // 주방 싱크대 — '실내' 토글
  box({ x: kitchenSinkX, z: kitchenSinkZ, w: kitchenSinkW, d: kitchenSinkD, y: firstFloorY, h: kitchenSinkH, mat: materials.sinkCabinet });
  box({ x: kitchenSinkX, z: kitchenSinkZ, w: kitchenSinkW, d: kitchenSinkD, y: firstFloorY + kitchenSinkH, h: 0.05, mat: materials.counter });
  box({ x: kitchenSinkX + 0.62, z: kitchenSinkZ + 0.16, w: 0.72, d: 0.32, y: firstFloorY + kitchenSinkH + 0.05, h: 0.04, mat: materials.sinkBasin });
  box({ x: kitchenSinkX + 1.03, z: kitchenSinkZ + 0.08, w: 0.08, d: 0.08, y: firstFloorY + kitchenSinkH + 0.09, h: 0.24, mat: materials.entryFrame });
  label(`싱크대 ${fmtDim(kitchenSinkW)}x${fmtDim(kitchenSinkD)}m`, kitchenSinkX + kitchenSinkW / 2, firstFloorY + 1.2, kitchenSinkZ + kitchenSinkD / 2, 'furniture');
});
// 인덕션 쿡탑 — 싱크대 우측. 가스레인지·LPG 대체(전기 일원화, 가스통 불필요). '실내' 토글.
captureInto(interiorObjects, () => {
  const ckX = kitchenSinkX + 1.5, ckZ = kitchenSinkZ + 0.08, ckW = 0.55, ckD = 0.45;
  box({ x: ckX, z: ckZ, w: ckW, d: ckD, y: kitchenCounterY, h: 0.012, mat: materials.openingEdge });                         // 인덕션 검정 유리 상판
  box({ x: ckX + 0.09, z: ckZ + 0.11, w: 0.18, d: 0.18, y: kitchenCounterY + 0.012, h: 0.004, mat: materials.guard });      // 화구1
  box({ x: ckX + 0.33, z: ckZ + 0.16, w: 0.14, d: 0.14, y: kitchenCounterY + 0.012, h: 0.004, mat: materials.guard });      // 화구2
  label('인덕션', ckX + ckW / 2, kitchenCounterY + 0.22, ckZ + ckD / 2, 'furniture');
});
// 한문형 냉장고(311L, 0.545×0.689×1.70) — s2 것과 동일. 싱크대 끝(高X)과 계단 사이 뒤 외벽에 등붙임. 문=주방(低Z)쪽. '실내' 토글.
captureInto(interiorObjects, () => {
  const rW = 0.545, rD = 0.689, rH = 1.70;                    // 폭(X)·깊이(Z, 앞으로 돌출)·높이
  const rBackZ = insideZ1;                                    // 뒤 외벽 안쪽면 등붙임
  const rFrontZ = rBackZ - rD;                                // 냉장고 앞면 z(주방쪽 -Z)
  const gapX0 = kitchenSinkX + kitchenSinkW;                  // 싱크대 끝(高X)
  const rx0 = gapX0 + (stairLowXRunX - gapX0 - rW) / 2;       // 싱크대~계단 사이 가운데
  box({ x: rx0, z: rFrontZ, w: rW, d: rD, y: firstFloorY, h: rH, mat: materials.fridge });   // 본체
  // 문(2도어 상부냉동) — 문 면=주방(低Z)쪽, 경첩=계단(高X)쪽, 손잡이=싱크대(低X)쪽 → 문은 주방으로 열림
  const rdt = 0.02, rfzH = rH * 0.30;
  box({ x: rx0 + 0.005, z: rFrontZ - rdt, w: rW - 0.01, d: rdt, y: firstFloorY + rH - rfzH, h: rfzH - 0.01, mat: materials.fridgeDoor });   // 상부 냉동실 문
  box({ x: rx0 + 0.005, z: rFrontZ - rdt, w: rW - 0.01, d: rdt, y: firstFloorY + 0.01, h: rH - rfzH - 0.02, mat: materials.fridgeDoor });   // 하부 냉장실 문
  const rhx = rx0 + 0.07;                                     // 손잡이 x(싱크대 低X = 경첩 반대편)
  box({ x: rhx, z: rFrontZ - rdt - 0.03, w: 0.04, d: 0.03, y: firstFloorY + rH - rfzH - 0.42, h: 0.4, mat: materials.guard });   // 하부 문 손잡이
  box({ x: rhx, z: rFrontZ - rdt - 0.03, w: 0.04, d: 0.03, y: firstFloorY + rH - rfzH + 0.05, h: 0.28, mat: materials.guard });  // 상부 문 손잡이
  label(`한문형 냉장고 311L · ${fmtDim(rW)}×${fmtDim(rD)}`, rx0 + rW / 2, firstFloorY + rH + 0.15, rFrontZ + rD / 2, 'furniture');
});
box({ x: stairLowXRunX, z: insideZ0, w: stairHighXWallX - stairLowXRunX, d: stairBottomLandingD, y: firstFloorY + floorOverlayLift - floorSurfaceH, h: floorSurfaceH, mat: materials.stairFront, cast: false });
// '계단 앞' 크기 라벨은 '바닥' 토글이 단독 표시(중복 제거) — 여기선 색면만.
box({ x: stairLowXRunX - interiorWall, z: insideZ0, w: interiorWall, d: stairBottomLandingD, y: firstFloorY + floorOverlayLift - floorSurfaceH, h: floorSurfaceH, mat: materials.stairFront, cast: false });
// '화장실' 토글 = 기구 3개(세면대·변기·온수기) + 185cm 사람. 바닥칠·안목치수는 '바닥+계단'(계단실) 화면에서 표시(중복 제거).
captureInto(bathObjects, () => {
  const wcCenterX = stairBathX + interiorWall + (stairBathW - interiorWall) / 2;   // 화장실 안목(계단쪽 내벽 뺀 실바닥) X 중앙
  // 세면대 — 안방측(高X) 벽 등붙임. 문 안여닫이 스윙(앞 0.7m)을 피해 그 뒤(高Z)에 설치
  {
    const vaW = 0.5, vaD = 0.34;                                    // 폭(Z, 벽 따라)·깊이(X, 벽에서 실내로)
    const vaX = stairBathX + stairBathW - vaD;                      // 高X 벽 안쪽면 등붙임
    const vaZ = stairBathZ + 0.85;                                  // 문 스윙(앞 0.7m) 뒤
    box({ x: vaX, z: vaZ, w: vaD, d: vaW, y: firstFloorY, h: 0.72, mat: materials.vanity });                                       // 캐비닛
    box({ x: vaX + 0.06, z: vaZ + 0.13, w: vaD - 0.12, d: vaW - 0.24, y: firstFloorY + 0.72, h: 0.04, mat: materials.sinkBasin }); // 볼
    box({ x: vaX + vaD - 0.07, z: vaZ + vaW / 2 - 0.02, w: 0.04, d: 0.04, y: firstFloorY + 0.76, h: 0.2, mat: materials.entryFrame });   // 벽수전(高X 벽쪽)
  }
  // 양변기 — 맨 안쪽(뒤 외벽) 안목 X 중앙. 물탱크 뒤벽, 착석은 앞(천장 높은 방향)
  box({ x: wcCenterX - 0.44 / 2, z: stairBathZ + stairBathD - 0.62, w: 0.44, d: 0.5, y: firstFloorY, h: 0.34, mat: materials.toilet });
  box({ x: wcCenterX - 0.48 / 2, z: stairBathZ + stairBathD - 0.14, w: 0.48, d: 0.1, y: firstFloorY, h: 0.58, mat: materials.toilet });
  // 전기온수기 경동나비엔 ESW560-50WH(50L) — 가로형 벽걸이 711×385×385mm. 문(높이 2.0m) 위 빈 공간에 눕혀 설치
  {
    const hL = 0.711, hR = 0.385 / 2;                              // 실제 제원(길이·반지름)
    const heater = new THREE.Mesh(
      new THREE.CylinderGeometry(hR, hR, hL, 24),
      new THREE.MeshLambertMaterial({ color: 0x9fd0e0 }),
    );
    heater.rotation.z = Math.PI / 2;                              // 원통 축을 X(가로)로 눕힘
    heater.position.set(wcCenterX, firstFloorY + 2.03 + hR, stairBathZ + interiorWall + hR);   // 문 위, 앞벽 안쪽면 등붙임(+Z 돌출)
    scene.add(heater);
  }
  // 185cm 사람 — 사선 천장(앞 높고 뒤 낮음) 중 머리 안 닿는 앞쪽 구역(천장 ≥1.94m)에 세움. 문 스윙·기구 비켜 섬
  {
    const ph = 1.85, headR = 0.12, bodyH = ph - headR * 2, bodyR = 0.16;
    const px = stairBathX + 0.35, pz = stairBathZ + 1.05;
    const pMat = new THREE.MeshLambertMaterial({ color: 0x8aa0b4 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(bodyR, bodyR, bodyH, 20), pMat);
    body.position.set(px, firstFloorY + bodyH / 2, pz);
    scene.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(headR, 20, 14), pMat);
    head.position.set(px, firstFloorY + bodyH + headR, pz);
    scene.add(head);
    label('185cm', px, firstFloorY + ph + 0.14, pz, 'mep');
  }
});
// 계단하부 WC 배기구 — '화장실' 토글(기구 3개)에서 분리해 1층 그룹으로 수집. 무창 WC 기계환기: 천장 배기팬 + 덕트로 뒤쪽 외벽에서 외부 환기캡으로 배기.
{
  const ventX = stairBathX + stairBathW / 2;
  // WC 천장은 계단 밑 경사면 → 뒤쪽 실사용 천장선은 바닥+약 1.3m(벽 절반). 배기팬은 그 천장선 바로 아래(WC 실내 공기 안)여야 실제로 배기됨.
  const capY = firstFloorY + 1.08;
  box({ x: ventX - 0.12, z: insideZ1 - 0.06, w: 0.24, d: 0.06, y: capY, h: 0.22, mat: materials.guard });           // 실내 벽붙이 배기팬 그릴(천장선 바로 아래)
  box({ x: ventX - 0.05, z: insideZ1 - 0.11, w: 0.1, d: 0.06, y: capY + 0.06, h: 0.1, mat: materials.guard });      // 팬 흡입구
  box({ x: ventX - 0.13, z: buildingBackZ, w: 0.26, d: 0.05, y: capY, h: 0.22, mat: materials.entryFrame });          // 뒤 외벽 외부 환기캡(방수 후드)
  box({ x: ventX - 0.14, z: buildingBackZ + 0.03, w: 0.28, d: 0.06, y: capY - 0.03, h: 0.05, mat: materials.entryFrame });  // 하단 빗물막이 립
  label('화장실 배기구', ventX, capY + 0.34, buildingBackZ + 0.28, 'mep');
}
box({ x: stairLowXRunX, z: stairOpeningStart, w: stairHighXWallX - stairLowXRunX, d: insideZ1 - stairOpeningStart, y: firstFloorY + floorOverlayLift - floorSurfaceH, h: floorSurfaceH, mat: materials.stair, cast: false });
room({ x: firstFamilyX, z: insideZ0, w: firstFamilyW, d: firstFamilyD, y: firstFloorY + floorOverlayLift, mat: materials.bed });   // 색면만 — 안방 크기 라벨은 '바닥' 토글이 단독 표시(중복 제거)

// 1F walls
horizontalWallWithGaps(0, buildingFrontZ, buildingW, firstWallY, [
  [kitchenYardSashX, kitchenYardSashX + yardSashW],
  [entryGapStart, entryGapEnd]
], firstWallHeight, exteriorWall, materials.exteriorWall);   // 안방 전면창 개구 제거(통벽), 문 개구 2개(주방 도어·현관)만 유지
// 주방 전면 도어 상부 인방 + 현관 상부 인방(안방창 창대·인방 삭제)
lowWall(kitchenYardSashX, buildingFrontZ, yardSashW, exteriorWall, yardSashTopY, firstWallY + firstWallHeight - yardSashTopY, materials.exteriorWall);
lowWall(entryGapStart, buildingFrontZ, entryFrameOuterW, exteriorWall, entryDoorBaseY + entryFrameH, firstWallY + firstWallHeight - entryDoorBaseY - entryFrameH, materials.exteriorWall);
// 후면 벽 — 싱크대창·안방 후면창 제거로 통벽(솔리드)
horizontalWallWithGaps(0, insideZ1, buildingW, firstWallY, [], firstWallHeight, exteriorWall, materials.exteriorWall);
lowWall(0, buildingFrontZ, exteriorWall, buildingD, firstWallY, firstWallHeight, materials.exteriorWall);
verticalWallWithGaps(insideX1, buildingFrontZ, buildingD, firstWallY, [
  [sideDoorZ, sideDoorZ + sideDoorW]
], firstWallHeight, exteriorWall, materials.exteriorWall);
lowWall(insideX1, sideDoorZ, exteriorWall, sideDoorW, sideDoorTopY, firstWallY + firstWallHeight - sideDoorTopY, materials.exteriorWall);   // 측면 출입문 위(인방)
// (안방-계단실 벽은 계단 단계 공유 벽[stairWallObjects]이 1층에 누적되므로 여기서 따로 그리지 않음 — 그 벽에 안방 출입문 개구가 포함됨)
// (계단하부 WC 앞벽·출입문은 계단 본체와 함께 drawStairCore()에서 그림 → 계단 단계부터 보임. 여기선 안 그림)
germanSlidingDoor(kitchenYardSashX, buildingFrontZ - 0.04, yardSashW, yardSashSillY, yardSashH); // 주방 전면 독일식 시스템도어(출입·현관 높이 2.1m)
label('주방 독일식 시스템도어 VATON PS', kitchenYardSashX + yardSashW / 2, yardSashTopY + 0.14, buildingFrontZ - 0.35, 'opening');
entryDoor(entryGapStart, buildingFrontZ - 0.04, entryFrameOuterW, entryDoorLeafW, entryDoorBaseY);
// (외벽 창짝 제거 — 안방 전면창·싱크대 후면창·안방 후면창 삭제. 문 3개[주방 도어·현관·측면 출입문]는 유지)
sideDoor(insideX1 + 0.04, sideDoorZ, sideDoorW, sideDoorBaseY, sideDoorH);   // 안방 측면 출입문(전면쪽, 도로측 창 대신)
label('안방 측면 출입문', insideX1 + 0.5, sideDoorTopY + 0.05, sideDoorZ + sideDoorW / 2, 'opening');
// 안방 포켓도어(문짝+개구)는 벽과 같은 '계단' 그룹에서 단일 출처로 그림 → buildStairWalls()의 familyInnerWallObjects 블록. 여기선 안 그림.

// 안방 침대 2.0 x 2.0m — 뒤쪽 벽(높은 Z) + 동쪽(도로측, 높은 X) 코너. 머리맡=동쪽(높은 X) 벽. '실내' 토글.
captureInto(interiorObjects, () => {
  const bedW = 2.0;
  const bedD = 2.0;
  const bedX = insideX1 - bedW;        // 왼쪽(높은 X) 외벽에 붙임
  const bedZ = insideZ1 - bedD;        // 뒤쪽 외벽에 붙임
  const frameMat = new THREE.MeshLambertMaterial({ color: 0x8a6b4a });    // 원목 프레임
  const mattressMat = new THREE.MeshLambertMaterial({ color: 0xf3eee3 }); // 매트리스
  const duvetMat = new THREE.MeshLambertMaterial({ color: 0xb9cbe0 });    // 이불
  const pillowMat = new THREE.MeshLambertMaterial({ color: 0xffffff });   // 베개
  const frameH = 0.3;
  const mattressH = 0.2;
  box({ x: bedX, z: bedZ, w: bedW, d: bedD, y: firstFloorY, h: frameH, mat: frameMat });                            // 프레임
  box({ x: insideX1 - 0.08, z: bedZ, w: 0.08, d: bedD, y: firstFloorY, h: frameH + 0.45, mat: frameMat });          // 헤드보드(동쪽=높은 X 벽)
  box({ x: bedX + 0.05, z: bedZ + 0.05, w: bedW - 0.13, d: bedD - 0.1, y: firstFloorY + frameH, h: mattressH, mat: mattressMat });
  box({ x: bedX + 0.05, z: bedZ + 0.05, w: (bedW - 0.13) * 0.6, d: bedD - 0.1, y: firstFloorY + frameH + mattressH, h: 0.06, mat: duvetMat });  // 이불(발치=서쪽~중간)
  for (const pz of [bedZ + 0.18, bedZ + bedD - 0.18 - 0.7]) {              // 베개 2개(머리맡=동쪽/높은 X)
    box({ x: insideX1 - 0.5, z: pz, w: 0.4, d: 0.7, y: firstFloorY + frameH + mattressH, h: 0.12, mat: pillowMat });
  }
  label('침대 2.0x2.0m', bedX + bedW / 2, firstFloorY + 1.0, bedZ + bedD / 2, 'furniture');
});

// 1층 창 전동커튼 레일(펠멧) — 창 상부 안쪽에 슬림 박스. 전동커튼 설치를 전제(콘센트는 별도).
const curtainBoxMat = new THREE.MeshLambertMaterial({ color: 0xe7e1d4 });
function curtainRail({ x, z, len, headY, axis = 'x', sign = 1 }) {
  const boxH = 0.12;
  const proj = 0.14;                  // 실내로 돌출
  const ceil = firstWallY + firstWallHeight;
  const y = Math.min(headY + 0.02, ceil - 0.02) - boxH;
  if (axis === 'x') {                 // 전/후면 벽(창이 x를 따라). sign: 실내 방향(+z/-z)
    box({ x: x - 0.05, z: sign > 0 ? z : z - proj, w: len + 0.1, d: proj, y, h: boxH, mat: curtainBoxMat, cast: false, receive: false });
  } else {                            // 측벽(창이 z를 따라). sign: 실내 방향(+x/-x)
    box({ x: sign > 0 ? x : x - proj, z: z - 0.05, w: proj, d: len + 0.1, y, h: boxH, mat: curtainBoxMat, cast: false, receive: false });
  }
}
curtainRail({ x: kitchenYardSashX, z: insideZ0, len: yardSashW, headY: yardSashTopY, axis: 'x', sign: 1 });           // 주방 전면 출입창(도어 — 유지)
// (창 제거된 안방 전면창·주방 후면창·안방 후면창의 커튼레일도 함께 삭제 — 통벽에 붕 뜨지 않게)

{ const _sep = new Set([...bathObjects, ...interiorObjects]); firstFloorObjects.push(...scene.children.slice(_firstFloorStart).filter((o) => !_sep.has(o))); }   // 1층 골조·실내 그룹 확정(화장실·실내가구는 bathObjects·interiorObjects로 분리)

// 다락 = 3개 토글로 분리: 실제 다락바닥(secondFloorObjects) · 다락 외벽(atticExtWallObjects) · 다락 내벽(atticInnerWallObjects).
// 공유 좌표는 여기서 한 번 계산해 세 그룹이 공유(단일 출처).
{
  // 2F measured plan. The stair arrival continues left/right as a front corridor, with attic rooms behind it.
  const slabMat = new THREE.MeshLambertMaterial({ color: 0xf6f6f6, transparent: true, opacity: 0.94 });
  const secondWallY = secondY + secondFloorThickness;
  const gableBaseY = secondWallY + secondWallHeight;
  const atticRidgeZ = buildingFrontZ + buildingD / 2;
  const atticPeakH = secondWallHeight + gableRise;
  const atticStairDoorX = stairHighXRunX + (stairRunW - interiorDoorW) / 2;

  // ── 실제 다락 바닥 — 바닥 슬래브 + 방(복도·다락방1·2) ──────────────────────────
  captureInto(secondFloorObjects, () => {
    box({ x: planRightKitchenX, z: insideZ0, w: stairLowXRunX - planRightKitchenX, d: insideD, y: secondY, h: secondFloorThickness, mat: slabMat });   // 주방측 슬래브 → 주방 벽면(stairLowXRunX)까지(내벽 밑까지 채워 틈 제거)
    box({ x: stairLowXRunX, z: insideZ0, w: stairHighXWallX - stairLowXRunX, d: secondCorridorD, y: secondY, h: secondFloorThickness, mat: slabMat });   // 복도 슬래브 주방측 = 주방 벽면(stairLowXRunX), 안방측 = 안방 벽면(stairHighXWallX) — 뒤 다락바닥·1층과 정렬
    box({ x: stairHighXWallX, z: insideZ0, w: insideX1 - stairHighXWallX, d: insideD, y: secondY, h: secondFloorThickness, mat: slabMat });   // 안방측 슬래브 → 안방 내력벽 계단면(stairHighXWallX)부터(내벽 밑까지 채워 틈 제거)
    room({ x: secondCorridorX, z: secondCorridorZ, w: secondCorridorW, d: secondCorridorClearD, y: secondWallY + floorSurfaceH, mat: materials.landing, text: roomText('다락 복도', secondCorridorW, secondCorridorClearD) });   // 안목 = 복도쪽 벽 확장분 반영(단일 출처)
    const loftRoom1W = firstKitchenW - interiorWall;   // 다락방1 안목 = 슬래브에서 계단실 쪽 벽두께(10cm) 제외
    room({ x: planRightKitchenX, z: secondAtticZ, w: loftRoom1W, d: secondAtticD, y: secondWallY + floorSurfaceH + 0.004, mat: materials.bed, text: roomText('다락방1', loftRoom1W, secondAtticD) });
    room({ x: secondRoom2X, z: secondAtticZ, w: secondRoom2W, d: secondAtticD, y: secondWallY + floorSurfaceH + 0.004, mat: materials.bed, text: roomText('다락방2', secondRoom2W, secondAtticD) });
    // s2 3층 매트리스·베개를 복사해 다락방1·2 바닥에 표시 — 재질·두께·규격 s2와 동일. 베개(머리맡)=집 뒤쪽(高Z).
    {
      const mfy = secondWallY + floorSurfaceH + 0.01, mH = 0.1;
      const mMat = new THREE.MeshLambertMaterial({ color: 0xe8dcc0 });   // 매트리스(베이지) — s2와 동일
      const pMat = new THREE.MeshLambertMaterial({ color: 0xfaf6ef });   // 베개 — s2와 동일
      const mW = 1.8, mL = 2.0;                                          // 더블 2.0×1.8 (s2 게스트룸1과 동일)
      const bed = (roomX0, roomW, toHighX) => {
        const x0 = toHighX ? roomX0 + roomW - mW : roomX0;               // 방 바깥쪽 옆벽에 붙임(다락방1=低X·다락방2=高X)
        const z0 = insideZ1 - mL;                                        // 머리=뒤(高Z)·발치=앞(低Z)
        box({ x: x0, z: z0, w: mW, d: mL, y: mfy, h: mH, mat: mMat });
        label('매트리스 2.0×1.8m', x0 + mW / 2, mfy + mH + 0.15, z0 + mL / 2, 'furniture');
        for (const cx of [x0 + 0.5, x0 + 1.3]) box({ x: cx - 0.35, z: insideZ1 - 0.07 - 0.4, w: 0.7, d: 0.4, y: mfy + mH, h: 0.1, mat: pMat });   // 베개 2개·머리맡=뒤(高Z)
      };
      bed(planRightKitchenX, loftRoom1W, false);   // 다락방1 — 주방쪽 옆벽(低X)에 붙임
      bed(secondRoom2X, secondRoom2W, true);       // 다락방2 — 안방쪽 옆벽(高X)에 붙임
    }
  });

  // ── 다락 외벽 — 앞·뒤 무릎벽 + 창 + 좌우 박공벽 + 벽높이·용마루 치수 ──────────────
  captureInto(atticExtWallObjects, () => {
    planYDim(frontCornerDimX, frontCornerDimZ, secondWallY, secondWallY + secondWallHeight, `다락 벽높이 ${fmtDim(secondWallHeight)}m`);
    // 용마루(뾰족) 높이 — 왼쪽(도로측) 벽, 박공 꼭짓점(z=용마루 중앙)
    planYDim(frontCornerDimX, atticRidgeZ, secondWallY, secondWallY + atticPeakH, `용마루 ${fmtDim(atticPeakH)}m`);
    // 2F exterior walls use a 1.15m loft eave wall; the gable rise is calculated from a 33 degree roof pitch.
    horizontalWallWithGaps(0, buildingFrontZ, buildingW, secondWallY, [], secondWallHeight, exteriorWall, materials.exteriorWall);   // 앞 무릎벽 — 환기창 제거로 통벽
    horizontalWallWithGaps(0, insideZ1, buildingW, secondWallY, [], secondWallHeight, exteriorWall, materials.exteriorWall);   // 뒤 무릎벽 — 다락방 후면창·계단 픽스창 제거로 통벽
    lowWall(0, buildingFrontZ, exteriorWall, buildingD, secondWallY, secondWallHeight, materials.exteriorWall);
    lowWall(insideX1, buildingFrontZ, exteriorWall, buildingD, secondWallY, secondWallHeight, materials.exteriorWall);
    gableEndWallSolid({ x: 0, z: buildingFrontZ, d: buildingD, y: gableBaseY, rise: gableRise, thickness: exteriorWall, mat: materials.exteriorWall });        // 좌 박공벽 — 창 제거
    gableEndWallSolid({ x: insideX1, z: buildingFrontZ, d: buildingD, y: gableBaseY, rise: gableRise, thickness: exteriorWall, mat: materials.exteriorWall });  // 우 박공벽 — 창 제거
  });

  // ── 다락 내벽 — 다락방 칸막이 + 문 + 다락 입구 가로벽 + 다락방 벽높이 치수 ──────────
  captureInto(atticInnerWallObjects, () => {
    // 복도쪽 칸막이(다락방1·2 앞벽·다락 입구 가로벽)는 10→15cm, 다락방/계단쪽 면 고정하고 복도(−Z)쪽으로 5cm 확장. 세로 측벽(다락방|계단실)은 대상 아님.
    const corrWallT = atticCorridorWallT;                       // 단일 출처(constants) — 복도 안목·라벨과 함께 파생
    const corrWallZ = secondAtticWallZ - atticCorridorWallShift;
    const corrWallMat = materials.stairInnerWall;               // 복도쪽 벽 = 반투명 흰색(계단실 내벽과 동일)
    // 다락방 문이 있는 벽 높이 — 칸막이(secondAtticWallZ) 위치, 왼쪽 벽
    planYDim(frontCornerDimX, secondAtticWallZ, secondWallY, secondWallY + secondAtticFrontWallH, `다락방 벽 ${fmtDim(secondAtticFrontWallH)}m`);
    // 2F attic partitions follow the same gable profile as the exterior walls.
    horizontalWallWithGaps(planRightKitchenX, corrWallZ, firstKitchenW, secondWallY, [
      [secondRoom1DoorX, secondRoom1DoorX + interiorDoorW]
    ], secondAtticFrontWallH, corrWallT, corrWallMat);
    horizontalWallWithGaps(secondRoom2X, corrWallZ, secondRoom2W, secondWallY, [
      [secondRoom2DoorX, secondRoom2DoorX + interiorDoorW]
    ], secondAtticFrontWallH, corrWallT, corrWallMat);
    gableLongWallX({ x: stairLowXRunX - interiorWall, z: secondAtticWallZ, d: insideZ1 - secondAtticWallZ, y: secondWallY, baseH: secondWallHeight, thickness: interiorWall, mat: materials.wall });   // 다락방1|계단실 내벽(10cm) — 계단실(하부런 모서리)에 딱 붙임. 방 안목은 벽 안쪽부터
    gableLongWallX({ x: secondRoom2X - interiorWall, z: secondAtticWallZ, d: insideZ1 - secondAtticWallZ, y: secondWallY, baseH: secondWallHeight, thickness: interiorWall, mat: materials.wall });   // 다락방2|계단실 내벽(10cm) — 계단실면(stairHighXWallX)에 딱 붙임. 방 안목은 벽 안쪽(secondRoom2X)부터
    pocketDoorHorizontal(secondRoom1DoorX, secondAtticWallZ, secondWallY, interiorDoorW, secondAtticDoorH, -1);
    pocketDoorHorizontal(secondRoom2DoorX, secondAtticWallZ, secondWallY, interiorDoorW, secondAtticDoorH, 1);
    lowWall(secondRoom1DoorX, corrWallZ, interiorDoorW, corrWallT, secondWallY + secondAtticDoorH, secondAtticFrontWallH - secondAtticDoorH, corrWallMat);   // 다락방1 문 위 인방
    lowWall(secondRoom2DoorX, corrWallZ, interiorDoorW, corrWallT, secondWallY + secondAtticDoorH, secondAtticFrontWallH - secondAtticDoorH, corrWallMat);   // 다락방2 문 위 인방
    // 다락 입구 — 계단 개구부를 가로벽(문 구멍 1개)으로 막음. 닫으면 다락 전체가 1층과 분리(1층 개방 유지). 칸막이와 같은 Z선·높이라 벽이 한 줄로 이어짐.
    horizontalWallWithGaps(stairLowXRunX, corrWallZ, stairHighXWallX - stairLowXRunX, secondWallY, [[atticStairDoorX, atticStairDoorX + interiorDoorW]], secondAtticFrontWallH, corrWallT, corrWallMat);   // 입구 가로벽 주방측 = 주방 벽면(stairLowXRunX)에 정렬
    lowWall(atticStairDoorX, corrWallZ, interiorDoorW, corrWallT, secondWallY + secondAtticDoorH, secondAtticFrontWallH - secondAtticDoorH, corrWallMat);   // 문 위 인방(개구부 위 막음)
    interiorDoorHorizontal(atticStairDoorX, stairOpeningStart, secondWallY, interiorDoorW, secondAtticDoorH);
    label('다락 입구 단열문', atticStairDoorX + interiorDoorW / 2, secondWallY + 1.0, stairOpeningStart - 0.5, 'opening');
  });
}

{
  const roofSideOverhang = 0.4;
  const roofEaveOverhang = 0.6;
  const secondWallTop = secondY + secondFloorThickness + secondWallHeight;
  // 지붕 밑면(roofSlab는 eaveY/ridgeY가 윗면)이 다락 벽 윗면(secondWallTop)에 얹히도록 두께(roofThickness)만큼 올림
  const ridgeY = secondWallTop + gableRise + roofThickness;
  const outerEaveY = secondWallTop - roofSlopeTan * roofEaveOverhang + roofThickness;
  const ridgeZ = buildingFrontZ + buildingD / 2;
  // 다락 위 지붕 구성: 단열 260T(다락 천장 단열층) + 그 위 징크 마감
  materials.roofInsul = new THREE.MeshLambertMaterial({ color: 0xe6d9b8, side: THREE.DoubleSide });   // 단열재 260T
  const zincFin = 0.05;   // 징크 마감 두께
  const eaveZF = buildingFrontZ - roofEaveOverhang;
  const eaveZB = buildingBackZ + roofEaveOverhang;
  roofObjects.push(
    // 단열재 260T
    roofSlab({ eaveZ: eaveZF, ridgeZ, eaveY: outerEaveY, ridgeY, sideOverhang: roofSideOverhang, thickness: roofThickness, mat: materials.roofInsul }),
    roofSlab({ eaveZ: eaveZB, ridgeZ, eaveY: outerEaveY, ridgeY, sideOverhang: roofSideOverhang, thickness: roofThickness, mat: materials.roofInsul }),
    // 징크 마감(단열 위)
    roofSlab({ eaveZ: eaveZF, ridgeZ, eaveY: outerEaveY + zincFin, ridgeY: ridgeY + zincFin, sideOverhang: roofSideOverhang, thickness: zincFin, mat: materials.roof }),
    roofSlab({ eaveZ: eaveZB, ridgeZ, eaveY: outerEaveY + zincFin, ridgeY: ridgeY + zincFin, sideOverhang: roofSideOverhang, thickness: zincFin, mat: materials.roof })
  );
  // 지붕 경사 각도 표기 — 전면 경사면 중턱 위에 띄움(+지붕 뷰에서만)
  const eaveZ = buildingFrontZ - roofEaveOverhang;
  const slopeMidZ = (eaveZ + ridgeZ) / 2;
  const slopeMidY = (outerEaveY + ridgeY) / 2;
  roofObjects.push(label('지붕: 단열 260T + 리얼징크(티타늄아연, 갈바륨 아님) · 경사 33°', buildingW / 2, slopeMidY + 0.55, slopeMidZ, 'struct'));
  // 태양광 패널은 뒤쪽(남측) 지붕 별도 블록에서 그림 — 여기선 눈막이용 헬퍼만 둠.
  materials.snowGuard = new THREE.MeshLambertMaterial({ color: 0xaeb7bf });    // 눈막이 금속
  const backEaveZ = buildingBackZ + roofEaveOverhang;
  const onSlope = (ez, t) => ({ z: ez + t * (ridgeZ - ez), y: outerEaveY + t * (ridgeY - outerEaveY) });   // t=0 처마 → 1 용마루

  // ── 눈막이(스노우가드) 가로바 — 처마 근처, 양 슬로프 각 2줄(쌓인 눈이 한꺼번에 미끄러지지 않게) ──
  const snowGuard = (ez, t) => {
    const p = onSlope(ez, t);
    roofObjects.push(box({ x: -roofSideOverhang, z: p.z - 0.025, w: buildingW + roofSideOverhang * 2, d: 0.05, y: p.y + 0.11, h: 0.05, mat: materials.snowGuard, cast: false }));   // 가로 파이프바
    const n = 7;
    for (let i = 0; i <= n; i += 1) {
      const bx = -roofSideOverhang + (buildingW + roofSideOverhang * 2) * (i / n);
      roofObjects.push(box({ x: bx - 0.02, z: p.z - 0.02, w: 0.04, d: 0.04, y: p.y + 0.02, h: 0.11, mat: materials.snowGuard, cast: false }));   // 브래킷
    }
  };
  snowGuard(backEaveZ, 0.12); snowGuard(backEaveZ, 0.22);   // 남측(집 뒤) — 태양광 아래(z≈3.1) ~ 처마쪽
  snowGuard(eaveZ, 0.12); snowGuard(eaveZ, 0.22);           // 북측(정면) — 처마쪽 2줄

  // ── 처마 물받이(홈통) + 도로측(고-X) 우수관 ──
  materials.gutter = new THREE.MeshLambertMaterial({ color: 0x9aa1a8 });
  const eaveTopY = outerEaveY + zincFin;
  [eaveZ, backEaveZ].forEach((ez) => {
    const out = ez < ridgeZ ? -1 : 1;            // 처마 바깥 방향(Z)
    const gz = ez + out * 0.06;
    const gutterY = eaveTopY - 0.17;
    roofObjects.push(box({ x: -roofSideOverhang - 0.05, z: gz - 0.065, w: buildingW + roofSideOverhang * 2 + 0.1, d: 0.13, y: gutterY, h: 0.12, mat: materials.gutter, cast: false }));   // 처마홈통(가로)
    // 우수관: 고-X(도로측) 벽 모서리를 타고 수직으로. 처마홈통 → 벽 모서리 연결관 → 지면까지.
    const cornerZ = ez < ridgeZ ? buildingFrontZ : buildingBackZ;   // 고-X 벽의 앞/뒤 모서리
    const dx = buildingW + 0.04;                                    // 고-X 벽 바깥면(8.54)
    roofObjects.push(box({ x: dx, z: Math.min(gz, cornerZ) - 0.04, w: 0.08, d: Math.abs(cornerZ - gz) + 0.08, y: gutterY - 0.05, h: 0.08, mat: materials.gutter, cast: false }));   // 처마→벽모서리 연결관
    roofObjects.push(box({ x: dx, z: cornerZ - 0.04, w: 0.08, d: 0.08, y: groundTopY, h: (gutterY - 0.03) - groundTopY, mat: materials.gutter, cast: false }));   // 수직 우수관(벽 모서리)
  });
  roofObjects.push(label('우수관(도로측 벽 모서리)', buildingW + 0.5, 1.9, buildingBackZ, 'mep'));
}

// ───────────────────────────────────────────────────────────────────────────
// 스틸 골조((주)세움스틸하우스) — 1층/다락/지붕 골조. "골조" 단일 토글로 일괄 제어.
// 부재는 아연도금 경량형강 느낌의 얇은 회색 박스로 표현(스터드·트랙·장선·서까래·용마루).
// ───────────────────────────────────────────────────────────────────────────
// 골조 재질(woodFrame·deckFloorFrame)은 ./materials.js에 정의됨.

function captureInto(arr, fn) {
  const s = scene.children.length;
  fn();
  arr.push(...scene.children.slice(s));
}

// ── 집 기초·골조 레이아웃 — 방 기초는 외벽 중심선에서 1.5m 간격(방당 3.0m), 계단실=남는 중앙(대칭) ──
//   ※ 1층 벽 좌표(stairHighXWallX 등)는 차차 맞춤. 지금은 바닥·기초·골조에만 이 레이아웃을 반영.
const 주방InnerWallX = frLeftX + FRAME_ROOM_W;    // 주방|계단실 벽 = 3.0
const 안방InnerWallX = frRightX - FRAME_ROOM_W;   // 계단실|안방 벽 = 5.2
// 말뚝 X열을 하중 경로에 맞춤: 좌·우 외벽 + 방 중앙(1.5m) + 계단실 양 벽. 계단실 가운데 2.3m는 무주(양 벽 말뚝이 받음).
const housePileXs = [
  frLeftX,             // 좌 외벽(주방쪽) 0.1
  frLeftX + 1.5,       // 주방 중앙말뚝 1.6
  주방InnerWallX,       // 주방|계단실 벽 3.1
  안방InnerWallX,       // 계단실|안방 벽 5.2
  frRightX - 1.5,      // 안방 중앙말뚝 6.9
  frRightX,            // 우 외벽(안방쪽) 8.4
];
// 집 말뚝기초(시스템말뚝) — 제거됨(사용자 요청). 매트기초만 기초로 남김.

// 집 골조(철골/목조 프레임)는 설계도 기반으로 시공사가 시공 — 모델에선 그리지 않는다.

// 캠핑 가구 재질 & 헬퍼 — 스노우피크 IGT 테이블, 반고 햄프턴 DLX 캠핑의자
const igtMetalMat = new THREE.MeshLambertMaterial({ color: 0x8f969d });   // IGT 알루미늄 프레임/다리
const igtTopMat = new THREE.MeshLambertMaterial({ color: 0xc7a06a });     // 대나무 상판
const chairFrameMat = new THREE.MeshLambertMaterial({ color: 0x23282f }); // 의자 프레임

// 스노우피크 IGT: bays칸 + 한쪽 사이드테이블(sideTableSide). 긴 방향은 X축.
function igtTable({ cx, cz, bays, sideTableSide = 1, height = 0.66, baseY = groundTopY }) {
  const bayW = 0.27;
  const depth = 0.40;
  const frame = 0.025;
  const topT = 0.03;
  const legT = 0.03;
  const innerW = bays * bayW;
  const topW = innerW + 2 * frame;
  const topBottomY = baseY + height - topT;
  const halfLong = topW / 2;
  const halfShort = depth / 2;
  const T = (lx, lz, w, d, y, h, mat) => box({ x: cx + lx - w / 2, z: cz + lz - d / 2, w, d, y, h, mat });
  for (let i = 0; i < bays; i += 1) {  // 대나무 칸 상판
    T(-innerW / 2 + bayW * (i + 0.5), 0, bayW - 0.03, depth - 2 * frame, topBottomY + 0.002, topT, igtTopMat);
  }
  T(0, -halfShort + frame / 2, topW, frame, topBottomY, topT, igtMetalMat);  // 긴 변 프레임
  T(0, halfShort - frame / 2, topW, frame, topBottomY, topT, igtMetalMat);
  for (let i = 0; i <= bays; i += 1) {  // 칸 구분바
    T(-innerW / 2 + bayW * i, 0, frame, depth, topBottomY, topT, igtMetalMat);
  }
  for (const sx of [-halfLong + legT, halfLong - legT]) {  // 다리 4
    for (const sz of [-halfShort + legT, halfShort - legT]) {
      T(sx, sz, legT, legT, baseY, height - topT, igtMetalMat);
    }
  }
  if (sideTableSide !== 0) {  // 사이드테이블(한쪽)
    const stW = 0.30;
    const sgn = Math.sign(sideTableSide);
    const stCx = sgn * (halfLong + stW / 2);
    T(stCx, 0, stW, depth - 0.04, topBottomY, topT, igtTopMat);
    T(stCx, -halfShort + frame / 2, stW, frame, topBottomY, topT, igtMetalMat);
    T(stCx, halfShort - frame / 2, stW, frame, topBottomY, topT, igtMetalMat);
    for (const sz of [-halfShort + legT, halfShort - legT]) {
      T(sgn * (halfLong + stW - legT), sz, legT, legT, baseY, height - topT, igtMetalMat);
    }
  }
}

// 반고 햄프턴 DLX: 높은 등받이 + 팔걸이 폴딩 캠핑의자. faceAngle은 의자 정면(+z) 방향.
function campingChair({ cx, cz, faceAngle = 0, color = 0x47535f, baseY = groundTopY }) {
  const group = new THREE.Group();
  const fabric = new THREE.MeshLambertMaterial({ color });
  const add = (w, h, d, x, y, z, mat, rotX = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (rotX) m.rotation.x = rotX;
    m.castShadow = true;
    m.receiveShadow = false;
    group.add(m);
  };
  const seatY = 0.42;
  add(0.52, 0.08, 0.50, 0, seatY, 0, fabric);                         // 좌판
  add(0.52, 0.60, 0.07, 0, seatY + 0.33, -0.23, fabric, -0.16);       // 높은 등받이(리클라인)
  add(0.06, 0.05, 0.46, -0.27, seatY + 0.22, 0.02, chairFrameMat);    // 팔걸이 좌
  add(0.06, 0.05, 0.46, 0.27, seatY + 0.22, 0.02, chairFrameMat);     // 팔걸이 우
  add(0.05, 0.24, 0.05, -0.27, seatY + 0.10, 0.22, chairFrameMat);    // 팔걸이 앞기둥 좌
  add(0.05, 0.24, 0.05, 0.27, seatY + 0.10, 0.22, chairFrameMat);     // 팔걸이 앞기둥 우
  for (const lx of [-0.23, 0.23]) {
    for (const lz of [-0.20, 0.22]) {
      add(0.045, seatY, 0.045, lx, seatY / 2, lz, chairFrameMat);     // 다리
    }
  }
  group.position.set(cx, baseY, cz);
  group.rotation.y = faceAngle;
  scene.add(group);
}

// 1층 주방 앞 썬룸 — 지붕 길이(전면 돌출) 4m. 지붕 = 리얼징크(불투명).
//  · 데크 상단(집 바닥 높이)에서 시작, 앞단(최저) 기둥 2.4m, 건물쪽은 1층 높이에 부착
//  · 프레임/기둥은 지붕 가장자리에서 20cm 안쪽(3면 세로벽이 이 선에 설치)
//  roofLowX/roofW로 X 범위를 지정해 주방 앞·안방 앞에 같은 형식으로 각각 설치한다.
function 썬룸({ roofLowX, roofW, withFurniture = true, withPostDims = true, withWalls = true, deckDepth = null, postsToGround = false, connectRightX = null, withFan = true, withShortPostDim = false, withFlatFrame = true, withGutter = false, withDownspout = false, withDeck = true, withRoofPanel = true, roofPanelW = null, roofPanelCenterX = null }) {
  const frameInset = 0.2;                      // 가장자리에서 20cm 안쪽
  const beamH = 0.12;
  const beamDrop = 0.04;
  const wallZ = buildingFrontZ;
  const roofSlopeLength = 4.0;                     // 지붕 경사면 길이(실제 지붕면)
  const targetFrontPostH = 2.6;                     // 앞단(최저) 기둥 높이 목표(데크 상단 기준)
  const targetWallPostH = 2.8;                      // 집 벽쪽(건물 부착부) 높이 목표(데크 상단 기준)
  const yAtWall = firstFloorY + targetWallPostH + beamDrop + beamH;  // 건물 부착 높이 = 데크 + 벽쪽높이 + 보
  // 앞단 보 밑면 = 데크 상단 + 기둥높이가 되도록 앞단 지붕높이(yAtFront)를 역산(반복 수렴).
  const targetGlassAtFront = firstFloorY + targetFrontPostH + beamDrop + beamH;
  let yAtFront = targetGlassAtFront;
  for (let i = 0; i < 40; i += 1) {
    const d = yAtWall - yAtFront;
    const run = Math.sqrt(roofSlopeLength * roofSlopeLength - d * d);
    yAtFront = targetGlassAtFront - frameInset * d / run;
  }
  const roofDrop = yAtWall - yAtFront;             // 물매 낙차
  const roofRun = Math.sqrt(roofSlopeLength * roofSlopeLength - roofDrop * roofDrop); // 수평투영 길이(물매 반영)
  const frontZ = wallZ - roofRun;                  // 앞단은 수평투영 거리만큼만 나감
  const roofHighX = roofLowX + roofW;
  const roofCenterX = (roofLowX + roofHighX) / 2;
  const glassYatZ = (z) => yAtWall + (yAtFront - yAtWall) * ((z - wallZ) / (frontZ - wallZ));
  const tilt = Math.atan2(Math.abs(yAtFront - yAtWall), Math.abs(frontZ - wallZ));
  // 썬룸 지붕 = 리얼징크(불투명, 본 지붕과 동일 그래파이트 그레이). 50년·적설·본 지붕 통일로 확정.
  const 썬룸RoofMat = new THREE.MeshLambertMaterial({ color: 0x565c64, side: THREE.DoubleSide });
  const 썬룸Frame = materials.entryFrame;

  // 가시성 그룹 분류용: 이 함수가 scene에 추가하는 모든 객체를 기록해 두고,
  // 데크 바닥/소품(가구)만 따로 표시한 뒤 나머지는 썬룸 구조물로 분류한다.
  const _addStart = scene.children.length;
  const deckLocal = [];      // 데크 바닥·바닥 치수 라벨
  const floorLocal = [];     // 포세린 바닥 → deckFloorObjects('데크 바닥' 토글에서 표시)
  const wallLocal = [];      // 썬룸 외벽(다누몰 자바라) — 별도 토글
  const foldingLocal = [];   // 주방 데크 3면 폴딩도어 — 외벽 대안(상호배타)
  const extrasLocal = [];    // 캠핑 가구(의자 등)
  const foundationLocal = []; // 땅 기둥 시스템말뚝(+두부·라벨) — 기초 그룹으로 분류(썬룸 토글 무관, 기초 뷰에도 표시)
  const frameLocal = [];      // 썬룸 철골 골조(기둥·보·평프레임) — 골조 그룹으로 분류(골조 토글에도 표시)

  // 리얼징크 지붕면(앞으로 물매) — 불투명 금속. 단일 지붕으로 합칠 때 폭/중심을 override해 하나의 패널로.
  const panelLen = Math.hypot(frontZ - wallZ, yAtFront - yAtWall);
  const rpW = (roofPanelW != null) ? roofPanelW : roofW;       // 단일 합치기 시 실제 지붕면 폭
  const rpCx = (roofPanelCenterX != null) ? roofPanelCenterX : roofCenterX;
  if (withRoofPanel) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(rpW, 0.04, panelLen), 썬룸RoofMat);
    panel.position.set(rpCx, (yAtWall + yAtFront) / 2, (wallZ + frontZ) / 2);
    panel.rotation.x = -tilt;
    scene.add(panel);
  }

  // 프레임(지붕 가장자리 20cm 안쪽): 벽측 보 + 앞단 보 + 양측 경사 보
  const fX0 = roofLowX + frameInset;            // = -0.2 (오른쪽 벽선 바깥)
  const fX1 = roofHighX - frameInset;
  const fFrontZ = frontZ + frameInset;
  const fWallZ = wallZ;                          // 벽측은 건물에 부착
  // connectRightX가 지정되면 오른쪽(낮은 X) 프레임을 별도로 두지 않고 이웃 썬룸 프레임선까지 보를 연장한다.
  const beamX0 = (connectRightX != null) ? connectRightX : fX0;
  frameLocal.push(box({ x: beamX0, z: fWallZ - 0.04, w: fX1 - beamX0, d: 0.08, y: glassYatZ(fWallZ) - beamDrop - beamH, h: beamH, mat: 썬룸Frame }));
  frameLocal.push(box({ x: beamX0, z: fFrontZ - 0.04, w: fX1 - beamX0, d: 0.08, y: glassYatZ(fFrontZ) - beamDrop - beamH, h: beamH, mat: 썬룸Frame }));
  const sideLen = Math.hypot(fFrontZ - fWallZ, glassYatZ(fFrontZ) - glassYatZ(fWallZ));
  const sideMidZ = (fWallZ + fFrontZ) / 2;
  const sideMidY = (glassYatZ(fWallZ) + glassYatZ(fFrontZ)) / 2 - beamDrop - beamH / 2;
  const sideXs = (connectRightX != null) ? [fX1 - 0.04] : [fX0 + 0.04, fX1 - 0.04]; // 오른쪽 측면 보 생략
  for (const sx of sideXs) {
    const sideBeam = new THREE.Mesh(new THREE.BoxGeometry(0.08, beamH, sideLen), 썬룸Frame);
    sideBeam.position.set(sx, sideMidY, sideMidZ);
    sideBeam.rotation.x = -tilt;
    sideBeam.castShadow = true;
    sideBeam.receiveShadow = false;
    scene.add(sideBeam);
    frameLocal.push(sideBeam);
  }
  // 렉산(경사 지붕) 프레임은 둘레(테두리) 보만 둔다 — 내부 격자는 두꺼워 내부가 안 보이므로 생략.

  // 지지 기둥(프레임 선 위, 지면~보 밑면).
  //  · 안방(connectRightX): 땅 기둥 3개(앞·측면중앙·집벽쪽) — 모두 건물 외곽선(fX1=8.5) 안쪽 0.1로 인셋(주방 데크 말뚝·집 말뚝열과 정렬, 한 직선). 정면 3m 무주.
  //  · 주방: 전면 3 + 양측 중앙 2 + 폴딩도어 집벽쪽 양 끝 2 = 7개(데크 위라 그대로).
  const postW = 0.12;
  const 안방PostX = fX1 - 0.1;   // 안방 땅 기둥 X열: 건물 외곽선 안쪽 0.1(중심선이 아니라 기준선 안쪽)
  const postPlaces = (connectRightX != null)
    ? [[안방PostX, fFrontZ], [안방PostX, sideMidZ], [안방PostX, fWallZ]]
    : [[fX0, fFrontZ], [(fX0 + fX1) / 2, fFrontZ], [fX1, fFrontZ], [fX0, sideMidZ], [fX1, sideMidZ], [fX0, fWallZ], [fX1, fWallZ]];
  // 땅에 서는 기둥(개방형 썬룸)은 각 기둥 밑에 시스템 말뚝기초(집·데크와 동일, KC금강)를 박고 그 위에 얹는다.
  // 데크 위 기둥은 데크 기초가 받치므로 별도 기초 불필요.
  const postBaseY = deckSurfaceY;   // 새 데크 표면(0.62) — 땅 기둥/데크 기둥/폴딩을 데크 위에 통일(온통기초+페데스탈+포세린)
  const groundPosts = [];      // 땅 기둥 위치(원위치) — 바닥 말뚝(PILE_POS.anbang)의 X·가운데 Z 출처
  // ★단일 출처★ 땅 기둥의 말뚝(기초)·두부·라벨·기둥은 여기서 그리지 않는다.
  // 위치를 PILE_POS로 확정한 뒤 main에서 drawGroundPost()로 그려, 바닥 마커와 입체 말뚝이
  // 똑같은 좌표를 쓰게 한다(예전엔 바닥만 보정하고 입체는 원좌표라 도면마다 어긋났음 → 그 회귀 차단).
  function drawGroundPost(px, pz, isFirst) {
    // 땅 기둥 밑 말뚝기초 — 제거됨(사용자 요청). 기둥(골조)만 남김.
    const topY = glassYatZ(pz) - beamDrop - beamH;
    썬룸FrameObjects.push(box({ x: px - postW / 2, z: pz - postW / 2, w: postW, d: postW, y: postBaseY, h: topY - postBaseY, mat: 썬룸Frame }));   // 기둥(골조)
  }
  postPlaces.forEach(([px, pz], i) => {
    if (postsToGround) {
      groundPosts.push([px, pz]);   // 위치만 기록 — 렌더는 PILE_POS 확정 후 main에서(단일 출처)
    } else {
      const topY = glassYatZ(pz) - beamDrop - beamH;
      frameLocal.push(box({ x: px - postW / 2, z: pz - postW / 2, w: postW, d: postW, y: postBaseY, h: topY - postBaseY, mat: 썬룸Frame }));   // 데크 위 기둥(주방) — 데크 기초가 받침
    }
  });

  // ── 썬룸 물받이(앞단 처마 홈통) + (옵션) 왼쪽(고-X) 모서리 기둥 우수관 ──
  if (withGutter) {
    const gutterMat = materials.gutter || new THREE.MeshLambertMaterial({ color: 0x9aa1a8 });
    const gx0 = (connectRightX != null) ? connectRightX : fX0;
    const gutterY = yAtFront - 0.13;                          // 앞단(최저) 지붕 가장자리 바로 아래
    box({ x: gx0, z: frontZ - 0.11, w: fX1 - gx0, d: 0.12, y: gutterY, h: 0.10, mat: gutterMat });   // 앞단 처마 홈통(가로)
    if (withDownspout) {
      const dpx = fX1 - 0.035;                               // 왼쪽(고-X) 모서리 기둥
      box({ x: dpx, z: frontZ - 0.06, w: 0.07, d: frameInset + 0.08, y: gutterY - 0.04, h: 0.06, mat: gutterMat });   // 홈통 → 모서리 기둥 연결관
      box({ x: dpx, z: fFrontZ - 0.08, w: 0.07, d: 0.07, y: groundTopY, h: (gutterY - 0.04) - groundTopY, mat: gutterMat });   // 모서리 기둥 따라 지면까지 수직 우수관
      label('썬룸 우수관(왼쪽 모서리)', fX1 + 0.5, (gutterY + groundTopY) / 2 + 0.3, fFrontZ, 'mep');
    }
  }

  // 평평한 프레임 — 앞단(가장 낮은) 보 높이의 수평면에 사각 틀 + 내부 격자(lattice).
  // 경사 지붕(빗변)·수평 격자(밑변)·집 벽쪽 단차(수직변)로 측면에서 직각삼각형 구조가 보인다.
  // 이 수평면(flatFrameY)에 등·실링팬을 매단다.
  const flatFrameY = glassYatZ(fFrontZ) - beamDrop - beamH;   // 앞단 보 밑면 = 가장 낮은 수평면(2.4m)
  if (withFlatFrame) {
    const flatX0 = (connectRightX != null) ? connectRightX : fX0;  // 연결 시 이웃까지 이어 붙임
    const barW = 0.05, barH = 0.07;
    const fw = fX1 - flatX0, fd = fWallZ - fFrontZ;
    const xMid = flatX0 + fw / 2, zMid = fFrontZ + fd / 2;
    // 사각 틀(둘레) + 가운데 십자(가로 1·세로 1)
    for (const z of [fFrontZ, fWallZ, zMid]) {              // 앞·뒤 + 십자 가로
      frameLocal.push(box({ x: flatX0, z: z - barW / 2, w: fw, d: barW, y: flatFrameY, h: barH, mat: 썬룸Frame }));
    }
    for (const x of [flatX0, fX1, xMid]) {                  // 좌·우 + 십자 세로
      frameLocal.push(box({ x: x - barW / 2, z: fFrontZ, w: barW, d: fd, y: flatFrameY, h: barH, mat: 썬룸Frame }));
    }
  }

  // 상부 보 밑면 — 포치 창벽(폴딩도어) 상단선. (포치 자바라 외벽은 제거됨: wallLocal은 항상 비어 있음)
  const wallTopAtZ = (z) => glassYatZ(z) - beamDrop - beamH;

  // 폴딩도어(외벽 대안) — 주방 썬룸 3면. 맑은 유리 + 넓은 폴딩 패널(0.65m) + 다크 프레임 + 출입 손잡이.
  const _foldingStart = scene.children.length;
  if (withWalls) {
    const fdGlass = new THREE.MeshLambertMaterial({ color: 0xcfe6f0, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false });   // 닫힌 짝·상부 고정 유리
    const fdMove = new THREE.MeshLambertMaterial({ color: 0x9fc0d4, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });     // 접힌(움직인) 짝 유리 — 약간 짙게
    const fdFrame = new THREE.MeshLambertMaterial({ color: 0x3a3f45 });   // 폴딩 알루미늄 프레임(다크그레이)
    const glaze = 0.05, sillH = 0.1, mullW = 0.05, fdPanel = 0.65;        // (옆집담장쪽 측면 세로살 간격)
    const wallBaseY = deckSurfaceY;   // 폴딩도어 베이스 = 새 데크 표면(0.62) — 데크와 높이 일치
    const fdH = 2.4;                                                       // s2 표준 폴딩도어 높이 — 위 남는 부분은 고정 유리
    const sy = wallBaseY + sillH, hy = wallBaseY + fdH;                    // 폴딩 유리 하단(문턱 위)·상단
    const pw = 0.68, ang = 60 * Math.PI / 180, sStep = pw * Math.cos(ang), fD = pw * Math.sin(ang);   // s2와 동일: 짝폭·접힘각·짝당 전진/접힘깊이
    // 아코디언 접힘 한 세트(경첩점 배열 hinge[k]=[x,z]) — 닫힌 짝은 호출부에서 평면 유리로 별도.
    const drawFold = (hinge, nF) => {
      for (let k = 0; k < nF; k += 1) {
        const [x0p, z0p] = hinge(k), [x1p, z1p] = hinge(k + 1);
        const cxp = (x0p + x1p) / 2, czp = (z0p + z1p) / 2, len = Math.hypot(x1p - x0p, z1p - z0p);
        const m = box({ x: cxp - len / 2, z: czp - 0.025, w: len, d: 0.05, y: sy, h: hy - sy, mat: fdMove, cast: false });
        m.rotation.y = Math.atan2(-(z1p - z0p), x1p - x0p);
      }
      for (let k = 0; k <= nF; k += 1) { const [hx, hz] = hinge(k); box({ x: hx - 0.035, z: hz - 0.035, w: 0.07, d: 0.07, y: sy, h: hy - sy, mat: fdFrame, cast: false }); }   // 경첩 세로살
      const [lx, lz] = hinge(nF); box({ x: lx - 0.06, z: lz - 0.06, w: 0.045, d: 0.045, y: sy + 0.95, h: 0.28, mat: materials.handle });   // 선두짝 손잡이
    };

    // ── 정면(−Z) 폴딩도어 — 전체가 옆집담장쪽(低X=fX0) 한쪽으로 접힘, 밖(−Z)으로 아코디언(편개). 위 남는 부분 고정 유리. ──
    {
      const zc = fFrontZ, beamTop = wallTopAtZ(fFrontZ);
      box({ x: fX0, z: zc - 0.05, w: fX1 - fX0, d: 0.1, y: wallBaseY, h: sillH, mat: fdFrame });                 // 하부 문턱(전폭)
      box({ x: fX0, z: zc - 0.05, w: fX1 - fX0, d: 0.1, y: hy - 0.08, h: 0.08, mat: fdFrame });                  // 폴딩 상부 레일(전폭)
      box({ x: fX0, z: zc - glaze / 2, w: fX1 - fX0, d: glaze, y: hy, h: beamTop - hy, mat: fdGlass, cast: false });   // 위 고정 유리(폴딩~빔)
      box({ x: fX0, z: zc - 0.05, w: fX1 - fX0, d: 0.1, y: beamTop - 0.06, h: 0.06, mat: fdFrame });             // 고정유리 상단 프레임(빔 밑)
      const fN = Math.max(2, Math.round((fX1 - fX0) / pw));                 // 전폭을 한 세트로 — 한쪽(옆집담장)으로만 접힘
      drawFold((k) => [fX0 + sStep * k, k % 2 === 0 ? zc : zc - fD], fN);   // 전체가 옆집담장쪽(fX0)에 모여 밖(−Z)으로 접힘
      label('정면 폴딩도어 — 옆집담장쪽으로 한쪽 접힘(밖으로)', (fX0 + fX1) / 2, wallBaseY + 1.45, fFrontZ - 0.25, 'opening');
    }

    // ── 안방쪽 측면(高X=fX1) 폴딩도어 — 전체가 집 벽쪽(+Z=fWallZ) 한쪽으로 접힘, 밖(+X)으로(편개). 위 남는 부분 고정 유리(경사). ──
    {
      const xc = fX1;
      box({ x: xc - 0.05, z: fFrontZ, w: 0.1, d: fWallZ - fFrontZ, y: wallBaseY, h: sillH, mat: fdFrame });      // 하부 문턱
      box({ x: xc - 0.05, z: fFrontZ, w: 0.1, d: fWallZ - fFrontZ, y: hy - 0.08, h: 0.08, mat: fdFrame });       // 폴딩 상부 레일
      yzWallPrism({ x: xc - glaze / 2, thickness: glaze, mat: fdGlass, points: [
        [fFrontZ, hy], [fWallZ, hy], [fWallZ, wallTopAtZ(fWallZ)], [fFrontZ, wallTopAtZ(fFrontZ)]
      ] });   // 위 고정 유리(경사 상단, 빔까지)
      const fN = Math.max(2, Math.round((fWallZ - fFrontZ) / pw));          // 전폭을 한 세트로 — 한쪽(집 벽)으로만 접힘
      drawFold((k) => [k % 2 === 0 ? xc : xc + fD, fWallZ - sStep * k], fN);   // 전체가 집 벽쪽(fWallZ)에 모여 밖(+X)으로 접힘
      label('안방쪽 측면 폴딩도어 — 집 벽쪽으로 한쪽 접힘(밖으로)', fX1 + 0.45, wallBaseY + 1.45, (fFrontZ + fWallZ) / 2, 'opening');
    }

    // 정면·안방쪽 폴딩이 만나는 앞 모서리(fX1, fFrontZ) — 두 폴딩의 공용 문설주 기둥.
    box({ x: fX1 - 0.06, z: fFrontZ - 0.06, w: 0.12, d: 0.12, y: wallBaseY, h: wallTopAtZ(fFrontZ) - wallBaseY, mat: fdFrame });

    // ── 옆집담장쪽 측면(低X=fX0) — 요청에 없어 그대로 유지: 아래 고정 / 위 폴딩(연통구 높이 2등분) ──
    {
      const sideX = fX0;
      yzWallPrism({ x: sideX - glaze / 2, thickness: glaze, mat: fdGlass, points: [
        [fWallZ, wallBaseY + sillH], [fFrontZ, wallBaseY + sillH], [fFrontZ, wallTopAtZ(fFrontZ)], [fWallZ, wallTopAtZ(fWallZ)]
      ] });
      box({ x: sideX - 0.05, z: fFrontZ, w: 0.1, d: fWallZ - fFrontZ, y: wallBaseY, h: sillH, mat: fdFrame });
      const splitY = wallBaseY + deckFinishT + 0.55;   // 스토브 불연패널 상단과 동일선
      const sillY = wallBaseY + sillH;
      box({ x: sideX - 0.06, z: fFrontZ, w: 0.12, d: fWallZ - fFrontZ, y: splitY - 0.025, h: 0.05, mat: fdFrame, cast: false });   // 수평 분할 레일(연통구 높이)
      const sP = Math.max(2, Math.round((fWallZ - fFrontZ) / fdPanel));
      for (let i = 0; i <= sP; i += 1) {               // 위쪽(폴딩, 밖으로 열림): 분할선~지붕 세로 접이살
        const mz = fFrontZ + (fWallZ - fFrontZ) * (i / sP);
        box({ x: sideX - 0.07, z: mz - mullW / 2, w: 0.14, d: mullW, y: splitY, h: wallTopAtZ(mz) - splitY, mat: fdFrame, cast: false });
      }
      for (const ez of [fFrontZ, fWallZ]) {            // 아래쪽(고정): 세로 분할 없는 고정 유리 띠 — 끝단 세로 프레임만
        box({ x: sideX - 0.06, z: ez - mullW / 2, w: 0.12, d: mullW, y: sillY, h: splitY - sillY, mat: fdFrame, cast: false });
      }
      label('오른쪽(서) 측면 — 아래 고정 / 위 밖으로 열림(연통구 높이 2등분)', sideX - 0.4, splitY + 0.55, (fFrontZ + fWallZ) / 2, 'opening');
    }
  }
  foldingLocal.push(...scene.children.slice(_foldingStart));   // 폴딩도어 객체 별도 토글 그룹

  // 썬룸 바닥 — 포세린 타일 마감(건식). 50cm 온통기초 위 페데스탈(높이조절 받침)에 포세린을 얹는다.
  const deckTopY = deckSurfaceY;                  // 데크 상단 = 온통기초(0.5)+페데스탈(0.10)+포세린(0.02) — 단일 출처
  const deckThickness = 0.02;                    // 포세린 마감 두께 2cm
  const deckEdge = postW / 2;                    // 기둥(프레임 선)이 데크 위에 완전히 얹히도록 기둥 바깥면까지 확장
  const dX0 = (connectRightX != null) ? connectRightX : fX0 - deckEdge; // 오른쪽: 연결 시 이웃 데크까지 이어 붙임
  const dX1 = fX1;                               // 고-X(안방쪽)는 개방부라 돌출 없이 유리벽 선까지만(데크 폭 = 5.5)
  const dWallZ = fWallZ;                          // 건물쪽은 벽에 붙임
  // deckDepth가 지정되면 건물 벽에서 그 거리까지만 데크를 깐다(부분 데크).
  const dFrontZ = (deckDepth != null) ? dWallZ - deckDepth : fFrontZ - deckEdge;
  if (withDeck) {                                  // 데크 바닥 마감(없는 썬룸은 지붕·기둥만)
    const pX0 = Math.max(dX0, 0), pX1 = Math.min(dX1, buildingW);   // 데크 발자국(0~buildingW) 안으로 clamp — 테두리 밖으로 안 튀어나오게
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(pX1 - pX0, deckThickness, dWallZ - dFrontZ),
      materials.porcelainDeck
    );
    deck.position.set((pX0 + pX1) / 2, deckTopY - deckThickness / 2, (dFrontZ + dWallZ) / 2);
    deck.receiveShadow = true;
    scene.add(deck);
    floorLocal.push(deck, addGeometryEdges(deck, 0x9a9384));
  }

  // 썬룸 지붕/바닥 사이즈 표시 — 지붕은 경사면 길이, 바닥은 물매 반영한 수평투영(증축 신고 면적 기준)
  const roofMidZ = (wallZ + frontZ) / 2;
  if (withRoofPanel) {   // 지붕면을 그리는 썬룸만 라벨(단일 합치기 시 실제 패널 폭으로)
    label(`썬룸 지붕 ${fmtDim(rpW)}×${fmtDim(roofSlopeLength)}m (경사면)`, rpCx, glassYatZ(roofMidZ) + 0.34, roofMidZ, 'dim');
  }
  if (withDeck) {
    const floorW = fX1 - fX0;
    const floorL = (deckDepth != null) ? deckDepth : (fWallZ - fFrontZ); // 데크 깊이(부분 데크면 그 값)
    const floorArea = floorW * floorL;
    const floorLabelZ = (deckDepth != null) ? fWallZ - deckDepth / 2 : (fWallZ + fFrontZ) / 2;
    deckLocal.push(label(`썬룸 바닥(수평투영) ${fmtDim(floorW)}×${fmtDim(floorL)}m = ${fmtDim(floorArea)}㎡`, (fX0 + fX1) / 2, firstFloorY + 0.06, floorLabelZ, 'dim'));
  }

  // 기둥 높이 치수(앞단·집 벽쪽) — 두 썬룸가 같은 규격이라 한쪽에만 표기
  if (withPostDims) {
    // 건물에서 가장 먼쪽(앞단) = 가장 낮은 기둥 높이 표시
    const frontPostTopY = glassYatZ(fFrontZ) - beamDrop - beamH;
    const frontPostHeight = frontPostTopY - firstFloorY;   // 데크 상단~보 밑면(데크 위 기둥 길이)
    const dimZ = fFrontZ - 0.25;                       // 앞단 기둥 앞쪽으로 치수선을 뺀다
    planYDim(fX0 - 0.018, dimZ, firstFloorY, firstFloorY + frontPostHeight, `최저(앞단) 기둥 ${fmtDim(frontPostHeight)}m`);

    // 집 벽쪽(건물 부착부, 가장 높은 쪽) 높이 표시 — 데크 상단~보 밑면
    const wallPostTopY = wallTopAtZ(fWallZ);
    const wallPostHeight = wallPostTopY - firstFloorY;
    const dimX = fX0 - 0.25;                           // 우측 모서리 바깥으로 치수선을 뺀다
    planYDim(dimX - 0.018, fWallZ - 0.018, firstFloorY, firstFloorY + wallPostHeight, `집 벽쪽 높이 ${fmtDim(wallPostHeight)}m`);
  }

  // 가장 짧은(앞단) 기둥 높이 — 기둥이 지면에 서는 개방형 썬룸용(안방 앞). 왼쪽(높은 X) 기둥 바깥에 표기.
  if (withShortPostDim) {
    const fpTopY = glassYatZ(fFrontZ) - beamDrop - beamH;   // 앞단 보 밑면
    const fpH = fpTopY - postBaseY;                          // 지면(postBaseY)~보 밑면 = 가장 짧은 기둥
    const dimX2 = fX1 + 0.25;                                // 왼쪽 기둥 바깥으로 치수선
    planYDim(dimX2 - 0.018, fFrontZ - 0.018, postBaseY, postBaseY + fpH, `최저(앞단) 기둥 ${fmtDim(fpH)}m`);
  }

  // 썬룸 천장: 실링팬(옵션) + 양옆 조명(오른쪽 1, 왼쪽 1) — 추가된 평평한 프레임에 매단다
  const 썬룸CenterX = (fX0 + fX1) / 2;
  const 썬룸CenterZ = (fWallZ + fFrontZ) / 2;
  const 썬룸CeilY = withFlatFrame ? flatFrameY : glassYatZ(썬룸CenterZ) - 0.02;   // 평평한 프레임 밑면(없으면 경사 지붕 밑면)
  if (withFan) ceilingFan({ x: 썬룸CenterX, z: 썬룸CenterZ, ceilingY: 썬룸CeilY, drop: 0.25, bladeLength: 0.55 });
  const 썬룸LampMat = new THREE.MeshLambertMaterial({ color: 0xfff4cf, emissive: 0xffe39c, emissiveIntensity: 0.9 });
  for (const lampX of [썬룸CenterX - 1.3, 썬룸CenterX + 1.3]) {  // -:오른쪽(낮은 X), +:왼쪽(높은 X)
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.05, 16), materials.guard);
    housing.position.set(lampX, 썬룸CeilY - 0.025, 썬룸CenterZ);
    housing.castShadow = false;
    housing.receiveShadow = false;
    scene.add(housing);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.035, 16), 썬룸LampMat);
    lens.position.set(lampX, 썬룸CeilY - 0.06, 썬룸CenterZ);
    lens.castShadow = false;
    lens.receiveShadow = false;
    scene.add(lens);
  }

  // 썬룸 캠핑 가구 — 스노우피크 IGT 4칸/3칸(한쪽 사이드테이블) + 반고 햄프턴 DLX 의자
  const _furnStart = scene.children.length;
  if (withFurniture) {
    const tableZ = 썬룸CenterZ - 0.05;
    igtTable({ cx: 썬룸CenterX - 1.05, cz: tableZ, bays: 4, sideTableSide: -1, baseY: firstFloorY });
    igtTable({ cx: 썬룸CenterX + 1.25, cz: tableZ, bays: 3, sideTableSide: 1, baseY: firstFloorY });
    campingChair({ cx: 썬룸CenterX - 1.05, cz: tableZ - 0.72, faceAngle: 0, baseY: firstFloorY });
    campingChair({ cx: 썬룸CenterX - 1.05, cz: tableZ + 0.72, faceAngle: Math.PI, baseY: firstFloorY });
    campingChair({ cx: 썬룸CenterX + 1.25, cz: tableZ - 0.72, faceAngle: 0, baseY: firstFloorY });
    campingChair({ cx: 썬룸CenterX + 1.25, cz: tableZ + 0.72, faceAngle: Math.PI, baseY: firstFloorY });
    label('스노우피크 IGT(4·3칸) + 반고 햄프턴 DLX', 썬룸CenterX, firstFloorY + 1.15, tableZ + 0.05, 'furniture');
  }
  extrasLocal.push(...scene.children.slice(_furnStart));

  // 추가물 분류: 데크 바닥/가구로 표시된 것 외 나머지는 모두 썬룸 구조물.
  const _floorSet = new Set(floorLocal);
  const _deckSet = new Set(deckLocal);
  const _wallSet = new Set(wallLocal);
  const _foldingSet = new Set(foldingLocal);
  const _extrasSet = new Set(extrasLocal);
  const _foundationSet = new Set(foundationLocal);
  const _frameSet = new Set(frameLocal);
  for (const o of scene.children.slice(_addStart)) {
    if (_floorSet.has(o)) deckFloorObjects.push(o);
    else if (_deckSet.has(o)) deckObjects.push(o);
    else if (_wallSet.has(o)) wallObjects.push(o);
    else if (_foldingSet.has(o)) foldingObjects.push(o);
    else if (_extrasSet.has(o)) extrasObjects.push(o);
    else if (_foundationSet.has(o)) foundationObjects.push(o);
    else if (_frameSet.has(o)) 썬룸FrameObjects.push(o);
    else 썬룸Objects.push(o);
  }

  return { dX0, dX1, dFrontZ, dWallZ, deckTopY, groundPosts, drawGroundPost };   // 데크 사각형(계단 배치) + 땅 기둥 말뚝 위치 + 입체 땅기둥 렌더러(단일 출처)
}

// 데크 계단 — 데크 상단에서 지면까지 3계단(합성목). 가장자리 한 변을 따라 바깥으로 내려간다.
//  axis: 계단이 늘어선 축('x' 또는 'z'). span0~span1: 그 축 범위. edge: 수직축의 데크 가장자리.
//  outward: 가장자리에서 계단이 뻗는 방향(±1). steps: 계단 수.
function deckStairs({ axis, span0, span1, edge, outward, steps = 3, topY = deckTopY0 + deckFinishT, baseY = groundTopY, tread = 0.3, frameTopY = null, mat = materials.porcelainDeck }) {
  const rise = (topY - baseY) / steps;              // 3계단 = 3개의 단높이(데크가 맨 위 단)
  const tileT = deckFinishT;                        // 포세린 타일 두께(데크 바닥과 동일 2cm)
  for (let i = 0; i < steps - 1; i += 1) {          // 중간 디딤판 steps-1개(맨 위는 데크). i=0: 데크에 가장 가까운 단
    // 데크처럼: 계단틀(디딤바) 윗면 위에 얇은 포세린 타일을 얹는다. frameTopY=틀 디딤바 윗면 높이(주면 타일 모드, 없으면 솔리드 블록).
    const treadFrameTop = frameTopY != null ? frameTopY(i) : null;
    const yBottom = treadFrameTop != null ? treadFrameTop : baseY;          // 타일: 틀 윗면 위 / 솔리드: 지면부터
    const h = treadFrameTop != null ? tileT : (topY - (i + 1) * rise - baseY);
    const pNear = edge + outward * (i * tread);
    const pFar = edge + outward * ((i + 1) * tread);
    const pMin = Math.min(pNear, pFar);
    let step;
    if (axis === 'x') {                              // 계단이 x축으로 늘어섬(전면 계단), 수직축은 z
      step = box({ x: span0, z: pMin, w: span1 - span0, d: tread, y: yBottom, h, mat });
    } else {                                         // axis === 'z'(측면 계단), 수직축은 x
      step = box({ x: pMin, z: span0, w: tread, d: span1 - span0, y: yBottom, h, mat });
    }
    addGeometryEdges(step, 0x4a3724);
  }
}

// 주방 앞(우측) 썬룸 — 우측 외벽끝(x=0) 고정, 안방쪽으로 늘려 폴딩벽·데크 폭 5.5m(fX1=5.5, 좌측 끝 x=5.7)
//   지붕면은 주방+안방을 덮는 단일 패널 하나로 그린다 — 좌우 돌출은 집 지붕과 동일(frSideOverhang 40cm), 폭 = 집 외벽폭 + 양쪽 40cm = 9.3m, 중심 x=집 중심(−0.4~8.9).
const kitchen썬룸 = 썬룸({ roofLowX: -0.2, roofW: 5.9, withFurniture: true, withPostDims: true, withGutter: true, roofPanelW: buildingW + 2 * frSideOverhang, roofPanelCenterX: buildingW / 2, deckDepth: deckD });   // 데크 깊이=deckD. 데크 폭(고-X 끝 fX1=deckW=5.5)은 roofW:5.9에서 파생(지붕 프레임 공유) — deckW 바꾸려면 roofW도 함께
// 안방 앞(좌측) 썬룸 — 기둥·보·홈통만(개방형, 데크·지붕면 없음). 지붕면은 주방 썬룸의 단일 패널이 이미 덮음.
const 안방썬룸 = 썬룸({ roofLowX: 5.7, roofW: 3.0, withFurniture: false, withPostDims: false, withWalls: false, postsToGround: true, connectRightX: deckW, withFan: false, withShortPostDim: true, withGutter: true, withDownspout: true, withDeck: false, withRoofPanel: false });

// 데크 기초 — 집과 동일한 시스템말뚝기초(말뚝 + 두부). 두부 위에 둘레 토대보(바닥 골조)가 얹히고, 그 위에 포세린·폴딩/외벽이 올라간다.
// 데크 기초 발자국 — 집 너비(0~8.5) 안으로 정렬(엣지 돌출 제거). 인접 데크 겹침을 없애 폭 합이 8.5가 되게.
for (const p of [kitchen썬룸]) {
  const fx0 = Math.max(p.dX0, 0);          // 주방쪽(담장) 끝: 집 기초선 밖으로 안 나가게
  const fx1 = Math.min(p.dX1, buildingW);  // 안방쪽 끝: 집 너비(8.5) 안으로
  deckFootprints.push({ x: fx0, z: p.dFrontZ, w: fx1 - fx0, d: p.dWallZ - p.dFrontZ });
}
// 포치(데크 지붕) 건축면적 산입면적 — 건축법 시행령 §119① 2호: 벽 없이 기둥으로 받친 지붕은
//   외곽 '기둥 중심선' 안쪽 수평투영이 건축면적(기둥 안쪽엔 1m 처마 공제 없음). 지붕은 단일 패널이
//   전면(주방+안방)을 덮고, 최외곽 기둥은 주방측(deckFootprints[0].x)~안방측(안방 땅기둥 X). 깊이=데크 수평투영.
const deckRoofColX0 = deckFootprints[0].x;                       // 주방측 최외곽 기둥선
const deckRoofColX1 = 안방썬룸.groundPosts[0][0];                 // 안방측 최외곽 기둥선(땅 기둥 X열)
const deckRoofBcrArea = (deckRoofColX1 - deckRoofColX0) * deckFootprints[0].d;   // 포치 건축면적(수평투영)
// 데크 말뚝기초(시스템말뚝) — 제거됨(사용자 요청).

// 바닥틀(바닥 골조 장선틀)은 설계도 기반으로 시공사가 시공 — 모델에선 그리지 않는다(메뉴 삭제).

// ── 바닥(평면도): 납작한 발자국 + 평면 치수 ─────────────────────────────────
const planY = 0.003, planH = 0.002;   // 평면(높이 0 취급) — 대지 위 1mm 띄워 깜빡임만 막는 2mm 두께
// 기초 발자국(집 + 데크) — 단일 출처(footprintObjects). 모든 화면에 동일 표시.
footprintObjects.push(box({ x: 0, z: buildingFrontZ, w: buildingW, d: buildingD, y: planY, h: planH, mat: materials.foundation, cast: false, name: 'ground' }));
for (const f of deckFootprints) {
  footprintObjects.push(box({ x: f.x, z: f.z, w: f.w, d: f.d, y: planY, h: planH, mat: materials.deckFoundation, cast: false, name: 'ground' }));   // 데크 기초(0.4m) — 청회색으로 집 기초(0.5m)와 구분
}
// 매트(온통)기초 — 말뚝기초의 대안. 50cm 콘크리트 슬래브. 부분=집만, 전체=집+데크(상호 단독 토글).
const MAT_H = matFoundationH;   // 매트기초 높이 50cm(단일 출처: constants.matFoundationH)
captureInto(matFoundationHouseObjects, () => {
  box({ x: 0, z: buildingFrontZ, w: buildingW, d: buildingD, y: groundTopY, h: MAT_H, mat: materials.matFoundation });   // 집 매트
  planYDim(-0.1, buildingBackZ + 0.1, groundTopY, groundTopY + MAT_H, '기초 0.5m');   // 남쪽 모서리(옆집벽·측백벽 만나는 곳 = 낮은 X·뒤 Z) 높이 치수
});
captureInto(matFoundationFullObjects, () => {
  box({ x: 0, z: buildingFrontZ, w: buildingW, d: buildingD, y: groundTopY, h: MAT_H, mat: materials.matFoundation });   // 집 매트
  for (const f of deckFootprints) box({ x: f.x, z: f.z, w: f.w, d: f.d, y: groundTopY, h: MAT_H, mat: materials.matFoundation });   // 데크 매트
  planYDim(-0.1, buildingBackZ + 0.1, groundTopY, groundTopY + MAT_H, '기초 0.5m');   // 남쪽 모서리(옆집벽·측백벽 만나는 곳 = 낮은 X·뒤 Z) 높이 치수
});
// 독립기초(시스템말뚝) 위치 — 발자국 위에 어두운 점으로 표시(입체 기초 말뚝 격자와 동일 정렬)
// 평면 말뚝 마커 함수 — 제거됨(말뚝기초 삭제, 사용자 요청).
// ════════════════════════════════════════════════════════════════════════════
// ▌말뚝기초 위치(좌표) — ★잠금 영역★  사용자가 "위치를 옮겨라"라고 명시하기 전까지 절대 수정 금지.
//   · 색·라벨 등 다른 작업은 이 블록을 건드리지 말 것. 위치는 오직 여기서만 정의한다.
//   · 안방 앞/뒤 Z는 사용자가 직접 맞춘 값(test/smoke.test.js ⑤가 강제).
// ════════════════════════════════════════════════════════════════════════════
const _abFrontZ = deckFootprints[0].z + 0.1;                          // 안방 앞 말뚝 Z (사용자 확정 — 옛 파랑 자리)
const _abBackZ = deckFootprints[0].z + deckFootprints[0].d - 0.1;     // 안방 뒤 말뚝 Z (사용자 확정 — 옛 초록 자리)
const PILE_POS = Object.freeze({
  house: { x0: 0.1, z0: buildingFrontZ + 0.1, w: buildingW - 0.2, d: buildingD - 0.2, sx: 1.7, sz: 1.9, xs: housePileXs },   // X열은 하중 경로(housePileXs) 단일 출처 — 입체 말뚝과 동일
  decks: deckFootprints.map((f) => ({ x0: f.x + 0.1, z0: f.z + 0.1, w: f.w - 0.2, d: f.d - 0.2, sx: 1.6, sz: 1.7 })),
  // 안방 3개: X=groundPosts X, Z=[앞=_abFrontZ, 가운데=groundPosts 원위치, 뒤=_abBackZ]
  anbang: 안방썬룸.groundPosts.map(([px, pz], i) => [px, i === 0 ? _abFrontZ : i === 2 ? _abBackZ : pz]),
});
// 평면 말뚝 마커 렌더 — 제거됨(말뚝기초 삭제, 사용자 요청).
// 입체(기초·1층·다락·지붕) 안방 땅 기둥 말뚝·기둥 — 바닥 마커와 똑같은 PILE_POS.anbang 좌표로 그린다(단일 출처).
PILE_POS.anbang.forEach(([px, pz], i) => 안방썬룸.drawGroundPost(px, pz, i === 0));
// 담장 발자국(측백·옆집) — siteBaseObjects(공통, 항상 표시)에 넣어 모든 탭이 공유. 기초 등 다른 토글과 무관하게 바탕에 늘 깔린다.
siteBaseObjects.push(box({ x: lotX0 - 0.2, z: lotZ0, w: 0.2, d: lotD, y: planY, h: planH, mat: fenceMat, cast: false, name: 'ground' }));        // 옆집담장(우측 콘크리트)
siteBaseObjects.push(box({ x: lotX0, z: lotZ1 - hedgeThickness, w: lotW, d: hedgeThickness, y: planY, h: planH, mat: materials.hedge, cast: false, name: 'ground' }));   // 측백(후면)
siteBaseObjects.push(box({ x: lotX1 - hedgeThickness, z: lotZ0, w: hedgeThickness, d: lotD, y: planY, h: planH, mat: materials.hedge, cast: false, name: 'ground' }));   // 측백(좌측)
// 평면 치수 — 가로(8.5m)는 위쪽, 세로(4m)는 양쪽, 이격 치수 + 모눈 가이드라인. 바닥+기초 공통(dimObjects).
captureInto(dimObjects, () => {
  const dL = deckFootprints[0];   // 주방 데크 기초(안방 앞 데크 제거됨)
  // 가로 — 위쪽: 기초 8.5 / 안방 측백 0.5 (주방 0.5는 아래쪽으로 이동)
  planXDim(lotZ1 + 0.4, 0, buildingW, `${fmtDim(buildingW)}m`);
  captureInto(hedgeDimObjects, () => planXDim(lotZ1 + 0.4, lotX1 - hedgeThickness, lotX1, `측백 ${fmtDim(hedgeThickness)}m`));   // 안방 측백(좌상단) — 측백담장 토글+배치도
  // 세로 — 안방(왼쪽) 건물 깊이 4 / 주방(오른쪽) 뒤 이격 합 1m + 건물 깊이 4 + 데크 깊이
  planZDim(lotX1 + 0.35, buildingFrontZ, buildingBackZ, '4.0m');          // 안방 건물 깊이
  captureInto(hedgeDimObjects, () => planZDim(lotX1 + 0.35, lotZ1 - hedgeThickness, lotZ1, `측백 ${fmtDim(hedgeThickness)}m`));   // 뒤(가로) 측백 — 측백담장 토글+배치도
  captureInto(gapDimObjects, () => planZDim(lotX0 - 0.4, buildingBackZ, lotZ1, '1.0m'));   // 뒤 이격 합 1m — 공통(집-담장 이격)
  planZDim(lotX0 - 0.4, buildingFrontZ, buildingBackZ, '4.0m');          // 주방 건물 깊이
  planZDim(lotX0 - 0.4, dL.z, buildingFrontZ, `${fmtDim(dL.d)}m`);   // 주방 데크 깊이(오른쪽 가장자리)
  // 아래쪽 가장자리: 주방 데크 폭 / 주방 이격 분할
  planXDim(dL.z - 0.45, 0, dL.x + dL.w, `${fmtDim(dL.w)}m`);        // 주방 데크 폭
  captureInto(gapDimObjects, () => planXDim(dL.z - 0.45, lotX0, 0, '0.5m'));   // 주방 이격 0.5 — 공통(집-담장 이격)
  // 모눈 가이드라인 — 각 치수 끝점(X/Z)을 지나 전체로 얇게(드래프팅 보조선처럼)
  const gridMat = new THREE.MeshBasicMaterial({ color: 0x5b7185 });   // 회청색 보조선(무광 — 조명 영향 없이 또렷)
  const gw = 0.02, gy = 0.009, gh = 0.002;   // 기준선 — 바닥에 붙임(색면 위 1mm), 두께 2mm
  const gz0 = lotZ0 - 0.6, gz1 = lotZ1 + 0.6, gx0 = lotX0 - 0.6, gx1 = lotX1 + 0.6;
  const vGuide = (x) => box({ x: x - gw / 2, z: gz0, w: gw, d: gz1 - gz0, y: gy, h: gh, mat: gridMat, cast: false, name: 'ground' });   // 세로 보조선
  const hGuide = (z) => box({ x: gx0, z: z - gw / 2, w: gx1 - gx0, d: gw, y: gy, h: gh, mat: gridMat, cast: false, name: 'ground' });   // 가로 보조선
  // 측백·이격 치수의 기준선 — 공통(모든 탭). 끝점: X=대지 좌/우·주방0 / Z=집 뒤벽·대지 뒤.
  captureInto(gapDimObjects, () => {
    for (const x of [lotX0, 0, lotX1]) vGuide(x);
    for (const z of [buildingBackZ, lotZ1]) hGuide(z);
  });
  // 집·데크 크기 치수의 기준선 — 현재 탭(s1)만. (dL.x+dL.w = 주방 데크 안방쪽 끝)
  for (const x of [dL.x + dL.w, buildingW]) vGuide(x);
  for (const z of [dL.z, buildingFrontZ]) hGuide(z);
});
// 집 말뚝 X열 간격 치수 — 제거됨(말뚝기초 삭제, 사용자 요청).

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ ▼▼▼  S2 영역 시작 — 3층 구조(현재 작업 도면)  ▼▼▼                                ║
// ║ 이 배너 ~ "S2 영역 끝" 배너 사이는 s2(3층 구조) 전용이다.                         ║
// ║ · 3층 작업 부재는 반드시 이 구역 안에, s2 좌표(s2W·s2X0·s2BackZ·s2FrontZ·        ║
// ║   f1Top·S2_STAIR…)와 s2*Objects 그룹으로만 추가한다.                             ║
// ║ · s1(1층+다락) 좌표(buildingW·buildingBackZ·firstFloorY…)·그룹                    ║
// ║   (firstFloorObjects·roofObjects·footprintObjects…)은 값이 겹쳐 조용히 s1에       ║
// ║   그려진다 → 여기서 쓰면 test ⑭(작업 도면 격리)가 실패한다. 절대 금지.            ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
// ── 2층·다락 탭(s2) 배치도/기초 — 집 발자국 너비(X) 8 × 깊이(Z)는 3층 방 짧은변에서 파생 ─────────────
// 주방측 외벽(x=0)·뒤벽(buildingBackZ=3.3)을 s1과 동일 모서리로 맞추고, 너비→x=8 / 깊이→앞(z) 방향.
// s2 계단 사양(단일 출처) — 디딤·단높이·런폭·런틈·디딤판두께 · 층고(1→2,2→3). 메모·라벨이 이 값을 그대로 표시.
const S2_STAIR = { T: 0.27, R: 0.15, W: 0.75, g: 0.1, tTh: 0.06, nosing: 0.02, rTh: 0.03, usTh: 0.04, nUpper: [9, 9], landingSteps: 2, slabT: floorFinishH, floorH: [3.0, 3.0] };  // slabT=1층 층참=바닥 마감 두께(콘크리트 기초 위 부자재+포세린, floorFinishH 0.20). 층고 1·2층 모두 3.0m(천장고 2.7+슬래브 0.3). nosing=계단코·rTh=챌판두께·usTh=계단아래문두께·nUpper=상부런 비행별 단수(그리기·메모 단일 출처)
const s2W = 8.5;                            // s2 집 너비(X) — 고정 상수(x=0 주방측 고정, 왼쪽 안방측으로 확장)
const s2X0 = 0;                             // 주방측 외벽 — s1과 동일(x=0, 옆집 이격 0.5 유지)
const s2BackZ = buildingBackZ;             // 뒤벽 — s1과 동일(3.3, 측백 이격 1.0 유지, 부지 경계서 1m 고정)
const s2WallT = 0.3;                        // s2 외벽 두께(단일 출처) — 외벽·계단 들임 기준
const s2Floor2SlabT = 0.3;                  // 2층 바닥 슬래브 두께(30cm) — 치수·외벽 단일 출처
const s2Floor3SlabT = 0.3;                  // 3층 바닥 슬래브 두께 — 치수·외벽 단일 출처(한 값만 유지)
const s2RoomShort = 3.7;                    // 3층 방 짧은변(깊이 방향) — 고정 상수. 집 깊이가 여기서 파생(계단 1.6으로 남는 0.5를 방에 더해 집 깊이 6.0 유지)
// 3층 화장실 앞 복도 모서리 건식 세면대(단일 출처) — 그림·메모가 이 값을 그대로 씀
const s2F3VanityW = 0.6, s2F3VanityD = 0.4, s2F3VanityH = 0.8;   // 하부장 폭·깊이·높이
const s2F3HeaterL = 15;                     // 하부장 안 경동 나비엔 전기온수기 용량(L)
const s2WcSinkGap = 0.75;                    // 변기↔세면대 중심 표준 간격(2·3층 공통) — 그리기·메모 단일 출처
const s2WcSinkClear = 0.15;                  // 문 열려도 세면대 안 닿게 확보하는 여유 — 그리기·메모 단일 출처
const s2WcToiletOff = 0.42;                  // 변기 중심 옆벽서 오프셋(2·3층 오수관 직하 정렬) — 그리기·메모 단일 출처
const s2LandingW = 1.2;                      // 층계참(도착칸) 폭 X — 그리기·메모 단일 출처
const s2LiftW = 1.5, s2LiftD = 1.6;          // 홈리프트 외경(깊이 X × 문면 폭 Z) — 그리기·메모 단일 출처
const s2LiftInW = 1.1, s2LiftInD = 1.48;     // 홈리프트 내경(탑승 공간, 외경과 같은 축 순서) — 메모 단일 출처
const s2LiftModel = '아리코 컴팩트 6번';       // 홈리프트 기준 제품 — 메모 단일 출처
const s2WallInner = 0.10;                     // 화장실·분리 내벽 두께 — 그리기·메모 단일 출처
const s2F2 = { doorW: 0.7, showerW: 0.9, showerD: 0.85, vanityW: 0.6, vanityD: 0.5, heaterL: 50 };  // 2층 화장실 기구 규격 — 그리기·메모 단일 출처
const s2Geo = {};                            // 그리기가 실제로 쓴 s2 좌표를 메모로 노출(단일 출처) — IIFE에서 채움
// 집 깊이(Z) = 뒤 외벽 + 계단실 깊이(두 런 행+틈) + 계단실↔방 내벽 + 방 짧은변 + 앞 외벽. 뒤벽 고정·앞벽만 이동.
const s2D = 2 * s2WallT + (2 * S2_STAIR.W + S2_STAIR.g) + interiorWall + s2RoomShort;   // = 6.0
const s2FrontZ = s2BackZ - s2D;            // 정면 = 뒤 − 깊이 (파생)
// s2 층고·박공지붕 단면 — 외벽·지붕·계단실 내벽이 공유하는 단일 출처(중복 정의 금지)
const _wBase = groundTopY + MAT_H, _wFh1 = 3.0, _wFh = 3.0, _wFh3 = 2.6;     // 1층 3.0 · 2층 3.0 · 3층 2.6(손님방 외벽 최저 2.4 = 바닥마감 0.2 뺀 값). 1층 층고 3.0=천장고 2.7+슬래브 0.3
const F2 = _wBase + _wFh1, F3 = _wBase + _wFh1 + _wFh, roofY = F3 + _wFh3;   // 2층 바닥 · 3층 바닥 · 지붕(처마=3층 벽 상단)
const s2RoofPitch = 32 * Math.PI / 180;                                     // 박공 32°(용마루 높이가 이 각도서 자동 계산)
const s2RoofSideOver = 0.45;                  // 좌우(박공면) 처마 내밈 — 그리기·메모 단일 출처
const s2RoofEaveOver = 1.0;                   // 앞뒤(경사면) 처마 내밈 — 그리기·메모 단일 출처
const s2SnowGuardT = [0.16, 0.30];            // 눈막이 줄 위치(처마→용마루 비율) — 슬로프당 줄 수 = 배열 길이
const s2Solar = { panelW: 1.66, panelL: 1.0, panelThk: 0.05, gapX: 0.04, gapZ: 0.04, cols: 4, rows: 2, wattEach: 400 };  // 태양광 모듈 규격·배열 — 그리기·메모 단일 출처
const s2RidgeZ = (s2FrontZ + s2BackZ) / 2;                                  // 용마루 — 깊이 중앙(용마루는 너비 X를 따라감)
const s2RoofUnderY = (z) => roofY + (s2D / 2 - Math.abs(z - s2RidgeZ)) * Math.tan(s2RoofPitch);   // 그 z의 박공지붕 밑선(처마 roofY ~ 용마루)
// 배치도 발자국(납작) — s2 탭에서만 표시
s2FootprintObjects.push(box({ x: s2X0, z: s2FrontZ, w: s2W, d: s2D, y: planY, h: planH, mat: materials.foundation, cast: false, name: 'ground' }));
// 기초(온통 0.5m 슬래브) — 's2 기초' 토글
captureInto(s2FoundationObjects, () => {
  box({ x: s2X0, z: s2FrontZ, w: s2W, d: s2D, y: groundTopY, h: MAT_H, mat: materials.matFoundation });   // 집 매트 0.5m
  planYDim(-0.1, s2BackZ + 0.1, groundTopY, groundTopY + MAT_H, '기초 0.5m');   // 남쪽 모서리 높이 치수(s1과 동일 위치)
});
// 옥외 계단 사양(단일 출처) — deckStairs 호출·'1층 바닥' 메모가 공유. 지면~1층 바닥 윗면(기초 0.5+바닥 마감)까지 오름.
const s2FrontStair = { steps: 5, tread: 0.3 };              // 정면 전체폭(집 너비) 옥외 계단 — 포세린 타일
const s2RearStair = { steps: 4, tread: 0.25, width: 1.0 };  // 뒤 출입문 옥외 계단 — 포세린 타일
// 정면(앞·현관 쪽) 전체폭 옥외 계단 — 지면부터 1층 바닥(기초 0.5+바닥 마감)까지, 집 너비 전체, 앞(−Z)으로 디딤. 's2 1층' 토글.
captureInto(s2Floor1Objects, () => {
  deckStairs({ axis: 'x', span0: s2X0, span1: s2X0 + s2W, edge: s2FrontZ, outward: -1, topY: groundTopY + MAT_H + S2_STAIR.slabT, baseY: groundTopY, steps: s2FrontStair.steps, tread: s2FrontStair.tread, mat: materials.porcelainDeck });
});
// 치수 + 기준선 — s1과 같은 부분(너비=위, 깊이=양옆)
captureInto(s2DimObjects, () => {
  planXDim(lotZ1 + 0.4, s2X0, s2X0 + s2W, `${fmtDim(s2W)}m`);          // 너비(s1 8.5m 자리)
  planZDim(lotX1 + 0.35, s2FrontZ, s2BackZ, `${fmtDim(s2D)}m`);        // 깊이(파생) — 안방측(s1 4.0m 자리)
  planZDim(lotX0 - 0.4, s2FrontZ, s2BackZ, `${fmtDim(s2D)}m`);         // 깊이(파생) — 주방측(s1 4.0m 자리)
  // 기준선(회청색) — 새 끝점만: 너비 끝 x=8, 깊이 앞 z=s2FrontZ (x=0·뒤 z=3.3은 공통 기준선 사용)
  const gridMat2 = new THREE.MeshBasicMaterial({ color: 0x5b7185 });
  const gw = 0.02, gy = 0.009, gh = 0.002;
  const gz0 = lotZ0 - 0.6, gz1 = lotZ1 + 0.6, gx0 = lotX0 - 0.6, gx1 = lotX1 + 0.6;
  box({ x: (s2X0 + s2W) - gw / 2, z: gz0, w: gw, d: gz1 - gz0, y: gy, h: gh, mat: gridMat2, cast: false, name: 'ground' });   // 너비 끝(x=8) 세로 기준선
  box({ x: gx0, z: s2FrontZ - gw / 2, w: gx1 - gx0, d: gw, y: gy, h: gh, mat: gridMat2, cast: false, name: 'ground' });       // 깊이 앞 가로 기준선
});

// ── s2 계단(현행·좌우런·우측벽 스위치백, 1→3층) — 'cS2Stair2' 토글 = 구조 '계단' ──────
// 구안(s2Stair3: 앞뒤런·뒷벽 참)을 90° 돌린 현행안. 두 직선런이 좌우(±X)로 오르고,
//   180° 스위치백 참을 우측벽(低X)에 밀착 → 화장실·방배치 자유도 확보. 입구·층 연결은 반대편(高X·안방쪽).
// 단높이(R) 전 구간 0.15m 통일 → 1→2층 22단·2→3층 20단, 끊김 없이 각 층 바닥에 정확히 착지.
let s2G1FrontInnerX, s2G2FrontInnerX;   // 3층 게스트룸1·2 정면벽 안쪽벽 면(X) — 계단 계산부에서 도출, 정면 픽스창 배치의 단일 출처
let s2Landing12Y, s2Landing23Y;         // 계단참(스위치백 참) 윗면 Y — 1-2참·2-3참, 계단실 채광창 높이 기준(계단 계산부에서 도출)
const s2FrontFixInset = 0.3;            // 정면 픽스창 양옆 벽면 여백 — 외벽 안쪽면·게스트룸 내벽면 공통 30cm(외벽은 두께 30cm라 바깥면 기준 60cm)
const s2FrontFixSpans = () => [         // [주방쪽(低X)·안방쪽(高X)] 정면 픽스창 X스팬 — 2·3층 정면 픽스창이 공유(같은 폭·수직 정렬)
  { p0: (s2X0 + s2WallT) + s2FrontFixInset, p1: s2G1FrontInnerX - s2FrontFixInset },   // 주방쪽: 외벽 ~ 게스트룸1 옆벽
  { p0: s2G2FrontInnerX + s2FrontFixInset, p1: (s2W - s2WallT) - s2FrontFixInset },     // 안방쪽: 게스트룸2 복도벽 ~ 외벽
];
(() => {
  const baseY = groundTopY + MAT_H;
  const { T, R, W, g, tTh, nosing, rTh, usTh, nUpper, landingSteps } = S2_STAIR;
  const inX0 = s2X0 + s2WallT, inZ0 = s2FrontZ + s2WallT;   // 외벽 안쪽: 우측벽(低X)·앞
  const inX1 = s2W - s2WallT, inZ1 = s2BackZ - s2WallT;     // 외벽 안쪽: 좌측벽(高X)·뒤
  const inW = inX1 - inX0;
  const wF = 2 * W + g;                                     // 참 Z폭(두 행 + 틈)
  const zA0 = inZ1 - W, zB0 = inZ1 - wF;                    // 하부런 행(뒤벽 밀착)·상부런 행(앞쪽)
  const xRun0 = inX0 + W;                                   // 런 시작 X(우측벽 참 바로 옆)
  const treadX = (x, z, topY, dir) => box({ x: dir < 0 ? x - nosing : x, z, w: T + nosing, d: W, y: topY - tTh, h: tTh, mat: materials.stair });   // 좌우(±X)로 오르는 단(앞코 nosing 돌출, dir=오름 앞방향) — nosing·rTh는 S2_STAIR 참조
  const riserX = (xMin, z, topY) => box({ x: xMin, z, w: rTh, d: W, y: topY - tTh - R, h: R, mat: materials.stairWall });   // 챌판 — 디딤판 앞면 수직판(한 단높이 R, 발판과 다른 색). 윗면을 발판 밑면(topY-tTh)에 맞춰 겹침 제거
  const landing = (topY) => box({ x: inX0, z: zB0, w: W, d: wF, y: topY - tTh, h: tTh, mat: materials.landing });   // 우측벽 참(두 행 덮음)

  const f1Top = baseY + S2_STAIR.slabT;
  let acc = f1Top; const levels = [f1Top];
  for (const h of S2_STAIR.floorH) { acc += h; levels.push(acc); }
  // 상부런(계단참 위·앞 행) 단 수는 비행별로 지정 → 남는 단차는 하부런(계단참 아래·뒤벽 행)에서 흡수.
  //   두 비행 모두 층고 3.0m(20단)이라 네 직선 런을 전부 9단으로 균등: 1→2 = 9·9, 2→3 = 9·9.
  const flights = [];
  for (let f = 0; f < levels.length - 1; f += 1) {
    const fl = levels[f], rise = levels[f + 1] - fl;
    flights.push({ fl, risers: Math.round(rise / R) });    // 20(3.0) · 20(3.0)
  }
  const meta = [];
  // 비행을 런·계단참 단위로 따로 캡처 → 층별 '계단' 버튼이 그 층에 속한 부분만 보임(공유 부재는 applyVisibility서 OR).
  //   1→2: 하부런(LowA) / 1-2참+상부런(MidA, 1·2층 공유)   ·   2→3: 하부런(LowB) / 2-3참(MidB, 2·3층 공유) / 상부런(UpB)
  const drawLowerRun = (fl, nL) => {                            // 하부런(뒤벽 행): 멀리(高X)→참(右벽) 오름, 앞코 高X쪽
    for (let k = 1; k <= nL; k += 1) {
      const top = fl + (nL - k + 1) * R;
      treadX(xRun0 + (k - 1) * T, zA0, top, 1);
      riserX(xRun0 + k * T - rTh, zA0, top);                    // 챌판 — 하부런 앞면(高X쪽)
    }
  };
  const drawUpperRun = (fl, nL, nUp) => {                       // 상부런(앞 행): 참→멀리(高X) 오름, 위층 착지, 앞코 低X쪽
    for (let m = 1; m <= nUp; m += 1) {
      const top = fl + (nL + 1 + m) * R;
      treadX(xRun0 + (m - 1) * T, zB0, top, -1);
      riserX(xRun0 + (m - 1) * T, zB0, top);                    // 챌판 — 상부런 앞면(低X쪽)
    }
  };
  flights.forEach(({ fl, risers }, fi) => {
    const nUp = nUpper[fi];                                                                  // 상부런 단 수(비행별) — 위에서부터 8·10·10·10이 되도록
    const nL = risers - landingSteps - nUp;                                                  // 하부런(계단참 아래) 단 수 — 남는 단차 흡수(계단참이 먹는 단=landingSteps)
    const landingTopY = fl + (nL + 1) * R;                                                   // 이 비행 계단참 윗면 Y
    if (fi === 0) s2Landing12Y = landingTopY; else s2Landing23Y = landingTopY;               // 계단실 채광창 높이 기준(하네스 단일 출처)
    if (fi === 0) {
      // 1→2 하부런 + 1층 계단아래 수납 → LowA(1층 계단)
      captureInto(s2StairLowA, () => {
        drawLowerRun(fl, nL);
        box({ x: xRun0 - rTh, z: zA0, w: rTh, d: W, y: levels[0], h: fl + (nL + 1) * R - tTh - levels[0], mat: materials.landingRiser });   // 계단참 직전 챌판 — 1층 바닥까지 연장(구별용 파랑). 윗끝을 계단참 밑면(−tTh)까지로 줄여 참과 겹침 제거
        // 1층 시작계단~첫 계단참: 하부런 앞면(주방쪽·低Z)을 단 윤곽 따라 바닥까지 막아 계단 아래 수납(계단형 문)
        for (let k = 1; k <= nL; k += 1)
          box({ x: xRun0 + (k - 1) * T, z: zA0 - usTh, w: T, d: usTh, y: levels[0], h: (nL - k + 1) * R, mat: materials.interiorDoor });   // 단별 문 패널(높이=그 단까지)
        // 계단참 아래 문 — 세로 반 분할 쌍여닫이(양쪽으로 열림). 경첩=양 끝(우측벽쪽·런쪽), 손잡이=가운데 맞닿는 곳.
        const lgap = 0.02, leafW = (W - lgap) / 2, doorZ = zA0 - usTh, doorH = (nL + 1) * R - tTh, hy = levels[0] + 1.0;   // 윗끝을 계단참 밑면(−tTh)까지로 줄여 참과 겹침 제거
        box({ x: inX0, z: doorZ, w: leafW, d: usTh, y: levels[0], h: doorH, mat: materials.interiorDoorLanding });                 // 좌 문짝
        box({ x: inX0 + leafW + lgap, z: doorZ, w: leafW, d: usTh, y: levels[0], h: doorH, mat: materials.interiorDoorLanding });   // 우 문짝
        box({ x: inX0 + leafW - 0.05, z: doorZ - 0.03, w: 0.05, d: 0.03, y: hy, h: 0.05, mat: materials.handle });                 // 좌 손잡이
        box({ x: inX0 + leafW + lgap, z: doorZ - 0.03, w: 0.05, d: 0.03, y: hy, h: 0.05, mat: materials.handle });                 // 우 손잡이
        label('계단 아래 수납(계단형 문)', xRun0 + 1.0, levels[0] + 0.5, zA0 - 0.1, 'furniture');
      });
      // 1-2계단참 + 상부런 → MidA(1·2층 공유)
      captureInto(s2StairMidA, () => {
        landing(fl + (nL + 1) * R);                                                          // 우측벽 참(180° 반환)
        drawUpperRun(fl, nL, nUp);
      });
    } else {
      // 2→3 하부런 → LowB(2층 계단)
      captureInto(s2StairLowB, () => { drawLowerRun(fl, nL); });
      // 2-3계단참 → MidB(2·3층 공유)
      captureInto(s2StairMidB, () => {
        landing(fl + (nL + 1) * R);                                                          // 우측벽 참(180° 반환)
        box({ x: xRun0 - rTh, z: zA0, w: rTh, d: W, y: fl + (nL + 1) * R - R - tTh, h: R, mat: materials.stairWall });   // 계단참 챌판 — 참과 그 아래 마지막 하부런 발판 사이 세로판. 계단참 두께(tTh)만큼 아래로 내려 참과 겹침 제거
      });
      // 2→3 상부런 → UpB(3층 계단)
      captureInto(s2StairUpB, () => { drawUpperRun(fl, nL, nUp); });
    }
    meta.push({ lowerFarX: xRun0 + nL * T, upperFarX: xRun0 + nUp * T });
  });

  // 각 층 바닥(층참) — 별도 행 [바닥][1층][2층][3층]로 토글하도록 층별로 따로 캡처.
  const floor2T = s2Floor2SlabT, floor3T = s2Floor3SlabT;   // 2·3층 바닥 두께 — 모듈 단일 출처 참조
  // 계단실 구멍은 '그 층에서 실제로 오르내리는 런'까지만 비운다 — 올라와 닿는 상부런 + 거기서 올라가는 다음 비행 하부런. 그래야 다음 계단 발이 바닥에 붙는다.
  //   1→2 아래 런(가장 긴 11단)은 1층 레벨이라 2층 구멍과 무관 → 그 길이로 깎으면 2→3 발이 구멍 위에 뜬다.
  const far2 = Math.max(meta[0].upperFarX, meta[1].lowerFarX);   // 2층 계단실 끝 = 1→2 상부런(10)·2→3 하부런(10) 중 먼 쪽
  const far3 = meta[1].upperFarX;   // 최상층 계단실 끝 = 2→3 상부런(8)이 올라와 닿는 끝. 하부런은 3층 바닥 아래라 무관(상부런 단수로만 결정)
  const cgcW = s2LandingW;                  // 층계참(별색 도착참) 폭(X) — 모듈 단일 출처. 별색 구역·홈리프트 끝선이 이 값을 공유
  Object.assign(s2Geo, { inX0, inX1, inZ0, inZ1, wF, far2 });   // 그리기 실좌표를 메모로 노출(2층 방·화장실 치수 단일 출처)
  captureInto(s2Floor1Objects, () => {
    box({ x: inX0, z: inZ0, w: inW, d: inZ1 - inZ0, y: baseY, h: S2_STAIR.slabT, mat: materials.porcelainDeck });   // 1층 바닥(전체)
  });
  // 공간 자리 표시(1m 정사각, 추후 화장실·방으로 크기 조정 예정) — 바닥 위에 색칠. 2·3층 동일 배치.
  //   화장실=왼쪽(高X)-뒤(高Z) 코너 / 방=앞벽(低Z) 좌(高X)·우(低X). 셋 다 서로 다른 색·바닥색과 구별.
  // 3층 두 방 크기(연두·회색=하늘) — 같은 직사각형을 90° 돌려 배치, 서로·주황(계단 도착칸)·계단실과 안 겹침. 좌표는 단일 출처로 도출.
  const RM_S = s2RoomShort;                  // 짧은변 = 고정 상수(2.8) — 집 깊이가 이 값에서 파생(연두 깊이 = 회색 너비)
  const wcSinkGap = s2WcSinkGap;             // 변기↔세면대 중심 표준 간격(주택 욕실) — 모듈 단일 출처
  const wcSinkOff = s2WcToiletOff + wcSinkGap + s2F3VanityW / 2;   // 세면대 하부장 시작점 — inX1에서 거리(변기 중심 오프셋 + 표준 간격 + 세면대 반폭)
  // 게스트룸2 너비(g2RoomW)·깊이(RM_L)·3층 화장실 너비(wcW3)는 홈리프트 좌표에서 파생 → 리프트 정의 뒤로 이동
  // 홈리프트(아리코 컴팩트 6번 — 내경 1100×1480, 외경 1500×1600) 세로 샤프트. 세면대(뒤 외벽·高Z) 低X변에 붙여 세면대는 제자리 두고 옆에 벽 세워 만드는 자리. 문=앞(-Z, 복도쪽). 기존 벽 무시.
  const liftW = s2LiftW, liftD = s2LiftD;               // 외경 — 깊이 1.5(X) × 문면 폭 1.6(Z, 계단쪽 -X면). 문이 계단을 마주봄 (모듈 단일 출처)
  const liftX0 = far2 + cgcW;                            // 층계참(별색 도착참 far2~far2+cgcW) 끝선에 低X변 밀착 — 그 옆(안방쪽)
  s2G1FrontInnerX = far3;                                // 게스트룸1 정면벽 안쪽벽 면 = 옆벽(far3·계단측 포켓도어 벽 방쪽 면)
  s2G2FrontInnerX = liftX0 + 0.15;                       // 게스트룸2 정면벽 안쪽벽 면 = 복도쪽 벽(15cm) 방쪽 면
  const liftZ0 = inZ1 - liftD;                           // 뒤 외벽(高Z)에 등 붙임
  const wcFaceX = liftX0 + liftW + 0.10;                 // 2층 화장실 低X 안쪽면(단일 출처) — 홈리프트 高X(안방쪽)면에 벽(0.10) 밀착. 화장실은 홈리프트 왼쪽
  // 게스트룸2·3층 화장실(3층) — 홈리프트에 맞춰 재구성(단일 출처: 리프트 좌표)
  const g2RoomW = inX1 - liftX0;             // 게스트룸2 너비 — 복도쪽 벽을 홈리프트 저X(복도)면에 맞춤(옛 벽서 5cm 안쪽)
  const RM_L = liftZ0 - inZ0 - 1.0;          // 게스트룸2 깊이 — 뒤 칸막이벽과 홈리프트 앞(低Z)면 사이에 폭 1.0m 복도
  const wcW3 = inX1 - wcFaceX;               // 3층 화장실 너비 — 低X벽을 홈리프트 高X면(wcFaceX)에 붙여 겹침 제거(2층과 동일)
  const liftMarkMat = new THREE.MeshLambertMaterial({ color: 0xff4fa3, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide });
  const liftDoorMat = new THREE.MeshLambertMaterial({ color: 0x1e6fff, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide });   // 문(계단쪽·-X)면 별색 표시
  const drawLiftColumn = (y0, y1) => {   // 세로 반투명 직육면체 기둥(홈리프트 샤프트) — 층별 구간으로 나눠 각 층 토글에 딸림
    box({ x: liftX0, z: liftZ0, w: liftW, d: liftD, y: y0, h: y1 - y0, mat: liftMarkMat, cast: false });
    box({ x: liftX0 - 0.03, z: liftZ0, w: 0.06, d: liftD, y: y0, h: y1 - y0, mat: liftDoorMat, cast: false });   // 문면(계단쪽·-X) — 파랑, 너비=깊이(1.6)
  };
  captureInto(s2LiftObjects, () => drawLiftColumn(levels[0], roofY));   // 홈리프트 전체 샤프트(1층 바닥~처마) — 독립 '홈리프트' 토글(층 그룹과 분리)
  const placeMark = (fy, big, wcW = 1.0, wcD = 1.0) => {
    const m = (mat, x0, z0, w = 1.0, d = 1.0) => box({ x: x0, z: z0, w, d, y: fy + 0.006, h: 0.012, mat, cast: false });
    m(materials.wcFloor, inX1 - wcW, inZ1 - wcD, wcW, wcD);   // 화장실 자리(왼쪽-뒤 코너) — 보라
    if (big) {
      m(materials.s3Room2, inX0, inZ0, far3 - inX0, zB0 - inZ0);   // 게스트룸1(연두) — 옆벽(far3)·앞/주방쪽 외벽 안쪽의 실제 공간
      m(materials.s3Room1, inX1 - g2RoomW, inZ0, g2RoomW, RM_L);   // 회색(하늘) — 안방쪽, 세로로 긴 직사각형(좌측벽 밀착). 복도 1.0m 되도록 너비 g2RoomW
    } else {
      m(materials.s3Room2, inX0, inZ0, inW, zB0 - 0.10 - inZ0);   // 앞쪽 길쭉한 방 — 분리벽(zB0-0.10) 앞 전체 폭
    }
  };
  // 1·2·3층 층계참(도착칸) — '계단' 토글에 포함(층 바닥과 분리). 계단실 깊이 그대로 뒤 외벽까지, 계단 끝~홈리프트 앞 바닥. 다른 용도 불가 표시.
  captureInto(s2Stair2Objects, () => {
    box({ x: far2, z: zB0, w: cgcW, d: inZ1 - zB0, y: levels[0] + 0.006, h: 0.012, mat: materials.stairUpZone1, cast: false });   // 1층 층계참(홈리프트 앞)
    box({ x: far2, z: zB0, w: cgcW, d: inZ1 - zB0, y: levels[1] + 0.006, h: 0.012, mat: materials.stairUpZone2, cast: false });   // 2층 도착칸
    box({ x: far3, z: zB0, w: cgcW, d: inZ1 - zB0, y: levels[2] + 0.006, h: 0.012, mat: materials.stairUpZone3, cast: false });   // 3층 도착칸
  });
  captureInto(s2Floor2Objects, () => {
    box({ x: inX0, z: inZ0, w: inW, d: zB0 - inZ0, y: levels[1] - floor2T, h: floor2T, mat: materials.floorSlab });   // 런 앞쪽(저Z) 전체 폭
    box({ x: far2, z: zB0, w: inX1 - far2, d: inZ1 - zB0, y: levels[1] - floor2T, h: floor2T, mat: materials.floorSlab });   // 런 밴드: 계단실 끝부터 직사각으로 채움
    // 계단실 옆벽 — 1→2 상부런 오를 때 왼쪽(앞쪽·저Z) 열린 변. 2층 바닥~천장(3층 바닥 밑면)까지 15cm 두께. 끝(계단 도착·高X)에서 1.2m 더 연장.
    //   도착칸 1.2m 가운데에 표준 슬라이딩 포켓도어(0.9×2.1) — 왼쪽(低X)으로 슬라이드. 그쪽으로만 벽이 길게 이어져 포켓 공간이 있고, 高X쪽은 모서리라 포켓 불가.
    {
      const wz = zB0 - 0.20, wt = 0.20, wTop = (levels[2] - floor3T) - levels[1];   // 내력벽 20cm — 뒤(계단 개구부·+Z zB0)면 고정, 안방쪽(-Z)으로 키움
      const oX0 = far2 + (1.2 - interiorDoorW) / 2, oX1 = oX0 + interiorDoorW;            // 도착칸 방문 개구(1.2m 가운데, 폭 0.9)
      const bdW = s2F2.doorW, bdX0 = wcFaceX + s2WallInner, bdX1 = bdX0 + bdW;            // 화장실 문 — 안방에서 밀어 들어옴(안여닫이 +Z). 화장실 低X 벽(wcFaceX)서 내벽두께
      box({ x: inX0, z: wz, w: oX0 - inX0, d: wt, y: levels[1], h: wTop, mat: materials.wall });                       // 왼쪽 벽(低X·포켓 수납)
      box({ x: oX1, z: wz, w: bdX0 - oX1, d: wt, y: levels[1], h: wTop, mat: materials.wall });                        // 가운데 벽(방문~화장실문)
      box({ x: bdX1, z: wz, w: inX1 - bdX1, d: wt, y: levels[1], h: wTop, mat: materials.wall });                      // 오른쪽 벽(화장실문~안방 외벽)
      box({ x: oX0, z: wz, w: interiorDoorW, d: wt, y: levels[1] + interiorDoorH, h: wTop - interiorDoorH, mat: materials.wall });   // 방문 위 인방
      box({ x: bdX0, z: wz, w: bdW, d: wt, y: levels[1] + interiorDoorH, h: wTop - interiorDoorH, mat: materials.wall });            // 화장실문 위 인방
      // 표준 방문 — 계단(도착칸)쪽에서 앞방쪽(-Z)으로 열리는 여닫이 0.9×2.1. 경첩=高X(oX1) 모서리, 손잡이=低X 자유단.
      box({ x: oX0, z: wz, w: interiorDoorW, d: 0.04, y: levels[1], h: interiorDoorH, mat: materials.stdRoomDoor });   // 문짝(닫힘, 분리벽 방쪽 면=wz)
      box({ x: oX0 + 0.18, z: wz - 0.03, w: 0.05, d: 0.05, y: levels[1] + 1.02, h: 0.05, mat: materials.handle });           // 손잡이(低X 자유단, 계단쪽)
      const rswing = new THREE.Mesh(
        new THREE.CylinderGeometry(interiorDoorW, interiorDoorW, 0.02, 24, 1, false, Math.PI, Math.PI / 2),
        new THREE.MeshLambertMaterial({ color: 0x66aaff, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
      );
      rswing.position.set(oX1, levels[1] + 0.02, wz);   // PI~3PI/2 = -Z(앞방 열림)~-X(닫힘,벽). 경첩 高X
      scene.add(rswing);   // captureInto가 s2Floor2Objects로 자동 수집
      label('표준 방문', oX0 + interiorDoorW / 2, levels[1] + 1.0, wz + 0.025, 'opening');
      // 화장실 문짝 — 앞 분리벽에 폭 0.7. 안방서 밀면 화장실 안(+Z)으로 90° 열림. 경첩=低X(bdX0) 모서리.
      box({ x: bdX0, z: zB0 - 0.04, w: bdW, d: 0.04, y: levels[1], h: interiorDoorH, mat: materials.wcDoor });         // 문짝(닫힘, 분리벽)
      box({ x: bdX1 - 0.18, z: zB0 - 0.07, w: 0.05, d: 0.05, y: levels[1] + 1.02, h: 0.05, mat: materials.handle });   // 손잡이(高X 자유단, 앞방쪽)
      const bswing = new THREE.Mesh(
        new THREE.CylinderGeometry(bdW, bdW, 0.02, 24, 1, false, 0, Math.PI / 2),
        new THREE.MeshLambertMaterial({ color: 0x66aaff, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false }),
      );
      bswing.position.set(bdX0, levels[1] + 0.02, zB0);   // 0~PI/2 = +Z(안쪽 열림)~+X(닫힘,벽). 경첩 低X
      scene.add(bswing);   // captureInto가 s2Floor2Objects로 자동 수집
      label('화장실 문', bdX0 + bdW / 2, levels[1] + 1.4, zB0 - 0.05, 'opening');
    }
    // 화장실 低X 벽 — 홈리프트 高X(안방쪽)면에 밀착. 10cm, 바닥~천장. 홈리프트·층계참(低X)과 화장실(高X) 분리.
    box({ x: wcFaceX - 0.10, z: zB0, w: 0.10, d: inZ1 - zB0, y: levels[1], h: (levels[2] - floor3T) - levels[1], mat: materials.wall });
    placeMark(levels[1], false, inX1 - wcFaceX, wF);   // 2층 화장실 = 벽 뺀 실사용 바닥(화장실벽 안쪽 wcFaceX~안방외벽 × 분리벽 안쪽 zB0~뒤벽)
    // 2층 화장실 권장 배치 — 변기(3층과 수직정렬·위치 고정) · 샤워부스 · 세면대(벽수전·좌우 용품여유) · 50L 전기온수기(외벽 상부) · 세탁/건조 예정공간.
    //   막힌 변: 高X 안방 외벽(inX1)·뒤 외벽(inZ1)·低X 도착칸벽(far2+1.3). 문=앞 분리벽(앞방서 밀어 +Z).
    {
      const fy = levels[1], px1 = inX1, pz1 = inZ1, bz0 = zB0;
      // 변기 — 안방쪽-뒤(高X·高Z) 코너. 3층 변기와 X·Z 동일 오프셋 → 오수 입상관 직하(위치 고정). 중심 옆벽서 0.42m.
      box({ x: px1 - 0.64, z: pz1 - 0.1, w: 0.44, d: 0.1, y: fy, h: 0.5, mat: materials.toilet });    // 물탱크
      box({ x: px1 - 0.62, z: pz1 - 0.55, w: 0.4, d: 0.45, y: fy, h: 0.34, mat: materials.toilet });  // 양변기
      label('변기', px1 - 0.63, fy + 0.95, pz1 - 0.45, 'furniture');
      // 샤워부스 — 안방쪽-앞(高X·低Z) 코너. 변기와 함께 왼쪽(안방쪽) 습식존. 0.9×0.85 방수트레이(유리벽 없이 개방 — 변기앞 공간 확보).
      const shW = s2F2.showerW, shD = s2F2.showerD, shx = px1 - shW, shz = bz0;
      box({ x: shx, z: shz, w: shW, d: shD, y: fy, h: 0.06, mat: materials.shower });                       // 방수 트레이
      box({ x: px1 - 0.16, z: shz + 0.42, w: 0.06, d: 0.06, y: fy + 1.9, h: 0.08, mat: materials.handle });  // 샤워헤드(高X 외벽)
      label('샤워부스', shx + shW / 2, fy + 1.05, shz + shD / 2, 'furniture');
      // 세면대 — 변기 옆(3층처럼), 뒤 외벽(高Z)에 등 붙임. 변기와 표준 간격(중심 0.75m). 하부장 폭0.6·깊이0.5. 수전은 뒤 외벽 벽수전.
      const vW = s2F2.vanityW, vD = s2F2.vanityD, vx = inX1 - wcSinkOff, vz = pz1 - vD;
      box({ x: vx, z: vz, w: vW, d: vD, y: fy, h: 0.8, mat: materials.sinkCabinet });                       // 하부장
      box({ x: vx + 0.06, z: vz + 0.1, w: vW - 0.12, d: vD - 0.2, y: fy + 0.8, h: 0.04, mat: materials.sinkBasin });   // 세면볼
      box({ x: vx + vW / 2 - 0.03, z: pz1 - 0.12, w: 0.06, d: 0.10, y: fy + 1.0, h: 0.06, mat: materials.entryFrame });   // 벽수전(뒤 외벽서)
      label('세면대', vx + vW / 2, fy + 1.12, vz + vD / 2, 'furniture');
      // 50L 전기온수기 — 외벽(高Z 뒤) 상부, 변기 위 코너에 벽거치. 50L는 하부장에 숨기기엔 커 외벽 상부에 건다.
      const heater = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.55),
        new THREE.MeshLambertMaterial({ color: 0x9fd0e0, transparent: true, opacity: 0.4, depthWrite: false }),
      );
      heater.position.set(px1 - 0.30, fy + 1.95, pz1 - 0.28);
      scene.add(heater);   // captureInto가 s2Floor2Objects로 자동 수집
      label(`전기온수기 ${s2F2.heaterL}L`, px1 - 0.5, fy + 2.3, pz1 - 0.3, 'mep');
    }
    // 안방(앞 트인 방) 크기 라벨 — 게스트룸처럼 실사용 바닥(앞 외벽 안쪽 ~ 분리벽 안쪽 zB0-0.20, 내력벽 20cm). 방 이름 색(연노랑)으로 흰색 치수와 구별.
    const abW = inW, abD = (zB0 - 0.20) - inZ0;
    label(`안방 ${abW.toFixed(2)}×${abD.toFixed(2)}m`, inX0 + abW / 2, levels[1] + 0.4, inZ0 + abD / 2, 'room');
    // 안방 침대 2.0×2.0 (높이 0.4m) — 주방쪽(低X) 외벽 + 앞 외벽(inZ0) 코너에 붙임(머리를 앞쪽으로, 3층 게스트룸1과 동일 방향).
    const bedZ0 = inZ0;
    box({ x: inX0, z: bedZ0, w: 2.0, d: 2.0, y: levels[1], h: 0.4, mat: materials.bed });
    label('침대 2.0×2.0m', inX0 + 1.0, levels[1] + 0.7, bedZ0 + 1.0, 'furniture');
    // 안방 베개 2개 — 머리맡=앞 외벽(低Z)쪽, 게스트룸1과 동일 위치.
    const abPillowMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    for (const cx of [inX0 + 0.5, inX0 + 1.3]) box({ x: cx - 0.35, z: bedZ0 + 0.07, w: 0.7, d: 0.4, y: levels[1] + 0.4, h: 0.1, mat: abPillowMat });
    // 안방 서랍장(낮은 장) — 높이 0.8m·깊이 0.4m. 침대 옆면(방문쪽·高X)에 붙여 침대 길이(2.0m)만큼 나란히.
    const drwD = 0.40;
    box({ x: inX0 + 2.0, z: bedZ0, w: drwD, d: 2.0, y: levels[1], h: 0.80, mat: materials.sinkCabinet });
    label('서랍장 h0.8·d0.4', inX0 + 2.0 + drwD / 2, levels[1] + 1.0, bedZ0 + 1.0, 'furniture');
    // 안방 이불장(붙박이장) — 뒤 계단실 분리벽(zB0-0.20)에 등 붙이고 방 앞(-Z)으로 깊이 0.7m. 침대와 같은 주방쪽 정렬·폭 2.0m. 게스트룸1 붙박이장과 동일 방향.
    const bdgD = 0.70, bdgW = 2.0, bdgH = 2.0;
    const bdgZ1 = zB0 - 0.20, bdgZ0 = bdgZ1 - bdgD;
    box({ x: inX0, z: bdgZ0, w: bdgW, d: bdgD, y: levels[1], h: bdgH, mat: materials.sinkCabinet });
    label(`이불장 ${bdgW.toFixed(1)}×${bdgD.toFixed(1)}m`, inX0 + bdgW / 2, levels[1] + bdgH + 0.3, bdgZ0 + bdgD / 2, 'furniture');
    // 안방 한문형 냉장고 — 1층 기존 냉장고와 동일(311L, 0.545×0.689×1.70). 화장실 앞벽 왼쪽 끝(안방 외벽 高X 코너)에 등 붙임. 문=방(低Z)쪽.
    {
      const rW = 0.545, rD = 0.689, rH = 1.70;                  // 폭(X, 화장실벽 따라)·깊이(Z, 방쪽 돌출)·높이
      const rBackZ = zB0 - 0.20;                                // 화장실 앞벽 방(低Z)쪽 면
      const rFrontZ = rBackZ - rD;                              // 냉장고 앞면 z
      const rx0 = inX1 - rW;                                    // 안방 외벽(高X)에 밀착
      box({ x: rx0, z: rFrontZ, w: rW, d: rD, y: levels[1], h: rH, mat: materials.fridge });   // 본체
      // 문(2도어 상부냉동) — 문 면=방(低Z)쪽, 경첩=안방 외벽(高X)쪽, 손잡이=주방(低X)쪽 → 문은 방 안으로 열림
      const rdt = 0.02, rfzH = rH * 0.30;
      box({ x: rx0 + 0.005, z: rFrontZ - rdt, w: rW - 0.01, d: rdt, y: levels[1] + rH - rfzH, h: rfzH - 0.01, mat: materials.fridgeDoor });   // 상부 냉동실 문
      box({ x: rx0 + 0.005, z: rFrontZ - rdt, w: rW - 0.01, d: rdt, y: levels[1] + 0.01, h: rH - rfzH - 0.02, mat: materials.fridgeDoor });   // 하부 냉장실 문
      const rhx = rx0 + 0.07;                                   // 손잡이 x(주방 低X = 경첩 반대편)
      box({ x: rhx, z: rFrontZ - rdt - 0.03, w: 0.04, d: 0.03, y: levels[1] + rH - rfzH - 0.42, h: 0.4, mat: materials.guard });   // 하부 문 손잡이
      box({ x: rhx, z: rFrontZ - rdt - 0.03, w: 0.04, d: 0.03, y: levels[1] + rH - rfzH + 0.05, h: 0.28, mat: materials.guard });  // 상부 문 손잡이
      label(`한문형 냉장고 311L · ${fmtDim(rW)}×${fmtDim(rD)}`, rx0 + rW / 2, levels[1] + rH + 0.15, rFrontZ + rD / 2, 'furniture');
    }
    // 벽걸이 냉난방기(위니아 11평형 MRW11HSF, 실내기 1003×310×222) — 냉장고 위 왼쪽 벽(안방 외벽 高X)에 천장 가까이. 뒤(분리벽쪽)에 맞춰 앞(-Z)으로 뻗음. 토출 -X(실내).
    {
      const acLen = 1.003, acH = 0.310, acD = 0.222;
      const acZ0 = (s2FrontZ + 2.2) + 0.30;              // 안방 좌측창 뒤(高Z) 끝(s2FrontZ+2.2)에서 30cm 이격
      const acY = levels[1] + 2.7 - 0.15 - acH;          // 천장고 2.7 밑 0.15 여유
      box({ x: inX1 - acD, z: acZ0, w: acD, d: acLen, y: acY, h: acH, mat: materials.wall });                                    // 본체(흰색)
      box({ x: inX1 - acD + 0.02, z: acZ0 + 0.06, w: acD - 0.04, d: acLen - 0.12, y: acY - 0.015, h: 0.025, mat: materials.openingEdge });   // 하부 토출 슬릿
      label('위니아 냉난방기 11평형 MRW11HSF', inX1 - 0.3, acY + 0.17, acZ0 + acLen / 2, 'mep');
    }
    // 안방 책상 — 앞쪽 벽(低Z)에 등 붙이고 왼쪽 벽(高X·안방 외벽)에 붙임. 길이 1.8m(X)·깊이 0.6m·높이 0.72m. 윗판+다리 4.
    {
      const dW = 1.8, dD = 0.6, dH = 0.72, dtop = 0.04, dleg = 0.06;
      const dx1 = inX1, dx0 = dx1 - dW;          // 오른끝=왼쪽 외벽(高X) 밀착
      const dz0 = inZ0;                            // 뒤끝=앞 외벽(低Z) 밀착
      box({ x: dx0, z: dz0, w: dW, d: dD, y: levels[1] + dH - dtop, h: dtop, mat: materials.woodFrame });   // 윗판
      for (const lx of [dx0 + 0.02, dx1 - 0.02 - dleg])
        for (const lz of [dz0 + 0.02, dz0 + dD - 0.02 - dleg])
          box({ x: lx, z: lz, w: dleg, d: dleg, y: levels[1], h: dH - dtop, mat: materials.woodFrame });   // 다리 4
      label(`책상 ${dW.toFixed(1)}×${dD.toFixed(1)}m`, dx0 + dW / 2, levels[1] + dH + 0.3, dz0 + dD / 2, 'furniture');
      // 책상 의자 — 책상 앞(+Z)에 두고 책상(−Z)을 향함. 좌판+등받이+다리 4. 좌판 0.45, 등받이 뒤(高Z)면.
      const cW = 0.45, seatH = 0.45, cLeg = 0.04, ccx = dx0 + dW / 2, ccz = dz0 + dD + 0.28;
      box({ x: ccx - cW / 2, z: ccz - cW / 2, w: cW, d: cW, y: levels[1] + seatH - 0.05, h: 0.05, mat: chairFrameMat });   // 좌판
      box({ x: ccx - cW / 2, z: ccz + cW / 2 - 0.04, w: cW, d: 0.04, y: levels[1] + seatH, h: 0.45, mat: chairFrameMat }); // 등받이(뒤·高Z)
      for (const lx of [ccx - cW / 2 + 0.02, ccx + cW / 2 - 0.02 - cLeg])
        for (const lz of [ccz - cW / 2 + 0.02, ccz + cW / 2 - 0.02 - cLeg])
          box({ x: lx, z: lz, w: cLeg, d: cLeg, y: levels[1], h: seatH - 0.05, mat: chairFrameMat });   // 다리 4
    }
    // 2층 층계참(도착칸)은 '계단' 토글에 포함 — 아래 s2Stair2Objects 블록에서 함께 그림(층 바닥과 분리).
  });
  captureInto(s2Floor3Objects, () => {
    box({ x: inX0, z: inZ0, w: inW, d: zB0 - inZ0, y: levels[2] - floor3T, h: floor3T, mat: materials.floorSlab });   // 런 앞쪽(저Z) 전체 폭
    box({ x: far3, z: zB0, w: inX1 - far3, d: inZ1 - zB0, y: levels[2] - floor3T, h: floor3T, mat: materials.floorSlab });   // 런 밴드: 계단실 끝부터 직사각으로 채움
    const wcSetback3 = 0.4;                     // 3층 화장실 문 있는 앞벽(복도쪽 低Z)을 뒤로 들여 앞 복도·실외기실 확보 — 깊이 축소(단일 출처). 깊이 = liftD−0.4 = 1.2m
    placeMark(levels[2], true, wcW3, liftD - wcSetback3);   // 3층 화장실 = 뒤쪽벽 따라 wcW3(X) × 왼쪽벽 따라 liftD−0.4(Z, 앞벽 0.4m 들임)
    const g1ClosetD = 0.8;                                                                                             // 붙박이장 깊이(단일 출처) — 게스트룸1 치수·장이 함께 참조
    const g1W = far3 - inX0, g1D = (zB0 - interiorWall - g1ClosetD) - inZ0;                                             // 게스트룸1 실사용 바닥 — 폭=옆벽(far3)~외벽, 깊이=앞 외벽~붙박이장 앞면(계단실 분리벽서 0.8m)
    label(`게스트룸1 ${g1W.toFixed(2)}×${g1D.toFixed(2)}m`, inX0 + g1W / 2, levels[2] + 0.4, inZ0 + g1D / 2, 'room');   // 게스트룸1(연두) — 벽 두께·붙박이장 뺀 실사용 바닥
    const g2W = g2RoomW - 0.15, g2D = RM_L - interiorWall;                                                              // 게스트룸2 실사용 바닥 — 폭=옆벽(15cm) 뺌, 깊이=뒤 칸막이벽(10cm) 뺌
    label(`게스트룸2 ${g2W.toFixed(2)}×${g2D.toFixed(2)}m`, inX1 - g2RoomW / 2, levels[2] + 0.4, inZ0 + RM_L / 2, 'room');   // 게스트룸2(회색) — 벽 두께 뺀 실사용 바닥
    // 보라색 화장실(왼쪽-뒤 코너) — 홈리프트 뒤(高X면)·복도쪽(홈리프트 끝선) 벽으로 둘러 막고, 복도(低Z)에서 문으로 진입.
    //   막힌 변: 좌측벽 inX1(高X)·뒤벽 inZ1(高Z)·홈리프트벽(低X)·복도벽(低Z). 문 = 복도벽(低Z)에서 안(+Z)으로 열림(2층 화장실문과 동일).
    {
      const fy = levels[2], px1 = inX1, pz1 = inZ1, px0 = inX1 - wcW3, pz0 = liftZ0 + wcSetback3;   // pz0 = 문 있는 앞벽 — 뒤로 0.2m 들임(복도 확보)
      // 변기 — 뒤벽(高Z)에 물탱크 붙이고 앞(低Z) 착석. 옆벽(좌측 高X)에서 0.2m 띄움(문 스윙 안 닿게, 안 붙게).
      box({ x: px1 - 0.64, z: pz1 - 0.1, w: 0.44, d: 0.1, y: fy, h: 0.5, mat: materials.toilet });    // 물탱크
      box({ x: px1 - 0.62, z: pz1 - 0.55, w: 0.4, d: 0.45, y: fy, h: 0.34, mat: materials.toilet });  // 양변기
      label('권장 화장실', px1 - 0.63, fy + 0.95, pz1 - 0.45, 'furniture');
      // 홈리프트 뒤(高X면) 벽 — 低X 경계(px0)에 안쪽면 맞추고 몸통은 홈리프트쪽(-X)으로. 바닥~박공 밑선, 앞끝(pz0)~뒤벽(pz1) 전체. 문 없음.
      const wx = px0 - 0.10;
      yzWallPrism({ x: wx, thickness: 0.10, mat: materials.wall, points: [[pz0, fy], [pz1, fy], [pz1, s2RoofUnderY(pz1)], [pz0, s2RoofUnderY(pz0)]] });
      // 복도쪽 벽(低Z 면, z=pz0=홈리프트 끝선) — 10cm, 복도면(pz0)에 바깥면 맞추고 몸통은 화장실 안(+Z)으로 넣어 복도로 안 튀어나오게. 문 개구만 비움. 박공 밑선까지(pz0 일정 → 높이 일정).
      const dW = 0.7, dH = 2.0, wTop = s2RoofUnderY(pz0), dx0 = px0 + 0.10, dx1 = dx0 + dW;   // 문 = 2층 화장실문과 동일 위치(홈리프트쪽 벽에서 0.10)
      box({ x: px0, z: pz0, w: dx0 - px0, d: 0.10, y: fy, h: wTop - fy, mat: materials.wall });           // 문 低X쪽 벽(홈리프트쪽)
      box({ x: dx1, z: pz0, w: px1 - dx1, d: 0.10, y: fy, h: wTop - fy, mat: materials.wall });           // 문 高X쪽 벽(안방쪽 외벽까지)
      box({ x: dx0, z: pz0, w: dW, d: 0.10, y: fy + dH, h: wTop - (fy + dH), mat: materials.wall });      // 문 위 인방
      // 출입문 — 복도벽(低Z) 폭 0.7. 복도서 밀면 화장실 안(+Z)으로 90° 열림. 경첩=低X(dx0, 홈리프트쪽) 모서리, 손잡이=高X(dx1) 자유단. (2층 화장실문과 동일)
      box({ x: dx0, z: pz0, w: dW, d: 0.04, y: fy, h: dH, mat: materials.wcDoor });                       // 문짝(닫힘, 복도면 pz0)
      box({ x: dx1 - 0.18, z: pz0 - 0.05, w: 0.05, d: 0.05, y: fy + 1.02, h: 0.05, mat: materials.handle });     // 손잡이(高X 자유단, 복도쪽)
      const swing = new THREE.Mesh(
        new THREE.CylinderGeometry(dW, dW, 0.02, 24, 1, false, 0, Math.PI / 2),
        new THREE.MeshLambertMaterial({ color: 0x66aaff, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false }),
      );
      swing.position.set(dx0, fy + 0.02, pz0);   // 0~PI/2 = +Z(안쪽 열림)~+X(닫힘,벽). 경첩=低X(dx0)
      scene.add(swing);   // captureInto가 s2Floor3Objects로 자동 수집
      label('화장실 문', dx0 + dW / 2, fy + 1.4, pz0 - 0.05, 'opening');
    }
    // 건식 세면대 — 화장실 안, 뒤(외벽 高Z)에 등 붙임. 문 스윙(주방쪽 低X)을 비키고 변기(안방쪽 高X) 사이에 둠.
    //   수전은 세탁기 수도처럼 뒤 외벽에서 나오고, 하부장 안에 경동 나비엔 전기온수기 15L 설치.
    {
      const fy = levels[2], vW = s2F3VanityW, vD = s2F3VanityD, vH = s2F3VanityH;
      const vx = inX1 - wcSinkOff;                 // 화장실 안 — 변기와 표준 간격(중심 0.75m) 고정. 주방쪽 벽(px0)이 더 빠져도 세면대는 제자리 → 문 스윙이 비킴
      const vz = inZ1 - vD;                        // 뒤(高Z) 외벽에 등 붙임
      box({ x: vx, z: vz, w: vW, d: vD, y: fy, h: vH, mat: materials.sinkCabinet });                              // 하부장
      box({ x: vx + 0.08, z: vz + 0.06, w: vW - 0.16, d: vD - 0.12, y: fy + vH, h: 0.04, mat: materials.sinkBasin });   // 세면볼
      box({ x: vx + vW / 2 - 0.03, z: inZ1 - 0.10, w: 0.06, d: 0.10, y: fy + vH + 0.18, h: 0.06, mat: materials.entryFrame });   // 벽수전(뒤 외벽에서 나옴 — 세탁기 수도식)
      // 하부장 안 경동 나비엔 전기온수기 15L — 반투명 표시(가구 안에 들어감)
      const heater = new THREE.Mesh(
        new THREE.BoxGeometry(0.30, 0.42, 0.30),
        new THREE.MeshLambertMaterial({ color: 0x9fd0e0, transparent: true, opacity: 0.4, depthWrite: false }),
      );
      heater.position.set(vx + vW - 0.20, fy + 0.23, vz + vD - 0.20);
      scene.add(heater);   // captureInto가 s2Floor3Objects로 자동 수집
      label('세면대(건식)', vx + vW / 2, fy + vH + 0.5, vz + 0.1, 'furniture');
      label(`전기온수기 ${s2F3HeaterL}L`, vx + 0.18, fy + 0.55, vz + 0.05, 'mep');
    }
    // 3층 층계참(도착칸)은 '계단' 토글에 포함 — 아래 s2Stair2Objects 블록에서 함께 그림(층 바닥과 분리).
    const pktWallT = 0.15;      // 포켓도어 벽 두께 15cm — 게스트룸1 옆벽도 같은 선상·같은 두께(단일 출처)
    const fy3 = levels[2];
    // x벽(far3·gxL) 한 구간(za~zb)을 바닥(또는 인방 by)부터 박공 밑선까지 세움 — 구간 안 용마루(s2RidgeZ)는 꼭지점으로 꺾음
    const xWallSeg = (x, za, zb, by) => {
      const pts = [[za, by], [zb, by], [zb, s2RoofUnderY(zb)]];
      if (za < s2RidgeZ && s2RidgeZ < zb) pts.push([s2RidgeZ, s2RoofUnderY(s2RidgeZ)]);
      pts.push([za, s2RoofUnderY(za)]);
      yzWallPrism({ x, thickness: pktWallT, mat: materials.wall, points: pts });
    };
    // 마주보는 두 방문(게스트룸1 옆벽 far3 ↔ 게스트룸2 옆벽 gxL) — 전체폭 1.8(표준 개구 0.9 + 문짝 주차 0.9)로 같은 위치(마주봄).
    //   둘 다 각 방에서 '오른→왼' 슬라이드 → 두 방이 서로 반대편을 보므로 열린 구멍이 한쪽은 앞·한쪽은 뒤로 어긋나 서로 안 보임.
    const dUnitW = 2 * interiorDoorW, dTopY = fy3 + interiorDoorH;
    const dUz0 = inZ0 + (RM_L - dUnitW) / 2;         // 문 유닛 시작 z — 짧아진 게스트룸2 벽 길이(RM_L=inZ0~gz1) 안 가운데. 두 문이 함께 앞으로, 게스트룸2 문이 뒤벽에 안 물리게
    const dUmid = dUz0 + interiorDoorW;              // 유닛 가운데(개구/포켓 경계)
    const dUz1 = dUz0 + dUnitW;                      // 유닛 끝
    // 게스트룸1(연두) 옆벽 — far3 선상·15cm. 구멍=앞쪽 절반[dUz0,dUmid](문짝은 +Z 포켓으로 주차). 앞·뒤 막힌벽 + 개구 위 인방.
    xWallSeg(far3, inZ0, dUz0, fy3);
    xWallSeg(far3, dUz0, dUmid, dTopY);
    xWallSeg(far3, dUmid, zB0, fy3);
    pocketDoorVertical(far3 + pktWallT, dUz0, fy3, interiorDoorH, 1, interiorDoorW, materials.stdRoomDoor);
    label('표준 방문', far3, fy3 + 1.0, dUz0 + interiorDoorW / 2, 'opening');
    // 계단실 분리벽 — 3층을 계단 구멍(아래 개방 포치까지 뚫림)과 막아 벌레·냉난방 차단. 윗선은 박공지붕 밑선에 맞춤. 계단으로 올라서는 면에 포켓도어 1개.
    {
      const fy = levels[2], t = interiorWall, pt = pktWallT;                                                                 // pt = 포켓도어 벽 두께 15cm(문짝 수납) — 게스트룸1 옆벽과 단일 출처
      // ① 계단실 옆 내벽(주방쪽 보는 면) — 계단 구멍 앞면(zB0) 따라, 우측벽(inX0)~도착끝(far3). 포켓도어 벽 두께만큼 더 늘려 모서리를 ㄱ자로 채움. 막힌 벽. 윗면=그 z의 지붕 밑선(평탄).
      horizontalWallWithGaps(inX0, zB0 - t, far3 + pt - inX0, fy, [], s2RoofUnderY(zB0) - fy, t, materials.wall);
      // ② 계단 올라서는 면 내벽(포켓도어 벽, 두께 pt) — 도착끝(far3) 따라 앞(zB0)~뒤벽(inZ1). 벽은 3층 바닥 위(far3 바깥)에 세워 계단 발판을 침범하지 않음. 윗선은 박공 경사를 따라 기울고(yzWallPrism), 올라서는 칸에 포켓도어 1개.
      const dZ = zB0, dZ1 = zB0 + W;                                                                                          // 개구 = 계단 도착칸(폭 W) 전체 — 계단 너비와 동일
      const doorTopY = fy + interiorDoorH;
      yzWallPrism({ x: far3, thickness: pt, mat: materials.wall, points: [[dZ, doorTopY], [dZ1, doorTopY], [dZ1, s2RoofUnderY(dZ1)], [dZ, s2RoofUnderY(dZ)]] }); // 문 위 인방(문틀~지붕)
      yzWallPrism({ x: far3, thickness: pt, mat: materials.wall, points: [[dZ1, fy], [inZ1, fy], [inZ1, s2RoofUnderY(inZ1)], [dZ1, s2RoofUnderY(dZ1)]] });        // 문 뒤쪽 벽(바닥~지붕, 포켓 수납)
      pocketDoorVertical(far3 + pt, dZ, fy, interiorDoorH, 1, W);                                                            // 포켓도어(폭 W=계단 너비) — 뒤쪽 벽 속으로 슬라이드
      label('계단실 단열 포켓도어', far3, fy + 1.0, dZ + W / 2, 'opening');
    }
    // 게스트룸1 붙박이장 — 계단실 분리벽(뒤·高Z)에 등 붙이고 방 앞(-Z)으로 깊이 0.8m 나옴. 폭=우측 외벽(inX0)~옆벽(far3) 방 전체. 높이 2.4m(박공 밑선 아래).
    {
      const fy = levels[2], clD = g1ClosetD, clH = 2.4;
      const clZ1 = zB0 - interiorWall, clZ0 = clZ1 - clD;   // 계단실 분리벽 방쪽 면 ~ 장 앞면
      const clX0 = inX0, clW = far3 - inX0;                 // 폭 = 방 전체 폭(우측 외벽~옆벽)
      box({ x: clX0, z: clZ0, w: clW, d: clD, y: fy, h: clH, mat: materials.sinkCabinet });
      label(`붙박이장 ${clW.toFixed(2)}×${clD.toFixed(2)}m`, clX0 + clW / 2, fy + clH + 0.3, clZ0 + clD / 2, 'furniture');
    }
    // 게스트룸2(회색) 칸막이벽 — 안방 외벽(inX1)·앞 외벽(inZ0)이 두 변을 막고, 트인 두 변에 칸막이. '회색' 자리(배경) 안쪽으로 세움.
    {
      const fy = levels[2], gxL = inX1 - g2RoomW, gz1 = inZ0 + RM_L;   // 회색 자리 저X 변(게스트룸1쪽, 복도 1.0m)·高Z 변(화장실쪽)
      // ① 화장실쪽 벽(高Z 변, z=gz1) — 10cm, 방 안쪽(-Z)으로. X: 저X 변(gxL)~안방 외벽(inX1). 그 z의 박공 밑선 높이(평탄).
      box({ x: gxL, z: gz1 - 0.10, w: inX1 - gxL, d: 0.10, y: fy, h: s2RoofUnderY(gz1) - fy, mat: materials.wall });
      // ② 다른쪽 벽(저X 변, x=gxL, 게스트룸1쪽) — 15cm, 방 안쪽(+X)으로. Z: 앞 외벽(inZ0)~화장실쪽 벽(gz1).
      //   마주보는 표준 방문: 구멍=뒤쪽 절반[dUmid,dUz1](문짝은 -Z 포켓으로 주차) → 게스트룸1 구멍(앞쪽)과 어긋나 서로 안 보임. 앞·뒤 막힌벽 + 개구 위 인방.
      xWallSeg(gxL, inZ0, dUmid, fy);
      xWallSeg(gxL, dUmid, dUz1, dTopY);
      xWallSeg(gxL, dUz1, gz1, fy);
      pocketDoorVertical(gxL + pktWallT, dUmid, fy, interiorDoorH, -1, interiorDoorW, materials.stdRoomDoor);
      label('표준 방문', gxL, fy + 1.0, dUmid + interiorDoorW / 2, 'opening');
    }
    // 게스트룸 매트리스(베이지·두께 10cm, 앞쪽 외벽에 머리·옆벽에 붙임) — 게스트룸1: 2.0×1.8 1개 / 게스트룸2: 2.0×1.1 2개(좌우 옆벽)
    {
      const fy = levels[2], mH = 0.1;
      const mMat = new THREE.MeshLambertMaterial({ color: 0xe8dcc0 });
      const pMat = new THREE.MeshLambertMaterial({ color: 0xfaf6ef });
      const mattress = (x0, z0, w, d, txt) => { box({ x: x0, z: z0, w, d, y: fy, h: mH, mat: mMat }); label(txt, x0 + w / 2, fy + mH + 0.15, z0 + d / 2, 'furniture'); };
      const pillow = (cx) => box({ x: cx - 0.35, z: inZ0 + 0.07, w: 0.7, d: 0.4, y: fy + mH, h: 0.1, mat: pMat });   // 매트 위·앞벽(低Z)쪽 머리맡
      // 게스트룸1(低X·주방쪽) 더블 — 앞 외벽(低Z)에 머리, 주방쪽 옆벽(低X)에 붙임. 폭1.8(X)×길이2.0(Z). 베개 2개
      const m1W = 1.8, m1L = 2.0;
      mattress(inX0, inZ0, m1W, m1L, '매트리스 2.0×1.8m');
      pillow(inX0 + 0.5); pillow(inX0 + 1.3);
      // 게스트룸2(高X·안방쪽) 싱글 2개 — 앞 외벽(低Z)에 머리, 좌우 옆벽에 각 1개. 폭1.1(X)×길이2.0(Z). 각 베개 1개
      const m2W = 1.1, m2L = 2.0;
      mattress(inX1 - 2 * m2W - 0.1, inZ0, m2W, m2L, '매트리스 2.0×1.1m');   // 안방 외벽쪽으로 나란히(안쪽·옆벽매트와 10cm 간격)
      pillow(inX1 - 1.5 * m2W - 0.1);
      mattress(inX1 - m2W, inZ0, m2W, m2L, '매트리스 2.0×1.1m');      // 안방 외벽쪽 옆벽
      pillow(inX1 - m2W / 2);
    }
  });

  // ── s2 2·3층 기본 콘센트 — 각 층 '외벽'(s2Wall2/s2Wall3) 토글에 귀속. 방·화장실·복도 일반 높이(바닥+0.3m). ──
  // 벽면에 붙는 커버 플레이트 + 소켓. face로 벽 방향 지정('+X'=低X벽서 실내 +X 돌출, '-X'=高X벽서 -X, '-Z'=高Z벽서 -Z).
  const wallOutlet = (x, z, oy, face, heat = false) => {
    const mC = heat ? materials.heatOutlet : materials.outlet;         // 커버 플레이트 색(난방용=주황)
    const mS = heat ? materials.heatOutletSocket : materials.outletSocket;   // 소켓 면 색
    if (face === '+X') {
      box({ x, z: z - 0.065, w: 0.035, d: 0.13, y: oy, h: 0.15, mat: mC });
      box({ x: x + 0.035, z: z - 0.045, w: 0.02, d: 0.09, y: oy + 0.03, h: 0.09, mat: mS });
    } else if (face === '-X') {
      box({ x: x - 0.035, z: z - 0.065, w: 0.035, d: 0.13, y: oy, h: 0.15, mat: mC });
      box({ x: x - 0.05, z: z - 0.045, w: 0.02, d: 0.09, y: oy + 0.03, h: 0.09, mat: mS });
    } else if (face === '+Z') {   // 低Z 벽서 실내(+Z)로 돌출
      box({ x: x - 0.065, z, w: 0.13, d: 0.035, y: oy, h: 0.15, mat: mC });
      box({ x: x - 0.045, z: z + 0.035, w: 0.09, d: 0.02, y: oy + 0.03, h: 0.09, mat: mS });
    } else {   // '-Z' — 高Z 벽서 실내(-Z)로 돌출
      box({ x: x - 0.065, z: z - 0.035, w: 0.13, d: 0.035, y: oy, h: 0.15, mat: mC });
      box({ x: x - 0.045, z: z - 0.05, w: 0.09, d: 0.02, y: oy + 0.03, h: 0.09, mat: mS });
    }
  };
  // 2층 콘센트 — 안방(주방측 외벽), 화장실(홈리프트쪽 내벽).
  captureInto(s2Wall2Objects, () => {
    const oy = levels[1] + 0.3;
    const abZ = ((inZ0 + 2.0) + ((zB0 - 0.20) - 0.70)) / 2;   // 안방 주방측 벽 — 침대(앞)와 이불장(뒤) 사이 빈 벽면
    wallOutlet(inX0, abZ, oy, '+X');
    // 앞 외벽(低Z) — 침대옆 낮은 장(서랍장) 옆, 책상 자리 각 1개
    const abDrwX = (inX0 + 2.0 + 0.40) + 0.2;                 // 침대옆 서랍장(폭 2.0+깊이 0.4) 방문쪽 끝 옆
    wallOutlet(abDrwX, inZ0, oy, '+Z');
    const abDeskX = inX1 - 0.5;                                // 책상 위 — 왼쪽 벽(안방 외벽)쪽으로 이동
    wallOutlet(abDeskX, inZ0, oy, '+Z');
    const oyC = levels[1] + 1.1;                              // 화장실 콘센트 = 세면대(싱크대와 동일) 상판 높이 바닥+1.1m
    const wcZ = inZ1 - 0.5 / 2;                                // 화장실 低X 내벽 — 세면대 중앙선에 맞춤(세면대 깊이 0.5)
    wallOutlet(wcFaceX, wcZ, oyC, '+X');
    wallOutlet(inX1 - 0.42, inZ1, oyC, '-Z', true);           // 좌변기 뒤(뒤 외벽 高Z) 중앙 — 변기 X중심 inX1-0.42. 전기온수기용 고전력(마젠타)
    // 뒤 분리벽(방쪽 면 zB0-0.20) — 주 출입문(방문)~붙박이장, 주 출입문~화장실 문 사이 각 1개
    const abWz = zB0 - 0.20;                                   // 분리벽 안방쪽 면
    const abOX0 = far2 + (1.2 - interiorDoorW) / 2, abOX1 = abOX0 + interiorDoorW;   // 방문 개구(옆벽 코드와 동일 출처)
    const abBdX0 = wcFaceX + 0.10;                            // 화장실 문 저X 끝
    const abClosetX1 = inX0 + 2.0;                            // 이불장(붙박이장) 방문쪽 끝
    const abX1 = (abClosetX1 + abOX0) / 2;                    // 방문~붙박이장 사이 중앙
    wallOutlet(abX1, abWz, oy, '-Z', true);                   // 전기 난방용(주황)
    label('난방용 콘센트', abX1, oy + 0.25, abWz - 0.2, 'mep');
    const abX2 = (abOX1 + abBdX0) / 2;                        // 방문~화장실 문 사이 중앙
    wallOutlet(abX2, abWz, oy, '-Z');
    // 냉장고 콘센트 — 냉장고(폭 0.545, 안방 외벽 高X 밀착) 뒤 분리벽, 냉장고 위 높이
    const abFridgeX = inX1 - 0.545 / 2;                       // 냉장고 중앙 x
    const oyF = levels[1] + 1.8;                              // 냉장고 높이 1.70 위
    wallOutlet(abFridgeX, abWz, oyF, '-Z');
    // 에어컨(냉난방기) 콘센트 — 실내기 옆(화장실 벽쪽 高Z 끝), 유닛 높이. 안방 외벽 高X
    const acLen = 1.003, acZ0 = s2FrontZ + 2.5;              // 실내기 위치(설치 코드와 동일 출처)
    const acOutletZ = acZ0 + acLen + 0.12;                   // 유닛 高Z 끝서 12cm 옆
    const oyAc = levels[1] + 2.1;                            // 실내기 높이(천장 근처)
    wallOutlet(inX1, acOutletZ, oyAc, '-X', true);           // 에어컨용 고전력(마젠타)
    // 뒤 복도 프로젝트창 아래(뒤 외벽 高Z) — 3층과 동일
    const corrX2o = liftX0 + liftW - 2.025;                  // 뒤 복도 프로젝트창 X중앙(3층 복도 콘센트와 동일 출처)
    wallOutlet(corrX2o, inZ1, oy, '-Z');
  });
  // 3층 콘센트 — 게스트룸1(주방측 외벽), 게스트룸2(안방측 외벽), 화장실(홈리프트쪽 내벽), 복도(안방측 외벽).
  captureInto(s2Wall3Objects, () => {
    const oy = levels[2] + 0.3;
    const g1Z = ((inZ0 + 2.0) + ((zB0 - interiorWall) - 0.8)) / 2;   // 게스트룸1 주방측 벽 — 매트(앞)와 붙박이장(뒤) 사이
    wallOutlet(inX0, g1Z, oy, '+X');
    const g2Z = (inZ0 + RM_L) - 0.4;                                 // 게스트룸2 안방측 외벽 — 매트 뒤쪽 빈 벽면
    wallOutlet(inX1, g2Z, oy, '-X');
    // 앞 외벽(inZ0) — 각 방 문쪽(복도측 옆벽) 가까이 콘센트 각 1개
    const gDoorInset = 0.3;                                          // 문쪽 옆벽 방쪽 면에서 콘센트까지 공통 여백
    const g1x = far3 - gDoorInset;                                   // 게스트룸1 옆벽(far3=방쪽 면)서 안쪽
    wallOutlet(g1x, inZ0, oy, '+Z', true);                           // 게스트룸1 앞벽 — 전기 난방용(주황)
    label('난방용 콘센트', g1x, oy + 0.25, inZ0 + 0.2, 'mep');
    const g2x = (inX1 - g2RoomW + 0.15) + gDoorInset;               // 게스트룸2 옆벽(gxL+두께0.15=방쪽 면)서 안쪽
    wallOutlet(g2x, inZ0, oy, '+Z', true);                           // 게스트룸2 앞벽 — 전기 난방용(주황)
    label('난방용 콘센트', g2x, oy + 0.25, inZ0 + 0.2, 'mep');
    // 문 있는 옆벽 — 문과 뒤 내벽 사이 중앙에 콘센트 각 1개
    const dUz0 = inZ0 + (RM_L - 2 * interiorDoorW) / 2;              // 방문 유닛 시작 z(옆벽 코드와 동일 출처)
    const dUmid = dUz0 + interiorDoorW, dUz1 = dUz0 + 2 * interiorDoorW;
    const g1DoorZ = (dUmid + (zB0 - interiorWall)) / 2;             // 게스트룸1: 문(앞쪽 절반) 뒤끝 ~ 계단실 분리벽 사이 중앙
    wallOutlet(far3, g1DoorZ, oy, '-X');                            // 옆벽 far3(방쪽 면), 실내 -X
    const g2gz1 = inZ0 + RM_L;                                       // 게스트룸2 화장실쪽 칸막이벽(내벽)
    const g2DoorZ = (dUz1 + (g2gz1 - 0.10)) / 2;                    // 게스트룸2: 문(뒤쪽 절반) 뒤끝 ~ 칸막이벽 방쪽 면 사이 중앙
    wallOutlet(inX1 - g2RoomW + 0.15, g2DoorZ, oy, '+X');          // 옆벽 gxL(방쪽 면), 실내 +X
    const oyC = levels[2] + 1.1;                                    // 화장실 콘센트 = 세면대(싱크대와 동일) 상판 높이 바닥+1.1m
    const wcZ = inZ1 - s2F3VanityD / 2;                            // 3층 화장실 低X 내벽 — 세면대 중앙선에 맞춤
    wallOutlet(inX1 - wcW3, wcZ, oyC, '+X');
    wallOutlet(inX1 - 0.42, inZ1, oyC, '-Z');                      // 좌변기 뒤(뒤 외벽 高Z) 중앙 — 변기 X중심 inX1-0.42
    const corrX = liftX0 + liftW - 2.025;                           // 앞·뒤 복도 프로젝트창 X중앙(창과 동일 출처)
    wallOutlet(corrX, inZ0, oy, '+Z');                              // 앞 복도 프로젝트창 아래(앞 외벽)
    wallOutlet(corrX, inZ1, oy, '-Z');                              // 뒤 복도 프로젝트창 아래(뒤 외벽)
    // 실외기실 콘센트 — 高Z 벽(화장실 앞벽) 실외기 옆. 방수형(옥외 IP54)·1구(바닥 물기 피해 높이 올림)
    const ecuRoomZ = liftZ0 + 0.4;                                 // 실외기실 高Z 벽 = 화장실 앞벽(단일 출처, 앞벽 0.4m 들임)
    const ecuRoomX = inX1 - 0.4;                                   // 실외기실 깊이 중앙
    wallOutlet(ecuRoomX, ecuRoomZ, levels[2] + 1.1, '-Z');        // 실외기 전원·점검용 — 화장실 콘센트와 동일 높이(바닥+1.1m)
  });

  // 층고·천장고 치수는 여기 표기하지 않음 — 천장고는 윗층 바닥 슬래브(외벽 토글)와 함께 표시.
})();

// ── s2 1층 가구(식탁·의자) — '테이블·의자' 토글(구조 섹션) ─────────────────────────
// 식탁 3개(윗판 110×72cm·높이 0.72)를 좌우(x)로 이어 옆으로 길게(약 3.3m). 의자=반고 햄프턴 DLX(campingChair,
//  폭~0.6·깊이~0.55·좌고 0.42 — 실제 햄프턴 DLX 폭 60·좌고 45와 부합). 앞·뒤 긴 변에 테이블당 1개씩 여유있게.
{
  const _furnStart = scene.children.length;
  const fTop = groundTopY + MAT_H + S2_STAIR.slabT;            // 1층 바닥 표면(층참 윗면)
  const TW = 0.85, TD = 0.72, TH = 0.72, top = 0.04, leg = 0.06;   // 윗판 85×72, 다리높이 0.72
  const woodT = materials.woodFrame;
  const off = TD / 2 + 0.30;                                  // 테이블 가장자리→의자 중심
  const chairBack = off + 0.33, aisle = 0.9, endGap = 0.9;    // 의자 등받이 뒤끝 · 의자 뒤 통로 0.9 · 테이블 끝 0.9
  // 식탁 세트(이동공간 포함)를 오른쪽(低x) 예약공간 옆·앞쪽(低z=−2.4 벽) 안쪽에 붙임.
  const inXL = s2X0 + s2W - s2WallT, inZF = s2FrontZ + s2WallT;   // 좌(高x)·앞(低z) 외벽 안쪽 면
  const reserveW = 1.0;                                       // 오른쪽(低x) 벽쪽 예약 공간 폭 — 식탁은 예약공간 옆에 붙임
  const cxC = (s2X0 + s2WallT + reserveW) + endGap + 2 * TW;   // 식탁 행 중심 x(우벽 예약공간 바깥 + 끝여유 + 행 절반 2·TW)
  const cz0 = inZF + aisle + chairBack;                       // 식탁 중심 z(앞벽에서 통로 + 의자 등받이 뒤)
  const cxs = [cxC - 1.5 * TW, cxC - 0.5 * TW, cxC + 0.5 * TW, cxC + 1.5 * TW];   // 4개를 좌우로 이어 옆으로 길게
  for (const cx of cxs) {
    box({ x: cx - TW / 2, z: cz0 - TD / 2, w: TW, d: TD, y: fTop + TH - top, h: top, mat: woodT });               // 윗판
    for (const lx of [cx - TW / 2 + 0.02, cx + TW / 2 - 0.02 - leg])
      for (const lz of [cz0 - TD / 2 + 0.02, cz0 + TD / 2 - 0.02 - leg])
        box({ x: lx, z: lz, w: leg, d: leg, y: fTop, h: TH - top, mat: woodT });                                  // 다리 4
  }
  for (const cx of cxs) {
    campingChair({ cx, cz: cz0 - off, faceAngle: 0, baseY: fTop });          // 앞쪽 — 테이블(+z) 향함
    campingChair({ cx, cz: cz0 + off, faceAngle: Math.PI, baseY: fTop });    // 뒤쪽 — 테이블(−z) 향함
  }
  // 사람 이동(여유) 통로 — '의자 등받이 뒤'에서부터 잰다(테이블 가장자리 아님). 햄프턴 DLX는 깊은 리클라이너라
  //  테이블 기준으론 의자가 통로를 먹는다. 의자 뒤 통로 0.9m(편한 통행)·테이블 끝 0.9m 둘레로.
  const zx0 = (cxs[0] - TW / 2) - endGap, zx1 = (cxs[cxs.length - 1] + TW / 2) + endGap;
  const zz0 = (cz0 - chairBack) - aisle, zz1 = (cz0 + chairBack) + aisle;
  box({ x: zx0, z: zz0, w: zx1 - zx0, d: zz1 - zz0, y: fTop + 0.004, h: 0.012, mat: materials.clearZone, cast: false });
  // 식탁·의자·이동공간까지가 '테이블·의자' 토글. 오른쪽 예약 구획(화목난로)은 아래에서 별도 토글로 분리.
  s2FurnitureObjects.push(...scene.children.slice(_furnStart));
  // 오른쪽(低x) 벽쪽 1m 예약 공간(붉은색) = 화목난로 자리 — '난로' 버튼 토글. 깊이=이동공간과 동일.
  const _stoveStart = scene.children.length;
  box({ x: s2X0 + s2WallT, z: zz0, w: reserveW, d: zz1 - zz0, y: fTop + 0.005, h: 0.012, mat: materials.leftZone, cast: false });
  // 화목난로 본체 + 연통 — 예약공간 주방쪽 외벽 구석(계단실 입구쪽)에 두고, 연통을 그 구석으로 곧게 3층까지 올린 뒤
  //   (계단참 코너만 관통) 주방쪽 박공 끝벽을 뚫고 밖으로 빼 지붕 옆으로(지붕 경사면 관통 없음 → 누수 위험↓)
  {
    const stW = 0.6, stD = 0.5, stH = 1.05;                 // 본체(타워형) 폭·깊이·높이
    const stX = s2X0 + s2WallT + 0.1;                       // 주방쪽 외벽서 0.1m 불연 이격(본체 x 0.4~1.0)
    const stZ = 1.0;                                        // 본체 앞면 z — 뒤끝을 계단실 보이드(zB0=1.4) 안까지 넣어, 연통이 방바닥 아닌 계단실 안에서 오르게
    // 연통 표면을 계단실 코너 두 벽에서 각각 5cm 이격(중심 = 벽면 + 5cm + 반경 0.0375). 우측 외벽 안쪽 x=0.3·계단실 앞벽 zB0=1.4
    const flueX = (s2X0 + s2WallT) + 0.05 + 0.0375, flueZ = (s2BackZ - s2WallT - (2 * S2_STAIR.W + S2_STAIR.g)) + 0.05 + 0.0375;
    const flueTopIn = roofY + 0.5;                          // 실내 수직 상단(3층 상부, 박공 끝벽 관통 높이)
    const wallOutX = s2X0 - 0.7;                            // 주방쪽 지붕 처마(0.4m) 끝에서 0.3m 안전거리 — 지붕 관통 회피
    const flueTopOut = s2RoofUnderY(s2RidgeZ) + 0.6;        // 외부 수직 상단 = 용마루보다 위
    const flueR = 0.0375;                                   // 연통 반경 = 지름 75mm
    box({ x: stX - 0.1, z: stZ - 0.15, w: stW + 0.2, d: stD + 0.3, y: fTop + 0.012, h: 0.03, mat: materials.guard, cast: false });   // 불연 바닥판
    box({ x: stX, z: stZ, w: stW, d: stD, y: fTop + 0.042, h: stH, mat: materials.guard });                                          // 본체
    box({ x: stX + 0.08, z: stZ - 0.02, w: stW - 0.16, d: 0.02, y: fTop + 0.042 + 0.22, h: 0.6, mat: materials.openingEdge });        // 불보기창(앞면, 저z)
    railCylinder([flueX, fTop + 0.042 + stH, flueZ], [flueX, flueTopIn, flueZ], flueR);          // ① 실내 수직 — 계단실 구석으로 3층까지
    railCylinder([flueX, flueTopIn, flueZ], [wallOutX, flueTopIn, flueZ], flueR);                // ② 주방쪽 박공 끝벽 관통(수평)
    railCylinder([wallOutX, flueTopIn, flueZ], [wallOutX, flueTopOut, flueZ], flueR);            // ③ 외부 수직 — 지붕 옆으로
  }
  s2StoveObjects.push(...scene.children.slice(_stoveStart));
}

// ── s2 1층 싱크대(주방) — '싱크대' 토글(구조 섹션) ─────────────────────────────────
// 싱크 하부장 1.2m(백조 대형 사각볼 950×454 수용) + 양옆 표준 0.6m. 총 2.4m, 왼쪽(高x) 벽 따라 세로(Z)로, 뒤(高z) 코너 밀착.
captureInto(s2SinkObjects, () => {
  const fTop = groundTopY + MAT_H + S2_STAIR.slabT;          // 1층 바닥 표면(층참 윗면)
  const inXL = s2X0 + s2W - s2WallT;                          // 좌(高x) 외벽 안쪽 면
  const inZB = s2BackZ - s2WallT;                            // 뒤(高z) 외벽 안쪽 면
  const SINKW = 1.2, SIDEW = 0.6, CD = 0.6, CH = 0.85, ctop = 0.04;   // 싱크 하부장·옆 하부장·깊이·높이·상판
  const skX = inXL - CD, cY = fTop + CH;                     // 캐비닛 안쪽끝(좌벽 밀착)·상판 밑면
  const drawCab = (cabCz, cw, withBowl) => {                // 하부장 1개(폭 cw=Z방향, 상판 포함, 옵션: 싱크볼)
    const z0 = cabCz - cw / 2;
    box({ x: skX, z: z0, w: CD, d: cw, y: fTop, h: CH, mat: materials.sinkCabinet });            // 하부장
    if (!withBowl) { box({ x: skX, z: z0, w: CD, d: cw, y: cY, h: ctop, mat: materials.counter }); return; }   // 상판(통판)
    const bw = 0.95, bd = 0.454;                             // 백조 대형 사각볼 950×454 (길이=Z, 깊이=X)
    const bz0 = cabCz - bw / 2, bz1 = cabCz + bw / 2, bx0 = skX + (CD - bd) / 2, bx1 = bx0 + bd;
    box({ x: skX, z: z0, w: bx0 - skX, d: cw, y: cY, h: ctop, mat: materials.counter });         // 상판 안쪽
    box({ x: bx1, z: z0, w: skX + CD - bx1, d: cw, y: cY, h: ctop, mat: materials.counter });    // 상판 벽쪽
    box({ x: bx0, z: z0, w: bd, d: bz0 - z0, y: cY, h: ctop, mat: materials.counter });          // 상판 앞
    box({ x: bx0, z: bz1, w: bd, d: z0 + cw - bz1, y: cY, h: ctop, mat: materials.counter });    // 상판 뒤
    box({ x: bx0, z: bz0, w: bd, d: bw, y: cY + ctop - 0.18, h: 0.18, mat: materials.sinkBasin }); // 싱크볼(상판에 묻힘)
    box({ x: inXL - 0.14, z: cabCz - 0.04, w: 0.08, d: 0.08, y: cY + ctop, h: 0.3, mat: materials.entryFrame });   // 수전(벽쪽)
  };
  // 왼쪽벽 일렬 배치(앞→뒤): 양문형(예정) — 싱크대 — 공간 — 기존 냉장고.
  // 뒤(高z) 코너 기존 냉장고(LG B312DS31, 311L, 545×689×1700) — 좌벽(高x) 밀착, 문은 주방(低x)쪽. 그대로 유지.
  const FW = 0.545, FD = 0.689, FH = 1.70, fGap = 0.05, bGap = 0.05;   // 기존 냉장고 폭(Z)·깊이(X)·높이 · 부재 간격 · 뒷벽과 간격
  const frBack = inZB - bGap;                               // 냉장고 뒷면 z(뒤벽에서 bGap 띄움)
  const frFront = frBack - FW;                              // 냉장고 앞면 z
  const frCz = frBack - FW / 2;                             // 냉장고 중심 z
  box({ x: inXL - FD, z: frBack - FW, w: FD, d: FW, y: fTop, h: FH, mat: materials.fridge });   // 냉장고 본체
  // 문짝(B312=일반 2도어 상부냉동): 문 면=주방(低x)쪽, 경첩=뒤벽(高z)쪽, 손잡이=앞(低z)쪽 → 문은 앞쪽으로 열림
  const dFront = inXL - FD, dt = 0.02, fzH = FH * 0.30;     // 문 면·문짝 두께·상부 냉동실 비율
  box({ x: dFront - dt, z: frBack - FW + 0.005, w: dt, d: FW - 0.01, y: fTop + FH - fzH, h: fzH - 0.01, mat: materials.fridgeDoor });   // 상부 냉동실 문
  box({ x: dFront - dt, z: frBack - FW + 0.005, w: dt, d: FW - 0.01, y: fTop + 0.01, h: FH - fzH - 0.02, mat: materials.fridgeDoor });  // 하부 냉장실 문
  const hz = frBack - FW + 0.07;                              // 손잡이 z(앞쪽 低z = 경첩 반대편)
  box({ x: dFront - dt - 0.03, z: hz, w: 0.03, d: 0.04, y: fTop + FH - fzH - 0.42, h: 0.4, mat: materials.guard });   // 하부 문 손잡이
  box({ x: dFront - dt - 0.03, z: hz, w: 0.03, d: 0.04, y: fTop + FH - fzH + 0.05, h: 0.28, mat: materials.guard });  // 상부 문 손잡이
  label(`기존 냉장고 311L · ${fmtDim(FW)}×${fmtDim(FD)}`, inXL - FD / 2, fTop + FH + 0.15, frCz, 'furniture');
  // 맨 앞(低z·앞벽) 양문형 냉장고 예정지 — 앞벽 밀착. 싱크대는 그 뒤에 붙임. 반투명(2층 세탁/건조기 예정처럼).
  const F2W = 1.1, F2DEP = 0.8, F2H = 2.0;                  // 양문형 냉장고 자리 — 폭(Z)1.1·깊이(X)0.8·높이 2.0
  const f2Cz = (s2FrontZ + s2WallT) + F2W / 2;              // 예정지 중심 z — 앞벽(低z) 안쪽 면에 붙임
  // 싱크대(2.4m) — 좌측벽 앞뒤 중앙에 배치(냉장고와 별개). 옆 0.6 · 싱크 1.2 · 옆 0.6
  const cSink = ((s2FrontZ + s2WallT) + inZB) / 2;         // 좌측벽 앞뒤 중심
  const cInner = cSink - SINKW / 2 - SIDEW / 2;            // 앞쪽(低z) 옆 하부장
  const cWall = cSink + SINKW / 2 + SIDEW / 2;             // 뒤쪽(高z) 옆 하부장
  drawCab(cWall, SIDEW, false);
  drawCab(cSink, SINKW, true);
  drawCab(cInner, SIDEW, false);
  label(`주방 2.4m(싱크 ${fmtDim(SINKW)}+옆 ${fmtDim(SIDEW)}×2) · 백조 대형볼 0.95×0.454`, skX + CD / 2, cY + 0.5, cSink, 'furniture');
  const fridgeGhost = new THREE.Mesh(
    new THREE.BoxGeometry(F2DEP, F2H, F2W),
    new THREE.MeshLambertMaterial({ color: 0xbcc6cf, transparent: true, opacity: 0.32, depthWrite: false }),
  );
  fridgeGhost.position.set(inXL - F2DEP / 2, fTop + F2H / 2, f2Cz);
  scene.add(fridgeGhost);   // captureInto가 s2SinkObjects로 자동 수집
  // 양문(2짝) 표시 — 뒤=왼쪽벽(高x) 밀착, 문 면=주방쪽(低x) → 문은 주방쪽으로 열림. Z중앙서 좌우 분할.
  const f2Face = inXL - F2DEP, f2dt = 0.03, f2hw = F2W / 2 - 0.02;
  const f2DoorMat = new THREE.MeshLambertMaterial({ color: 0x8aa0b0, transparent: true, opacity: 0.55, depthWrite: false });
  box({ x: f2Face - f2dt, z: f2Cz - f2hw, w: f2dt, d: f2hw, y: fTop + 0.05, h: F2H - 0.1, mat: f2DoorMat });   // 좌 문짝(低z쪽)
  box({ x: f2Face - f2dt, z: f2Cz + 0.02, w: f2dt, d: f2hw, y: fTop + 0.05, h: F2H - 0.1, mat: f2DoorMat });   // 우 문짝(高z쪽)
  box({ x: f2Face - f2dt - 0.03, z: f2Cz - 0.09, w: 0.03, d: 0.05, y: fTop + 0.75, h: 0.55, mat: materials.guard });   // 좌 손잡이
  box({ x: f2Face - f2dt - 0.03, z: f2Cz + 0.04, w: 0.03, d: 0.05, y: fTop + 0.75, h: 0.55, mat: materials.guard });   // 우 손잡이
  // 양문 열림 스윙(바닥 부채꼴) — 각 문짝 90° 열릴 때 쓸고 가는 1/4 부채꼴. 주방쪽(低x) 빈 바닥이면 열림 가능.
  const f2SwMat = new THREE.MeshLambertMaterial({ color: 0x66aaff, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false });
  const f2dr = F2W / 2 - 0.01;   // 문짝 폭(=스윙 반경)
  const swL = new THREE.Mesh(new THREE.CylinderGeometry(f2dr, f2dr, 0.02, 24, 1, false, -Math.PI / 2, Math.PI / 2), f2SwMat);
  swL.position.set(f2Face, fTop + 0.02, f2Cz - F2W / 2);   // 경첩=低z 모서리 · -X(열림)~+Z(닫힘) 사분면
  scene.add(swL);   // captureInto가 s2SinkObjects로 자동 수집
  const swR = new THREE.Mesh(new THREE.CylinderGeometry(f2dr, f2dr, 0.02, 24, 1, false, Math.PI, Math.PI / 2), f2SwMat);
  swR.position.set(f2Face, fTop + 0.02, f2Cz + F2W / 2);   // 경첩=高z 모서리 · -Z(닫힘)~-X(열림) 사분면
  scene.add(swR);   // captureInto가 s2SinkObjects로 자동 수집
  label(`양문형 냉장고 예정 ${fmtDim(F2W)}×${fmtDim(F2DEP)}m`, inXL - F2DEP / 2, fTop + F2H + 0.15, f2Cz, 'furniture');
});

// ── s2 1층 주방 실내 콘센트 — '외벽'(s2Wall1) 토글에 귀속. 폴딩창 양옆 2개(개구부 밖·상판 위)+냉장고 자리 2개(양문형·기존). ──
captureInto(s2Wall1Objects, () => {
  const fTop = groundTopY + MAT_H + S2_STAIR.slabT;
  const inXL = s2X0 + s2W - s2WallT;                          // 좌(高x) 외벽 안쪽 면
  const inZB = s2BackZ - s2WallT;                            // 뒤(高z) 외벽 안쪽 면
  const F2W = 1.1, FW = 0.545, bGap = 0.05;
  const cSink = ((s2FrontZ + s2WallT) + inZB) / 2;          // 좌측벽 앞뒤 중심(=폴딩창 중심)
  const foldHalf = (4 * 0.68) / 2, jambGap = 0.12;          // 좌측 폴딩창 반폭 1.36 + 창틀 밖 여유(개구부 밖 배치)
  const cInner = cSink - foldHalf - jambGap;                // 창 앞쪽(低z) 옆 — 개구부 밖 벽면(상판 위 콘센트)
  const cWall = cSink + foldHalf + jambGap;                 // 창 뒤쪽(高z) 옆 — 개구부 밖 벽면
  const f2Cz = (s2FrontZ + s2WallT) + F2W / 2;             // 양문형 냉장고 자리(앞)
  const frCz = (inZB - bGap) - FW / 2;                     // 기존 냉장고 자리(뒤)
  const inOutlet = (cz, oy) => {                            // 좌벽 안쪽 면서 실내(-X)로 돌출
    box({ x: inXL - 0.035, z: cz - 0.065, w: 0.035, d: 0.13, y: oy, h: 0.15, mat: materials.outlet });         // 커버 플레이트
    box({ x: inXL - 0.05, z: cz - 0.045, w: 0.02, d: 0.09, y: oy + 0.03, h: 0.09, mat: materials.outletSocket });  // 소켓 면
  };
  inOutlet(cInner, fTop + 1.1);
  inOutlet(cWall, fTop + 1.1);
  inOutlet(f2Cz, fTop + 1.85);
  inOutlet(frCz, fTop + 1.85);
  // 싱크볼 아래 30L 전기온수기 전용 콘센트 — 고전력(주황). 하부장 안 측벽, 온수기 본체 옆·낮은 높이(바닥+0.4m)
  const inHeatOutlet = (cz, oy) => {
    box({ x: inXL - 0.035, z: cz - 0.065, w: 0.035, d: 0.13, y: oy, h: 0.15, mat: materials.heatOutlet });         // 커버 플레이트
    box({ x: inXL - 0.05, z: cz - 0.045, w: 0.02, d: 0.09, y: oy + 0.03, h: 0.09, mat: materials.heatOutletSocket });  // 소켓 면
  };
  inHeatOutlet(cSink + 0.5, fTop + 0.4);
  // 인덕션 전원 — 직결(하드와이어). 콘센트 아님 → 소켓 없는 정션박스(전선 인출구)로만 표시. 고전력(주황).
  // 싱크 앞쪽(低z) 옆 하부장 안, 낮은 높이(바닥+0.4m). cSink-0.9 = 싱크 반폭(0.6)+옆장 반폭(0.3)
  box({ x: inXL - 0.045, z: (cSink - 0.9) - 0.07, w: 0.045, d: 0.14, y: fTop + 0.4, h: 0.14, mat: materials.inductionOutlet });   // 정션박스 블랭크 커버(소켓 없음 = 직결·보라)
});

// ── s2 1층 주방측(오른쪽) 벽 콘센트 — '외벽'(s2Wall1) 토글에 귀속. 우측 슬라이드창 양옆(앞·뒤·개구부 밖) 2개. ──
captureInto(s2Wall1Objects, () => {
  const fTop = groundTopY + MAT_H + S2_STAIR.slabT;
  const inXR = s2X0 + s2WallT;                                // 우(低x·주방측) 외벽 안쪽 면
  const fdColT = 0.3, rGap = 4 * 0.8, jambGap = 0.12;        // 우측 슬라이드창 개구부 = 3.2m, 창틀 밖 여유
  const roA0 = s2FrontZ + s2WallT + fdColT;                  // 슬라이드창 앞(低z) 끝
  const roA1 = roA0 + rGap;                                  // 슬라이드창 뒤(高z) 끝
  const cFront = roA0 - jambGap;                             // 창 앞쪽 옆(개구부 밖)
  const cBack = roA1 + jambGap;                              // 창 뒤쪽 옆(개구부 밖)
  const inOutlet = (cz, oy) => {                             // 우벽 안쪽 면서 실내(+X)로 돌출
    box({ x: inXR, z: cz - 0.065, w: 0.035, d: 0.13, y: oy, h: 0.15, mat: materials.outlet });              // 커버 플레이트
    box({ x: inXR + 0.035, z: cz - 0.045, w: 0.02, d: 0.09, y: oy + 0.03, h: 0.09, mat: materials.outletSocket }); // 소켓 면
  };
  inOutlet(cFront, fTop + 0.3);        // 주방 일반 콘센트 높이 = 바닥+0.3m(주방 상판 높이 아님)
  inOutlet(cBack, fTop + 0.3);
});

// ── s2 천장 조명·실링팬 — 1층·2층 방 천장에 전등-실링팬-전등-실링팬-전등(5개) 한 줄 ──
// 긴변(X 폭)을 5등분 중심에 배치, 전등(양끝·가운데 3개)과 실링팬(2·4번째 2개)을 번갈아 → 골고루 송풍·조명.
// 다섯 부재 모두 공간 깊이(Z) 중심선 위 → 좌우·앞뒤 중심 동시 정렬.
{
  const inX0 = s2X0 + s2WallT, inX1 = s2W - s2WallT;          // 외벽 안쪽 폭(X)
  const inZ0 = s2FrontZ + s2WallT, inZ1 = s2BackZ - s2WallT;
  const zB0 = inZ1 - (2 * S2_STAIR.W + S2_STAIR.g);           // 계단실 앞 경계(트인 공간 뒤끝)
  const lvl2 = F2 + S2_STAIR.slabT, lvl3 = F3 + S2_STAIR.slabT;
  const ceil1Y = lvl2 - s2Floor2SlabT;                       // 1층 천장(2층 슬래브 밑면)
  const ceil2Y = lvl3 - s2Floor3SlabT;                       // 2층 천장(3층 슬래브 밑면)
  const fixX = Array.from({ length: 5 }, (_, i) => inX0 + (inX1 - inX0) * (i + 0.5) / 5);   // 폭 5등분 중심
  const placeRow = (cz, ceilingY) => fixX.forEach((x, i) => (i % 2 === 1 ? ceilingFan : ceilingLight)({ x, z: cz, ceilingY }));   // 홀수번째=팬, 짝수번째=전등 → 전등-팬-전등-팬-전등
  const cz1 = (inZ0 + zB0) / 2;                              // 1층 트인 주방 깊이 중심(앞벽~계단실)
  const cz2 = (inZ0 + (zB0 - 0.10)) / 2;                     // 2층 앞방 깊이 중심(앞벽~분리벽)
  const sinkLightX = fixX[fixX.length - 1];                  // 가장 왼쪽 전등(평면 좌=高X, 씽크대쪽 벽)과 같은 좌우 위치
  const sinkLightZ = inZ1 - (cz1 - inZ0);                    // 뒤벽서 거리 = 그 전등의 앞벽서 거리(대칭) → 씽크대 위
  captureInto(s2Fan1Objects, () => { placeRow(cz1, ceil1Y); ceilingLight({ x: sinkLightX, z: sinkLightZ, ceilingY: ceil1Y }); });   // 1층: 씽크대쪽 전등 1개 추가
  captureInto(s2Fan2Objects, () => {
    fixX.forEach((x, i) => { if (i % 2 === 1) ceilingFan({ x, z: cz2, ceilingY: ceil2Y }); });   // 2층: 실링팬만(직부등 제거)
    // 벽쪽 간접조명 — 방 4면 벽을 따라 천장 아래 발광 띠(코너 겹침 방지 위해 각 변 조금 짧게)
    const cz0 = inZ0, cz1b = zB0 - 0.20;   // 뒤 내측 벽(내력벽 20cm) 방쪽 면 — 여기에 붙여야 벽에 안 묻힘
    const zMid = (cz0 + cz1b) / 2, zLen = (cz1b - cz0) - 0.4;
    const xMid = (inX0 + inX1) / 2, xLen = (inX1 - inX0) - 0.4;
    coveLight({ x: inX0 + 0.06, z: zMid, len: zLen, axis: 'z', ceilingY: ceil2Y });   // 안방쪽 벽
    coveLight({ x: inX1 - 0.06, z: zMid, len: zLen, axis: 'z', ceilingY: ceil2Y });   // 주방쪽 벽
    coveLight({ x: xMid, z: cz0 + 0.06, len: xLen, axis: 'x', ceilingY: ceil2Y });    // 앞벽
    coveLight({ x: xMid, z: cz1b - 0.06, len: xLen, axis: 'x', ceilingY: ceil2Y });   // 뒤(분리)벽
  });
}

// ── s2 외벽 — 층별 분리(각 층 바닥 슬래브 밑면 ~ 그 층 천장). 층마다 '외벽' 버튼, 모든 층 켜면 연결 ──
// 박공 30°(기준·초과 금지). 용마루는 긴변(X, 8.0m) 따라가고 경사는 깊이(Z, s2D) 가로지름 →
//   앞뒤벽 = 처마(평탄 상단, roofY) │ 좌우벽 = 박공 삼각(중앙서 용마루까지) → 좌우 끝에 꼭지점.
//   층 경계(슬래브 밑면)에서 끊어 그려, 인접 층 외벽이 위·아래로 정확히 맞물림(켜면 연결).
{
  const t = s2WallT, EW = materials.exteriorWall;
  const eaveY = roofY;                                                    // 처마 = 3층 벽 상단(지붕 안침)
  const zMid = s2RidgeZ, peakY = s2RoofUnderY(zMid);                      // 용마루(깊이 중앙·박공 밑선 단일 출처)
  // 사각 둘레 4벽(y0~y1) — 앞·뒤는 좌우벽 사이에 끼우고, 좌·우는 전체 깊이(겹침·틈 없음)
  const rectWalls = (y0, y1, frontOpen, rightOpen, backOpen, leftOpen) => {
    if (frontOpen) {   // 앞벽에 폴딩도어 개구부 — 하부 띠(바닥높이)·상부 인방·양 끝 기둥만 남기고 뚫음
      const { x0, x1, sillY, headY } = frontOpen;
      box({ x: s2X0 + t, z: s2FrontZ, w: s2W - 2 * t, d: t, y: y0, h: sillY - y0, mat: EW });          // 개구부 아래(바닥높이 띠)
      box({ x: s2X0 + t, z: s2FrontZ, w: s2W - 2 * t, d: t, y: headY, h: y1 - headY, mat: EW });        // 개구부 위(인방)
      box({ x: s2X0 + t, z: s2FrontZ, w: x0 - (s2X0 + t), d: t, y: sillY, h: headY - sillY, mat: EW });  // 우측 기둥(주방쪽)
      box({ x: x1, z: s2FrontZ, w: (s2W - t) - x1, d: t, y: sillY, h: headY - sillY, mat: EW });          // 좌측 기둥(안방쪽)
    } else {
      box({ x: s2X0 + t, z: s2FrontZ, w: s2W - 2 * t, d: t, y: y0, h: y1 - y0, mat: EW });       // 앞(현관 쪽)
    }
    if (backOpen) {   // 뒤벽 왼쪽(高x)에 폴딩 개구부 — 하부 띠·상부 인방·양쪽 기둥만 남김
      const { a0, a1, sillY, headY } = backOpen, bx = s2X0 + t, bw = s2W - 2 * t, bz = s2BackZ - t;
      box({ x: bx, z: bz, w: bw, d: t, y: y0, h: sillY - y0, mat: EW });                          // 개구부 아래(바닥높이 띠)
      box({ x: bx, z: bz, w: bw, d: t, y: headY, h: y1 - headY, mat: EW });                        // 개구부 위(인방)
      {   // 우측(低x) 벽 남김 — 층계참 프로젝트창(s1BackWin) 개구 1개 카빙
        const { p0: wp0, p1: wp1, sillY: ws, headY: wh } = s1BackWin;
        box({ x: bx, z: bz, w: wp0 - bx, d: t, y: sillY, h: headY - sillY, mat: EW });             // 창 우측(低x) 벽
        box({ x: wp1, z: bz, w: a0 - wp1, d: t, y: sillY, h: headY - sillY, mat: EW });            // 창 좌측 벽
        box({ x: wp0, z: bz, w: wp1 - wp0, d: t, y: sillY, h: ws - sillY, mat: EW });              // 창 아래 띠(창대)
        box({ x: wp0, z: bz, w: wp1 - wp0, d: t, y: wh, h: headY - wh, mat: EW });                 // 창 위 띠(인방)
      }
      box({ x: a1, z: bz, w: (s2W - t) - a1, d: t, y: sillY, h: headY - sillY, mat: EW });          // 좌측 기둥(高x)
    } else {
      box({ x: s2X0 + t, z: s2BackZ - t, w: s2W - 2 * t, d: t, y: y0, h: y1 - y0, mat: EW });     // 뒤(측백 쪽)
    }
    if (rightOpen) {  // 우측벽(x=0)에 폴딩 개구부 — 앞쪽 기둥·뒤쪽 벽·상하 띠만 남김
      const { a0, a1, sillY, headY } = rightOpen, rd = s2BackZ - s2FrontZ;
      box({ x: s2X0, z: s2FrontZ, w: t, d: rd, y: y0, h: sillY - y0, mat: EW });                  // 개구부 아래
      box({ x: s2X0, z: s2FrontZ, w: t, d: rd, y: headY, h: y1 - headY, mat: EW });                // 개구부 위(인방)
      box({ x: s2X0, z: s2FrontZ, w: t, d: a0 - s2FrontZ, y: sillY, h: headY - sillY, mat: EW });   // 앞쪽 기둥
      box({ x: s2X0, z: a1, w: t, d: s2BackZ - a1, y: sillY, h: headY - sillY, mat: EW });          // 뒤쪽 벽 남김
    } else {
      box({ x: s2X0, z: s2FrontZ, w: t, d: s2BackZ - s2FrontZ, y: y0, h: y1 - y0, mat: EW });     // 우(주방, x=0)
    }
    if (leftOpen) {  // 좌측벽(x=8.0−t·高x)에 폴딩 개구부 — 앞쪽 기둥·뒤쪽 벽·상하 띠만 남김
      const { a0, a1, sillY, headY } = leftOpen, rd = s2BackZ - s2FrontZ;
      box({ x: s2W - t, z: s2FrontZ, w: t, d: rd, y: y0, h: sillY - y0, mat: EW });                  // 개구부 아래
      box({ x: s2W - t, z: s2FrontZ, w: t, d: rd, y: headY, h: y1 - headY, mat: EW });                // 개구부 위(인방)
      box({ x: s2W - t, z: s2FrontZ, w: t, d: a0 - s2FrontZ, y: sillY, h: headY - sillY, mat: EW });   // 앞쪽 기둥
      box({ x: s2W - t, z: a1, w: t, d: s2BackZ - a1, y: sillY, h: headY - sillY, mat: EW });          // 뒤쪽 벽 남김
    } else {
      box({ x: s2W - t, z: s2FrontZ, w: t, d: s2BackZ - s2FrontZ, y: y0, h: y1 - y0, mat: EW });  // 좌(안방, x=8.0−t)
    }
  };
  // 창 개구부를 여러 개 지원하는 벽 그리기 — 한 벽에 창 N개를 뚫고 나머지를 골조(기둥·창대띠·인방띠)로 채운다.
  //   axis 'x': 앞/뒤벽(X를 따라, 고정 z) · axis 'z': 좌/우 측벽(Z를 따라, 고정 x). opens=[{p0,p1,sillY,headY}] (겹치지 않음)
  const wallStrip = (axis, fixed, a, b, y0, y1, opens, mat) => {
    const seg = (p0, p1, yy0, yy1) => {
      if (p1 - p0 <= 1e-6 || yy1 - yy0 <= 1e-6) return;
      if (axis === 'x') box({ x: p0, z: fixed, w: p1 - p0, d: t, y: yy0, h: yy1 - yy0, mat });
      else box({ x: fixed, z: p0, w: t, d: p1 - p0, y: yy0, h: yy1 - yy0, mat });
    };
    let cur = a;
    for (const o of [...opens].sort((u, v) => u.p0 - v.p0)) {
      seg(cur, o.p0, y0, y1);          // 창 앞 기둥(전체 높이)
      seg(o.p0, o.p1, y0, o.sillY);    // 창대 아래 띠
      seg(o.p0, o.p1, o.headY, y1);    // 창 위 인방 띠
      cur = o.p1;
    }
    seg(cur, b, y0, y1);               // 마지막 기둥
  };
  // 층 경계 = 실제 윗층 바닥 슬래브 아랫면(계단·바닥과 단일 출처). 바닥 표면 = F_n + 1층 마감두께.
  const lvl2 = F2 + S2_STAIR.slabT, lvl3 = F3 + S2_STAIR.slabT;           // 2·3층 바닥 표면(계단 levels[1]·[2]와 동일)
  const y1 = lvl2 - s2Floor2SlabT, y2 = lvl3 - s2Floor3SlabT;            // 1층 천장(2층 슬래브 밑면) · 2층 천장(3층 슬래브 밑면)
  // 1층 정면 폴딩도어 개구부 — 바닥 윗면에서 높이 2.4m, 정면 중심 기준 양개. 양 끝 기둥(3층 내하중 가정, 300mm) 남김.
  const f1Top = _wBase + S2_STAIR.slabT;                                  // 1층 바닥 윗면(층참 윗면)
  // 뒤벽(집 뒤·+Z)에 홈리프트↔냉장고 사이 작은 표준 출입문(폭 0.8·높이 2.1) — 집 뒤로 나가는 문
  const bdLeafW = 0.8, bdOuterW = 0.9, bdFrameH = 2.1;
  const bkLiftHiX = (s2X0 + t + S2_STAIR.W) + 9 * S2_STAIR.T + 1.2 + 1.5;   // 홈리프트 高X면(계단 상부런 9단→계단실 끝 + 층계참 1.2 + 리프트 폭 1.5)
  const bkFridgeLoX = (s2W - t) - 0.689;                                    // 냉장고 低X면(좌벽 안쪽 − 냉장고 깊이 0.689)
  const bdCx = (bkLiftHiX + bkFridgeLoX) / 2;                               // 두 부재 사이 중앙
  const backDoorOpen = { a0: bdCx - bdOuterW / 2, a1: bdCx + bdOuterW / 2, sillY: f1Top, headY: f1Top + bdFrameH };
  const s1CorrX = bkLiftHiX - 2.025;                                       // 1층 층계참 프로젝트창 X중앙(2·3층 뒤벽창과 동일 X)
  const s1BackWin = { p0: (s1CorrX + 0.3) - 1.6, p1: s1CorrX + 0.3, sillY: groundTopY + 1.7, headY: groundTopY + 1.7 + 1.1 };   // 1.6×1.1 슬라이드창 — 창대 좌·우창과 동일(지표+1.7)·높이 1.1·2짝(0.8) 편개
  const fdColT = 0.3, fdH = 2.4;                                          // 기둥 굵기 300mm · 폴딩도어 높이 2.4m(표준 최대)
  const fdOpen = { x0: s2X0 + t + fdColT, x1: (s2W - t) - fdColT, sillY: f1Top, headY: f1Top + fdH };
  const rGap = 4 * 0.8;                                                   // 우측 4짝 양미서기 × 짝폭 0.8 = 3.2m 개구부
  const rO = { a0: s2FrontZ + t + fdColT, a1: s2FrontZ + t + fdColT + rGap, sillY: groundTopY + 1.7, headY: f1Top + fdH };  // 우측 슬라이드창 — sill 지표 위 1.7m·상단 f1Top+2.4 유지(높이 1.4m)
  const lGap = 4 * 0.68;                                                  // 좌측 폴딩창 2+2 양개 = 4짝 × 짝폭 0.68 = 2.72m 개구부
  const lCz = (s2FrontZ + s2BackZ) / 2;                                  // 좌측벽 앞뒤 중앙(싱크대와 동일 기준)
  const lO = { a0: lCz - lGap / 2, a1: lCz + lGap / 2, sillY: groundTopY + 1.7, headY: f1Top + fdH };  // 좌측 폴딩창 — 벽 중앙 배치·2+2 양개, sill 지표 1.7m·상단 rO와 동일(높이 1.4m)
  captureInto(s2Wall1Objects, () => rectWalls(_wBase, y1, fdOpen, rO, backDoorOpen, lO));   // 1층 외벽 — 기초 상단~1층 천장(정면·우측 개구부, 뒤벽 출입문·좌측 폴딩)
  captureInto(s2Wall1Objects, () => {                                     // 1층 뒤벽 슬라이드창 — 2짝(0.8) 편개, 오른쪽 짝이 왼쪽으로 미닫이
    const zc = s2BackZ - 0.13, sy = s1BackWin.sillY, hy = s1BackWin.headY, x0 = s1BackWin.p0, x1 = s1BackWin.p1;
    const F = materials.windowFrame;   // 창틀 흰색 유지
    const slGlass = new THREE.MeshLambertMaterial({ color: 0xcfe6f0, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false });   // 고정 짝
    const slMove  = new THREE.MeshLambertMaterial({ color: 0x9fc0d4, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });    // 미닫이 짝
    const pw = (x1 - x0) / 2, mullW = 0.05, trk = 0.03;
    box({ x: x0, z: zc - 0.06, w: x1 - x0, d: 0.12, y: sy, h: 0.08, mat: F });          // 하부 레일(2트랙 전폭)
    box({ x: x0, z: zc - 0.06, w: x1 - x0, d: 0.12, y: hy - 0.08, h: 0.08, mat: F });    // 상부 레일(2트랙 전폭)
    const pane = (xp, zt, mat) => {
      box({ x: xp, z: zt - 0.025, w: pw, d: 0.05, y: sy, h: hy - sy, mat, cast: false });                     // 유리
      box({ x: xp, z: zt - 0.035, w: mullW, d: 0.07, y: sy, h: hy - sy, mat: F, cast: false });               // 좌 세로살
      box({ x: xp + pw - mullW, z: zt - 0.035, w: mullW, d: 0.07, y: sy, h: hy - sy, mat: F, cast: false });   // 우 세로살
    };
    pane(x0, zc + trk, slGlass);        // 왼쪽(高X) 고정 짝 — 바깥트랙
    pane(x0 + pw, zc - trk, slMove);    // 오른쪽 미닫이 짝 — 안쪽트랙, 왼쪽으로 슬라이드
    box({ x: x0 + pw + 0.06, z: zc - trk - 0.085, w: 0.045, d: 0.045, y: sy + 0.26, h: 0.28, mat: materials.handle });   // 미닫이 손잡이(만남대측)
    label(`1층 뒤벽 슬라이드창 ${fmtDim(x1 - x0)}×${fmtDim(hy - sy)}m (2짝 편개)`, s1CorrX, sy + 0.4, s2BackZ + 0.1, 'opening');
  });
  captureInto(s2Wall1Objects, () => {                                     // 뒤 복도 슬라이드창 아래(뒤 외벽 高Z) 콘센트 — 2·3층 복도창 아래와 동일 X
    const x = s1CorrX, z = s2BackZ - s2WallT, oy = f1Top + 0.3;
    box({ x: x - 0.065, z: z - 0.035, w: 0.13, d: 0.035, y: oy, h: 0.15, mat: materials.outlet });
    box({ x: x - 0.045, z: z - 0.05, w: 0.09, d: 0.02, y: oy + 0.03, h: 0.09, mat: materials.outletSocket });
  });
  captureInto(s2Wall1Objects, () => {                                     // 뒤벽 작은 표준 출입문(홈리프트~냉장고 사이) — 유리 leaf + 문틀 + 손잡이
    const bz = s2BackZ - t, fr = 0.06, dep = 0.10, zc = bz + 0.10;        // 뒤벽 안쪽면·프레임 두께·깊이·문 몸통 Z(벽 두께 안)
    const x0 = backDoorOpen.a0, x1 = backDoorOpen.a1, by = f1Top, hh = bdFrameH, F = materials.entryFrame;
    box({ x: x0, z: zc, w: fr, d: dep, y: by, h: hh, mat: F });                          // 좌 세로 문틀
    box({ x: x1 - fr, z: zc, w: fr, d: dep, y: by, h: hh, mat: F });                     // 우 세로 문틀
    box({ x: x0, z: zc, w: x1 - x0, d: dep, y: by + hh - fr, h: fr, mat: F });           // 상부 인방
    box({ x: x0, z: zc, w: x1 - x0, d: dep, y: by, h: fr, mat: F });                     // 하부 문턱
    box({ x: x0 + fr, z: zc + 0.03, w: (x1 - x0) - 2 * fr, d: 0.04, y: by + fr, h: hh - 2 * fr, mat: materials.glass });   // 유리 문짝
    box({ x: x1 - fr - 0.05, z: zc - 0.02, w: 0.05, d: 0.04, y: by + hh * 0.42, h: hh * 0.16, mat: materials.handle });    // 세로 손잡이
    label(`뒤 출입문 ${fmtDim(bdLeafW)}×${fmtDim(hh)}m`, (x0 + x1) / 2, by + hh + 0.15, bz - 0.1, 'opening');
  });
  captureInto(s2Floor1Objects, () => {                                    // 뒤 출입문 앞 옥외 계단 — 너비 1m·3단(문턱=맨 위 단, 뒤쪽 +Z로 내려감). 정면 옥외 계단처럼 '1층 바닥' 토글
    deckStairs({ axis: 'x', span0: bdCx - s2RearStair.width / 2, span1: bdCx + s2RearStair.width / 2, edge: s2BackZ, outward: 1, steps: s2RearStair.steps, topY: f1Top, baseY: groundTopY, tread: s2RearStair.tread });
  });
  captureInto(s2Wall1Objects, () => {                                     // 왼쪽(안방쪽·高X) 외벽 외부 부동수전(벽붙이 야외수전) — 왼쪽 뒤에서 1m
    const wallX = s2W, fz = s2BackZ - 1.0;                                // 외벽 바깥면(x=8.5)·뒤벽서 1m 앞
    const brass = materials.handle;
    const bodyY = groundTopY + 0.65;                                      // 밸브 설치 높이(지면 위 0.57m)
    const outX = wallX + 0.14;                                           // 밸브 몸통 바깥 끝(바깥=+X)
    const cyl = (rTop, rBot, len, x, y, z, rotAxis, rot) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, len, 16), brass);
      m.position.set(x, y, z);
      if (rotAxis === 'x') m.rotation.x = rot;
      if (rotAxis === 'z') m.rotation.z = rot;
      m.castShadow = true; m.receiveShadow = false; scene.add(m); return m;
    };
    cyl(0.055, 0.055, 0.03, wallX + 0.015, bodyY, fz, 'z', Math.PI / 2);  // 벽 플랜지(벽면에 밀착한 원판)
    cyl(0.034, 0.034, 0.14, wallX + 0.07, bodyY, fz, 'z', Math.PI / 2);   // 밸브 몸통(벽에서 바깥으로 수평)
    cyl(0.014, 0.014, 0.10, outX, bodyY + 0.05, fz, null, 0);             // 핸들 축(세로)
    cyl(0.075, 0.075, 0.02, outX, bodyY + 0.10, fz, null, 0);             // 둥근 손잡이(휠)
    cyl(0.024, 0.024, 0.14, outX, bodyY - 0.08, fz, null, 0);             // 토수구(몸통 끝에서 아래로)
    cyl(0.028, 0.026, 0.035, outX, bodyY - 0.16, fz, null, 0);            // 끝 호스 연결구(약간 굵게)
    label('외부 부동수전', wallX + 0.5, bodyY + 0.5, fz - 0.25, 'mep');
  });
  captureInto(s2Wall1Objects, () => {                                     // 정면 좌우 코너(폴딩도어 양끝 300mm 기둥)에 외부(방수) 콘센트 2개
    const wallFaceZ = s2FrontZ;                                          // 정면 외벽 바깥면(−Z가 외부)
    const outletY = f1Top + 0.32;
    const extOutlet = (ox) => {
      box({ x: ox - 0.065, z: wallFaceZ - 0.035, w: 0.13, d: 0.035, y: outletY, h: 0.15, mat: materials.outlet });        // 커버 플레이트
      box({ x: ox - 0.045, z: wallFaceZ - 0.05, w: 0.09, d: 0.02, y: outletY + 0.03, h: 0.09, mat: materials.outletSocket }); // 소켓 면
    };
    extOutlet(s2X0 + t + fdColT / 2);        // 정면 우측 코너(낮은 X, 폴딩도어 우측 기둥)
    extOutlet((s2W - t) - fdColT / 2);       // 정면 좌측 코너(높은 X, 폴딩도어 좌측 기둥)
  });
  captureInto(s2Wall1Objects, () => planYDim(s2W + 0.4, s2BackZ - 0.2, f1Top, y1, `1층 천장고 ${fmtDim(y1 - f1Top)}m`));   // 1층 바닥 윗면~천장 (3층 외벽최저와 같은 위치)
  captureInto(s2Wall1Objects, () => {                                     // 정면 폴딩도어 — 중앙 양개, 주방쪽(우) 절반 접어 열림
    const fdGlass = new THREE.MeshLambertMaterial({ color: 0xcfe6f0, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false });   // 닫힌 짝 유리
    const fdMove = new THREE.MeshLambertMaterial({ color: 0x9fc0d4, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });    // 접힌(움직인) 짝 유리 — 약간 짙게
    const fdFrame = new THREE.MeshLambertMaterial({ color: 0x3a3f45 });   // 폴딩 알루미늄 프레임(다크그레이)
    const mullW = 0.05;
    const ox0 = fdOpen.x0, ox1 = fdOpen.x1, sy = fdOpen.sillY, hy = fdOpen.headY, zc = s2FrontZ + t / 2;
    const cx = (ox0 + ox1) / 2, half = 5, pw = (ox1 - ox0) / 10;          // 양개: 한쪽 5짝, 짝폭 ≈0.68m
    box({ x: ox0, z: zc - 0.05, w: ox1 - ox0, d: 0.1, y: sy, h: 0.08, mat: fdFrame });          // 하부 레일(문턱) — 고정 트랙(전폭)
    box({ x: ox0, z: zc - 0.05, w: ox1 - ox0, d: 0.1, y: hy - 0.08, h: 0.08, mat: fdFrame });   // 상부 레일 — 고정 트랙(전폭)
    // 안방쪽(좌, 高x) 절반 — 닫힘(평면 유리 + 세로 접이살)
    box({ x: cx, z: zc - 0.025, w: ox1 - cx, d: 0.05, y: sy, h: hy - sy, mat: fdGlass, cast: false });
    for (let i = 0; i <= half; i += 1) box({ x: cx + pw * i - mullW / 2, z: zc - 0.07, w: mullW, d: 0.14, y: sy, h: hy - sy, mat: fdFrame, cast: false });
    box({ x: cx + 0.085, z: zc - 0.13, w: 0.045, d: 0.045, y: sy + 0.95, h: 0.28, mat: materials.handle });   // 닫힌 짝 중앙 손잡이
    // 주방쪽(우, 低x) 절반 — 주방쪽 기둥(ox0)에 아코디언으로 접혀 밖(−z)으로 열림. 짝끼리 ±60° 지그재그.
    const ang = 60 * Math.PI / 180, sX = pw * Math.cos(ang), fD = pw * Math.sin(ang);   // 짝당 x 전진·접힘 깊이
    const hinge = (k) => [ox0 + sX * k, k % 2 === 0 ? zc : zc - fD];                     // 접이 경첩점(짝수=트랙선, 홀수=밖으로 꺾임)
    for (let k = 0; k < half; k += 1) {                                  // 5짝 — 각 짝을 경첩~경첩 잇는 기울어진 유리판으로
      const [x0p, z0p] = hinge(k), [x1p, z1p] = hinge(k + 1);
      const cxp = (x0p + x1p) / 2, czp = (z0p + z1p) / 2, len = Math.hypot(x1p - x0p, z1p - z0p);
      const m = box({ x: cxp - len / 2, z: czp - 0.025, w: len, d: 0.05, y: sy, h: hy - sy, mat: fdMove, cast: false });
      m.rotation.y = Math.atan2(-(z1p - z0p), x1p - x0p);
    }
    for (let k = 0; k <= half; k += 1) { const [hx, hz] = hinge(k); box({ x: hx - 0.035, z: hz - 0.035, w: 0.07, d: 0.07, y: sy, h: hy - sy, mat: fdFrame, cast: false }); }   // 경첩 세로살
    { const [lx, lz] = hinge(half); box({ x: lx - 0.06, z: lz - 0.13, w: 0.045, d: 0.045, y: sy + 0.95, h: 0.28, mat: materials.handle }); }   // 접힌 선두짝 손잡이
    label(`1층 정면 폴딩도어 ${fmtDim(ox1 - ox0)}×${fmtDim(hy - sy)}m (중앙 양개·주방쪽 접어 열림)`, cx, sy + 1.45, s2FrontZ - 0.25, 'opening');
  });
  captureInto(s2Wall1Objects, () => {                                     // 우측벽 슬라이드창·좌측벽 폴딩창 (뒤벽은 막힘)
    const fdMove = new THREE.MeshLambertMaterial({ color: 0x9fc0d4, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });   // 접힌 짝 유리
    const fdFrame = new THREE.MeshLambertMaterial({ color: 0x3a3f45 });   // 폴딩 알루미늄 프레임(다크그레이)
    const pw = 0.68, ang = 60 * Math.PI / 180, sU = pw * Math.cos(ang), fV = pw * Math.sin(ang), n = 4;   // 짝당 전진·접힘깊이·짝수
    const drawFold = (toWorld, syArg = f1Top, hyArg = f1Top + fdH, nArg = n) => {   // toWorld(k)→{x,z} 경첩점 / 짝끼리 지그재그. syArg·hyArg=하부·상부 높이(폴딩창은 올림). nArg=짝수(기본 4)
      const sy = syArg, hy = hyArg;
      for (let k = 0; k < nArg; k += 1) {
        const p0 = toWorld(k), p1 = toWorld(k + 1);
        const cxp = (p0.x + p1.x) / 2, czp = (p0.z + p1.z) / 2, len = Math.hypot(p1.x - p0.x, p1.z - p0.z);
        const m = box({ x: cxp - len / 2, z: czp - 0.025, w: len, d: 0.05, y: sy, h: hy - sy, mat: fdMove, cast: false });
        m.rotation.y = Math.atan2(-(p1.z - p0.z), p1.x - p0.x);
      }
      for (let k = 0; k <= nArg; k += 1) { const p = toWorld(k); box({ x: p.x - 0.035, z: p.z - 0.035, w: 0.07, d: 0.07, y: sy, h: hy - sy, mat: fdFrame, cast: false }); }   // 경첩 세로살
      const lead = toWorld(nArg); box({ x: lead.x - 0.06, z: lead.z - 0.06, w: 0.045, d: 0.045, y: sy + 0.95, h: 0.28, mat: materials.handle });   // 선두짝 손잡이
    };
    // 우측벽(x=0): 2트랙 4짝 양미서기 슬라이드 창 — 뒤벽과 동일 방식(축만 X↔Z). 바깥 2짝 고정 + 가운데 2짝 앞뒤로 갈라져 가운데 열림. sill·개구 유지.
    { const xc = s2X0 + t / 2, syR = rO.sillY, hyR = rO.headY;
      const slFrame = materials.windowFrame;   // 우측 슬라이드창 프레임 — 회색(폴딩도어·좌측 폴딩창과 달리 예외 아님)
      const slGlass = new THREE.MeshLambertMaterial({ color: 0xcfe6f0, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false });   // 고정 짝 유리
      const slMove  = new THREE.MeshLambertMaterial({ color: 0x9fc0d4, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });    // 미닫이(열린) 짝 유리
      const pw = (rO.a1 - rO.a0) / 4, mullW = 0.05, trk = 0.03;                                            // 4짝·트랙 오프셋
      box({ x: xc - 0.06, z: rO.a0, w: 0.12, d: rO.a1 - rO.a0, y: syR, h: 0.08, mat: slFrame });           // 하부 레일(2트랙 전폭)
      box({ x: xc - 0.06, z: rO.a0, w: 0.12, d: rO.a1 - rO.a0, y: hyR - 0.08, h: 0.08, mat: slFrame });    // 상부 레일(2트랙 전폭)
      const pane = (z0, xt, mat) => {                                                                       // 유리 짝 + 앞뒤 세로살
        box({ x: xt - 0.025, z: z0, w: 0.05, d: pw, y: syR, h: hyR - syR, mat, cast: false });
        box({ x: xt - 0.035, z: z0, w: 0.07, d: mullW, y: syR, h: hyR - syR, mat: slFrame, cast: false });
        box({ x: xt - 0.035, z: z0 + pw - mullW, w: 0.07, d: mullW, y: syR, h: hyR - syR, mat: slFrame, cast: false });
      };
      pane(rO.a0, xc + trk, slGlass);            // 고정 바깥 앞 (안쪽트랙)
      pane(rO.a1 - pw, xc + trk, slGlass);        // 고정 바깥 뒤 (안쪽트랙)
      pane(rO.a0, xc - trk, slMove);              // 미닫이 앞 → 앞으로 갈라져 바깥 겹침 (바깥트랙)
      pane(rO.a1 - pw, xc - trk, slMove);          // 미닫이 뒤 → 뒤로 갈라져 바깥 겹침 (바깥트랙)
      box({ x: xc - trk + 0.085, z: rO.a0 + pw - 0.06, w: 0.045, d: 0.045, y: syR + 0.95, h: 0.28, mat: materials.handle });   // 앞 미닫이 손잡이(가운데쪽)
      box({ x: xc - trk + 0.085, z: rO.a1 - pw + 0.02, w: 0.045, d: 0.045, y: syR + 0.95, h: 0.28, mat: materials.handle });    // 뒤 미닫이 손잡이(가운데쪽)
      label(`1층 우측 슬라이드창 ${fmtDim(rO.a1 - rO.a0)}×${fmtDim(hyR - syR)}m (4짝 양미서기·가운데 열림)`, s2X0 - 0.3, syR + 1.0, (rO.a0 + rO.a1) / 2, 'opening'); }
    // 좌측벽(高x): 중앙 분리 2+2 양개 — 앞 2짝은 a0(低z)쪽, 뒤 2짝은 a1(高z)쪽으로 각각 접힘. 밖(+x)으로.
    { const xc = s2W - t / 2, syL = lO.sillY;
      box({ x: xc - 0.05, z: lO.a0, w: 0.1, d: lO.a1 - lO.a0, y: syL, h: 0.08, mat: fdFrame });          // 하부 레일(폴딩창 sill)
      box({ x: xc - 0.05, z: lO.a0, w: 0.1, d: lO.a1 - lO.a0, y: lO.headY - 0.08, h: 0.08, mat: fdFrame });    // 상부 레일
      drawFold((k) => ({ x: xc + (k % 2 === 0 ? 0 : fV), z: lO.a0 + sU * k }), syL, lO.headY, 2);        // 앞(低z) 2짝 — a0서 중앙으로 접힘
      drawFold((k) => ({ x: xc + (k % 2 === 0 ? 0 : fV), z: lO.a1 - sU * k }), syL, lO.headY, 2);        // 뒤(高z) 2짝 — a1서 중앙으로 접힘
      label(`1층 좌측 폴딩창 ${fmtDim(lGap)}×${fmtDim(lO.headY - syL)}m (2+2 양개·양쪽 접힘)`, s2W + 0.3, syL + 1.0, (lO.a0 + lO.a1) / 2, 'opening'); }
  });
  // 눈썹지붕(고정식 캐노피) 단일 출처 — 개구 상단 위 리얼징크 경사판 + 벽-지붕 후레싱(물끊기) + 처마끝 드립엣지 + 까치발 2개.
  // axis: 돌출축('x'|'z', 외벽 법선) · dir: 바깥 방향(±1) · wallFace: 외벽 바깥면(그 축) · spanC/spanW: 스팬축 중앙·지붕 폭 · topY: 개구 상단. 돌출 0.8·물매낙차 0.1(벽쪽↑ 바깥↓).
  const eyebrowRoof = (axis, dir, wallFace, spanC, spanW, topY, tag, run = 0.8, bracketed = true) => {
    const drop = 0.1, thk = 0.06;
    const L = Math.hypot(run, drop);
    const s0 = spanC - spanW / 2;                              // 스팬축 시작
    const panelMinP = wallFace + dir * run / 2 - L / 2;        // 경사판 돌출축 min(중앙=wallFace+dir·run/2)
    const flashP = wallFace + dir * 0.01 - 0.04;              // 벽-지붕 후레싱 min(벽면 바로 바깥)
    const dripP  = wallFace + dir * run - dir * 0.015 - 0.025;  // 처마끝 드립엣지 min
    const p0b = wallFace, p1b = wallFace + dir * (run - 0.05);  // 까치발 벽점·지붕밑점(돌출축)
    const y0b = topY - 0.40, y1b = topY - 0.06;
    const bl = Math.hypot(p1b - p0b, y1b - y0b);
    const bmid = (p0b + p1b) / 2 - bl / 2, bY = (y0b + y1b) / 2 - 0.03;
    if (axis === 'x') {
      const panel = box({ x: panelMinP, z: s0, w: L, d: spanW, y: topY + drop / 2 + 0.02, h: thk, mat: materials.roof });   // 리얼징크 경사판
      panel.rotation.z = Math.atan2(-drop, dir * run);          // 바깥으로 물매
      box({ x: flashP, z: s0, w: 0.08, d: spanW, y: topY + drop - 0.02, h: 0.14, mat: materials.roofEdge });   // 벽-지붕 후레싱
      box({ x: wallFace + dir * 0.05, z: s0, w: 0.10, d: spanW, y: topY - 0.11, h: 0.20, mat: materials.roofEdge });   // 뒷변 인방 연속보 — 개구 상단 인방에 전체 길이 고정(까치발 대신 연속 지지)
      box({ x: dripP,  z: s0, w: 0.06, d: spanW, y: topY - drop - 0.12, h: 0.22, mat: materials.roofEdge });    // 처마끝 테두리보 — 처짐·바람 들썩임 방지(양 끝 지지만으로 성립)
      const bracket = (bs) => { const m = box({ x: bmid, z: bs, w: bl, d: 0.06, y: bY, h: 0.06, mat: materials.roofEdge }); m.rotation.z = Math.atan2(y1b - y0b, p1b - p0b); };
      if (bracketed) { bracket(s0 + 0.06); bracket(s0 + spanW - 0.12); }
    } else {
      const panel = box({ x: s0, z: panelMinP, w: spanW, d: L, y: topY + drop / 2 + 0.02, h: thk, mat: materials.roof });
      panel.rotation.x = Math.atan2(drop, dir * run);
      box({ x: s0, z: flashP, w: spanW, d: 0.08, y: topY + drop - 0.02, h: 0.14, mat: materials.roofEdge });
      box({ x: s0, z: wallFace + dir * 0.05, w: spanW, d: 0.10, y: topY - 0.11, h: 0.20, mat: materials.roofEdge });   // 뒷변 인방 연속보 — 개구 상단 인방에 전체 길이 고정(까치발 대신 연속 지지)
      box({ x: s0, z: dripP,  w: spanW, d: 0.06, y: topY - drop - 0.12, h: 0.22, mat: materials.roofEdge });   // 처마끝 테두리보 — 처짐·바람 들썩임 방지(양 끝 지지만으로 성립)
      const bracket = (bx) => { const m = box({ x: bx, z: bmid, w: 0.06, d: bl, y: bY, h: 0.06, mat: materials.roofEdge }); m.rotation.x = Math.atan2(-(y1b - y0b), p1b - p0b); };
      if (bracketed) { bracket(s0 + 0.06); bracket(s0 + spanW - 0.12); }
    }
    const lx = axis === 'x' ? wallFace + dir * 0.4 : spanC;
    const lz = axis === 'x' ? spanC : wallFace + dir * 0.4;
    label(`${tag} 눈썹지붕 ${fmtDim(run)}×${fmtDim(spanW)}m (고정식·리얼징크)`, lx, topY + 0.35, lz, 'roof');
  };
  captureInto(s2Wall1Objects, () => {                                     // 1층 개구부 위 고정식 눈썹지붕 — 단일 출처(eyebrowRoof)로 통일
    eyebrowRoof('x', +1, s2W,        lCz, lGap + 0.40, lO.headY, '1층 싱크대쪽');                                  // 좌측(싱크대쪽) 폴딩창 위(+X)
    eyebrowRoof('z', -1, s2FrontZ,   (fdOpen.x0 + fdOpen.x1) / 2, (fdOpen.x1 - fdOpen.x0) + 0.40, fdOpen.headY, '정면 폴딩도어');   // 정면 폴딩도어 위(−Z)
    eyebrowRoof('x', -1, s2X0,       (rO.a0 + rO.a1) / 2, (rO.a1 - rO.a0) + 0.40, rO.headY, '우측 슬라이드창', 0.45);   // 우측(주방측) 슬라이드창 위(−X) — 대지경계 0.5m 이내로 돌출 축소
    eyebrowRoof('z', +1, s2BackZ,    bdCx, (backDoorOpen.a1 - backDoorOpen.a0) + 0.40, backDoorOpen.headY + 0.25, '뒤 출입문', 0.8, false);   // 뒤 출입문 위(+Z) — 밖열림 대비: 문 상단서 0.25m 올리고 까치발 제거(캔틸레버)
  });
  // 2·3층 화장실 왼쪽(안방쪽·高X) 외벽 프로젝트(어닝) 시스템창(단일 출처) — 창대 바닥+1.5m·폭0.8(Z)×높0.8·상부경첩 바깥밀이. 비올 때도 환기, 기계배기와 병행.
  const wcWinCz = (s2BackZ - t) - 0.3 - 0.3;   // 화장실 창 Z중앙 — 뒤 외벽 안쪽서 0.3m 이격(창 뒤끝) + 반폭 0.3
  const wcWinP0 = wcWinCz - 0.3, wcWinP1 = wcWinCz + 0.3;              // 폭 0.6m(Z 스팬)
  // 2층 안방(앞 트인 방) 창 — 접한 3면(앞·좌·우) 미서기. 창대 바닥+1.2m(추락안전)·창높이 1.0m(상단 2.2m). 정면 픽스창 위 인방(헤더) 자리 0.5m 확보. 뒤벽은 화장실·계단이라 막힘.
  {
    const inX0w = s2X0 + t, inX1w = s2W - t, inZ0w = s2FrontZ + t, inZ1w = s2BackZ - t;
    const zB0w = inZ1w - (2 * S2_STAIR.W + S2_STAIR.g);          // 계단실 앞 경계(앞방 뒤끝)
    const abSill = lvl2 + 1.2, abHead = lvl2 + 2.2;             // 창대 1.2(추락안전) · 상단 2.2(천장 밑 0.5m — 픽스창 인방 확보) · 높이 1.0
    const ow = (p0, p1) => ({ p0, p1, sillY: abSill, headY: abHead });
    const sideCz = s2FrontZ + 0.6 + 0.8;                        // 좌·우 측창 앞뒤 중앙 — 앞 외벽 바깥서 0.6m 시작·짝폭 0.8m×2짝=1.6m(1층 전면창 기준)
    const abFront = s2FrontFixSpans().map(s => ow(s.p0, s.p1));   // 정면 픽스창 좌우 2개 — 3층 게스트룸1·2 정면창과 동일 X스팬(같은 폭·수직 정렬), 가운데 전단벽
    const abSide  = [ow(sideCz - 0.8, sideCz + 0.8)];                            // 측면 2짝×0.8=1.6m (좌·우 동일)
    captureInto(s2Wall2Objects, () => {
      const corrX2 = bkLiftHiX - 2.025;                                 // 앞·뒤 복도창 X중앙(3층 복도창과 동일 X)
      const fCorr2 = { p0: corrX2 - 0.3, p1: corrX2 + 0.3, sillY: lvl2 + 1.2, headY: lvl2 + 1.8 };   // 앞 프로젝트창 0.6×0.6·창대 바닥+1.2(양옆 정면 픽스창과 동일)
      wallStrip('x', s2FrontZ, inX0w, inX1w, y1, y2, [...abFront, fCorr2], EW);        // 앞벽 — 정면 픽스창 + 앞 프로젝트창
      const bCorr2 = { p0: corrX2 - 0.3, p1: corrX2 + 0.3, sillY: lvl2 + 1.2, headY: lvl2 + 1.8 };   // 0.6×0.6·창대 바닥+1.2
      const [sSpan2] = s2FrontFixSpans();   // 2층 계단실 뒤벽 픽스창 — 오른쪽(주방쪽·低X) 가장자리(sSpan2.p0) 고정
      const stairBackWin2W = 0.4;           // 너비 40cm(채광용 세로 슬롯 — 디자인·구조 유리)
      const stairBackWin2 = { p0: sSpan2.p0, p1: sSpan2.p0 + stairBackWin2W, sillY: s2Landing12Y + 1.2, headY: s2Landing23Y - S2_STAIR.tTh - 0.6 };   // 하단=1-2 계단참 윗면+1.2m · 상단=2-3 계단참 아랫면−0.6m(3층 창-처마 관계와 동일)
      wallStrip('x', s2BackZ - t, inX0w, inX1w, y1, y2, [bCorr2, stairBackWin2], EW);   // 뒤벽 — 층계참 프로젝트창 + 계단실 픽스창
      wallStrip('z', s2X0, s2FrontZ, s2BackZ, y1, y2, abSide, EW);       // 우측벽(주방쪽)
      wallStrip('z', s2W - t, s2FrontZ, s2BackZ, y1, y2, [...abSide, { p0: wcWinP0, p1: wcWinP1, sillY: lvl2 + 1.2, headY: lvl2 + 1.8 }], EW);   // 좌측벽(안방쪽) — 안방창 + 화장실 프로젝트창
      for (const o of abFront) frontFixSash(o.p0, s2FrontZ + 0.13, o.p1 - o.p0, o.sillY, o.headY - o.sillY);   // 안방 정면 픽스창
      frontAwningSash(fCorr2.p0, s2FrontZ + 0.13, 0.6, lvl2 + 1.2, 0.6, -1);   // 2층 앞 프로젝트창(低Z 바깥) — 창대 바닥+1.2(양옆 픽스창과 동일)
      label('앞 프로젝트창 0.6×0.6m', corrX2, lvl2 + 1.2 + 0.4, s2FrontZ - 0.1, 'opening');
      for (const o of abSide) sideSash(s2X0 + 0.17, o.p0, o.p1 - o.p0, o.sillY, o.headY - o.sillY);   // 우(주방쪽)
      for (const o of abSide) sideSash(s2W - 0.13, o.p0, o.p1 - o.p0, o.sillY, o.headY - o.sillY);    // 좌(안방쪽)
      awningSash(s2W - 0.13, wcWinP0, 0.6, lvl2 + 1.2, 0.6);             // 2층 화장실 왼쪽벽 프로젝트창
      label('화장실 프로젝트창 0.6×0.6m', s2W + 0.1, lvl2 + 1.2 + 0.4, wcWinCz, 'opening');
      frontAwningSash(bCorr2.p0, s2BackZ - 0.13, 0.6, lvl2 + 1.2, 0.6, 1);   // 2층 층계참 뒤벽 프로젝트창(高Z 바깥)
      label('층계참 프로젝트창 0.6×0.6m', corrX2, lvl2 + 1.2 + 0.4, s2BackZ + 0.1, 'opening');
      frontFixSash(stairBackWin2.p0, s2BackZ - 0.13, stairBackWin2.p1 - stairBackWin2.p0, stairBackWin2.sillY, stairBackWin2.headY - stairBackWin2.sillY);   // 2층 계단실 뒤벽 픽스창
      label(`계단실 뒤벽 픽스창 ${fmtDim(stairBackWin2.p1 - stairBackWin2.p0)}×${fmtDim(stairBackWin2.headY - stairBackWin2.sillY)}m`, (stairBackWin2.p0 + stairBackWin2.p1) / 2, (stairBackWin2.sillY + stairBackWin2.headY) / 2, s2BackZ + 0.1, 'opening');
      abFront.forEach(o => label('안방 정면 픽스창 ' + fmtDim(o.p1 - o.p0) + '×1.0m', (o.p0 + o.p1) / 2, abSill + 0.5, s2FrontZ - 0.1, 'opening'));
      label('안방 우측창 1.6×1.2m', s2X0 - 0.1, abSill + 0.6, sideCz, 'opening');
      label('안방 좌측창 1.6×1.2m', s2W + 0.1, abSill + 0.6, sideCz, 'opening');
    });
  }
  captureInto(s2Wall2Objects, () => planYDim(s2W + 0.4, s2BackZ - 0.2, lvl2, y2, `2층 천장고 ${fmtDim(y2 - lvl2)}m`));   // 2층 바닥 윗면~천장 (3층 외벽최저와 같은 위치)
  // 실외기 방열/배기 루버 개구·그릴 공통 좌표(단일 출처) — 외벽 개구는 '외벽', 그릴·실외기실은 '실외기' 버튼이 공유
  const ecuNicheCz = 1.10;                                // 실외기실 앞뒤(Z) 중앙 = (게스트룸2 뒤끝 0.40 + 화장실 앞벽 1.80)/2 — 실외기·루버 공통 정렬
  const ecuLouP0 = ecuNicheCz - 0.50, ecuLouP1 = ecuNicheCz + 0.50, ecuLouSill = lvl3 + 0.15, ecuLouHead = lvl3 + 1.10;
  const ecuLou2Sill = lvl3 + 1.30, ecuLou2Head = lvl3 + 2.25;   // 상단 방열 루버 — 멀리언 0.20·위 인방 0.15(2.4m 밑), 하·상 높이 0.95 동일(2단)
  const ecuLou3Sill = eaveY + 0.15, ecuLou3Head = eaveY + 0.65;   // 처마선 위 인방 0.15 두고 시작, 높이 0.5m
  captureInto(s2Wall3Objects, () => {                                     // 3층 외벽 — 3층 슬래브 밑면~처마/용마루(박공)
    // 앞(처마까지) — 게스트룸 정면 픽스창 2개(창대 바닥+1.2m 추락안전·높이 0.5·상단 1.7, 처마 선단 밑 — 처마에 안 가림). 폭 2.0m, 각 방 앞부분 중앙 가로창.
    const fWinSill = lvl3 + 1.2, fWinHead = lvl3 + 1.7, pWinHead = lvl3 + 1.7;   // 픽스창 상단 1.7(처마 선단 밑) / 복도·계단 창 상단 1.7
    const [fSpan1, fSpan2] = s2FrontFixSpans();              // 방 안서 양옆 벽면 30cm 대칭(2층과 공유하는 단일 출처)
    const fWin1 = { ...fSpan1, sillY: fWinSill, headY: fWinHead };   // 게스트룸1(低X): 주방측 외벽 ~ 옆벽(far3)
    const fWin2 = { ...fSpan2, sillY: fWinSill, headY: fWinHead };   // 게스트룸2(高X): 복도벽 ~ 안방측 외벽
    const fx1 = (fWin1.p0 + fWin1.p1) / 2, fx2 = (fWin2.p0 + fWin2.p1) / 2;   // 각 방 정면창 X중앙(라벨용)
    // 앞뒤(가운데 세로) 복도 — 게스트룸1·2 사이 중앙 스파인(홈리프트 低X면 −2.1). 앞·뒤 외벽에 프로젝트창 각 1개(정면 픽스창과 같은 창대0.9·높이0.8, 폭 0.8).
    const corrX = bkLiftHiX - 2.025;                        // 앞뒤 복도 실통로 X중앙 — 게스트룸1(주방)쪽 방문벽 15cm가 복도를 먹어 트인 폭[far3+0.15, liftX0] 기준 중앙(벽 중심선 중앙서 +7.5cm)
    const fCorr = { p0: corrX - 0.3, p1: corrX + 0.3, sillY: lvl3 + 1.1, headY: pWinHead };
    wallStrip('x', s2FrontZ, s2X0 + t, s2W - t, y2, eaveY, [fWin1, fWin2, fCorr], EW);
    frontFixSash(fWin1.p0, s2FrontZ + 0.13, fWin1.p1 - fWin1.p0, fWinSill, fWinHead - fWinSill);   // 게스트룸1 정면 픽스창
    frontFixSash(fWin2.p0, s2FrontZ + 0.13, fWin2.p1 - fWin2.p0, fWinSill, fWinHead - fWinSill);   // 게스트룸2 정면 픽스창
    frontAwningSash(fCorr.p0, s2FrontZ + 0.13, 0.6, lvl3 + 1.1, 0.6, -1);   // 앞 복도 프로젝트창(低Z 바깥)
    label(`게스트룸1 정면 픽스창 ${fmtDim(fWin1.p1 - fWin1.p0)}×${fmtDim(fWinHead - fWinSill)}m`, fx1, fWinSill + 0.25, s2FrontZ - 0.1, 'opening');
    label(`게스트룸2 정면 픽스창 ${fmtDim(fWin2.p1 - fWin2.p0)}×${fmtDim(fWinHead - fWinSill)}m`, fx2, fWinSill + 0.25, s2FrontZ - 0.1, 'opening');
    label('앞 복도 프로젝트창 0.6×0.6m', corrX, lvl3 + 1.1 + 0.4, s2FrontZ - 0.1, 'opening');
    // 뒤(처마까지) — 앞뒤 복도 뒤쪽 프로젝트창 1개 + 계단실 오른쪽(주방측·低X) 세로 픽스창 1개
    const bCorr = { p0: corrX - 0.3, p1: corrX + 0.3, sillY: lvl3 + 1.1, headY: pWinHead };
    const [sSpan] = s2FrontFixSpans();   // 계단실 뒤벽 픽스창 — 오른쪽(주방쪽·低X) 가장자리(sSpan.p0)를 고정
    const stairBackWinW = 0.4;           // 너비 40cm(채광용 세로 슬롯 — 디자인·구조 유리)
    const stairBackWin = { p0: sSpan.p0, p1: sSpan.p0 + stairBackWinW, sillY: s2Landing23Y + 1.2, headY: pWinHead };   // 하단=2-3 계단참 윗면+1.2m · 상단=뒤 복도창 상단(1.7m, 유지)
    const stairBackWinX = (stairBackWin.p0 + stairBackWin.p1) / 2;
    wallStrip('x', s2BackZ - t, s2X0 + t, s2W - t, y2, eaveY, [bCorr, stairBackWin], EW);
    frontAwningSash(bCorr.p0, s2BackZ - 0.13, 0.6, lvl3 + 1.1, 0.6, 1);   // 뒤 복도 프로젝트창(高Z 바깥)
    label('뒤 복도 프로젝트창 0.6×0.6m', corrX, lvl3 + 1.1 + 0.4, s2BackZ + 0.1, 'opening');
    frontFixSash(stairBackWin.p0, s2BackZ - 0.13, stairBackWinW, stairBackWin.sillY, pWinHead - stairBackWin.sillY);   // 계단실 뒤벽 세로 픽스창
    label(`계단실 뒤벽 픽스창 ${fmtDim(stairBackWinW)}×${fmtDim(pWinHead - stairBackWin.sillY)}m`, stairBackWinX, stairBackWin.sillY + (pWinHead - stairBackWin.sillY) / 2, s2BackZ + 0.1, 'opening');
    const gableTop = [[s2FrontZ, eaveY], [s2BackZ, eaveY], [zMid, peakY]];   // 처마 위 박공 삼각(창은 처마 밑 직사각 구간에만)
    // 3층 게스트룸 창(단일 출처) — 좌우 측벽에 각각. 2층 안방 좌우창과 동일: 앞 외벽 바깥서 0.6m 시작·미서기 2짝×0.8=1.6m·창대 바닥+1.2m(추락안전). 상단은 외벽 최저(2.4) 밑 0.3m=2.1m라 높이 0.9m(층고 낮아 축소).
    const gWinCz = s2FrontZ + 0.6 + 0.8;                     // 게스트룸 창 Z중앙 — 앞 외벽 바깥서 0.6m 시작·짝폭 0.8m×2짝(2층 측창과 동일)
    const gWinP0 = gWinCz - 0.8, gWinP1 = gWinCz + 0.8, gSill = lvl3 + 1.2, gHead = lvl3 + 2.1;
    // 우(주방, 低X) — 게스트룸1 측창: 처마 밑 직사각(창 개구)+처마 위 삼각으로 분리
    wallStrip('z', s2X0, s2FrontZ, s2BackZ, y2, eaveY, [{ p0: gWinP0, p1: gWinP1, sillY: gSill, headY: gHead }], EW);
    yzWallPrism({ x: s2X0, points: gableTop, thickness: t, mat: EW });
    sideSash(s2X0 + 0.17, gWinP0, 1.6, gSill, 0.9);          // 게스트룸1 측창(低X·주방쪽)
    label('게스트룸1 측창 1.6×0.9m', s2X0 - 0.1, gSill + 0.45, gWinCz, 'opening');
    // 좌(안방, 高X) — 화장실 프로젝트창 + 게스트룸2 측창 + 실외기 방열 루버: 처마 밑 직사각(세 개구)+처마 위 삼각으로 분리
    // 왼쪽 복도창 자리 → 2층 냉난방기 실외기 방열 루버 개구(실외기 앞면 토출·바깥). 폭 1.1(Z)×높0.8, 창대 바닥+0.05 (개구 좌표는 위 블록 단일 출처)
    wallStrip('z', s2W - t, s2FrontZ, s2BackZ, y2, eaveY, [{ p0: wcWinP0, p1: wcWinP1, sillY: lvl3 + 1.2, headY: lvl3 + 1.8 }, { p0: gWinP0, p1: gWinP1, sillY: gSill, headY: gHead }, { p0: ecuLouP0, p1: ecuLouP1, sillY: ecuLouSill, headY: ecuLouHead }, { p0: ecuLouP0, p1: ecuLouP1, sillY: ecuLou2Sill, headY: ecuLou2Head }], EW);
    // 상단 배기 루버 — 처마 위 박공 삼각벽에 하나 더(굴뚝효과로 더운 공기 위로 배기). 폭=하단 루버와 동일(ecuLouP0~P1), 높이 0.5m로 축소(삼각 안에 맞춤)
    const rU = (z) => s2RoofUnderY(z);                              // 그 z의 박공 밑선(삼각 윗변)
    // 박공 삼각벽(안방쪽)을 상단 배기 루버 개구 둘레로 4조각 분할(x=s2W-t) — 앞쪽(용마루 포함)·뒤쪽·개구 아래·개구 위
    yzWallPrism({ x: s2W - t, thickness: t, mat: EW, points: [[s2FrontZ, eaveY], [ecuLouP0, eaveY], [ecuLouP0, rU(ecuLouP0)], [zMid, peakY]] });
    yzWallPrism({ x: s2W - t, thickness: t, mat: EW, points: [[ecuLouP1, eaveY], [s2BackZ, eaveY], [ecuLouP1, rU(ecuLouP1)]] });
    yzWallPrism({ x: s2W - t, thickness: t, mat: EW, points: [[ecuLouP0, eaveY], [ecuLouP1, eaveY], [ecuLouP1, ecuLou3Sill], [ecuLouP0, ecuLou3Sill]] });
    yzWallPrism({ x: s2W - t, thickness: t, mat: EW, points: [[ecuLouP0, ecuLou3Head], [ecuLouP1, ecuLou3Head], [ecuLouP1, rU(ecuLouP1)], [ecuLouP0, rU(ecuLouP0)]] });
    awningSash(s2W - 0.13, wcWinP0, 0.6, lvl3 + 1.2, 0.6);                // 3층 화장실 왼쪽벽 프로젝트창
    label('화장실 프로젝트창 0.6×0.6m', s2W + 0.1, lvl3 + 1.2 + 0.4, wcWinCz, 'opening');
    sideSash(s2W - 0.13, gWinP0, 1.6, gSill, 0.9);           // 게스트룸2 측창(高X·안방쪽)
    label('게스트룸2 측창 1.6×0.9m', s2W + 0.1, gSill + 0.45, gWinCz, 'opening');
    // 벽 높이(처마·용마루)를 3층 바닥 윗면(lvl3)부터 각각 표기.
    planYDim(s2W + 0.4, s2BackZ - 0.2, lvl3, eaveY, `외벽 최저 ${fmtDim(eaveY - lvl3)}m`);
    planYDim(s2W + 0.4, zMid, lvl3, peakY, `외벽 꼭지점 ${fmtDim(peakY - lvl3)}m`);
  });
  // 실외기 — 방열/배기 루버 그릴 + 벽 안쪽 실외기실(외벽 개구는 '외벽'에 남고, 그릴·실내부는 여기 '실외기' 버튼) ──
  captureInto(s2Ecu3Objects, () => {
    box({ x: s2W - 0.13, z: ecuLouP0, w: 0.05, d: ecuLouP1 - ecuLouP0, y: ecuLou3Sill, h: ecuLou3Head - ecuLou3Sill, mat: materials.openingEdge });   // 상단 배기 루버 그릴(바깥면)
    label(`실외기 상단 배기 루버 ${fmtDim(ecuLouP1 - ecuLouP0)}×${fmtDim(ecuLou3Head - ecuLou3Sill)}m`, s2W + 0.1, (ecuLou3Sill + ecuLou3Head) / 2, ecuNicheCz, 'opening');
    box({ x: s2W - 0.13, z: ecuLouP0, w: 0.05, d: ecuLouP1 - ecuLouP0, y: ecuLouSill, h: ecuLouHead - ecuLouSill, mat: materials.openingEdge });   // 실외기 방열 루버 그릴(하단·바깥면)
    box({ x: s2W - 0.13, z: ecuLouP0, w: 0.05, d: ecuLouP1 - ecuLouP0, y: ecuLou2Sill, h: ecuLou2Head - ecuLou2Sill, mat: materials.openingEdge });   // 실외기 방열 루버 그릴(상단·바깥면)
    label('실외기 방열 루버 1.0×0.95m 2단', s2W + 0.1, (ecuLouSill + ecuLouHead) / 2, ecuNicheCz, 'opening');
    // ── 2층 냉난방기 실외기 서비스 함 — 3층 화장실 앞 복도 왼쪽(高X 외벽). 2층 실내기 바로 위(복도 구간). 실외기 앞(토출)=외벽(+X)·흡입=복도(-X) ──
    {
      const xW = s2W - t;                                  // 외벽 안쪽면(=inX1)
      const nZ0 = 0.40, nZ1 = 1.80;                        // 니치 Z: 0.40=게스트룸2 뒤끝(inZ0+RM_L)·1.80=화장실 앞벽(liftZ0+0.4) — 두 벽 사이(스코프 밖이라 값 고정)
      const nX0 = xW - 1.00;                               // 복도쪽 칸막이 위치 — 외벽서 1.00m(실외기 깊이 0.396+흡입여유 확대)
      const ecuCz = ecuNicheCz;                            // 실외기 Z중앙 = 실외기실 앞뒤 중앙(루버와 동일 정렬)
      const nCz = (nZ0 + nZ1) / 2;                         // 니치 Z중앙 — 양개문 중심
      const dz0 = nCz - 0.55, dz1 = nCz + 0.55, dTop = lvl3 + 2.0;   // 양개(양문형) 단열 점검문 폭 1.1m(실외기 길이 0.96 반입·반출)
      yzWallPrism({ x: nX0, thickness: 0.10, mat: materials.wall, points: [[nZ0, lvl3], [dz0, lvl3], [dz0, s2RoofUnderY(dz0)], [nZ0, s2RoofUnderY(nZ0)]] });   // 저Z 막힌벽(문설주)
      yzWallPrism({ x: nX0, thickness: 0.10, mat: materials.wall, points: [[dz1, lvl3], [nZ1, lvl3], [nZ1, s2RoofUnderY(nZ1)], [dz1, s2RoofUnderY(dz1)]] });   // 고Z 막힌벽(문설주)
      yzWallPrism({ x: nX0, thickness: 0.10, mat: materials.wall, points: [[dz0, dTop], [dz1, dTop], [dz1, s2RoofUnderY(dz1)], [dz0, s2RoofUnderY(dz0)]] });   // 문 위 인방
      box({ x: nX0 + 0.02, z: dz0, w: 0.06, d: nCz - dz0, y: lvl3, h: 2.0, mat: materials.entryDoor });   // 양개 단열문 — 저Z짝
      box({ x: nX0 + 0.02, z: nCz, w: 0.06, d: dz1 - nCz, y: lvl3, h: 2.0, mat: materials.entryDoor });   // 양개 단열문 — 고Z짝
      label('양개 단열 점검문 1.1m', nX0, lvl3 + 1.2, nCz, 'opening');
      const ecuW = 0.396, ecuLen = 0.96, ecuH = 0.70;      // 실외기(위니아 MRW11HSF) 깊이(X)·폭(Z)·높이
      box({ x: xW - 0.05 - ecuW, z: ecuCz - ecuLen / 2, w: ecuW, d: ecuLen, y: lvl3 + 0.10, h: ecuH, mat: materials.guard });   // 본체(받침 위 0.10)
      box({ x: xW - 0.06, z: ecuCz - ecuLen / 2 + 0.10, w: 0.025, d: ecuLen - 0.20, y: lvl3 + 0.23, h: ecuH - 0.20, mat: materials.openingEdge });   // 토출 팬그릴(외벽쪽 +X)
      label('2층 냉난방기 실외기 960×700×396', xW - 0.35, lvl3 + ecuH + 0.4, ecuCz, 'mep');
      // 방수 바닥 + 외벽쪽 배수 트렌치 — 제상수·빗물받이. 트렌치는 외벽 루버 밑에서 외부로 배수(구배).
      box({ x: nX0, z: nZ0, w: (xW - 0.12) - nX0, d: nZ1 - nZ0, y: lvl3, h: 0.015, mat: materials.wetFloor });        // 방수 바닥 마감(트렌치 앞까지)
      box({ x: xW - 0.12, z: nZ0, w: 0.12, d: nZ1 - nZ0, y: lvl3 - 0.05, h: 0.05, mat: materials.guard });            // 배수 트렌치 몸통(오목, 외벽 밑)
      box({ x: xW - 0.12, z: nZ0, w: 0.12, d: nZ1 - nZ0, y: lvl3 - 0.012, h: 0.012, mat: materials.entryFrame });     // 트렌치 그레이팅 커버
      label('실외기실 방수 바닥·배수 트렌치', xW - 0.06, lvl3 + 0.3, ecuCz, 'mep');
      // ── 내단열 보충 면 표시(노랑) — 루버로 뚫린 외벽은 단열 포기, 실외기실 안쪽면이 '새 외벽선' ──
      //    실내(복도·게스트룸2·화장실)와 맞닿는 세 수직면. 천장=지붕단열, 바닥(=2층 천장)은 별도 단열.
      yzWallPrism({ x: nX0 + 0.11, thickness: 0.10, mat: materials.insulPlane, points: [[nZ0, lvl3], [nZ1, lvl3], [nZ1, s2RoofUnderY(nZ1)], [nZ0, s2RoofUnderY(nZ0)]] });   // ① 복도쪽 칸막이(실외기실↔복도) — 내단열 10cm
      box({ x: nX0 + 0.21, z: nZ0 + 0.02, w: xW - (nX0 + 0.21), d: 0.10, y: lvl3, h: s2RoofUnderY(nZ0) - lvl3, mat: materials.insulPlane });   // ② 저Z 측벽(실외기실↔게스트룸2) — 내단열 10cm, 외벽~칸막이 단열 안쪽면
      box({ x: nX0 + 0.21, z: nZ1 - 0.12, w: xW - (nX0 + 0.21), d: 0.10, y: lvl3, h: s2RoofUnderY(nZ1) - lvl3, mat: materials.insulPlane });   // ③ 고Z 측벽(실외기실↔화장실) — 내단열 10cm, 외벽~칸막이 단열 안쪽면
      label('내단열 보충면(새 외벽선)', nX0 + 0.5, lvl3 + 1.6, ecuCz, 'mep');
    }
  });
}

// ── s2 지붕(징크 박공) + 눈막이 + 태양광 — 3층 '지붕'·'태양광' 토글 ──
//   처마=3층 벽 상단(roofY) 밑선. 두께 260mm(단열 260T) + 징크 마감. 처마 앞뒤 1.0m·좌우 0.45m.
{
  const sideOver = s2RoofSideOver, eaveOver = s2RoofEaveOver, thk = roofThickness, zf = 0.05, tan = Math.tan(s2RoofPitch);
  const undEaveY = roofY - tan * eaveOver;            // 처마 끝(내민 1m) 밑선 — 경사 연장
  const undRidgeY = s2RoofUnderY(s2RidgeZ);           // 용마루 밑선(단일 출처)
  const eFront = s2FrontZ - eaveOver, eBack = s2BackZ + eaveOver;   // 앞·뒤 처마 끝 Z
  const topEaveY = undEaveY + thk + zf, topRidgeY = undRidgeY + thk + zf;   // 징크 윗면(처마·용마루)
  // s2 폭(0~s2W) 박공 슬래브 한 면 — roofSlab과 같은 8면체지만 X범위를 s2에 맞춤. 윗면 eaveY..ridgeY, 두께 아래로.
  const s2RoofSlab = (eaveZ, eaveY, ridgeY, thickness, mat) => {
    const x0 = s2X0 - sideOver, x1 = s2W + sideOver, rz = s2RidgeZ;
    const v = new Float32Array([
      x0, eaveY, eaveZ, x1, eaveY, eaveZ, x1, ridgeY, rz, x0, ridgeY, rz,
      x0, eaveY - thickness, eaveZ, x1, eaveY - thickness, eaveZ, x1, ridgeY - thickness, rz, x0, ridgeY - thickness, rz,
    ]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(v, 3));
    g.setIndex([0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1, 3, 2, 6, 3, 6, 7, 0, 3, 7, 0, 7, 4, 1, 5, 6, 1, 6, 2]);
    g.clearGroups(); g.addGroup(0, 12, 0); g.addGroup(12, 24, 1); g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, [mat, materials.roofEdge]);
    mesh.castShadow = true; mesh.receiveShadow = true;
    scene.add(mesh);   // captureInto가 s2Roof3Objects로 자동 수집
    return mesh;
  };
  captureInto(s2Roof3Objects, () => {
    // 단열 260T(밑선=천장) — 앞·뒤 슬로프
    s2RoofSlab(eFront, undEaveY + thk, undRidgeY + thk, thk, materials.roofInsul);
    s2RoofSlab(eBack, undEaveY + thk, undRidgeY + thk, thk, materials.roofInsul);
    // 징크 마감(단열 위)
    s2RoofSlab(eFront, topEaveY, topRidgeY, zf, materials.roof);
    s2RoofSlab(eBack, topEaveY, topRidgeY, zf, materials.roof);
    label('지붕: 단열 260T + 리얼징크 · 박공 32° · 처마 앞뒤 1.0m·좌우 0.45m', s2W / 2, topRidgeY + 0.45, s2RidgeZ - 1.4, 'struct');
    // 눈막이(스노우가드) 가로바 — 양 슬로프 처마 근처 2줄(쌓인 눈이 한꺼번에 미끄러지지 않게)
    const onTop = (ez, t) => ({ z: ez + t * (s2RidgeZ - ez), y: topEaveY + t * (topRidgeY - topEaveY) });
    const snowGuard = (ez, t) => {
      const p = onTop(ez, t);
      box({ x: s2X0 - sideOver, z: p.z - 0.025, w: s2W + sideOver * 2, d: 0.05, y: p.y + 0.11, h: 0.05, mat: materials.snowGuard, cast: false });   // 가로 파이프바
      const n = 7;
      for (let i = 0; i <= n; i += 1) {
        const bx = s2X0 - sideOver + (s2W + sideOver * 2) * (i / n);
        box({ x: bx - 0.02, z: p.z - 0.02, w: 0.04, d: 0.04, y: p.y + 0.02, h: 0.11, mat: materials.snowGuard, cast: false });   // 브래킷
      }
    };
    for (const t of s2SnowGuardT) { snowGuard(eBack, t); snowGuard(eFront, t); }   // 뒤(남측)·앞(정면) 각 슬로프 s2SnowGuardT.length줄
  });
  // 태양광 3kW — 뒤쪽(남측) 슬로프, 모듈 8장(가로 4 × 세로 2, ≈400W). 지붕 폭 중앙 정렬
  captureInto(s2Solar3Objects, () => {
    const solarMat = new THREE.MeshLambertMaterial({ color: 0x16264a });
    const cosS = Math.cos(s2RoofPitch), sinS = Math.sin(s2RoofPitch);
    const surfaceY = (z) => topRidgeY - tan * (z - s2RidgeZ);   // 뒤 슬로프(z>용마루) 징크 윗면
    const { panelW, panelL, panelThk, gapX, gapZ, cols, rows } = s2Solar;
    const arrayW = cols * panelW + (cols - 1) * gapX;
    const arrayCenterX = s2W / 2;
    const startX = arrayCenterX - arrayW / 2 + panelW / 2;
    const rowStepZ = (panelL + gapZ) * cosS;
    const arrayCenterZ = 1.9;                  // 용마루(0.4)~뒤 벽(3.3) 사이
    const startZ = arrayCenterZ - ((rows - 1) / 2) * rowStepZ;
    const liftN = panelThk / 2 + 0.03;
    const panelGeo = new THREE.BoxGeometry(panelW, panelThk, panelL);
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const px = startX + c * (panelW + gapX), pz = startZ + r * rowStepZ, sy = surfaceY(pz);
        const panel = new THREE.Mesh(panelGeo, solarMat);
        panel.position.set(px, sy + liftN * cosS, pz + liftN * sinS);
        panel.rotation.x = s2RoofPitch; panel.castShadow = true; panel.receiveShadow = false;
        scene.add(panel);   // captureInto가 s2Solar3Objects로 자동 수집
        addGeometryEdges(panel, 0x9aa0a8);
      }
    }
    label('태양광 3kW (8장)', arrayCenterX, surfaceY(arrayCenterZ) + 0.55, arrayCenterZ, 'mep');
  });
}

// 데크 계단 — 안방 측면 출입문 앞에만(0.8m 폭). 주방 데크 앞·왼쪽 계단은 바닥틀 균등 3단 계단(계단틀)으로 대체(옛 디딤판 제거).
const _stairStart = scene.children.length;
// · 안방 측면 출입문 앞 계단(고-X 벽에서 +x, 상단=firstFloorY)
deckStairs({ axis: 'z', span0: sideDoorZ, span1: sideDoorZ + sideDoorW, edge: buildingW, outward: 1, topY: firstFloorY });
deckFloorObjects.push(...scene.children.slice(_stairStart));   // 계단 포세린 디딤판 — 데크 바닥 포세린과 동일하게 '데크 바닥' 토글에서 계단틀 위에 표시

// 데크 계단틀 — 앞쪽(−Z)·왼쪽(高X) 계단 + 부채꼴 코너를 '납작한 직사각형 테두리'로 표시. 지면~데크(deckSurfaceY)를 실사용 단높이(≈0.16m)로 등분해 단수 자동 산출. 윗면 포세린은 '데크' 토글(deckFloorObjects), 각관 틀·다리는 deckStairFrameObjects.
const DECK_STAIR_RISE = 0.16;   // 목표 단높이 — 데크 높이가 바뀌면 단수가 자동으로 따라옴(실사용 계단)
const deckStairNRise = Math.max(2, Math.round((deckSurfaceY - groundTopY) / DECK_STAIR_RISE));   // 지면~데크 등분 수(=오름 수)
const deckStairK = deckStairNRise - 1;                       // 중간 디딤단 수(맨 위 단 = 데크)
const deckStairStepRise = (deckSurfaceY - groundTopY) / deckStairNRise;   // 각 단높이
{
  const df = deckFootprints[0];                     // 데크 footprint(집 기초선 안으로 clamp된 폭) — 계단을 데크보다 크게 그리지 않도록 동일 좌표 사용
  const dXa = df.x, dXb = df.x + df.w, dZa = df.z, dZb = df.z + df.d;
  const tread = 0.3, t = 0.05;                      // 디딤 폭 / 각관 굵기(5×5cm, 구조 보이게) — 단높이·디딤폭은 이 값과 무관
  const run = tread;                                // 한단 크기 — 수평 깊이 한 디딤(0.3m)
  // 밟는 표면(포세린 윗면) 균등 단차 — 지면~데크(deckSurfaceY)를 목표 단높이(≈0.16m)로 등분해 단수 자동 산출(실사용 계단).
  const K = deckStairK, stepRise = deckStairStepRise;   // 중간 디딤단 수(데크가 맨 위 단) / 각 단높이
  const surfAt = (j) => groundTopY + j * stepRise;      // j단(1=최하) 밟는 표면(데크는 맨 위=nRise단)
  const flatRectFrame = (x0, x1, z0, z1, surfaceY) => {   // 밟는 표면 surfaceY에 맞춰 4변 틀 + 윗면 포세린 한 단
    const xw = x1 - x0, zw = z1 - z0;
    const baseY = surfaceY - deckFinishT - t;            // 틀 막대 바닥 = 표면에서 타일 2cm + 막대 t 만큼 아래
    deckStairFrameObjects.push(box({ x: x0, z: z0, w: xw, d: t, y: baseY, h: t, mat: materials.deckStairFrame, cast: false }));        // z0 변
    deckStairFrameObjects.push(box({ x: x0, z: z1 - t, w: xw, d: t, y: baseY, h: t, mat: materials.deckStairFrame, cast: false }));    // z1 변
    deckStairFrameObjects.push(box({ x: x0, z: z0, w: t, d: zw, y: baseY, h: t, mat: materials.deckStairFrame, cast: false }));        // x0 변
    deckStairFrameObjects.push(box({ x: x1 - t, z: z0, w: t, d: zw, y: baseY, h: t, mat: materials.deckStairFrame, cast: false }));    // x1 변
    deckFloorObjects.push(box({ x: x0, z: z0, w: xw, d: zw, y: surfaceY - deckFinishT, h: deckFinishT, mat: materials.porcelainDeck, cast: false }));   // 틀 윗면에 2cm 포세린타일(윗면 = surfaceY) — '데크 바닥' 토글
  };
  // 데크 윗면 포세린은 썬룸 함수의 데크 마감이 '바닥' 단계부터 이미 깔므로 여기선 안 얹음(이중 방지).
  const legW = 0.05;
  const leg = (x, z, surfaceY) => deckStairFrameObjects.push(box({ x, z, w: legW, d: legW, y: groundTopY, h: (surfaceY - deckFinishT - t) - groundTopY, mat: materials.deckStairFrame, cast: false }));
  const groundFrame = (x0, x1, z0, z1) => {   // 지면 외곽 사각틀(전체 단 아래)
    const xw = x1 - x0, zw = z1 - z0;
    deckStairFrameObjects.push(box({ x: x0, z: z0, w: xw, d: t, y: groundTopY, h: t, mat: materials.deckStairFrame, cast: false }));
    deckStairFrameObjects.push(box({ x: x0, z: z1 - t, w: xw, d: t, y: groundTopY, h: t, mat: materials.deckStairFrame, cast: false }));
    deckStairFrameObjects.push(box({ x: x0, z: z0, w: t, d: zw, y: groundTopY, h: t, mat: materials.deckStairFrame, cast: false }));
    deckStairFrameObjects.push(box({ x: x1 - t, z: z0, w: t, d: zw, y: groundTopY, h: t, mat: materials.deckStairFrame, cast: false }));
  };
  // 정면(−Z) 직선 계단 — K단 중첩(데크쪽 j=K, 바깥 j=1). 각 단 바깥 변 양끝 기둥, 맨 위 단은 데크쪽에도 양끝 기둥.
  groundFrame(dXa, dXb, dZa - K * run, dZa);
  for (let j = 1; j <= K; j += 1) {
    const z1 = dZa - (K - j) * run, z0 = z1 - run, s = surfAt(j);
    flatRectFrame(dXa, dXb, z0, z1, s);
    leg(dXa, z0, s); leg(dXb - legW, z0, s);                             // 바깥 변 좌·우 끝
    if (j === K) { leg(dXa, dZa - legW, s); leg(dXb - legW, dZa - legW, s); }   // 맨 위 단: 데크쪽 변 좌·우 끝
  }
  // 왼쪽(+X) 직선 계단 — 대칭(데크쪽 j=K, 바깥 j=1).
  groundFrame(dXb, dXb + K * run, dZa, dZb);
  for (let j = 1; j <= K; j += 1) {
    const x0 = dXb + (K - j) * run, x1 = x0 + run, s = surfAt(j);
    flatRectFrame(x0, x1, dZa, dZb, s);
    leg(x1 - legW, dZa, s); leg(x1 - legW, dZb - legW, s);               // 바깥 변 앞·뒤 끝
    if (j === K) { leg(dXb, dZa, s); leg(dXb, dZb - legW, s); }          // 맨 위 단: 데크쪽 변 앞·뒤 끝
  }
}
// 부채꼴 코너 계단 — 앞·왼쪽 직선 계단 사이를 부채꼴(사분원)로 연결. (1단계: 첫 계단=가장 낮은 단 발판 높이의 부채꼴 프레임만, 다리·디딤판 없음)
{
  const cdf = deckFootprints[0];                               // 데크 footprint 기준(직선 계단틀과 동일 좌표)
  const cx = cdf.x + cdf.w, cz = cdf.z;                        // 코너점(앞·왼쪽 만나는 곳)
  const topY = deckSurfaceY, baseY = groundTopY, tread = 0.3, bw = 0.05;   // 윗면=데크 밟는 표면(직선 계단틀과 동일), 각관 5×5cm
  const K = deckStairK, rise = deckStairStepRise;              // 중간 단수 / 단높이 — 직선 계단과 동일 자동 산출
  const surfAt = (j) => baseY + j * rise;                       // j단(1=최하) 밟는 표면
  const mat = materials.deckFanFrame;   // 부채꼴 연결부 색(직선 계단과 구분)
  const P = (r, a) => [cx + r * Math.cos(a), cz - r * Math.sin(a)];   // a: 0=+X(왼쪽 바깥), π/2=−Z(앞 바깥)
  const barXZ = (x0, z0, x1, z1, yTop) => {   // 두 XZ점을 잇는 수평 막대(윗면 yTop, 각관 bw)
    const dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz) + bw;
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, bw, bw), mat);
    m.position.set((x0 + x1) / 2, yTop - bw / 2, (z0 + z1) / 2);
    m.rotation.y = Math.atan2(-dz, dx);
    m.castShadow = false; m.receiveShadow = false; scene.add(m);
    deckStairFrameObjects.push(m);   // 외곽선 없이 색상만
  };
  // 부채꼴(피자조각) 테두리 한 단 — 중심(코너)에서 뻗는 곧은 변 2개 + 바깥 호. 코너 바깥 빈 사분면에만.
  // 치수는 '바깥선' 기준(중심선 아님): 곧은 변 바깥면 = 데크 모서리선(x=cx / z=cz), 호 바깥면 = 직선 계단 그 단의 바깥 반경. 막대는 모두 그 선 '안쪽'으로만 → 계단과 안 겹치고 밖으로도 안 튀어나옴.
  const arcEndXr = (rc) => cx + rc * Math.cos(Math.asin((bw / 2) / rc));   // 중심선 반경 rc 호의 +X쪽 끝 x(축 안쪽으로 들인 지점)
  const arcEndZr = (rc) => cz - rc * Math.cos(Math.asin((bw / 2) / rc));   // 중심선 반경 rc 호의 −Z쪽 끝 z
  const drawArcR = (rc, frameTopY) => {                         // 중심선 반경 rc 호(양 끝이 축 안쪽 z=cz-bw/2 / x=cx+bw/2에 닿게)
    const a = Math.asin((bw / 2) / rc), N = 8;
    for (let j = 0; j < N; j += 1) {
      const a0 = a + j * (Math.PI / 2 - 2 * a) / N, a1 = a + (j + 1) * (Math.PI / 2 - 2 * a) / N;
      barXZ(...P(rc, a0), ...P(rc, a1), frameTopY);
    }
  };
  // 부채꼴 한 단: 바깥 호는 바깥면이 Rout(중심선 Rout-bw/2). Rin=0이면 피자조각(꼭지점까지 곧은 변). Rin>0이면 띠 — 안쪽 호는 '안쪽면이 Rin'(중심선 Rin+bw/2) = 위 단 바깥선에서 프레임 두께만큼 바깥쪽 → 직선 계단 안쪽 변과 일치.
  const fan = (Rout, frameTopY, Rin = 0, withTile = false) => {
    const rco = Rout - bw / 2;                                  // 바깥 호 중심선(바깥면 = Rout)
    const ox = arcEndXr(rco), oz = arcEndZr(rco);
    let ix = cx, iz = cz, rci = 0;
    if (Rin > 0) { rci = Rin + bw / 2; ix = arcEndXr(rci); iz = arcEndZr(rci); }   // 안쪽 호 중심선(안쪽면 = Rin)
    deckStairFrameObjects.push(box({ x: ix, z: cz - bw, w: ox - ix, d: bw, y: frameTopY - bw, h: bw, mat, cast: false }));   // +X 곧은 변(바깥면 z=cz)
    deckStairFrameObjects.push(box({ x: cx, z: oz, w: bw, d: iz - oz, y: frameTopY - bw, h: bw, mat, cast: false }));        // −Z 곧은 변(바깥면 x=cx)
    drawArcR(rco, frameTopY);                                   // 바깥 호
    if (Rin > 0) drawArcR(rci, frameTopY);                      // 안쪽 호(위 단 바깥선 + 프레임 두께)
    if (withTile) {   // 바닥(포세린) 발판면 — 직선 계단 디딤 타일과 같은 포세린, 이 단의 부채꼴 채움. '바닥' 단계 표시.
      const tile = new THREE.Mesh(
        Rin > 0 ? new THREE.RingGeometry(Rin, Rout, 24, 1, 0, Math.PI / 2)   // 띠(안쪽 Rin ~ 바깥 Rout)
                : new THREE.CircleGeometry(Rout, 24, 0, Math.PI / 2),         // 피자조각(0 ~ Rout)
        materials.porcelainDeck);
      tile.rotation.x = -Math.PI / 2;                            // XY원판 → XZ 바닥면(+X~−Z 사분면), 윗면 위로
      tile.position.set(cx, frameTopY + deckFinishT, cz);        // 발판 윗면(프레임 위 + 타일 두께) = 직선 계단 디딤 표면과 동일
      tile.castShadow = false; tile.receiveShadow = true;
      scene.add(tile);
      deckFloorObjects.push(tile);
    }
  };
  fan(K * tread, baseY + bw);                                  // 계단 바닥(지면 베이스): 피자조각 부채꼴(바깥 반경 K·디딤), 지면 높이 — 타일 없음
  for (let j = 1; j <= K; j += 1) {                            // 각 단: 바깥 (K−j+1)·디딤 ~ 안쪽 (K−j)·디딤 '띠'(맨위 j=K는 피자조각) + 포세린
    const Rout = (K - j + 1) * tread, Rin = (K - j) * tread;
    fan(Rout, surfAt(j) - deckFinishT, Rin, true);
  }
  // 양끝 기둥 — 직선 계단처럼, 각 단 바깥 호 양 끝(+X쪽·−Z쪽)에서 지면까지 세로 기둥(부채꼴 색).
  const legW = bw;
  for (let j = 1; j <= K; j += 1) {
    const rco = (K - j + 1) * tread - bw / 2;
    const exEnd = arcEndXr(rco), ezEnd = arcEndZr(rco);        // 바깥 호 +X쪽·−Z쪽 끝
    const legTop = (surfAt(j) - deckFinishT) - bw;             // 그 단 프레임 막대 바닥 = 기둥 윗끝
    deckStairFrameObjects.push(box({ x: exEnd - legW / 2, z: (cz - bw / 2) - legW / 2, w: legW, d: legW, y: baseY, h: legTop - baseY, mat, cast: false }));   // +X쪽 끝 기둥(왼쪽 계단 옆)
    deckStairFrameObjects.push(box({ x: (cx + bw / 2) - legW / 2, z: ezEnd - legW / 2, w: legW, d: legW, y: baseY, h: legTop - baseY, mat, cast: false }));   // −Z쪽 끝 기둥(앞 계단 옆)
  }
}

// (마당 흰색 화분 2개 제거됨 — whitePlanter 호출 삭제)

// 썬룸 화목난로(캠핑용) — 측면 폴딩 "앞에서 3번째 짝"의 하부만 불연패널(연통홀), 상부는 기존 폴딩 유리 유지.
{
  const deckTop = groundTopY + deckFoundationH + deckFinishT;
  const fWallZ = buildingFrontZ;                          // -0.7 (집 벽쪽 끝)
  const roofRun = Math.sqrt(4.0 * 4.0 - 0.2 * 0.2);       // 썬룸 수평투영(폴딩 내부값과 동일 ≈3.995)
  const fFrontZ = (buildingFrontZ - roofRun) + 0.2;       // 폴딩 앞단(≈-4.50)
  const panelZ = (fWallZ - fFrontZ) / 6;                  // 측면 한 짝 폭(Z) ≈0.633
  const stZ = fFrontZ + 2.5 * panelZ;                    // 앞에서 3번째 짝 '중앙'
  const stX = 0.45;
  const splitH = 0.55;                                   // 분할선 높이(2등분 아님 — 연통 위로만)
  const flueY = deckTop + 0.30;                          // 연통 = 데크 바닥 + 30cm
  const _stoveStart = scene.children.length;
  // 착탈 카세트 — 하부 불연 패널 + 둘레 가스켓 프레임(빼고 끼우는 단위). 짝마다 독립 프레임 → 각각 따로 착탈.
  const drawCassette = (zc) => {
    const a = zc - panelZ / 2 + 0.012, d = panelZ - 0.024, b = a + d;
    box({ x: -0.05, z: a, w: 0.11, d: d, y: deckTop, h: splitH, mat: materials.soundWall });               // 카세트 패널 면(불연)
    box({ x: -0.07, z: a, w: 0.15, d: d, y: deckTop + splitH - 0.02, h: 0.04, mat: materials.entryFrame }); // 상부 프레임(분할선)
    box({ x: -0.09, z: a, w: 0.05, d: d, y: deckTop, h: 0.035, mat: materials.entryFrame });                // 하부 프레임
    box({ x: -0.09, z: a, w: 0.05, d: 0.035, y: deckTop, h: splitH, mat: materials.entryFrame });           // 앞측 세로 프레임
    box({ x: -0.09, z: b - 0.035, w: 0.05, d: 0.035, y: deckTop, h: splitH, mat: materials.entryFrame });   // 뒤측 세로 프레임(독립)
  };
  const z4 = fFrontZ + 3.5 * panelZ;     // 앞에서 4번째 짝 중앙
  drawCassette(stZ);                     // 3번째(현재 겨울=연통홀)
  drawCassette(z4);                      // 4번째(추가, 솔리드 — 연통 없음, 독립 착탈)
  box({ x: stX, z: stZ, w: 0.42, d: 0.42, y: deckTop, h: 0.5, mat: materials.openingEdge });                    // 화목난로
  box({ x: stX - 0.03, z: stZ - 0.24, w: 0.34, d: 0.02, y: deckTop + 0.12, h: 0.24, mat: materials.guard });    // 난로 도어
  const flueH = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 14), materials.guard);
  flueH.rotation.z = Math.PI / 2; flueH.position.set(0.1, flueY, stZ); flueH.castShadow = true; scene.add(flueH);
  // 연통 수직부 — 윗끝이 그 위치(z=stZ)의 썬룸 지붕면보다 1m 위로 오게 길이 산정.
  // 지붕면 높이는 썬룸 물매 파라미터(targetWallPostH 2.8 / targetFrontPostH 2.6 / beam)를 동일하게 재현.
  const _beamDrop = 0.04, _beamH = 0.12, _frameInset = 0.2, _slope = 4.0;
  const yAtWall = firstFloorY + 2.8 + _beamDrop + _beamH;
  const targetGlassAtFront = firstFloorY + 2.6 + _beamDrop + _beamH;
  let yAtFront = targetGlassAtFront;
  for (let i = 0; i < 40; i += 1) { const d = yAtWall - yAtFront; const run = Math.sqrt(_slope * _slope - d * d); yAtFront = targetGlassAtFront - _frameInset * d / run; }
  const roofFrontEdgeZ = buildingFrontZ - roofRun;
  const roofYatStZ = yAtWall + (yAtFront - yAtWall) * ((stZ - buildingFrontZ) / (roofFrontEdgeZ - buildingFrontZ));
  const flueBottom = flueY - 0.05;                         // 기존 하단(수평 연통 연결부)
  const flueTopTarget = roofYatStZ + 1.0;                  // 썬룸 지붕면 +1m
  const flueVLen = flueTopTarget - flueBottom;
  const flueV = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, flueVLen, 14), materials.guard);
  flueV.position.set(-0.22, (flueBottom + flueTopTarget) / 2, stZ); flueV.castShadow = true; scene.add(flueV);
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.16, 14), materials.openingEdge);
  hole.rotation.z = Math.PI / 2; hole.position.set(-0.02, flueY, stZ); scene.add(hole);
  label('화목난로 / 3번째 짝 하부 = 착탈 카세트 (겨울 연통홀 / 여름 솔리드 교체)', stX + 1.05, deckTop + 1.05, stZ, 'furniture');
  label('4번째 짝 하부 = 착탈 카세트 (솔리드 · 독립 착탈)', stX + 1.05, deckTop + 0.78, z4, 'furniture');
  썬룸Objects.push(...scene.children.slice(_stoveStart));
}

// 안방 썬룸 아래 자갈 마당에 웨버 켈틀 그릴(지름 50cm) — 소품 그룹(전체일 때만 표시)
const _grillStart = scene.children.length;
{
  const gx = 7.0;                          // 안방 썬룸 폭(5.6~8.5) 중앙
  const gz = -3.3;                         // 1m 데크 앞쪽 개방 자갈 구역(지붕 아래)
  const baseY = groundTopY;
  const R = 0.25;                          // 반지름(지름 50cm)
  const bowlCenterY = baseY + 0.7;         // 다리 위 보울(조리부) 중심
  const kettleMat = new THREE.MeshLambertMaterial({ color: 0x1c1c1e });   // 켈틀 블랙
  const lidMat = new THREE.MeshLambertMaterial({ color: 0x242428 });
  const metalMat = new THREE.MeshLambertMaterial({ color: 0x3a3d42 });
  const grateMat = new THREE.MeshLambertMaterial({ color: 0x9a9da1 });

  // 보울(하반구) + 조리 그레이트
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(R, 28, 18, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), kettleMat);
  bowl.position.set(gx, bowlCenterY, gz); bowl.castShadow = true; scene.add(bowl);
  const grate = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.9, R * 0.9, 0.012, 28), grateMat);
  grate.position.set(gx, bowlCenterY + 0.005, gz); scene.add(grate);
  // 뚜껑(상반구)
  const lid = new THREE.Mesh(new THREE.SphereGeometry(R * 1.02, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2), lidMat);
  lid.position.set(gx, bowlCenterY + 0.02, gz); lid.castShadow = true; scene.add(lid);
  const lidTopY = bowlCenterY + 0.02 + R * 1.02;
  // 상단 공기구멍 캡 + 손잡이(가로 바 + 지지대 2개)
  const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12), metalMat);
  vent.position.set(gx, lidTopY - 0.01, gz); scene.add(vent);
  const hbar = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.15, 12), metalMat);
  hbar.rotation.z = Math.PI / 2; hbar.position.set(gx, lidTopY + 0.05, gz); scene.add(hbar);
  for (const dx of [-0.055, 0.055]) {
    const hp = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.05, 8), metalMat);
    hp.position.set(gx + dx, lidTopY + 0.025, gz); scene.add(hp);
  }
  // 삼각대 다리 3개(보울 하부 → 지면으로 벌어짐) + 뒤쪽 바퀴 2개
  const up = new THREE.Vector3(0, 1, 0);
  const legTopY = bowlCenterY - R * 0.8;
  for (let i = 0; i < 3; i += 1) {
    const ang = (i / 3) * Math.PI * 2 + Math.PI / 6;
    const p0 = new THREE.Vector3(gx + Math.cos(ang) * R * 0.3, legTopY, gz + Math.sin(ang) * R * 0.3);
    const p1 = new THREE.Vector3(gx + Math.cos(ang) * R * 1.7, baseY, gz + Math.sin(ang) * R * 1.7);
    const dir = new THREE.Vector3().subVectors(p1, p0);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, dir.length(), 8), metalMat);
    leg.position.copy(p0).addScaledVector(dir, 0.5);
    leg.quaternion.setFromUnitVectors(up, dir.clone().normalize());
    leg.castShadow = true; scene.add(leg);
    if (i >= 1) {  // 뒤쪽 두 다리 밑 바퀴
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 16), kettleMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(p1.x, baseY + 0.07, p1.z);
      wheel.castShadow = true; scene.add(wheel);
    }
  }
  label('웨버 그릴 Ø50cm', gx, lidTopY + 0.4, gz, 'furniture');
}
extrasObjects.push(...scene.children.slice(_grillStart));

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ ▲▲▲  S2 영역 끝  ▲▲▲   (아래부터는 s1(1층+다락)·공유 부재 — s2 아님)             ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
const _firstFixturesStart = scene.children.length;   // 외부 콘센트·부동수전·실내 계단 → 1층 그룹

// 주방 시스템도어 양옆 전면 외벽에 외부(방수) 콘센트 2개
{
  const kitchenSashEndX = kitchenYardSashX + yardSashW;   // 주방 도어 높은 X쪽 끝(2.825)
  const wallFaceZ = buildingFrontZ;                      // 전면 외벽 바깥면
  const outletY = firstFloorY + 0.32;
  const extOutlet = (ox) => {
    box({ x: ox - 0.065, z: wallFaceZ - 0.035, w: 0.13, d: 0.035, y: outletY, h: 0.15, mat: materials.counter });      // 커버 플레이트
    box({ x: ox - 0.045, z: wallFaceZ - 0.05, w: 0.09, d: 0.02, y: outletY + 0.03, h: 0.09, mat: materials.entryFrame }); // 소켓 면
  };
  extOutlet(kitchenYardSashX - 0.2);    // 도어 좌측(코너쪽)
  extOutlet(kitchenSashEndX + 0.2);     // 도어 우측(현관쪽)
}

// 안방 왼쪽(도로측, 높은 X) 외벽에 외부 부동수전(동파방지 벽붙이형)
{
  const faucetX = buildingW;             // 외벽 바깥면(x=8.5)
  const faucetZ = 1.1;                    // 측면 출입문(z −0.3~0.5)에서 충분히 떨어진 솔리드 벽
  const brass = materials.handle;         // 황동색
  const bodyX = faucetX + 0.06;           // 벽에서 약간 떨어진 수직 몸체 중심
  const spoutY = 0.42;                    // 하단 토수구
  const topY = 0.82;                      // 상단 유입부/핸들(긴 부동 몸체)
  const cyl = (rTop, rBot, len, x, y, z, rotAxis, rot) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, len, 12), brass);
    m.position.set(x, y, z);
    if (rotAxis === 'x') m.rotation.x = rot;
    if (rotAxis === 'z') m.rotation.z = rot;
    m.castShadow = true;
    m.receiveShadow = false;
    scene.add(m);
    return m;
  };
  // 벽 유입부 플랜지 + 수평 엘보(부동수전 밸브는 벽 안쪽 깊이 위치)
  box({ x: faucetX, z: faucetZ - 0.06, w: 0.03, d: 0.12, y: topY - 0.06, h: 0.12, mat: brass });
  cyl(0.02, 0.02, 0.08, faucetX + 0.03, topY, faucetZ, 'z', Math.PI / 2);
  // 긴 수직 부동 몸체
  cyl(0.025, 0.025, topY - spoutY, bodyX, (topY + spoutY) / 2, faucetZ, null, 0);
  // 상단 레버 핸들(가로 T)
  cyl(0.018, 0.018, 0.04, bodyX, topY + 0.03, faucetZ, null, 0);
  cyl(0.016, 0.016, 0.24, bodyX, topY + 0.05, faucetZ, 'x', Math.PI / 2);
  // 하단 토수구(앞 아래) + 호스 연결구
  cyl(0.02, 0.018, 0.12, bodyX, spoutY - 0.03, faucetZ + 0.025, 'x', 0.32);
  cyl(0.023, 0.023, 0.035, bodyX, spoutY - 0.11, faucetZ + 0.06, 'x', 0.32);
  label('외부 부동수전', faucetX + 0.5, topY + 0.85, faucetZ - 0.25, 'mep'); // 수전이 가려지지 않게 위쪽·옆으로
}

// 계단실 양쪽 내벽은 1층 원래 내벽(stairWallObjects) 1벌을 계단 화면과 공유 — 여기서 따로 그리지 않음(중복 제거).

firstFloorObjects.push(...scene.children.slice(_firstFixturesStart));   // 외부설비를 1층 그룹에 추가(계단 본체·계단실 벽은 stairCoreObjects·stairWallObjects로 공유 표시)

function ceilingFan({ x, z, ceilingY, bladeCount = 5, bladeLength = 0.62, drop = 0.3 }) {
  const dropY = ceilingY - drop;
  // 천장 마운트
  const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.05, 16), materials.guard);
  mount.position.set(x, ceilingY - 0.025, z);
  mount.castShadow = true;
  mount.receiveShadow = false;
  scene.add(mount);
  // 다운로드(봉)
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, drop, 12), materials.guard);
  rod.position.set(x, ceilingY - drop / 2, z);
  rod.castShadow = true;
  rod.receiveShadow = false;
  scene.add(rod);
  // 모터 허브
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.12, 20), materials.guard);
  hub.position.set(x, dropY, z);
  hub.castShadow = true;
  hub.receiveShadow = false;
  scene.add(hub);
  // 날개
  const bladeY = dropY + 0.015;
  const bladeGeo = new THREE.BoxGeometry(bladeLength, 0.012, 0.16);
  for (let i = 0; i < bladeCount; i += 1) {
    const angle = (i / bladeCount) * Math.PI * 2;
    const reach = bladeLength / 2 + 0.1;
    const blade = new THREE.Mesh(bladeGeo, materials.interiorDoor);
    blade.position.set(x + Math.cos(angle) * reach, bladeY, z + Math.sin(angle) * reach);
    blade.rotation.y = -angle;
    blade.castShadow = true;
    blade.receiveShadow = false;
    scene.add(blade);
  }
}

// 천장 직부등 — 하우징 + 발광 렌즈(썬룸 조명과 동일 규격). 천장면에 바로 부착.
function ceilingLight({ x, z, ceilingY }) {
  const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.05, 16), materials.guard);
  housing.position.set(x, ceilingY - 0.025, z);
  housing.castShadow = false;
  housing.receiveShadow = false;
  scene.add(housing);
  const lensMat = new THREE.MeshLambertMaterial({ color: 0xfff4cf, emissive: 0xffe39c, emissiveIntensity: 0.9 });
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.035, 16), lensMat);
  lens.position.set(x, ceilingY - 0.06, z);
  lens.castShadow = false;
  lens.receiveShadow = false;
  scene.add(lens);
}

// 벽면 간접조명(코브) — 벽 상단 천장 살짝 아래에 붙는 발광 띠. 천장·벽을 은은히 비춤(직부등 대체).
function coveLight({ x, z, len, axis = 'z', ceilingY }) {
  const mat = new THREE.MeshLambertMaterial({ color: 0xfff4e8, emissive: 0xffe9ce, emissiveIntensity: 0.9 });
  const w = 0.05, h = 0.05;
  const geo = axis === 'z' ? new THREE.BoxGeometry(w, h, len) : new THREE.BoxGeometry(len, h, w);
  const strip = new THREE.Mesh(geo, mat);
  strip.position.set(x, ceilingY - 0.09, z);
  strip.castShadow = false;
  strip.receiveShadow = false;
  scene.add(strip);
}

const _firstFanStart = scene.children.length;
ceilingFan({ x: firstKitchenX + firstKitchenW / 2, z: insideZ0 + firstKitchenD / 2, ceilingY: firstCeilingY });
ceilingFan({ x: firstFamilyX + firstFamilyW / 2, z: insideZ0 + firstFamilyD / 2, ceilingY: firstCeilingY });
firstFloorObjects.push(...scene.children.slice(_firstFanStart));   // 1층 주방·안방 실링팬을 1층 그룹에 추가

const atticRidgeY = atticSecondWallTop + gableRise;
// (다락 계단실 상부 실링팬 삭제)

// 뒤쪽(남측) 지붕에 태양광 3kW — 실물 모듈 8장(2열×4, 1.66×1.0m 가로형 ≈400W), 지붕 폭 중앙 정렬
{
  const solarMat = new THREE.MeshLambertMaterial({ color: 0x16264a });
  const roofSlopeRad = THREE.MathUtils.degToRad(roofSlopeDeg);
  const cosS = Math.cos(roofSlopeRad);
  const sinS = Math.sin(roofSlopeRad);
  const surfaceY = (z) => atticRidgeY - roofSlopeTan * (z - atticRidgeZ);
  const panelW = 1.66;   // X 폭(실물 모듈 가로)
  const panelL = 1.0;    // 경사 방향 길이
  const panelThk = 0.05;
  const gapX = 0.04;
  const gapZ = 0.04;
  const cols = 4;
  const rows = 2;        // 4 x 2 = 8장 × 약 400W ≈ 3.2kW
  const arrayW = cols * panelW + (cols - 1) * gapX;
  const arrayCenterX = buildingW / 2;   // 지붕 폭 중앙
  const startX = arrayCenterX - arrayW / 2 + panelW / 2;
  const rowStepZ = (panelL + gapZ) * cosS;
  const arrayCenterZ = 2.25;            // 용마루 아래~뒤 벽선 사이
  const startZ = arrayCenterZ - ((rows - 1) / 2) * rowStepZ;
  const liftN = panelThk / 2 + 0.03;
  const panelGeo = new THREE.BoxGeometry(panelW, panelThk, panelL);
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const px = startX + c * (panelW + gapX);
      const pz = startZ + r * rowStepZ;
      const sy = surfaceY(pz);
      const panel = new THREE.Mesh(panelGeo, solarMat);
      panel.position.set(px, sy + liftN * cosS, pz + liftN * sinS);
      panel.rotation.x = roofSlopeRad;
      panel.castShadow = true;
      panel.receiveShadow = false;
      scene.add(panel);
      solarObjects.push(panel);
      solarObjects.push(addGeometryEdges(panel, 0x9aa0a8));
    }
  }
  solarObjects.push(label('태양광 3kW (8장)', arrayCenterX, surfaceY(arrayCenterZ) + 0.55, arrayCenterZ, 'mep'));
}

// 전기 콘센트 위치 표시 — 벽면에 흰 플레이트 + 콘센트 구멍(어두운 사각)을 붙인다.
//  axis: 벽의 법선 축('x'|'z'), sign: 실내 방향(+1|-1), y: 콘센트 중심 높이, gang: 구 수.
const outletPlateMat = new THREE.MeshLambertMaterial({ color: 0xf4f1e8 });
const outletSlotMat = new THREE.MeshLambertMaterial({ color: 0x2f3338 });

function outletMarker({ x, z, y, axis = 'z', sign = 1, gang = 2, note = null, collector = outletObjects }) {
  const plateW = 0.13;   // 벽면 따라 폭
  const plateH = 0.13;   // 높이
  const proud = 0.02;    // 벽에서 돌출
  const slot = 0.035;    // 구멍 한 변
  const slotT = 0.006;   // 구멍 두께(플레이트보다 살짝 더 돌출)
  const before = scene.children.length;
  if (axis === 'z') {
    box({ x: x - plateW / 2, z: sign > 0 ? z : z - proud, w: plateW, d: proud, y: y - plateH / 2, h: plateH, mat: outletPlateMat, cast: false, receive: false });
    const zs = sign > 0 ? z + proud : z - proud - slotT;
    for (let i = 0; i < gang; i += 1) {
      const off = (i - (gang - 1) / 2) * 0.05;
      box({ x: x + off - slot / 2, z: zs, w: slot, d: slotT, y: y - slot / 2, h: slot, mat: outletSlotMat, cast: false, receive: false });
    }
  } else {
    box({ x: sign > 0 ? x : x - proud, z: z - plateW / 2, w: proud, d: plateW, y: y - plateH / 2, h: plateH, mat: outletPlateMat, cast: false, receive: false });
    const xs = sign > 0 ? x + proud : x - proud - slotT;
    for (let i = 0; i < gang; i += 1) {
      const off = (i - (gang - 1) / 2) * 0.05;
      box({ x: xs, z: z + off - slot / 2, w: slotT, d: slot, y: y - slot / 2, h: slot, mat: outletSlotMat, cast: false, receive: false });
    }
  }
  if (note) {                          // 용도 라벨(실내 방향으로 살짝 띄움)
    const lx = axis === 'x' ? x + sign * 0.28 : x;
    const lz = axis === 'z' ? z + sign * 0.28 : z;
    label(note, lx, y + 0.3, lz, 'mep');
  }
  collector.push(...scene.children.slice(before));
}


// 1층 — 주방+주방
outletMarker({ x: 0.95, z: insideZ1, y: outletCounterY, axis: 'z', sign: -1 });   // 싱크대 상부
outletMarker({ x: 1.75, z: insideZ1, y: outletCounterY, axis: 'z', sign: -1 });
outletMarker({ x: insideX0, z: -0.1, y: outletLowY, axis: 'x', sign: 1 });        // 주방 좌측 외벽
outletMarker({ x: insideX0, z: 2.55, y: outletLowY, axis: 'x', sign: 1 });
outletMarker({ x: 2.7, z: insideZ0, y: outletLowY, axis: 'z', sign: 1 });         // 주방 전면벽
// 1층 — 안방
outletMarker({ x: insideX1, z: -0.1, y: outletLowY, axis: 'x', sign: -1 });       // 도로측 외벽
outletMarker({ x: insideX1, z: 2.6, y: outletLowY, axis: 'x', sign: -1 });
outletMarker({ x: 5.6, z: insideZ1, y: outletLowY, axis: 'z', sign: -1 });        // 안방 후면벽
outletMarker({ x: firstFamilyX, z: 1.6, y: outletLowY, axis: 'x', sign: 1 });  // 안방 내벽(안방쪽 벽면)
// 1층 — 계단하부 WC(세면대 옆, 방수형)
outletMarker({ x: stairHighXWallX, z: stairBathZ + 0.35, y: firstFloorY + 1.05, axis: 'x', sign: -1, gang: 1 });

// 1층 — 전동커튼용 콘센트(각 창 상부 측면, 모터 전원)
outletMarker({ x: kitchenYardSashX - 0.12, z: insideZ0, y: curtainOutletY, axis: 'z', sign: 1, gang: 1, note: '전동커튼' });   // 주방 전면 출입창
outletMarker({ x: familyWindowX - 0.12, z: insideZ0, y: curtainOutletY, axis: 'z', sign: 1, gang: 1 });                    // 안방 전면 창문
outletMarker({ x: kitchenRearWindowX - 0.12, z: insideZ1, y: curtainOutletY, axis: 'z', sign: -1, gang: 1 });                 // 주방 후면창
outletMarker({ x: familyRearWindowX - 0.12, z: insideZ1, y: curtainOutletY, axis: 'z', sign: -1, gang: 1 });                 // 안방 후면창

// 1층 — 벽걸이 에어컨용 콘센트(주방 좌측 외벽 상부). 송풍을 +X로 보내 계단실 앞을 지나 안방까지.
outletMarker({ x: insideX0, z: insideZ0 + 0.55, y: firstFloorY + 1.95, axis: 'x', sign: 1, note: '벽걸이 에어컨\n(안방 송풍)' });

// 1층 — 냉장고용 콘센트(싱크대 옆 남는 공간, 후면벽 코너). 싱크대 끝(x≈2.4)~계단벽(x≈3.1) 사이.
outletMarker({ x: 2.97, z: insideZ1, y: firstFloorY + 1.7, axis: 'z', sign: -1, note: '냉장고' });

// 다락 — 다락방1·다락방2·복도(다락 표시 시에만 보임)
outletMarker({ x: 1.0, z: insideZ1, y: atticOutletY, axis: 'z', sign: -1, collector: atticOutletObjects });            // 다락방1 후면
outletMarker({ x: insideX0, z: secondAtticZ + 0.4, y: atticOutletY, axis: 'x', sign: 1, collector: atticOutletObjects });
outletMarker({ x: 7.3, z: insideZ1, y: atticOutletY, axis: 'z', sign: -1, collector: atticOutletObjects });           // 다락방2 후면
outletMarker({ x: insideX1, z: secondAtticZ + 0.4, y: atticOutletY, axis: 'x', sign: -1, collector: atticOutletObjects });
outletMarker({ x: stairLowXRunX + 0.3, z: insideZ0, y: atticOutletY, axis: 'z', sign: 1, collector: atticOutletObjects });  // 복도 전면

// 보이는 구조물을 화면(버튼 영역 제외 캔버스) 중앙에 꽉 차게 프레이밍한다.
// pos는 '보는 방향'으로만 쓰고 거리는 자동 계산하며, 줌 중심(target)을 경계구 중심에
// 둬서 확대해도 위/아래가 고르게 보이도록 한다.
const _fitBox = new THREE.Box3();
const _fitSphere = new THREE.Sphere();
const _fitDir = new THREE.Vector3();
function setView(pos) {
  scene.updateMatrixWorld(true);
  _fitBox.makeEmpty();
  scene.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    if (o.name === 'ground') return;                                 // 부지·자갈·도로 평면은 프레이밍에서 제외
    for (let p = o.parent; p; p = p.parent) if (!p.visible) return;  // 조상이 숨겨진 객체 제외
    _fitBox.expandByObject(o);
  });
  if (_fitBox.isEmpty()) return;
  _fitBox.getBoundingSphere(_fitSphere);
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const fitH = _fitSphere.radius / Math.sin(fov / 2);                 // 세로 기준 맞춤 거리
  const hfov = 2 * Math.atan(Math.tan(fov / 2) * camera.aspect);
  const fitW = _fitSphere.radius / Math.sin(hfov / 2);               // 가로 기준 맞춤 거리
  const dist = 1.06 * Math.max(fitH, fitW);
  _fitDir.set(pos[0], pos[1], pos[2]).sub(_fitSphere.center).normalize();
  camera.up.set(0, 1, 0);
  camera.position.copy(_fitSphere.center).addScaledVector(_fitDir, dist);
  controls.target.copy(_fitSphere.center);
  controls.update();
}

// 가시성 상태
//  · building: '기초' / '+1층' / '+다락' / '+지붕' 중 하나만 선택되는 건물 누적 뷰(집만 제어)
//    - 기초만(foundation)은 기초 슬래브만, +1층(first)부터 1층 골조·실내가 얹힘
//  · deckOn / 썬룸On / wallOn / accessoryOn: 데크·썬룸·외벽·악세사리 독립 on/off 토글
//    - 썬룸는 데크가 켜진 경우에만 가능(썬룸는 데크 위에 얹힘)
//    - 외벽(다누몰 자바라, 시공 업체 별도)은 썬룸가 켜진 경우에만 가능(외벽은 썬룸에 매달림)
//    - 악세사리(화분·의자·테이블·그릴)는 완전 독립 토글
// building 시공 누적 단계: plan(배치도) → foundation(기초) → floorFrame(바닥틀) → floor(바닥재) → first(1층) → second(다락) → all(지붕)
// ── 부품 가시성(레이어 패널 방식) ───────────────────────────────────────────────
// 각 부품을 독립 체크박스 토글로 보이기/숨기기(완전 독립 — 누적 없음). 단일 출처 PARTS·CHECKS
// 테이블이 [객체배열 ↔ 상태 ↔ 체크박스]를 일괄 구동. 배치도·전체모델은 여러 부품을 한 번에
// 세팅하는 프리셋 뷰 버튼(부감/전체).
const view = {
  // 기초 그룹
  plan: false,        // 배치도(부감) — 대지·도로·담장·말뚝·평면치수
  matFoundationHouse: false, // 부분 매트기초(집만 50cm)
  matFoundationFull: false,  // 전체 매트기초(집+데크 50cm)
  // 집 그룹(내부구조 부품별)
  firstFloorFinish: false, // 집 1층 바닥재
  stair: false,       // ㄷ자 계단 본체
  extWall: false,     // 외벽(1층+다락 합침)
  firstRoom: false,   // 1층 골조·실내
  bath: false,        // 화장실
  interior: false,    // 1층 실내 가구(안방 침대·주방 싱크대)
  loft: false,        // 실제 다락 바닥(슬래브·방)
  atticInnerWall: false, // 다락 내벽
  roof: false,        // 지붕
  solar: false,       // 태양광(지붕에서 분리)
  outlet: false,      // 콘센트(1층+다락)
  // 썬룸 그룹
  deck: false, sun: false, sunWall: false, folding: false, accessory: false,
  // 참고(임시)
  hedge: false, fence: false,
  // 2층·다락 탭(s2)
  s2Foundation: false,   // s2 집 기초(온통 0.5m 슬래브 8×6)
  s2Wall1: false,        // s2 1층 외벽 — '1층' 그룹 '외벽' 버튼
  s2Wall2: false,        // s2 2층 외벽 — '2층' 그룹 '외벽' 버튼
  s2Wall3: false,        // s2 3층 외벽(박공 포함) — '3층' 그룹 '외벽' 버튼
  s2Ecu3: false,         // s2 3층 실외기(방열/배기 루버 그릴 + 벽 안쪽 실외기실) — '3층' 그룹 '실외기' 버튼
  s2Stair: false,        // 계단 버튼 — 1·2·3층 계단 전체(하부런+계단참+상부런) 한 토글, '전체' 그룹
  s2Floor1: false,       // s2 1층 바닥('1층' 버튼)
  s2Floor2: false,       // s2 2층 바닥('2층' 버튼)
  s2Floor3: false,       // s2 3층 바닥('3층' 버튼)
  s2Lift: false,         // s2 홈리프트 전체 샤프트 — '전체' 그룹 '홈리프트' 버튼(독립)
  s2Roof3: false,        // s2 지붕(징크 박공·처마·눈막이) — '3층' 그룹 '지붕' 버튼
  s2Solar3: false,       // s2 뒤 지붕 태양광 3kW — '3층' 그룹 '태양광' 버튼
  s2Furniture: false,    // s2 1층 가구(식탁·의자)
  s2Sink: false,         // s2 1층 싱크대(주방)
  s2Stove: false,        // s2 1층 화목난로(오른쪽 붉은 예약 구획) — '난로' 버튼
  s2Fan1: false,         // s2 1층 천장 실링팬 2개 — '실링팬' 버튼
  s2Fan2: false,         // s2 2층 방 천장 실링팬 2개 — '실링팬' 버튼
};

// 부품 → 객체배열 매핑(단일 출처). 배치도(부감)에선 모든 입체 부품을 숨김.
const PARTS = [
  { key: 'matFoundationHouse', arrays: [matFoundationHouseObjects] },
  { key: 'matFoundationFull', arrays: [matFoundationFullObjects] },
  { key: 'firstFloorFinish', arrays: [firstFloorFinishObjects, firstDimObjects, stairObjects] },   // 바닥 + 방 안목치수 + 방·치수 도면(색상으로 구분해 바닥에 합침)
  { key: 'stair',      arrays: [stairCoreObjects, kitchenInnerWallObjects, familyInnerWallObjects] },   // 주방측 벽·안방 내력벽을 계단 토글에 합침
  { key: 'extWall',    arrays: [firstWallObjects, atticExtWallObjects] },   // 1층 외벽+다락 외벽을 하나의 '외벽'으로 합침
  { key: 'firstRoom',  arrays: [firstFloorObjects] },
  { key: 'bath',       arrays: [bathObjects] },
  { key: 'interior',   arrays: [interiorObjects] },   // 1층 실내 가구(안방 침대·주방 싱크대)
  { key: 'loft',       arrays: [secondFloorObjects] },        // 실제 다락 바닥(슬래브·방)
  { key: 'atticInnerWall', arrays: [atticInnerWallObjects] }, // 다락 내벽(칸막이·문·입구벽)
  { key: 'roof',       arrays: [roofObjects] },
  { key: 'solar',      arrays: [solarObjects] },              // 지붕에서 분리한 태양광
  { key: 'outlet',     arrays: [outletObjects, atticOutletObjects] },
  { key: 'deck',       arrays: [deckObjects, deckFloorObjects, deckStairFrameObjects] },   // 데크바닥·데크계단틀을 '데크' 하나로 합침
  { key: 'sun',        arrays: [썬룸Objects, 썬룸FrameObjects] },
  { key: 'sunWall',    arrays: [wallObjects] },
  { key: 'folding',    arrays: [foldingObjects] },
  { key: 'accessory',  arrays: [extrasObjects] },
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
  ['bDeck', 'deck'],
  ['bSun', 'sun'], ['bFolding', 'folding'], ['bAccessory', 'accessory'],   // 포치 '외벽'(sunWall)은 자바라 외벽 제거로 버튼도 삭제
  ['bLoft', 'loft'], ['bAtticInnerWall', 'atticInnerWall'], ['bRoof', 'roof'], ['bSolar', 'solar'],
  ['bExtWall', 'extWall'], ['bFirstRoom', 'firstRoom'], ['bOutlet', 'outlet'],
  ['bFirstFloorFinish', 'firstFloorFinish'], ['bS1Stair', 'stair'], ['bBath', 'bath'], ['bInterior', 'interior'],
  ['bMatHouse', 'matFoundationHouse'], ['bMatFull', 'matFoundationFull'],
];
// 상호배타 그룹 — 기초 3종 중 하나만 켜짐(셋 중 택1).
const FOUNDATION_GROUP = ['matFoundationHouse', 'matFoundationFull'];

function applyVisibility() {
  const isPlan = view.plan;
  // 집 높이: 선택된 기초 윗면에 1층 바닥이 앉도록 집 전체(houseGroup)를 Y로 이동.
  // 말뚝기초=기준(오프셋 0), 매트기초(부분/전체)=매트 윗면−말뚝 윗면 만큼 위로. 기초 높이를 바꾸면 자동 반영(하드코딩 없음).
  const activeFoundationTopY = (view.matFoundationHouse || view.matFoundationFull) ? (groundTopY + MAT_H) : foundationTopY;
  houseGroup.position.y = activeFoundationTopY - foundationTopY;
  // 항상 표시(공통 — 모든 탭 공유): 바탕 대지·도로 + 담장 발자국(색상은 늘 바탕에)
  for (const item of siteBaseObjects) item.visible = true;
  // 집·데크 발자국 = 현재 탭(설계안) 것만 — 2층 탭에선 숨겨 집 배치도 분리
  for (const item of footprintObjects) item.visible = (currentScheme === 's1');
  // 배치도(부감) 전용: 말뚝 마커·평면 치수
  for (const item of planObjects) item.visible = false;   // 말뚝 위치 마커 — 배치도에서 숨김(집·썬룸 배치만 표시)
  const planDimOn = isPlan || view.matFoundationHouse || view.matFoundationFull || view.s2Foundation;   // 배치도 + 매트기초(s1) + s2 기초 — 공통 치수·기준선 노출 조건
  // s2 탭 바닥 기준층 — 시작 배치도의 발자국·치수는 어떤 토글(기초·측백담장·옆집담장 포함)에도 사라지지 않고 항상 그대로 유지.
  const s2Ground = (currentScheme === 's2');
  // 집·데크 크기 치수 = 현재 탭 것만(2층 탭에선 숨김)
  for (const item of dimObjects) item.visible = (currentScheme === 's1') && planDimOn;
  for (const item of planOnlyDimObjects) item.visible = isPlan;   // 평면 전용 치수 — 배치도 전용(dimObjects 게이팅을 덮음)
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
  // 미사용 배열(삭제된 골조 토글 · 구 통합 계단벽[분리됨])
  for (const item of stairWallObjects) item.visible = false;
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
  updateNotes();
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
  setActive('bStair', view.s2Stair); setActive('bAllWall', view.s2Wall1 && view.s2Wall2 && view.s2Wall3); setActive('bLift', view.s2Lift);
  for (const [id, key] of S1_TOGGLES) setActive(id, view[key]);   // s1 부품 버튼 active 동기화
}

// 우측 설계 메모 — 모듈별 추가 설명. 현재 보이는 모듈에 해당하는 메모만 메뉴 순서로 표시.
const NOTES = {
  roof: { title: '지붕', body: '- 박공 지붕 경사는 32도로 최대한 맞춰 설계 적용한다.\n  (태양광 설치: 28~34도가 최적 경사대)' },
  get stair() {                                            // s1 계단 사양 — ㄷ자(돌음 회전·평참 없음) 계단. 모두 계단 상수(stairParams·stairGeom)서 자동 계산
    const g = stairGeom(stairParams);
    const { W, R, T, N, fy, nWind, nLand, nL, nU, loftY, treadH, nosing, turnD } = g;
    const floorH = loftY - fy;                             // 1층 층고(= 다락 바닥 높이)
    const mm = (v) => Math.round(v * 1000);                // m → mm 정수(메모 표기용)
    return { title: '계단', body: [
      '［계단］ ㄷ자 · 돌음 회전(평참 없음) · 뒤벽 턴',
      `· 단높이      ${mm(R)} mm`,
      `· 디딤 깊이    ${mm(T)} mm`,
      `· 디딤판      ${mm(T + nosing)} × ${mm(W)} mm  (계단코 포함, 두께 ${mm(treadH)})`,
      `· 계단코      ${mm(nosing)} mm`,
      `· 런 폭       ${mm(W)} mm`,
      `· 런 사이 틈   ${mm(stairHighXRunX - stairLowXRunX - W)} mm`,   // 실제 틈 = 양쪽 벽에 붙은 두 런 사이 남는 폭(벽 두께차로 stairGap과 다름)
      `· 1층→다락    ${mm(floorH)} mm / ${N}단`,
      '',
      '［단 구성］ 아래→위',
      `· 하부 곧은계단   ${nL}단`,
      `· 하부 돌음(90°)  ${nWind}단`,
      `· 상부 돌음(90°)  ${nLand}단`,
      `· 상부 곧은계단   ${nU}단`,
      '· 다락 진입      1단',
      '',
      '［턴존(돌음 회전)］',
      `· 크기  ${mm(W)} × ${mm(turnD)} mm  (런 폭 × 턴존 깊이)`,
    ].join('\n') };
  },
  get s2Roof3() {
    const deg = Math.round(s2RoofPitch * 180 / Math.PI);
    return { title: '지붕 (징크 박공)', body: [
      `- 마감: 리얼징크(티타늄아연). 지붕 두께 ${Math.round(roofThickness * 1000)} mm(단열 + 징크).`,
      `- 경사 ${deg}° 박공, 용마루는 너비(X) 방향.`,
      `- 처마: 앞·뒤 ${fmtDim(s2RoofEaveOver)} m, 좌·우 ${fmtDim(s2RoofSideOver)} m 내밈.`,
      `- 눈막이(스노우가드): 양 슬로프 처마 근처 가로바 ${s2SnowGuardT.length}줄 — 쌓인 눈이 한꺼번에 미끄러지지 않게.`,
    ].join('\n') };
  },
  get s2Solar3() {
    const deg = Math.round(s2RoofPitch * 180 / Math.PI);
    const n = s2Solar.cols * s2Solar.rows, kw = n * s2Solar.wattEach / 1000;
    return { title: `태양광 ${fmtDim(kw)} kW`, body: [
      `- 뒤쪽(남측) 지붕 슬로프에 설치. 모듈 ${n}장(가로 ${s2Solar.cols} × 세로 ${s2Solar.rows}, 약 ${s2Solar.wattEach} W) ≈ ${fmtDim(kw)} kW.`,
      `- 한전 상계(역송) 연계. 박공 ${deg}°는 태양광 최적 경사대(28~34°) 안.`,
    ].join('\n') };
  },
  get s2Wall3() {                                          // 박공 외벽 envelope — 높이·각도(기초 상단 기준, 단일 출처서 계산)
    const deg = s2RoofPitch * 180 / Math.PI;                 // 박공 각도 단일 출처(s2RoofPitch)에서 읽음
    const rise = (s2D / 2) * Math.tan(s2RoofPitch);          // 처마→용마루 상승(깊이 절반 × tan(박공각))
    const wallH = roofY - _wBase;                            // 앞뒤벽: 기초 상단~처마
    const peakH = wallH + rise;                              // 좌우 꼭지점: 기초 상단~용마루
    return { title: '외벽 · 박공지붕', body: [
      `- 박공지붕 경사: ${Math.round(deg)}°`,
      `- 앞뒤벽 높이(기초 상단~처마): ${fmtDim(wallH)} m`,
      `- 좌우 꼭지점 높이(기초 상단~용마루): ${fmtDim(peakH)} m`,
      `- 용마루가 처마보다 ${fmtDim(rise)} m 높음 (깊이 ${fmtDim(s2D)} m의 절반 × tan${Math.round(deg)}°)`,
    ].join('\n') };
  },
  get s2Floor1() {                                         // 1층 바닥 — 마감 재질 + 정면·뒤 옥외 계단 사양(계단 상수서 자동 계산)
    const rise = MAT_H + S2_STAIR.slabT;                    // 지면~1층 바닥 윗면(정면·뒤 계단 공통 상승)
    const fRis = rise / s2FrontStair.steps, rRis = rise / s2RearStair.steps;
    return { title: '1층 바닥', body: [
      '［바닥 마감］',
      '· 페데스탈(높이조절 받침) + 포세린 타일',
      '· 건식 시스템',
      '',
      '［정면 옥외 계단］ 집 너비 전체',
      `· 너비    ${fmtDim(s2W)} m`,
      `· 단 수    ${s2FrontStair.steps}단`,
      `· 단높이   ${fmtDim(fRis)} m`,
      `· 디딤    ${fmtDim(s2FrontStair.tread)} m`,
      '· 마감    포세린 타일',
      '',
      '［뒤 출입문 옥외 계단］',
      `· 폭     ${fmtDim(s2RearStair.width)} m`,
      `· 단 수    ${s2RearStair.steps}단`,
      `· 단높이   ${fmtDim(rRis)} m`,
      `· 디딤    ${fmtDim(s2RearStair.tread)} m`,
      '· 마감    포세린 타일',
    ].join('\n') };
  },
  s2Sink: { title: '주방', body: [
    '［전기온수기］',
    '· 경동나비엔 ESW560-30U (30리터)',
    '· 싱크대 아래 설치',
    '· 전용 콘센트(고전력·마젠타) — 하부장 안 낮은 높이',
    '',
    '［인덕션］',
    '· 직결(하드와이어) — 콘센트 아님',
    '· 전선 인출구(정션박스·보라) — 싱크 옆 하부장 안',
  ].join('\n') },
  get s2Stair() {                                          // 계단 사양 + 1층 계단참 아래 옷장 — 모두 계단 상수서 자동 계산
    const { T, R, W, g, tTh, floorH, nosing, rTh, usTh, nUpper, landingSteps } = S2_STAIR;
    const wF = 2 * W + g;                                  // 계단참 깊이(두 런 + 틈)
    const n1 = Math.round(floorH[0] / R), n2 = Math.round(floorH[1] / R);   // 비행별 단 수
    const nL = n1 - landingSteps - nUpper[0];              // 1→2 하부런 단 수(계단참 먹는 단·상부런 수 모두 S2_STAIR)
    const width = W - rTh;                                 // 옷장 너비: 우측 외벽 안쪽~계단참 챌판(챌판 두께 제외)
    const depth = W + usTh;                                // 옷장 깊이: 문 앞면~뒤벽 안쪽(계단아래 문 두께 포함)
    const height = (nL + 1) * R - tTh;                     // 옷장 높이: 1층 바닥~계단참 하부
    const mm = (v) => Math.round(v * 1000);                // m → mm 정수(메모 표기용)
    return { title: '계단', body: [
      '［계단］ 좌우런 · 우측벽 스위치백',
      `· 단높이      ${mm(R)} mm`,
      `· 디딤 깊이    ${mm(T)} mm`,
      `· 디딤판      ${mm(T + nosing)} × ${mm(W)} mm  (계단코 포함, 두께 ${mm(tTh)})`,
      `· 런 폭       ${mm(W)} mm`,
      `· 런 사이 틈   ${mm(g)} mm`,
      `· 1→2층      ${mm(floorH[0])} mm / ${n1}단`,
      `· 2→3층      ${mm(floorH[1])} mm / ${n2}단`,
      '',
      '［참 크기］',
      `· 계단참(스위치백)  ${mm(W)} × ${mm(wF)} mm`,
      `· 층계참(도착칸)   ${mm(s2LandingW)} × ${mm(wF)} mm`,
      '',
      '［계단참 아래 옷장］ 쌍여닫이',
      `· 너비  ${mm(width)} mm  (외벽~챌판)`,
      `· 깊이  ${mm(depth)} mm  (문~뒤벽)`,
      `· 높이  ${mm(height)} mm  (바닥~계단참 밑)`,
    ].join('\n') };
  },
  get s2Lift() {                                           // 홈리프트 — 기준 제품·내외경·운행. 치수는 s2Lift* 상수서 파생
    const rise = roofY - (groundTopY + MAT_H + S2_STAIR.slabT);   // 운행 높이(1층 바닥 윗면~처마)
    return { title: '홈리프트', body: [
      `［기준 제품］ ${s2LiftModel}`,
      '',
      '［크기］ 깊이 × 문면 폭',
      `· 내경(탑승)  ${fmtDim(s2LiftInW)} × ${fmtDim(s2LiftInD)} m`,
      `· 외경(샤프트) ${fmtDim(s2LiftW)} × ${fmtDim(s2LiftD)} m`,
      '',
      '［배치·운행］',
      '· 문: 계단쪽(복도쪽) — 계단을 마주봄',
      '· 뒤 외벽에 등 붙임(층계참 옆·안방쪽)',
      `· 운행: 1층 바닥~처마 관통 ${fmtDim(rise)} m (1~3층)`,
    ].join('\n') };
  },
  get s2Floor2() {                                         // 2층 — 화장실·앞방 크기. 그리기 실좌표(s2Geo)·모듈 상수서 자동 계산
    const { inX0, inX1, inZ0, inZ1, wF, far2 } = s2Geo;      // 그리기가 실제로 쓴 좌표(단일 출처)
    const wcFaceX = far2 + s2LandingW + s2LiftW + s2WallInner;   // 화장실 低X 안쪽면 — 그리기와 동일(도착칸+홈리프트+내벽)
    const bathW = inX1 - wcFaceX, bathD = wF;                // 화장실 실사용: 화장실벽 안쪽~안방 외벽 · 분리벽 안쪽~뒤벽
    const roomW = inX1 - inX0, roomD = (inZ1 - inZ0) - wF - s2WallInner;   // 앞방: 분리벽 앞 전체(전폭 × 앞 외벽~분리벽)
    const landW = s2LandingW, landD = wF;                    // 층계참(도착칸): 계단 끝~화장실 벽 · 분리벽~뒤 외벽
    return { title: '2층 — 화장실 · 안방', body: [
      `- 층계참(계단 올라와 방 들기 전 평평한 바닥, 벽 뺀): ${fmtDim(landW)} × ${fmtDim(landD)} m`,
      `- 화장실(벽 뺀 실사용 바닥): ${fmtDim(bathW)} × ${fmtDim(bathD)} m`,
      `- 안방(벽으로 분리, 길쭉): ${fmtDim(roomW)} × ${fmtDim(roomD)} m`,
      '',
      `[화장실 배치] 좌(안방쪽)=습식·우(주방쪽)=건식 분리. 문=앞 분리벽(안방서 밀어 +Z, 폭 ${fmtDim(s2F2.doorW)}, 도착칸쪽 벽서 ${fmtDim(s2WallInner)}). 앞벽 ${fmtDim(s2WallInner)} m.`,
      `- 변기: 안방쪽-뒤 코너(3층 변기와 수직정렬·오수관 직하). 중심 옆벽서 ${fmtDim(s2WcToiletOff)} m.`,
      `- 샤워부스: 안방쪽-앞 코너 ${fmtDim(s2F2.showerW)}×${fmtDim(s2F2.showerD)} m(유리벽 없이 개방 — 변기앞 공간 확보, 변기와 같은 왼쪽 습식존).`,
      `- 세면대: 변기 옆(3층처럼), 뒤 외벽에 등 붙임. 폭 ${fmtDim(s2F2.vanityW)}·깊이 ${fmtDim(s2F2.vanityD)} m. 변기와 중심 간격 ${fmtDim(s2WcSinkGap)} m. 벽수전(외벽서).`,
      `- 전기온수기 ${s2F2.heaterL} L: 외벽(뒤) 상부 벽거치(${s2F2.heaterL} L는 하부장에 숨기기엔 큼).`,
    ].join('\n') };
  },
  get s2Floor3() {                                         // 3층 — 계단앞(계단실 단열) 문 요구사항. 계단 상수·박공 단면서 자동 계산
    const W = S2_STAIR.W, wF = 2 * W + S2_STAIR.g;          // 계단 런 폭 · 계단참 깊이
    const inZ1 = s2BackZ - s2WallT, zB0 = inZ1 - wF;        // 계단실 앞면(개구 시작 Z)
    const floorY = F3 + S2_STAIR.slabT;                     // 3층 바닥 표면
    const hFront = s2RoofUnderY(zB0) - floorY;              // 개구 천장고 — 앞쪽(低Z, 데크쪽) 높은 끝
    const hStair = s2RoofUnderY(zB0 + W) - floorY;          // 개구 천장고 — 계단쪽(高Z) 낮은 끝
    return { title: '3층 — 계단앞 문(계단실 단열)', body: [
      '[요구사항] 문이 열리면 계단 너비와 똑같이 트여, 문이 없을 때와 같은 크기의 홀이 생겨야 한다.',
      `- 너비: 계단 런 폭과 동일 ${fmtDim(W)} m (양옆 문틀·벽이 폭을 잠식하지 않음 — 개구 순폭 = 계단 폭)`,
      `- 높이: 상인방 없이 바닥~천장(박공 경사 밑선) 전체. 경사라 앞쪽(데크쪽) ${fmtDim(hFront)} m ~ 계단쪽 ${fmtDim(hStair)} m.`,
      '- 즉 문틀·인방으로 막지 말 것. 열리면 개구 전체가 비어 계단실과 한 칸처럼 통해야 한다.',
      '',
      '[화장실 건식 세면대]',
      '- 위치: 3층 화장실 안, 뒤 외벽에 등 붙임(변기 옆). 세면대가 들어온 만큼 화장실을 주방쪽으로 넓혀 벽·문을 이동.',
      `- 변기↔세면대 중심 간격 ${fmtDim(s2WcSinkGap)} m(주택 욕실 표준). 주방쪽 벽·문은 복도쪽으로 더 빼 문이 열려도 세면대에 안 닿게 ${fmtDim(s2WcSinkClear)} m 여유.`,
      `- 하부장 ${fmtDim(s2F3VanityW)}×${fmtDim(s2F3VanityD)} m · 높이 ${fmtDim(s2F3VanityH)} m + 세면볼`,
      '- 수전: 세탁기 수도처럼 뒤 외벽에서 나오는 벽수전.',
      `- 하부장 안에 경동 나비엔 전기온수기 ${s2F3HeaterL} L 설치.`,
    ].join('\n') };
  },
  get hedge() {                                            // 측백담장 — 높이·두께는 코드(hedgeH·hedgeThickness)서 파생.
    return { title: '측백담장', body: [
      '- 측백나무 생울타리(상록)',
      `- 높이 ${fmtDim(hedgeH)} m · 두께 ${fmtDim(hedgeThickness)} m`,
    ].join('\n') };
  },
  get fence() {                                            // 옆집담장 — 높이는 코드(fenceH)서 파생.
    return { title: '옆집담장', body: [
      '- 우측 콘크리트 경계벽',
      `- 높이 ${fmtDim(fenceH)} m`,
    ].join('\n') };
  },
  get siteOverview() {                                     // 대지·지역 개요 + 건폐/용적 검토 — 항상 기본 표시. 숫자는 코드(s2W·s2D·이격 상수)서 파생.
    const lotArea = 161;                                   // 대지면적(잡종지, 등기) — 장암리 639-25
    const floors = 3;                                      // 지상 층수
    const bldgArea = s2W * s2D;                            // 건축면적(1층 발자국)
    const totalArea = bldgArea * floors;                  // 연면적(전 층 합)
    const bcr = (bldgArea / lotArea) * 100;               // 건폐율
    const far = (totalArea / lotArea) * 100;              // 용적률
    const sideGap = -lotX0;                                // 옆집(주방측) 이격 = 집 외벽~옆 경계(파생)
    const rearGap = lotZ1 - s2BackZ;                      // 뒤 이격 = 집 뒤벽~후면 경계(파생)
    return { title: '대지 개요', body: [
      '[대지 · 지역]',
      '- 주소: 경기 포천시 이동면 장암리 639-25',
      `- 대지면적: ${lotArea} ㎡ (지목 잡종지 → 건축 후 ‘대’)`,
      '- 용도지역: 계획관리지역 + 성장관리계획구역',
      `- 이격거리: 도로(건축선) 1.0 m · 옆 ${sideGap.toFixed(1)} m · 뒤 ${rearGap.toFixed(1)} m`,
      '',
      '[규모 검토]',
      `- 건물: ${s2W}×${s2D.toFixed(1)} m · 지상 ${floors}층`,
      `- 건축면적 ${bldgArea.toFixed(0)} ㎡ · 연면적 ${totalArea.toFixed(0)} ㎡`,
      `- 건폐율: ${bcr.toFixed(1)} %  (한도 50 %)`,
      `- 용적률: ${far.toFixed(1)} %  (한도 125 %)`,
      '',
      '* 성장관리계획상 층수·높이 가이드라인은 포천시청 도시과(031-538-2114) 확인 필요.',
    ].join('\n') };
  },
  get siteOverviewS1() {                                   // 대지·지역 개요(1층+다락 안) — s1 도면 상단 상시 표시. 숫자는 코드(building*·deckRoof·이격 상수)서 파생.
    const lotArea = 161;                                   // 대지면적(잡종지, 등기) — 장암리 639-25
    const houseArea = buildingW * buildingD;               // 집 건축면적(외벽 중심선 수평투영)
    const deckRoofArea = deckRoofBcrArea;                  // 포치(데크 지붕) 건축면적 — 외곽 기둥 중심선 안쪽(§119① 2호)
    const bldgArea = houseArea + deckRoofArea;            // 건축면적 = 집 + 포치(지붕 덮인 기둥 안쪽 전부)
    const floorArea = houseArea;                           // 연면적 = 1층 바닥만(다락·개방 포치는 바닥면적 비산입)
    const bcr = (bldgArea / lotArea) * 100;               // 건폐율
    const far = (floorArea / lotArea) * 100;              // 용적률
    const sideGap = -lotX0;                                // 옆집(주방측) 이격 = 집 외벽~옆 경계(파생)
    const rearGap = lotZ1 - buildingBackZ;                 // 뒤 이격 = 집 뒤벽~후면 경계(파생)
    return { title: '대지 개요', body: [
      '[대지 · 지역]',
      '- 주소: 경기 포천시 이동면 장암리 639-25',
      `- 대지면적: ${lotArea} ㎡ (지목 잡종지 → 건축 후 ‘대’)`,
      '- 용도지역: 계획관리지역 + 성장관리계획구역',
      `- 이격거리: 도로(건축선) 1.0 m · 옆 ${sideGap.toFixed(1)} m · 뒤 ${rearGap.toFixed(1)} m`,
      '',
      '[규모 검토]',
      `- 건물: ${buildingW}×${buildingD.toFixed(1)} m · 지상 1층 + 다락`,
      `- 건축면적: 집 ${houseArea.toFixed(1)} + 포치 ${deckRoofArea.toFixed(1)} = ${bldgArea.toFixed(1)} ㎡`,
      `- 건폐율: ${bcr.toFixed(1)} %  (한도 50 %)`,
      `- 연면적: ${floorArea.toFixed(1)} ㎡ (1층, 다락·포치 비산입)`,
      `- 용적률: ${far.toFixed(1)} %  (한도 125 %)`,
      '',
      '* 포치 건축면적 = 기둥으로 받친 지붕 → 외곽 기둥 중심선 안쪽 수평투영(§119① 2호). 개방 포치라 연면적엔 미산입.',
      '* 성장관리계획상 층수·높이 가이드라인은 포천시청 도시과(031-538-2114) 확인 필요.',
    ].join('\n') };
  },
  get s2Foundation() {                                     // 기초 — '기초' 토글 시. 두께는 코드(MAT_H)서 파생.
    const slabH = MAT_H;                                   // 온통기초(매트 슬래브) 두께
    return { title: '기초', body: [
      '[기초]',
      `- 형식: 온통기초(매트 슬래브) · ${s2W}×${s2D.toFixed(1)} m 전면`,
      `- 기초 두께: ${slabH.toFixed(2)} m (지면 위)`,
    ].join('\n') };
  },
};
const NOTE_ORDER = ['plan', 'matFoundationHouse', 'matFoundationFull', 'firstFloorFinish', 'stair', 'extWall', 'firstRoom', 'outlet', 'bath', 'loft', 'atticInnerWall', 'roof', 'deck', 'sun', 'sunWall', 'folding', 'accessory', 'hedge', 'fence', 's2Foundation', 's2Floor1', 's2Sink', 's2Stair', 's2Lift', 's2Floor2', 's2Floor3', 's2Wall3', 's2Roof3', 's2Solar3'];
function updateNotes() {
  const body = document.querySelector('#noteBody');
  if (!body) return;
  const active = NOTE_ORDER.filter((k) => (k === 'plan' ? view.plan : (!view.plan && view[k])) && NOTES[k]);
  // 대지 개요 — 도면(s1·s2)마다 시작 배치도든 입체든, 토글과 무관하게 항상 맨 위에 표시
  if (currentScheme === 's2' && NOTES.siteOverview) active.unshift('siteOverview');
  else if (currentScheme === 's1' && NOTES.siteOverviewS1) active.unshift('siteOverviewS1');
  if (!active.length) { body.innerHTML = '<p class="note-empty">이 화면에 대한 메모가 아직 없습니다.</p>'; return; }
  body.innerHTML = active.map((k) => `<section class="note-item"><h3>${NOTES[k].title}</h3><div class="note-text">${NOTES[k].body}</div></section>`).join('');
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
  bStair: ['s2Stair'],
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
    if (target) {   // 기초(상호배타)는 동시에 못 켜므로 마지막 하나(전체 매트)만 남김
      const fk = keyList.filter((k) => FOUNDATION_GROUP.includes(k));
      for (let i = 0; i < fk.length - 1; i += 1) view[fk[i]] = false;
    }
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
bindSegButton('bAllWall', () => { const all = view.s2Wall1 && view.s2Wall2 && view.s2Wall3; view.s2Wall1 = view.s2Wall2 = view.s2Wall3 = !all; });   // 외벽 켜기 = 1·2·3층 외벽 한꺼번에
bindSegButton('bF1Wall', () => { view.s2Wall1 = !view.s2Wall1; });       // 외벽 1층
bindSegButton('bF2Wall', () => { view.s2Wall2 = !view.s2Wall2; });       // 외벽 2층
bindSegButton('bF3Wall', () => { view.s2Wall3 = !view.s2Wall3; });       // 외벽 3층
bindSegButton('bLift', () => { view.s2Lift = !view.s2Lift; });           // 홈리프트 = 전체 샤프트(독립)
// s1(1층·다락·포치) 부품 버튼 — 개별 키 토글. 기초 3종(말뚝·부분매트·전체매트)은 상호배타(하나 켜면 나머지 끔).
for (const [id, key] of S1_TOGGLES) {
  bindSegButton(id, () => {
    if (FOUNDATION_GROUP.includes(key)) { const on = view[key]; for (const k of FOUNDATION_GROUP) view[k] = false; view[key] = !on; }
    else view[key] = !view[key];
  });
}

// ── 최상위 탭(설계안 scheme) ───────────────────────────────────────────────────
// 페이지 가장 바깥 선택: 탭마다 별도 설계안. 대지·측백담·옆집담·이격은 모든 탭 공유.
// 탭 클릭 = 그 설계안의 배치도(부감)부터(켠 부품 전부 리셋). 같은 탭을 다시 눌러도 배치도로 복귀.
// 탭 추가: ① scene.js에 <button class="scheme-tab" data-scheme="sN"> + <section data-scheme="sN"> 그룹
//          ② 그 탭 전용 부재는 applyVisibility에서 currentScheme==='sN'으로 게이팅(s2 예시 참고).
let currentScheme = 's2';
function setScheme(id) {
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

// ── 계단 단독 설계(ㄷ자 가변 계단) ─────────────────────────────────────────────
// 뒤벽에 붙는 ㄷ자(반환) 계단을 가변값 4개로 그린다: 너비·단높이·계단폭(디딤 깊이)·개수.
//   1층 바닥 → 하부 곧은계단(+Z, 뒤로 오름) → 하부 돌음(부채꼴 90°) → 상부 돌음(부채꼴 90°, 평참 없음)
//   → 반대 방향 상부 곧은계단(-Z, 앞으로 오름) → 마지막 단 위 = 다락 바닥.
//   하부 첫 단과 상부 마지막 단(다락)이 같은 수직선상. 입·출구 앞은 통행 ≥1m.
//   1층바닥→다락바닥 전체 높이(=개수×단높이=1층 층고)를 함께 표시하고 값 바뀌면 갱신.
const stairParams = { R: stairRiserHeight, T: stairTreadDepth, N: stairRiserCount };   // 단높이(R)·디딤(T)·개수(N) 모두 상수 파생(단일 출처) — 여기 숫자 박지 말 것. 너비·위치는 1층 계단실 고정
const loftFloorThickness = secondFloorThickness;   // 다락 바닥 두께(30cm) — 다락 슬래브(secondFloorThickness)와 단일 출처. 계단 높이가 바뀌어도 두께 불변, 양쪽 내벽이 밑면에 맞춤

// ㄷ자 계단 좌표 — 1층 계단실(stairLowXRunX·stairHighXRunX, 뒤벽 턴존)에 맞춰 도출. 두 화면(계단·1층) 공유.
function stairGeom(p) {
  const W = stairRunW;                                  // 런 폭 = 1층 계단실 고정
  const R = p.R, T = p.T, N = Math.max(5, Math.round(p.N));
  const fy = firstFloorY;
  const nWind = winderTreadCount;                      // 사선(돌음) 단수
  const nLand = landingTreadCount;                     // 계단참 단수(돌음) — 평참 대신
  const nL = lowerStraightTreadCount;                  // 하부 곧은계단 단수
  const nU = upperStraightTreadCount;                  // 상부(다락쪽) 곧은계단 단수 (모두 상수 파생 → 발자국 고정)
  const loftY = fy + N * R;                             // 다락 바닥 높이(=1층 층고) = 총단수×단높이
  const landingY = fy + (nL + nWind + nLand) * R;       // 계단참 맨위(돌음 nLand단 오른 뒤) = 상부계단 시작 높이
  const treadH = 0.05, riserD = 0.03;
  const nosing = 0.02;                                  // 계단코 — 디딤판 앞코가 아래 단 위로 돌출(그리기·메모 단일 출처)
  const zBack = insideZ1;                               // 턴존이 뒤벽에 붙음
  const turnD = stairTurnD;                             // 턴존 깊이(1층 고정)
  const zTurn0 = stairTurnStart;                        // 턴존 앞 경계(= insideZ1 - turnD)
  const laneA = stairLowXRunX;                          // 하부(1층→) 런 = 주방측
  const laneB = stairHighXRunX;                         // 상부(→다락) 런 = 안방측 내력벽 안쪽 면에 런폭만큼 안쪽(벽 붙임). 저X런과의 실제 틈은 벽 두께차로 stairGap과 다름
  const flightLenL = nL * T, flightLenU = nU * T;
  const zFrontL = zTurn0 - flightLenL;                  // 하부계단 앞 끝(1층 입구)
  const zFrontU = zTurn0 - flightLenU;                  // 상부계단 앞 끝(다락 출구)
  return { W, R, T, N, fy, nWind, nLand, nL, nU, loftY, landingY, treadH, riserD, nosing, zBack, turnD, zTurn0, laneA, laneB, flightLenL, flightLenU, zFrontL, zFrontU };
}

// 계단 본체(발판·세로막이·사선·계단참) — 계단 화면 + 1층 공유(stairCoreObjects).
function drawStairCore(p) {
  const g = stairGeom(p);
  const { W, R, T, fy, nWind, nLand, nL, nU, treadH, riserD, nosing, zBack, turnD, zTurn0, laneA, laneB, zFrontL, landingY, loftY } = g;
  // 하부 곧은계단(laneA, +Z) — 세로막이는 발판 두께만큼 아래로, 첫 단은 위쪽 발판 두께만큼 없앰. 앞코(-Z)로 nosing 돌출.
  for (let i = 0; i < nL; i += 1) {
    const topY = fy + (i + 1) * R;
    box({ x: laneA, z: zFrontL + i * T - nosing, w: W, d: T + nosing, y: topY - treadH, h: treadH, mat: materials.stair, cast: false });
    const rY = i === 0 ? fy : fy + i * R - treadH;
    const rH = i === 0 ? R - treadH : R;
    box({ x: laneA, z: zFrontL + i * T, w: W, d: riserD, y: rY, h: rH, mat: materials.stairWall, cast: false });
  }
  // 사선 3단 — 회전 중심(안쪽 코너 P)에서 90°를 30°씩 균등 분할(보행선 디딤이 단마다 같아지게 = 돌음계단 안전 표준). 분할선이 턴존 경계와 만나는 점이 Q1·Q2.
  const P = [laneA + W, zTurn0];
  const A1 = [laneA, zTurn0], A2 = [laneA, zBack], A3 = [laneA + W, zBack];
  const rayHit = (deg) => {                                  // P에서 deg(0°=하부런쪽, 90°=상부런쪽) 광선이 턴존 벽(x=laneA 또는 z=zBack)과 만나는 점
    const a = deg * Math.PI / 180, du = Math.cos(a), dv = Math.sin(a);
    let t = Infinity;
    if (du > 1e-9) t = Math.min(t, W / du);
    if (dv > 1e-9) t = Math.min(t, turnD / dv);
    return [laneA + W - t * du, zTurn0 + t * dv];
  };
  const Q1 = rayHit(30), Q2 = rayHit(60);
  const windPolys = [[P, A1, Q1], [P, Q1, A2, Q2], [P, Q2, A3]];
  for (let k = 1; k <= nWind; k += 1) {
    flatPoly({ points: windPolys[k - 1], y: fy + (nL + k) * R - treadH, h: treadH, mat: materials.stair, cast: false });
  }
  // 사선 3단 앞코 — 각 단의 '아래 단과 맞닿는 앞 경계변'을 아래 단 쪽으로 nosing만큼 내민 띠.
  const cen = (pts) => [pts.reduce((s, q) => s + q[0], 0) / pts.length, pts.reduce((s, q) => s + q[1], 0) / pts.length];
  const noseStrip = (a, b, belowPt, topY) => {
    let nx = -(b[1] - a[1]), nz = b[0] - a[0];                          // 경계변의 법선
    const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
    if ((belowPt[0] - mx) * nx + (belowPt[1] - mz) * nz < 0) { nx = -nx; nz = -nz; }   // 아래 단 쪽으로
    const len = Math.hypot(nx, nz) || 1; nx = nx / len * nosing; nz = nz / len * nosing;
    flatPoly({ points: [a, b, [b[0] + nx, b[1] + nz], [a[0] + nx, a[1] + nz]], y: topY - treadH, h: treadH, mat: materials.stair, cast: false });
  };
  noseStrip(A1, P, [laneA + W / 2, zTurn0 - T / 2], fy + (nL + 1) * R);   // 단1 앞 = 하부런 마지막 단 위로
  noseStrip(P, Q1, cen(windPolys[0]), fy + (nL + 2) * R);                 // 단2 앞 = 단1 위로
  noseStrip(P, Q2, cen(windPolys[1]), fy + (nL + 3) * R);                 // 단3 앞 = 단2 위로
  // 계단참 = 돌음 nLand단(laneB 턴존) — 사선단과 대칭(90° 균등분할)으로 오르며 회전. 평참 대신 단으로 채워 층고↑(발자국 그대로).
  const PL = [laneB, zTurn0];
  const B1 = [laneB + W, zTurn0], B2 = [laneB + W, zBack], B3 = [laneB, zBack];
  const rayHitL = (deg) => {                                  // PL에서 deg 광선이 턴존 벽(x=laneB+W 또는 z=zBack)과 만나는 점(사선단 rayHit의 대칭)
    const a = deg * Math.PI / 180, du = Math.cos(a), dv = Math.sin(a);
    let t = Infinity;
    if (du > 1e-9) t = Math.min(t, W / du);
    if (dv > 1e-9) t = Math.min(t, turnD / dv);
    return [laneB + t * du, zTurn0 + t * dv];
  };
  const QL1 = rayHitL(30), QL2 = rayHitL(60);              // 90°를 30°씩(nLand=3 기준) 균등 분할
  const landPolys = [[PL, B1, QL1], [PL, QL1, B2, QL2], [PL, QL2, B3]];
  // 오름 순서: 뒤(gap쪽 B3, 낮음)→앞(바깥 B1, 높음). 사선 끝단에 이어 올라 상부계단 시작 높이(landingY)에 닿음.
  for (let k = 1; k <= nLand; k += 1) {
    flatPoly({ points: landPolys[nLand - k], y: fy + (nL + nWind + k) * R - treadH, h: treadH, mat: materials.landing, cast: false });
  }
  // 두 런 사이 gap — 사선 맨위 단 높이로 채워 사선계단 최상단에 포함(계단참 첫 단 밑)
  box({ x: laneA + W, z: zTurn0, w: laneB - (laneA + W), d: turnD, y: fy + (nL + nWind) * R - treadH, h: treadH, mat: materials.stair, cast: false });
  // 상부 곧은계단(laneB, -Z) → 마지막 단은 다락보다 한 단 아래. 세로막이 반대편(+Z) + 발판 두께만큼 아래로
  const baseU = landingY;
  for (let j = 0; j < nU; j += 1) {
    const topY = baseU + (j + 1) * R;
    const zT = zTurn0 - (j + 1) * T;
    box({ x: laneB, z: zT, w: W, d: T + nosing, y: topY - treadH, h: treadH, mat: materials.stair, cast: false });   // 앞코(+Z)로 nosing 돌출
    const rY = baseU + j * R - treadH;   // 첫 단도 일반 계단벽과 같은 높이(R) — 윗면=발판 밑면, 밑면=계단참 발판 밑면
    box({ x: laneB, z: zTurn0 - j * T - riserD, w: W, d: riserD, y: rY, h: R, mat: materials.stairWall, cast: false });
  }
  // 두 런 분리벽 겸 WC 저X벽 — 하부런을 상부런에 붙여 런 사이 틈을 없앴으므로 이 벽(내벽 두께 interiorWall=10cm)을 상부런(laneB) 저X 모서리에 세운다.
  // 앞끝(WC 문벽 뒤)~뒤 외벽까지 한 덩어리 벽 하나: 윗변은 앞쪽 WC 사선 천장 밑선을 따르고, 돌음(턴존)에선 첫 계단참 발판 밑면 높이로 이어진다. 계단실을 두 공간으로 분리.
  const gapX = laneB, gapW = interiorWall;
  {
    const topAt = (z) => (baseU - treadH) + (R / T) * (zTurn0 - z) - 0.10;   // WC 천장 밑선 = 발판 뒤코너선 − (드롭0.05+패널두께0.05)
    const zF = zFrontL + interiorWall;                                       // 앞끝을 WC 문벽 뒤로 물림
    const backTop = fy + (nL + nWind + 1) * R - treadH;                      // 돌음(턴존) 윗변 = 첫 계단참 발판 밑면
    yzWallPrism({ x: gapX, thickness: gapW, mat: materials.stairSpineWall, points: [
      [zF, fy], [insideZ1, fy], [insideZ1, backTop], [zTurn0, backTop], [zTurn0, topAt(zTurn0)], [zF, topAt(zF)],
    ] });
  }
  // 계단하부 WC(상부런 laneB 아래·안방측 공간) 앞벽 — 트인 전면을 막아 화장실로 사용. 가운데 출입문 1개. 윗면=다락 바닥 밑면.
  {
    const wcWallH = (loftY - loftFloorThickness) - fy;
    const dW = 0.7, dH = 2.0, t = interiorWall;            // 욕실문 표준(폭 0.7·높이 2.0) — 일반 방문(0.9·2.1)보다 작게
    const dx0 = laneB + interiorWall + (W - interiorWall - dW) / 2, dx1 = dx0 + dW;   // 문 = 화장실 안목(계단쪽 내벽 뺀 실바닥) X 중앙
    box({ x: laneB, z: zFrontL, w: dx0 - laneB, d: t, y: fy, h: wcWallH, mat: materials.stairInnerWall, cast: false });          // 문 왼쪽 벽(반투명)
    box({ x: dx1, z: zFrontL, w: (laneB + W) - dx1, d: t, y: fy, h: wcWallH, mat: materials.stairInnerWall, cast: false });      // 문 오른쪽 벽(반투명)
    box({ x: dx0, z: zFrontL, w: dW, d: t, y: fy + dH, h: wcWallH - dH, mat: materials.stairInnerWall, cast: false });          // 문 위 인방(반투명)
    interiorDoorHorizontal(dx0, zFrontL + t / 2, fy, dW, dH, materials.wcDoor);                                             // WC 출입문(욕실문 색) — 문짝을 벽 두께 중앙에 넣어 앞면 삐져나옴 제거
  }
  // WC 천장 — 상부런 발판 밑면(들쭉날쭉)을 가리는 사선 천장 패널. 단의 안쪽 뒤코너 선(z=zTurn0-jT, y=baseU+jR-treadH)을 따라 기울인 평판.
  {
    const baseU = landingY, zFrontU = zTurn0 - nU * T;
    const zF = zFrontU + interiorWall;                                       // 앞끝을 WC 문벽(interiorWall) 뒤로 물려 문벽과 겹침 제거
    const dz = zTurn0 - zF;
    const yBack = baseU - treadH, yFront = baseU + (R / T) * dz - treadH;     // 뒤(낮음)·앞(높음, 물린 앞끝 기준)
    const panelLen = Math.hypot(dz, (R / T) * dz), tilt = Math.atan2(R, T), th = 0.05, drop = 0.05;   // 코너선 아래(z-파이팅 회피·발판 밑면 가림)
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(W, th, panelLen), new THREE.MeshLambertMaterial({ color: 0xf2f0e8, side: THREE.DoubleSide }));   // 벽과 같은 톤·양면(내부=밑에서 봄)
    ceil.position.set(laneB + W / 2, (yBack + yFront) / 2 - th / 2 - drop, (zTurn0 + zF) / 2);
    ceil.rotation.x = tilt;
    ceil.receiveShadow = true;
    scene.add(ceil);
  }
  // WC 문 안여닫이 스윙 공간 — 밖에서 밀어 안(+Z)으로 90° 열릴 때 문이 쓸고 지나가는 1/4 기둥(반경=문폭, 높이=문높이). 사선 천장에 닿는지 눈으로 확인용. 반투명.
  {
    const dW = 0.7, dH = 2.0;                            // 욕실문(앞벽 문과 동일 치수)
    const hingeX = laneB + interiorWall + (W - interiorWall - dW) / 2;   // 경첩 = 문(안목 중앙) 주방측(낮은 X) 모서리
    const swept = new THREE.Mesh(
      new THREE.CylinderGeometry(dW, dW, dH, 24, 1, false, 0, Math.PI / 2),   // Y축 수직 1/4기둥
      new THREE.MeshLambertMaterial({ color: 0x66aaff, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
    );
    swept.position.set(hingeX, fy + dH / 2, zFrontL);    // 1/4 부채꼴(theta 0~90°)=+Z(닫힘,벽)~+X… 회전 없이 +X(닫힘)·+Z(화장실 안쪽 열림) 사분면
    scene.add(swept);
  }
  // 난간 — 칸막이(벽)가 막는 두 런 사이가 아니라, 트여서 추락 위험이 있는 '하부 직선계단의 주방측(laneA)' 가장자리에 둔다. 계단 경사를 따라 손잡이(발판+0.9m) + 양 끝·중간 수직 동자.
  const railX = laneA + 0.06, postR = 0.022, handR = 0.028;   // 주방측 발판 위(측면 세로막이·벽면 안쪽으로 살짝 들여 발판에 서게)
  // 세로 동자 — 하부 직선계단 각 발판의 깊이 중심 주방측(laneA)에 발판 위 1.0m로 하나씩
  const balH = 1.0;
  for (let i = 0; i < nL; i += 1) railCylinder([railX, fy + (i + 1) * R, zFrontL + i * T + T / 2], [railX, fy + (i + 1) * R + balH, zFrontL + i * T + T / 2], postR);
  // 손잡이 — 각 세로 동자 윗끝을 잇는 경사 손잡이(첫 발판~마지막 발판)
  railCylinder([railX, fy + R + balH, zFrontL + T / 2], [railX, fy + nL * R + balH, zFrontL + (nL - 1) * T + T / 2], handR);
  // 상부 직선계단(laneB, -Z) — 하부런과 같은 난간: 트인 계단실쪽(laneB) 가장자리에 발판마다 세로 동자 + 경사 손잡이.
  const railXU = laneB + 0.06;
  for (let j = 0; j < nU; j += 1) railCylinder([railXU, landingY + (j + 1) * R, zTurn0 - j * T - T / 2], [railXU, landingY + (j + 1) * R + balH, zTurn0 - j * T - T / 2], postR);
  railCylinder([railXU, landingY + R + balH, zTurn0 - T / 2], [railXU, landingY + nU * R + balH, zTurn0 - (nU - 1) * T - T / 2], handR);
  // 연장 — 돌음(턴존) 주방측(laneA) 트인 가장자리도 뒷벽까지: 벽 채움과 같은 90°/단수 분할로 각 사선단 세그먼트 중심에 세로 동자 + 손잡이 이음, 마지막은 뒷벽에 닿음.
  {
    const perStep = (Math.PI / 2) / nWind;
    let zPrev = zTurn0;
    let prevTop = [railX, fy + nL * R + balH, zFrontL + (nL - 1) * T + T / 2];   // 마지막 하부 동자 윗끝
    for (let k = 1; k <= nWind; k += 1) {
      const zEdge = (k < nWind) ? Math.min(zBack, zTurn0 + W * Math.tan(perStep * k)) : zBack;
      if (zEdge > zPrev + 1e-6) {
        const topY = fy + (nL + k) * R + balH;
        const nPosts = (k === 1) ? 2 : 1;   // 첫 사선단은 난간쪽이 넓어 세로 동자 2개로 간격 맞춤
        for (let j = 0; j < nPosts; j += 1) {
          const zc = zPrev + (zEdge - zPrev) * (j + 0.5) / nPosts;
          railCylinder([railX, fy + (nL + k) * R, zc], [railX, topY, zc], postR);   // 세로 동자
          railCylinder(prevTop, [railX, topY, zc], handR);                          // 손잡이 이음
          prevTop = [railX, topY, zc];
        }
      }
      zPrev = zEdge;
      if (zEdge >= zBack - 1e-6) break;
    }
    railCylinder(prevTop, [railX, prevTop[1], zBack], handR);   // 손잡이 뒷벽까지 마무리
  }
}

// 계단 화면 전용 주석(주방·안방 크기[1층과 동일]·라벨·층고·다락바닥) — stairObjects.
function drawStairAnno(p) {
  const loftSlabs = [];   // 다락 바닥 슬래브 — '다락 바닥' 토글(secondFloorObjects)로 분리 수집. '방·치수 도면'(anno)엔 안 넣음.
  const stairLandingAnno = [];   // '돌음' 라벨 → '계단' 토글(stairCoreObjects)로 분리(바닥엔 안 넣음).
  const loftPassAnno = [];        // '다락 통행' 라벨 → '다락' 토글(secondFloorObjects)로 분리.
  const innerWallAnno = [];       // '내벽 높이' 막대+라벨 → '안방 내력벽' 토글(familyInnerWallObjects)로 분리(막대가 그 벽에 붙음).
  const loftSuWalls = [];         // 수납장 실제 벽(계단쪽·뒤) → '다락 내벽' 토글(atticInnerWallObjects)로 분리. 벽자리 띠는 '다락 바닥'에 남김.
  const g = stairGeom(p);
  const { W, R, T, N, fy, nL, nWind, nU, loftY, laneA, laneB, zTurn0, zBack, zFrontL, zFrontU } = g;
  // 외벽 자리 표시 — 계단 화면엔 외벽을 안 그리므로, 외벽 둘레(집 발자국 테두리)를 주황 바닥띠로 표시해 공간 경계를 인지시킨다.
  {
    const wt = exteriorWall, z0 = buildingFrontZ, z1 = buildingFrontZ + buildingD;
    const my = firstWallY, mh = 0.05, M = materials.exteriorWallMark;
    box({ x: 0, z: z0, w: buildingW, d: wt, y: my, h: mh, mat: M, cast: false });                 // 앞(입구쪽)
    box({ x: 0, z: z1 - wt, w: buildingW, d: wt, y: my, h: mh, mat: M, cast: false });             // 뒤
    box({ x: 0, z: z0 + wt, w: wt, d: buildingD - 2 * wt, y: my, h: mh, mat: M, cast: false });    // 우(주방쪽)
    box({ x: buildingW - wt, z: z0 + wt, w: wt, d: buildingD - 2 * wt, y: my, h: mh, mat: M, cast: false }); // 좌(안방쪽)
  }
  captureInto(stairLandingAnno, () => label('돌음', laneB + W / 2, fy + (nL + nWind + 1) * R + 0.25, (zTurn0 + zBack) / 2, 'dim'));
  // 다락 바닥(상부계단 앞 통행) — 상부계단 출구(zFrontU)에서 앞 외벽 안쪽(insideZ0)까지 확보되는 평탄 통행 깊이.
  // 상부 단수가 늘면 zFrontU가 앞으로 밀려 통행 깊이가 줄어든다(계단 변경 시 숫자 자동 갱신).
  // 두께는 30cm 고정(loftFloorThickness). 윗면=다락 바닥 높이(loftY), 밑면=loftY-30cm → 양쪽 내벽이 이 밑면에 맞춰 높이 변함.
  const loftPass = zFrontU - insideZ0;
  const loftTh = loftFloorThickness;
  const loftRestD = insideZ1 - zFrontU;
  const kitchenWallInner = stairLowXRunX;        // 주방측 내벽의 계단실쪽 면(하부런 모서리) — 노란 다락바닥을 여기까지 채워 녹색 메움과 딱 만남(5cm 틈 제거)
  const familyWallInner = familyInnerWallX - familyInnerWallW / 2;  // 안방측 벽의 계단실쪽 면
  const nHead = Math.floor(((loftY - loftTh - 2.0) - fy) / R);   // 헤드룸 2m 확보되는 최대 단
  const fillZend = zFrontL + nHead * T;
  // 다락 바닥 슬래브 — '다락 바닥' 토글(secondFloorObjects)로 분리(anno엔 안 넣음). 주방 위·안방 위 다락바닥은 계단실(가운데)만 비우고 양쪽을 뒤 외벽까지, 앞쪽 통행 바닥과 zFrontU에서 이어짐. 1층 계단 위 메움은 헤드룸 2m 확보되는 단까지(구별색).
  const flr = loftY - loftTh;                    // 수납장 바닥 슬래브 윗면 밑선(벽자리 띠·바닥 메움 공통)
  const suZ0 = zFrontU + interiorWall;            // 앞: 다락 입구 가로벽(다락복도쪽) 뒷면 = 안목 시작
  const suX1 = laneA + W - interiorWall;          // 계단쪽 옆벽 안쪽 면 (계단 올라오는 쪽)
  const suZ1 = fillZend - interiorWall;           // 뒤벽 안쪽 면 (집 뒤쪽)
  captureInto(loftSlabs, () => {
    // 통행·주방위·안방위 노란 슬래브 제거 — 흰색 구조 슬래브(주방측·복도·안방측)가 같은 자리를 이미 덮어, 벽 밑에서 노란 바닥이 겹쳐 반짝이던 것 해소
    if (suZ1 > suZ0) {
      // 벽자리 표시(다락 벽과 같은 색 띠) — 앞·계단쪽·뒤 3변. 주방쪽은 다락방1 칸막이벽이 이미 담당.
      box({ x: laneA, z: zFrontU, w: suX1 - laneA, d: interiorWall, y: flr, h: loftTh, mat: materials.wall, cast: false });        // 앞(다락 복도쪽) 벽자리
      box({ x: suX1, z: zFrontU, w: interiorWall, d: fillZend - zFrontU, y: flr, h: loftTh, mat: materials.wall, cast: false });   // 계단쪽 옆 벽자리
      box({ x: laneA, z: suZ1, w: suX1 - laneA, d: interiorWall, y: flr, h: loftTh, mat: materials.wall, cast: false });           // 뒤 벽자리
      box({ x: laneA, z: suZ0, w: suX1 - laneA, d: suZ1 - suZ0, y: flr, h: loftTh, mat: materials.bed, cast: false });             // 안목 바닥(다락방 색)
      label(`수납장 ${fmtDim(suX1 - laneA)}×${fmtDim(suZ1 - suZ0)}m`, (laneA + suX1) / 2, loftY + 0.05, (suZ0 + suZ1) / 2, 'dim');
    }
  });
  // 수납장 실제 벽(지붕 밑선까지) → '다락 내벽' 토글. 계단쪽(세로, 지붕 슬로프 따라)+뒤(가로, 그 위치 지붕 높이). 앞벽은 다락 입구 가로벽이 이미 있음.
  captureInto(loftSuWalls, () => {
    if (suZ1 > suZ0) {
      gableLongWallX({ x: suX1, z: zFrontU, d: fillZend - zFrontU, y: loftY, baseH: secondWallHeight, thickness: interiorWall, mat: materials.wall });   // 계단쪽 옆벽
      box({ x: laneA, z: suZ1, w: suX1 - laneA, d: interiorWall, y: loftY, h: secondWallHeight + roofRiseAtZ(suZ1), mat: materials.wall });               // 뒤벽
    }
  });
  // (상부 마지막 단↔다락 바닥 사이 계단벽은 두지 않음 — 30cm 두께 다락 바닥의 앞면이 그 단높이 벽 역할을 함)
  // ('다락 통행' 라벨 제거 — 다락 복도가 이미 있어 중복)
  // 1층 계단 앞 통행 — 하부계단 입구(zFrontL)에서 앞 외벽 안쪽(insideZ0)까지. 하부 단수가 늘면 줄어든다.
  // (도면 위 라벨은 두지 않음 — 뒤쪽 계단을 가려서. 통행 거리 값은 좌상단 패널에 표시)
  const firstPass = zFrontL - insideZ0;
  // 1층 주방·안방 — 1층 도면과 동일 크기(계단실 벽 위치가 1층 기준이라 양쪽 화면이 같음)
  const roomY = fy + 0.012;
  room({ x: firstKitchenX, z: insideZ0, w: firstKitchenW, d: firstKitchenD, y: roomY, mat: materials.kitchen, text: roomText('주방', firstKitchenW, firstKitchenD) });
  room({ x: firstFamilyX, z: insideZ0, w: firstFamilyW, d: firstFamilyD, y: roomY, mat: materials.bed, text: roomText('안방', firstFamilyW, firstFamilyD) });
  // 내벽 높이(=층고) 막대 + 라벨 — 1층 바닥~내벽 윗면(=다락 바닥 밑면, loftY-30cm). 계단 높이 바뀌면 벽 높이·숫자 함께 갱신.
  const wallH = (loftY - loftTh) - fy;
  captureInto(innerWallAnno, () => {
    box({ x: familyInnerWallX, z: zFrontL, w: 0.03, d: 0.03, y: fy, h: wallH, mat: materials.guard, cast: false });   // 막대를 안방 내력벽 중심선에 붙임(주방에 붕 뜨지 않게)
    label(`내벽 높이 ${fmtDim(wallH)}m`, familyInnerWallX + 0.3, fy + wallH / 2, zFrontL, 'dim');   // 라벨은 안방 내력벽 옆(안방쪽)
  });
  return { nL, nU, innerWallH: wallH, firstPass, loftPass, kitchenW: firstKitchenW, anbangW: firstFamilyW, stairW: W, loftSlabs, stairLandingAnno, loftPassAnno, innerWallAnno, loftSuWalls };
}

// 계단실 양쪽 세로 내벽(주방|계단실·계단실|안방) — 윗면이 다락 바닥 밑면(loftY-30cm)에 맞도록 높이가 계단에 따라 변함.
// 계단 화면 + 1층/다락/지붕 단계 공유(stairWallObjects). 계단 변경 시 buildStair()에서 다시 그림.
function buildStairWalls() {
  clearStairGroup(kitchenInnerWallObjects);
  clearStairGroup(familyInnerWallObjects);
  const wt = exteriorWall, z0 = buildingFrontZ, wy = firstWallY + 0.003;
  const inW = innerWallW, inOv = 0.003;   // inOv: 앞·뒤 외벽 안쪽으로 3mm만 파고들어 연결부 면겹침(z-fighting 반짝) 방지 — 폭은 안목 3.6m로 계산됨
  const N = Math.max(5, Math.round(stairParams.N));
  const loftY = firstFloorY + N * stairParams.R;          // 다락 바닥 높이(=계단 전체 높이)
  const wallH = (loftY - loftFloorThickness) - wy;        // 윗면 = 다락 바닥 밑면
  const d = buildingD - 2 * wt + 2 * inOv;
  const zStart = z0 + wt - inOv;
  const fx = familyInnerWallX - familyInnerWallW / 2;
  captureInto(kitchenInnerWallObjects, () => {
    const g = stairGeom(stairParams);
    // 하부 직선계단 주방측 트인 부분 — 반대편 gap 스파인벽과 대칭으로 각 단 발판 밑면까지만 계단 모양으로 채워 막음(발판 위로 안 솟게 → 위는 세로 동자 난간이 막음).
    for (let i = 0; i < g.nL; i += 1) {
      box({ x: g.laneA, z: g.zFrontL + i * g.T, w: inW, d: g.T, y: g.fy, h: (i + 1) * g.R - g.treadH, mat: materials.stairInnerWall });
    }
    // 돌음(턴존) 주방측 트인 부분 — 통벽 대신 사선단 외측(laneA에 닿는 아래 단들) 높이를 따라 발판 밑면까지 계단모양으로 채워 계단실 안쪽에 넣음. 단 경계 z는 90°/단수 분할각으로 계산.
    const perStep = (Math.PI / 2) / g.nWind;
    let zPrev = g.zTurn0;
    for (let k = 1; k <= g.nWind; k += 1) {
      const zEdge = (k < g.nWind) ? Math.min(g.zBack, g.zTurn0 + g.W * Math.tan(perStep * k)) : g.zBack;
      if (zEdge > zPrev + 1e-6) box({ x: g.laneA, z: zPrev, w: inW, d: zEdge - zPrev, y: g.fy, h: (g.nL + k) * g.R - g.treadH, mat: materials.stairInnerWall });
      zPrev = zEdge;
      if (zEdge >= g.zBack - 1e-6) break;
    }
  });
  captureInto(familyInnerWallObjects, () => {
    // 계단실|안방 내력벽 20cm(말뚝 중심) — 앞쪽에 안방 표준 포켓도어(900×2100) 개구. 벽·개구·문짝을 한 그룹(단일 출처)으로 그려 '계단' 화면부터 함께 보임.
    verticalWallWithGaps(fx, zStart, d, wy, [[familyDoorZ, familyDoorZ + interiorDoorW]], wallH, familyInnerWallW, materials.stairInnerWall);
    const doorTopY = firstFloorY + interiorDoorH;
    lowWall(fx, familyDoorZ, familyInnerWallW, interiorDoorW, doorTopY, (wy + wallH) - doorTopY, materials.stairInnerWall);   // 문 위 인방
    pocketDoorVertical(familyInnerWallX, familyDoorZ, firstFloorY, interiorDoorH, 1);   // 안방 표준 포켓도어 문짝
  });
}

let stairInfo = null;
function clearStairGroup(arr) {
  for (const o of arr) {
    scene.remove(o);
    if (o.geometry) o.geometry.dispose();
    if (o.material && o.material.map) o.material.map.dispose();
  }
  arr.length = 0;
}
function buildStair() {
  clearStairGroup(stairCoreObjects);                                       // 계단 본체(계단+1층 공유)
  clearStairGroup(stairObjects);                                           // 계단 화면 전용 주석
  buildStairWalls();                                                       // 양쪽 내벽 — 다락 바닥 밑면(30cm)에 맞춰 높이 갱신
  captureInto(stairCoreObjects, () => { drawStairCore(stairParams); });
  { const _s = scene.children.length; stairInfo = drawStairAnno(stairParams);
    // 계단참·다락통행·내벽높이 라벨은 '바닥'이 아니라 각자 토글로 분리 → 바닥 화면에서 제외.
    const _moved = new Set([...stairInfo.loftSlabs, ...stairInfo.stairLandingAnno, ...stairInfo.loftPassAnno, ...stairInfo.innerWallAnno, ...stairInfo.loftSuWalls]);
    stairObjects.push(...scene.children.slice(_s).filter((o) => !_moved.has(o)));  // 분리분 제외 → '바닥'엔 안 뜸
    secondFloorObjects.push(...stairInfo.loftSlabs, ...stairInfo.loftPassAnno);    // 다락 바닥 슬래브 + '다락 통행' 라벨 → '다락' 토글
    atticInnerWallObjects.push(...stairInfo.loftSuWalls);                          // 수납장 실제 벽(계단쪽·뒤) → '다락 내벽' 토글
    stairCoreObjects.push(...stairInfo.stairLandingAnno);                          // '돌음' 라벨 → '계단' 토글
    familyInnerWallObjects.push(...stairInfo.innerWallAnno); }                     // '내벽 높이' 막대+라벨 → '안방 내력벽' 토글(막대가 그 벽에 붙음)
  applyVisibility();
}

// 계단 제원은 stairParams 기본값으로 확정 — 화면 내 조절 패널은 제거함.
buildStair();

// ── 집(바닥~지붕)을 houseGroup으로 묶기 — 기초 윗면 높이에 맞춰 통째로 Y 이동(단일 출처) ──
// 집 객체 전부를 houseGroup 자식으로 옮긴다(빌드 좌표는 말뚝기초 윗면 기준 그대로 보존).
// 선택 기초가 매트면 applyVisibility에서 houseGroup.position.y에 (매트 윗면 − 말뚝 윗면)을 줘 집이 따라 올라간다.
// 기초·데크·대지·발자국·담장은 옮기지 않는다(각자 자기 자리에 고정).
{
  const HOUSE_ARRAYS = [
    firstFloorFinishObjects, firstDimObjects, firstWallObjects, firstFloorObjects, bathObjects,
    secondFloorObjects, atticExtWallObjects, atticInnerWallObjects, roofObjects, outletObjects, atticOutletObjects,
    stairCoreObjects, stairObjects, kitchenInnerWallObjects, familyInnerWallObjects,
  ];
  const seen = new Set();
  for (const arr of HOUSE_ARRAYS) for (const o of arr) { if (!seen.has(o)) { seen.add(o); houseGroup.add(o); } }   // add = scene→houseGroup 재부모(로컬좌표 보존)
}

setScheme('s1'); // 초기 탭 = 1층·다락·포치(s1) + 그 배치도(부감) — setScheme가 showPlan 호출

// 모든 컨트롤 버튼 높이를 '가장 큰 버튼'에 맞춰 통일 — 라벨 줄이 늘어도, 몇 줄로 줄바꿈돼도 항상 동일.
function equalizeButtonHeights() {
  const btns = [...document.querySelectorAll('.controls button')];
  if (!btns.length) return;
  for (const b of btns) b.style.height = 'auto';                 // 내용 높이로 리셋 후 측정
  const max = Math.max(...btns.map((b) => b.offsetHeight));
  for (const b of btns) b.style.height = `${max}px`;             // 전체를 최댓값으로 통일
}
equalizeButtonHeights();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(equalizeButtonHeights);  // 폰트 로드 후 재측정

function resize() {
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  equalizeButtonHeights();   // 줄바꿈 수가 바뀌어도 높이 통일 유지
}
window.addEventListener('resize', resize);
resize();   // 시작 시 1회 — dev에서 초기 stage 높이가 늦게 잡혀 캔버스가 0높이(백지)로 뜨는 것 방지.

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
