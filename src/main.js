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
import { } from './materials.js';
import { stage, scene, houseGroup, camera, renderer, controls } from './scene.js';
import { } from './primitives.js';
import { } from './labels.js';
import { } from './fixtures.js';
import { buildSite } from './site.js';
import { buildFloor1, buildFloor1Fixtures } from './s1/floor1.js';
import { buildAttic } from './s1/attic.js';
import { buildDeck, buildDeckStairFrame, buildDeckStoveCassette } from './s1/deck.js';
import { buildPlan } from './s1/plan.js';
import { buildStair } from './s1/stair.js';
import {
  } from './s2/constants.js';
import { buildS2Base, buildS2Stair } from './s2/stair.js';
import { buildS2Floor2 } from './s2/floor2.js';
import { buildS2Floor3 } from './s2/floor3.js';
import { buildS2Outlets } from './s2/outlets.js';
import { buildS2Interior } from './s2/interior.js';
import { buildS2Walls } from './s2/walls.js';
import { buildS2Roof } from './s2/roof.js';
import { applyVisibility, setScheme, equalizeButtonHeights } from './ui.js';
import { buildRoof, buildRoofSolar } from './s1/roof.js';
import {
  } from './builders.js';
import {
  } from './openings.js';
import {
} from './constants.js';
import {
} from './layout.js';
import {
  firstFloorFinishObjects, firstFloorObjects, bathObjects, firstWallObjects, firstDimObjects, secondFloorObjects, atticExtWallObjects, atticInnerWallObjects, roofObjects, stairObjects, stairCoreObjects, kitchenInnerWallObjects, familyInnerWallObjects,
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

buildPlan();   // 발자국·매트기초·담장 발자국·평면 치수·기준선 — ./s1/plan.js
// 집 말뚝 X열 간격 치수 — 제거됨(말뚝기초 삭제, 사용자 요청).

// ── s2(3층 구조) 빌드 파이프라인 — s2 부재는 전부 src/s2/*.js 안에서만 그린다.
//    (작업 도면 격리는 test ⑭⑮가 파일 경계(src/s2/)로 강제 — s2 파일은 s2*Objects 그룹만, s2 그룹은 s2 파일만.)
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


// ── s2 빌드 끝 · 아래부터 s1 후속(부동수전·실링팬·태양광)과 공유 UI ──
buildFloor1Fixtures();   // 외부 부동수전 + 1층 실링팬 — ./s1/floor1.js

buildRoofSolar();   // 지붕 태양광 3kW — ./s1/roof.js

// 가시성 상태(view)·PARTS·applyVisibility·버튼/탭 바인딩·카메라 프리셋 → ./view-state.js·./ui.js / 설계 메모 → ./notes.js

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

// 버튼 높이 통일(equalizeButtonHeights)은 ./ui.js — resize 시 재호출.

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
