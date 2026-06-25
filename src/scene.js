// THREE 셋업 싱글톤 — DOM 셸(버튼 패널) + scene/camera/renderer/controls. import 시 1회 초기화.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const app = document.querySelector('#app');
app.innerHTML = `
  <main class="shell">
    <section class="stage-wrap">
      <div id="stage" aria-label="주말주택 3D 개념 모형"></div>
    </section>
    <aside class="panel">
      <div class="controls">
        <!-- 검토된 시공 단계(누적): 배치도 › 기초 › 바닥틀 › 바닥 › 1층 › 다락 › 지붕 -->
        <button id="viewPlan" type="button">배치도</button>
        <button id="viewFoundation" type="button">기초<span class="btn-sub">KC금강컨테이너</span><span class="btn-sub btn-sub-xs">시스템말뚝기초 주택용</span></button>
        <button id="toggleFrame" type="button">바닥틀</button>
        <button id="stageFloor" type="button">바닥</button>
        <button id="stageFirst" type="button">1층</button>
        <button id="stageStair" type="button">계단</button>
        <button id="stageAttic" type="button">다락</button>
        <button id="stageRoof" type="button">지붕</button>
        <!-- 미검토(참고용) — 검토되는대로 하나씩 삭제 예정 -->
        <button id="viewFirst" type="button" class="unreviewed">+1층</button>
        <button id="viewSecond" type="button" class="unreviewed">+다락</button>
        <button id="viewAll" type="button" class="unreviewed">+지붕<span class="btn-sub">태연남(태양광)</span><span class="btn-sub btn-sub-xs">010-4567-2450</span></button>
        <button id="toggleDeck" type="button" class="toggle unreviewed">데크<span class="btn-sub">포세린</span><span class="btn-sub btn-sub-xs">1644-6472</span></button>
        <button id="toggle썬룸" type="button" class="toggle unreviewed">썬룸</button>
        <button id="toggleWall" type="button" class="toggle unreviewed">외벽<span class="btn-sub">주식회사 단우</span><span class="btn-sub btn-sub-xs">1811-8179</span><span class="btn-sub btn-sub-xs">010-5382-8179</span></button>
        <button id="toggleFolding" type="button" class="toggle unreviewed">폴딩도어<span class="btn-sub">JJ시스템</span><span class="btn-sub btn-sub-xs">1899-9043</span></button>
        <button id="toggleAccessory" type="button" class="toggle unreviewed">악세사리</button>
        <button id="toggleOutlet" type="button" class="toggle unreviewed">콘센트</button>
        <button id="toggleHedge" type="button" class="toggle unreviewed">측백담장<span class="btn-sub">뒤·좌 생울타리</span></button>
        <button id="toggleFence" type="button" class="toggle unreviewed">옆집담장<span class="btn-sub">우측 경계벽</span></button>
      </div>
    </aside>
  </main>
`;

export const stage = document.querySelector('#stage');
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf7f4ee);

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
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 4;
controls.maxDistance = 32;

// 렌더 캡처(npm run shot:side)에서 시점을 측면으로 직접 잡기 위한 디버그 핸들 — 읽기 전용 용도, 앱 동작엔 영향 없음.
if (typeof window !== 'undefined') window.__cc = { THREE, camera, controls };
