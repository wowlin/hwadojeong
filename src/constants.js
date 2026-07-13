// constants.js — main.js에서 추출한 리터럴 치수 상수(파생·식 제외, 순수 리터럴만).
// 의존: 없음. 변경 시 영향 범위가 넓으니 단일 출처로 관리.

export const buildingW = 8.2;                 // 집 가로(동서) — 방 너비(주방·안방)로 조정. 주방측 벽 x=0 고정(옆집담장 이격 0.5m 유지), 안방쪽으로 축소
export const buildingD = 4.0;                 // 집 깊이(남북) — 고정 상수. 앞 벽 Z(buildingFrontZ)는 layout에서 buildingBackZ−buildingD로 파생
export const buildingBackZ = 3.3;             // 후면(남) 외벽 Z — 집 Z 위치 앵커(집+이격 고정, 대지 경계 파생)
export const groundTopY = 0;                  // 지면 상단(0 기준 — 높이 계산 단순화)
export const foundationHeight = 0.35;         // 집 기초 높이(지면~받침보 상단) — 0.5에서 15cm 낮춤
export const pileR = 0.075;                    // 강관 말뚝 외경 Ø150 (반지름)
export const pileCapW = 0.2;                   // 두부 헤드 브래킷 한 변
export const pileCapH = 0.12;                  // 두부 헤드 브래킷 높이(스틸 골조 볼트 체결부)
export const floorFinishH = 0.20;                              // 1층 바닥 두께 20cm — 기초 윗면에서 시작(바닥 표면=기초 윗면+0.20)
export const deckFinishT = 0.02;   // 포세린 마감 두께 20t=2cm(데크 기초 위에 얹힘 — 건식)
export const deckFoundationH = 0.25;   // 데크/썬룸 기초 높이 25cm(0.4에서 15cm 낮춤, 집 0.35보다 10cm 낮게 — 단차). 말뚝기초라 높이 자유.
export const matFoundationH = 0.5;   // 온통(매트)기초 높이 50cm — 데크 기초는 이것만 남음. 데크는 이 위에 페데스탈+포세린.
export const deckPedestalH = 0.10;   // 데크 페데스탈(높이조절 받침) 높이 — 온통기초 위, 데크 표면 단차 조절용(온통기초 위, 값은 파생).
export const lotW = 9.95;                      // 대지 가로 — 왼쪽(안방) 측백 여유 포함(슬랙 쪽, 변수성)
export const lotD = 9;                         // 대지 깊이 — 앞(입구) 여유 포함(슬랙 쪽, 변수성)
export const neighborSetback = 0.5;            // 옆집벽(주방쪽, 저X)에서 집 이격 — 법적 규제(민법 242조). 고정 상수
export const hedgeBoundaryGap = 1.0;           // 집 뒤 벽 → 측백 뒤 대지 경계선 거리 — 고정 상수(측백 0.5 + 집~측백 0.5 = 1.0)
export const hedgeThickness = 0.5;             // 측백담장 두께 — 고정 상수(가지치기로 조정 가능하나 일단 고정)
export const deckW = 5.5;                       // 데크 폭(가로) — 고정 상수
export const deckD = 3.8;                       // 데크 깊이 — 고정 상수
export const roadW = 1.1;
// firstWallHeight(1층 벽 높이)는 계단 총높이에서 파생 — 계단 상수 블록 뒤에서 정의(아래)
export const exteriorWall = 0.3;               // 외벽 두께(s2와 동일 30cm)
export const interiorWall = 0.1;               // 내벽 두께
export const atticCorridorWallT = 0.15;        // 다락 복도쪽 칸막이벽 두께 — 벽·복도 안목·라벨 단일 출처. interiorWall보다 두꺼운 만큼 복도쪽으로 확장(복도 깊이 감소)
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
export const stairRiserHeight = 0.17;          // 계단 단높이(R) — 1층 층고 단일 출처. 여기만 바꾸면 벽·다락·지붕이 함께 따라감
export const lowerStraightTreadCount = 6;      // 하부 곧은계단 단수
export const winderTreadCount = 3;             // 사선(돌음) 단수 — 90° 회전
export const landingTreadCount = 3;            // 계단참 = 돌음 단수(평참 대신) — 턴존 안에서 층고 확보(발자국 그대로)
export const upperStraightTreadCount = 6;      // 상부(다락쪽) 곧은계단 단수
export const stairRiserCount = lowerStraightTreadCount + winderTreadCount + landingTreadCount + upperStraightTreadCount + 1;   // 총 단수(1층→다락) = 각 구간 합 + 다락 1단 → 파생
export const stairTreadDepth = 0.26;           // 계단 디딤폭(T) — 실제 계단·계단앞 공간·WC 위치 단일 출처. 그리기와 반드시 동일
// 1층 벽 높이 = 계단 총높이(단수×단높이) − 다락 바닥 두께. 다락 바닥 밑면이 벽 윗면 → 계단 높이 바꾸면 자동 추종.
export const firstWallHeight = stairRiserCount * stairRiserHeight - secondFloorThickness;
export const floorSurfaceH = 0.02;
export const floorOverlayLift = 0.002;
export const familyWindowW = 1.8;
export const kitchenSinkW = 2.2;
export const kitchenSinkD = 0.6;
export const kitchenSinkH = 0.85;
export const kitchenRearWindowW = 2.0;
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
export const FRAME_ROOM_W = 2.85;                       // 방 기초 폭(외벽 중심선~계단벽 중심선) — 안방 안목 = FRAME_ROOM_W−0.25 = 2.6
export const FLOOR_JOIST_H = 0.2;          // 바닥 장선 춤(200mm)
export const FLOOR_JOIST_W = 0.045;        // 바닥 장선 폭
export const FLOOR_RIM_W = 0.05;           // 둘레 림장선 폭(집 기본)
export const DECK_RIM_W = 0.10;            // 데크 테두리(둘레 림장선) 폭 — 데크만 두껍게. 굵기 바꾸려면 여기만.
export const FLOOR_JOIST_SPACING = 0.45;   // 바닥 장선 간격(o.c.)
export const planMarkW = 0.22;
