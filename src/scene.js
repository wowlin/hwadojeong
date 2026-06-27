// THREE 셋업 싱글톤 — DOM 셸(버튼 패널) + scene/camera/renderer/controls. import 시 1회 초기화.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const app = document.querySelector('#app');
app.innerHTML = `
  <main class="shell">
    <aside class="sidebar">
      <section class="menu-group">
        <h2 class="menu-title">기초</h2>
        <button id="vPlan" type="button" class="view-btn">배치도 (부감)</button>
        <label class="chk"><input id="cFoundation" type="checkbox"><span>기초</span></label>
        <label class="chk"><input id="cFrame" type="checkbox"><span>바닥틀</span></label>
        <label class="chk"><input id="cFloor" type="checkbox"><span>바닥</span></label>
        <label class="chk"><input id="cHedge" type="checkbox"><span>측백담장</span></label>
        <label class="chk"><input id="cFence" type="checkbox"><span>옆집담장</span></label>
      </section>
      <section class="menu-group">
        <h2 class="menu-title">1층</h2>
        <label class="chk"><input id="cStair" type="checkbox"><span>계단</span></label>
        <label class="chk"><input id="cLivingWall" type="checkbox"><span>거실측 벽</span></label>
        <label class="chk"><input id="cFamilyWall" type="checkbox"><span>안방 내력벽</span></label>
        <label class="chk"><input id="cExtWall" type="checkbox"><span>1층 외벽</span></label>
        <label class="chk"><input id="cFirstRoom" type="checkbox"><span>1층 골조·실내</span></label>
        <label class="chk"><input id="cAnno" type="checkbox"><span>방·치수 도면</span></label>
        <label class="chk"><input id="cOutlet" type="checkbox"><span>콘센트</span></label>
      </section>
      <section class="menu-group">
        <h2 class="menu-title">화장실</h2>
        <label class="chk"><input id="cBath" type="checkbox"><span>계단하부 WC</span></label>
      </section>
      <section class="menu-group">
        <h2 class="menu-title">다락</h2>
        <label class="chk"><input id="cLoft" type="checkbox"><span>다락 바닥</span></label>
        <label class="chk"><input id="cRoof" type="checkbox"><span>지붕</span></label>
      </section>
      <section class="menu-group">
        <h2 class="menu-title">썬룸</h2>
        <label class="chk"><input id="cDeck" type="checkbox"><span>데크</span></label>
        <label class="chk"><input id="cSun" type="checkbox"><span>썬룸</span></label>
        <label class="chk"><input id="cSunWall" type="checkbox"><span>외벽</span></label>
        <label class="chk"><input id="cFolding" type="checkbox"><span>폴딩도어</span></label>
        <label class="chk"><input id="cAccessory" type="checkbox"><span>악세사리</span></label>
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
