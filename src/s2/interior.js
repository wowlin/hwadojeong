// s2/interior.js — s2 1층 실내: 식탁·의자(캠핑의자)·화목난로(+연통)·싱크대(주방)·주방 콘센트·천장 조명/실링팬.
// (main.js S2 구역에서 줄 이동.)
import * as THREE from 'three';
import { scene } from '../scene.js';
import { materials } from '../materials.js';
import { box, fmtDim, captureInto, railCylinder } from '../primitives.js';
import { label } from '../labels.js';
import { campingChair, ceilingFan, ceilingLight, coveLight, outlet, woodTable, fridge311 } from '../fixtures.js';
import { groundTopY, matFoundationH } from '../constants.js';
import {
  S2_STAIR, s2W, s2X0, s2BackZ, s2WallT, s2FrontZ, roofY, s2RidgeZ, s2RoofUnderY,
  s2F1Top, s2Ceil1Y, s2Ceil2Y,
} from './constants.js';
import { s2FurnitureObjects, s2SinkObjects, s2StoveObjects, s2Wall1Objects, s2Fan1Objects, s2Fan2Objects } from '../groups.js';

export function buildS2Interior() {
// ── s2 1층 가구(식탁·의자) — '테이블·의자' 토글(구조 섹션) ─────────────────────────
// 식탁 3개(윗판 110×72cm·높이 0.72)를 좌우(x)로 이어 옆으로 길게(약 3.3m). 의자=반고 햄프턴 DLX(campingChair,
//  폭~0.6·깊이~0.55·좌고 0.42 — 실제 햄프턴 DLX 폭 60·좌고 45와 부합). 앞·뒤 긴 변에 테이블당 1개씩 여유있게.
{
  const _furnStart = scene.children.length;
  const fTop = s2F1Top;            // 1층 바닥 표면(층참 윗면) — 단일 출처
  const TW = 0.85, TD = 0.72;   // 윗판 85×72 — 본체는 fixtures.woodTable 1벌(#12)
  const off = TD / 2 + 0.30;                                  // 테이블 가장자리→의자 중심
  const chairBack = off + 0.33, aisle = 0.9, endGap = 0.9;    // 의자 등받이 뒤끝 · 의자 뒤 통로 0.9 · 테이블 끝 0.9
  // 식탁 세트(이동공간 포함)를 오른쪽(低x) 예약공간 옆·앞쪽(低z=−2.4 벽) 안쪽에 붙임.
  const inZF = s2FrontZ + s2WallT;   // 앞(低z) 외벽 안쪽 면
  const reserveW = 1.0;                                       // 오른쪽(低x) 벽쪽 예약 공간 폭 — 식탁은 예약공간 옆에 붙임
  const cxC = (s2X0 + s2WallT + reserveW) + endGap + 2 * TW;   // 식탁 행 중심 x(우벽 예약공간 바깥 + 끝여유 + 행 절반 2·TW)
  const cz0 = inZF + aisle + chairBack;                       // 식탁 중심 z(앞벽에서 통로 + 의자 등받이 뒤)
  const cxs = [cxC - 1.5 * TW, cxC - 0.5 * TW, cxC + 0.5 * TW, cxC + 1.5 * TW];   // 4개를 좌우로 이어 옆으로 길게
  for (const cx of cxs) woodTable({ cx, cz: cz0, baseY: fTop, w: TW, d: TD });
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
  const fTop = s2F1Top;          // 1층 바닥 표면(층참 윗면) — 단일 출처
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
  const FW = fridge311.w, FD = fridge311.d, FH = fridge311.h, bGap = 0.05;   // 기존 냉장고 제원(fixtures.fridge311 단일 출처) · 뒷벽과 간격
  const frBack = inZB - bGap;                               // 냉장고 뒷면 z(뒤벽에서 bGap 띄움)
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
  const f2SwMat = materials.swingSweep;
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
  const fTop = groundTopY + matFoundationH + S2_STAIR.slabT;
  const inXL = s2X0 + s2W - s2WallT;                          // 좌(高x) 외벽 안쪽 면
  const inZB = s2BackZ - s2WallT;                            // 뒤(高z) 외벽 안쪽 면
  const F2W = 1.1, FW = fridge311.w, bGap = 0.05;
  const cSink = ((s2FrontZ + s2WallT) + inZB) / 2;          // 좌측벽 앞뒤 중심(=폴딩창 중심)
  const foldHalf = (4 * 0.68) / 2, jambGap = 0.12;          // 좌측 폴딩창 반폭 1.36 + 창틀 밖 여유(개구부 밖 배치)
  const cInner = cSink - foldHalf - jambGap;                // 창 앞쪽(低z) 옆 — 개구부 밖 벽면(상판 위 콘센트)
  const cWall = cSink + foldHalf + jambGap;                 // 창 뒤쪽(高z) 옆 — 개구부 밖 벽면
  const f2Cz = (s2FrontZ + s2WallT) + F2W / 2;             // 양문형 냉장고 자리(앞)
  const frCz = (inZB - bGap) - FW / 2;                     // 기존 냉장고 자리(뒤)
  const inOutlet = (cz, oy) => outlet(inXL, cz, oy, '-X');   // 좌벽 안쪽 면서 실내(-X)로 돌출 — fixtures.outlet 1벌(#7)

  inOutlet(cInner, fTop + 1.1);
  inOutlet(cWall, fTop + 1.1);
  inOutlet(f2Cz, fTop + 1.85);
  inOutlet(frCz, fTop + 1.85);
  // 싱크볼 아래 30L 전기온수기 전용 콘센트 — 고전력(주황). 하부장 안 측벽, 온수기 본체 옆·낮은 높이(바닥+0.4m)
  const inHeatOutlet = (cz, oy) => outlet(inXL, cz, oy, '-X', 'h');   // 고전력(주황) — fixtures.outlet 1벌

  inHeatOutlet(cSink + 0.5, fTop + 0.4);
  // 인덕션 전원 — 직결(하드와이어). 콘센트 아님 → 소켓 없는 정션박스(전선 인출구)로만 표시. 고전력(주황).
  // 싱크 앞쪽(低z) 옆 하부장 안, 낮은 높이(바닥+0.4m). cSink-0.9 = 싱크 반폭(0.6)+옆장 반폭(0.3)
  box({ x: inXL - 0.045, z: (cSink - 0.9) - 0.07, w: 0.045, d: 0.14, y: fTop + 0.4, h: 0.14, mat: materials.inductionOutlet });   // 정션박스 블랭크 커버(소켓 없음 = 직결·보라)
});

// ── s2 1층 주방측(오른쪽) 벽 콘센트 — '외벽'(s2Wall1) 토글에 귀속. 우측 슬라이드창 양옆(앞·뒤·개구부 밖) 2개. ──
captureInto(s2Wall1Objects, () => {
  const fTop = groundTopY + matFoundationH + S2_STAIR.slabT;
  const inXR = s2X0 + s2WallT;                                // 우(低x·주방측) 외벽 안쪽 면
  const fdColT = 0.3, rGap = 4 * 0.8, jambGap = 0.12;        // 우측 슬라이드창 개구부 = 3.2m, 창틀 밖 여유
  const roA0 = s2FrontZ + s2WallT + fdColT;                  // 슬라이드창 앞(低z) 끝
  const roA1 = roA0 + rGap;                                  // 슬라이드창 뒤(高z) 끝
  const cFront = roA0 - jambGap;                             // 창 앞쪽 옆(개구부 밖)
  const cBack = roA1 + jambGap;                              // 창 뒤쪽 옆(개구부 밖)
  const inOutlet = (cz, oy) => outlet(inXR, cz, oy, '+X');   // 우벽 안쪽 면서 실내(+X)로 돌출 — fixtures.outlet 1벌(#7)

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
  const ceil1Y = s2Ceil1Y;                                   // 1층 천장(2층 슬래브 밑면) — 단일 출처
  const ceil2Y = s2Ceil2Y;                                   // 2층 천장(3층 슬래브 밑면) — 단일 출처
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

}
