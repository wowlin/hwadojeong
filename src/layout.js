// layout.js — main.js에서 추출한 순수 파생 레이아웃 값(상수로부터 계산, 사이드이펙트 없음).
// 의존: constants.js만. scene/THREE/materials/빌드순서에 얽힌 값은 main.js에 그대로 둠.

import {
  buildingBackZ, buildingD, groundTopY, foundationHeight, floorFinishH, matFoundationH, deckPedestalH, deckFinishT,
  neighborSetback, hedgeBoundaryGap, lotW, lotD, exteriorWall, buildingW, interiorWall,
  stairRunW, lowerStraightTreadCount, upperStraightTreadCount,
  stairTreadDepth, interiorDoorW, firstWallHeight, kitchenSinkD, kitchenSinkH, secondFloorThickness, secondWallHeight, FRAME_ROOM_W, atticCorridorWallT,
  roofSlopeDeg
} from './constants.js';

// s1 지붕 경사 파생값 — 지붕·박공벽·다락 내벽·태양광이 공유(main.js에서 이동).
export const roofSlopeTan = Math.tan(roofSlopeDeg * Math.PI / 180);
export const gableRise = roofSlopeTan * (buildingD / 2);
// 그 z의 박공지붕 상승(무릎벽 상단 기준) — 용마루(깊이 중앙)에서 최고, 앞·뒤 벽에서 0.
export function roofRiseAtZ(z) {
  const halfDepth = buildingD / 2;
  return roofSlopeTan * Math.max(0, halfDepth - Math.abs(z - atticRidgeZ));   // 용마루 z 단일 출처(#20)
}
// 평면(높이 0 취급) 표시 두께 — 대지 위 살짝 띄워 깜빡임만 막음(발자국·기준선 공유).
export const planY = 0.003;
export const planH = 0.002;

export const buildingFrontZ = buildingBackZ - buildingD;   // 정면(북) 외벽 Z — 깊이 상수로 파생(=-0.7)
export const foundationTopY = groundTopY + foundationHeight;   // 말뚝 두부 상단 = 바닥재 하단(groundTopY+foundationHeight)
export const firstFloorY = foundationTopY + floorFinishH; // 1층 바닥 표면 = 기초 윗면 + 바닥두께(20cm)
export const deckSurfaceY = groundTopY + matFoundationH + deckPedestalH + deckFinishT;   // 데크 밟는 표면 = 온통기초(matFoundationH)+페데스탈(deckPedestalH)+포세린(deckFinishT). 실내 바닥(firstFloorY)과의 단차는 파생값.
export const lotX0 = -neighborSetback;         // 주방(저X) 외벽(x=0)에서 옆집 이격만큼 — 고정 이격에서 파생
export const lotX1 = lotX0 + lotW;
export const lotZ1 = buildingBackZ + hedgeBoundaryGap;   // 후면 경계 = 집 뒤 + 측백 경계 이격(고정 상수)
export const lotZ0 = lotZ1 - lotD;             // 전면 경계
export const firstWallY = firstFloorY;
export const insideX0 = exteriorWall;
export const insideZ0 = buildingFrontZ + exteriorWall;
export const insideX1 = buildingW - exteriorWall;
export const insideZ1 = buildingBackZ - exteriorWall;
export const insideD = insideZ1 - insideZ0;
export const planRightKitchenX = insideX0;
// 계단실 양쪽 내벽(주방|계단실 · 계단실|안방) — 중심 위치·두께를 1층/계단/다락 화면이 공유하는 단일 기준.
// 방 바닥은 이 내벽의 안쪽 면까지만 채워 겹침이 없고, 두께·위치가 바뀌면 방 너비가 따라 갱신된다.
export const innerWallW = interiorWall;                                       // 계단실 내벽 두께(가변)
export const familyInnerWallW = 0.20;                                         // 계단실|안방 내력벽 두께 20cm — 말뚝 중심(familyInnerWallX)에 정렬, 양쪽으로 ±10cm
export const familyInnerWallX = buildingW - exteriorWall / 2 - FRAME_ROOM_W;  // 계단실|안방 내벽 중심 X
// 계단실 안목(clear) = 두 내벽의 계단쪽 면 사이 — 1층 벽선 단일 출처(1층·계단·다락 공유, 격자 어긋남 방지).
export const stairHighXWallX = familyInnerWallX - familyInnerWallW / 2;       // 안방측 내력벽 계단면(=계단실 안목 끝)
// 계단 두 런 — 양쪽 내벽 안쪽 면에 직접 붙임(단일 출처=벽). 벽 두께·위치가 바뀌면 런이 자동으로 벽에 붙어 따라온다.
export const stairLowXRunX = stairHighXWallX - 2 * stairRunW;                          // 하부런 = 상부런에 딱 붙임(런 사이 틈 0) — 두께차 자투리는 주방측 계단벽 옆 5cm 띠로
export const stairHighXRunX = familyInnerWallX - familyInnerWallW / 2 - stairRunW;    // 상부런 = 안방측 내력벽 안쪽 면(런폭만큼 안쪽)
export const firstKitchenD = insideD;   // 방 깊이 = 안목 깊이(별칭 사슬 layoutD·sideRoomD 제거 #23)
export const firstFamilyD = insideD;
export const firstKitchenX = planRightKitchenX;                                 // 주방 바닥 시작 = 우 외벽 안쪽 면
export const firstKitchenW = stairLowXRunX - firstKitchenX; // 주방 바닥 끝 = 계단 저X면(계단실 경계) — 주방측 막이를 계단실 안쪽에 넣어 벽이 없으므로 주방이 그 자리까지 확장
export const firstFamilyX = familyInnerWallX + familyInnerWallW / 2;          // 안방 바닥 시작 = 내력벽(20cm) 안쪽 면(겹침 없음)
export const firstFamilyW = insideX1 - firstFamilyX;                          // 안방 바닥 끝 = 좌 외벽 안쪽 면
export const familyDoorZ = insideZ0;
export const stairTurnD = 0.8;   // 계단참·사선 턴존 깊이(안전 하한 ≈ 3×디딤(stairTreadDepth) 선까지 줄임)
export const stairTurnStart = insideZ1 - stairTurnD;
export const stairFirstRunStart = stairTurnStart - stairTreadDepth * lowerStraightTreadCount;
export const stairOpeningStart = stairTurnStart - stairTreadDepth * upperStraightTreadCount;
export const stairBottomLandingD = stairOpeningStart - insideZ0;
export const stairBathX = stairHighXRunX;
export const stairBathZ = stairFirstRunStart;
export const stairBathW = stairRunW;
export const stairBathD = insideZ1 - stairBathZ;   // WC를 계단 턴 아래까지 늘려 뒤쪽 외벽에 맞붙임(파생)
export const kitchenSinkX = insideX0;   // 오른쪽(저X) 외벽에 붙임
export const kitchenSinkZ = insideZ1 - kitchenSinkD;   // 싱크대는 뒤쪽 벽으로(앞 입구 확보)
export const kitchenCounterY = firstFloorY + kitchenSinkH + 0.05;   // 싱크대 상판 높이(≈바닥+0.90)
export const rearWindowSideOffset = 0.6;   // 앞·뒤 외벽 미서기창 옆벽 이격(끝선) — 1층 창·다락 뒤 프로젝트창이 공유하는 단일 출처
export const secondRoom2X = stairHighXWallX + interiorWall;                      // 다락방2 안목 시작 = 계단실 내벽(10cm) 안쪽 — 내벽을 계단실에 딱 붙이고 방은 벽 안쪽부터
export const secondRoom2W = insideX1 - secondRoom2X;
export const secondCorridorX = insideX0;
export const secondCorridorZ = insideZ0;
export const secondCorridorW = insideX1 - insideX0;
export const secondCorridorD = stairBottomLandingD;
export const secondAtticWallZ = secondCorridorZ + secondCorridorD;
export const atticCorridorWallShift = atticCorridorWallT - interiorWall;        // 복도쪽 칸막이벽이 복도로 들어온 깊이(10→15면 0.05)
export const secondCorridorClearD = secondCorridorD - atticCorridorWallShift;    // 다락 복도 안목 깊이 = 구조폭 − 복도쪽 벽 확장분 (바닥 표시·라벨 단일 출처)
export const secondAtticZ = secondAtticWallZ + interiorWall;
export const secondAtticD = insideZ1 - secondAtticZ;
export const secondRoom1DoorX = planRightKitchenX + firstKitchenW - interiorDoorW - 0.40;   // 계단실 쪽 벽(1층 주방측 내벽면)에서 40cm 띄움
export const secondRoom2DoorX = secondRoom2X + 0.40;                                    // 계단실 쪽 벽(1층 안방측 내력벽면)에서 40cm 띄움
export const frontCornerDimX = buildingW + 0.04;
export const frontCornerDimZ = buildingBackZ + 0.12;
export const secondY = firstWallY + firstWallHeight;
export const deckFootprints = [];
export const firstCeilingY = secondY;
export const atticSecondWallTop = secondY + secondFloorThickness + secondWallHeight;
export const atticRidgeZ = buildingFrontZ + buildingD / 2;
