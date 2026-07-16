// s2/roof.js — s2 지붕(단열 260T+징크 박공·처마·눈막이)·태양광 3kW (main.js S2 구역에서 줄 이동).
import { } from '../scene.js';
import { materials } from '../materials.js';
import { captureInto, fmtDim } from '../primitives.js';
import { snowGuardRow, solarArray } from '../fixtures.js';
import { roofSlab } from '../builders.js';
import { label } from '../labels.js';
import { roofThickness, zincFinishT } from '../constants.js';
import {
  s2W, s2X0, s2BackZ, s2FrontZ, roofY, s2RoofPitch, s2RoofSideOver, s2RoofEaveOver,
  s2SnowGuardT, s2Solar, s2RidgeZ, s2RoofUnderY,
} from './constants.js';
import { s2Roof3Objects, s2Solar3Objects } from '../groups.js';

export function buildS2Roof() {
// ── s2 지붕(징크 박공) + 눈막이 + 태양광 — 3층 '지붕'·'태양광' 토글 ──
//   처마=3층 벽 상단(roofY) 밑선. 두께 260mm(단열 260T) + 징크 마감. 처마 앞뒤 1.0m·좌우 0.45m.
{
  const sideOver = s2RoofSideOver, eaveOver = s2RoofEaveOver, thk = roofThickness, zf = zincFinishT, tan = Math.tan(s2RoofPitch);   // 징크 두께 constants 단일 출처(#20)
  const undEaveY = roofY - tan * eaveOver;            // 처마 끝(내민 1m) 밑선 — 경사 연장
  const undRidgeY = s2RoofUnderY(s2RidgeZ);           // 용마루 밑선(단일 출처)
  const eFront = s2FrontZ - eaveOver, eBack = s2BackZ + eaveOver;   // 앞·뒤 처마 끝 Z
  const topEaveY = undEaveY + thk + zf, topRidgeY = undRidgeY + thk + zf;   // 징크 윗면(처마·용마루)
  // s2 폭(0~s2W) 박공 슬래브 한 면 — roofSlab과 같은 8면체지만 X범위를 s2에 맞춤. 윗면 eaveY..ridgeY, 두께 아래로.
  const s2RoofSlab = (eaveZ, eaveY, ridgeY, thickness, mat) =>
    roofSlab({ eaveZ, ridgeZ: s2RidgeZ, eaveY, ridgeY, thickness, mat, x0: s2X0 - sideOver, x1: s2W + sideOver });   // builders.roofSlab X범위 인자로 통합(#16)
  captureInto(s2Roof3Objects, () => {
    // 단열 260T(밑선=천장) — 앞·뒤 슬로프
    s2RoofSlab(eFront, undEaveY + thk, undRidgeY + thk, thk, materials.roofInsul);
    s2RoofSlab(eBack, undEaveY + thk, undRidgeY + thk, thk, materials.roofInsul);
    // 징크 마감(단열 위)
    s2RoofSlab(eFront, topEaveY, topRidgeY, zf, materials.roof);
    s2RoofSlab(eBack, topEaveY, topRidgeY, zf, materials.roof);
    label(`지붕: 단열 ${Math.round(roofThickness * 1000)}T + 오리지널징크 · 박공 ${Math.round(s2RoofPitch * 180 / Math.PI)}° · 처마 앞뒤 ${fmtDim(s2RoofEaveOver)}m·좌우 ${fmtDim(s2RoofSideOver)}m`, s2W / 2, topRidgeY + 0.45, s2RidgeZ - 1.4, 'struct');
    // 눈막이(스노우가드) 가로바 — 양 슬로프 처마 근처 2줄(쌓인 눈이 한꺼번에 미끄러지지 않게)
    const onTop = (ez, t) => ({ z: ez + t * (s2RidgeZ - ez), y: topEaveY + t * (topRidgeY - topEaveY) });
    const snowGuard = (ez, t) => {
      const p = onTop(ez, t);
      snowGuardRow(s2X0 - sideOver, s2W + sideOver * 2, p.z, p.y);   // fixtures.snowGuardRow 1벌(#17) — captureInto가 s2Roof3Objects로 수집
    };
    for (const t of s2SnowGuardT) { snowGuard(eBack, t); snowGuard(eFront, t); }   // 뒤(남측)·앞(정면) 각 슬로프 s2SnowGuardT.length줄
  });
  // 태양광 3kW — 뒤쪽(남측) 슬로프, 모듈 8장(가로 4 × 세로 2, ≈400W). 지붕 폭 중앙 정렬
  captureInto(s2Solar3Objects, () => {
    const surfaceY = (z) => topRidgeY - tan * (z - s2RidgeZ);   // 뒤 슬로프(z>용마루) 징크 윗면
    const arrayCenterZ = 1.9;                  // 용마루~뒤 벽 사이
    solarArray({ spec: s2Solar, surfaceY, centerX: s2W / 2, centerZ: arrayCenterZ, pitch: s2RoofPitch });   // fixtures.solarArray 1벌(#17)
  });

}
}
