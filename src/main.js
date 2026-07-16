// ════════════════════════════════════════════════════════════════════════════
// 화도정 3D 개념 모형 — 편집 가이드 (자주 바뀌는 도면이라 수정 포인트를 여기 정리)
// ════════════════════════════════════════════════════════════════════════════
// ▌좌표계 (단위 m)
//   X = 동서 :  +X = 동(도로측) / −X = 서      (평면도에선 동이 화면 왼쪽 = 미러)
//   Z = 남북 :  +Z = 남(집 뒤)  / −Z = 북(정면·현관·썬룸)
//   Y = 상하 :  지면 groundTopY → +기초(foundationHeight) +바닥마감(floorFinishH) = 1층 바닥 firstFloorY
//   집 발자국 : X 0~buildingW, Z buildingFrontZ~buildingBackZ (buildingW×buildingD). 정면(−Z=북)에 데크/썬룸.
//   ★ 좌우/앞뒤 (주 출입문 보는 시점 — 사용자 확정, 절대 헷갈리지 말 것):
//     왼쪽(좌) = 동 = 높은 X(buildingW쪽) = 도로·안방측 │ 오른쪽(우) = 서 = 낮은 X(0쪽) = 주방측
//     앞 = 정면(−Z, 현관·썬룸·마당) │ 뒤 = 집뒤(+Z, 측백·도로 — 마당 없음)
//
// ▌치수는 어디서 바꾸나
//   · 건물·층고·기초·바닥재 : "주요 제원" 블록 (buildingW, foundationHeight, firstWallHeight …)
//   · 다락·지붕 각도/두께   : secondWallHeight, roofSlopeDeg, roofThickness
//   · 대지(부지) 형상       : lotNW/lotNE/lotSE/lotSW 코너 (도로·측백·치수 자동 추종)
//   · 창호/문 크기·위치     : 1층 섹션의 yardSash*, familyWindow*, kitchenRearWindow*
//   · 썬룸                : 썬룸() 내부 targetFrontPostH / targetWallPostH / roofSlopeLength
//   · 데크 계단             : deckStairs({...}) 호출부
//   · 색·재질               : 상단 materials = { … } 객체
//   · 버튼 라벨/업체         : 상단 app.innerHTML 의 <button>
//
// ▌객체 추가/제거 — 토글 그룹 시스템
//   표시는 "그룹 배열 + applyVisibility()" 로 제어. 객체는 한 그룹에 속함:
//     firstFloorObjects/secondFloorObjects/roofObjects/deckObjects/
//     wallObjects/foldingObjects/hedgeObjects/fenceObjects/foundationObjects/planObjects/extrasObjects
//   · 추가 : 해당 위치에서 box({…})/label(…) → 캡처범위에 자동 분류, 또는 group.push(box({…}))(담장식).
//            캡처 패턴: const _s = scene.children.length; … ; group.push(...scene.children.slice(_s));
//            (1층=_firstFloorStart, 다락=captureSecond(), 썬룸=썬룸() 내부)
//   · 제거 : 그 box()/label() 줄 삭제(딸린 치수·라벨도 함께).
//   · 토글 추가: ① app.innerHTML <button id="toggleX"> ② 그룹배열 const ③ applyVisibility() 규칙 ④ 하단 addEventListener.
//
// ▌헬퍼 (x·z는 최소 모서리, 단위 m) — 무클로저 빌더는 모듈에서 import, 나머지는 main.js 전역
//   primitives.js : box({x,z,w,d,y,h,mat,name,cast}) · flatPoly({points:[[x,z]…],y,h,mat,name}) · lerpPoint · fmtDim …
//   builders.js   : floorFrame · systemPile/pileFoundation · yzWallPrism · roofSlab · slopedWallTopCap …
//   main.js 전역  : label(text,x,y,z,size) · room/sideSash/pocketDoor* · planYDim/planXDim · setView/applyVisibility
//
// ▌주의 (ES모듈·strict)
//   · 같은 이름 function/const 재정의 금지 → 앱 전체가 깨짐. 새 헬퍼는 새 이름으로.
//   · const는 쓰기 전에 정의(파생값은 원본 뒤). "수치만" 변경은 안전, "줄 이동"은 의존성 확인.
//   · 수정 후 콘솔 에러 0 + 해당 뷰 스크린샷으로 검증.
// ════════════════════════════════════════════════════════════════════════════
import * as THREE from 'three';
import { materials } from './materials.js';
import { stage, scene, houseGroup, camera, renderer, controls } from './scene.js';
import { box, addGeometryEdges, fmtDim, captureInto } from './primitives.js';
import { label, planYDim } from './labels.js';
import { deckStairs } from './fixtures.js';
import { buildSite, fenceH, hedgeH } from './site.js';
import { buildFloor1, buildFloor1Fixtures, firstStairRoomLabel, firstBathDimLabel, firstBathClearFill } from './s1/floor1.js';
import { buildAttic } from './s1/attic.js';
import { buildDeck, buildDeckStairFrame, buildDeckStoveCassette, deckRoofBcrArea, s1DeckFurn } from './s1/deck.js';
import { buildPlan } from './s1/plan.js';
import { buildStair, stairParams, stairGeom } from './s1/stair.js';
import {
  S2_STAIR, s2W, s2X0, s2BackZ, s2WallT, s2Floor2SlabT, s2Floor3SlabT,
  s2F3VanityW, s2F3VanityD, s2F3VanityH, s2F3HeaterL, s2WcSinkGap, s2WcSinkClear, s2WcToiletOff,
  s2LandingW, s2LiftW, s2LiftD, s2LiftInW, s2LiftInD, s2LiftModel, s2WallInner, s2F2, s2Geo,
  s2D, s2FrontZ, _wBase, F2, F3, roofY, s2RoofPitch, s2RoofSideOver, s2RoofEaveOver,
  s2SnowGuardT, s2Solar, s2RidgeZ, s2RoofUnderY, s2FrontStair, s2RearStair,
} from './s2/constants.js';
import { buildS2Base, buildS2Stair, s2Landing12Y, s2Landing23Y, s2FrontFixSpans } from './s2/stair.js';
import { buildS2Floor2 } from './s2/floor2.js';
import { buildS2Floor3 } from './s2/floor3.js';
import { buildS2Outlets } from './s2/outlets.js';
import { buildS2Interior } from './s2/interior.js';
import { buildRoof, buildRoofSolar } from './s1/roof.js';
import {
  yzWallPrism,
} from './builders.js';
import {
  frontFixSash, frontAwningSash, sideSash, awningSash,
} from './openings.js';
import {
  buildingW, buildingD, buildingBackZ, groundTopY, roofThickness, hedgeThickness, matFoundationH
} from './constants.js';
import {
  lotX0, foundationTopY, lotX1, lotZ1,
  lotZ0, stairLowXRunX, stairHighXRunX
} from './layout.js';
import {
  firstFloorFinishObjects, firstCeilingObjects, deckFloorObjects, firstFloorObjects, bathObjects, interiorObjects, firstWallObjects, firstOutletObjects, firstDimObjects, secondFloorObjects, atticExtWallObjects, atticInnerWallObjects, roofObjects, solarObjects, deckObjects,
  썬룸FrameObjects, 썬룸RoofObjects, wallObjects, foldingObjects, extrasObjects,
  hedgeObjects, fenceObjects, matFoundationFullObjects,
  footprintObjects, planObjects, dimObjects,
  planOnlyDimObjects, hedgeDimObjects, gapDimObjects, s2FootprintObjects, s2FoundationObjects, s2DimObjects, s2Wall1Objects, s2Wall2Objects, s2Wall3Objects, s2Ecu3Objects, s2Stair2Objects, s2StairLowA, s2StairMidA, s2StairLowB, s2StairMidB, s2StairUpB, s2Floor1Objects, s2Floor2Objects, s2Floor3Objects, s2LiftObjects, s2Roof3Objects, s2Solar3Objects, s2FurnitureObjects, s2SinkObjects, s2StoveObjects, s2Fan1Objects, s2Fan2Objects, siteBaseObjects, deckStairFrameObjects,
  stairObjects, stairCoreObjects, stairWallObjects, kitchenInnerWallObjects, familyInnerWallObjects,
} from './groups.js';
import './styles.css';

// DOM 셸 + scene/camera/renderer/controls 싱글톤은 ./scene.js에서 import(거기서 1회 초기화).
// 렌더 가시성 그룹 배열(floorFinishObjects 등)은 ./groups.js에서 import — 빌더가 push, applyVisibility가 visible 제어.

// 재질(materials)은 ./materials.js 단일 출처에서 import — 색·골조재·텍스처재 전부 그쪽에서 정의.

// 조명(반구광·태양광)은 ./scene.js에서 scene 셋업과 함께 추가(이동).

// 벽(개구부)·문·창(미서기/픽스/어닝)·박공벽 헬퍼는 ./openings.js로 이동.

// Orientation contract for every future edit and answer:
// Use the plan as displayed with the entrance/deck at the bottom.
// Plan-left = family room. Plan-right = kitchen+kitchen.
// Bottom = front/yard/entrance. Top = rear wall/stair-back wall.
// Do not reinterpret plan-left/plan-right by camera angle or viewer position.

// ═══════════ 주요 제원 (여기서 치수 수정 — 단위 m) ═══════════
//   건물 외형
//   기초·바닥
//   시스템 말뚝기초(독립기초, KC금강컨테이너 주택용) — 강관 말뚝 + 두부 헤드 브래킷(골조 볼트 체결)

buildSite();   // 대지·도로·측백담장·옆집담장 — ./site.js (fenceMat·fenceH·hedgeH도 그쪽)

buildFloor1();   // 1층 바닥·외벽·창·가구·화장실·콘센트 — ./s1/floor1.js

buildAttic();   // 다락 바닥·외벽·내벽 — ./s1/attic.js

buildRoof();   // 지붕(단열+징크)·경사 라벨·눈막이·홈통 — ./s1/roof.js

// ───────────────────────────────────────────────────────────────────────────
// 스틸 골조((주)세움스틸하우스) — 1층/다락/지붕 골조. "골조" 단일 토글로 일괄 제어.
// 부재는 아연도금 경량형강 느낌의 얇은 회색 박스로 표현(스터드·트랙·장선·서까래·용마루).
// ───────────────────────────────────────────────────────────────────────────
// 골조 재질(woodFrame·deckFloorFrame)은 ./materials.js에 정의됨.
// captureInto는 ./primitives.js로 이동(캡처 그룹 수집 표준 경로).

// (집 말뚝 X열·계단실 벽 좌표 제거 — 말뚝기초 삭제로 남은 참조 없음. 매트기초만 기초로 남김.)

// 집 골조(철골/목조 프레임)는 설계도 기반으로 시공사가 시공 — 모델에선 그리지 않는다.

// 캠핑의자(campingChair)·의자 프레임 재질(chairFrameMat)은 ./fixtures.js로 이동.

buildDeck();   // 썬룸(포치 골조·폴딩·데크 바닥·가구·지붕)·데크 발자국·포치 건축면적 — ./s1/deck.js
// 데크 말뚝기초(시스템말뚝) — 제거됨(사용자 요청).

// 바닥틀(바닥 골조 장선틀)은 설계도 기반으로 시공사가 시공 — 모델에선 그리지 않는다(메뉴 삭제).

const MAT_H = matFoundationH;   // 매트기초 높이(단일 출처: constants.matFoundationH)
buildPlan();   // 발자국·매트기초·담장 발자국·평면 치수·기준선 — ./s1/plan.js
// 집 말뚝 X열 간격 치수 — 제거됨(말뚝기초 삭제, 사용자 요청).

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ ▼▼▼  S2 영역 시작 — 3층 구조(현재 작업 도면)  ▼▼▼                                ║
// ║ 이 배너 ~ "S2 영역 끝" 배너 사이는 s2(3층 구조) 전용이다.                         ║
// ║ · 3층 작업 부재는 반드시 이 구역 안에, s2 좌표(s2W·s2X0·s2BackZ·s2FrontZ·        ║
// ║   f1Top·S2_STAIR…)와 s2*Objects 그룹으로만 추가한다.                             ║
// ║ · s1(1층+다락) 좌표(buildingW·buildingBackZ·firstFloorY…)·그룹                    ║
// ║   (firstFloorObjects·roofObjects·footprintObjects…)은 값이 겹쳐 조용히 s1에       ║
// ║   그려진다 → 여기서 쓰면 test ⑭(작업 도면 격리)가 실패한다. 절대 금지.            ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
// s2 제원·파생값(S2_STAIR·s2W·s2D·층고·지붕각·s2Geo 등)은 ./s2/constants.js에서 import.
buildS2Base();   // s2 발자국·온통기초·정면 옥외계단·배치 치수 — ./s2/stair.js

buildS2Stair();     // s2 계단·홈리프트·층계참·1/2/3층 바닥 슬래브 — ./s2/stair.js
buildS2Floor2();    // 2층 화장실·안방 실내 — ./s2/floor2.js (s2Geo 공유)
buildS2Floor3();    // 3층 화장실·게스트룸1/2 — ./s2/floor3.js (s2Geo 공유)
buildS2Outlets();   // 2·3층 콘센트(외벽 토글 귀속) — ./s2/outlets.js (s2Geo 공유)

buildS2Interior();   // s2 1층 실내: 식탁·의자·화목난로·싱크대·주방 콘센트·천장 조명 — ./s2/interior.js

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
  const lvl2 = F2 + S2_STAIR.slabT, lvl3 = F3 + S2_STAIR.slabT;           // 2·3층 바닥 표면(계단 levels[1]·[2]와 동일)
  const y1 = lvl2 - s2Floor2SlabT, y2 = lvl3 - s2Floor3SlabT;            // 1층 천장(2층 슬래브 밑면) · 2층 천장(3층 슬래브 밑면)
  // 1층 정면 폴딩도어 개구부 — 바닥 윗면에서 높이 2.4m, 정면 중심 기준 양개. 양 끝 기둥(3층 내하중 가정, 300mm) 남김.
  const f1Top = _wBase + S2_STAIR.slabT;                                  // 1층 바닥 윗면(층참 윗면)
  // 뒤벽(집 뒤·+Z)에 홈리프트↔냉장고 사이 작은 표준 출입문(폭 0.8·높이 2.1) — 집 뒤로 나가는 문
  const bdLeafW = 0.8, bdOuterW = 0.9, bdFrameH = 2.1;
  const bkLiftHiX = (s2X0 + t + S2_STAIR.W) + 9 * S2_STAIR.T + 1.2 + 1.5;   // 홈리프트 高X면(계단 상부런 9단→계단실 끝 + 층계참 1.2 + 리프트 폭 1.5)
  const bkFridgeLoX = (s2W - t) - 0.689;                                    // 냉장고 低X면(좌벽 안쪽 − 냉장고 깊이 0.689)
  const bdCx = (bkLiftHiX + bkFridgeLoX) / 2;                               // 두 부재 사이 중앙
  const backDoorOpen = { a0: bdCx - bdOuterW / 2, a1: bdCx + bdOuterW / 2, sillY: f1Top, headY: f1Top + bdFrameH };
  const s1CorrX = bkLiftHiX - 2.025;                                       // 1층 층계참 프로젝트창 X중앙(2·3층 뒤벽창과 동일 X)
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
    const slGlass = new THREE.MeshLambertMaterial({ color: 0xcfe6f0, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false });   // 고정 짝
    const slMove  = new THREE.MeshLambertMaterial({ color: 0x9fc0d4, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });    // 미닫이 짝
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
    const x = s1CorrX, z = s2BackZ - s2WallT, oy = f1Top + 0.3;
    box({ x: x - 0.065, z: z - 0.035, w: 0.13, d: 0.035, y: oy, h: 0.15, mat: materials.outlet });
    box({ x: x - 0.045, z: z - 0.05, w: 0.09, d: 0.02, y: oy + 0.03, h: 0.09, mat: materials.outletSocket });
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
    const extOutlet = (ox) => {
      box({ x: ox - 0.065, z: wallFaceZ - 0.035, w: 0.13, d: 0.035, y: outletY, h: 0.15, mat: materials.outlet });        // 커버 플레이트
      box({ x: ox - 0.045, z: wallFaceZ - 0.05, w: 0.09, d: 0.02, y: outletY + 0.03, h: 0.09, mat: materials.outletSocket }); // 소켓 면
    };
    extOutlet(s2X0 + t + fdColT / 2);        // 정면 우측 코너(낮은 X, 폴딩도어 우측 기둥)
    extOutlet((s2W - t) - fdColT / 2);       // 정면 좌측 코너(높은 X, 폴딩도어 좌측 기둥)
  });
  captureInto(s2Wall1Objects, () => planYDim(s2W + 0.4, s2BackZ - 0.2, f1Top, y1, `1층 천장고 ${fmtDim(y1 - f1Top)}m`));   // 1층 바닥 윗면~천장 (3층 외벽최저와 같은 위치)
  captureInto(s2Wall1Objects, () => {                                     // 정면 폴딩도어 — 중앙 양개, 주방쪽(우) 절반 접어 열림
    const fdGlass = new THREE.MeshLambertMaterial({ color: 0xcfe6f0, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false });   // 닫힌 짝 유리
    const fdMove = new THREE.MeshLambertMaterial({ color: 0x9fc0d4, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });    // 접힌(움직인) 짝 유리 — 약간 짙게
    const fdFrame = new THREE.MeshLambertMaterial({ color: 0x3a3f45 });   // 폴딩 알루미늄 프레임(다크그레이)
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
    const fdMove = new THREE.MeshLambertMaterial({ color: 0x9fc0d4, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });   // 접힌 짝 유리
    const fdFrame = new THREE.MeshLambertMaterial({ color: 0x3a3f45 });   // 폴딩 알루미늄 프레임(다크그레이)
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
      const slGlass = new THREE.MeshLambertMaterial({ color: 0xcfe6f0, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false });   // 고정 짝 유리
      const slMove  = new THREE.MeshLambertMaterial({ color: 0x9fc0d4, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });    // 미닫이(열린) 짝 유리
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
      const corrX2 = bkLiftHiX - 2.025;                                 // 앞·뒤 복도창 X중앙(3층 복도창과 동일 X)
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
  const ecuNicheCz = 1.10;                                // 실외기실 앞뒤(Z) 중앙 = (게스트룸2 뒤끝 0.40 + 화장실 앞벽 1.80)/2 — 실외기·루버 공통 정렬
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
    const corrX = bkLiftHiX - 2.025;                        // 앞뒤 복도 실통로 X중앙 — 게스트룸1(주방)쪽 방문벽 15cm가 복도를 먹어 트인 폭[far3+0.15, liftX0] 기준 중앙(벽 중심선 중앙서 +7.5cm)
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
      const nZ0 = 0.40, nZ1 = 1.80;                        // 니치 Z: 0.40=게스트룸2 뒤끝(inZ0+RM_L)·1.80=화장실 앞벽(liftZ0+0.4) — 두 벽 사이(스코프 밖이라 값 고정)
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

// ── s2 지붕(징크 박공) + 눈막이 + 태양광 — 3층 '지붕'·'태양광' 토글 ──
//   처마=3층 벽 상단(roofY) 밑선. 두께 260mm(단열 260T) + 징크 마감. 처마 앞뒤 1.0m·좌우 0.45m.
{
  const sideOver = s2RoofSideOver, eaveOver = s2RoofEaveOver, thk = roofThickness, zf = 0.05, tan = Math.tan(s2RoofPitch);
  const undEaveY = roofY - tan * eaveOver;            // 처마 끝(내민 1m) 밑선 — 경사 연장
  const undRidgeY = s2RoofUnderY(s2RidgeZ);           // 용마루 밑선(단일 출처)
  const eFront = s2FrontZ - eaveOver, eBack = s2BackZ + eaveOver;   // 앞·뒤 처마 끝 Z
  const topEaveY = undEaveY + thk + zf, topRidgeY = undRidgeY + thk + zf;   // 징크 윗면(처마·용마루)
  // s2 폭(0~s2W) 박공 슬래브 한 면 — roofSlab과 같은 8면체지만 X범위를 s2에 맞춤. 윗면 eaveY..ridgeY, 두께 아래로.
  const s2RoofSlab = (eaveZ, eaveY, ridgeY, thickness, mat) => {
    const x0 = s2X0 - sideOver, x1 = s2W + sideOver, rz = s2RidgeZ;
    const v = new Float32Array([
      x0, eaveY, eaveZ, x1, eaveY, eaveZ, x1, ridgeY, rz, x0, ridgeY, rz,
      x0, eaveY - thickness, eaveZ, x1, eaveY - thickness, eaveZ, x1, ridgeY - thickness, rz, x0, ridgeY - thickness, rz,
    ]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(v, 3));
    g.setIndex([0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1, 3, 2, 6, 3, 6, 7, 0, 3, 7, 0, 7, 4, 1, 5, 6, 1, 6, 2]);
    g.clearGroups(); g.addGroup(0, 12, 0); g.addGroup(12, 24, 1); g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, [mat, materials.roofEdge]);
    mesh.castShadow = true; mesh.receiveShadow = true;
    scene.add(mesh);   // captureInto가 s2Roof3Objects로 자동 수집
    return mesh;
  };
  captureInto(s2Roof3Objects, () => {
    // 단열 260T(밑선=천장) — 앞·뒤 슬로프
    s2RoofSlab(eFront, undEaveY + thk, undRidgeY + thk, thk, materials.roofInsul);
    s2RoofSlab(eBack, undEaveY + thk, undRidgeY + thk, thk, materials.roofInsul);
    // 징크 마감(단열 위)
    s2RoofSlab(eFront, topEaveY, topRidgeY, zf, materials.roof);
    s2RoofSlab(eBack, topEaveY, topRidgeY, zf, materials.roof);
    label('지붕: 단열 260T + 오리지널징크 · 박공 32° · 처마 앞뒤 1.0m·좌우 0.45m', s2W / 2, topRidgeY + 0.45, s2RidgeZ - 1.4, 'struct');
    // 눈막이(스노우가드) 가로바 — 양 슬로프 처마 근처 2줄(쌓인 눈이 한꺼번에 미끄러지지 않게)
    const onTop = (ez, t) => ({ z: ez + t * (s2RidgeZ - ez), y: topEaveY + t * (topRidgeY - topEaveY) });
    const snowGuard = (ez, t) => {
      const p = onTop(ez, t);
      box({ x: s2X0 - sideOver, z: p.z - 0.025, w: s2W + sideOver * 2, d: 0.05, y: p.y + 0.11, h: 0.05, mat: materials.snowGuard, cast: false });   // 가로 파이프바
      const n = 7;
      for (let i = 0; i <= n; i += 1) {
        const bx = s2X0 - sideOver + (s2W + sideOver * 2) * (i / n);
        box({ x: bx - 0.02, z: p.z - 0.02, w: 0.04, d: 0.04, y: p.y + 0.02, h: 0.11, mat: materials.snowGuard, cast: false });   // 브래킷
      }
    };
    for (const t of s2SnowGuardT) { snowGuard(eBack, t); snowGuard(eFront, t); }   // 뒤(남측)·앞(정면) 각 슬로프 s2SnowGuardT.length줄
  });
  // 태양광 3kW — 뒤쪽(남측) 슬로프, 모듈 8장(가로 4 × 세로 2, ≈400W). 지붕 폭 중앙 정렬
  captureInto(s2Solar3Objects, () => {
    const solarMat = new THREE.MeshLambertMaterial({ color: 0x16264a });
    const cosS = Math.cos(s2RoofPitch), sinS = Math.sin(s2RoofPitch);
    const surfaceY = (z) => topRidgeY - tan * (z - s2RidgeZ);   // 뒤 슬로프(z>용마루) 징크 윗면
    const { panelW, panelL, panelThk, gapX, gapZ, cols, rows } = s2Solar;
    const arrayW = cols * panelW + (cols - 1) * gapX;
    const arrayCenterX = s2W / 2;
    const startX = arrayCenterX - arrayW / 2 + panelW / 2;
    const rowStepZ = (panelL + gapZ) * cosS;
    const arrayCenterZ = 1.9;                  // 용마루~뒤 벽 사이
    const startZ = arrayCenterZ - ((rows - 1) / 2) * rowStepZ;
    const liftN = panelThk / 2 + 0.03;
    const panelGeo = new THREE.BoxGeometry(panelW, panelThk, panelL);
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const px = startX + c * (panelW + gapX), pz = startZ + r * rowStepZ, sy = surfaceY(pz);
        const panel = new THREE.Mesh(panelGeo, solarMat);
        panel.position.set(px, sy + liftN * cosS, pz + liftN * sinS);
        panel.rotation.x = s2RoofPitch; panel.castShadow = true; panel.receiveShadow = false;
        scene.add(panel);   // captureInto가 s2Solar3Objects로 자동 수집
        addGeometryEdges(panel, 0x9aa0a8);
      }
    }
    label('태양광 3kW (8장)', arrayCenterX, surfaceY(arrayCenterZ) + 0.55, arrayCenterZ, 'mep');
  });
}

// (안방 측면 출입문 앞 데크 계단 제거 — 측면문이 사라져 포세린 디딤판 대상 없음. 앞·왼쪽 계단은 계단틀로 표시)

buildDeckStairFrame();   // 데크 계단틀(직선 앞 계단 틀·포세린 단) — ./s1/deck.js

// (마당 흰색 화분 2개 제거됨 — whitePlanter 호출 삭제)

buildDeckStoveCassette();   // 데크 화목난로·착탈 카세트 — ./s1/deck.js (구역 위반 G 해소: s1 부재를 s1 파일로)


// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ ▲▲▲  S2 영역 끝  ▲▲▲   (아래부터는 s1(1층+다락)·공유 부재 — s2 아님)             ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
buildFloor1Fixtures();   // 외부 부동수전 + 1층 실링팬 — ./s1/floor1.js

buildRoofSolar();   // 지붕 태양광 3kW — ./s1/roof.js

// 보이는 구조물을 화면(버튼 영역 제외 캔버스) 중앙에 꽉 차게 프레이밍한다.
// pos는 '보는 방향'으로만 쓰고 거리는 자동 계산하며, 줌 중심(target)을 경계구 중심에
// 둬서 확대해도 위/아래가 고르게 보이도록 한다.
const _fitBox = new THREE.Box3();
// 가시성 상태
//  · building: '기초' / '+1층' / '+다락' / '+지붕' 중 하나만 선택되는 건물 누적 뷰(집만 제어)
//    - 기초만(foundation)은 기초 슬래브만, +1층(first)부터 1층 골조·실내가 얹힘
//  · deckOn / 썬룸On / wallOn / accessoryOn: 데크·썬룸·외벽·악세사리 독립 on/off 토글
//    - 썬룸는 데크가 켜진 경우에만 가능(썬룸는 데크 위에 얹힘)
//    - 외벽(다누몰 자바라, 시공 업체 별도)은 썬룸가 켜진 경우에만 가능(외벽은 썬룸에 매달림)
//    - 악세사리(화분·의자·테이블·그릴)는 완전 독립 토글
// building 시공 누적 단계: plan(배치도) → foundation(기초) → floorFrame(바닥틀) → floor(바닥재) → first(1층) → second(다락) → all(지붕)
// ── 부품 가시성(레이어 패널 방식) ───────────────────────────────────────────────
// 각 부품을 독립 체크박스 토글로 보이기/숨기기(완전 독립 — 누적 없음). 단일 출처 PARTS·CHECKS
// 테이블이 [객체배열 ↔ 상태 ↔ 체크박스]를 일괄 구동. 배치도·전체모델은 여러 부품을 한 번에
// 세팅하는 프리셋 뷰 버튼(부감/전체).
const view = {
  // 기초 그룹
  plan: false,        // 배치도(부감) — 대지·도로·담장·말뚝·평면치수
  matFoundationFull: false,  // 매트기초(집+데크 50cm)
  // 집 그룹(내부구조 부품별)
  firstFloorFinish: false, // 집 1층 바닥재
  firstCeiling: false, // 집 1층 천장 설비(실링팬·에어컨·실외기)
  stair: false,       // ㄷ자 계단 본체
  firstWall: false,     // 1층 외벽('1층' 그룹 '외벽' 버튼)
  firstOutlet: false,   // 1층 콘센트('1층' 그룹 '콘센트' 버튼)
  atticExtWall: false,  // 다락 외벽('다락' 그룹 '외벽' 버튼)
  firstRoom: false,   // 1층 골조·실내
  bath: false,        // 화장실
  loft: false,        // 실제 다락 바닥(슬래브·방)
  atticInnerWall: false, // 다락 내벽
  roof: false,        // 지붕
  solar: false,       // 태양광(지붕에서 분리)
  // 썬룸 그룹 (악세사리는 '데크'에 합침)
  deck: false, sunWall: false, folding: false, frame: false, sunRoof: false,   // frame=포치 골조(폴딩도어 지지), sunRoof=포치 징크 지붕
  // 참고(임시)
  hedge: false, fence: false,
  // 2층·다락 탭(s2)
  s2Foundation: false,   // s2 집 기초(온통 0.5m 슬래브 8×6)
  s2Wall1: false,        // s2 1층 외벽 — '1층' 그룹 '외벽' 버튼
  s2Wall2: false,        // s2 2층 외벽 — '2층' 그룹 '외벽' 버튼
  s2Wall3: false,        // s2 3층 외벽(박공 포함) — '3층' 그룹 '외벽' 버튼
  s2Ecu3: false,         // s2 3층 실외기(방열/배기 루버 그릴 + 벽 안쪽 실외기실) — '3층' 그룹 '실외기' 버튼
  s2Stair: false,        // 계단 버튼 — 1·2·3층 계단 전체(하부런+계단참+상부런) 한 토글, '전체' 그룹
  s2Floor1: false,       // s2 1층 바닥('1층' 버튼)
  s2Floor2: false,       // s2 2층 바닥('2층' 버튼)
  s2Floor3: false,       // s2 3층 바닥('3층' 버튼)
  s2Lift: false,         // s2 홈리프트 전체 샤프트 — '전체' 그룹 '홈리프트' 버튼(독립)
  s2Roof3: false,        // s2 지붕(징크 박공·처마·눈막이) — '3층' 그룹 '지붕' 버튼
  s2Solar3: false,       // s2 뒤 지붕 태양광 3kW — '3층' 그룹 '태양광' 버튼
  s2Furniture: false,    // s2 1층 가구(식탁·의자)
  s2Sink: false,         // s2 1층 싱크대(주방)
  s2Stove: false,        // s2 1층 화목난로(오른쪽 붉은 예약 구획) — '난로' 버튼
  s2Fan1: false,         // s2 1층 천장 실링팬 2개 — '실링팬' 버튼
  s2Fan2: false,         // s2 2층 방 천장 실링팬 2개 — '실링팬' 버튼
};

// 부품 → 객체배열 매핑(단일 출처). 배치도(부감)에선 모든 입체 부품을 숨김.
const PARTS = [
  { key: 'matFoundationFull', arrays: [matFoundationFullObjects] },
  { key: 'firstFloorFinish', arrays: [firstFloorFinishObjects, firstDimObjects, stairObjects, interiorObjects] },   // 바닥 + 방 안목치수 + 방·치수 도면 + 실내 가구(안방 침대·주방 싱크대) 합침
  { key: 'firstCeiling', arrays: [firstCeilingObjects] },   // 천장 설비(실링팬·벽걸이 에어컨·실외기)
  { key: 'stair',      arrays: [stairCoreObjects, kitchenInnerWallObjects, familyInnerWallObjects] },   // 주방측 벽·안방 내력벽을 계단 토글에 합침
  { key: 'firstWall',    arrays: [firstWallObjects] },        // 1층 외벽('1층' 그룹 '외벽')
  { key: 'firstOutlet',  arrays: [firstOutletObjects] },      // 1층 콘센트('1층' 그룹 '콘센트')
  { key: 'atticExtWall', arrays: [atticExtWallObjects] },     // 다락 외벽('다락' 그룹 '외벽')
  { key: 'firstRoom',  arrays: [firstFloorObjects] },
  { key: 'bath',       arrays: [bathObjects] },
  { key: 'loft',       arrays: [secondFloorObjects] },        // 실제 다락 바닥(슬래브·방)
  { key: 'atticInnerWall', arrays: [atticInnerWallObjects] }, // 다락 내벽(칸막이·문·입구벽)
  { key: 'roof',       arrays: [roofObjects] },
  { key: 'solar',      arrays: [solarObjects] },              // 지붕에서 분리한 태양광
  { key: 'deck',       arrays: [deckObjects, deckFloorObjects, deckStairFrameObjects, extrasObjects] },   // 데크바닥·데크계단틀+악세사리(화분·의자·테이블·그릴)를 '데크' 하나로 합침
  { key: 'frame',      arrays: [썬룸FrameObjects] },   // 포치 골조(기둥·보·평프레임) — 폴딩도어·지붕 지지. 데크 기초 위(deckSurfaceY)에 앉음
  { key: 'sunRoof',  arrays: [썬룸RoofObjects] },    // 포치 징크 단물매 지붕(경사 받침 위)
  { key: 'sunWall',    arrays: [wallObjects] },
  { key: 'folding',    arrays: [foldingObjects] },
  { key: 'hedge',      arrays: [hedgeObjects] },
  { key: 'fence',      arrays: [fenceObjects] },
  { key: 's2Foundation', arrays: [s2FoundationObjects] },
  { key: 's2Wall1', arrays: [s2Wall1Objects] },
  { key: 's2Wall2', arrays: [s2Wall2Objects] },
  { key: 's2Wall3', arrays: [s2Wall3Objects] },
  { key: 's2Ecu3', arrays: [s2Ecu3Objects] },
  { key: 's2Floor1', arrays: [s2Floor1Objects] },
  { key: 's2Floor2', arrays: [s2Floor2Objects] },
  { key: 's2Floor3', arrays: [s2Floor3Objects] },
  { key: 's2Lift', arrays: [s2LiftObjects] },
  { key: 's2Roof3', arrays: [s2Roof3Objects] },
  { key: 's2Solar3', arrays: [s2Solar3Objects] },
  { key: 's2Furniture', arrays: [s2FurnitureObjects] },
  { key: 's2Sink', arrays: [s2SinkObjects] },
  { key: 's2Stove', arrays: [s2StoveObjects] },
  { key: 's2Fan1', arrays: [s2Fan1Objects] },
  { key: 's2Fan2', arrays: [s2Fan2Objects] },
];
// s1(1층·다락·포치) 부품 토글 — s2처럼 버튼(.seg-btn). [버튼 id → view 키] 단일 출처.
const S1_TOGGLES = [
  ['bDeck', 'deck'],   // 데크(악세사리 합침)
  ['bFolding', 'folding'], ['bSunRoof', 'sunRoof'], ['bFrame', 'frame'],
  ['bLoft', 'loft'], ['bAtticInnerWall', 'atticInnerWall'], ['bAtticExtWall', 'atticExtWall'], ['bRoof', 'roof'], ['bSolar', 'solar'],
  ['bFirstFloorFinish', 'firstFloorFinish'], ['bFirstCeiling', 'firstCeiling'], ['bS1Stair', 'stair'], ['bFirstWall', 'firstWall'], ['bFirstOutlet', 'firstOutlet'], ['bBath', 'bath'],
  ['bMatFull', 'matFoundationFull'],
];

function applyVisibility() {
  const isPlan = view.plan;
  // 집 높이: 선택된 기초 윗면에 1층 바닥이 앉도록 집 전체(houseGroup)를 Y로 이동.
  // 말뚝기초=기준(오프셋 0), 매트기초(부분/전체)=매트 윗면−말뚝 윗면 만큼 위로. 기초 높이를 바꾸면 자동 반영(하드코딩 없음).
  const activeFoundationTopY = view.matFoundationFull ? (groundTopY + MAT_H) : foundationTopY;
  houseGroup.position.y = activeFoundationTopY - foundationTopY;
  // 항상 표시(공통 — 모든 탭 공유): 바탕 대지·도로 + 담장 발자국(색상은 늘 바탕에)
  for (const item of siteBaseObjects) item.visible = true;
  // 집·데크 발자국 = 현재 탭(설계안) 것만 — 2층 탭에선 숨겨 집 배치도 분리
  for (const item of footprintObjects) item.visible = (currentScheme === 's1');
  // 배치도(부감) 전용: 말뚝 마커·평면 치수
  for (const item of planObjects) item.visible = false;   // 말뚝 위치 마커 — 배치도에서 숨김(집·썬룸 배치만 표시)
  const planDimOn = isPlan || view.matFoundationFull || view.s2Foundation;   // 배치도 + 매트기초(s1) + s2 기초 — 공통 치수·기준선 노출 조건
  // s2 탭 바닥 기준층 — 시작 배치도의 발자국·치수는 어떤 토글(기초·측백담장·옆집담장 포함)에도 사라지지 않고 항상 그대로 유지.
  const s2Ground = (currentScheme === 's2');
  // 집·데크 크기 치수 = 현재 탭 것만(2층 탭에선 숨김)
  for (const item of dimObjects) item.visible = (currentScheme === 's1') && planDimOn;
  for (const item of planOnlyDimObjects) item.visible = isPlan;   // 평면 전용 치수 — 배치도 전용(dimObjects 게이팅을 덮음)
  for (const item of hedgeDimObjects) item.visible = isPlan || s2Ground;   // 측백 0.5m 치수 — s2 바닥 기준층(항상)·배치도(dimObjects 게이팅을 덮음)
  for (const item of gapDimObjects) item.visible = planDimOn || s2Ground;  // 집-담장 이격(0.5·1.0) — s2 바닥 기준층(항상)+공통 배치도/기초
  // s2 집 발자국·치수 = 바닥 기준층으로 항상 표시(기초 토글과 무관). 기초 0.5m 슬래브(입체)는 PARTS(s2Foundation)에서 별도 처리.
  for (const item of s2FootprintObjects) item.visible = s2Ground;
  for (const item of s2DimObjects) item.visible = s2Ground;
  // 부품: PARTS 테이블 일괄 — 각 부품 독립 토글(배치도일 땐 모두 숨김)
  for (const p of PARTS) {
    const on = !isPlan && !!view[p.key];
    for (const arr of p.arrays) for (const item of arr) item.visible = on;
  }
  // 1층 바닥+계단 동시 표시 → 계단실 라벨 숨기고 그 자리에 화장실 안목치수 표시(둘 다 firstDimObjects=바닥 토글 소속)
  { const bothOn = !isPlan && view.firstFloorFinish && view.stair;
    if (firstStairRoomLabel) firstStairRoomLabel.visible = !isPlan && view.firstFloorFinish && !bothOn;
    if (firstBathDimLabel)   firstBathDimLabel.visible   = bothOn;
    if (firstBathClearFill)  firstBathClearFill.visible  = bothOn;   // 화장실 안목 자홍 바닥칠 — 바닥+계단 동시일 때만
  }
  // 미사용 배열(삭제된 골조 토글 · 구 통합 계단벽[분리됨])
  for (const item of stairWallObjects) item.visible = false;
  // s2 계단 — 1·2·3층 런·계단참·공유 라벨 전체를 하나의 '계단' 토글로 함께 표시.
  { const on = !isPlan && view.s2Stair;
    for (const arr of [s2StairLowA, s2StairMidA, s2StairLowB, s2StairMidB, s2StairUpB, s2Stair2Objects])
      for (const item of arr) item.visible = on;
  }
  // 층별 라벨 정리 — 윗층 바닥이 표시되면 아래층의 비치수 라벨(방·가구·설비·개구부)은 숨겨 겹쳐 보임 방지. 치수 라벨은 유지.
  { const hideNonDim = (arrs) => { for (const arr of arrs) for (const item of arr) if (item.userData && item.userData.labelGroup && item.userData.labelGroup !== 'dim') item.visible = false; };
    if (!isPlan && view.s2Floor2) hideNonDim([s2Floor1Objects, s2SinkObjects, s2StoveObjects, s2FurnitureObjects, s2StairLowA]);   // 2층 바닥 표시 → 1층 비치수 라벨 숨김
    if (!isPlan && view.s2Floor3) hideNonDim([s2Floor2Objects]);                                                                  // 3층 바닥 표시 → 2층 비치수 라벨 숨김
  }
  syncSegButtons();   // 계단/바닥 버튼 행 active 상태 동기화
  syncAllButtons();   // 그룹 전체 on/off 버튼 라벨·상태 동기화
  updateNotes();
}

// 계단·바닥 버튼 행(체크박스 대신 버튼) active 상태 동기화. '계단'·'바닥'은 하위 전부 켜졌을 때 active.
function setActive(id, on) { const el = document.querySelector('#' + id); if (el) el.classList.toggle('active', !!on); }
function syncSegButtons() {
  setActive('bHedge', view.hedge); setActive('bFence', view.fence);
  // '1층' 그룹 버튼 — 구조 섹션의 같은 부품을 공유 토글(active 동기화)
  setActive('bF1Foundation', view.s2Foundation); setActive('bF1Floor', view.s2Floor1); setActive('bF1Wall', view.s2Wall1);
  setActive('bF1Furniture', view.s2Furniture); setActive('bF1Sink', view.s2Sink); setActive('bF1Stove', view.s2Stove); setActive('bF1Fan', view.s2Fan1);
  setActive('bF2Floor', view.s2Floor2); setActive('bF2Wall', view.s2Wall2); setActive('bF2Fan', view.s2Fan2);
  setActive('bF3Floor', view.s2Floor3); setActive('bF3Wall', view.s2Wall3); setActive('bF3Ecu', view.s2Ecu3);
  setActive('bF3Roof', view.s2Roof3); setActive('bF3Solar', view.s2Solar3);
  setActive('bStair', view.s2Stair); setActive('bAllWall', view.s2Wall1 && view.s2Wall2 && view.s2Wall3); setActive('bLift', view.s2Lift);
  for (const [id, key] of S1_TOGGLES) setActive(id, view[key]);   // s1 부품 버튼 active 동기화
}

// 우측 설계 메모 — 모듈별 추가 설명. 현재 보이는 모듈에 해당하는 메모만 메뉴 순서로 표시.
const NOTES = {
  roof: { title: '지붕', body: '- 박공 지붕 경사는 32도로 최대한 맞춰 설계 적용한다.\n  (태양광 설치: 28~34도가 최적 경사대)' },
  get deck() {                                             // 데크 가구·화목난로 — 실측값은 s1DeckFurn(단일 출처)에서 파생
    const f = s1DeckFurn;
    return { title: '데크', body: [
      '［데크 가구］',
      `· 식탁        ${f.nTables}개 (윗판 ${fmtDim(f.tW)}×${fmtDim(f.tD)}m)`,
      '· 의자        반고 햄프턴 DLX (테이블당 앞·뒤 2개)',
      '· 화목난로 영역   데크 우측(주방쪽) 예약 구획',
      '',
      '［화목난로 · 착탈 카세트］',
      '· 3번째 짝 하부   착탈 카세트 (겨울 연통홀 / 여름 솔리드 교체)',
      '· 4번째 짝 하부   착탈 카세트 (솔리드 · 독립 착탈)',
    ].join('\n') };
  },
  get stair() {                                            // s1 계단 사양 — ㄷ자(돌음 회전·평참 없음) 계단. 모두 계단 상수(stairParams·stairGeom)서 자동 계산
    const g = stairGeom(stairParams);
    const { W, R, T, N, fy, nWind, nLand, nL, nU, loftY, treadH, nosing, turnD } = g;
    const floorH = loftY - fy;                             // 1층 층고(= 다락 바닥 높이)
    const mm = (v) => Math.round(v * 1000);                // m → mm 정수(메모 표기용)
    return { title: '계단', body: [
      '［계단］ ㄷ자 · 돌음 회전(평참 없음) · 뒤벽 턴',
      `· 단높이      ${mm(R)} mm`,
      `· 디딤 깊이    ${mm(T)} mm`,
      `· 디딤판      ${mm(T + nosing)} × ${mm(W)} mm  (계단코 포함, 두께 ${mm(treadH)})`,
      `· 계단코      ${mm(nosing)} mm`,
      `· 런 폭       ${mm(W)} mm`,
      `· 런 사이 틈   ${mm(stairHighXRunX - stairLowXRunX - W)} mm`,   // 실제 틈 = 양쪽 벽에 붙은 두 런 사이 남는 폭(벽 두께차로 stairGap과 다름)
      `· 1층→다락    ${mm(floorH)} mm / ${N}단`,
      '',
      '［단 구성］ 아래→위',
      `· 하부 곧은계단   ${nL}단`,
      `· 하부 돌음(90°)  ${nWind}단`,
      `· 상부 돌음(90°)  ${nLand}단`,
      `· 상부 곧은계단   ${nU}단`,
      '· 다락 진입      1단',
      '',
      '［턴존(돌음 회전)］',
      `· 크기  ${mm(W)} × ${mm(turnD)} mm  (런 폭 × 턴존 깊이)`,
    ].join('\n') };
  },
  get s2Roof3() {
    const deg = Math.round(s2RoofPitch * 180 / Math.PI);
    return { title: '지붕 (징크 박공)', body: [
      `- 마감: 오리지널징크(티타늄아연). 지붕 두께 ${Math.round(roofThickness * 1000)} mm(단열 + 징크).`,
      `- 경사 ${deg}° 박공, 용마루는 너비(X) 방향.`,
      `- 처마: 앞·뒤 ${fmtDim(s2RoofEaveOver)} m, 좌·우 ${fmtDim(s2RoofSideOver)} m 내밈.`,
      `- 눈막이(스노우가드): 양 슬로프 처마 근처 가로바 ${s2SnowGuardT.length}줄 — 쌓인 눈이 한꺼번에 미끄러지지 않게.`,
    ].join('\n') };
  },
  get s2Solar3() {
    const deg = Math.round(s2RoofPitch * 180 / Math.PI);
    const n = s2Solar.cols * s2Solar.rows, kw = n * s2Solar.wattEach / 1000;
    return { title: `태양광 ${fmtDim(kw)} kW`, body: [
      `- 뒤쪽(남측) 지붕 슬로프에 설치. 모듈 ${n}장(가로 ${s2Solar.cols} × 세로 ${s2Solar.rows}, 약 ${s2Solar.wattEach} W) ≈ ${fmtDim(kw)} kW.`,
      `- 한전 상계(역송) 연계. 박공 ${deg}°는 태양광 최적 경사대(28~34°) 안.`,
    ].join('\n') };
  },
  get s2Wall3() {                                          // 박공 외벽 envelope — 높이·각도(기초 상단 기준, 단일 출처서 계산)
    const deg = s2RoofPitch * 180 / Math.PI;                 // 박공 각도 단일 출처(s2RoofPitch)에서 읽음
    const rise = (s2D / 2) * Math.tan(s2RoofPitch);          // 처마→용마루 상승(깊이 절반 × tan(박공각))
    const wallH = roofY - _wBase;                            // 앞뒤벽: 기초 상단~처마
    const peakH = wallH + rise;                              // 좌우 꼭지점: 기초 상단~용마루
    return { title: '외벽 · 박공지붕', body: [
      `- 박공지붕 경사: ${Math.round(deg)}°`,
      `- 앞뒤벽 높이(기초 상단~처마): ${fmtDim(wallH)} m`,
      `- 좌우 꼭지점 높이(기초 상단~용마루): ${fmtDim(peakH)} m`,
      `- 용마루가 처마보다 ${fmtDim(rise)} m 높음 (깊이 ${fmtDim(s2D)} m의 절반 × tan${Math.round(deg)}°)`,
    ].join('\n') };
  },
  get s2Floor1() {                                         // 1층 바닥 — 마감 재질 + 정면·뒤 옥외 계단 사양(계단 상수서 자동 계산)
    const rise = MAT_H + S2_STAIR.slabT;                    // 지면~1층 바닥 윗면(정면·뒤 계단 공통 상승)
    const fRis = rise / s2FrontStair.steps, rRis = rise / s2RearStair.steps;
    return { title: '1층 바닥', body: [
      '［바닥 마감］',
      '· 페데스탈(높이조절 받침) + 포세린 타일',
      '· 건식 시스템',
      '',
      '［정면 옥외 계단］ 집 너비 전체',
      `· 너비    ${fmtDim(s2W)} m`,
      `· 단 수    ${s2FrontStair.steps}단`,
      `· 단높이   ${fmtDim(fRis)} m`,
      `· 디딤    ${fmtDim(s2FrontStair.tread)} m`,
      '· 마감    포세린 타일',
      '',
      '［뒤 출입문 옥외 계단］',
      `· 폭     ${fmtDim(s2RearStair.width)} m`,
      `· 단 수    ${s2RearStair.steps}단`,
      `· 단높이   ${fmtDim(rRis)} m`,
      `· 디딤    ${fmtDim(s2RearStair.tread)} m`,
      '· 마감    포세린 타일',
    ].join('\n') };
  },
  s2Sink: { title: '주방', body: [
    '［전기온수기］',
    '· 경동나비엔 ESW560-30U (30리터)',
    '· 싱크대 아래 설치',
    '· 전용 콘센트(고전력·마젠타) — 하부장 안 낮은 높이',
    '',
    '［인덕션］',
    '· 직결(하드와이어) — 콘센트 아님',
    '· 전선 인출구(정션박스·보라) — 싱크 옆 하부장 안',
  ].join('\n') },
  get s2Stair() {                                          // 계단 사양 + 1층 계단참 아래 옷장 — 모두 계단 상수서 자동 계산
    const { T, R, W, g, tTh, floorH, nosing, rTh, usTh, nUpper, landingSteps } = S2_STAIR;
    const wF = 2 * W + g;                                  // 계단참 깊이(두 런 + 틈)
    const n1 = Math.round(floorH[0] / R), n2 = Math.round(floorH[1] / R);   // 비행별 단 수
    const nL = n1 - landingSteps - nUpper[0];              // 1→2 하부런 단 수(계단참 먹는 단·상부런 수 모두 S2_STAIR)
    const width = W - rTh;                                 // 옷장 너비: 우측 외벽 안쪽~계단참 챌판(챌판 두께 제외)
    const depth = W + usTh;                                // 옷장 깊이: 문 앞면~뒤벽 안쪽(계단아래 문 두께 포함)
    const height = (nL + 1) * R - tTh;                     // 옷장 높이: 1층 바닥~계단참 하부
    const mm = (v) => Math.round(v * 1000);                // m → mm 정수(메모 표기용)
    return { title: '계단', body: [
      '［계단］ 좌우런 · 우측벽 스위치백',
      `· 단높이      ${mm(R)} mm`,
      `· 디딤 깊이    ${mm(T)} mm`,
      `· 디딤판      ${mm(T + nosing)} × ${mm(W)} mm  (계단코 포함, 두께 ${mm(tTh)})`,
      `· 런 폭       ${mm(W)} mm`,
      `· 런 사이 틈   ${mm(g)} mm`,
      `· 1→2층      ${mm(floorH[0])} mm / ${n1}단`,
      `· 2→3층      ${mm(floorH[1])} mm / ${n2}단`,
      '',
      '［참 크기］',
      `· 계단참(스위치백)  ${mm(W)} × ${mm(wF)} mm`,
      `· 층계참(도착칸)   ${mm(s2LandingW)} × ${mm(wF)} mm`,
      '',
      '［계단참 아래 옷장］ 쌍여닫이',
      `· 너비  ${mm(width)} mm  (외벽~챌판)`,
      `· 깊이  ${mm(depth)} mm  (문~뒤벽)`,
      `· 높이  ${mm(height)} mm  (바닥~계단참 밑)`,
    ].join('\n') };
  },
  get s2Lift() {                                           // 홈리프트 — 기준 제품·내외경·운행. 치수는 s2Lift* 상수서 파생
    const rise = roofY - (groundTopY + MAT_H + S2_STAIR.slabT);   // 운행 높이(1층 바닥 윗면~처마)
    return { title: '홈리프트', body: [
      `［기준 제품］ ${s2LiftModel}`,
      '',
      '［크기］ 깊이 × 문면 폭',
      `· 내경(탑승)  ${fmtDim(s2LiftInW)} × ${fmtDim(s2LiftInD)} m`,
      `· 외경(샤프트) ${fmtDim(s2LiftW)} × ${fmtDim(s2LiftD)} m`,
      '',
      '［배치·운행］',
      '· 문: 계단쪽(복도쪽) — 계단을 마주봄',
      '· 뒤 외벽에 등 붙임(층계참 옆·안방쪽)',
      `· 운행: 1층 바닥~처마 관통 ${fmtDim(rise)} m (1~3층)`,
    ].join('\n') };
  },
  get s2Floor2() {                                         // 2층 — 화장실·앞방 크기. 그리기 실좌표(s2Geo)·모듈 상수서 자동 계산
    const { inX0, inX1, inZ0, inZ1, wF, far2 } = s2Geo;      // 그리기가 실제로 쓴 좌표(단일 출처)
    const wcFaceX = far2 + s2LandingW + s2LiftW + s2WallInner;   // 화장실 低X 안쪽면 — 그리기와 동일(도착칸+홈리프트+내벽)
    const bathW = inX1 - wcFaceX, bathD = wF;                // 화장실 실사용: 화장실벽 안쪽~안방 외벽 · 분리벽 안쪽~뒤벽
    const roomW = inX1 - inX0, roomD = (inZ1 - inZ0) - wF - s2WallInner;   // 앞방: 분리벽 앞 전체(전폭 × 앞 외벽~분리벽)
    const landW = s2LandingW, landD = wF;                    // 층계참(도착칸): 계단 끝~화장실 벽 · 분리벽~뒤 외벽
    return { title: '2층 — 화장실 · 안방', body: [
      `- 층계참(계단 올라와 방 들기 전 평평한 바닥, 벽 뺀): ${fmtDim(landW)} × ${fmtDim(landD)} m`,
      `- 화장실(벽 뺀 실사용 바닥): ${fmtDim(bathW)} × ${fmtDim(bathD)} m`,
      `- 안방(벽으로 분리, 길쭉): ${fmtDim(roomW)} × ${fmtDim(roomD)} m`,
      '',
      `[화장실 배치] 좌(안방쪽)=습식·우(주방쪽)=건식 분리. 문=앞 분리벽(안방서 밀어 +Z, 폭 ${fmtDim(s2F2.doorW)}, 도착칸쪽 벽서 ${fmtDim(s2WallInner)}). 앞벽 ${fmtDim(s2WallInner)} m.`,
      `- 변기: 안방쪽-뒤 코너(3층 변기와 수직정렬·오수관 직하). 중심 옆벽서 ${fmtDim(s2WcToiletOff)} m.`,
      `- 샤워부스: 안방쪽-앞 코너 ${fmtDim(s2F2.showerW)}×${fmtDim(s2F2.showerD)} m(유리벽 없이 개방 — 변기앞 공간 확보, 변기와 같은 왼쪽 습식존).`,
      `- 세면대: 변기 옆(3층처럼), 뒤 외벽에 등 붙임. 폭 ${fmtDim(s2F2.vanityW)}·깊이 ${fmtDim(s2F2.vanityD)} m. 변기와 중심 간격 ${fmtDim(s2WcSinkGap)} m. 벽수전(외벽서).`,
      `- 전기온수기 ${s2F2.heaterL} L: 외벽(뒤) 상부 벽거치(${s2F2.heaterL} L는 하부장에 숨기기엔 큼).`,
    ].join('\n') };
  },
  get s2Floor3() {                                         // 3층 — 계단앞(계단실 단열) 문 요구사항. 계단 상수·박공 단면서 자동 계산
    const W = S2_STAIR.W, wF = 2 * W + S2_STAIR.g;          // 계단 런 폭 · 계단참 깊이
    const inZ1 = s2BackZ - s2WallT, zB0 = inZ1 - wF;        // 계단실 앞면(개구 시작 Z)
    const floorY = F3 + S2_STAIR.slabT;                     // 3층 바닥 표면
    const hFront = s2RoofUnderY(zB0) - floorY;              // 개구 천장고 — 앞쪽(低Z, 데크쪽) 높은 끝
    const hStair = s2RoofUnderY(zB0 + W) - floorY;          // 개구 천장고 — 계단쪽(高Z) 낮은 끝
    return { title: '3층 — 계단앞 문(계단실 단열)', body: [
      '[요구사항] 문이 열리면 계단 너비와 똑같이 트여, 문이 없을 때와 같은 크기의 홀이 생겨야 한다.',
      `- 너비: 계단 런 폭과 동일 ${fmtDim(W)} m (양옆 문틀·벽이 폭을 잠식하지 않음 — 개구 순폭 = 계단 폭)`,
      `- 높이: 상인방 없이 바닥~천장(박공 경사 밑선) 전체. 경사라 앞쪽(데크쪽) ${fmtDim(hFront)} m ~ 계단쪽 ${fmtDim(hStair)} m.`,
      '- 즉 문틀·인방으로 막지 말 것. 열리면 개구 전체가 비어 계단실과 한 칸처럼 통해야 한다.',
      '',
      '[화장실 건식 세면대]',
      '- 위치: 3층 화장실 안, 뒤 외벽에 등 붙임(변기 옆). 세면대가 들어온 만큼 화장실을 주방쪽으로 넓혀 벽·문을 이동.',
      `- 변기↔세면대 중심 간격 ${fmtDim(s2WcSinkGap)} m(주택 욕실 표준). 주방쪽 벽·문은 복도쪽으로 더 빼 문이 열려도 세면대에 안 닿게 ${fmtDim(s2WcSinkClear)} m 여유.`,
      `- 하부장 ${fmtDim(s2F3VanityW)}×${fmtDim(s2F3VanityD)} m · 높이 ${fmtDim(s2F3VanityH)} m + 세면볼`,
      '- 수전: 세탁기 수도처럼 뒤 외벽에서 나오는 벽수전.',
      `- 하부장 안에 경동 나비엔 전기온수기 ${s2F3HeaterL} L 설치.`,
    ].join('\n') };
  },
  get hedge() {                                            // 측백담장 — 높이·두께는 코드(hedgeH·hedgeThickness)서 파생.
    return { title: '측백담장', body: [
      '- 측백나무 생울타리(상록)',
      `- 높이 ${fmtDim(hedgeH)} m · 두께 ${fmtDim(hedgeThickness)} m`,
    ].join('\n') };
  },
  get fence() {                                            // 옆집담장 — 높이는 코드(fenceH)서 파생.
    return { title: '옆집담장', body: [
      '- 우측 콘크리트 경계벽',
      `- 높이 ${fmtDim(fenceH)} m`,
    ].join('\n') };
  },
  get siteOverview() {                                     // 대지·지역 개요 + 건폐/용적 검토 — 항상 기본 표시. 숫자는 코드(s2W·s2D·이격 상수)서 파생.
    const lotArea = 161;                                   // 대지면적(잡종지, 등기) — 장암리 639-25
    const floors = 3;                                      // 지상 층수
    const bldgArea = s2W * s2D;                            // 건축면적(1층 발자국)
    const totalArea = bldgArea * floors;                  // 연면적(전 층 합)
    const bcr = (bldgArea / lotArea) * 100;               // 건폐율
    const far = (totalArea / lotArea) * 100;              // 용적률
    const sideGap = -lotX0;                                // 옆집(주방측) 이격 = 집 외벽~옆 경계(파생)
    const rearGap = lotZ1 - s2BackZ;                      // 뒤 이격 = 집 뒤벽~후면 경계(파생)
    return { title: '대지 개요', body: [
      '[대지 · 지역]',
      '- 주소: 경기 포천시 이동면 장암리 639-25',
      `- 대지면적: ${lotArea} ㎡ (지목 잡종지 → 건축 후 ‘대’)`,
      '- 용도지역: 계획관리지역 + 성장관리계획구역',
      `- 이격거리: 도로(건축선) 1.0 m · 옆 ${sideGap.toFixed(1)} m · 뒤 ${rearGap.toFixed(1)} m`,
      '',
      '[규모 검토]',
      `- 건물: ${s2W}×${s2D.toFixed(1)} m · 지상 ${floors}층`,
      `- 건축면적 ${bldgArea.toFixed(0)} ㎡ · 연면적 ${totalArea.toFixed(0)} ㎡`,
      `- 건폐율: ${bcr.toFixed(1)} %  (한도 50 %)`,
      `- 용적률: ${far.toFixed(1)} %  (한도 125 %)`,
      '',
      '* 성장관리계획상 층수·높이 가이드라인은 포천시청 도시과(031-538-2114) 확인 필요.',
    ].join('\n') };
  },
  get siteOverviewS1() {                                   // 대지·지역 개요(1층+다락 안) — s1 도면 상단 상시 표시. 숫자는 코드(building*·deckRoof·이격 상수)서 파생.
    const lotArea = 161;                                   // 대지면적(잡종지, 등기) — 장암리 639-25
    const houseArea = buildingW * buildingD;               // 집 건축면적(외벽 중심선 수평투영)
    const deckRoofArea = deckRoofBcrArea;                  // 포치(데크 지붕) 건축면적 — 외곽 기둥 중심선 안쪽(§119① 2호)
    const bldgArea = houseArea + deckRoofArea;            // 건축면적 = 집 + 포치(지붕 덮인 기둥 안쪽 전부)
    const floorArea = houseArea;                           // 연면적 = 1층 바닥만(다락·개방 포치는 바닥면적 비산입)
    const bcr = (bldgArea / lotArea) * 100;               // 건폐율
    const far = (floorArea / lotArea) * 100;              // 용적률
    const sideGap = -lotX0;                                // 옆집(주방측) 이격 = 집 외벽~옆 경계(파생)
    const rearGap = lotZ1 - buildingBackZ;                 // 뒤 이격 = 집 뒤벽~후면 경계(파생)
    return { title: '대지 개요', body: [
      '[대지 · 지역]',
      '- 주소: 경기 포천시 이동면 장암리 639-25',
      `- 대지면적: ${lotArea} ㎡ (지목 잡종지 → 건축 후 ‘대’)`,
      '- 용도지역: 계획관리지역 + 성장관리계획구역',
      `- 이격거리: 도로(건축선) 1.0 m · 옆 ${sideGap.toFixed(1)} m · 뒤 ${rearGap.toFixed(1)} m`,
      '',
      '[규모 검토]',
      `- 건물: ${buildingW}×${buildingD.toFixed(1)} m · 지상 1층 + 다락`,
      `- 건축면적: 집 ${houseArea.toFixed(1)} + 포치 ${deckRoofArea.toFixed(1)} = ${bldgArea.toFixed(1)} ㎡`,
      `- 건폐율: ${bcr.toFixed(1)} %  (한도 50 %)`,
      `- 연면적: ${floorArea.toFixed(1)} ㎡ (1층, 다락·포치 비산입)`,
      `- 용적률: ${far.toFixed(1)} %  (한도 125 %)`,
      '',
      '* 포치 건축면적 = 기둥으로 받친 지붕 → 외곽 기둥 중심선 안쪽 수평투영(§119① 2호). 개방 포치라 연면적엔 미산입.',
      '* 성장관리계획상 층수·높이 가이드라인은 포천시청 도시과(031-538-2114) 확인 필요.',
    ].join('\n') };
  },
  get s2Foundation() {                                     // 기초 — '기초' 토글 시. 두께는 코드(MAT_H)서 파생.
    const slabH = MAT_H;                                   // 온통기초(매트 슬래브) 두께
    return { title: '기초', body: [
      '[기초]',
      `- 형식: 온통기초(매트 슬래브) · ${s2W}×${s2D.toFixed(1)} m 전면`,
      `- 기초 두께: ${slabH.toFixed(2)} m (지면 위)`,
    ].join('\n') };
  },
};
const NOTE_ORDER = ['plan', 'matFoundationFull', 'firstFloorFinish', 'stair', 'firstWall', 'firstRoom', 'outlet', 'bath', 'loft', 'atticInnerWall', 'atticExtWall', 'roof', 'deck', 'sunWall', 'folding', 'accessory', 'hedge', 'fence', 's2Foundation', 's2Floor1', 's2Sink', 's2Stair', 's2Lift', 's2Floor2', 's2Floor3', 's2Wall3', 's2Roof3', 's2Solar3'];
function updateNotes() {
  const body = document.querySelector('#noteBody');
  if (!body) return;
  const active = NOTE_ORDER.filter((k) => (k === 'plan' ? view.plan : (!view.plan && view[k])) && NOTES[k]);
  // 대지 개요 — 도면(s1·s2)마다 시작 배치도든 입체든, 토글과 무관하게 항상 맨 위에 표시
  if (currentScheme === 's2' && NOTES.siteOverview) active.unshift('siteOverview');
  else if (currentScheme === 's1' && NOTES.siteOverviewS1) active.unshift('siteOverviewS1');
  if (!active.length) { body.innerHTML = '<p class="note-empty">이 화면에 대한 메모가 아직 없습니다.</p>'; return; }
  body.innerHTML = active.map((k) => `<section class="note-item"><h3>${NOTES[k].title}</h3><div class="note-text">${NOTES[k].body}</div></section>`).join('');
}

// 배치도(부감) 전용 카메라 — 대지 전체를 상부에서 내려다본다(도로·토지·담장·기초 바닥 한눈에).
function setPlanView() {
  camera.up.set(0, 1, 0);
  const cx = (lotX0 + lotX1) / 2;
  const cz = (lotZ0 + lotZ1) / 2;
  controls.target.set(cx, 0.2, cz);
  // 정남(화면 아래) = 옆집담장·측백담장이 만나는 모서리(낮은 X·뒤쪽 Z). 그 모서리가 화면 맨 아래로
  // 오도록 상부 시점의 살짝 기운 방향을 모서리 쪽으로 돌린다.
  const corner = new THREE.Vector2(lotX0 - cx, lotZ1 - cz);   // 중심→모서리 (X,Z)
  corner.normalize().multiplyScalar(15.3);                    // 남쪽으로 더 물러나 비스듬히(입체감) 내려다봄
  camera.position.set(cx + corner.x, 12.8, cz + corner.y);    // 수직 기준 약 50° 기운 조감
  controls.update();
}

// 줌 중심(target)의 높이를 현재 보이는 구조물 높이의 '중간'에 맞춘다. 지면(바닥)에 박지 않으므로
// 키 큰 부재(골조 등)를 켜고 확대해도 위쪽이 화면 밖으로 밀리지 않는다. x·z는 그대로 둔다.
function centerTargetHeight() {
  scene.updateMatrixWorld(true);
  _fitBox.makeEmpty();
  scene.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    if (o.name === 'ground') return;
    for (let p = o.parent; p; p = p.parent) if (!p.visible) return;
    _fitBox.expandByObject(o);
  });
  if (_fitBox.isEmpty()) return;
  controls.target.y = (_fitBox.min.y + _fitBox.max.y) / 2;
  // 화면에서 집이 아래로 붙어 보여, 프레임 세로의 15%만큼 위로 올려 보이도록 줌 중심을 아래로 내려 팬
  const dist = camera.position.distanceTo(controls.target);
  controls.target.y -= 0.15 * 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  controls.update();
}

// 프리셋 뷰 — 배치도(부감): 모든 부품 끄고 평면만.
function showPlan() {
  for (const k of Object.keys(view)) view[k] = false;
  view.plan = true;
  applyVisibility();
  setPlanView();
}

// 메뉴 그룹 전체 on/off — 제목 오른쪽 버튼. 그룹에 속한 부품 키 전체를 한 번에 켜고/끈다.
const SEG_KEYS = {                              // 버튼 id → 제어하는 view 키(집계 버튼은 leaf 키들의 합집합)
  bHedge: ['hedge'], bFence: ['fence'],
  bStair: ['s2Stair'], bLift: ['s2Lift'],
  bF1Foundation: ['s2Foundation'], bF1Floor: ['s2Floor1'], bF1Wall: ['s2Wall1'],
  bF1Furniture: ['s2Furniture'], bF1Sink: ['s2Sink'], bF1Stove: ['s2Stove'], bF1Fan: ['s2Fan1'],
  bF2Floor: ['s2Floor2'], bF2Wall: ['s2Wall2'], bF2Fan: ['s2Fan2'],
  bF3Floor: ['s2Floor3'], bF3Wall: ['s2Wall3'], bF3Ecu: ['s2Ecu3'],
  bF3Roof: ['s2Roof3'], bF3Solar: ['s2Solar3'],
};
for (const [id, key] of S1_TOGGLES) SEG_KEYS[id] = [key];   // s1 부품 버튼도 그룹 전체버튼 집계에 포함
const groupControls = [];   // [{ btn, getKeys }] — 각 그룹의 전체버튼 + 제어 키 산출(현재 탭에 보이는 버튼만)
for (const sec of document.querySelectorAll('.menu-group')) {
  if (!sec.querySelector('.seg-btn')) continue;
  // '기본' 그룹처럼 탭 전용 버튼이 섞인 곳은 숨겨진(다른 탭) 버튼을 빼고 집계 — s1 탭 '켜기'가 s2 기초를 켜지 않게.
  const getKeys = () => {
    const keys = new Set();
    for (const b of sec.querySelectorAll('.seg-btn')) { if (b.hidden) continue; for (const k of (SEG_KEYS[b.id] || [])) keys.add(k); }
    return [...keys];
  };
  if (!getKeys().length && !sec.querySelectorAll('.seg-btn[data-scheme]').length) continue;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'menu-all';
  sec.querySelector('.menu-title').appendChild(btn);
  btn.addEventListener('click', () => {
    const keyList = getKeys();
    if (!keyList.length) return;
    const target = !keyList.some((k) => view[k]);   // 토글: 하나라도 켜졌으면 모두 끄고, 다 꺼졌으면 모두 켬
    for (const k of keyList) view[k] = target;
    if (target && view.plan) view.plan = false;   // 켜면 부감에서 빠져나옴
    applyVisibility();
    if (target) centerTargetHeight();
  });
  groupControls.push({ btn, getKeys });
}
// 전체버튼 라벨·상태 동기화 — 개별 토글로 view가 바뀌어도 버튼이 따라오게 applyVisibility서 호출.
function syncAllButtons() {
  for (const { btn, getKeys } of groupControls) {
    const keys = getKeys();
    const anyOn = keys.some((k) => view[k]);
    btn.textContent = anyOn ? '끄기' : '켜기';
    btn.classList.toggle('on', anyOn);
  }
}

// 계단·바닥 버튼 행 — 체크박스 대신 버튼. 개별 버튼은 자기 키를 토글, '계단'·'바닥'은 하위 전부를 한 번에 on/off.
function bindSegButton(id, onClick) {
  const el = document.querySelector('#' + id);
  if (!el) return;
  el.addEventListener('click', () => {
    onClick();
    if (view.plan) view.plan = false;   // 부품 켜면 부감에서 빠져나옴
    applyVisibility();
    centerTargetHeight();
  });
}
bindSegButton('bHedge', () => { view.hedge = !view.hedge; });
bindSegButton('bFence', () => { view.fence = !view.fence; });
// '1층' 그룹 버튼 — 구조 섹션의 같은 부품(기초·1층바닥·1>2층계단·식탁·주방·난로)을 공유 토글
bindSegButton('bF1Foundation', () => { view.s2Foundation = !view.s2Foundation; });
bindSegButton('bF1Floor', () => { view.s2Floor1 = !view.s2Floor1; });
bindSegButton('bF1Furniture', () => { view.s2Furniture = !view.s2Furniture; });
bindSegButton('bF1Sink', () => { view.s2Sink = !view.s2Sink; });
bindSegButton('bF1Stove', () => { view.s2Stove = !view.s2Stove; });
bindSegButton('bF1Fan', () => { view.s2Fan1 = !view.s2Fan1; });
bindSegButton('bF2Floor', () => { view.s2Floor2 = !view.s2Floor2; });
bindSegButton('bF2Fan', () => { view.s2Fan2 = !view.s2Fan2; });
bindSegButton('bF3Floor', () => { view.s2Floor3 = !view.s2Floor3; });
bindSegButton('bF3Ecu', () => { view.s2Ecu3 = !view.s2Ecu3; });          // 3층 실외기 = 방열/배기 루버 그릴 + 벽 안쪽 실외기실
bindSegButton('bF3Roof', () => { view.s2Roof3 = !view.s2Roof3; });       // 3층 지붕 = 징크 박공 슬래브 + 처마 + 눈막이
bindSegButton('bF3Solar', () => { view.s2Solar3 = !view.s2Solar3; });    // 3층 태양광 = 뒤 지붕 3kW 패널
bindSegButton('bStair', () => { view.s2Stair = !view.s2Stair; });        // 계단 = 1·2·3층 계단 전체 한 토글
bindSegButton('bAllWall', () => { const all = view.s2Wall1 && view.s2Wall2 && view.s2Wall3; view.s2Wall1 = view.s2Wall2 = view.s2Wall3 = !all; });   // 외벽 켜기 = 1·2·3층 외벽 한꺼번에
bindSegButton('bF1Wall', () => { view.s2Wall1 = !view.s2Wall1; });       // 외벽 1층
bindSegButton('bF2Wall', () => { view.s2Wall2 = !view.s2Wall2; });       // 외벽 2층
bindSegButton('bF3Wall', () => { view.s2Wall3 = !view.s2Wall3; });       // 외벽 3층
bindSegButton('bLift', () => { view.s2Lift = !view.s2Lift; });           // 홈리프트 = 전체 샤프트(독립)
// s1(1층·다락·포치) 부품 버튼 — 개별 키 토글.
for (const [id, key] of S1_TOGGLES) {
  bindSegButton(id, () => { view[key] = !view[key]; });
}

// ── 최상위 탭(설계안 scheme) ───────────────────────────────────────────────────
// 페이지 가장 바깥 선택: 탭마다 별도 설계안. 대지·측백담·옆집담·이격은 모든 탭 공유.
// 탭 클릭 = 그 설계안의 배치도(부감)부터(켠 부품 전부 리셋). 같은 탭을 다시 눌러도 배치도로 복귀.
// 탭 추가: ① scene.js에 <button class="scheme-tab" data-scheme="sN"> + <section data-scheme="sN"> 그룹
//          ② 그 탭 전용 부재는 applyVisibility에서 currentScheme==='sN'으로 게이팅(s2 예시 참고).
let currentScheme = 's2';
function setScheme(id) {
  currentScheme = id;
  for (const sec of document.querySelectorAll('.menu-group[data-scheme]')) {
    const ds = sec.dataset.scheme;
    sec.hidden = !(ds === 'shared' || ds === id);   // 공통+현재 탭 그룹만 노출
  }
  // 공통('기본') 그룹 안의 탭 전용 버튼(기초=s2 / 부분·전체=s1)은 현재 탭 것만 노출 — 각 탭에 자기 기초만 보임
  for (const b of document.querySelectorAll('.seg-btn[data-scheme]')) b.hidden = (b.dataset.scheme !== id);
  for (const t of document.querySelectorAll('.scheme-tab')) t.classList.toggle('active', t.dataset.scheme === id);
  showPlan();   // 그 탭의 배치도(부감)로 — 켠 부품 리셋 + 부감 카메라
}
for (const t of document.querySelectorAll('.scheme-tab')) {
  t.addEventListener('click', () => setScheme(t.dataset.scheme));
}


// 계단 제원은 stairParams 기본값으로 확정 — 화면 내 조절 패널은 제거함.
buildStair();   // s1 ㄷ자 계단 빌드 — ./s1/stair.js
applyVisibility();   // 계단 빌드 직후 화면 갱신 — 옛 buildStair() 말미 호출을 main으로 이동(순환 제거, 결과 동일)

// ── 집(바닥~지붕)을 houseGroup으로 묶기 — 기초 윗면 높이에 맞춰 통째로 Y 이동(단일 출처) ──
// 집 객체 전부를 houseGroup 자식으로 옮긴다(빌드 좌표는 말뚝기초 윗면 기준 그대로 보존).
// 선택 기초가 매트면 applyVisibility에서 houseGroup.position.y에 (매트 윗면 − 말뚝 윗면)을 줘 집이 따라 올라간다.
// 기초·데크·대지·발자국·담장은 옮기지 않는다(각자 자기 자리에 고정).
{
  const HOUSE_ARRAYS = [
    firstFloorFinishObjects, firstDimObjects, firstWallObjects, firstFloorObjects, bathObjects,
    secondFloorObjects, atticExtWallObjects, atticInnerWallObjects, roofObjects,
    stairCoreObjects, stairObjects, kitchenInnerWallObjects, familyInnerWallObjects,
  ];
  const seen = new Set();
  for (const arr of HOUSE_ARRAYS) for (const o of arr) { if (!seen.has(o)) { seen.add(o); houseGroup.add(o); } }   // add = scene→houseGroup 재부모(로컬좌표 보존)
}

setScheme('s1'); // 초기 탭 = 1층·다락·포치(s1) + 그 배치도(부감) — setScheme가 showPlan 호출

// 모든 컨트롤 버튼 높이를 '가장 큰 버튼'에 맞춰 통일 — 라벨 줄이 늘어도, 몇 줄로 줄바꿈돼도 항상 동일.
function equalizeButtonHeights() {
  const btns = [...document.querySelectorAll('.controls button')];
  if (!btns.length) return;
  for (const b of btns) b.style.height = 'auto';                 // 내용 높이로 리셋 후 측정
  const max = Math.max(...btns.map((b) => b.offsetHeight));
  for (const b of btns) b.style.height = `${max}px`;             // 전체를 최댓값으로 통일
}
equalizeButtonHeights();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(equalizeButtonHeights);  // 폰트 로드 후 재측정

function resize() {
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  equalizeButtonHeights();   // 줄바꿈 수가 바뀌어도 높이 통일 유지
}
window.addEventListener('resize', resize);
resize();   // 시작 시 1회 — dev에서 초기 stage 높이가 늦게 잡혀 캔버스가 0높이(백지)로 뜨는 것 방지.

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
