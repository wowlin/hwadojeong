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
import { } from './materials.js';
import { stage, scene, houseGroup, camera, renderer, controls } from './scene.js';
import { fmtDim } from './primitives.js';
import { } from './labels.js';
import { } from './fixtures.js';
import { buildSite, fenceH, hedgeH } from './site.js';
import { buildFloor1, buildFloor1Fixtures, firstStairRoomLabel, firstBathDimLabel, firstBathClearFill } from './s1/floor1.js';
import { buildAttic } from './s1/attic.js';
import { buildDeck, buildDeckStairFrame, buildDeckStoveCassette, deckRoofBcrArea, s1DeckFurn } from './s1/deck.js';
import { buildPlan } from './s1/plan.js';
import { buildStair, stairParams, stairGeom } from './s1/stair.js';
import {
  S2_STAIR, s2W, s2BackZ, s2WallT, s2F3VanityW, s2F3VanityD, s2F3VanityH, s2F3HeaterL, s2WcSinkGap, s2WcSinkClear, s2WcToiletOff,
  s2LandingW, s2LiftW, s2LiftD, s2LiftInW, s2LiftInD, s2LiftModel, s2WallInner, s2F2, s2Geo,
  s2D, _wBase, F3, roofY, s2RoofPitch, s2RoofSideOver, s2RoofEaveOver,
  s2SnowGuardT, s2Solar, s2RoofUnderY, s2FrontStair, s2RearStair,
} from './s2/constants.js';
import { buildS2Base, buildS2Stair } from './s2/stair.js';
import { buildS2Floor2 } from './s2/floor2.js';
import { buildS2Floor3 } from './s2/floor3.js';
import { buildS2Outlets } from './s2/outlets.js';
import { buildS2Interior } from './s2/interior.js';
import { buildS2Walls } from './s2/walls.js';
import { buildS2Roof } from './s2/roof.js';
import { buildRoof, buildRoofSolar } from './s1/roof.js';
import {
  } from './builders.js';
import {
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

buildS2Walls();   // s2 층별 외벽·창·폴딩·눈썹지붕·실외기실·뒤 출입문·옥외 뒤계단 — ./s2/walls.js

buildS2Roof();   // s2 지붕(징크 박공·눈막이)·태양광 — ./s2/roof.js

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
