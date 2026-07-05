const EPS = 0.01;

function approx(actual, expected, label, eps = EPS) {
  const ok = Math.abs(actual - expected) <= eps;
  return { label, ok, actual, expected };
}

function gte(actual, expected, label, eps = EPS) {
  const ok = actual + eps >= expected;
  return { label, ok, actual, expected: `>= ${expected}` };
}

function lte(actual, expected, label, eps = EPS) {
  const ok = actual <= expected + eps;
  return { label, ok, actual, expected: `<= ${expected}` };
}

function separatedOrTouching(a0, a1, b0, b1, label) {
  const ok = a1 <= b0 + EPS || b1 <= a0 + EPS;
  return { label, ok, actual: `${a0}..${a1} vs ${b0}..${b1}`, expected: 'no overlap' };
}

// 벽부착 부재(콘센트·수전·스위치)가 같은 벽의 개구부(창·문) 안에 들어가면 실패.
// 물리적으로 못 다는 위치 — z(또는 x)와 y 두 축 모두 겹칠 때만 충돌로 본다.
function outsideOpening(rect, opening, label) {
  const aOverlap = rect.a0 < opening.a1 - EPS && opening.a0 < rect.a1 - EPS;   // 벽면 가로축(z 또는 x)
  const yOverlap = rect.y0 < opening.y1 - EPS && opening.y0 < rect.y1 - EPS;   // 높이축
  const ok = !(aOverlap && yOverlap);
  return {
    label, ok,
    actual: `부재 ${rect.a0.toFixed(2)}..${rect.a1.toFixed(2)} / y ${rect.y0.toFixed(2)}..${rect.y1.toFixed(2)}`,
    expected: `개구부(${opening.a0.toFixed(2)}..${opening.a1.toFixed(2)} / y ${opening.y0.toFixed(2)}..${opening.y1.toFixed(2)}) 밖`,
  };
}

const groundTopY = 0.08;
const foundationHeight = 0.5;
const firstWallY = groundTopY + foundationHeight;
const firstWallHeight = 2.6;
const secondY = firstWallY + firstWallHeight;
const floorThickness = 0.15;
const secondWallHeight = 1.15;
const buildingW = 8.5;
const buildingFrontZ = -0.7;
const buildingBackZ = 3.3;
const buildingD = buildingBackZ - buildingFrontZ;
const roofSlopeDeg = 33;
const roofSlopeTan = Math.tan((roofSlopeDeg * Math.PI) / 180);
const gableRise = roofSlopeTan * (buildingD / 2);
const roofSideOverhang = 0.4;
const roofEaveOverhang = 0.6;
const roofThickness = 0.26;
const exteriorWall = 0.2;
const interiorWall = 0.1;
const insideX0 = exteriorWall;
const insideZ0 = buildingFrontZ + exteriorWall;
const insideX1 = buildingW - exteriorWall;
const insideZ1 = buildingBackZ - exteriorWall;
const stairRunW = 1.0;
const stairGap = interiorWall;
const stairClearW = stairRunW * 2 + stairGap;
const layoutD = insideZ1 - insideZ0;
const sideRoomW = (insideX1 - insideX0 - stairClearW - interiorWall * 2) / 2;
const firstLivingW = sideRoomW;
const firstFamilyW = sideRoomW;
const firstFamilyD = layoutD;
const stairClearX = insideX0 + firstLivingW + interiorWall;
const stairLowXRunX = stairClearX;
const stairHighXRunX = stairLowXRunX + stairRunW + stairGap;
const stairLowXWallX = stairClearX - interiorWall;
const stairHighXWallX = stairClearX + stairClearW;
const stairHighXClearX = stairHighXWallX + interiorWall;
const planRightLivingX = insideX0;
const planLeftFamilyX = stairHighXClearX;
const interiorDoorW = 0.9;
const interiorDoorH = 2.1;
const familyDoorZ = insideZ0;

const stairRiserCount = 16;
const lowerStraightTreadCount = 6;
const winderTreadCount = 3;
const upperStraightTreadCount = stairRiserCount - 1 - lowerStraightTreadCount - winderTreadCount;
const stairTreadDepth = 0.27;
const stairTurnD = stairRunW;
const stairTreadH = 0.08;
const stairGuardWallH = 1.1;
const centerRailHeight = 0.92;
const riserH = (secondY + floorThickness - firstWallY) / stairRiserCount;
const turnStart = insideZ1 - stairTurnD;
const firstRunStart = turnStart - stairTreadDepth * lowerStraightTreadCount;
const stairOpeningStart = turnStart - stairTreadDepth * upperStraightTreadCount;
const stairBottomLandingD = stairOpeningStart - insideZ0;
const firstRunEnd = turnStart;
const stairBath = { x: stairHighXRunX, z: firstRunStart, w: stairRunW, d: firstRunEnd - firstRunStart };
const stairBathDoor = { x: stairBath.x + 0.05, z: stairBath.z, w: interiorDoorW, h: interiorDoorH };
const stairBathWallH = firstWallHeight;
const stairBathFrontWall = { x: stairBath.x, z: stairBath.z, w: stairBath.w, d: interiorWall, h: stairBathWallH };
const stairBathDoorHeader = { x: stairBathDoor.x, z: stairBath.z, w: stairBathDoor.w, d: interiorWall, h: stairBathWallH - stairBathDoor.h };
const runGap = stairTreadDepth;
const secondCorridor = { x: insideX0, z: insideZ0, w: insideX1 - insideX0, d: stairBottomLandingD, name: '2F long corridor' };
const secondAtticWallZ = secondCorridor.z + secondCorridor.d;
const secondAtticZ = secondAtticWallZ + interiorWall;
const secondAtticD = insideZ1 - secondAtticZ;
const stairRoom1Wall = { x: stairLowXWallX, z: secondAtticWallZ, w: interiorWall, d: insideZ1 - secondAtticWallZ, name: '2F stair/room1 wall' };
const stairRoom2Wall = { x: stairHighXWallX, z: secondAtticWallZ, w: interiorWall, d: insideZ1 - secondAtticWallZ, name: '2F stair/room2 wall' };
const secondArrivalFloor = secondCorridor;
const stairOpening = { x: stairClearX, z: stairOpeningStart, w: stairHighXWallX - stairClearX, d: insideZ1 - stairOpeningStart, name: '2F stair opening' };
const frontGuard = { x: stairClearX, z: stairOpeningStart - interiorWall / 2, w: stairHighXRunX - stairClearX, d: interiorWall, h: stairGuardWallH, name: '2F front stair wall' };
const extendedStairBathWall = { x: stairHighXWallX, z: stairOpeningStart, w: interiorWall, d: insideZ1 - stairOpeningStart, name: 'extended 1F stair/bath wall' };
const stairCenterWall = { x: stairLowXRunX + stairRunW, z: stairOpeningStart, w: stairGap, d: insideZ1 - stairOpeningStart, h: stairGuardWallH };
const stairCenterLowWall = { h: (stairRiserCount - 1) * riserH };
const firstLivingStairWallRemoved = true;
const planRightLowerSteppedWall = { x: stairLowXWallX, z: firstRunStart, d: firstRunEnd - firstRunStart, firstH: riserH, lastH: lowerStraightTreadCount * riserH };
const planRightLivingSideStairRail = { x: stairLowXRunX, z: firstRunStart, d: insideZ1 - firstRunStart, h: 0.95 };
const planRightStairTurnWall = { x: stairLowXWallX, z: firstRunEnd, d: insideZ1 - firstRunEnd };
const winderZone = { x: stairClearX, z: turnStart, w: stairClearW, d: stairTurnD, y: firstWallY + (lowerStraightTreadCount + 2) * riserH - stairTreadH, h: stairTreadH };
const firstTread = { x: stairLowXRunX, z: firstRunStart, w: stairRunW, d: stairTreadDepth, y: firstWallY + riserH - stairTreadH, h: stairTreadH };
const finalTread = { x: stairHighXRunX, z: turnStart - upperStraightTreadCount * runGap, w: stairRunW, d: stairTreadDepth, y: firstWallY + (stairRiserCount - 1) * riserH - stairTreadH, h: stairTreadH };
const stairFrontFloor = { x: stairClearX, z: insideZ0, w: stairClearW, d: stairBottomLandingD };
const stairRoomFloor = { x: stairClearX, z: stairOpeningStart, w: stairClearW, d: insideZ1 - stairOpeningStart };
const familyDoorPath = { x: stairHighXRunX, z: familyDoorZ, w: stairRunW, d: firstRunStart - familyDoorZ };
const stairExit = { x: stairHighXRunX, z: familyDoorZ, w: stairHighXWallX - stairHighXRunX, d: stairBottomLandingD };
const firstLiving = { x: planRightLivingX, z: insideZ0, w: firstLivingW, d: layoutD };
const firstFamily = { x: planLeftFamilyX, z: insideZ0, w: firstFamilyW, d: firstFamilyD };
const secondRoom1 = { x: planRightLivingX, z: secondAtticZ, w: firstLivingW, d: secondAtticD };
const secondRoom2 = { x: stairHighXClearX, z: secondAtticZ, w: insideX1 - stairHighXClearX, d: secondAtticD };
const secondRoomDoor1 = { x: secondRoom1.x + (secondRoom1.w - interiorDoorW) / 2, z: secondAtticWallZ, w: interiorDoorW };
const secondRoomDoor2 = { x: secondRoom2.x + (secondRoom2.w - interiorDoorW) / 2, z: secondAtticWallZ, w: interiorDoorW };
const secondRoom1FrontWall = { x: secondRoom1.x, z: secondAtticWallZ, w: secondRoom1.w };
const secondRoom2FrontWall = { x: secondRoom2.x, z: secondAtticWallZ, w: secondRoom2.w };
const secondCorridorWindowW = 1.8;
const secondCorridorWindowH = 0.45;
const secondCorridorWindowSillOffset = 0.42;
const secondCorridorWindowTopOffset = secondCorridorWindowSillOffset + secondCorridorWindowH;
const secondCorridorWindow1 = { x: secondRoom1.x + (secondRoom1.w - secondCorridorWindowW) / 2, z: buildingFrontZ, w: secondCorridorWindowW, h: secondCorridorWindowH };
const secondCorridorWindow2 = { x: secondRoom2.x + (secondRoom2.w - secondCorridorWindowW) / 2, z: buildingFrontZ, w: secondCorridorWindowW, h: secondCorridorWindowH };
const atticRearWindowW = 2.0;
const atticRearWindowH = 0.45;
const atticRearWindowSillOffset = 0.42;
const atticRearWindowTopOffset = atticRearWindowSillOffset + atticRearWindowH;
const atticRoom1RearWindow = { x: secondRoom1.x + (secondRoom1.w - atticRearWindowW) / 2, z: insideZ1, w: atticRearWindowW, h: atticRearWindowH };
const atticRoom2RearWindow = { x: secondRoom2.x + (secondRoom2.w - atticRearWindowW) / 2, z: insideZ1, w: atticRearWindowW, h: atticRearWindowH };
const sideGableWindow = { z: buildingFrontZ + buildingD / 2, w: 1.0, h: 0.5, sillOffset: 0.35 };
const yardDeckH = 0.08;
const livingYardSash = { x: firstLiving.x + (firstLiving.w - 2.35) / 2, z: buildingFrontZ, w: 2.35, h: 2.1, sillY: firstWallY + yardDeckH };
const familyYardSash = { x: firstFamily.x + (firstFamily.w - 2.35) / 2, z: buildingFrontZ, w: 2.35, h: 2.1, sillY: firstWallY + yardDeckH };
const livingRearWindow = { x: firstLiving.x + (firstLiving.w - 2.35) / 2, z: insideZ1, w: 2.35, h: 0.75, sillY: firstWallY + 1.15 };
const familyRearWindow = { x: firstFamily.x + (firstFamily.w - 1.8) / 2, z: insideZ1, w: 1.8, h: 1.2, sillY: firstWallY + 0.9 };
const kitchenSink = { x: firstLiving.x + (firstLiving.w - 2.2) / 2, z: insideZ1 - 0.6, w: 2.2, d: 0.6, h: 0.85 };
const familyRoadWindow = { x: insideX1, z: firstFamily.z + (firstFamily.d - 1.8) / 2, d: 1.8, h: 1.2, sillY: firstWallY + 0.9 };
const yardDeck = { x: insideX0, z: buildingFrontZ - 0.48, w: insideX1 - insideX0, d: 0.42, y: firstWallY, h: yardDeckH };
const secondWallY = secondY + floorThickness;
const secondWallTop = secondY + floorThickness + secondWallHeight;
const sideGableWindowBottomY = secondWallTop + sideGableWindow.sillOffset;
const sideGableWindowTopY = sideGableWindowBottomY + sideGableWindow.h;
const sideGableWindowZ0 = sideGableWindow.z - sideGableWindow.w / 2;
const sideGableWindowZ1 = sideGableWindow.z + sideGableWindow.w / 2;
const gableRidgeTop = secondWallTop + gableRise;
const outerEaveY = secondWallTop - roofSlopeTan * roofEaveOverhang;

function roofRiseAtZ(z) {
  const ridgeZ = buildingFrontZ + buildingD / 2;
  const halfDepth = buildingD / 2;
  return roofSlopeTan * Math.max(0, halfDepth - Math.abs(z - ridgeZ));
}

const secondAtticFrontWallH = secondWallHeight + roofRiseAtZ(secondAtticWallZ);
const secondAtticSideWallFrontH = secondWallHeight + roofRiseAtZ(secondAtticWallZ);
const secondAtticSideWallMaxH = secondWallHeight + gableRise;
const secondAtticSideWallRearH = secondWallHeight + roofRiseAtZ(insideZ1);
const secondAtticDoorH = 1.8;

// 데크 계단 — 1단 높이(riser)는 17cm를 넘지 않는다(단수는 ceil로 자동 산정). main.js와 동일 식.
const deckFoundationH = 0.4;
const deckFinishT = 0.04;
const deckStairTopY = groundTopY + deckFoundationH + deckFinishT;
const deckStairSteps = Math.max(1, Math.ceil((deckStairTopY - groundTopY) / 0.17));
const deckStairRise = (deckStairTopY - groundTopY) / deckStairSteps;

// ── s2(3층) 1층 좌측벽: 주방 콘센트 ↔ 좌측 폴딩창 충돌 감사 ──
// main.js와 동일하게 재도출(감사 방식 그대로 — 단일출처 리팩터는 후속 과제).
// 벽부착 부재를 개구부에 그려도 아무 경고 없이 통과하던 구멍을 막는다.
const s2WallT = 0.3;
const s2W = 8.5;
const s2BackZ = 3.3;
const s2D = 6.0;                              // main.js s2D 단일출처값
const s2FrontZ = s2BackZ - s2D;               // -2.7
const s2MatH = 0.5, s2SlabT = 0.2;
const s2F1Top = groundTopY + s2MatH + s2SlabT;   // 1층 바닥 윗면 0.78
const s2LeftInnerX = s2W - s2WallT;           // 좌측(高x) 외벽 안쪽 면 8.2
// 좌측 폴딩창(2+2 양개) — 벽 중앙 배치
const s2FoldH = 2.4;
const s2FoldCz = (s2FrontZ + s2BackZ) / 2;    // 0.3
const s2FoldGap = 4 * 0.68;                    // 2.72
const s2FoldWin = {
  a0: s2FoldCz - s2FoldGap / 2, a1: s2FoldCz + s2FoldGap / 2,   // z -1.06..1.66
  y0: groundTopY + 1.7, y1: s2F1Top + s2FoldH,                  // y 1.78..3.18
};
// 주방 콘센트 4개(플레이트 박스: z±0.065, y..+0.15) — main.js inOutlet과 동일 좌표
const s2SinkCz = ((s2FrontZ + s2WallT) + (s2BackZ - s2WallT)) / 2;   // 0.3(=폴딩창 중심)
const s2InB = s2BackZ - s2WallT;
const s2FoldHalf = s2FoldGap / 2, s2JambGap = 0.12;                  // 폴딩창 반폭 + 창틀 밖 여유
const s2Outlet = (cz, oy) => ({ a0: cz - 0.065, a1: cz + 0.065, y0: oy, y1: oy + 0.15 });
const s2KitchenOutlets = [
  { name: 's2 주방 콘센트(창 앞쪽 옆)', kind: 'counter', r: s2Outlet(s2SinkCz - s2FoldHalf - s2JambGap, s2F1Top + 1.1) },
  { name: 's2 주방 콘센트(창 뒤쪽 옆)', kind: 'counter', r: s2Outlet(s2SinkCz + s2FoldHalf + s2JambGap, s2F1Top + 1.1) },
  { name: 's2 주방 콘센트(양문형 냉장고 자리)', kind: 'appliance', r: s2Outlet((s2FrontZ + s2WallT) + 1.1 / 2, s2F1Top + 1.85) },
  { name: 's2 주방 콘센트(기존 냉장고 자리)', kind: 'appliance', r: s2Outlet((s2InB - 0.05) - 0.545 / 2, s2F1Top + 1.85) },
];
// 방 용도별 콘센트 높이 표준(바닥 기준) — 틀린 높이는 커밋을 막는다. "말로 앞으로"가 아니라 게이트로 강제.
const OUTLET_HEIGHT_BANDS = {
  general: { lo: 0.25, hi: 0.35, label: '거실·침실 일반(바닥+0.30m)' },
  counter: { lo: 1.00, hi: 1.20, label: '주방 상판(바닥+1.10m)' },
  appliance: { lo: 1.70, hi: 1.90, label: '가전 전용(바닥+1.85m)' },
};
function outletHeightOK(o, floorTop) {
  const h = o.r.y0 - floorTop;
  const band = OUTLET_HEIGHT_BANDS[o.kind];
  const ok = h >= band.lo - EPS && h <= band.hi + EPS;
  return { label: `${o.name} 높이는 ${band.label} 표준 대역이어야 함`, ok, actual: `바닥+${h.toFixed(2)}m`, expected: `${band.lo}~${band.hi}m` };
}
// 우측(거실측) 벽 콘센트 ↔ 우측 슬라이드창 충돌 감사
const s2RGap = 4 * 0.8, s2FdColT = 0.3;
const s2RoA0 = s2FrontZ + s2WallT + s2FdColT;
const s2SlideWin = { a0: s2RoA0, a1: s2RoA0 + s2RGap, y0: groundTopY + 1.7, y1: s2F1Top + s2FoldH };
const s2RightOutlets = [
  { name: 's2 거실 콘센트(창 앞쪽 옆)', kind: 'general', r: s2Outlet(s2RoA0 - s2JambGap, s2F1Top + 0.3) },
  { name: 's2 거실 콘센트(창 뒤쪽 옆)', kind: 'general', r: s2Outlet(s2RoA0 + s2RGap + s2JambGap, s2F1Top + 0.3) },
];

const checks = [
  ...s2KitchenOutlets.map((o) => outsideOpening(o.r, s2FoldWin, `${o.name}은(는) 좌측 폴딩창 개구부 밖에 있어야 함`)),
  ...s2RightOutlets.map((o) => outsideOpening(o.r, s2SlideWin, `${o.name}은(는) 우측 슬라이드창 개구부 밖에 있어야 함`)),
  ...s2KitchenOutlets.map((o) => outletHeightOK(o, s2F1Top)),
  ...s2RightOutlets.map((o) => outletHeightOK(o, s2F1Top)),
  lte(deckStairRise, 0.17, 'deck stair riser height is at most 17cm'),
  approx(foundationHeight, 0.5, 'foundation concrete is 0.5m high'),
  approx(buildingW, 8.5, 'foundation width label is 8.5m'),
  approx(buildingD, 4.0, 'foundation depth label is 4.0m'),
  approx(buildingBackZ, 3.3, 'original rear wall remains at z=3.3m'),
  approx(buildingFrontZ, -0.7, 'front wall moves back 0.5m for 4.0m exterior depth'),
  approx(firstWallY, 0.58, '1F starts on top of 0.5m foundation above ground top'),
  approx(firstWallHeight, 2.6, '1F wall height is 2.6m'),
  approx(interiorDoorW, 0.9, 'interior room doors are 900mm wide'),
  approx(interiorDoorH, 2.1, 'interior room doors are 2100mm high'),
  approx(secondAtticDoorH, 1.8, '2F attic pocket sliding doors are 1800mm high'),
  lte(secondAtticDoorH, secondAtticFrontWallH, '2F attic pocket sliding doors fit below the gable-height attic front wall'),
  approx(stairGuardWallH, 1.1, 'open stair sides use 1.1m solid stair wall height'),
  approx(interiorWall, 0.1, 'interior partition wall thickness is 100mm'),
  approx(firstFamily.x, planLeftFamilyX, 'plan-left room is the family room'),
  approx(firstLiving.x, planRightLivingX, 'plan-right room is the living+kitchen'),
  gte(firstFamily.x, firstLiving.x + firstLiving.w + stairClearW, 'family room stays on plan-left, which is high-x in this model'),
  lte(firstLiving.x + firstLiving.w, stairClearX, 'living+kitchen stays on plan-right, which is low-x in this model'),
  approx(firstLiving.w, 2.9, '1F living+kitchen width is 2.9m with 1000mm stair runs'),
  approx(firstLiving.d, 3.6, '1F living+kitchen depth is 3.6m after reducing the front side'),
  approx(firstFamily.w, 2.9, '1F family room width matches living+kitchen at 2.9m'),
  approx(firstFamily.d, 3.6, '1F family room uses the reduced full 3.6m inside depth'),
  approx(livingYardSash.w, 2.35, 'living yard-side exit sash width is 2.35m'),
  approx(livingYardSash.h, 2.1, 'living yard-side exit sash height is 2.1m'),
  approx(livingYardSash.sillY, firstWallY + yardDeckH, 'living yard-side exit sash starts above the deck top'),
  approx(livingYardSash.z, buildingFrontZ, 'living exit sash is on the yard-side exterior wall'),
  approx(familyYardSash.w, 2.35, 'family yard-side exit sash width is 2.35m'),
  approx(familyYardSash.h, 2.1, 'family yard-side exit sash height is 2.1m'),
  approx(familyYardSash.sillY, firstWallY + yardDeckH, 'family yard-side exit sash starts above the deck top'),
  approx(familyYardSash.z, buildingFrontZ, 'family exit sash is on the yard-side exterior wall'),
  gte(livingYardSash.x, firstLiving.x, 'living yard-side sash stays inside living width'),
  lte(livingYardSash.x + livingYardSash.w, firstLiving.x + firstLiving.w, 'living yard-side sash does not extend beyond living width'),
  gte(familyYardSash.x, firstFamily.x, 'family yard-side sash stays inside family width'),
  lte(familyYardSash.x + familyYardSash.w, firstFamily.x + firstFamily.w, 'family yard-side sash does not extend beyond family width'),
  approx(livingRearWindow.w, 2.35, 'living rear window width is 2.35m'),
  approx(livingRearWindow.h, 0.75, 'living rear window height is reduced to 0.75m above the sink'),
  approx(livingRearWindow.sillY - firstWallY, 1.15, 'living rear window sill is 1.15m above 1F floor over the sink'),
  approx(livingRearWindow.z, insideZ1, 'living rear window is on rear exterior wall'),
  approx(familyRearWindow.w, 1.8, 'family rear window width is 1.8m'),
  approx(familyRearWindow.h, 1.2, 'family rear window height is 1.2m'),
  approx(familyRearWindow.sillY - firstWallY, 0.9, 'family rear window sill is 0.9m above 1F floor'),
  approx(familyRearWindow.z, insideZ1, 'family rear window is on rear exterior wall'),
  gte(familyRearWindow.x, firstFamily.x, 'family rear window stays inside family room width'),
  lte(familyRearWindow.x + familyRearWindow.w, firstFamily.x + firstFamily.w, 'family rear window does not extend beyond family room width'),
  approx(kitchenSink.w, 2.2, 'living kitchen sink width is 2.2m'),
  approx(kitchenSink.d, 0.6, 'living kitchen sink depth is 0.6m'),
  approx(kitchenSink.h, 0.85, 'living kitchen sink counter height is 0.85m'),
  approx(kitchenSink.z + kitchenSink.d, insideZ1, 'living kitchen sink is against the rear/up wall'),
  gte(livingRearWindow.sillY - firstWallY, kitchenSink.h + 0.25, 'rear window sill clears the sink counter'),
  gte(kitchenSink.x, firstLiving.x, 'living kitchen sink stays inside living width'),
  lte(kitchenSink.x + kitchenSink.w, firstLiving.x + firstLiving.w, 'living kitchen sink does not extend beyond living width'),
  approx(familyRoadWindow.d, 1.8, 'family road-side window width is 1.8m'),
  approx(familyRoadWindow.h, 1.2, 'family road-side window height is 1.2m'),
  approx(familyRoadWindow.sillY - firstWallY, 0.9, 'family road-side window sill is 0.9m above 1F floor'),
  approx(familyRoadWindow.x, insideX1, 'family road-side window is on road-side exterior wall'),
  gte(familyRoadWindow.z, firstFamily.z, 'family road-side window stays inside family room depth'),
  lte(familyRoadWindow.z + familyRoadWindow.d, firstFamily.z + firstFamily.d, 'family road-side window does not extend beyond family room depth'),
  approx(yardDeck.x, insideX0, 'yard deck starts at the low-x inner exterior face'),
  approx(yardDeck.x + yardDeck.w, insideX1, 'yard deck reaches the high-x inner exterior face'),
  approx(yardDeck.h, 0.08, 'yard deck thickness is 80mm'),
  approx(yardDeck.y + yardDeck.h, livingYardSash.sillY, 'yard deck top aligns with raised exit sash bottoms'),
  approx(stairRunW, 1.0, 'stair clear run width is 1000mm'),
  approx(stairTreadDepth, 0.27, 'stair tread depth is 270mm'),
  approx(floorThickness, 0.15, '2F floor slab thickness is 150mm'),
  approx(riserH, 0.171875, 'stair riser height is 171.875mm with 16 risers', 0.0001),
  approx(stairRiserCount, 16, 'stair uses 16 risers'),
  approx(lowerStraightTreadCount, 6, 'winder stair lower straight run uses 6 treads'),
  approx(winderTreadCount, 3, 'winder stair uses 3 turning treads'),
  approx(upperStraightTreadCount, 6, 'winder stair upper straight run uses 6 treads'),
  approx(lowerStraightTreadCount, upperStraightTreadCount, 'winder stair straight runs are symmetric'),
  approx(stairOpeningStart - insideZ0, stairBottomLandingD, 'front bottom landing uses the remaining front space'),
  approx(stairFrontFloor.d, stairBottomLandingD, 'stair-front floor depth matches remaining front space'),
  approx(stairRoomFloor.d, insideZ1 - stairOpeningStart, 'winder stair room starts after the front floor'),
  approx(stairFrontFloor.z + stairFrontFloor.d, stairRoomFloor.z, 'stair-front floor touches U stair room without overlap'),
  approx(stairFrontFloor.d + stairRoomFloor.d, insideZ1 - insideZ0, 'separated stair areas fill the original stair bay depth'),
  approx(winderZone.w, 2.1, 'winder stair turning zone is 2.1m wide'),
  approx(winderZone.d, 1.0, 'winder stair turning zone is 1.0m deep'),
  approx(stairBath.x, stairHighXRunX, 'under-stair WC sits below the plan-left family-side stair run'),
  approx(stairBath.w, 1.0, 'under-stair WC uses the 1.0m stair width'),
  approx(stairBath.d, 1.62, 'under-stair WC uses the straight-run depth below six 270mm treads'),
  approx(stairBathFrontWall.x, stairBath.x, 'under-stair WC front wall starts at the WC low-x edge'),
  approx(stairBathFrontWall.z, stairBath.z, 'under-stair WC front wall is on the entrance-facing side'),
  approx(stairBathFrontWall.w, stairBath.w, 'under-stair WC front wall spans the stair-run width'),
  approx(stairBathFrontWall.h, firstWallHeight, 'under-stair WC front wall closes up to the 1F wall height'),
  approx(stairBathDoorHeader.x, stairBathDoor.x, 'under-stair WC has wall above the front door'),
  approx(stairBathDoorHeader.w, stairBathDoor.w, 'under-stair WC door header spans the door opening'),
  approx(stairBathDoorHeader.h, firstWallHeight - stairBathDoor.h, 'under-stair WC door header closes the gap above the door'),
  approx(stairBathDoor.x, stairBath.x + 0.05, 'under-stair WC standard door is centered on the entrance-facing front wall'),
  approx(stairBathDoor.z, stairBath.z, 'under-stair WC door opens from the stair-front area'),
  approx(stairBathDoor.w, interiorDoorW, 'under-stair WC door opening uses the standard 900mm width'),
  gte(stairBathDoor.x, stairBath.x, 'under-stair WC front door starts inside the WC width'),
  lte(stairBathDoor.x + stairBathDoor.w, stairBath.x + stairBath.w, 'under-stair WC front door ends inside the WC width'),
  approx(stairBathDoor.h, interiorDoorH, 'under-stair WC door uses the standard 2100mm height'),
  approx(extendedStairBathWall.x, stairHighXWallX, '1F stair/bath wall uses the bathroom stair-side edge'),
  approx(extendedStairBathWall.z, stairOpeningStart, '1F stair/bath wall extends forward to stair-room start'),
  approx(extendedStairBathWall.z + extendedStairBathWall.d, insideZ1, '1F stair/family-side wall reaches the rear inner wall'),
  approx(stairCenterWall.x, stairLowXRunX + stairRunW, 'solid center stair wall starts at first run open edge'),
  approx(stairCenterWall.x + stairCenterWall.w, stairHighXRunX, 'solid center stair wall ends at second run open edge'),
  approx(stairCenterWall.w, stairGap, 'solid center stair wall fills the gap between stair flights'),
  approx(stairCenterWall.d, insideZ1 - stairOpeningStart, 'solid center stair wall runs along the stair opening zone'),
  approx(stairCenterLowWall.h, 2.58, 'center wall stops at the upper stair height, not at guard height'),
  approx(centerRailHeight, 0.92, 'center stair guard is a rail above the low wall'),
  approx(Number(firstLivingStairWallRemoved), 1, '1F living/stair partition wall is removed'),
  approx(planRightLowerSteppedWall.x, stairLowXWallX, 'plan-right living/stair stepped wall sits on the living-side boundary'),
  approx(planRightLowerSteppedWall.z, firstRunStart, 'plan-right living/stair stepped wall starts at the first tread'),
  approx(planRightLowerSteppedWall.d, firstRunEnd - firstRunStart, 'plan-right living/stair stepped wall follows only the lower stair run'),
  approx(planRightLowerSteppedWall.firstH, riserH, 'plan-right living/stair stepped wall starts at one riser high'),
  approx(planRightLowerSteppedWall.lastH, lowerStraightTreadCount * riserH, 'plan-right living/stair stepped wall follows the lower run height'),
  approx(planRightStairTurnWall.x, stairLowXWallX, 'plan-right stair turn wall stays on the living+kitchen side'),
  approx(planRightStairTurnWall.z, firstRunEnd, 'plan-right stair turn wall starts only at the rear turn'),
  approx(planRightLivingSideStairRail.x, stairClearX, 'plan-right living-side stair rail sits on the open stair edge'),
  approx(planRightLivingSideStairRail.h, 0.95, 'plan-right living-side stair rail stays open after removing the wall'),
  approx(secondCorridor.x, insideX0, '2F corridor starts at the plan-right inner exterior wall'),
  approx(secondCorridor.x + secondCorridor.w, insideX1, '2F corridor reaches the plan-left inner exterior wall'),
  approx(secondArrivalFloor.d, stairBottomLandingD, '2F corridor uses the stair arrival depth'),
  approx(secondArrivalFloor.w, insideX1 - insideX0, '2F corridor spans the full inside width'),
  approx(secondCorridorWindow1.w, 1.8, '2F corridor plan-right window is 1.8m wide'),
  approx(secondCorridorWindow2.w, 1.8, '2F corridor plan-left window is 1.8m wide'),
  approx(secondCorridorWindow1.h, 0.45, '2F corridor plan-right window height fits the 1.15m wall'),
  approx(secondCorridorWindow2.h, 0.45, '2F corridor plan-left window height fits the 1.15m wall'),
  approx(secondCorridorWindowSillOffset, 0.42, '2F corridor window sill is 420mm above the corridor floor'),
  lte(secondCorridorWindowTopOffset, secondWallHeight, '2F corridor window top stays below the 1.15m front wall'),
  approx(secondCorridorWindow1.z, buildingFrontZ, '2F corridor plan-right window is on the yard-side exterior wall'),
  approx(secondCorridorWindow2.z, buildingFrontZ, '2F corridor plan-left window is on the yard-side exterior wall'),
  gte(secondCorridorWindow1.x, secondRoom1.x, '2F corridor plan-right window stays inside the side bay width'),
  lte(secondCorridorWindow1.x + secondCorridorWindow1.w, secondRoom1.x + secondRoom1.w, '2F corridor plan-right window does not extend beyond side bay width'),
  gte(secondCorridorWindow2.x, secondRoom2.x, '2F corridor plan-left window stays inside the side bay width'),
  lte(secondCorridorWindow2.x + secondCorridorWindow2.w, secondRoom2.x + secondRoom2.w, '2F corridor plan-left window does not extend beyond side bay width'),
  approx(secondAtticWallZ, stairOpeningStart, '2F attic front walls align with the stair opening edge'),
  approx(secondRoom1.x, planRightLivingX, '2F attic room1 stays on the living side'),
  approx(secondRoom1.z, secondAtticZ, '2F attic room1 starts behind the long corridor wall'),
  approx(secondRoom1.w, 2.9, '2F attic room1 width is 2.9m'),
  approx(secondRoom1.d, 2.52, '2F attic room1 depth is reduced behind the 0.98m corridor'),
  approx(secondRoom2.x, stairHighXWallX + interiorWall, '2F attic room2 starts directly after the stair wall'),
  approx(secondRoom2.z, secondAtticZ, '2F attic room2 starts behind the long corridor wall'),
  approx(secondRoom2.w, 2.9, '2F attic room2 width matches the opposite side attic room'),
  approx(secondRoom2.d, 2.52, '2F attic room2 depth is reduced behind the 0.98m corridor'),
  approx(secondRoomDoor1.w, 0.9, '2F attic room1 door remains 900mm wide'),
  approx(secondRoomDoor2.w, 0.9, '2F attic room2 door remains 900mm wide'),
  approx(atticRoom1RearWindow.w, 2.0, '2F attic room1 rear window is a wide 2.0m sash'),
  approx(atticRoom2RearWindow.w, 2.0, '2F attic room2 rear window is a wide 2.0m sash'),
  approx(atticRoom1RearWindow.h, 0.45, '2F attic room1 rear window height fits the 1.15m eave wall'),
  approx(atticRoom2RearWindow.h, 0.45, '2F attic room2 rear window height fits the 1.15m eave wall'),
  approx(atticRoom1RearWindow.z, insideZ1, '2F attic room1 rear window is on the rear exterior wall'),
  approx(atticRoom2RearWindow.z, insideZ1, '2F attic room2 rear window is on the rear exterior wall'),
  approx(atticRearWindowSillOffset, 0.42, '2F attic rear window sill is 420mm above the attic floor'),
  lte(atticRearWindowTopOffset, secondWallHeight, '2F attic rear window top stays below the 1.15m rear wall'),
  gte(atticRoom1RearWindow.x, secondRoom1.x, '2F attic room1 rear window stays inside room width'),
  lte(atticRoom1RearWindow.x + atticRoom1RearWindow.w, secondRoom1.x + secondRoom1.w, '2F attic room1 rear window does not extend beyond room width'),
  gte(atticRoom2RearWindow.x, secondRoom2.x, '2F attic room2 rear window stays inside room width'),
  lte(atticRoom2RearWindow.x + atticRoom2RearWindow.w, secondRoom2.x + secondRoom2.w, '2F attic room2 rear window does not extend beyond room width'),
  approx(secondAtticFrontWallH, 1.916, '2F attic front walls rise to the gable roof height at the corridor edge', 0.01),
  approx(secondAtticSideWallFrontH, secondAtticFrontWallH, '2F stair-side attic walls start at the same gable height as the attic front walls'),
  approx(secondAtticSideWallMaxH, 2.449, '2F stair-side attic walls follow the gable up to the ridge height', 0.01),
  approx(secondAtticSideWallRearH, 1.28, '2F stair-side attic walls follow the gable back down near the rear wall', 0.01),
  approx(stairOpening.x, stairClearX, '2F stair opening starts at the low-x stair bay edge'),
  approx(stairOpening.z, stairOpeningStart, '2F stair opening begins after the long corridor'),
  separatedOrTouching(secondArrivalFloor.z, secondArrivalFloor.z + secondArrivalFloor.d, stairOpening.z, stairOpening.z + stairOpening.d, '2F arrival floor does not cover stair opening in z'),
  separatedOrTouching(secondRoom2.x, secondRoom2.x + secondRoom2.w, stairOpening.x, stairOpening.x + stairOpening.w, '2F room2 does not cover stair opening in x'),
  approx(interiorDoorW, 0.9, '2F room door openings use 900mm door width'),
  approx(secondWallHeight, 1.15, '2F wall height is 1.15m'),
  approx(secondWallTop, 4.48, '2F exterior wall top is 1.15m above 150mm 2F slab'),
  approx(sideGableWindow.w, 1.0, 'side gable windows are 1.0m wide'),
  approx(sideGableWindow.h, 0.5, 'side gable windows are 0.5m high'),
  approx(sideGableWindow.sillOffset, 0.35, 'side gable window sill starts 350mm above the gable base'),
  approx(sideGableWindow.z, buildingFrontZ + buildingD / 2, 'side gable windows are centered under the ridge'),
  gte(sideGableWindowZ0, buildingFrontZ, 'side gable window front edge stays inside the gable wall'),
  lte(sideGableWindowZ1, buildingBackZ, 'side gable window rear edge stays inside the gable wall'),
  lte(sideGableWindowTopY, secondWallTop + roofRiseAtZ(sideGableWindowZ0), 'side gable window top fits below the front roof slope'),
  lte(sideGableWindowTopY, secondWallTop + roofRiseAtZ(sideGableWindowZ1), 'side gable window top fits below the rear roof slope'),
  approx(Math.atan(gableRise / (buildingD / 2)) * 180 / Math.PI, 33, 'gable roof pitch is 33 degrees', 0.05),
  approx(roofSideOverhang, 0.4, 'gable roof left/right eaves are 400mm'),
  approx(roofEaveOverhang, 0.6, 'gable roof front/back eaves are 600mm'),
  approx(roofThickness, 0.26, 'roof is modeled as a 260mm thick slab'),
  approx(gableRise, 1.299, 'gable rise is calculated from 33 degree pitch over half the 4.0m depth', 0.01),
  approx(gableRidgeTop, 5.779, 'gable ridge height uses 33 degree rise above 1.15m 2F wall', 0.01),
  approx(secondWallTop - outerEaveY, roofSlopeTan * roofEaveOverhang, 'roof front/back eaves keep the same 33 degree slope line'),
  approx(stairLowXWallX + interiorWall, stairClearX, 'stair low-x wall touches stair clear width without overlap'),
  approx(stairHighXWallX, stairClearX + stairClearW, 'stair high-x wall touches stair clear width without overlap'),
  approx(exteriorWall, 0.2, 'exterior wall thickness is 200mm'),
  approx(insideX0, 0.2, 'low-x inner exterior face is 0.2m from the outer face'),
  approx(insideX1, 8.3, 'high-x inner exterior face is 0.2m from the outer face'),
  approx(firstTread.x, stairClearX, 'first stair flight starts on the plan-right/living side'),
  gte(firstTread.z, familyDoorPath.z + familyDoorPath.d, 'first tread starts after family-door standing path'),
  approx(winderZone.z + winderZone.d, insideZ1, 'rear winder zone touches the inner face of the rear exterior wall'),
  approx(finalTread.z, secondArrivalFloor.z + secondArrivalFloor.d, 'final tread begins exactly at the 2F arrival floor edge'),
  approx(finalTread.y + finalTread.h, secondY + floorThickness - riserH, 'final tread top is one riser below 2F floor top'),
  approx(secondY + floorThickness - (finalTread.y + finalTread.h), riserH, 'final tread to 2F floor is one riser'),
  approx(firstTread.y + firstTread.h, firstWallY + riserH, 'first stair tread rises one riser from 1F floor'),
  gte(stairExit.x, secondArrivalFloor.x, 'stair exit path is inside 2F arrival floor x-min'),
  lte(stairExit.x + stairExit.w, secondArrivalFloor.x + secondArrivalFloor.w, 'stair exit path is inside 2F arrival floor x-max'),
  gte(stairExit.z, secondArrivalFloor.z, 'stair exit path is inside 2F arrival floor z-min'),
  lte(stairExit.z + stairExit.d, secondArrivalFloor.z + secondArrivalFloor.d, 'stair exit path is inside 2F arrival floor z-max'),
  separatedOrTouching(frontGuard.x, frontGuard.x + frontGuard.w, stairExit.x, stairExit.x + stairExit.w, 'front stair wall does not block stair exit width'),
  approx(frontGuard.z + frontGuard.d / 2, secondArrivalFloor.z + secondArrivalFloor.d, 'front stair wall sits on the open edge of 2F arrival floor'),
  approx(frontGuard.x, stairClearX, 'front stair wall starts from stair-wall side without a fall gap', 0.02),
  approx(frontGuard.x + frontGuard.w, stairExit.x, 'front stair wall stops before the stair arrival', 0.02),
  approx(frontGuard.h, stairGuardWallH, 'front stair wall uses the same solid wall height'),
  approx(stairRoom1Wall.x, stairLowXWallX, '2F stair/room1 wall sits on the stairwell side'),
  approx(stairRoom1Wall.w, interiorWall, '2F stair/room1 wall shows 100mm interior-wall thickness'),
  approx(stairRoom1Wall.z, secondAtticWallZ, '2F stair/room1 wall starts behind the corridor'),
  approx(stairRoom1Wall.z + stairRoom1Wall.d, insideZ1, '2F stair/room1 wall reaches the rear inner wall'),
  approx(secondAtticSideWallMaxH, secondWallHeight + gableRise, '2F stair/room1 wall follows the gable profile to ridge height'),
  approx(stairRoom2Wall.x, stairHighXWallX, '2F stair/room2 wall sits on the stairwell side'),
  approx(stairRoom2Wall.w, interiorWall, '2F stair/room2 wall shows 100mm interior-wall thickness'),
  approx(stairRoom2Wall.z, secondAtticWallZ, '2F stair/room2 wall starts behind the corridor'),
  approx(stairRoom2Wall.z + stairRoom2Wall.d, insideZ1, '2F stair/room2 wall reaches the rear inner wall'),
  approx(secondAtticSideWallMaxH, secondWallHeight + gableRise, '2F stair/room2 wall follows the gable profile to ridge height')
];

let failed = false;
for (const result of checks) {
  console.log(`${result.ok ? 'OK' : 'FAIL'} ${result.label} | actual ${result.actual} | expected ${result.expected}`);
  if (!result.ok) failed = true;
}

if (failed) process.exit(1);
