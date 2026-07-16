// s2/constants.js — s2(3층 구조) 제원(계단사양·층고·지붕각·설비 규격)과 순수 파생값 + s2Geo(실좌표 공유 객체).
// (main.js S2 구역에서 줄 이동. s2Geo는 계단 모듈이 채우고 다른 s2 모듈·설계 메모가 읽는다.)
import { buildingBackZ, groundTopY, matFoundationH, floorFinishH, interiorWall, solarSpec } from '../constants.js';

// ── 2층·다락 탭(s2) 배치도/기초 — 집 발자국 너비(X) s2W × 깊이(Z)는 3층 방 짧은변에서 파생 ─────────────
// 주방측 외벽(x=0)·뒤벽(buildingBackZ)을 s1과 동일 모서리로 맞추고, 너비→x=s2W / 깊이→앞(z) 방향.
// s2 계단 사양(단일 출처) — 디딤·단높이·런폭·런틈·디딤판두께 · 층고(1→2,2→3). 메모·라벨이 이 값을 그대로 표시.
export const S2_STAIR = { T: 0.27, R: 0.15, W: 0.75, g: 0.1, tTh: 0.06, nosing: 0.02, rTh: 0.03, usTh: 0.04, nUpper: [9, 9], landingSteps: 2, slabT: floorFinishH, floorH: [3.0, 3.0] };  // slabT=1층 층참=바닥 마감 두께(콘크리트 기초 위 부자재+포세린, floorFinishH 0.20). 층고 1·2층 모두 3.0m(천장고 2.7+슬래브 0.3). nosing=계단코·rTh=챌판두께·usTh=계단아래문두께·nUpper=상부런 비행별 단수(그리기·메모 단일 출처)
export const s2W = 8.5;                            // s2 집 너비(X) — 고정 상수(x=0 주방측 고정, 왼쪽 안방측으로 확장)
export const s2X0 = 0;                             // 주방측 외벽 — s1과 동일(x=0, 옆집 이격 0.5 유지)
export const s2BackZ = buildingBackZ;             // 뒤벽 — s1과 동일(buildingBackZ, 측백 이격 1.0 유지, 부지 경계서 1m 고정)
export const s2WallT = 0.3;                        // s2 외벽 두께(단일 출처) — 외벽·계단 들임 기준
export const s2Floor2SlabT = 0.3;                  // 2층 바닥 슬래브 두께(30cm) — 치수·외벽 단일 출처
export const s2Floor3SlabT = 0.3;                  // 3층 바닥 슬래브 두께 — 치수·외벽 단일 출처(한 값만 유지)
export const s2RoomShort = 3.7;                    // 3층 방 짧은변(깊이 방향) — 고정 상수. 집 깊이가 여기서 파생(계단 1.6으로 남는 0.5를 방에 더해 집 깊이 6.0 유지)
// 3층 화장실 앞 복도 모서리 건식 세면대(단일 출처) — 그림·메모가 이 값을 그대로 씀
export const s2F3VanityW = 0.6, s2F3VanityD = 0.4, s2F3VanityH = 0.8;   // 하부장 폭·깊이·높이
export const s2F3HeaterL = 15;                     // 하부장 안 경동 나비엔 전기온수기 용량(L)
export const s2WcSinkGap = 0.75;                    // 변기↔세면대 중심 표준 간격(2·3층 공통) — 그리기·메모 단일 출처
export const s2WcSinkClear = 0.15;                  // 문 열려도 세면대 안 닿게 확보하는 여유 — 그리기·메모 단일 출처
export const s2WcToiletOff = 0.42;                  // 변기 중심 옆벽서 오프셋(2·3층 오수관 직하 정렬) — 그리기·메모 단일 출처
export const s2LandingW = 1.2;                      // 층계참(도착칸) 폭 X — 그리기·메모 단일 출처
export const s2LiftW = 1.5, s2LiftD = 1.6;          // 홈리프트 외경(깊이 X × 문면 폭 Z) — 그리기·메모 단일 출처
export const s2LiftInW = 1.1, s2LiftInD = 1.48;     // 홈리프트 내경(탑승 공간, 외경과 같은 축 순서) — 메모 단일 출처
export const s2LiftModel = '아리코 컴팩트 6번';       // 홈리프트 기준 제품 — 메모 단일 출처
export const s2WallInner = 0.10;                     // 화장실·분리 내벽 두께 — 그리기·메모 단일 출처
export const s2F2 = { doorW: 0.7, showerW: 0.9, showerD: 0.85, vanityW: 0.6, vanityD: 0.5, heaterL: 50 };  // 2층 화장실 기구 규격 — 그리기·메모 단일 출처
export const s2Geo = {};                            // 그리기가 실제로 쓴 s2 좌표를 메모로 노출(단일 출처) — IIFE에서 채움
// 집 깊이(Z) = 뒤 외벽 + 계단실 깊이(두 런 행+틈) + 계단실↔방 내벽 + 방 짧은변 + 앞 외벽. 뒤벽 고정·앞벽만 이동.
export const s2D = 2 * s2WallT + (2 * S2_STAIR.W + S2_STAIR.g) + interiorWall + s2RoomShort;   // = 6.0
export const s2FrontZ = s2BackZ - s2D;            // 정면 = 뒤 − 깊이 (파생)
// s2 층고·박공지붕 단면 — 외벽·지붕·계단실 내벽이 공유하는 단일 출처(중복 정의 금지)
export const _wBase = groundTopY + matFoundationH, _wFh1 = S2_STAIR.floorH[0], _wFh = S2_STAIR.floorH[1], _wFh3 = 2.6;     // 1층 3.0 · 2층 3.0 · 3층 2.6(손님방 외벽 최저 2.4 = 바닥마감 0.2 뺀 값). 1층 층고 3.0=천장고 2.7+슬래브 0.3
export const F2 = _wBase + _wFh1, F3 = _wBase + _wFh1 + _wFh, roofY = F3 + _wFh3;   // 2층 바닥 · 3층 바닥 · 지붕(처마=3층 벽 상단)
export const s2RoofPitch = 32 * Math.PI / 180;                                     // 박공 32°(용마루 높이가 이 각도서 자동 계산)
export const s2RoofSideOver = 0.45;                  // 좌우(박공면) 처마 내밈 — 그리기·메모 단일 출처
export const s2RoofEaveOver = 1.0;                   // 앞뒤(경사면) 처마 내밈 — 그리기·메모 단일 출처
export const s2SnowGuardT = [0.16, 0.30];            // 눈막이 줄 위치(처마→용마루 비율) — 슬로프당 줄 수 = 배열 길이
export const s2Solar = solarSpec;   // 태양광 모듈 규격 — s1과 공유(constants.solarSpec 단일 출처 #17)
export const s2RidgeZ = (s2FrontZ + s2BackZ) / 2;                                  // 용마루 — 깊이 중앙(용마루는 너비 X를 따라감)
export const s2RoofUnderY = (z) => roofY + (s2D / 2 - Math.abs(z - s2RidgeZ)) * Math.tan(s2RoofPitch);   // 그 z의 박공지붕 밑선(처마 roofY ~ 용마루)

// 옥외 계단 사양(단일 출처) — deckStairs 호출·'1층 바닥' 메모가 공유. 지면~1층 바닥 윗면(기초 0.5+바닥 마감)까지 오름.
export const s2FrontStair = { steps: 5, tread: 0.3 };              // 정면 전체폭(집 너비) 옥외 계단 — 포세린 타일
export const s2RearStair = { steps: 4, tread: 0.25, width: 1.0 };  // 뒤 출입문 옥외 계단 — 포세린 타일

// 층 레벨 파생(단일 출처 #4) — 계단 levels[]·외벽 층경계·천장 조명이 전부 이 값을 읽는다(재계산 금지).
export const s2F1Top = _wBase + S2_STAIR.slabT;    // 1층 바닥 윗면(층참)
export const s2Lvl2 = F2 + S2_STAIR.slabT;         // 2층 바닥 표면
export const s2Lvl3 = F3 + S2_STAIR.slabT;         // 3층 바닥 표면
export const s2Ceil1Y = s2Lvl2 - s2Floor2SlabT;    // 1층 천장(2층 슬래브 밑면)
export const s2Ceil2Y = s2Lvl3 - s2Floor3SlabT;    // 2층 천장(3층 슬래브 밑면)
export const s2WcSetback3 = 0.4;                   // 3층 화장실 앞벽 들임(복도·실외기실 확보) — 화장실·실외기실·콘센트 공유
export const s2F2AcZ0 = s2FrontZ + 2.2 + 0.30;     // 2층 냉난방기 실내기 앞끝 Z — 설치(floor2)·콘센트(outlets) 공유(#10)
export const s2ProjWinW = 0.6, s2ProjWinH = 0.6;   // 프로젝트(어닝)창 공통 규격(폭×높이) — 복도·층계참·화장실 창이 공유(§4-2)
export const s2SillSafe = 1.2;                      // 추락안전 창대 높이(바닥+1.2m) — 2·3층 창이 공유(§4-2)
