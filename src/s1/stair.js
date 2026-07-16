// s1/stair.js — s1 ㄷ자 계단(본체·주석·계단실 내벽·수납장) (main.js에서 줄 이동).
// buildStair()가 계단 그룹을 재빌드한다. 말미 화면 갱신(applyVisibility)은 main.js 호출부로 이동(순환 제거).
import * as THREE from 'three';
import { scene } from '../scene.js';
import { materials } from '../materials.js';
import { box, flatPoly, fmtDim, railCylinder, captureInto } from '../primitives.js';
import { label, room, roomText } from '../labels.js';
import {
  gableLongWallX, lowWall, verticalWallWithGaps, interiorDoorHorizontal, pocketDoorVertical,
} from '../openings.js';
import { yzWallPrism } from '../builders.js';
import {
  buildingW, buildingD, exteriorWall, interiorWall, interiorDoorW, interiorDoorH,
  stairRunW, stairRiserHeight, stairRiserCount, stairTreadDepth,
  lowerStraightTreadCount, winderTreadCount, landingTreadCount, upperStraightTreadCount,
  secondFloorThickness, secondWallHeight,
} from '../constants.js';
import {
  buildingFrontZ, firstFloorY, firstWallY, insideZ0, insideZ1,
  stairLowXRunX, stairHighXRunX, stairTurnD, stairTurnStart,
  firstKitchenX, firstKitchenW, firstKitchenD, firstFamilyX, firstFamilyW, firstFamilyD,
  familyInnerWallX, familyInnerWallW, familyDoorZ, innerWallW,
  roofRiseAtZ,
} from '../layout.js';
import {
  stairObjects, stairCoreObjects, kitchenInnerWallObjects, familyInnerWallObjects,
  secondFloorObjects, atticInnerWallObjects,
} from '../groups.js';

// ── 계단 단독 설계(ㄷ자 가변 계단) ─────────────────────────────────────────────
// 뒤벽에 붙는 ㄷ자(반환) 계단을 가변값 4개로 그린다: 너비·단높이·계단폭(디딤 깊이)·개수.
//   1층 바닥 → 하부 곧은계단(+Z, 뒤로 오름) → 하부 돌음(부채꼴 90°) → 상부 돌음(부채꼴 90°, 평참 없음)
//   → 반대 방향 상부 곧은계단(-Z, 앞으로 오름) → 마지막 단 위 = 다락 바닥.
//   하부 첫 단과 상부 마지막 단(다락)이 같은 수직선상. 입·출구 앞은 통행 ≥1m.
//   1층바닥→다락바닥 전체 높이(=개수×단높이=1층 층고)를 함께 표시하고 값 바뀌면 갱신.
export const stairParams = { R: stairRiserHeight, T: stairTreadDepth, N: stairRiserCount };   // 단높이(R)·디딤(T)·개수(N) 모두 상수 파생(단일 출처) — 여기 숫자 박지 말 것. 너비·위치는 1층 계단실 고정

// ㄷ자 계단 좌표 — 1층 계단실(stairLowXRunX·stairHighXRunX, 뒤벽 턴존)에 맞춰 도출. 두 화면(계단·1층) 공유.
export function stairGeom(p) {
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
  return { W, R, T, N, fy, nWind, nLand, nL, nU, loftY, landingY, treadH, riserD, nosing, zBack, turnD, zTurn0, laneA, laneB, zFrontL, zFrontU };   // flightLenL/U는 내부 파생용(미소비 반환 제거)
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
  // 하부 계단 중간 단에 선 185cm 사람 — 화장실 사람과 동일 피규어(계단 화면 공유)
  {
    const stepIdx = Math.floor(nL / 2), feetY = fy + (stepIdx + 1) * R;   // 하부런 중간 단 디딤 윗면
    const px = laneA + W / 2, pz = zFrontL + stepIdx * T + T / 2;          // 런 X 중앙·중간 단 디딤 Z 중앙
    const ph = 1.85, headR = 0.12, bodyH = ph - headR * 2, bodyR = 0.16;
    const pMat = new THREE.MeshLambertMaterial({ color: 0x8aa0b4 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(bodyR, bodyR, bodyH, 20), pMat);
    body.position.set(px, feetY + bodyH / 2, pz);
    scene.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(headR, 20, 14), pMat);
    head.position.set(px, feetY + bodyH + headR, pz);
    scene.add(head);
    label('185cm', px, feetY + ph + 0.14, pz, 'mep');
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
    const wcWallH = (loftY - secondFloorThickness) - fy;
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
  const innerWallAnno = [];       // '내벽 높이' 막대+라벨 → '안방 내력벽' 토글(familyInnerWallObjects)로 분리(막대가 그 벽에 붙음).
  const loftSuWalls = [];         // 수납장 실제 벽(계단쪽·뒤) → '다락 내벽' 토글(atticInnerWallObjects)로 분리. 벽자리 띠는 '다락 바닥'에 남김.
  const g = stairGeom(p);
  const { W, R, T, fy, nL, nWind, loftY, laneA, laneB, zTurn0, zBack, zFrontL, zFrontU } = g;
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
  // 두께는 30cm 고정(secondFloorThickness). 윗면=다락 바닥 높이(loftY), 밑면=loftY-30cm → 양쪽 내벽이 이 밑면에 맞춰 높이 변함.
  const loftTh = secondFloorThickness;
  const nHead = Math.floor(((loftY - loftTh - 2.0) - fy) / R);   // 헤드룸 2m 확보되는 최대 단
  const fillZend = zFrontL + nHead * T;
  // 다락 바닥 슬래브 — '다락 바닥' 토글(secondFloorObjects)로 분리(anno엔 안 넣음). 주방 위·안방 위 다락바닥은 계단실(가운데)만 비우고 양쪽을 뒤 외벽까지, 앞쪽 통행 바닥과 zFrontU에서 이어짐. 1층 계단 위 메움은 헤드룸 2m 확보되는 단까지(구별색).
  const flr = loftY - loftTh;                    // 수납장 바닥 슬래브 윗면 밑선(벽자리 띠·바닥 메움 공통)
  const suZ0 = zFrontU + interiorWall;            // 앞: 다락 입구 가로벽(다락복도쪽) 뒷면 = 안목 시작
  const suX1 = laneA + W - interiorWall;          // 계단쪽 옆벽 안쪽 면 (계단 올라오는 쪽)
  const suDepthClear = 0.6;                       // 수납장 안목 깊이(앞→뒤) — 단일 출처. 헤드룸 2m 한계보다 작을 때만 유효
  const suZ1 = Math.min(suZ0 + suDepthClear, fillZend - interiorWall);   // 뒤벽 안쪽 면 = 안목 0.8m 또는 헤드룸 한계 중 앞쪽
  const suZback = suZ1 + interiorWall;           // 뒤벽 바깥끝(벽자리·옆벽 뒤끝) — 안목 뒤에 벽두께
  captureInto(loftSlabs, () => {
    // 통행·주방위·안방위 노란 슬래브 제거 — 흰색 구조 슬래브(주방측·복도·안방측)가 같은 자리를 이미 덮어, 벽 밑에서 노란 바닥이 겹쳐 반짝이던 것 해소
    if (suZ1 > suZ0) {
      box({ x: laneA, z: suZ0, w: suX1 - laneA, d: suZ1 - suZ0, y: flr, h: loftTh, mat: materials.bed, cast: false });             // 수납장 안목 바닥(다락방 색) → '다락 바닥' 토글
    }
  });
  // 수납장(붙박이장) 벽자리·라벨·실제 벽 → '다락 내벽' 토글. 계단쪽(세로, 지붕 슬로프 따라)+뒤(가로, 그 위치 지붕 높이). 앞벽은 다락 입구 가로벽이 이미 있음.
  captureInto(loftSuWalls, () => {
    if (suZ1 > suZ0) {
      // 벽자리 표시(다락 벽과 같은 색 띠) — 앞·계단쪽·뒤 3변. 주방쪽은 다락방1 칸막이벽이 이미 담당.
      box({ x: laneA, z: zFrontU, w: suX1 - laneA, d: interiorWall, y: flr, h: loftTh, mat: materials.wall, cast: false });        // 앞(다락 복도쪽) 벽자리
      box({ x: suX1, z: zFrontU, w: interiorWall, d: suZback - zFrontU, y: flr, h: loftTh, mat: materials.wall, cast: false });   // 계단쪽 옆 벽자리
      box({ x: laneA, z: suZ1, w: suX1 - laneA, d: interiorWall, y: flr, h: loftTh, mat: materials.wall, cast: false });           // 뒤 벽자리
      label(`수납장 ${fmtDim(suX1 - laneA)}×${fmtDim(suZ1 - suZ0)}m`, (laneA + suX1) / 2, loftY + 0.05, (suZ0 + suZ1) / 2, 'dim');
      gableLongWallX({ x: suX1, z: zFrontU, d: suZback - zFrontU, y: loftY, baseH: secondWallHeight, thickness: interiorWall, mat: materials.wall });   // 계단쪽 옆벽
      box({ x: laneA, z: suZ1, w: suX1 - laneA, d: interiorWall, y: loftY, h: secondWallHeight + roofRiseAtZ(suZ1), mat: materials.wall });               // 뒤벽
    }
  });
  // (상부 마지막 단↔다락 바닥 사이 계단벽은 두지 않음 — 30cm 두께 다락 바닥의 앞면이 그 단높이 벽 역할을 함)
  // ('다락 통행' 라벨 제거 — 다락 복도가 이미 있어 중복)
  // 1층 계단 앞 통행 — 하부계단 입구(zFrontL)에서 앞 외벽 안쪽(insideZ0)까지. 하부 단수가 늘면 줄어든다.
  // (도면 위 라벨은 두지 않음 — 뒤쪽 계단을 가려서. 통행 거리 값은 좌상단 패널에 표시)
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
  return { loftSlabs, stairLandingAnno, innerWallAnno, loftSuWalls };   // 소비되는 분류 배열만 반환(미사용 8필드 제거)
}

// 계단실 양쪽 세로 내벽(주방|계단실·계단실|안방) — 윗면이 다락 바닥 밑면(loftY-30cm)에 맞도록 높이가 계단에 따라 변함.
// 계단 화면 + 1층/다락/지붕 단계 공유(stairWallObjects). 계단 변경 시 buildStair()에서 다시 그림.
function buildStairWalls() {
  clearStairGroup(kitchenInnerWallObjects);
  clearStairGroup(familyInnerWallObjects);
  const wt = exteriorWall, z0 = buildingFrontZ, wy = firstWallY + 0.003;
  const inW = innerWallW, inOv = 0.003;   // inOv: 앞·뒤 외벽 안쪽으로 3mm만 파고들어 연결부 면겹침(z-fighting 반짝) 방지 — 폭은 안목 insideD로 계산됨
  const g = stairGeom(stairParams);                        // 단수 clamp·다락 높이 = stairGeom 단일 출처(재계산 제거)
  const wallH = (g.loftY - secondFloorThickness) - wy;     // 윗면 = 다락 바닥 밑면
  const d = buildingD - 2 * wt + 2 * inOv;
  const zStart = z0 + wt - inOv;
  const fx = familyInnerWallX - familyInnerWallW / 2;
  captureInto(kitchenInnerWallObjects, () => {
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

function clearStairGroup(arr) {
  for (const o of arr) {
    scene.remove(o);
    if (o.geometry) o.geometry.dispose();
    if (o.material && o.material.map) o.material.map.dispose();
  }
  arr.length = 0;
}
export function buildStair() {
  clearStairGroup(stairCoreObjects);                                       // 계단 본체(계단+1층 공유)
  clearStairGroup(stairObjects);                                           // 계단 화면 전용 주석
  buildStairWalls();                                                       // 양쪽 내벽 — 다락 바닥 밑면(30cm)에 맞춰 높이 갱신
  captureInto(stairCoreObjects, () => { drawStairCore(stairParams); });
  { const _s = scene.children.length; const stairInfo = drawStairAnno(stairParams);
    // 계단참·다락통행·내벽높이 라벨은 '바닥'이 아니라 각자 토글로 분리 → 바닥 화면에서 제외.
    const _moved = new Set([...stairInfo.loftSlabs, ...stairInfo.stairLandingAnno, ...stairInfo.innerWallAnno, ...stairInfo.loftSuWalls]);
    stairObjects.push(...scene.children.slice(_s).filter((o) => !_moved.has(o)));  // 분리분 제외 → '바닥'엔 안 뜸
    secondFloorObjects.push(...stairInfo.loftSlabs);    // 수납장 안목 바닥 → '다락 바닥' 토글
    atticInnerWallObjects.push(...stairInfo.loftSuWalls);                          // 붙박이장(수납장) 벽자리·라벨·실제 벽 → '내벽' 토글
    stairCoreObjects.push(...stairInfo.stairLandingAnno);                          // '돌음' 라벨 → '계단' 토글
    familyInnerWallObjects.push(...stairInfo.innerWallAnno); }                     // '내벽 높이' 막대+라벨 → '안방 내력벽' 토글(막대가 그 벽에 붙음)
}
