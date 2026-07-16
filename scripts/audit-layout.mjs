// 레이아웃 기하 감사 — src(constants/layout/s2 constants)를 **직접 import**해 파생 관계 불변식을 검사한다.
//   (구판은 src를 안 읽는 자기 사본 상수로 검사해 옛 설계(집폭 8.5·외벽 0.2 등) 기준으로 형해화 — §5-9에서 전면 전환.)
//   사용: node scripts/audit-layout.mjs (npm test ④가 실행). 실패 시 exit 1.
//   런타임(three/DOM)에 얽힌 실좌표(s2Geo·부재 배치·콘센트 충돌)는 여기서 못 본다 — 그건 스냅샷 가드(check:scene)와 렌더 게이트가 커버.
import {
  buildingW, buildingD, buildingBackZ, groundTopY, exteriorWall, interiorWall,
  stairRunW, stairRiserCount, stairRiserHeight, secondFloorThickness, firstWallHeight,
  lowerStraightTreadCount, winderTreadCount, landingTreadCount, upperStraightTreadCount,
  matFoundationH, roofSlopeDeg, hedgeBoundaryGap, neighborSetback,
} from '../src/constants.js';
import {
  buildingFrontZ, insideX0, insideX1, insideZ0, insideZ1, insideD,
  firstFloorY, firstWallY, secondY, firstKitchenX, firstKitchenW, firstFamilyX, firstFamilyW,
  stairLowXRunX, stairHighXRunX, stairHighXWallX, familyInnerWallX, familyInnerWallW,
  stairBottomLandingD, gableRise, roofSlopeTan, atticRidgeZ, lotX0, lotZ1,
} from '../src/layout.js';
import {
  S2_STAIR, s2W, s2X0, s2D, s2BackZ, s2FrontZ, s2WallT, s2RoomShort,
  _wBase, F2, F3, roofY, s2F1Top, s2Lvl2, s2Lvl3, s2Ceil1Y, s2Ceil2Y, s2RoofPitch,
} from '../src/s2/constants.js';

const EPS = 1e-6;
const checks = [];
const approx = (actual, expected, label, eps = EPS) => checks.push({ label, ok: Math.abs(actual - expected) <= eps, actual, expected });
const gte = (actual, expected, label) => checks.push({ label, ok: actual + EPS >= expected, actual, expected: `>= ${expected}` });
const lte = (actual, expected, label) => checks.push({ label, ok: actual <= expected + EPS, actual, expected: `<= ${expected}` });

// ── s1 골격 파생 관계 ─────────────────────────────────────────────────────────
approx(buildingBackZ - buildingFrontZ, buildingD, 's1 집 깊이 = 뒤벽 − 앞벽');
approx(insideD, buildingD - 2 * exteriorWall, 's1 안목 깊이 = 집 깊이 − 외벽×2');
approx(insideX1 - insideX0, buildingW - 2 * exteriorWall, 's1 안목 폭 = 집 폭 − 외벽×2');
approx(firstFloorY, firstWallY, '1층 바닥 표면 = 1층 벽 시작(같은 면)');
approx(secondY, firstWallY + firstWallHeight, '다락 슬래브 시작 = 1층 벽 상단');
// 방 배치: 주방(低X)~계단실(런 2개 밀착)~내력벽~안방(高X)이 안목 폭을 어긋남 없이 채운다.
approx(firstKitchenX + firstKitchenW, stairLowXRunX, '주방 우측 끝 = 계단실 시작(주방측 런 면)');
approx(stairHighXWallX - stairLowXRunX, 2 * stairRunW, '계단실 안목 폭 = 런 폭 × 2(두 런 밀착)');
approx(stairHighXRunX + stairRunW, stairHighXWallX, '상부런 高X면 = 내력벽 계단면');
approx(familyInnerWallX + familyInnerWallW / 2, firstFamilyX, '안방 시작 = 내력벽 안쪽 면');
approx(firstFamilyX + firstFamilyW, insideX1, '안방 좌측 끝 = 좌 외벽 안쪽 면');
gte(stairBottomLandingD, 0.9, '계단 앞 통행 깊이 ≥ 0.9m');
// 계단 총단수·층고 정합(단일 출처 파생 확인)
approx(stairRiserCount, lowerStraightTreadCount + winderTreadCount + landingTreadCount + upperStraightTreadCount + 1, '총 단수 = 구간 합 + 다락 1단');
approx(firstWallHeight, stairRiserCount * stairRiserHeight - secondFloorThickness, '1층 벽 높이 = 계단 총높이 − 다락 슬래브');
// 지붕 파생
approx(gableRise, roofSlopeTan * buildingD / 2, '박공 상승 = tan(경사) × 깊이/2');
approx(atticRidgeZ, buildingFrontZ + buildingD / 2, '용마루 = 깊이 중앙');
gte(roofSlopeDeg, 1, '지붕 경사 > 0');
// 대지 이격(법정·고정 상수) — 옆·뒤 경계
approx(-lotX0, neighborSetback, '옆집 이격 = neighborSetback');
approx(lotZ1 - buildingBackZ, hedgeBoundaryGap, '뒤 경계 이격 = hedgeBoundaryGap');

// ── s2 골격 파생 관계 ─────────────────────────────────────────────────────────
approx(s2D, 2 * s2WallT + (2 * S2_STAIR.W + S2_STAIR.g) + interiorWall + s2RoomShort, 's2 집 깊이 = 외벽×2 + 계단실 + 내벽 + 방 짧은변');
approx(s2BackZ - s2FrontZ, s2D, 's2 깊이 = 뒤 − 앞');
approx(s2X0, 0, 's2 주방측 외벽 x=0 (s1과 동일 모서리)');
approx(s2BackZ, buildingBackZ, 's2 뒤벽 = s1 뒤벽(측백 이격 공유)');
approx(_wBase, groundTopY + matFoundationH, 's2 벽 기준 = 온통기초 윗면');
approx(F2 - _wBase, S2_STAIR.floorH[0], '2층 바닥 = 1층 층고(계단 사양과 단일 출처)');
approx(F3 - F2, S2_STAIR.floorH[1], '3층 바닥 = 2층 층고');
approx(s2Lvl2 - s2F1Top, S2_STAIR.floorH[0], '층 레벨 파생 정합(1→2)');
approx(s2Lvl3 - s2Lvl2, S2_STAIR.floorH[1], '층 레벨 파생 정합(2→3)');
gte(s2Ceil1Y - s2F1Top, 2.3, '1층 천장고 ≥ 2.3m');
gte(s2Ceil2Y - s2Lvl2, 2.3, '2층 천장고 ≥ 2.3m');
gte(roofY - s2Lvl3, 2.0, '3층 외벽 최저 ≥ 2.0m');
// 층고 = 단높이 × 정수(계단이 층 바닥에 정확히 착지)
for (const [i, h] of S2_STAIR.floorH.entries()) {
  const n = h / S2_STAIR.R;
  approx(n, Math.round(n), `s2 ${i + 1}층 층고 = 단높이 × 정수(${Math.round(n)}단)`);
}
lte(s2RoofPitch, 32 * Math.PI / 180, 's2 박공 ≤ 32°(기준 초과 금지)');
gte(s2W, buildingW, 's2 폭 ≥ s1 폭(주방측 x=0 고정 확장)');

// ── 결과 ─────────────────────────────────────────────────────────────────────
const failed = checks.filter((c) => !c.ok);
for (const c of failed) console.error(`✗ ${c.label} — 실제 ${c.actual} / 기대 ${c.expected}`);
if (failed.length) {
  console.error(`\n레이아웃 기하 감사 실패 ${failed.length}건 / ${checks.length}건`);
  process.exit(1);
}
console.log(`✓ 레이아웃 기하 감사 통과 — ${checks.length}건 (src 직접 import)`);
