// layout.js — main.js에서 추출한 순수 파생 레이아웃 값(상수로부터 계산, 사이드이펙트 없음).
// 의존: constants.js만. scene/THREE/materials/빌드순서에 얽힌 값은 main.js에 그대로 둠.

import {
  buildingBackZ, buildingFrontZ, groundTopY, foundationHeight, floorFinishH, deckFoundationH,
  lotX0, lotW, lotD, exteriorWall, buildingW, interiorWall,
  stairRunW, entryFrameOuterW, yardDeckH, stairRiserCount, lowerStraightTreadCount, winderTreadCount,
  stairTreadDepth, interiorDoorW, interiorDoorH, firstWallHeight, yardSashW, yardSashH,
  familyWindowW, kitchenSinkD, kitchenSinkH, kitchenSinkW, livingRearWindowW, familyRearWindowW,
  sideDoorH, secondCorridorWindowSillOffset, secondCorridorWindowH, atticVentWindowW, atticSkyWindowW, atticRearWindowSillOffset,
  atticRearWindowH, atticRearWindowW, secondFloorThickness, secondWallHeight, frEaveOverhang
} from './constants.js';

export const buildingD = buildingBackZ - buildingFrontZ;   // 집 깊이(=4.0, 파생)
export const foundationTopY = groundTopY + foundationHeight;   // 말뚝 두부 상단(0.58) = 바닥재 하단
export const firstFloorY = foundationTopY + 0.20 + floorFinishH; // 기초 상단(0.58) + 장선(0.20) + 바닥(0.10) = 0.88
export const deckTopY0 = groundTopY + deckFoundationH;   // 데크/썬룸 기초 상단(0.48) = 집 기초 상단(0.58)보다 0.1m 낮음
export const lotX1 = lotX0 + lotW;
export const lotZ1 = buildingBackZ + 1;        // 후면 경계(집 뒤 1m)
export const lotZ0 = lotZ1 - lotD;             // 전면 경계
export const firstWallY = firstFloorY;
export const insideX0 = exteriorWall;
export const insideZ0 = buildingFrontZ + exteriorWall;
export const insideX1 = buildingW - exteriorWall;
export const insideZ1 = buildingBackZ - exteriorWall;
export const insideD = insideZ1 - insideZ0;
export const layoutD = insideD;
export const stairGap = interiorWall;
export const stairClearW = stairRunW * 2 + stairGap;
export const sideRoomW = (insideX1 - insideX0 - stairClearW - interiorWall * 2) / 2;
export const sideRoomD = layoutD;
export const stairClearX = insideX0 + sideRoomW + interiorWall;
export const stairLowXRunX = stairClearX;
export const stairHighXRunX = stairLowXRunX + stairRunW + stairGap;
export const stairLowXWallX = stairClearX - interiorWall;
export const stairHighXWallX = stairClearX + stairClearW;
export const stairHighXClearX = stairHighXWallX + interiorWall;
export const planRightLivingX = insideX0;
export const planLeftFamilyX = stairHighXClearX;
export const firstLivingW = sideRoomW;
export const firstLivingD = sideRoomD;
export const firstFamilyW = sideRoomW;
export const firstFamilyD = sideRoomD;
export const firstLivingX = planRightLivingX;
export const firstFamilyX = planLeftFamilyX;
export const entryGapStart = stairClearX + (stairClearW - entryFrameOuterW) / 2;
export const entryGapEnd = entryGapStart + entryFrameOuterW;
export const familyDoorZ = insideZ0;
export const yardSashSillY = firstFloorY + yardDeckH;
export const upperStraightTreadCount = stairRiserCount - 1 - lowerStraightTreadCount - winderTreadCount;
export const stairTurnD = stairRunW;
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
export const livingYardSashX = firstLivingX + (firstLivingW - yardSashW) / 2;
export const yardSashTopY = yardSashSillY + yardSashH;
export const familyWindowX = firstFamilyX + (firstFamilyW - familyWindowW) / 2;
export const familyWindowSillY = firstFloorY + 0.9;
export const familyWindowTopY = yardSashTopY;
export const familyWindowH = familyWindowTopY - familyWindowSillY;   // ≈1.28m
export const entryDoorBaseY = firstWallY + yardDeckH;
export const kitchenSinkX = insideX0;   // 오른쪽(저X) 외벽에 붙임
export const kitchenSinkZ = insideZ1 - kitchenSinkD;   // 싱크대는 뒤쪽 벽으로(앞 입구 확보)
export const kitchenCounterY = firstFloorY + kitchenSinkH + 0.05;   // 싱크대 상판 높이(≈바닥+0.90)
export const livingRearWindowX = kitchenSinkX + (kitchenSinkW - livingRearWindowW) / 2;
export const livingRearWindowSillY = kitchenCounterY + 0.15;
export const livingRearWindowTopY = yardSashTopY;
export const livingRearWindowH = livingRearWindowTopY - livingRearWindowSillY;
export const familyRearWindowX = firstFamilyX + (firstFamilyW - familyRearWindowW) / 2;   // 안방 중앙
export const familyRearWindowSillY = firstFloorY + 0.9;     // 일반 창대(전면창과 동일)
export const familyRearWindowTopY = yardSashTopY;           // 윗선을 거실 싱크대 창·전면 개구부와 동일선(2.18)
export const familyRearWindowH = familyRearWindowTopY - familyRearWindowSillY;   // ≈1.28m
export const sideDoorZ = insideZ0 + 0.2;                        // 전면쪽(코너에서 0.2m 띄움)
export const sideDoorBaseY = firstFloorY;                       // 바닥에서 시작(출입)
export const sideDoorTopY = sideDoorBaseY + sideDoorH;
export const secondRoom2X = stairHighXClearX;
export const secondRoom2W = insideX1 - secondRoom2X;
export const secondCorridorX = insideX0;
export const secondCorridorZ = insideZ0;
export const secondCorridorW = insideX1 - insideX0;
export const secondCorridorD = stairBottomLandingD;
export const secondAtticWallZ = secondCorridorZ + secondCorridorD;
export const secondAtticZ = secondAtticWallZ + interiorWall;
export const secondAtticD = insideZ1 - secondAtticZ;
export const secondRoom1DoorX = planRightLivingX + (sideRoomW - interiorDoorW) / 2;
export const secondRoom2DoorX = secondRoom2X + (secondRoom2W - interiorDoorW) / 2;
export const secondCorridorWindowTopOffset = secondCorridorWindowSillOffset + secondCorridorWindowH;
export const atticVentWindowX = (buildingW - atticVentWindowW) / 2;   // 정면 중앙
export const atticSkyWindowX = (stairClearX + stairHighXWallX) / 2 - atticSkyWindowW / 2;   // 계단실 가로 중앙
export const atticRearWindowTopOffset = atticRearWindowSillOffset + atticRearWindowH;
export const atticRoom1RearWindowX = planRightLivingX + (sideRoomW - atticRearWindowW) / 2;
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
