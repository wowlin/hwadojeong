// s2/stair.js — s2 배치 기반(발자국·온통기초·옥외계단·치수) + 계단(좌우런·스위치백)·홈리프트·층 바닥.
// (main.js S2 구역에서 줄 이동. 2·3층 실내·콘센트는 4c에서 floor2/floor3/outlets로 재분리 예정.)
import * as THREE from 'three';
import { } from '../scene.js';
import { materials } from '../materials.js';
import { box, fmtDim, captureInto } from '../primitives.js';
import { label, planXDim, planYDim, planZDim } from '../labels.js';
import { deckStairs } from '../fixtures.js';
import { } from '../builders.js';
import { } from '../openings.js';
import { groundTopY, matFoundationH } from '../constants.js';
import { planY, planH, lotX0, lotX1, lotZ0, lotZ1 } from '../layout.js';
import {
  S2_STAIR, s2W, s2X0, s2BackZ, s2WallT, s2F3VanityW, s2WcSinkGap, s2WcToiletOff,
  s2LandingW, s2LiftW, s2LiftD, s2Geo,
  s2D, s2FrontZ, roofY, s2FrontStair,
} from './constants.js';
import {
  s2FootprintObjects, s2FoundationObjects, s2DimObjects, s2Floor1Objects,
  s2Stair2Objects, s2StairLowA, s2StairMidA, s2StairLowB, s2StairMidB, s2StairUpB,
  s2LiftObjects, } from '../groups.js';

export function buildS2Base() {
// 배치도 발자국(납작) — s2 탭에서만 표시
s2FootprintObjects.push(box({ x: s2X0, z: s2FrontZ, w: s2W, d: s2D, y: planY, h: planH, mat: materials.foundation, cast: false, name: 'ground' }));
// 기초(온통 0.5m 슬래브) — 's2 기초' 토글
captureInto(s2FoundationObjects, () => {
  box({ x: s2X0, z: s2FrontZ, w: s2W, d: s2D, y: groundTopY, h: matFoundationH, mat: materials.matFoundation });   // 집 매트 0.5m
  planYDim(-0.1, s2BackZ + 0.1, groundTopY, groundTopY + matFoundationH, `기초 ${fmtDim(matFoundationH)}m`);   // 남쪽 모서리 높이 치수(s1과 동일 위치)
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
  const gridMat2 = materials.gridGuide;
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
  // 2·3층 바닥 두께(floor2T/floor3T)는 각 층 모듈이 s2Floor2/3SlabT에서 직접 읽는다.
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
  // 2·3층 실내(floor2/floor3)·콘센트(outlets)는 분리 모듈이 그린다 — 아래 s2Geo 공유값을 읽음(호출은 main 파이프라인 순서).
  Object.assign(s2Geo, { zB0, far3, levels, liftX0, liftZ0, liftW, liftD, wcFaceX, g2RoomW, RM_L, wcW3, wcSinkOff, placeMark, corrX: liftX0 + liftW - 2.025 });   // corrX = 앞·뒤 복도창 X중앙(1·2·3층 공유 — 옛 5곳 재계산 제거 #2)


  // 층고·천장고 치수는 여기 표기하지 않음 — 천장고는 윗층 바닥 슬래브(외벽 토글)와 함께 표시.
}
