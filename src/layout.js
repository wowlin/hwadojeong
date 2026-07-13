// layout.js — main.js에서 추출한 순수 파생 레이아웃 값(상수로부터 계산, 사이드이펙트 없음).
// 의존: constants.js만. scene/THREE/materials/빌드순서에 얽힌 값은 main.js에 그대로 둠.

import {
  buildingBackZ, buildingD, groundTopY, foundationHeight, floorFinishH, deckFoundationH,
  matFoundationH, deckPedestalH, deckFinishT,
  neighborSetback, hedgeBoundaryGap, lotW, lotD, exteriorWall, buildingW, interiorWall,
  stairRunW, entryFrameOuterW, yardDeckH, lowerStraightTreadCount, upperStraightTreadCount,
  stairTreadDepth, interiorDoorW, interiorDoorH, firstWallHeight, yardSashW, yardSashH,
  familyWindowW, kitchenSinkD, kitchenSinkH, kitchenSinkW, kitchenRearWindowW, familyRearWindowW,
  sideDoorH, secondCorridorWindowSillOffset, secondCorridorWindowH, atticVentWindowW, atticSkyWindowW, atticRearWindowSillOffset,
  atticRearWindowH, atticRearWindowW, secondFloorThickness, secondWallHeight, frEaveOverhang, FRAME_ROOM_W, atticCorridorWallT
} from './constants.js';

export const buildingFrontZ = buildingBackZ - buildingD;   // 정면(북) 외벽 Z — 깊이 상수로 파생(=-0.7)
export const foundationTopY = groundTopY + foundationHeight;   // 말뚝 두부 상단(0.58) = 바닥재 하단
export const firstFloorY = foundationTopY + floorFinishH; // 1층 바닥 표면 = 기초 윗면 + 바닥두께(20cm)
export const deckTopY0 = groundTopY + deckFoundationH;   // 데크/썬룸 기초 상단(0.48) = 집 기초 상단(0.58)보다 0.1m 낮음
export const deckSurfaceY = groundTopY + matFoundationH + deckPedestalH + deckFinishT;   // 데크 밟는 표면 = 온통기초(0.5)+페데스탈(0.10)+포세린(0.02) = 0.62. 실내 바닥(0.7)보다 8cm 낮음.
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
export const layoutD = insideD;
export const stairGap = interiorWall;
export const sideRoomD = layoutD;
export const planRightKitchenX = insideX0;
// 계단실 양쪽 내벽(주방|계단실 · 계단실|안방) — 중심 위치·두께를 1층/계단/다락 화면이 공유하는 단일 기준.
// 방 바닥은 이 내벽의 안쪽 면까지만 채워 겹침이 없고, 두께·위치가 바뀌면 방 너비가 따라 갱신된다.
export const innerWallW = interiorWall;                                       // 계단실 내벽 두께(가변)
export const familyInnerWallW = 0.20;                                         // 계단실|안방 내력벽 두께 20cm — 말뚝 중심(familyInnerWallX)에 정렬, 양쪽으로 ±10cm
export const innerWallH = 2.4;                                                // 계단실 내벽 높이(=층고). 1층/계단 화면 공유. 윗면 = 다락 바닥 밑면.
export const kitchenInnerWallX = exteriorWall / 2 + FRAME_ROOM_W;              // 주방|계단실 내벽 중심 X
export const familyInnerWallX = buildingW - exteriorWall / 2 - FRAME_ROOM_W;  // 계단실|안방 내벽 중심 X
// 계단실 안목(clear) = 두 내벽의 계단쪽 면 사이 — 1층 벽선 단일 출처(1층·계단·다락 공유, 격자 어긋남 방지).
export const stairLowXWallX = kitchenInnerWallX - innerWallW / 2;              // 주방측 내벽 주방면
export const stairClearX = kitchenInnerWallX + innerWallW / 2;                 // 주방측 내벽 계단면(=계단실 안목 시작)
export const stairHighXWallX = familyInnerWallX - familyInnerWallW / 2;       // 안방측 내력벽 계단면(=계단실 안목 끝)
export const stairClearW = stairHighXWallX - stairClearX;                     // 계단실 안목 폭
export const stairHighXClearX = familyInnerWallX + familyInnerWallW / 2;      // 안방측 내력벽 안방면
export const planLeftFamilyX = stairHighXClearX;
export const sideRoomW = (insideX1 - insideX0 - stairClearW - interiorWall * 2) / 2;   // 레거시(현재 미사용, 참고용)
// 계단 두 런 — 양쪽 내벽 안쪽 면에 직접 붙임(단일 출처=벽). 벽 두께·위치가 바뀌면 런이 자동으로 벽에 붙어 따라온다.
export const stairLowXRunX = stairHighXWallX - 2 * stairRunW;                          // 하부런 = 상부런에 딱 붙임(런 사이 틈 0) — 두께차 자투리는 주방측 계단벽 옆 5cm 띠로
export const stairHighXRunX = familyInnerWallX - familyInnerWallW / 2 - stairRunW;    // 상부런 = 안방측 내력벽 안쪽 면(런폭만큼 안쪽)
export const firstKitchenD = sideRoomD;
export const firstFamilyD = sideRoomD;
export const firstKitchenX = planRightKitchenX;                                 // 주방 바닥 시작 = 우 외벽 안쪽 면
export const firstKitchenW = stairLowXRunX - firstKitchenX; // 주방 바닥 끝 = 계단 저X면(계단실 경계) — 주방측 막이를 계단실 안쪽에 넣어 벽이 없으므로 주방이 그 자리까지 확장
export const firstFamilyX = familyInnerWallX + familyInnerWallW / 2;          // 안방 바닥 시작 = 내력벽(20cm) 안쪽 면(겹침 없음)
export const firstFamilyW = insideX1 - firstFamilyX;                          // 안방 바닥 끝 = 좌 외벽 안쪽 면
export const entryGapStart = stairClearX + (stairClearW - entryFrameOuterW) / 2;
export const entryGapEnd = entryGapStart + entryFrameOuterW;
export const familyDoorZ = insideZ0;
export const yardSashSillY = firstFloorY + yardDeckH;
export const stairTurnD = 0.8;   // 계단참·사선 턴존 깊이(안전 하한 ≈ 3×디딤 0.27 = 0.81m 선까지 줄임)
export const stairTurnStart = insideZ1 - stairTurnD;
export const stairFirstRunStart = stairTurnStart - stairTreadDepth * lowerStraightTreadCount;
export const stairOpeningStart = stairTurnStart - stairTreadDepth * upperStraightTreadCount;
export const stairBottomLandingD = stairOpeningStart - insideZ0;
export const stairBathX = stairHighXRunX;
export const stairBathZ = stairFirstRunStart;
export const stairBathW = stairRunW;
export const stairBathD = insideZ1 - stairBathZ;   // WC를 계단 턴 아래까지 늘려 뒤쪽 외벽에 맞붙임(2.62m)
export const stairBathDoorW = interiorDoorW;
export const stairBathDoorX = stairBathX + (stairBathW - stairBathDoorW) / 2;
export const stairBathDoorEndX = stairBathDoorX + stairBathDoorW;
export const stairBathDoorH = interiorDoorH;
export const stairBathWallH = firstWallHeight;
export const kitchenYardSashX = firstKitchenX + (firstKitchenW - yardSashW) / 2;
export const yardSashTopY = yardSashSillY + yardSashH;
export const familyWindowX = firstFamilyX + (firstFamilyW - familyWindowW) / 2;
export const familyWindowSillY = firstFloorY + 0.9;
export const familyWindowTopY = yardSashTopY;
export const familyWindowH = familyWindowTopY - familyWindowSillY;   // ≈1.28m
export const entryDoorBaseY = firstWallY + yardDeckH;
export const kitchenSinkX = insideX0;   // 오른쪽(저X) 외벽에 붙임
export const kitchenSinkZ = insideZ1 - kitchenSinkD;   // 싱크대는 뒤쪽 벽으로(앞 입구 확보)
export const kitchenCounterY = firstFloorY + kitchenSinkH + 0.05;   // 싱크대 상판 높이(≈바닥+0.90)
export const kitchenRearWindowX = kitchenSinkX + (kitchenSinkW - kitchenRearWindowW) / 2;
export const kitchenRearWindowSillY = kitchenCounterY + 0.15;
export const kitchenRearWindowTopY = yardSashTopY;
export const kitchenRearWindowH = kitchenRearWindowTopY - kitchenRearWindowSillY;
export const familyRearWindowX = firstFamilyX + (firstFamilyW - familyRearWindowW) / 2;   // 안방 중앙
export const familyRearWindowSillY = firstFloorY + 0.9;     // 일반 창대(전면창과 동일)
export const familyRearWindowTopY = yardSashTopY;           // 윗선을 주방 싱크대 창·전면 개구부와 동일선(2.18)
export const familyRearWindowH = familyRearWindowTopY - familyRearWindowSillY;   // ≈1.28m
export const sideDoorZ = insideZ0 + 0.2;                        // 전면쪽(코너에서 0.2m 띄움)
export const sideDoorBaseY = firstFloorY;                       // 바닥에서 시작(출입)
export const sideDoorTopY = sideDoorBaseY + sideDoorH;
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
export const secondRoom1DoorX = planRightKitchenX + firstKitchenW - interiorDoorW - 0.60;   // 계단실 쪽 벽(1층 주방측 내벽면)에서 60cm 띄움
export const secondRoom2DoorX = secondRoom2X + 0.60;                                    // 계단실 쪽 벽(1층 안방측 내력벽면)에서 60cm 띄움
export const secondCorridorWindowTopOffset = secondCorridorWindowSillOffset + secondCorridorWindowH;
export const atticVentWindowX = (buildingW - atticVentWindowW) / 2;   // 정면 중앙
export const atticSkyWindowX = (stairClearX + stairHighXWallX) / 2 - atticSkyWindowW / 2;   // 계단실 가로 중앙
export const atticRearWindowTopOffset = atticRearWindowSillOffset + atticRearWindowH;
export const atticRoom1RearWindowX = planRightKitchenX + (firstKitchenW - atticRearWindowW) / 2;
export const atticRoom2RearWindowX = secondRoom2X + (secondRoom2W - atticRearWindowW) / 2;
export const frontCornerDimX = buildingW + 0.04;
export const frontCornerDimZ = buildingBackZ + 0.12;
export const frontCornerDimTickX = buildingW - 0.16;
export const frontCornerDimLabelX = buildingW + 0.62;
export const frontCornerDimLabelZ = frontCornerDimZ;
export const secondY = firstWallY + firstWallHeight;
export const frFrontZ = buildingFrontZ + exteriorWall / 2;    // 전면 벽 중심선
export const frBackZ = buildingBackZ - exteriorWall / 2;      // 후면 벽 중심선
export const frLeftX = exteriorWall / 2;                      // 좌측 박공벽 중심선
export const frRightX = buildingW - exteriorWall / 2;         // 우측 박공벽 중심선
export const frSecondWallY = secondY + secondFloorThickness;  // 다락 무릎벽 하단
export const frGableBaseY = frSecondWallY + secondWallHeight;  // 박공 시작(무릎벽 상단)
export const frRidgeZ = buildingFrontZ + buildingD / 2;
export const frEaveZFront = buildingFrontZ - frEaveOverhang;
export const frEaveZBack = buildingBackZ + frEaveOverhang;
export const deckFootprints = [];
export const firstCeilingY = secondY;
export const atticSecondWallTop = secondY + secondFloorThickness + secondWallHeight;
export const atticRidgeZ = buildingFrontZ + buildingD / 2;
export const stairwellFanX = stairClearX + stairRunW + stairGap / 2;
export const stairwellFanZ = atticRidgeZ; // 용마루(가장 높은 곳) 바로 아래, 계단실 개구부 범위 안
export const outletLowY = firstFloorY + 0.3;        // 일반 콘센트 높이
export const outletCounterY = firstFloorY + 1.05;   // 주방 조리대 위 콘센트
export const curtainOutletY = firstFloorY + 1.95;
export const atticWallY = secondY + secondFloorThickness;
export const atticOutletY = atticWallY + 0.3;
