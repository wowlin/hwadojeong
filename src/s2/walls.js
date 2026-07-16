// s2/walls.js — s2 층별 외벽(개구부·창·폴딩도어)·눈썹지붕·실외기실(3층)·뒤 출입문·옥외 뒤 계단·부동수전·외부 콘센트.
// (main.js S2 구역에서 줄 이동. 정면 픽스창 스팬·계단참 채광창 높이는 s2/stair.js 공유값.)
import * as THREE from 'three';
import { scene } from '../scene.js';
import { materials } from '../materials.js';
import { box, fmtDim, captureInto } from '../primitives.js';
import { label, planYDim } from '../labels.js';
import { deckStairs, outlet } from '../fixtures.js';
import { yzWallPrism } from '../builders.js';
import { frontFixSash, frontAwningSash, sideSash, awningSash } from '../openings.js';
import { groundTopY } from '../constants.js';
import {
  S2_STAIR, s2W, s2X0, s2BackZ, s2FrontZ, s2WallT, _wBase, roofY,
  s2RoofUnderY, s2RidgeZ, s2RearStair,
  s2Geo, s2F1Top, s2Lvl2, s2Lvl3, s2Ceil1Y, s2Ceil2Y, s2WcSetback3,
} from './constants.js';
import { s2FrontFixSpans, s2Landing12Y, s2Landing23Y } from './stair.js';
import { s2Wall1Objects, s2Wall2Objects, s2Wall3Objects, s2Ecu3Objects, s2Floor1Objects } from '../groups.js';

export function buildS2Walls() {
// ── s2 외벽 — 층별 분리(각 층 바닥 슬래브 밑면 ~ 그 층 천장). 층마다 '외벽' 버튼, 모든 층 켜면 연결 ──
// 박공 30°(기준·초과 금지). 용마루는 긴변(X, s2W) 따라가고 경사는 깊이(Z, s2D) 가로지름 →
//   앞뒤벽 = 처마(평탄 상단, roofY) │ 좌우벽 = 박공 삼각(중앙서 용마루까지) → 좌우 끝에 꼭지점.
//   층 경계(슬래브 밑면)에서 끊어 그려, 인접 층 외벽이 위·아래로 정확히 맞물림(켜면 연결).
{
  const t = s2WallT, EW = materials.exteriorWall;
  const eaveY = roofY;                                                    // 처마 = 3층 벽 상단(지붕 안침)
  const zMid = s2RidgeZ, peakY = s2RoofUnderY(zMid);                      // 용마루(깊이 중앙·박공 밑선 단일 출처)
  // 사각 둘레 4벽(y0~y1) — 앞·뒤는 좌우벽 사이에 끼우고, 좌·우는 전체 깊이(겹침·틈 없음)
  const rectWalls = (y0, y1, frontOpen, rightOpen, backOpen, leftOpen) => {
    if (frontOpen) {   // 앞벽에 폴딩도어 개구부 — 하부 띠(바닥높이)·상부 인방·양 끝 기둥만 남기고 뚫음
      const { x0, x1, sillY, headY } = frontOpen;
      box({ x: s2X0 + t, z: s2FrontZ, w: s2W - 2 * t, d: t, y: y0, h: sillY - y0, mat: EW });          // 개구부 아래(바닥높이 띠)
      box({ x: s2X0 + t, z: s2FrontZ, w: s2W - 2 * t, d: t, y: headY, h: y1 - headY, mat: EW });        // 개구부 위(인방)
      box({ x: s2X0 + t, z: s2FrontZ, w: x0 - (s2X0 + t), d: t, y: sillY, h: headY - sillY, mat: EW });  // 우측 기둥(주방쪽)
      box({ x: x1, z: s2FrontZ, w: (s2W - t) - x1, d: t, y: sillY, h: headY - sillY, mat: EW });          // 좌측 기둥(안방쪽)
    } else {
      box({ x: s2X0 + t, z: s2FrontZ, w: s2W - 2 * t, d: t, y: y0, h: y1 - y0, mat: EW });       // 앞(현관 쪽)
    }
    if (backOpen) {   // 뒤벽 왼쪽(高x)에 폴딩 개구부 — 하부 띠·상부 인방·양쪽 기둥만 남김
      const { a0, a1, sillY, headY } = backOpen, bx = s2X0 + t, bw = s2W - 2 * t, bz = s2BackZ - t;
      box({ x: bx, z: bz, w: bw, d: t, y: y0, h: sillY - y0, mat: EW });                          // 개구부 아래(바닥높이 띠)
      box({ x: bx, z: bz, w: bw, d: t, y: headY, h: y1 - headY, mat: EW });                        // 개구부 위(인방)
      {   // 우측(低x) 벽 남김 — 층계참 프로젝트창(s1BackWin) 개구 1개 카빙
        const { p0: wp0, p1: wp1, sillY: ws, headY: wh } = s1BackWin;
        box({ x: bx, z: bz, w: wp0 - bx, d: t, y: sillY, h: headY - sillY, mat: EW });             // 창 우측(低x) 벽
        box({ x: wp1, z: bz, w: a0 - wp1, d: t, y: sillY, h: headY - sillY, mat: EW });            // 창 좌측 벽
        box({ x: wp0, z: bz, w: wp1 - wp0, d: t, y: sillY, h: ws - sillY, mat: EW });              // 창 아래 띠(창대)
        box({ x: wp0, z: bz, w: wp1 - wp0, d: t, y: wh, h: headY - wh, mat: EW });                 // 창 위 띠(인방)
      }
      box({ x: a1, z: bz, w: (s2W - t) - a1, d: t, y: sillY, h: headY - sillY, mat: EW });          // 좌측 기둥(高x)
    } else {
      box({ x: s2X0 + t, z: s2BackZ - t, w: s2W - 2 * t, d: t, y: y0, h: y1 - y0, mat: EW });     // 뒤(측백 쪽)
    }
    if (rightOpen) {  // 우측벽(x=0)에 폴딩 개구부 — 앞쪽 기둥·뒤쪽 벽·상하 띠만 남김
      const { a0, a1, sillY, headY } = rightOpen, rd = s2BackZ - s2FrontZ;
      box({ x: s2X0, z: s2FrontZ, w: t, d: rd, y: y0, h: sillY - y0, mat: EW });                  // 개구부 아래
      box({ x: s2X0, z: s2FrontZ, w: t, d: rd, y: headY, h: y1 - headY, mat: EW });                // 개구부 위(인방)
      box({ x: s2X0, z: s2FrontZ, w: t, d: a0 - s2FrontZ, y: sillY, h: headY - sillY, mat: EW });   // 앞쪽 기둥
      box({ x: s2X0, z: a1, w: t, d: s2BackZ - a1, y: sillY, h: headY - sillY, mat: EW });          // 뒤쪽 벽 남김
    } else {
      box({ x: s2X0, z: s2FrontZ, w: t, d: s2BackZ - s2FrontZ, y: y0, h: y1 - y0, mat: EW });     // 우(주방, x=0)
    }
    if (leftOpen) {  // 좌측벽(x=s2W−t·高x)에 폴딩 개구부 — 앞쪽 기둥·뒤쪽 벽·상하 띠만 남김
      const { a0, a1, sillY, headY } = leftOpen, rd = s2BackZ - s2FrontZ;
      box({ x: s2W - t, z: s2FrontZ, w: t, d: rd, y: y0, h: sillY - y0, mat: EW });                  // 개구부 아래
      box({ x: s2W - t, z: s2FrontZ, w: t, d: rd, y: headY, h: y1 - headY, mat: EW });                // 개구부 위(인방)
      box({ x: s2W - t, z: s2FrontZ, w: t, d: a0 - s2FrontZ, y: sillY, h: headY - sillY, mat: EW });   // 앞쪽 기둥
      box({ x: s2W - t, z: a1, w: t, d: s2BackZ - a1, y: sillY, h: headY - sillY, mat: EW });          // 뒤쪽 벽 남김
    } else {
      box({ x: s2W - t, z: s2FrontZ, w: t, d: s2BackZ - s2FrontZ, y: y0, h: y1 - y0, mat: EW });  // 좌(안방, x=s2W−t)
    }
  };
  // 창 개구부를 여러 개 지원하는 벽 그리기 — 한 벽에 창 N개를 뚫고 나머지를 골조(기둥·창대띠·인방띠)로 채운다.
  //   axis 'x': 앞/뒤벽(X를 따라, 고정 z) · axis 'z': 좌/우 측벽(Z를 따라, 고정 x). opens=[{p0,p1,sillY,headY}] (겹치지 않음)
  const wallStrip = (axis, fixed, a, b, y0, y1, opens, mat) => {
    const seg = (p0, p1, yy0, yy1) => {
      if (p1 - p0 <= 1e-6 || yy1 - yy0 <= 1e-6) return;
      if (axis === 'x') box({ x: p0, z: fixed, w: p1 - p0, d: t, y: yy0, h: yy1 - yy0, mat });
      else box({ x: fixed, z: p0, w: t, d: p1 - p0, y: yy0, h: yy1 - yy0, mat });
    };
    let cur = a;
    for (const o of [...opens].sort((u, v) => u.p0 - v.p0)) {
      seg(cur, o.p0, y0, y1);          // 창 앞 기둥(전체 높이)
      seg(o.p0, o.p1, y0, o.sillY);    // 창대 아래 띠
      seg(o.p0, o.p1, o.headY, y1);    // 창 위 인방 띠
      cur = o.p1;
    }
    seg(cur, b, y0, y1);               // 마지막 기둥
  };
  // 층 경계 = 실제 윗층 바닥 슬래브 아랫면(계단·바닥과 단일 출처). 바닥 표면 = F_n + 1층 마감두께.
  const lvl2 = s2Lvl2, lvl3 = s2Lvl3;                                     // 2·3층 바닥 표면 — s2/constants 단일 출처(계단 levels[1]·[2]와 동일)
  const y1 = s2Ceil1Y, y2 = s2Ceil2Y;                                    // 1층 천장(2층 슬래브 밑면) · 2층 천장(3층 슬래브 밑면) — 단일 출처
  // 1층 정면 폴딩도어 개구부 — 바닥 윗면에서 높이 2.4m, 정면 중심 기준 양개. 양 끝 기둥(3층 내하중 가정, 300mm) 남김.
  const f1Top = s2F1Top;                                                  // 1층 바닥 윗면(층참 윗면) — s2/constants 단일 출처
  // 뒤벽(집 뒤·+Z)에 홈리프트↔냉장고 사이 작은 표준 출입문(폭 0.8·높이 2.1) — 집 뒤로 나가는 문
  const bdLeafW = 0.8, bdOuterW = 0.9, bdFrameH = 2.1;
  const bkLiftHiX = s2Geo.liftX0 + s2Geo.liftW;   // 홈리프트 高X면 — 계단 모듈 실좌표(s2Geo) 단일 출처(옛 재계산 사본 제거 #1)
  const bkFridgeLoX = (s2W - t) - 0.689;                                    // 냉장고 低X면(좌벽 안쪽 − 냉장고 깊이 0.689)
  const bdCx = (bkLiftHiX + bkFridgeLoX) / 2;                               // 두 부재 사이 중앙
  const backDoorOpen = { a0: bdCx - bdOuterW / 2, a1: bdCx + bdOuterW / 2, sillY: f1Top, headY: f1Top + bdFrameH };
  const s1CorrX = s2Geo.corrX;                                             // 1층 층계참 프로젝트창 X중앙(2·3층 뒤벽창과 동일 X — s2Geo.corrX 단일 출처)
  const s1BackWin = { p0: (s1CorrX + 0.3) - 1.6, p1: s1CorrX + 0.3, sillY: groundTopY + 1.7, headY: groundTopY + 1.7 + 1.1 };   // 1.6×1.1 슬라이드창 — 창대 좌·우창과 동일(지표+1.7)·높이 1.1·2짝(0.8) 편개
  const fdColT = 0.3, fdH = 2.4;                                          // 기둥 굵기 300mm · 폴딩도어 높이 2.4m(표준 최대)
  const fdOpen = { x0: s2X0 + t + fdColT, x1: (s2W - t) - fdColT, sillY: f1Top, headY: f1Top + fdH };
  const rGap = 4 * 0.8;                                                   // 우측 4짝 양미서기 × 짝폭 0.8 = 3.2m 개구부
  const rO = { a0: s2FrontZ + t + fdColT, a1: s2FrontZ + t + fdColT + rGap, sillY: groundTopY + 1.7, headY: f1Top + fdH };  // 우측 슬라이드창 — sill 지표 위 1.7m·상단 f1Top+2.4 유지(높이 1.4m)
  const lGap = 4 * 0.68;                                                  // 좌측 폴딩창 2+2 양개 = 4짝 × 짝폭 0.68 = 2.72m 개구부
  const lCz = (s2FrontZ + s2BackZ) / 2;                                  // 좌측벽 앞뒤 중앙(싱크대와 동일 기준)
  const lO = { a0: lCz - lGap / 2, a1: lCz + lGap / 2, sillY: groundTopY + 1.7, headY: f1Top + fdH };  // 좌측 폴딩창 — 벽 중앙 배치·2+2 양개, sill 지표 1.7m·상단 rO와 동일(높이 1.4m)
  captureInto(s2Wall1Objects, () => rectWalls(_wBase, y1, fdOpen, rO, backDoorOpen, lO));   // 1층 외벽 — 기초 상단~1층 천장(정면·우측 개구부, 뒤벽 출입문·좌측 폴딩)
  captureInto(s2Wall1Objects, () => {                                     // 1층 뒤벽 슬라이드창 — 2짝(0.8) 편개, 오른쪽 짝이 왼쪽으로 미닫이
    const zc = s2BackZ - 0.13, sy = s1BackWin.sillY, hy = s1BackWin.headY, x0 = s1BackWin.p0, x1 = s1BackWin.p1;
    const F = materials.windowFrame;   // 창틀(windowFrame 공용 = 짙은 색)
    const slGlass = materials.slidingFixedGlass;   // 고정 짝
    const slMove  = materials.slidingMoveGlass;    // 미닫이 짝
    const pw = (x1 - x0) / 2, mullW = 0.05, trk = 0.03;
    box({ x: x0, z: zc - 0.06, w: x1 - x0, d: 0.12, y: sy, h: 0.08, mat: F });          // 하부 레일(2트랙 전폭)
    box({ x: x0, z: zc - 0.06, w: x1 - x0, d: 0.12, y: hy - 0.08, h: 0.08, mat: F });    // 상부 레일(2트랙 전폭)
    const pane = (xp, zt, mat) => {
      box({ x: xp, z: zt - 0.025, w: pw, d: 0.05, y: sy, h: hy - sy, mat, cast: false });                     // 유리
      box({ x: xp, z: zt - 0.035, w: mullW, d: 0.07, y: sy, h: hy - sy, mat: F, cast: false });               // 좌 세로살
      box({ x: xp + pw - mullW, z: zt - 0.035, w: mullW, d: 0.07, y: sy, h: hy - sy, mat: F, cast: false });   // 우 세로살
    };
    pane(x0, zc + trk, slGlass);        // 왼쪽(高X) 고정 짝 — 바깥트랙
    pane(x0 + pw, zc - trk, slMove);    // 오른쪽 미닫이 짝 — 안쪽트랙, 왼쪽으로 슬라이드
    box({ x: x0 + pw + 0.06, z: zc - trk - 0.085, w: 0.045, d: 0.045, y: sy + 0.26, h: 0.28, mat: materials.handle });   // 미닫이 손잡이(만남대측)
    label(`1층 뒤벽 슬라이드창 ${fmtDim(x1 - x0)}×${fmtDim(hy - sy)}m (2짝 편개)`, s1CorrX, sy + 0.4, s2BackZ + 0.1, 'opening');
  });
  captureInto(s2Wall1Objects, () => {                                     // 뒤 복도 슬라이드창 아래(뒤 외벽 高Z) 콘센트 — 2·3층 복도창 아래와 동일 X
    outlet(s1CorrX, s2BackZ - s2WallT, f1Top + 0.3, '-Z');   // fixtures.outlet 1벌(#7)
  });
  captureInto(s2Wall1Objects, () => {                                     // 뒤벽 작은 표준 출입문(홈리프트~냉장고 사이) — 유리 leaf + 문틀 + 손잡이
    const bz = s2BackZ - t, fr = 0.06, dep = 0.10, zc = bz + 0.10;        // 뒤벽 안쪽면·프레임 두께·깊이·문 몸통 Z(벽 두께 안)
    const x0 = backDoorOpen.a0, x1 = backDoorOpen.a1, by = f1Top, hh = bdFrameH, F = materials.entryFrame;
    box({ x: x0, z: zc, w: fr, d: dep, y: by, h: hh, mat: F });                          // 좌 세로 문틀
    box({ x: x1 - fr, z: zc, w: fr, d: dep, y: by, h: hh, mat: F });                     // 우 세로 문틀
    box({ x: x0, z: zc, w: x1 - x0, d: dep, y: by + hh - fr, h: fr, mat: F });           // 상부 인방
    box({ x: x0, z: zc, w: x1 - x0, d: dep, y: by, h: fr, mat: F });                     // 하부 문턱
    box({ x: x0 + fr, z: zc + 0.03, w: (x1 - x0) - 2 * fr, d: 0.04, y: by + fr, h: hh - 2 * fr, mat: materials.glass });   // 유리 문짝
    box({ x: x1 - fr - 0.05, z: zc - 0.02, w: 0.05, d: 0.04, y: by + hh * 0.42, h: hh * 0.16, mat: materials.handle });    // 세로 손잡이
    label(`뒤 출입문 ${fmtDim(bdLeafW)}×${fmtDim(hh)}m`, (x0 + x1) / 2, by + hh + 0.15, bz - 0.1, 'opening');
  });
  captureInto(s2Floor1Objects, () => {                                    // 뒤 출입문 앞 옥외 계단 — 너비 1m·3단(문턱=맨 위 단, 뒤쪽 +Z로 내려감). 정면 옥외 계단처럼 '1층 바닥' 토글
    deckStairs({ axis: 'x', span0: bdCx - s2RearStair.width / 2, span1: bdCx + s2RearStair.width / 2, edge: s2BackZ, outward: 1, steps: s2RearStair.steps, topY: f1Top, baseY: groundTopY, tread: s2RearStair.tread });
  });
  captureInto(s2Wall1Objects, () => {                                     // 왼쪽(안방쪽·高X) 외벽 외부 부동수전(벽붙이 야외수전) — 왼쪽 뒤에서 1m
    const wallX = s2W, fz = s2BackZ - 1.0;                                // 외벽 바깥면(x=8.5)·뒤벽서 1m 앞
    const brass = materials.handle;
    const bodyY = groundTopY + 0.65;                                      // 밸브 설치 높이(지면 위 0.57m)
    const outX = wallX + 0.14;                                           // 밸브 몸통 바깥 끝(바깥=+X)
    const cyl = (rTop, rBot, len, x, y, z, rotAxis, rot) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, len, 16), brass);
      m.position.set(x, y, z);
      if (rotAxis === 'x') m.rotation.x = rot;
      if (rotAxis === 'z') m.rotation.z = rot;
      m.castShadow = true; m.receiveShadow = false; scene.add(m); return m;
    };
    cyl(0.055, 0.055, 0.03, wallX + 0.015, bodyY, fz, 'z', Math.PI / 2);  // 벽 플랜지(벽면에 밀착한 원판)
    cyl(0.034, 0.034, 0.14, wallX + 0.07, bodyY, fz, 'z', Math.PI / 2);   // 밸브 몸통(벽에서 바깥으로 수평)
    cyl(0.014, 0.014, 0.10, outX, bodyY + 0.05, fz, null, 0);             // 핸들 축(세로)
    cyl(0.075, 0.075, 0.02, outX, bodyY + 0.10, fz, null, 0);             // 둥근 손잡이(휠)
    cyl(0.024, 0.024, 0.14, outX, bodyY - 0.08, fz, null, 0);             // 토수구(몸통 끝에서 아래로)
    cyl(0.028, 0.026, 0.035, outX, bodyY - 0.16, fz, null, 0);            // 끝 호스 연결구(약간 굵게)
    label('외부 부동수전', wallX + 0.5, bodyY + 0.5, fz - 0.25, 'mep');
  });
  captureInto(s2Wall1Objects, () => {                                     // 정면 좌우 코너(폴딩도어 양끝 300mm 기둥)에 외부(방수) 콘센트 2개
    const wallFaceZ = s2FrontZ;                                          // 정면 외벽 바깥면(−Z가 외부)
    const outletY = f1Top + 0.32;
    const extOutlet = (ox) => outlet(ox, wallFaceZ, outletY, '-Z');   // 외부(방수) 콘센트 — fixtures.outlet 1벌(#7)
    extOutlet(s2X0 + t + fdColT / 2);        // 정면 우측 코너(낮은 X, 폴딩도어 우측 기둥)
    extOutlet((s2W - t) - fdColT / 2);       // 정면 좌측 코너(높은 X, 폴딩도어 좌측 기둥)
  });
  captureInto(s2Wall1Objects, () => planYDim(s2W + 0.4, s2BackZ - 0.2, f1Top, y1, `1층 천장고 ${fmtDim(y1 - f1Top)}m`));   // 1층 바닥 윗면~천장 (3층 외벽최저와 같은 위치)
  captureInto(s2Wall1Objects, () => {                                     // 정면 폴딩도어 — 중앙 양개, 주방쪽(우) 절반 접어 열림
    const fdGlass = materials.slidingFixedGlass;   // 닫힌 짝 유리
    const fdMove = materials.slidingMoveGlass;    // 접힌(움직인) 짝 유리 — 약간 짙게
    const fdFrame = materials.foldingFrame;   // 폴딩 알루미늄 프레임(다크그레이)
    const mullW = 0.05;
    const ox0 = fdOpen.x0, ox1 = fdOpen.x1, sy = fdOpen.sillY, hy = fdOpen.headY, zc = s2FrontZ + t / 2;
    const cx = (ox0 + ox1) / 2, half = 5, pw = (ox1 - ox0) / 10;          // 양개: 한쪽 5짝, 짝폭 = (ox1-ox0)/10
    box({ x: ox0, z: zc - 0.05, w: ox1 - ox0, d: 0.1, y: sy, h: 0.08, mat: fdFrame });          // 하부 레일(문턱) — 고정 트랙(전폭)
    box({ x: ox0, z: zc - 0.05, w: ox1 - ox0, d: 0.1, y: hy - 0.08, h: 0.08, mat: fdFrame });   // 상부 레일 — 고정 트랙(전폭)
    // 안방쪽(좌, 高x) 절반 — 닫힘(평면 유리 + 세로 접이살)
    box({ x: cx, z: zc - 0.025, w: ox1 - cx, d: 0.05, y: sy, h: hy - sy, mat: fdGlass, cast: false });
    for (let i = 0; i <= half; i += 1) box({ x: cx + pw * i - mullW / 2, z: zc - 0.07, w: mullW, d: 0.14, y: sy, h: hy - sy, mat: fdFrame, cast: false });
    box({ x: cx + 0.085, z: zc - 0.13, w: 0.045, d: 0.045, y: sy + 0.95, h: 0.28, mat: materials.handle });   // 닫힌 짝 중앙 손잡이
    // 주방쪽(우, 低x) 절반 — 주방쪽 기둥(ox0)에 아코디언으로 접혀 밖(−z)으로 열림. 짝끼리 ±60° 지그재그.
    const ang = 60 * Math.PI / 180, sX = pw * Math.cos(ang), fD = pw * Math.sin(ang);   // 짝당 x 전진·접힘 깊이
    const hinge = (k) => [ox0 + sX * k, k % 2 === 0 ? zc : zc - fD];                     // 접이 경첩점(짝수=트랙선, 홀수=밖으로 꺾임)
    for (let k = 0; k < half; k += 1) {                                  // 5짝 — 각 짝을 경첩~경첩 잇는 기울어진 유리판으로
      const [x0p, z0p] = hinge(k), [x1p, z1p] = hinge(k + 1);
      const cxp = (x0p + x1p) / 2, czp = (z0p + z1p) / 2, len = Math.hypot(x1p - x0p, z1p - z0p);
      const m = box({ x: cxp - len / 2, z: czp - 0.025, w: len, d: 0.05, y: sy, h: hy - sy, mat: fdMove, cast: false });
      m.rotation.y = Math.atan2(-(z1p - z0p), x1p - x0p);
    }
    for (let k = 0; k <= half; k += 1) { const [hx, hz] = hinge(k); box({ x: hx - 0.035, z: hz - 0.035, w: 0.07, d: 0.07, y: sy, h: hy - sy, mat: fdFrame, cast: false }); }   // 경첩 세로살
    { const [lx, lz] = hinge(half); box({ x: lx - 0.06, z: lz - 0.13, w: 0.045, d: 0.045, y: sy + 0.95, h: 0.28, mat: materials.handle }); }   // 접힌 선두짝 손잡이
    label(`1층 정면 폴딩도어 ${fmtDim(ox1 - ox0)}×${fmtDim(hy - sy)}m (중앙 양개·주방쪽 접어 열림)`, cx, sy + 1.45, s2FrontZ - 0.25, 'opening');
  });
  captureInto(s2Wall1Objects, () => {                                     // 우측벽 슬라이드창·좌측벽 폴딩창 (뒤벽은 막힘)
    const fdMove = materials.slidingMoveGlass;   // 접힌 짝 유리
    const fdFrame = materials.foldingFrame;   // 폴딩 알루미늄 프레임(다크그레이)
    const pw = 0.68, ang = 60 * Math.PI / 180, sU = pw * Math.cos(ang), fV = pw * Math.sin(ang), n = 4;   // 짝당 전진·접힘깊이·짝수
    const drawFold = (toWorld, syArg = f1Top, hyArg = f1Top + fdH, nArg = n) => {   // toWorld(k)→{x,z} 경첩점 / 짝끼리 지그재그. syArg·hyArg=하부·상부 높이(폴딩창은 올림). nArg=짝수(기본 4)
      const sy = syArg, hy = hyArg;
      for (let k = 0; k < nArg; k += 1) {
        const p0 = toWorld(k), p1 = toWorld(k + 1);
        const cxp = (p0.x + p1.x) / 2, czp = (p0.z + p1.z) / 2, len = Math.hypot(p1.x - p0.x, p1.z - p0.z);
        const m = box({ x: cxp - len / 2, z: czp - 0.025, w: len, d: 0.05, y: sy, h: hy - sy, mat: fdMove, cast: false });
        m.rotation.y = Math.atan2(-(p1.z - p0.z), p1.x - p0.x);
      }
      for (let k = 0; k <= nArg; k += 1) { const p = toWorld(k); box({ x: p.x - 0.035, z: p.z - 0.035, w: 0.07, d: 0.07, y: sy, h: hy - sy, mat: fdFrame, cast: false }); }   // 경첩 세로살
      const lead = toWorld(nArg); box({ x: lead.x - 0.06, z: lead.z - 0.06, w: 0.045, d: 0.045, y: sy + 0.95, h: 0.28, mat: materials.handle });   // 선두짝 손잡이
    };
    // 우측벽(x=0): 2트랙 4짝 양미서기 슬라이드 창 — 뒤벽과 동일 방식(축만 X↔Z). 바깥 2짝 고정 + 가운데 2짝 앞뒤로 갈라져 가운데 열림. sill·개구 유지.
    { const xc = s2X0 + t / 2, syR = rO.sillY, hyR = rO.headY;
      const slFrame = materials.windowFrame;   // 우측 슬라이드창 프레임 — 짙은 색(폴딩도어·좌측 폴딩창과 달리 예외 아님)
      const slGlass = materials.slidingFixedGlass;   // 고정 짝 유리
      const slMove  = materials.slidingMoveGlass;    // 미닫이(열린) 짝 유리
      const pw = (rO.a1 - rO.a0) / 4, mullW = 0.05, trk = 0.03;                                            // 4짝·트랙 오프셋
      box({ x: xc - 0.06, z: rO.a0, w: 0.12, d: rO.a1 - rO.a0, y: syR, h: 0.08, mat: slFrame });           // 하부 레일(2트랙 전폭)
      box({ x: xc - 0.06, z: rO.a0, w: 0.12, d: rO.a1 - rO.a0, y: hyR - 0.08, h: 0.08, mat: slFrame });    // 상부 레일(2트랙 전폭)
      const pane = (z0, xt, mat) => {                                                                       // 유리 짝 + 앞뒤 세로살
        box({ x: xt - 0.025, z: z0, w: 0.05, d: pw, y: syR, h: hyR - syR, mat, cast: false });
        box({ x: xt - 0.035, z: z0, w: 0.07, d: mullW, y: syR, h: hyR - syR, mat: slFrame, cast: false });
        box({ x: xt - 0.035, z: z0 + pw - mullW, w: 0.07, d: mullW, y: syR, h: hyR - syR, mat: slFrame, cast: false });
      };
      pane(rO.a0, xc + trk, slGlass);            // 고정 바깥 앞 (안쪽트랙)
      pane(rO.a1 - pw, xc + trk, slGlass);        // 고정 바깥 뒤 (안쪽트랙)
      pane(rO.a0, xc - trk, slMove);              // 미닫이 앞 → 앞으로 갈라져 바깥 겹침 (바깥트랙)
      pane(rO.a1 - pw, xc - trk, slMove);          // 미닫이 뒤 → 뒤로 갈라져 바깥 겹침 (바깥트랙)
      box({ x: xc - trk + 0.085, z: rO.a0 + pw - 0.06, w: 0.045, d: 0.045, y: syR + 0.95, h: 0.28, mat: materials.handle });   // 앞 미닫이 손잡이(가운데쪽)
      box({ x: xc - trk + 0.085, z: rO.a1 - pw + 0.02, w: 0.045, d: 0.045, y: syR + 0.95, h: 0.28, mat: materials.handle });    // 뒤 미닫이 손잡이(가운데쪽)
      label(`1층 우측 슬라이드창 ${fmtDim(rO.a1 - rO.a0)}×${fmtDim(hyR - syR)}m (4짝 양미서기·가운데 열림)`, s2X0 - 0.3, syR + 1.0, (rO.a0 + rO.a1) / 2, 'opening'); }
    // 좌측벽(高x): 중앙 분리 2+2 양개 — 앞 2짝은 a0(低z)쪽, 뒤 2짝은 a1(高z)쪽으로 각각 접힘. 밖(+x)으로.
    { const xc = s2W - t / 2, syL = lO.sillY;
      box({ x: xc - 0.05, z: lO.a0, w: 0.1, d: lO.a1 - lO.a0, y: syL, h: 0.08, mat: fdFrame });          // 하부 레일(폴딩창 sill)
      box({ x: xc - 0.05, z: lO.a0, w: 0.1, d: lO.a1 - lO.a0, y: lO.headY - 0.08, h: 0.08, mat: fdFrame });    // 상부 레일
      drawFold((k) => ({ x: xc + (k % 2 === 0 ? 0 : fV), z: lO.a0 + sU * k }), syL, lO.headY, 2);        // 앞(低z) 2짝 — a0서 중앙으로 접힘
      drawFold((k) => ({ x: xc + (k % 2 === 0 ? 0 : fV), z: lO.a1 - sU * k }), syL, lO.headY, 2);        // 뒤(高z) 2짝 — a1서 중앙으로 접힘
      label(`1층 좌측 폴딩창 ${fmtDim(lGap)}×${fmtDim(lO.headY - syL)}m (2+2 양개·양쪽 접힘)`, s2W + 0.3, syL + 1.0, (lO.a0 + lO.a1) / 2, 'opening'); }
  });
  // 눈썹지붕(고정식 캐노피) 단일 출처 — 개구 상단 위 오리지널징크 경사판 + 벽-지붕 후레싱(물끊기) + 처마끝 드립엣지 + 까치발 2개.
  // axis: 돌출축('x'|'z', 외벽 법선) · dir: 바깥 방향(±1) · wallFace: 외벽 바깥면(그 축) · spanC/spanW: 스팬축 중앙·지붕 폭 · topY: 개구 상단. 돌출 0.8·물매낙차 0.1(벽쪽↑ 바깥↓).
  const eyebrowRoof = (axis, dir, wallFace, spanC, spanW, topY, tag, run = 0.8, bracketed = true) => {
    const drop = 0.1, thk = 0.06;
    const L = Math.hypot(run, drop);
    const s0 = spanC - spanW / 2;                              // 스팬축 시작
    const panelMinP = wallFace + dir * run / 2 - L / 2;        // 경사판 돌출축 min(중앙=wallFace+dir·run/2)
    const flashP = wallFace + dir * 0.01 - 0.04;              // 벽-지붕 후레싱 min(벽면 바로 바깥)
    const dripP  = wallFace + dir * run - dir * 0.015 - 0.025;  // 처마끝 드립엣지 min
    const p0b = wallFace, p1b = wallFace + dir * (run - 0.05);  // 까치발 벽점·지붕밑점(돌출축)
    const y0b = topY - 0.40, y1b = topY - 0.06;
    const bl = Math.hypot(p1b - p0b, y1b - y0b);
    const bmid = (p0b + p1b) / 2 - bl / 2, bY = (y0b + y1b) / 2 - 0.03;
    if (axis === 'x') {
      const panel = box({ x: panelMinP, z: s0, w: L, d: spanW, y: topY + drop / 2 + 0.02, h: thk, mat: materials.roof });   // 오리지널징크 경사판
      panel.rotation.z = Math.atan2(-drop, dir * run);          // 바깥으로 물매
      box({ x: flashP, z: s0, w: 0.08, d: spanW, y: topY + drop - 0.02, h: 0.14, mat: materials.roofEdge });   // 벽-지붕 후레싱
      box({ x: wallFace + dir * 0.05, z: s0, w: 0.10, d: spanW, y: topY - 0.11, h: 0.20, mat: materials.roofEdge });   // 뒷변 인방 연속보 — 개구 상단 인방에 전체 길이 고정(까치발 대신 연속 지지)
      box({ x: dripP,  z: s0, w: 0.06, d: spanW, y: topY - drop - 0.12, h: 0.22, mat: materials.roofEdge });    // 처마끝 테두리보 — 처짐·바람 들썩임 방지(양 끝 지지만으로 성립)
      const bracket = (bs) => { const m = box({ x: bmid, z: bs, w: bl, d: 0.06, y: bY, h: 0.06, mat: materials.roofEdge }); m.rotation.z = Math.atan2(y1b - y0b, p1b - p0b); };
      if (bracketed) { bracket(s0 + 0.06); bracket(s0 + spanW - 0.12); }
    } else {
      const panel = box({ x: s0, z: panelMinP, w: spanW, d: L, y: topY + drop / 2 + 0.02, h: thk, mat: materials.roof });
      panel.rotation.x = Math.atan2(drop, dir * run);
      box({ x: s0, z: flashP, w: spanW, d: 0.08, y: topY + drop - 0.02, h: 0.14, mat: materials.roofEdge });
      box({ x: s0, z: wallFace + dir * 0.05, w: spanW, d: 0.10, y: topY - 0.11, h: 0.20, mat: materials.roofEdge });   // 뒷변 인방 연속보 — 개구 상단 인방에 전체 길이 고정(까치발 대신 연속 지지)
      box({ x: s0, z: dripP,  w: spanW, d: 0.06, y: topY - drop - 0.12, h: 0.22, mat: materials.roofEdge });   // 처마끝 테두리보 — 처짐·바람 들썩임 방지(양 끝 지지만으로 성립)
      const bracket = (bx) => { const m = box({ x: bx, z: bmid, w: 0.06, d: bl, y: bY, h: 0.06, mat: materials.roofEdge }); m.rotation.x = Math.atan2(-(y1b - y0b), p1b - p0b); };
      if (bracketed) { bracket(s0 + 0.06); bracket(s0 + spanW - 0.12); }
    }
    const lx = axis === 'x' ? wallFace + dir * 0.4 : spanC;
    const lz = axis === 'x' ? spanC : wallFace + dir * 0.4;
    label(`${tag} 눈썹지붕 ${fmtDim(run)}×${fmtDim(spanW)}m (고정식·오리지널징크)`, lx, topY + 0.35, lz, 'roof');
  };
  captureInto(s2Wall1Objects, () => {                                     // 1층 개구부 위 고정식 눈썹지붕 — 단일 출처(eyebrowRoof)로 통일
    eyebrowRoof('x', +1, s2W,        lCz, lGap + 0.40, lO.headY, '1층 싱크대쪽');                                  // 좌측(싱크대쪽) 폴딩창 위(+X)
    eyebrowRoof('z', -1, s2FrontZ,   (fdOpen.x0 + fdOpen.x1) / 2, (fdOpen.x1 - fdOpen.x0) + 0.40, fdOpen.headY, '정면 폴딩도어');   // 정면 폴딩도어 위(−Z)
    eyebrowRoof('x', -1, s2X0,       (rO.a0 + rO.a1) / 2, (rO.a1 - rO.a0) + 0.40, rO.headY, '우측 슬라이드창', 0.45);   // 우측(주방측) 슬라이드창 위(−X) — 대지경계 0.5m 이내로 돌출 축소
    eyebrowRoof('z', +1, s2BackZ,    bdCx, (backDoorOpen.a1 - backDoorOpen.a0) + 0.40, backDoorOpen.headY + 0.25, '뒤 출입문', 0.8, false);   // 뒤 출입문 위(+Z) — 밖열림 대비: 문 상단서 0.25m 올리고 까치발 제거(캔틸레버)
  });
  // 2·3층 화장실 왼쪽(안방쪽·高X) 외벽 프로젝트(어닝) 시스템창(단일 출처) — 창대 바닥+1.5m·폭0.8(Z)×높0.8·상부경첩 바깥밀이. 비올 때도 환기, 기계배기와 병행.
  const wcWinCz = (s2BackZ - t) - 0.3 - 0.3;   // 화장실 창 Z중앙 — 뒤 외벽 안쪽서 0.3m 이격(창 뒤끝) + 반폭 0.3
  const wcWinP0 = wcWinCz - 0.3, wcWinP1 = wcWinCz + 0.3;              // 폭 0.6m(Z 스팬)
  // 2층 안방(앞 트인 방) 창 — 접한 3면(앞·좌·우) 미서기. 창대 바닥+1.2m(추락안전)·창높이 1.0m(상단 2.2m). 정면 픽스창 위 인방(헤더) 자리 0.5m 확보. 뒤벽은 화장실·계단이라 막힘.
  {
    const inX0w = s2X0 + t, inX1w = s2W - t;
    const abSill = lvl2 + 1.2, abHead = lvl2 + 2.2;             // 창대 1.2(추락안전) · 상단 2.2(천장 밑 0.5m — 픽스창 인방 확보) · 높이 1.0
    const ow = (p0, p1) => ({ p0, p1, sillY: abSill, headY: abHead });
    const sideCz = s2FrontZ + 0.6 + 0.8;                        // 좌·우 측창 앞뒤 중앙 — 앞 외벽 바깥서 0.6m 시작·짝폭 0.8m×2짝=1.6m(1층 전면창 기준)
    const abFront = s2FrontFixSpans().map(s => ow(s.p0, s.p1));   // 정면 픽스창 좌우 2개 — 3층 게스트룸1·2 정면창과 동일 X스팬(같은 폭·수직 정렬), 가운데 전단벽
    const abSide  = [ow(sideCz - 0.8, sideCz + 0.8)];                            // 측면 2짝×0.8=1.6m (좌·우 동일)
    captureInto(s2Wall2Objects, () => {
      const corrX2 = s2Geo.corrX;                                       // 앞·뒤 복도창 X중앙(3층 복도창과 동일 X — 단일 출처)
      const fCorr2 = { p0: corrX2 - 0.3, p1: corrX2 + 0.3, sillY: lvl2 + 1.2, headY: lvl2 + 1.8 };   // 앞 프로젝트창 0.6×0.6·창대 바닥+1.2(양옆 정면 픽스창과 동일)
      wallStrip('x', s2FrontZ, inX0w, inX1w, y1, y2, [...abFront, fCorr2], EW);        // 앞벽 — 정면 픽스창 + 앞 프로젝트창
      const bCorr2 = { p0: corrX2 - 0.3, p1: corrX2 + 0.3, sillY: lvl2 + 1.2, headY: lvl2 + 1.8 };   // 0.6×0.6·창대 바닥+1.2
      const [sSpan2] = s2FrontFixSpans();   // 2층 계단실 뒤벽 픽스창 — 오른쪽(주방쪽·低X) 가장자리(sSpan2.p0) 고정
      const stairBackWin2W = 0.4;           // 너비 40cm(채광용 세로 슬롯 — 디자인·구조 유리)
      const stairBackWin2 = { p0: sSpan2.p0, p1: sSpan2.p0 + stairBackWin2W, sillY: s2Landing12Y + 1.2, headY: s2Landing23Y - S2_STAIR.tTh - 0.6 };   // 하단=1-2 계단참 윗면+1.2m · 상단=2-3 계단참 아랫면−0.6m(3층 창-처마 관계와 동일)
      wallStrip('x', s2BackZ - t, inX0w, inX1w, y1, y2, [bCorr2, stairBackWin2], EW);   // 뒤벽 — 층계참 프로젝트창 + 계단실 픽스창
      wallStrip('z', s2X0, s2FrontZ, s2BackZ, y1, y2, abSide, EW);       // 우측벽(주방쪽)
      wallStrip('z', s2W - t, s2FrontZ, s2BackZ, y1, y2, [...abSide, { p0: wcWinP0, p1: wcWinP1, sillY: lvl2 + 1.2, headY: lvl2 + 1.8 }], EW);   // 좌측벽(안방쪽) — 안방창 + 화장실 프로젝트창
      for (const o of abFront) frontFixSash(o.p0, s2FrontZ + 0.13, o.p1 - o.p0, o.sillY, o.headY - o.sillY);   // 안방 정면 픽스창
      frontAwningSash(fCorr2.p0, s2FrontZ + 0.13, 0.6, lvl2 + 1.2, 0.6, -1);   // 2층 앞 프로젝트창(低Z 바깥) — 창대 바닥+1.2(양옆 픽스창과 동일)
      label('앞 프로젝트창 0.6×0.6m', corrX2, lvl2 + 1.2 + 0.4, s2FrontZ - 0.1, 'opening');
      for (const o of abSide) sideSash(s2X0 + 0.17, o.p0, o.p1 - o.p0, o.sillY, o.headY - o.sillY);   // 우(주방쪽)
      for (const o of abSide) sideSash(s2W - 0.13, o.p0, o.p1 - o.p0, o.sillY, o.headY - o.sillY);    // 좌(안방쪽)
      awningSash(s2W - 0.13, wcWinP0, 0.6, lvl2 + 1.2, 0.6);             // 2층 화장실 왼쪽벽 프로젝트창
      label('화장실 프로젝트창 0.6×0.6m', s2W + 0.1, lvl2 + 1.2 + 0.4, wcWinCz, 'opening');
      frontAwningSash(bCorr2.p0, s2BackZ - 0.13, 0.6, lvl2 + 1.2, 0.6, 1);   // 2층 층계참 뒤벽 프로젝트창(高Z 바깥)
      label('층계참 프로젝트창 0.6×0.6m', corrX2, lvl2 + 1.2 + 0.4, s2BackZ + 0.1, 'opening');
      frontFixSash(stairBackWin2.p0, s2BackZ - 0.13, stairBackWin2.p1 - stairBackWin2.p0, stairBackWin2.sillY, stairBackWin2.headY - stairBackWin2.sillY);   // 2층 계단실 뒤벽 픽스창
      label(`계단실 뒤벽 픽스창 ${fmtDim(stairBackWin2.p1 - stairBackWin2.p0)}×${fmtDim(stairBackWin2.headY - stairBackWin2.sillY)}m`, (stairBackWin2.p0 + stairBackWin2.p1) / 2, (stairBackWin2.sillY + stairBackWin2.headY) / 2, s2BackZ + 0.1, 'opening');
      abFront.forEach(o => label('안방 정면 픽스창 ' + fmtDim(o.p1 - o.p0) + '×1.0m', (o.p0 + o.p1) / 2, abSill + 0.5, s2FrontZ - 0.1, 'opening'));
      label('안방 우측창 1.6×1.2m', s2X0 - 0.1, abSill + 0.6, sideCz, 'opening');
      label('안방 좌측창 1.6×1.2m', s2W + 0.1, abSill + 0.6, sideCz, 'opening');
    });
  }
  captureInto(s2Wall2Objects, () => planYDim(s2W + 0.4, s2BackZ - 0.2, lvl2, y2, `2층 천장고 ${fmtDim(y2 - lvl2)}m`));   // 2층 바닥 윗면~천장 (3층 외벽최저와 같은 위치)
  // 실외기 방열/배기 루버 개구·그릴 공통 좌표(단일 출처) — 외벽 개구는 '외벽', 그릴·실외기실은 '실외기' 버튼이 공유
  const ecuZ0 = s2Geo.inZ0 + s2Geo.RM_L, ecuZ1 = s2Geo.liftZ0 + s2WcSetback3;   // 실외기실 Z: 게스트룸2 뒤끝 ~ 화장실 앞벽(파생 — 옛 0.40/1.80 고정 제거 #3)
  const ecuNicheCz = (ecuZ0 + ecuZ1) / 2;                 // 실외기실 앞뒤(Z) 중앙 — 실외기·루버 공통 정렬
  const ecuLouP0 = ecuNicheCz - 0.50, ecuLouP1 = ecuNicheCz + 0.50, ecuLouSill = lvl3 + 0.15, ecuLouHead = lvl3 + 1.10;
  const ecuLou2Sill = lvl3 + 1.30, ecuLou2Head = lvl3 + 2.25;   // 상단 방열 루버 — 멀리언 0.20·위 인방 0.15(2.4m 밑), 하·상 높이 0.95 동일(2단)
  const ecuLou3Sill = eaveY + 0.15, ecuLou3Head = eaveY + 0.65;   // 처마선 위 인방 0.15 두고 시작, 높이 0.5m
  captureInto(s2Wall3Objects, () => {                                     // 3층 외벽 — 3층 슬래브 밑면~처마/용마루(박공)
    // 앞(처마까지) — 게스트룸 정면 픽스창 2개(창대 바닥+1.2m 추락안전·높이 0.5·상단 1.7, 처마 선단 밑 — 처마에 안 가림). 폭 2.0m, 각 방 앞부분 중앙 가로창.
    const fWinSill = lvl3 + 1.2, fWinHead = lvl3 + 1.7, pWinHead = lvl3 + 1.7;   // 픽스창 상단 1.7(처마 선단 밑) / 복도·계단 창 상단 1.7
    const [fSpan1, fSpan2] = s2FrontFixSpans();              // 방 안서 양옆 벽면 30cm 대칭(2층과 공유하는 단일 출처)
    const fWin1 = { ...fSpan1, sillY: fWinSill, headY: fWinHead };   // 게스트룸1(低X): 주방측 외벽 ~ 옆벽(far3)
    const fWin2 = { ...fSpan2, sillY: fWinSill, headY: fWinHead };   // 게스트룸2(高X): 복도벽 ~ 안방측 외벽
    const fx1 = (fWin1.p0 + fWin1.p1) / 2, fx2 = (fWin2.p0 + fWin2.p1) / 2;   // 각 방 정면창 X중앙(라벨용)
    // 앞뒤(가운데 세로) 복도 — 게스트룸1·2 사이 중앙 스파인(홈리프트 低X면 −2.1). 앞·뒤 외벽에 프로젝트창 각 1개(정면 픽스창과 같은 창대0.9·높이0.8, 폭 0.8).
    const corrX = s2Geo.corrX;                              // 앞뒤 복도 실통로 X중앙 — s2Geo.corrX 단일 출처(벽 중심선 중앙서 +7.5cm)
    const fCorr = { p0: corrX - 0.3, p1: corrX + 0.3, sillY: lvl3 + 1.1, headY: pWinHead };
    wallStrip('x', s2FrontZ, s2X0 + t, s2W - t, y2, eaveY, [fWin1, fWin2, fCorr], EW);
    frontFixSash(fWin1.p0, s2FrontZ + 0.13, fWin1.p1 - fWin1.p0, fWinSill, fWinHead - fWinSill);   // 게스트룸1 정면 픽스창
    frontFixSash(fWin2.p0, s2FrontZ + 0.13, fWin2.p1 - fWin2.p0, fWinSill, fWinHead - fWinSill);   // 게스트룸2 정면 픽스창
    frontAwningSash(fCorr.p0, s2FrontZ + 0.13, 0.6, lvl3 + 1.1, 0.6, -1);   // 앞 복도 프로젝트창(低Z 바깥)
    label(`게스트룸1 정면 픽스창 ${fmtDim(fWin1.p1 - fWin1.p0)}×${fmtDim(fWinHead - fWinSill)}m`, fx1, fWinSill + 0.25, s2FrontZ - 0.1, 'opening');
    label(`게스트룸2 정면 픽스창 ${fmtDim(fWin2.p1 - fWin2.p0)}×${fmtDim(fWinHead - fWinSill)}m`, fx2, fWinSill + 0.25, s2FrontZ - 0.1, 'opening');
    label('앞 복도 프로젝트창 0.6×0.6m', corrX, lvl3 + 1.1 + 0.4, s2FrontZ - 0.1, 'opening');
    // 뒤(처마까지) — 앞뒤 복도 뒤쪽 프로젝트창 1개 + 계단실 오른쪽(주방측·低X) 세로 픽스창 1개
    const bCorr = { p0: corrX - 0.3, p1: corrX + 0.3, sillY: lvl3 + 1.1, headY: pWinHead };
    const [sSpan] = s2FrontFixSpans();   // 계단실 뒤벽 픽스창 — 오른쪽(주방쪽·低X) 가장자리(sSpan.p0)를 고정
    const stairBackWinW = 0.4;           // 너비 40cm(채광용 세로 슬롯 — 디자인·구조 유리)
    const stairBackWin = { p0: sSpan.p0, p1: sSpan.p0 + stairBackWinW, sillY: s2Landing23Y + 1.2, headY: pWinHead };   // 하단=2-3 계단참 윗면+1.2m · 상단=뒤 복도창 상단(1.7m, 유지)
    const stairBackWinX = (stairBackWin.p0 + stairBackWin.p1) / 2;
    wallStrip('x', s2BackZ - t, s2X0 + t, s2W - t, y2, eaveY, [bCorr, stairBackWin], EW);
    frontAwningSash(bCorr.p0, s2BackZ - 0.13, 0.6, lvl3 + 1.1, 0.6, 1);   // 뒤 복도 프로젝트창(高Z 바깥)
    label('뒤 복도 프로젝트창 0.6×0.6m', corrX, lvl3 + 1.1 + 0.4, s2BackZ + 0.1, 'opening');
    frontFixSash(stairBackWin.p0, s2BackZ - 0.13, stairBackWinW, stairBackWin.sillY, pWinHead - stairBackWin.sillY);   // 계단실 뒤벽 세로 픽스창
    label(`계단실 뒤벽 픽스창 ${fmtDim(stairBackWinW)}×${fmtDim(pWinHead - stairBackWin.sillY)}m`, stairBackWinX, stairBackWin.sillY + (pWinHead - stairBackWin.sillY) / 2, s2BackZ + 0.1, 'opening');
    const gableTop = [[s2FrontZ, eaveY], [s2BackZ, eaveY], [zMid, peakY]];   // 처마 위 박공 삼각(창은 처마 밑 직사각 구간에만)
    // 3층 게스트룸 창(단일 출처) — 좌우 측벽에 각각. 2층 안방 좌우창과 동일: 앞 외벽 바깥서 0.6m 시작·미서기 2짝×0.8=1.6m·창대 바닥+1.2m(추락안전). 상단은 외벽 최저(2.4) 밑 0.3m=2.1m라 높이 0.9m(층고 낮아 축소).
    const gWinCz = s2FrontZ + 0.6 + 0.8;                     // 게스트룸 창 Z중앙 — 앞 외벽 바깥서 0.6m 시작·짝폭 0.8m×2짝(2층 측창과 동일)
    const gWinP0 = gWinCz - 0.8, gWinP1 = gWinCz + 0.8, gSill = lvl3 + 1.2, gHead = lvl3 + 2.1;
    // 우(주방, 低X) — 게스트룸1 측창: 처마 밑 직사각(창 개구)+처마 위 삼각으로 분리
    wallStrip('z', s2X0, s2FrontZ, s2BackZ, y2, eaveY, [{ p0: gWinP0, p1: gWinP1, sillY: gSill, headY: gHead }], EW);
    yzWallPrism({ x: s2X0, points: gableTop, thickness: t, mat: EW });
    sideSash(s2X0 + 0.17, gWinP0, 1.6, gSill, 0.9);          // 게스트룸1 측창(低X·주방쪽)
    label('게스트룸1 측창 1.6×0.9m', s2X0 - 0.1, gSill + 0.45, gWinCz, 'opening');
    // 좌(안방, 高X) — 화장실 프로젝트창 + 게스트룸2 측창 + 실외기 방열 루버: 처마 밑 직사각(세 개구)+처마 위 삼각으로 분리
    // 왼쪽 복도창 자리 → 2층 냉난방기 실외기 방열 루버 개구(실외기 앞면 토출·바깥). 폭 1.1(Z)×높0.8, 창대 바닥+0.05 (개구 좌표는 위 블록 단일 출처)
    wallStrip('z', s2W - t, s2FrontZ, s2BackZ, y2, eaveY, [{ p0: wcWinP0, p1: wcWinP1, sillY: lvl3 + 1.2, headY: lvl3 + 1.8 }, { p0: gWinP0, p1: gWinP1, sillY: gSill, headY: gHead }, { p0: ecuLouP0, p1: ecuLouP1, sillY: ecuLouSill, headY: ecuLouHead }, { p0: ecuLouP0, p1: ecuLouP1, sillY: ecuLou2Sill, headY: ecuLou2Head }], EW);
    // 상단 배기 루버 — 처마 위 박공 삼각벽에 하나 더(굴뚝효과로 더운 공기 위로 배기). 폭=하단 루버와 동일(ecuLouP0~P1), 높이 0.5m로 축소(삼각 안에 맞춤)
    const rU = (z) => s2RoofUnderY(z);                              // 그 z의 박공 밑선(삼각 윗변)
    // 박공 삼각벽(안방쪽)을 상단 배기 루버 개구 둘레로 4조각 분할(x=s2W-t) — 앞쪽(용마루 포함)·뒤쪽·개구 아래·개구 위
    yzWallPrism({ x: s2W - t, thickness: t, mat: EW, points: [[s2FrontZ, eaveY], [ecuLouP0, eaveY], [ecuLouP0, rU(ecuLouP0)], [zMid, peakY]] });
    yzWallPrism({ x: s2W - t, thickness: t, mat: EW, points: [[ecuLouP1, eaveY], [s2BackZ, eaveY], [ecuLouP1, rU(ecuLouP1)]] });
    yzWallPrism({ x: s2W - t, thickness: t, mat: EW, points: [[ecuLouP0, eaveY], [ecuLouP1, eaveY], [ecuLouP1, ecuLou3Sill], [ecuLouP0, ecuLou3Sill]] });
    yzWallPrism({ x: s2W - t, thickness: t, mat: EW, points: [[ecuLouP0, ecuLou3Head], [ecuLouP1, ecuLou3Head], [ecuLouP1, rU(ecuLouP1)], [ecuLouP0, rU(ecuLouP0)]] });
    awningSash(s2W - 0.13, wcWinP0, 0.6, lvl3 + 1.2, 0.6);                // 3층 화장실 왼쪽벽 프로젝트창
    label('화장실 프로젝트창 0.6×0.6m', s2W + 0.1, lvl3 + 1.2 + 0.4, wcWinCz, 'opening');
    sideSash(s2W - 0.13, gWinP0, 1.6, gSill, 0.9);           // 게스트룸2 측창(高X·안방쪽)
    label('게스트룸2 측창 1.6×0.9m', s2W + 0.1, gSill + 0.45, gWinCz, 'opening');
    // 벽 높이(처마·용마루)를 3층 바닥 윗면(lvl3)부터 각각 표기.
    planYDim(s2W + 0.4, s2BackZ - 0.2, lvl3, eaveY, `외벽 최저 ${fmtDim(eaveY - lvl3)}m`);
    planYDim(s2W + 0.4, zMid, lvl3, peakY, `외벽 꼭지점 ${fmtDim(peakY - lvl3)}m`);
  });
  // 실외기 — 방열/배기 루버 그릴 + 벽 안쪽 실외기실(외벽 개구는 '외벽'에 남고, 그릴·실내부는 여기 '실외기' 버튼) ──
  captureInto(s2Ecu3Objects, () => {
    box({ x: s2W - 0.13, z: ecuLouP0, w: 0.05, d: ecuLouP1 - ecuLouP0, y: ecuLou3Sill, h: ecuLou3Head - ecuLou3Sill, mat: materials.openingEdge });   // 상단 배기 루버 그릴(바깥면)
    label(`실외기 상단 배기 루버 ${fmtDim(ecuLouP1 - ecuLouP0)}×${fmtDim(ecuLou3Head - ecuLou3Sill)}m`, s2W + 0.1, (ecuLou3Sill + ecuLou3Head) / 2, ecuNicheCz, 'opening');
    box({ x: s2W - 0.13, z: ecuLouP0, w: 0.05, d: ecuLouP1 - ecuLouP0, y: ecuLouSill, h: ecuLouHead - ecuLouSill, mat: materials.openingEdge });   // 실외기 방열 루버 그릴(하단·바깥면)
    box({ x: s2W - 0.13, z: ecuLouP0, w: 0.05, d: ecuLouP1 - ecuLouP0, y: ecuLou2Sill, h: ecuLou2Head - ecuLou2Sill, mat: materials.openingEdge });   // 실외기 방열 루버 그릴(상단·바깥면)
    label('실외기 방열 루버 1.0×0.95m 2단', s2W + 0.1, (ecuLouSill + ecuLouHead) / 2, ecuNicheCz, 'opening');
    // ── 2층 냉난방기 실외기 서비스 함 — 3층 화장실 앞 복도 왼쪽(高X 외벽). 2층 실내기 바로 위(복도 구간). 실외기 앞(토출)=외벽(+X)·흡입=복도(-X) ──
    {
      const xW = s2W - t;                                  // 외벽 안쪽면(=inX1)
      const nZ0 = ecuZ0, nZ1 = ecuZ1;                      // 니치 Z = 게스트룸2 뒤끝 ~ 화장실 앞벽(파생 단일 출처)
      const nX0 = xW - 1.00;                               // 복도쪽 칸막이 위치 — 외벽서 1.00m(실외기 깊이 0.396+흡입여유 확대)
      const ecuCz = ecuNicheCz;                            // 실외기 Z중앙 = 실외기실 앞뒤 중앙(루버와 동일 정렬)
      const nCz = (nZ0 + nZ1) / 2;                         // 니치 Z중앙 — 양개문 중심
      const dz0 = nCz - 0.55, dz1 = nCz + 0.55, dTop = lvl3 + 2.0;   // 양개(양문형) 단열 점검문 폭 1.1m(실외기 길이 0.96 반입·반출)
      yzWallPrism({ x: nX0, thickness: 0.10, mat: materials.wall, points: [[nZ0, lvl3], [dz0, lvl3], [dz0, s2RoofUnderY(dz0)], [nZ0, s2RoofUnderY(nZ0)]] });   // 저Z 막힌벽(문설주)
      yzWallPrism({ x: nX0, thickness: 0.10, mat: materials.wall, points: [[dz1, lvl3], [nZ1, lvl3], [nZ1, s2RoofUnderY(nZ1)], [dz1, s2RoofUnderY(dz1)]] });   // 고Z 막힌벽(문설주)
      yzWallPrism({ x: nX0, thickness: 0.10, mat: materials.wall, points: [[dz0, dTop], [dz1, dTop], [dz1, s2RoofUnderY(dz1)], [dz0, s2RoofUnderY(dz0)]] });   // 문 위 인방
      box({ x: nX0 + 0.02, z: dz0, w: 0.06, d: nCz - dz0, y: lvl3, h: 2.0, mat: materials.entryDoor });   // 양개 단열문 — 저Z짝
      box({ x: nX0 + 0.02, z: nCz, w: 0.06, d: dz1 - nCz, y: lvl3, h: 2.0, mat: materials.entryDoor });   // 양개 단열문 — 고Z짝
      label('양개 단열 점검문 1.1m', nX0, lvl3 + 1.2, nCz, 'opening');
      const ecuW = 0.396, ecuLen = 0.96, ecuH = 0.70;      // 실외기(위니아 MRW11HSF) 깊이(X)·폭(Z)·높이
      box({ x: xW - 0.05 - ecuW, z: ecuCz - ecuLen / 2, w: ecuW, d: ecuLen, y: lvl3 + 0.10, h: ecuH, mat: materials.guard });   // 본체(받침 위 0.10)
      box({ x: xW - 0.06, z: ecuCz - ecuLen / 2 + 0.10, w: 0.025, d: ecuLen - 0.20, y: lvl3 + 0.23, h: ecuH - 0.20, mat: materials.openingEdge });   // 토출 팬그릴(외벽쪽 +X)
      label('2층 냉난방기 실외기 960×700×396', xW - 0.35, lvl3 + ecuH + 0.4, ecuCz, 'mep');
      // 방수 바닥 + 외벽쪽 배수 트렌치 — 제상수·빗물받이. 트렌치는 외벽 루버 밑에서 외부로 배수(구배).
      box({ x: nX0, z: nZ0, w: (xW - 0.12) - nX0, d: nZ1 - nZ0, y: lvl3, h: 0.015, mat: materials.wetFloor });        // 방수 바닥 마감(트렌치 앞까지)
      box({ x: xW - 0.12, z: nZ0, w: 0.12, d: nZ1 - nZ0, y: lvl3 - 0.05, h: 0.05, mat: materials.guard });            // 배수 트렌치 몸통(오목, 외벽 밑)
      box({ x: xW - 0.12, z: nZ0, w: 0.12, d: nZ1 - nZ0, y: lvl3 - 0.012, h: 0.012, mat: materials.entryFrame });     // 트렌치 그레이팅 커버
      label('실외기실 방수 바닥·배수 트렌치', xW - 0.06, lvl3 + 0.3, ecuCz, 'mep');
      // ── 내단열 보충 면 표시(노랑) — 루버로 뚫린 외벽은 단열 포기, 실외기실 안쪽면이 '새 외벽선' ──
      //    실내(복도·게스트룸2·화장실)와 맞닿는 세 수직면. 천장=지붕단열, 바닥(=2층 천장)은 별도 단열.
      yzWallPrism({ x: nX0 + 0.11, thickness: 0.10, mat: materials.insulPlane, points: [[nZ0, lvl3], [nZ1, lvl3], [nZ1, s2RoofUnderY(nZ1)], [nZ0, s2RoofUnderY(nZ0)]] });   // ① 복도쪽 칸막이(실외기실↔복도) — 내단열 10cm
      box({ x: nX0 + 0.21, z: nZ0 + 0.02, w: xW - (nX0 + 0.21), d: 0.10, y: lvl3, h: s2RoofUnderY(nZ0) - lvl3, mat: materials.insulPlane });   // ② 저Z 측벽(실외기실↔게스트룸2) — 내단열 10cm, 외벽~칸막이 단열 안쪽면
      box({ x: nX0 + 0.21, z: nZ1 - 0.12, w: xW - (nX0 + 0.21), d: 0.10, y: lvl3, h: s2RoofUnderY(nZ1) - lvl3, mat: materials.insulPlane });   // ③ 고Z 측벽(실외기실↔화장실) — 내단열 10cm, 외벽~칸막이 단열 안쪽면
      label('내단열 보충면(새 외벽선)', nX0 + 0.5, lvl3 + 1.6, ecuCz, 'mep');
    }
  });
}
}
