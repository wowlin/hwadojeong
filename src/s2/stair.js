// s2/stair.js — s2 배치 기반(발자국·온통기초·옥외계단·치수) + 계단(좌우런·스위치백)·홈리프트·층 바닥.
// (main.js S2 구역에서 줄 이동. 2·3층 실내·콘센트는 4c에서 floor2/floor3/outlets로 재분리 예정.)
import * as THREE from 'three';
import { scene } from '../scene.js';
import { materials } from '../materials.js';
import { box, fmtDim, captureInto } from '../primitives.js';
import { label, planXDim, planYDim, planZDim } from '../labels.js';
import { deckStairs, chairFrameMat } from '../fixtures.js';
import { yzWallPrism } from '../builders.js';
import { horizontalWallWithGaps, pocketDoorVertical } from '../openings.js';
import { groundTopY, matFoundationH, interiorWall, interiorDoorW, interiorDoorH } from '../constants.js';
import { planY, planH, lotX0, lotX1, lotZ0, lotZ1 } from '../layout.js';
import {
  S2_STAIR, s2W, s2X0, s2BackZ, s2WallT, s2Floor2SlabT, s2Floor3SlabT,
  s2F3VanityW, s2F3VanityD, s2F3VanityH, s2F3HeaterL, s2WcSinkGap, s2WcToiletOff,
  s2LandingW, s2LiftW, s2LiftD, s2WallInner, s2F2, s2Geo,
  s2D, s2FrontZ, roofY, s2RidgeZ, s2RoofUnderY, s2FrontStair,
} from './constants.js';
import {
  s2FootprintObjects, s2FoundationObjects, s2DimObjects, s2Floor1Objects,
  s2Stair2Objects, s2StairLowA, s2StairMidA, s2StairLowB, s2StairMidB, s2StairUpB,
  s2Floor2Objects, s2Floor3Objects, s2LiftObjects, s2Wall2Objects, s2Wall3Objects,
} from '../groups.js';

export function buildS2Base() {
// 배치도 발자국(납작) — s2 탭에서만 표시
s2FootprintObjects.push(box({ x: s2X0, z: s2FrontZ, w: s2W, d: s2D, y: planY, h: planH, mat: materials.foundation, cast: false, name: 'ground' }));
// 기초(온통 0.5m 슬래브) — 's2 기초' 토글
captureInto(s2FoundationObjects, () => {
  box({ x: s2X0, z: s2FrontZ, w: s2W, d: s2D, y: groundTopY, h: matFoundationH, mat: materials.matFoundation });   // 집 매트 0.5m
  planYDim(-0.1, s2BackZ + 0.1, groundTopY, groundTopY + matFoundationH, '기초 0.5m');   // 남쪽 모서리 높이 치수(s1과 동일 위치)
});
// 옥외 계단 사양(s2FrontStair·s2RearStair)은 ./s2/constants.js
// 정면(앞·현관 쪽) 전체폭 옥외 계단 — 지면부터 1층 바닥(기초 0.5+바닥 마감)까지, 집 너비 전체, 앞(−Z)으로 디딤. 's2 1층' 토글.
captureInto(s2Floor1Objects, () => {
  deckStairs({ axis: 'x', span0: s2X0, span1: s2X0 + s2W, edge: s2FrontZ, outward: -1, topY: groundTopY + matFoundationH + S2_STAIR.slabT, baseY: groundTopY, steps: s2FrontStair.steps, tread: s2FrontStair.tread, mat: materials.porcelainDeck });
});
// 치수 + 기준선 — s1과 같은 부분(너비=위, 깊이=양옆)
captureInto(s2DimObjects, () => {
  planXDim(lotZ1 + 0.4, s2X0, s2X0 + s2W, `${fmtDim(s2W)}m`);          // 너비(s1 자리)
  planZDim(lotX1 + 0.35, s2FrontZ, s2BackZ, `${fmtDim(s2D)}m`);        // 깊이(파생) — 안방측(s1 buildingD 자리)
  planZDim(lotX0 - 0.4, s2FrontZ, s2BackZ, `${fmtDim(s2D)}m`);         // 깊이(파생) — 주방측(s1 buildingD 자리)
  // 기준선(회청색) — 새 끝점만: 너비 끝 x=s2W, 깊이 앞 z=s2FrontZ (x=0·뒤 z=buildingBackZ은 공통 기준선 사용)
  const gridMat2 = new THREE.MeshBasicMaterial({ color: 0x5b7185 });
  const gw = 0.02, gy = 0.009, gh = 0.002;
  const gz0 = lotZ0 - 0.6, gz1 = lotZ1 + 0.6, gx0 = lotX0 - 0.6, gx1 = lotX1 + 0.6;
  box({ x: (s2X0 + s2W) - gw / 2, z: gz0, w: gw, d: gz1 - gz0, y: gy, h: gh, mat: gridMat2, cast: false, name: 'ground' });   // 너비 끝(x=s2W) 세로 기준선
  box({ x: gx0, z: s2FrontZ - gw / 2, w: gx1 - gx0, d: gw, y: gy, h: gh, mat: gridMat2, cast: false, name: 'ground' });       // 깊이 앞 가로 기준선
});
}

// ── s2 계단(현행·좌우런·우측벽 스위치백, 1→3층) — 'cS2Stair2' 토글 = 구조 '계단' ──────
// 구안(s2Stair3: 앞뒤런·뒷벽 참)을 90° 돌린 현행안. 두 직선런이 좌우(±X)로 오르고,
//   180° 스위치백 참을 우측벽(低X)에 밀착 → 화장실·방배치 자유도 확보. 입구·층 연결은 반대편(高X·안방쪽).
// 단높이(R) 전 구간 0.15m 통일 → 1→2층 22단·2→3층 20단, 끊김 없이 각 층 바닥에 정확히 착지.
export let s2G1FrontInnerX, s2G2FrontInnerX;   // 3층 게스트룸1·2 정면벽 안쪽벽 면(X) — 계단 계산부에서 도출, 정면 픽스창 배치의 단일 출처
export let s2Landing12Y, s2Landing23Y;         // 계단참(스위치백 참) 윗면 Y — 1-2참·2-3참, 계단실 채광창 높이 기준(계단 계산부에서 도출)
const s2FrontFixInset = 0.3;            // 정면 픽스창 양옆 벽면 여백 — 외벽 안쪽면·게스트룸 내벽면 공통 30cm(외벽은 두께 30cm라 바깥면 기준 60cm)
export const s2FrontFixSpans = () => [         // [주방쪽(低X)·안방쪽(高X)] 정면 픽스창 X스팬 — 2·3층 정면 픽스창이 공유(같은 폭·수직 정렬)
  { p0: (s2X0 + s2WallT) + s2FrontFixInset, p1: s2G1FrontInnerX - s2FrontFixInset },   // 주방쪽: 외벽 ~ 게스트룸1 옆벽
  { p0: s2G2FrontInnerX + s2FrontFixInset, p1: (s2W - s2WallT) - s2FrontFixInset },     // 안방쪽: 게스트룸2 복도벽 ~ 외벽
];
export function buildS2Stair() {
  const baseY = groundTopY + matFoundationH;
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
    const wcSetback3 = 0.4;                     // 3층 화장실 문 있는 앞벽(복도쪽 低Z)을 뒤로 들여 앞 복도·실외기실 확보 — 깊이 축소(단일 출처). 깊이 = liftD−0.4
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
    wallOutlet(abX2, abWz, oy, '-Z', true);                   // 전기 난방용(주황)
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
}
