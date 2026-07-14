// THREE 셋업 싱글톤 — DOM 셸(버튼 패널) + scene/camera/renderer/controls. import 시 1회 초기화.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const app = document.querySelector('#app');
app.innerHTML = `
  <main class="shell">
    <aside class="sidebar">
      <nav class="scheme-tabs">
        <button id="tabS2" type="button" class="scheme-tab active" data-scheme="s2">3층</button>
        <button id="tabS1" type="button" class="scheme-tab" data-scheme="s1">1층·다락·포치</button>
      </nav>
      <section class="menu-group" data-scheme="s2">
        <h2 class="menu-title">지붕·태양광</h2>
        <div class="seg-row" role="group" aria-label="지붕·태양광">
          <button type="button" class="seg-btn" id="bF3Roof">지붕</button>
          <button type="button" class="seg-btn" id="bF3Solar">태양광</button>
        </div>
      </section>
      <section class="menu-group" data-scheme="s2">
        <h2 class="menu-title">외벽</h2>
        <div class="seg-row" role="group" aria-label="외벽 1층·2층·3층">
          <button type="button" class="seg-btn" id="bF1Wall">1층</button>
          <button type="button" class="seg-btn" id="bF2Wall">2층</button>
          <button type="button" class="seg-btn" id="bF3Wall">3층</button>
        </div>
      </section>
      <section class="menu-group" data-scheme="s2">
        <h2 class="menu-title">공통</h2>
        <div class="seg-row" role="group" aria-label="공통 계단·홈리프트">
          <button type="button" class="seg-btn" id="bStair">계단</button>
          <button type="button" class="seg-btn" id="bLift">홈리프트</button>
        </div>
      </section>
      <section class="menu-group" data-scheme="s2">
        <h2 class="menu-title">3층</h2>
        <div class="seg-row" role="group" aria-label="3층 바닥·실외기">
          <button type="button" class="seg-btn" id="bF3Floor">바닥</button>
          <button type="button" class="seg-btn" id="bF3Ecu">실외기</button>
        </div>
      </section>
      <section class="menu-group" data-scheme="s2">
        <h2 class="menu-title">2층</h2>
        <div class="seg-row" role="group" aria-label="2층 바닥·실링팬">
          <button type="button" class="seg-btn" id="bF2Floor">바닥</button>
          <button type="button" class="seg-btn" id="bF2Fan">실링팬</button>
        </div>
      </section>
      <section class="menu-group" data-scheme="s2">
        <h2 class="menu-title">1층</h2>
        <div class="seg-row" role="group" aria-label="1층 실링팬">
          <button type="button" class="seg-btn" id="bF1Fan">실링팬</button>
        </div>
        <div class="seg-row" role="group" aria-label="1층 식탁·주방·난로">
          <button type="button" class="seg-btn" id="bF1Furniture">식탁</button>
          <button type="button" class="seg-btn" id="bF1Sink">주방</button>
          <button type="button" class="seg-btn" id="bF1Stove">난로</button>
        </div>
        <div class="seg-row" role="group" aria-label="1층 바닥">
          <button type="button" class="seg-btn" id="bF1Floor">바닥</button>
        </div>
      </section>
      <section class="menu-group" data-scheme="s1">
        <h2 class="menu-title">외벽·지붕</h2>
        <div class="seg-row" role="group" aria-label="지붕·태양광">
          <button type="button" class="seg-btn" id="bRoof">지붕</button>
          <button type="button" class="seg-btn" id="bSolar">태양광</button>
        </div>
      </section>
      <section class="menu-group" data-scheme="s1">
        <h2 class="menu-title">다락</h2>
        <div class="seg-row" role="group" aria-label="다락 바닥·내벽·외벽">
          <button type="button" class="seg-btn" id="bLoft">바닥</button>
          <button type="button" class="seg-btn" id="bAtticInnerWall">내벽</button>
          <button type="button" class="seg-btn" id="bAtticExtWall">외벽</button>
        </div>
      </section>
      <section class="menu-group" data-scheme="s1">
        <h2 class="menu-title">포치</h2>
        <div class="seg-row" role="group" aria-label="포치 데크·폴딩">
          <button type="button" class="seg-btn" id="bDeck">데크</button>
          <button type="button" class="seg-btn" id="bFolding">폴딩</button>
          <button type="button" class="seg-btn" id="bSunRoof">지붕</button>
        </div>
        <div class="seg-row" role="group" aria-label="포치 프레임">
          <button type="button" class="seg-btn" id="bFrame">프레임</button>
        </div>
      </section>
      <section class="menu-group" data-scheme="s1">
        <h2 class="menu-title">1층</h2>
        <div class="seg-row" role="group" aria-label="외벽·콘센트">
          <button type="button" class="seg-btn" id="bFirstWall">외벽</button>
          <button type="button" class="seg-btn" id="bFirstOutlet">콘센트</button>
        </div>
        <div class="seg-row" role="group" aria-label="천장·화장실·계단">
          <button type="button" class="seg-btn" id="bFirstCeiling">천장</button>
          <button type="button" class="seg-btn" id="bBath">화장실</button>
          <button type="button" class="seg-btn" id="bS1Stair">계단</button>
        </div>
        <div class="seg-row" role="group" aria-label="바닥">
          <button type="button" class="seg-btn" id="bFirstFloorFinish">바닥</button>
        </div>
      </section>
      <section class="menu-group" data-scheme="shared">
        <h2 class="menu-title">기본</h2>
        <div class="seg-row" role="group" aria-label="기초">
          <button type="button" class="seg-btn" id="bF1Foundation" data-scheme="s2">기초</button>
          <button type="button" class="seg-btn" id="bMatFull" data-scheme="s1">기초</button>
        </div>
        <div class="seg-row" role="group" aria-label="담장">
          <button type="button" class="seg-btn" id="bHedge">측백담장</button>
          <button type="button" class="seg-btn" id="bFence">옆집담장</button>
        </div>
      </section>
    </aside>
    <section class="stage-wrap">
      <div id="stage" aria-label="주말주택 3D 개념 모형"></div>
    </section>
    <aside class="notes">
      <h2 class="notes-title">설계 메모</h2>
      <div id="noteBody" class="note-body"></div>
    </aside>
  </main>
`;

export const stage = document.querySelector('#stage');
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf7f4ee);

// 집(1층 바닥~지붕) 묶음 그룹 — 선택된 기초 윗면 높이에 맞춰 집 전체를 Y로 통째 이동(말뚝↔매트).
// 집은 말뚝기초 윗면 기준으로 빌드하고, houseGroup.position.y에 (선택 기초 윗면 − 말뚝 윗면)만 준다.
export const houseGroup = new THREE.Group();
scene.add(houseGroup);

export const camera = new THREE.PerspectiveCamera(42, stage.clientWidth / stage.clientHeight, 0.1, 100);
camera.position.set(10.8, 6.8, -8.8);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(stage.clientWidth, stage.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);

export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(4.55, 2.55, 0.65);
controls.maxPolarAngle = Math.PI * 2 / 3;   // 120°(수평 너머 30°까지 올려다봄) — 천장 보기
controls.minDistance = 4;
controls.maxDistance = 32;

// 렌더 캡처(npm run shot:side)에서 시점을 측면으로 직접 잡기 위한 디버그 핸들 — 읽기 전용 용도, 앱 동작엔 영향 없음.
if (typeof window !== 'undefined') window.__cc = { THREE, camera, controls, scene, houseGroup };
