// s1/floor1.js — 1층: 바닥·외벽(창·문)·방 색면·가구·화장실·콘센트·부동수전·실링팬 (main.js에서 줄 이동).
// scene 추가 순서 보존: buildFloor1()은 1층 자리, buildFloor1Fixtures()는 s2 구획 뒤 원래 자리에서 호출된다.
import * as THREE from 'three';
import { scene } from '../scene.js';
import { materials } from '../materials.js';
import { box, fmtDim, captureInto } from '../primitives.js';
import { label, planYDim, roomText } from '../labels.js';
import { ceilingFan, outlet, fridge311AtBack, waterHeater15U } from '../fixtures.js';
import { rearSlider, frontAwningSash, sideRearSlider, sideEntryDoor } from '../openings.js';
import {
  buildingW, buildingD, buildingBackZ, exteriorWall, interiorWall, firstWallHeight,
  secondFloorThickness, floorFinishH, floorSurfaceH, floorOverlayLift,
  kitchenSinkW, kitchenSinkD, kitchenSinkH, lowerStraightTreadCount, winderTreadCount,
  stairRiserHeight, groundTopY,
} from '../constants.js';
import {
  buildingFrontZ, foundationTopY, firstFloorY, firstWallY, rearWindowSideOffset,
  insideX0, insideZ0, insideX1, insideZ1, stairBathX, stairBathZ, stairBathW, stairBathD,
  stairLowXRunX, stairHighXWallX, stairBottomLandingD,
  firstKitchenX, firstKitchenW, firstKitchenD, firstFamilyX, firstFamilyW, firstFamilyD,
  kitchenSinkX, kitchenSinkZ, kitchenCounterY, frontCornerDimX, frontCornerDimZ, firstCeilingY,
} from '../layout.js';
import {
  firstFloorFinishObjects, firstWallObjects, firstDimObjects,
  bathObjects, interiorObjects, firstCeilingObjects, firstOutletObjects,
} from '../groups.js';

export let firstStairRoomLabel, firstBathDimLabel, firstBathClearFill;   // 계단실 라벨 ↔ 화장실 안목(applyVisibility에서 전환)
export const firstCeilingGroundObjects = [];   // '천장' 토글 중 지면 기준 부재(에어컨 실외기·배관) — houseGroup 재부모 제외용(J-②)

export function buildFloor1() {
// 입체 집 기초(시스템말뚝 + 두부)는 1층 벽·실 좌표가 정의된 뒤(아래)에서 만든다 — 하중 경로에 말뚝 정렬.
// 기초 가로/세로 길이 치수 — 제거(라벨 정리)

// 1층 바닥(바닥 시공 floorFinishH) — 골조(장선) 위 마감층. '1층 바닥' 토글(firstFloorFinishObjects). 1층 벽·계단·가구는 이 위(firstFloorY)에서 시작.
captureInto(firstFloorFinishObjects, () => {
  box({ x: 0, z: buildingFrontZ, w: buildingW, d: buildingD, y: foundationTopY, h: floorFinishH, mat: materials.floorFinish });
});

// 1층 외벽(반투명) — 방 바닥 테두리선(집 발자국 0~buildingW / buildingFrontZ~+buildingD)에 맞춰 바깥면을 두고, 막대는 모두 안쪽으로만(밖으로 안 튀어나옴). 두께 exteriorWall·높이 firstWallHeight+secondFloorThickness·firstFloorY에서 시작. 1층·다락·지붕 단계 표시.
{
  const wt = exteriorWall, wh = firstWallHeight + secondFloorThickness, z0 = buildingFrontZ, z1 = buildingFrontZ + buildingD;   // 두께·높이를 단일 상수에서 읽음. 높이는 다락 바닥 슬래브 두께만큼 더 올려 1층↔다락 외벽이 끊기지 않고 하나로 이어지게(슬래브 옆면을 감쌈)
  const wy = firstWallY + 0.003;   // 바닥 윗면과 정확히 같은 평면(z-fighting 떨림)을 피해 3mm 띄움 — 바깥면은 테두리에 그대로 맞춤
  const W = materials.firstExtWall;
  // 외벽 미서기창 공용 제원 — 앞·뒤창(옆벽서 rwSide 띄움) + 옆창(뒤끝서 swBack 띄움). 모두 창대 바닥+1.0·폭 1.6·높이 1.2, 좌우대칭
  const rwW = 1.6, rwSill = firstFloorY + 1.0, rwHead = firstFloorY + 1.0 + 1.2, rwSide = rearWindowSideOffset, swBack = 0.6;
  const rwKx0 = rwSide, rwBx0 = buildingW - rwSide - rwW;   // 주방창 시작 X(우/低X) / 안방창 시작 X(좌/高X) — 옆벽서 rwSide
  const swZ1 = z1 - swBack, swZ0 = swZ1 - rwW;              // 옆창 뒤끝(z1서 swBack)/앞끝 — 좌우 공용
  // 앞(−Z) 외벽 — 별도 현관문 없음(포치 폴딩도어→주방 앞 미서기문이 출입 역할). 안방측엔 미서기창(왼쪽=高X 끝 고정, 폭 fwW).
  const fwW = 1.4, fwX0 = (rwBx0 + rwW) - fwW;   // 정면 안방창 폭(뒤창보다 좁음) — 왼쪽(高X, buildingW−rwSide) 고정, 오른쪽(低X) 축소
  // 주방 앞(−Z) 외벽 — 주방 안목(firstKitchenX~+W)서 좌우 30cm 뺀 문 크기 미서기 샤시(바닥까지=문으로 사용)
  const kfwSide = 0.3, kfwH = 2.0, kfwPanel = 0.8, kfwN = 4;                                            // 좌우 이격 · 문 높이 · 미서기 한짝 폭 · 짝수(0.8×4=3.2m, 현관 삭제로 왼쪽 확장)
  const kfwX0 = firstKitchenX + kfwSide, kfwW = kfwPanel * kfwN, kfwHead = firstFloorY + kfwH;          // 오른쪽(주방쪽·低X) 고정 시작 X · 폭(한짝×짝수, 왼쪽 확장) · 상단(문 높이)
  captureInto(firstWallObjects, () => {
    box({ x: 0, z: z0, w: kfwX0, d: wt, y: wy, h: wh, mat: W });                                        // 주방측 끝~주방 앞문
    box({ x: kfwX0 + kfwW, z: z0, w: fwX0 - (kfwX0 + kfwW), d: wt, y: wy, h: wh, mat: W });              // 미서기문~안방창(현관 자리까지 통벽)
    box({ x: kfwX0, z: z0, w: kfwW, d: wt, y: kfwHead, h: (wy + wh) - kfwHead, mat: W });               // 문 위 인방
    rearSlider(kfwX0, kfwW, firstFloorY, kfwHead - firstFloorY, z0 + 0.13, kfwN);                       // 미서기 kfwN짝(유리 정면쪽·바닥까지)
    label(`주방 앞 미서기문 ${fmtDim(kfwW)}×${fmtDim(kfwHead - firstFloorY)}m`, kfwX0 + kfwW / 2, firstFloorY + 0.4, z0 - 0.1, 'opening');
  });
  captureInto(firstWallObjects, () => {
    box({ x: fwX0 + fwW, z: z0, w: buildingW - (fwX0 + fwW), d: wt, y: wy, h: wh, mat: W });            // 안방 앞창~안방측 끝
    box({ x: fwX0, z: z0, w: fwW, d: wt, y: wy, h: rwSill - wy, mat: W });                              // 창 아래 창대띠
    box({ x: fwX0, z: z0, w: fwW, d: wt, y: rwHead, h: (wy + wh) - rwHead, mat: W });                   // 창 위 인방
    rearSlider(fwX0, fwW, rwSill, rwHead - rwSill, z0 + 0.13);                                          // 미서기 2짝(유리 정면쪽)
    label(`안방 앞 미서기창 ${fmtDim(fwW)}×${fmtDim(rwHead - rwSill)}m`, fwX0 + fwW / 2, rwSill + 0.4, z0 - 0.1, 'opening');
  });
  const zB = z1 - wt;
  captureInto(firstWallObjects, () => {
    box({ x: 0, z: zB, w: rwKx0, d: wt, y: wy, h: wh, mat: W });                                       // 주방측 끝~주방창
    // 화장실(계단하부 WC) 뒤 외벽 — 변기 위 프로젝트(어닝)창 개구. 안목 X 중앙 정렬·창대 물탱크 위.
    const wcWinW = 0.6, wcWinH = 0.4, wcWinCx = stairBathX + interiorWall + (stairBathW - interiorWall) / 2;   // 폭0.6×높0.4·화장실 안목 X 중앙(변기 직상)
    // 상단을 계단 밑면(뒤벽 소핏=첫 계단참 발판 밑면)에 붙임: 발판 뒤코너선(하부+돌음+1단) − 발판두께
    const wcWinHead = firstFloorY + (lowerStraightTreadCount + winderTreadCount + 1) * stairRiserHeight - 0.05;
    const wcWinX0 = wcWinCx - wcWinW / 2, wcWinSill = wcWinHead - wcWinH;
    box({ x: rwKx0 + rwW, z: zB, w: wcWinX0 - (rwKx0 + rwW), d: wt, y: wy, h: wh, mat: W });            // 주방창~화장실창
    box({ x: wcWinX0 + wcWinW, z: zB, w: rwBx0 - (wcWinX0 + wcWinW), d: wt, y: wy, h: wh, mat: W });    // 화장실창~안방창
    box({ x: wcWinX0, z: zB, w: wcWinW, d: wt, y: wy, h: wcWinSill - wy, mat: W });                     // 창 아래 창대띠
    box({ x: wcWinX0, z: zB, w: wcWinW, d: wt, y: wcWinHead, h: (wy + wh) - wcWinHead, mat: W });       // 창 위 인방
    frontAwningSash(wcWinX0, z1 - 0.13, wcWinW, wcWinSill, wcWinH, 1);                                  // 프로젝트(어닝)창 — 高Z 바깥으로 밀어 열림
    label(`화장실 뒤 프로젝트창 ${fmtDim(wcWinW)}×${fmtDim(wcWinH)}m`, wcWinCx, wcWinSill + 0.4, z1 + 0.1, 'opening');
    box({ x: rwBx0 + rwW, z: zB, w: buildingW - (rwBx0 + rwW), d: wt, y: wy, h: wh, mat: W });         // 안방창~안방측 끝
    for (const [a, tag] of [[rwKx0, '주방'], [rwBx0, '안방']]) {
      box({ x: a, z: zB, w: rwW, d: wt, y: wy, h: rwSill - wy, mat: W });                              // 창 아래 창대띠
      box({ x: a, z: zB, w: rwW, d: wt, y: rwHead, h: (wy + wh) - rwHead, mat: W });                   // 창 위 인방
      rearSlider(a, rwW, rwSill, rwHead - rwSill, z1 - 0.13);                                          // 미서기 2짝
      label(`${tag} 미서기창 ${fmtDim(rwW)}×${fmtDim(rwHead - rwSill)}m`, a + rwW / 2, rwSill + 0.4, z1 + 0.1, 'opening');
    }
  });
  // 우(주방, x=0) 외벽 — 바깥면 x=0. 뒤끝서 swBack 띄운 옆 미서기창 개구로 분할(뒤창과 동일 크기·창대)
  captureInto(firstWallObjects, () => {
    box({ x: 0, z: z0 + wt, w: wt, d: swZ0 - (z0 + wt), y: wy, h: wh, mat: W });                 // 앞끝~옆창
    box({ x: 0, z: swZ1, w: wt, d: (z1 - wt) - swZ1, y: wy, h: wh, mat: W });                    // 옆창~뒤끝
    box({ x: 0, z: swZ0, w: wt, d: rwW, y: wy, h: rwSill - wy, mat: W });                        // 창 아래 창대띠
    box({ x: 0, z: swZ0, w: wt, d: rwW, y: rwHead, h: (wy + wh) - rwHead, mat: W });             // 창 위 인방
    sideRearSlider(swZ0, rwW, rwSill, rwHead - rwSill, 0.13);                                    // 미서기 2짝
    label(`주방 옆 미서기창 ${fmtDim(rwW)}×${fmtDim(rwHead - rwSill)}m`, -0.1, rwSill + 0.4, swZ0 + rwW / 2, 'opening');
  });
  // 좌(안방, x=buildingW) 외벽 — 앞에서 30cm 들어간 곳에 표준 작은(보조) 외짝문(측면). 문 개구로 앞·뒤 벽 조각 + 상부 인방으로 분할.
  const sideDoorLeaf = 0.7, sideDoorH = 2.0, sideDoorOuter = sideDoorLeaf + 0.1;   // 표준 작은 외짝문: 유효폭 0.7·높이 2.0·문틀외곽 0.8(좌우 프레임 50mm씩)
  const doorD = sideDoorOuter, dz0 = z0 + wt + 0.3, dz1 = dz0 + doorD;   // 문 앞 모서리 = 앞 외벽 안쪽면 +30cm
  firstWallObjects.push(box({ x: buildingW - wt, z: z0 + wt, w: wt, d: dz0 - (z0 + wt), y: wy, h: wh, mat: W }));    // 좌 외벽 — 개구 앞쪽(정면측)
  // 좌 외벽 — 측문 뒤쪽. 뒤끝서 swBack 띄운 옆 미서기창 개구로 분할(뒤창과 동일 크기·창대)
  firstWallObjects.push(box({ x: buildingW - wt, z: dz1, w: wt, d: swZ0 - dz1, y: wy, h: wh, mat: W }));            // 좌 외벽 — 측문 뒤~옆창
  captureInto(firstWallObjects, () => {
    box({ x: buildingW - wt, z: swZ1, w: wt, d: (z1 - wt) - swZ1, y: wy, h: wh, mat: W });                          // 옆창~뒤끝
    box({ x: buildingW - wt, z: swZ0, w: wt, d: rwW, y: wy, h: rwSill - wy, mat: W });                              // 창 아래 창대띠
    box({ x: buildingW - wt, z: swZ0, w: wt, d: rwW, y: rwHead, h: (wy + wh) - rwHead, mat: W });                   // 창 위 인방
    sideRearSlider(swZ0, rwW, rwSill, rwHead - rwSill, buildingW - 0.13);                                           // 미서기 2짝
    label(`안방 옆 미서기창 ${fmtDim(rwW)}×${fmtDim(rwHead - rwSill)}m`, buildingW + 0.1, rwSill + 0.4, swZ0 + rwW / 2, 'opening');
  });
  firstWallObjects.push(box({ x: buildingW - wt, z: dz0, w: wt, d: doorD, y: wy + sideDoorH, h: wh - sideDoorH, mat: W }));   // 좌 외벽 — 개구 상부 인방(문 위)
  captureInto(firstWallObjects, () => sideEntryDoor(buildingW + 0.04, dz0, doorD, sideDoorLeaf, wy, sideDoorH));    // 안방 측면 표준 작은 외짝문
  // 계단실 양쪽 세로 내벽 2개(주방|계단실·계단실|안방)는 여기서 그리지 않음 — buildStairWalls()에서 동적으로 그림.
  //   윗면이 다락 바닥 밑면(loftY - 30cm)에 맞도록 계단 높이에 따라 벽 높이가 변하기 때문(계단·1층 공유).
}

// 1층 방 크기 라벨 — 단일 경로(roomText '이름 크기')로만 표기. 주방·안방은 drawStairAnno의 방 라벨이 담당하므로
// 여기선 그리지 않는다(중복 제거). 방 라벨이 없던 '계단실'만 같은 방 이름 라벨 방식으로 추가한다. 1층·다락·지붕 단계 표시.
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


// 1F measured plan. Dimensions are in meters within the buildingW x buildingD footprint.
//   1층 층고·벽 두께 (제원)
// World x is mirrored in the front camera. With the entrance at the bottom,
// plan-left/family is the larger x side and plan-right/kitchen is the smaller x side.
//   다락·지붕 (제원) — 경사 파생값(roofSlopeTan·gableRise·roofRiseAtZ)은 ./layout.js에서 import.
// 안방 전면은 출입창이 아니라 일반 창문 — 통상 규격: 폭 familyWindowW·창대 familyWindowSillY·상단 yardSashTopY(현관·주방 도어와 동일선)
// 싱크대 창: 상판+백스플래시 위에서 시작, 윗선은 전면 도어와 동일선(yardSashTopY), 싱크대 위로 센터링
// 다락 정면 복도쪽: 기존 창 2개 제거 → 중앙 환기창 1개
// 계단 픽스창 — 1층에서 올라갈 때 첫 구간(저-X 런)은 후면(+Z)을 보고 오르므로, 후면에 둬야 올라가며 하늘이 보임
// 높이 치수 라벨은 세로 치수 막대(frontCornerDim*)가 있는 평면 왼쪽(도로 쪽, 높은 X) 뒤쪽
// 모서리 바깥에 나란히 붙여, 치수 막대와 라벨이 같은 모서리에 모이게 한다.

// 1층 높이는 바닥재(20cm)를 포함 — 기초 상단(바닥재 하단)부터 천장까지. '외벽' 토글 소속(J-③ 재배치 — 벽 높이 치수).
captureInto(firstWallObjects, () => planYDim(frontCornerDimX, frontCornerDimZ, foundationTopY, firstWallY + firstWallHeight, `1층 높이 ${fmtDim((firstWallY + firstWallHeight) - foundationTopY)}m`));

// (주방 색면 삭제 — 계단 화면의 방 색면 1벌과 중복·버튼 없는 유령 그룹 소속이라 영구 비표시였음. J-③·#22)
// 주방 벽걸이 에어컨·냉장고 제원 — 콘센트 자리('콘센트' 토글)도 이 값을 그대로 공유(단일 출처).
const acW = 0.85, acD = 0.22, acZ = insideZ0 + 0.2, acY = firstFloorY + firstWallHeight - 0.45;   // 에어컨 폭(Z)·깊이(X)·앞끝 z·설치 y
const fridgeW = 0.545;                                                      // 냉장고 폭(X)
const fridgeCx = (kitchenSinkX + kitchenSinkW) + (stairLowXRunX - (kitchenSinkX + kitchenSinkW) - fridgeW) / 2 + fridgeW / 2;   // 냉장고 X중심(싱크대 끝~계단 사이 가운데)
const cooktopX0 = kitchenSinkX + 1.5, cooktopW = 0.55;                      // 인덕션 시작 X·폭(콘센트 자리 공유)
// 주방 벽걸이 에어컨(실내기) — 오른쪽(서측) 외벽 x=insideX0 안쪽, 천장 가까이. 앞(−Z)에서 20cm 이격. '천장' 토글(firstCeilingObjects). 실외기는 통풍 좋은 곳에 별도.
captureInto(firstCeilingObjects, () => {
  const acH = 0.30;
  box({ x: insideX0, z: acZ, w: acD, d: acW, y: acY, h: acH, mat: materials.wall });                                           // 본체(흰색)
  box({ x: insideX0 + 0.05, z: acZ + 0.06, w: acD - 0.04, d: acW - 0.12, y: acY - 0.015, h: 0.025, mat: materials.openingEdge });   // 하부 토출 슬릿
  label('벽걸이 에어컨', insideX0 + 0.55, acY + 0.17, acZ + acW / 2, 'mep');
});
// 에어컨 실외기 — 후면(뒤) 주방(서)쪽 코너, 측백 향해(+Z) 토출. 배관은 서측 외벽 따라 뒤로. '천장' 토글(firstCeilingObjects).
// 지면 기준 부재라 houseGroup 재부모에서 제외해야 함 → firstCeilingGroundObjects에도 함께 수집(J-②).
captureInto(firstCeilingObjects, () => captureInto(firstCeilingGroundObjects, () => {
  const esW = 0.8, esD = 0.35, esH = 0.6;
  const esX = 0.3;                          // 서(주방)측 코너
  const esZ = buildingBackZ + 0.1;          // 집 뒤 벽 바로 뒤(집~측백 사이)
  box({ x: -0.04, z: 1.0, w: 0.06, d: (esZ + 0.1) - 1.0, y: groundTopY + 0.35, h: 0.06, mat: materials.guard });        // 배관(서측 외벽 따라 뒤로)
  box({ x: esX, z: esZ, w: esW, d: esD, y: groundTopY, h: esH, mat: materials.guard });                                 // 실외기 본체
  box({ x: esX + 0.15, z: esZ + esD - 0.02, w: esW - 0.3, d: 0.025, y: groundTopY + 0.13, h: 0.42, mat: materials.openingEdge });   // 토출 팬그릴(측백쪽 +Z)
  label('에어컨 실외기', esX + esW / 2, groundTopY + esH + 0.28, esZ + 0.2, 'mep');
}));
captureInto(interiorObjects, () => {   // 주방 싱크대 — '실내' 토글
  // 하부장 — 안에 전기온수기가 있어 앞이 보이는 캐비닛으로: 측판·뒤판·바닥판 + 반투명 문짝(s2 싱크 하부장과 같은 구성)
  const pt = 0.02;                                                   // 판재 두께
  const skX1 = kitchenSinkX + kitchenSinkW, skZ1 = kitchenSinkZ + kitchenSinkD;   // 하부장 高X 끝·뒷면(뒤 외벽 안쪽면)
  box({ x: kitchenSinkX, z: kitchenSinkZ, w: pt, d: kitchenSinkD, y: firstFloorY, h: kitchenSinkH, mat: materials.sinkCabinet });        // 저X 측판
  box({ x: skX1 - pt, z: kitchenSinkZ, w: pt, d: kitchenSinkD, y: firstFloorY, h: kitchenSinkH, mat: materials.sinkCabinet });           // 高X 측판
  box({ x: kitchenSinkX, z: skZ1 - pt, w: kitchenSinkW, d: pt, y: firstFloorY, h: kitchenSinkH, mat: materials.sinkCabinet });           // 뒤판(뒤 외벽쪽)
  box({ x: kitchenSinkX, z: kitchenSinkZ, w: kitchenSinkW, d: kitchenSinkD, y: firstFloorY, h: pt, mat: materials.sinkCabinet });        // 바닥판
  // 문짝 — 폭 kitchenSinkW를 표준 짝으로 등분. 전부 닫힘·반투명이라 속의 전기온수기가 비쳐 보인다
  const leafN = 4, leafPitch = kitchenSinkW / leafN, leafW = leafPitch - 0.01;
  const doorY = firstFloorY + pt, doorH = kitchenSinkH - pt - 0.01;
  for (let i = 0; i < leafN; i++)
    box({ x: kitchenSinkX + i * leafPitch + 0.005, z: kitchenSinkZ - pt, w: leafW, d: pt, y: doorY, h: doorH, mat: materials.cabinetDoor });   // 문짝(반투명)
  // 전기온수기 — fixtures 1벌(#12·esw560_15u). s2 주방과 같은 기종. 하부장 안 저X 끝, 전용 콘센트(뒤 외벽) 곁
  waterHeater15U({ x: kitchenSinkX + 0.08, z: kitchenSinkZ + 0.12, y: firstFloorY + pt, axis: 'x' });
  box({ x: kitchenSinkX, z: kitchenSinkZ, w: kitchenSinkW, d: kitchenSinkD, y: firstFloorY + kitchenSinkH, h: 0.05, mat: materials.counter });
  box({ x: kitchenSinkX + 0.62, z: kitchenSinkZ + 0.16, w: 0.72, d: 0.32, y: firstFloorY + kitchenSinkH + 0.05, h: 0.04, mat: materials.sinkBasin });
  box({ x: kitchenSinkX + 1.03, z: kitchenSinkZ + 0.08, w: 0.08, d: 0.08, y: firstFloorY + kitchenSinkH + 0.09, h: 0.24, mat: materials.entryFrame });
  label(`싱크대 ${fmtDim(kitchenSinkW)}x${fmtDim(kitchenSinkD)}m`, kitchenSinkX + kitchenSinkW / 2, firstFloorY + 1.2, kitchenSinkZ + kitchenSinkD / 2, 'furniture');
});
// 인덕션 쿡탑 — 싱크대 우측. 가스레인지·LPG 대체(전기 일원화, 가스통 불필요). '실내' 토글.
captureInto(interiorObjects, () => {
  const ckX = cooktopX0, ckZ = kitchenSinkZ + 0.08, ckW = cooktopW, ckD = 0.45;
  box({ x: ckX, z: ckZ, w: ckW, d: ckD, y: kitchenCounterY, h: 0.012, mat: materials.openingEdge });                         // 인덕션 검정 유리 상판
  box({ x: ckX + 0.09, z: ckZ + 0.11, w: 0.18, d: 0.18, y: kitchenCounterY + 0.012, h: 0.004, mat: materials.guard });      // 화구1
  box({ x: ckX + 0.33, z: ckZ + 0.16, w: 0.14, d: 0.14, y: kitchenCounterY + 0.012, h: 0.004, mat: materials.guard });      // 화구2
  label('인덕션', ckX + ckW / 2, kitchenCounterY + 0.22, ckZ + ckD / 2, 'furniture');
});
// 한문형 냉장고(311L, 0.545×0.689×1.70) — s2 것과 동일. 싱크대 끝(高X)과 계단 사이 뒤 외벽에 등붙임. 문=주방(低Z)쪽. '실내' 토글.
captureInto(interiorObjects, () => {
  fridge311AtBack({ x0: fridgeCx - fridgeW / 2, backZ: insideZ1, y: firstFloorY });   // fixtures 1벌(#12) — 문은 주방으로 열림(경첩 계단쪽·손잡이 싱크대쪽)
});
// (계단앞 색면·띠 삭제 — '바닥' 토글의 계단앞 색면이 담당, 유령 그룹 소속 영구 비표시 잔재. J-③)
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
    heater.position.set(wcCenterX, firstFloorY + 2.13 + hR, stairBathZ + interiorWall + hR);   // 문 위, 앞벽 안쪽면 등붙임(+Z 돌출) — 기존보다 10cm 상향
    scene.add(heater);
  }
  // (화장실 185cm 사람 모형 제거)
});
// 계단하부 WC 배기구 — '화장실' 토글 소속(J-③ 재배치 — 유령 그룹에 묶여 영구 비표시였음). 무창 WC 기계환기: 천장 배기팬 + 덕트로 뒤쪽 외벽에서 외부 환기캡으로 배기.
captureInto(bathObjects, () => {
  const ventX = stairBathX + stairBathW / 2;
  // WC 천장은 계단 밑 경사면 → 뒤쪽 실사용 천장선은 바닥+약 1.3m(벽 절반). 배기팬은 그 천장선 바로 아래(WC 실내 공기 안)여야 실제로 배기됨.
  const capY = firstFloorY + 1.08;
  box({ x: ventX - 0.12, z: insideZ1 - 0.06, w: 0.24, d: 0.06, y: capY, h: 0.22, mat: materials.guard });           // 실내 벽붙이 배기팬 그릴(천장선 바로 아래)
  box({ x: ventX - 0.05, z: insideZ1 - 0.11, w: 0.1, d: 0.06, y: capY + 0.06, h: 0.1, mat: materials.guard });      // 팬 흡입구
  box({ x: ventX - 0.13, z: buildingBackZ, w: 0.26, d: 0.05, y: capY, h: 0.22, mat: materials.entryFrame });          // 뒤 외벽 외부 환기캡(방수 후드)
  box({ x: ventX - 0.14, z: buildingBackZ + 0.03, w: 0.28, d: 0.06, y: capY - 0.03, h: 0.05, mat: materials.entryFrame });  // 하단 빗물막이 립
  label('화장실 배기구', ventX, capY + 0.34, buildingBackZ + 0.28, 'mep');
})
// (계단실 색면 삭제 — '바닥' 토글의 계단실 색면이 담당. J-③)
// (안방 색면 삭제 — 주방 색면과 같은 이유. J-③·#22)

// (1층 외벽·정면 현관문은 단일출처 firstWallObjects 블록에서 그림 — 옛 중복 '1F walls' 블록 제거)
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
  const pillowMat = materials.pillowWhite;   // 베개(공유 재질)
  const frameH = 0.3;
  const mattressH = 0.2;
  box({ x: bedX, z: bedZ, w: bedW, d: bedD, y: firstFloorY, h: frameH, mat: frameMat });                            // 프레임
  box({ x: insideX1 - 0.08, z: bedZ, w: 0.08, d: bedD, y: firstFloorY, h: frameH + 0.45, mat: frameMat });          // 헤드보드(동쪽=높은 X 벽)
  box({ x: bedX + 0.05, z: bedZ + 0.05, w: bedW - 0.13, d: bedD - 0.1, y: firstFloorY + frameH, h: mattressH, mat: mattressMat });
  box({ x: bedX + 0.05, z: bedZ + 0.05, w: (bedW - 0.13) * 0.6, d: bedD - 0.1, y: firstFloorY + frameH + mattressH, h: 0.06, mat: duvetMat });  // 이불(발치=서쪽~중간)
  for (const pz of [bedZ + 0.18, bedZ + bedD - 0.18 - 0.7]) {              // 베개 2개(머리맡=동쪽/높은 X)
    box({ x: insideX1 - 0.5, z: pz, w: 0.4, d: 0.7, y: firstFloorY + frameH + mattressH, h: 0.12, mat: pillowMat });
  }
  label(`침대 ${fmtDim(bedW)}x${fmtDim(bedD)}m`, bedX + bedW / 2, firstFloorY + 1.0, bedZ + bedD / 2, 'furniture');
});

// ── 1층 콘센트 — '1층' 그룹 '콘센트' 토글(firstOutletObjects). 종류별 색·높이: 일반(녹)·고전력(마젠타)·인덕션 직결 정션박스(보라). ──
// face로 벽 방향('+X'=低X벽서 +X, '-X'=高X벽서 -X, '+Z'=앞벽서 +Z, '-Z'=뒤벽서 -Z). kind: 'n' 일반·'h' 고전력·'i' 인덕션(소켓 없는 직결).
captureInto(firstOutletObjects, () => {
  // 콘센트 그리기는 fixtures.outlet 1벌(#7) — 종류(kind)·방향(face)만 지정.

  const baseY = firstFloorY + 0.3;      // 기본(난방) 높이 — 바닥+0.3
  const counterOutletY = firstFloorY + 1.1;   // 싱크대 상판 위(주방 가전) 높이 — 바닥+1.1(s2와 동일)
  const underCabY = firstFloorY + 0.4;   // 하부장 안(인덕션·온수기) 높이 — 바닥+0.4(s2와 동일)
  // 안방 — 정면 외벽(앞), 방문(내력벽 포켓도어) 쪽 코너에서 30cm. 전기 난방용(고전력)
  outlet(firstFamilyX + 0.3, insideZ0, baseY, '+Z', 'h');
  // 주방 — 왼쪽(서측·低X) 외벽, 앞에서 깊이 30cm. 전기 난방용(고전력)
  outlet(insideX0, insideZ0 + 0.3, baseY, '+X', 'h');
  // 주방 냉장고용 — 뒤 외벽(高Z), 냉장고 X중심(공유), 냉장고(1.70) 위. 일반
  outlet(fridgeCx, insideZ1, firstFloorY + 1.8, '-Z', 'n');
  // 주방 에어컨용 — 서측(低X) 외벽, 벽걸이 에어컨 옆(高Z 끝) 유닛 높이(공유). 고전력
  outlet(insideX0, acZ + acW + 0.15, acY, '+X', 'h');
  // 주방 인덕션용 — 뒤 외벽(高Z) 싱크대 하부장 안, 인덕션 X중심 아래. 직결 정션박스(보라)
  const inductionCx = cooktopX0 + cooktopW / 2;    // 인덕션 X중심(공유)
  outlet(inductionCx, insideZ1, underCabY, '-Z', 'i');
  // 주방 전기온수기용 — 뒤 외벽(高Z) 싱크대 하부장 안, 싱크볼 옆. 고전력
  outlet(kitchenSinkX + 0.5, insideZ1, underCabY, '-Z', 'h');
  // 주방 가전용 — 싱크대 위쪽 측면(低X) 벽 backsplash 2개. 일반
  outlet(insideX0, kitchenSinkZ + 0.15, counterOutletY, '+X', 'n');
  outlet(insideX0, kitchenSinkZ + 0.42, counterOutletY, '+X', 'n');
});

// (1층 전동커튼 레일 제거 — 외벽 창·문이 정면 현관문만 남아 커튼레일 대상 없음)

}

// 외부 부동수전·1층 실링팬 — 1층 골조/천장 그룹에 뒤늦게 합류(원본 scene 순서 보존을 위해 별도 호출).
export function buildFloor1Fixtures() {
  captureInto(firstWallObjects, () => {   // 외부 부동수전 → '외벽' 토글(J-③ 재배치 — 벽 부착 설비)

// 안방 왼쪽(도로측, 높은 X) 외벽에 외부 부동수전(동파방지 벽붙이형)
{
  const faucetX = buildingW;             // 외벽 바깥면(x=buildingW)
  const faucetZ = 1.1;                    // 도로측(고X) 솔리드 외벽 앞쪽
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

  });
  captureInto(firstCeilingObjects, () => {   // 1층 주방·안방 실링팬(각 방 천장 가운데) — '천장' 토글
    ceilingFan({ x: firstKitchenX + firstKitchenW / 2, z: insideZ0 + firstKitchenD / 2, ceilingY: firstCeilingY });
    ceilingFan({ x: firstFamilyX + firstFamilyW / 2, z: insideZ0 + firstFamilyD / 2, ceilingY: firstCeilingY });
  });
}
