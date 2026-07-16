// ════════════════════════════════════════════════════════════════════════════
// 화도정 3D 개념 모형 — 오케스트레이터. 설계 파이프라인 순서대로 빌드 함수를 호출한다.
//   파이프라인: 배치(site) → 1층 → 다락 → 지붕 → 데크(썬룸) → 평면 → s2(3층 구조) → 후속 설비 → 계단 → 재부모 → 부팅
//   부재 편집은 해당 모듈 파일에서: s1(1층+다락+데크) = src/s1/* · s2(3층) = src/s2/* · 공유 헬퍼 = src/*.js
//   ★ scene 추가 순서 = 토글 그룹 귀속. 아래 호출 순서를 바꾸면 화면 토글이 깨진다(스냅샷 가드가 검출).
// ════════════════════════════════════════════════════════════════════════════
// ▌좌표계 (단위 m)
//   X = 동서 :  +X = 동(도로측) / −X = 서      (평면도에선 동이 화면 왼쪽 = 미러)
//   Z = 남북 :  +Z = 남(집 뒤)  / −Z = 북(정면·현관·썬룸)
//   Y = 상하 :  지면 groundTopY → +기초 +바닥마감 = 1층 바닥 firstFloorY
//   집 발자국 : X 0~buildingW, Z buildingFrontZ~buildingBackZ. 정면(−Z=북)에 데크/썬룸.
//   ★ 좌우/앞뒤 (주 출입문 보는 시점 — 사용자 확정, 절대 헷갈리지 말 것):
//     왼쪽(좌) = 동 = 높은 X(buildingW쪽) = 도로·안방측 │ 오른쪽(우) = 서 = 낮은 X(0쪽) = 주방측
//     앞 = 정면(−Z, 현관·썬룸·마당) │ 뒤 = 집뒤(+Z, 측백·도로 — 마당 없음)
// ▌수정 포인트
//   · 치수·제원   : src/constants.js(리터럴) → src/layout.js(파생) · s2는 src/s2/constants.js
//   · 색·재질     : src/materials.js 단일 출처
//   · 버튼·토글   : 마크업 src/ui-shell.js · 바인딩/가시성 src/ui.js · 표시 상태 src/view-state.js
//   · 설계 메모   : src/notes.js (수치는 반드시 코드 상수 ${} 파생 — test ⑯)
// ════════════════════════════════════════════════════════════════════════════
import { stage, scene, houseGroup, camera, renderer, controls } from './scene.js';
import { buildSite } from './site.js';
import { buildFloor1, buildFloor1Fixtures } from './s1/floor1.js';
import { buildAttic } from './s1/attic.js';
import { buildRoof, buildRoofSolar } from './s1/roof.js';
import { buildDeck, buildDeckStairFrame, buildDeckStoveCassette } from './s1/deck.js';
import { buildPlan } from './s1/plan.js';
import { buildStair } from './s1/stair.js';
import { buildS2Base, buildS2Stair } from './s2/stair.js';
import { buildS2Floor2 } from './s2/floor2.js';
import { buildS2Floor3 } from './s2/floor3.js';
import { buildS2Outlets } from './s2/outlets.js';
import { buildS2Interior } from './s2/interior.js';
import { buildS2Walls } from './s2/walls.js';
import { buildS2Roof } from './s2/roof.js';
import { applyVisibility, setScheme } from './ui.js';
import {
  firstFloorFinishObjects, firstFloorObjects, bathObjects, firstWallObjects, firstDimObjects, secondFloorObjects, atticExtWallObjects, atticInnerWallObjects, roofObjects, stairObjects, stairCoreObjects, kitchenInnerWallObjects, familyInnerWallObjects,
} from './groups.js';
import './styles.css';

// ── s1(1층·다락·포치) 빌드 ──────────────────────────────────────────────────
buildSite();               // 대지·도로·측백담장·옆집담장 — ./site.js
buildFloor1();             // 1층 바닥·외벽·창·가구·화장실·콘센트 — ./s1/floor1.js
buildAttic();              // 다락 바닥·외벽·내벽 — ./s1/attic.js
buildRoof();               // 지붕(단열+징크)·경사 라벨·눈막이·홈통 — ./s1/roof.js
buildDeck();               // 썬룸(포치 골조·폴딩·데크 바닥·가구·지붕)·데크 발자국 — ./s1/deck.js
buildPlan();               // 발자국·매트기초·담장 발자국·평면 치수·기준선 — ./s1/plan.js

// ── s2(3층 구조) 빌드 — s2 부재는 전부 src/s2/*.js 안에서만 그린다(test ⑭⑮ 파일 경계 강제) ──
buildS2Base();             // s2 발자국·온통기초·정면 옥외계단·배치 치수 — ./s2/stair.js
buildS2Stair();            // s2 계단·홈리프트·층계참·1/2/3층 바닥 슬래브 — ./s2/stair.js
buildS2Floor2();           // 2층 화장실·안방 실내 — ./s2/floor2.js (s2Geo 공유)
buildS2Floor3();           // 3층 화장실·게스트룸1/2 — ./s2/floor3.js (s2Geo 공유)
buildS2Outlets();          // 2·3층 콘센트(외벽 토글 귀속) — ./s2/outlets.js (s2Geo 공유)
buildS2Interior();         // s2 1층 식탁·의자·화목난로·싱크대·주방 콘센트·천장 조명 — ./s2/interior.js
buildS2Walls();            // s2 층별 외벽·창·폴딩·눈썹지붕·실외기실·뒤 출입문·옥외 뒤계단 — ./s2/walls.js
buildS2Roof();             // s2 지붕(징크 박공·눈막이)·태양광 — ./s2/roof.js

// ── s1 후속(원본 scene 순서 보존을 위해 s2 뒤에 그리는 s1 부재) ─────────────────
buildDeckStairFrame();     // 데크 계단틀(직선 앞 계단 틀·포세린 단) — ./s1/deck.js
buildDeckStoveCassette();  // 데크 화목난로·착탈 카세트 — ./s1/deck.js
buildFloor1Fixtures();     // 외부 부동수전 + 1층 실링팬 — ./s1/floor1.js
buildRoofSolar();          // 지붕 태양광 3kW — ./s1/roof.js
buildStair();              // s1 ㄷ자 계단(본체·주석·계단실 내벽) — ./s1/stair.js
applyVisibility();         // 계단 빌드 직후 화면 갱신(옛 buildStair 말미 호출을 여기로 — 순환 제거, 결과 동일)

// ── 집(바닥~지붕)을 houseGroup으로 묶기 — 기초 윗면 높이에 맞춰 통째로 Y 이동(단일 출처) ──
// 집 객체 전부를 houseGroup 자식으로 옮긴다(빌드 좌표는 말뚝기초 윗면 기준 그대로 보존).
// 선택 기초가 매트면 applyVisibility에서 houseGroup.position.y에 (매트 윗면 − 말뚝 윗면)을 줘 집이 따라 올라간다.
// 기초·데크·대지·발자국·담장은 옮기지 않는다(각자 자기 자리에 고정).
// ※ 재부모는 빌드 파이프라인의 마지막 단계 — 이 뒤에 부재를 새로 그리면(계단 재빌드 등) 그룹 밖에 남아
//   매트기초 오프셋을 못 받는다. 새 부재·재빌드는 반드시 이 블록 앞에서 끝낼 것(§2-3 잠복 결합 명시).
{
  const HOUSE_ARRAYS = [
    firstFloorFinishObjects, firstDimObjects, firstWallObjects, firstFloorObjects, bathObjects,
    secondFloorObjects, atticExtWallObjects, atticInnerWallObjects, roofObjects,
    stairCoreObjects, stairObjects, kitchenInnerWallObjects, familyInnerWallObjects,
  ];
  const seen = new Set();
  for (const arr of HOUSE_ARRAYS) for (const o of arr) { if (!seen.has(o)) { seen.add(o); houseGroup.add(o); } }   // add = scene→houseGroup 재부모(로컬좌표 보존)
}

// ── 부팅 ────────────────────────────────────────────────────────────────────
setScheme('s1'); // 초기 탭 = 1층·다락·포치(s1) + 그 배치도(부감) — setScheme가 showPlan 호출

function resize() {
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
window.addEventListener('resize', resize);
resize();   // 시작 시 1회 — dev에서 초기 stage 높이가 늦게 잡혀 캔버스가 0높이(백지)로 뜨는 것 방지.

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
