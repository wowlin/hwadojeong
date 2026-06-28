// constants.js — main.js에서 추출한 리터럴 치수 상수(파생·식 제외, 순수 리터럴만).
// 의존: 없음. 변경 시 영향 범위가 넓으니 단일 출처로 관리.

export const buildingW = 8.5;                 // 집 가로(동서) — 고정 상수
export const buildingD = 4.0;                 // 집 깊이(남북) — 고정 상수. 앞 벽 Z(buildingFrontZ)는 layout에서 buildingBackZ−buildingD로 파생
export const buildingBackZ = 3.3;             // 후면(남) 외벽 Z — 집 Z 위치 앵커(집+이격 고정, 대지 경계 파생)
export const groundTopY = 0;                  // 지면 상단(0 기준 — 높이 계산 단순화)
export const foundationHeight = 0.35;         // 집 기초 높이(지면~받침보 상단) — 0.5에서 15cm 낮춤
export const pileR = 0.075;                    // 강관 말뚝 외경 Ø150 (반지름)
export const pileCapW = 0.2;                   // 두부 헤드 브래킷 한 변
export const pileCapH = 0.12;                  // 두부 헤드 브래킷 높이(스틸 골조 볼트 체결부)
export const floorFinishH = 0.10;                              // 바닥(바닥 시공) 두께 10cm — 골조 위 마감층
export const deckFinishT = 0.02;   // 포세린 마감 두께 20t=2cm(데크 기초 위에 얹힘 — 건식)
export const deckFoundationH = 0.25;   // 데크/썬룸 기초 높이 25cm(0.4에서 15cm 낮춤, 집 0.35보다 10cm 낮게 — 단차). 말뚝기초라 높이 자유.
export const lotW = 9.95;                      // 대지 가로 — 왼쪽(가족방) 측백 여유 포함(슬랙 쪽, 변수성)
export const lotD = 9;                         // 대지 깊이 — 앞(입구) 여유 포함(슬랙 쪽, 변수성)
export const neighborSetback = 0.5;            // 옆집벽(거실쪽, 저X)에서 집 이격 — 법적 규제(민법 242조). 고정 상수
export const hedgeBoundaryGap = 1.0;           // 집 뒤 벽 → 측백 뒤 대지 경계선 거리 — 고정 상수(측백 0.5 + 집~측백 0.5 = 1.0)
export const hedgeThickness = 0.5;             // 측백담장 두께 — 고정 상수(가지치기로 조정 가능하나 일단 고정)
export const deckW = 5.5;                       // 데크 폭(가로) — 고정 상수
export const deckD = 3.8;                       // 데크 깊이 — 고정 상수
export const roadW = 1.1;
export const firstWallHeight = 2.59;           // 1층 벽 높이 = 계단 총높이(17×0.17=2.89) − 다락 바닥 30cm → 다락 바닥 윗면이 계단 꼭대기(loftY)에 맞음
export const exteriorWall = 0.2;               // 외벽 두께
export const interiorWall = 0.1;               // 내벽 두께
export const stairRunW = 1.0;
export const entryDoorLeafW = 1.0;     // 현관 문짝 유효폭 1000mm
export const entryFrameOuterW = 1.1;   // 문틀 외곽(좌우 프레임 50mm씩 포함)
export const entryFrameH = 2.18;
export const interiorDoorW = 0.9;
export const interiorDoorH = 2.1;
export const yardSashW = 2.35;
export const yardSashH = 2.1;
export const yardDeckH = 0.08;
export const secondFloorThickness = 0.30;     // 다락 바닥 슬래브 두께 = 계단 화면 loftFloorThickness와 동일(단일 출처). 윗면이 계단 꼭대기(loftY)에 맞음
export const secondWallHeight = 1.10;         // 다락 무릎벽 높이(가중평균 ~1.75m로 다락 1.8m 한도 안전마진)
export const roofSlopeDeg = 33;               // 지붕 물매(도)
export const roofThickness = 0.26;            // 지붕(단열 260T+징크) 두께
export const stairRiserCount = 16;
export const lowerStraightTreadCount = 6;
export const winderTreadCount = 3;
export const stairTreadDepth = 0.27;
export const floorSurfaceH = 0.02;
export const floorOverlayLift = 0.002;
export const familyWindowW = 1.8;
export const kitchenSinkW = 2.2;
export const kitchenSinkD = 0.6;
export const kitchenSinkH = 0.85;
export const livingRearWindowW = 2.0;
export const familyRearWindowW = 1.8;                       // 안방 전면창과 동일 폭
export const sideDoorW = 0.8;
export const sideDoorH = 2.1;
export const secondAtticDoorH = 1.8;
export const secondCorridorWindowH = 0.45;
export const secondCorridorWindowSillOffset = 0.42;
export const atticVentWindowW = 0.9;                              // 환기창 폭
export const atticSkyWindowW = 0.7;
export const atticSkyWindowH = 0.95;
export const atticSkyWindowSillOffset = 0.10;
export const atticRearWindowW = 2.0;
export const atticRearWindowH = 0.45;
export const atticRearWindowSillOffset = 0.42;
export const sideGableWindowW = 1.0;
export const sideGableWindowH = 0.5;
export const sideGableWindowSillOffset = 0.35;
export const soundWall = 0.16;
export const STUD_SPACING = 0.5;       // 스터드 간격(통상 45~60cm)
export const FRAME_WEB = 0.092;        // C형강 웨브(벽 두께 방향)
export const FRAME_FLANGE = 0.045;     // C형강 플랜지(벽 길이 방향)
export const TRACK_H = 0.05;           // 상·하 트랙(러너) 높이
export const frEaveOverhang = 0.6;
export const frSideOverhang = 0.4;
export const FRAME_ROOM_W = 3.0;                        // 방 기초 폭(외벽 중심선~계단벽 중심선) = 말뚝 1.5m × 2칸
export const FLOOR_JOIST_H = 0.2;          // 바닥 장선 춤(200mm)
export const FLOOR_JOIST_W = 0.045;        // 바닥 장선 폭
export const FLOOR_RIM_W = 0.05;           // 둘레 림장선 폭(집 기본)
export const DECK_RIM_W = 0.10;            // 데크 테두리(둘레 림장선) 폭 — 데크만 두껍게. 굵기 바꾸려면 여기만.
export const FLOOR_JOIST_SPACING = 0.45;   // 바닥 장선 간격(o.c.)
export const planMarkW = 0.22;
