// s1/attic.js — 다락: 바닥(슬래브·방·매트리스)·외벽(무릎벽·창·박공벽)·내벽(칸막이·문·붙박이장) (main.js에서 줄 이동).
import * as THREE from 'three';
import { materials } from '../materials.js';
import { box } from '../primitives.js';
import { label, planYDim, room, roomText } from '../labels.js';
import {
  gableLongWallX, lowWall, horizontalWallWithGaps, pocketDoorHorizontal,
  frontFixSash, frontAwningSash, sideRearSlider, gableWallSeg,
} from '../openings.js';
import { captureInto, fmtDim } from '../primitives.js';
import { mattressWithLabel, pillowAt } from '../fixtures.js';
import {
  buildingW, buildingD, buildingBackZ, exteriorWall, interiorWall, interiorDoorW,
  secondFloorThickness, secondWallHeight, secondAtticDoorH, atticCorridorWallT, stairRunW,
  floorSurfaceH, firstWallHeight,
} from '../constants.js';
import {
  buildingFrontZ, secondY, insideX0, insideX1, insideZ0, insideZ1, insideD,
  planRightKitchenX, stairLowXRunX, stairHighXWallX, stairHighXRunX, stairOpeningStart,
  secondCorridorX, secondCorridorZ, secondCorridorW, secondCorridorD, secondCorridorClearD,
  secondAtticWallZ, secondAtticZ, secondAtticD, secondRoom1DoorX, secondRoom2DoorX, secondRoom2X, secondRoom2W,
  atticCorridorWallShift, frontCornerDimX, frontCornerDimZ, rearWindowSideOffset,
  roofRiseAtZ, gableRise, firstKitchenW, firstFloorY, firstWallY, atticRidgeZ,
} from '../layout.js';
import { secondFloorObjects, atticExtWallObjects, atticInnerWallObjects } from '../groups.js';

export function buildAttic() {
const secondAtticFrontWallH = secondWallHeight + roofRiseAtZ(secondAtticWallZ);   // 다락 칸막이·정면벽 높이(박공 밑선) — 다락 블록 공유
// 다락 = 3개 토글로 분리: 실제 다락바닥(secondFloorObjects) · 다락 외벽(atticExtWallObjects) · 다락 내벽(atticInnerWallObjects).
// 공유 좌표는 여기서 한 번 계산해 세 그룹이 공유(단일 출처).
{
  // 2F measured plan. The stair arrival continues left/right as a front corridor, with attic rooms behind it.
  const slabMat = new THREE.MeshLambertMaterial({ color: 0xf6f6f6, transparent: true, opacity: 0.94 });
  const secondWallY = secondY + secondFloorThickness;
  const gableBaseY = secondWallY + secondWallHeight;
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
      const mfy = secondWallY + floorSurfaceH + 0.01, mH = 0.1, mL = 2.0;
      const z0 = insideZ1 - mL, pZ = insideZ1 - 0.07 - 0.4;             // 매트: 머리=뒤(高Z)·발치=앞(低Z) / 베개 z=머리맡
      const mat = (x0, w, txt) => mattressWithLabel({ x: x0, z: z0, w, l: mL, y: mfy, text: txt });   // fixtures 1벌(#12)
      const pil = (cx) => pillowAt(cx, pZ, mfy + mH);   // fixtures 1벌(#12)
      // 다락방1(주방쪽/低X): 싱글 2.0×1.1 2개(주방쪽 옆벽에 나란히·10cm 간격), 각 베개 1개 — 양방 교체
      { const w = 1.1, gap = 0.1, x0 = planRightKitchenX;
        mat(x0, w, '매트리스 2.0×1.1m'); pil(x0 + w / 2);
        mat(x0 + w + gap, w, '매트리스 2.0×1.1m'); pil(x0 + 1.5 * w + gap); }
      // 다락방2(안방쪽/高X): 더블 2.0×1.8, 안방쪽 옆벽(高X)에 붙임, 베개 2개 — 양방 교체
      { const w = 1.8, x1 = secondRoom2X + secondRoom2W, x0 = x1 - w; mat(x0, w, '매트리스 2.0×1.8m'); pil(x0 + 0.5); pil(x0 + 1.3); }
    }
  });

  // ── 다락 외벽 — 앞·뒤 무릎벽 + 창 + 좌우 박공벽 + 벽높이·용마루 치수 ──────────────
  captureInto(atticExtWallObjects, () => {
    planYDim(frontCornerDimX, frontCornerDimZ, secondWallY, secondWallY + secondWallHeight, `다락 벽높이 ${fmtDim(secondWallHeight)}m`);
    // 다락 벽높이 아래(1층 구간) — 1층 바닥면(firstFloorY)~천장(firstWallY+firstWallHeight, =다락 바닥 밑면)
    planYDim(frontCornerDimX, frontCornerDimZ, firstFloorY, firstWallY + firstWallHeight, `1층 바닥~천장 ${fmtDim((firstWallY + firstWallHeight) - firstFloorY)}m`);
    // 용마루(뾰족) 높이 — 왼쪽(도로측) 벽, 박공 꼭짓점(z=용마루 중앙)
    planYDim(frontCornerDimX, atticRidgeZ, secondWallY, secondWallY + atticPeakH, `용마루 ${fmtDim(atticPeakH)}m`);
    // 2F exterior walls use a 1.15m loft eave wall; the gable rise is calculated from a 33 degree roof pitch.
    // 앞 무릎벽 — 좌우 옆벽서 atticFrontVentSide 이격한 환기용 프로젝트(어닝)창 2개(주방쪽·안방쪽). 상부경첩·하부 바깥밀이라 창짝이 추락방지 난간 역할(낮은 창대에도 안전) + 처마와 무관하게 비 막힘.
    const atticVentWinW = 0.6, atticVentWinH = 0.4, atticVentSillY = secondWallY + 0.4;   // 폭0.6×높0.4·창대 바닥+0.4 → 윗선 바닥+0.8, 무릎벽(secondWallHeight) 꼭대기까지 인방
    const atticFrontVentSide = 1.6;                                                       // 좌우 옆벽서 창까지 이격(끝선)
    const atticVentKx0 = atticFrontVentSide, atticVentBx0 = buildingW - atticFrontVentSide - atticVentWinW;   // 주방쪽(低X)·안방쪽(高X) 창 시작 X
    const atticVentHeadY = atticVentSillY + atticVentWinH;
    const atticFixW = 1.2, atticFixX0 = (buildingW - atticFixW) / 2;   // 중앙 픽스창 — 폭 1.2·정면 중앙, 좌우 프로젝트창과 같은 창대·높이(atticVent…). 앞·뒤 공용
    horizontalWallWithGaps(0, buildingFrontZ, buildingW, secondWallY, [[atticVentKx0, atticVentKx0 + atticVentWinW], [atticVentBx0, atticVentBx0 + atticVentWinW], [atticFixX0, atticFixX0 + atticFixW]], secondWallHeight, exteriorWall, materials.exteriorWall);   // 앞 무릎벽 — 좌우 환기창 2개 + 중앙 픽스창 개구
    for (const vx0 of [atticVentKx0, atticVentBx0]) {
      lowWall(vx0, buildingFrontZ, atticVentWinW, exteriorWall, secondWallY, atticVentSillY - secondWallY, materials.exteriorWall);                              // 창 아래 띠(창대)
      lowWall(vx0, buildingFrontZ, atticVentWinW, exteriorWall, atticVentHeadY, (secondWallY + secondWallHeight) - atticVentHeadY, materials.exteriorWall);       // 창 위 띠(인방)
      frontAwningSash(vx0, buildingFrontZ + 0.13, atticVentWinW, atticVentSillY, atticVentWinH, -1);   // 유리짝(低Z 바깥으로 밀어 열림)
      label(`다락 앞 환기 프로젝트창 ${fmtDim(atticVentWinW)}×${fmtDim(atticVentWinH)}m`, vx0 + atticVentWinW / 2, atticVentSillY + 0.4, buildingFrontZ - 0.1, 'opening');
    }
    lowWall(atticFixX0, buildingFrontZ, atticFixW, exteriorWall, secondWallY, atticVentSillY - secondWallY, materials.exteriorWall);                               // 앞 중앙 픽스창 아래 띠(창대)
    lowWall(atticFixX0, buildingFrontZ, atticFixW, exteriorWall, atticVentHeadY, (secondWallY + secondWallHeight) - atticVentHeadY, materials.exteriorWall);        // 앞 중앙 픽스창 위 띠(인방)
    frontFixSash(atticFixX0, buildingFrontZ + 0.13, atticFixW, atticVentSillY, atticVentWinH);   // 앞 중앙 고정 유리(비개폐)
    label(`다락 앞 중앙 픽스창 ${fmtDim(atticFixW)}×${fmtDim(atticVentWinH)}m`, atticFixX0 + atticFixW / 2, atticVentSillY + 0.4, buildingFrontZ - 0.1, 'opening');
    // 뒤 무릎벽 — 좌우 옆벽서 1층 뒤 미서기창과 끝선 맞춘(rearWindowSideOffset) 프로젝트(어닝)창 2개(주방쪽·안방쪽). 앞 환기창과 동일 규격.
    const backVentKx0 = rearWindowSideOffset;                                                    // 주방쪽(低X) 시작 — 옆벽서 이격, 1층 창 끝선과 정렬
    const backVentBx0 = buildingW - rearWindowSideOffset - atticVentWinW;                        // 안방쪽(高X) 시작 — 끝선(buildingW−이격)에서 창폭만큼 안쪽
    horizontalWallWithGaps(0, insideZ1, buildingW, secondWallY, [[backVentKx0, backVentKx0 + atticVentWinW], [backVentBx0, backVentBx0 + atticVentWinW], [atticFixX0, atticFixX0 + atticFixW]], secondWallHeight, exteriorWall, materials.exteriorWall);   // 뒤 무릎벽 — 창 3개 개구(좌우 환기 + 중앙 픽스)
    for (const bx0 of [backVentKx0, backVentBx0]) {
      lowWall(bx0, insideZ1, atticVentWinW, exteriorWall, secondWallY, atticVentSillY - secondWallY, materials.exteriorWall);                              // 창 아래 띠(창대)
      lowWall(bx0, insideZ1, atticVentWinW, exteriorWall, atticVentHeadY, (secondWallY + secondWallHeight) - atticVentHeadY, materials.exteriorWall);       // 창 위 띠(인방)
      frontAwningSash(bx0, buildingBackZ - 0.13, atticVentWinW, atticVentSillY, atticVentWinH, 1);   // 유리짝(高Z 바깥으로 밀어 열림)
      label(`다락 뒤 환기 프로젝트창 ${fmtDim(atticVentWinW)}×${fmtDim(atticVentWinH)}m`, bx0 + atticVentWinW / 2, atticVentSillY + 0.4, buildingBackZ + 0.1, 'opening');
    }
    lowWall(atticFixX0, insideZ1, atticFixW, exteriorWall, secondWallY, atticVentSillY - secondWallY, materials.exteriorWall);                               // 중앙 픽스창 아래 띠(창대)
    lowWall(atticFixX0, insideZ1, atticFixW, exteriorWall, atticVentHeadY, (secondWallY + secondWallHeight) - atticVentHeadY, materials.exteriorWall);        // 중앙 픽스창 위 띠(인방)
    frontFixSash(atticFixX0, buildingBackZ - 0.13, atticFixW, atticVentSillY, atticVentWinH);   // 중앙 고정 유리(비개폐)
    label(`다락 뒤 중앙 픽스창 ${fmtDim(atticFixW)}×${fmtDim(atticVentWinH)}m`, atticFixX0 + atticFixW / 2, atticVentSillY + 0.4, buildingBackZ + 0.1, 'opening');
    // ── 좌·우 옆(박공)벽 — 각 다락방 바깥벽. 용마루 밑 최고 구간에 미서기 환기창 1개씩(2짝 편개) ──
    // 창대 바닥+0.9(추락안전선 근접·바닥매트 위) · 폭(깊이Z)1.2×높0.8 · 앞끝은 방 앞벽(secondAtticZ)서 0.1m 띄움
    const atticSideWinW = 1.2, atticSideWinH = 0.8, atticSideSillY = secondWallY + 0.9, atticSideHeadY = secondWallY + 0.9 + 0.8;
    const atticSideZ0 = secondAtticZ + 0.1, atticSideZ1 = atticSideZ0 + atticSideWinW;   // 방 앞벽서 0.1m 띄운 앞끝
    const wallZ1 = buildingFrontZ + buildingD;                                            // 옆벽 Z 뒤끝(집 깊이 전체)
    const roofUnderY = (z) => gableBaseY + roofRiseAtZ(z);                                // 박공벽 밑선(=지붕 밑면) Y
    // za~zb 한 구간을 바닥(by)부터 박공 밑선까지 세움 — 구간 내 용마루(atticRidgeZ)는 꼭지점으로 꺾음
    const gableSeg = (x, za, zb, by) => gableWallSeg({ x, za, zb, by, thickness: exteriorWall, mat: materials.exteriorWall, underY: roofUnderY, ridgeZ: atticRidgeZ });   // openings.gableWallSeg 1벌(#15)
    const sideSlider = (xc) => sideRearSlider(atticSideZ0, atticSideWinW, atticSideSillY, atticSideHeadY - atticSideSillY, xc);   // 옆벽 미서기 2짝 — openings.sideRearSlider 1벌(#13)
    const gableSideWall = (x, xc) => {
      gableSeg(x, buildingFrontZ, atticSideZ0, secondWallY);                                                                        // 창 앞쪽 벽(바닥~지붕)
      gableSeg(x, atticSideZ1, wallZ1, secondWallY);                                                                                // 창 뒤쪽 벽(바닥~지붕)
      box({ x, z: atticSideZ0, w: exteriorWall, d: atticSideWinW, y: secondWallY, h: atticSideSillY - secondWallY, mat: materials.exteriorWall });   // 창 아래 띠(창대)
      gableSeg(x, atticSideZ0, atticSideZ1, atticSideHeadY);                                                                        // 창 위(인방~지붕)
      sideSlider(xc);
    };
    gableSideWall(0, 0.13);                    // 우(주방/低X) 박공벽 — 다락방1
    gableSideWall(insideX1, buildingW - 0.13); // 좌(안방/高X) 박공벽 — 다락방2
    label(`다락방1 미서기창 ${fmtDim(atticSideWinW)}×${fmtDim(atticSideWinH)}m`, -0.1, atticSideSillY + 0.4, atticSideZ0 + atticSideWinW / 2, 'opening');
    label(`다락방2 미서기창 ${fmtDim(atticSideWinW)}×${fmtDim(atticSideWinH)}m`, buildingW + 0.1, atticSideSillY + 0.4, atticSideZ0 + atticSideWinW / 2, 'opening');
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
    pocketDoorHorizontal(atticStairDoorX, stairOpeningStart, secondWallY, interiorDoorW, secondAtticDoorH, -1, materials.interiorDoor);   // 슬라이드(포켓)식 — 주방측(低X)으로 미끄러짐
    label('다락 입구 단열문(슬라이드)', atticStairDoorX + interiorDoorW / 2, secondWallY + 1.0, stairOpeningStart - 0.5, 'opening');
    // 다락 복도 양쪽(주방쪽 低X·안방쪽 高X) 끝 붙박이장 — 깊이 0.8m(옆 외벽에서 복도 안쪽으로), 복도 앞~뒤 전 깊이, 지붕 밑선까지 채우는 경사 상단.
    {
      const clD = 0.7, clZ = secondCorridorZ, clW = secondCorridorClearD;   // 깊이(X)·복도 Z앞선·폭(Z=복도 안목 깊이)
      gableLongWallX({ x: insideX0, z: clZ, d: clW, y: secondWallY, baseH: secondWallHeight, thickness: clD, mat: materials.sinkCabinet });        // 주방쪽(低X) 끝
      gableLongWallX({ x: insideX1 - clD, z: clZ, d: clW, y: secondWallY, baseH: secondWallHeight, thickness: clD, mat: materials.sinkCabinet });  // 안방쪽(高X) 끝
      label(`붙박이장 깊이 ${fmtDim(clD)}m`, insideX0 + clD / 2, secondWallY + 1.0, clZ + clW / 2, 'furniture');
      label(`붙박이장 깊이 ${fmtDim(clD)}m`, insideX1 - clD / 2, secondWallY + 1.0, clZ + clW / 2, 'furniture');
    }
  });
}
}
