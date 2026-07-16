// THREE 셋업 싱글톤 — scene/camera/renderer/controls. import 시 1회 초기화(DOM 셸은 ./ui-shell.js).
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { installShell } from './ui-shell.js';

installShell();   // 버튼·탭·메모 패널 DOM 셸 — ./ui-shell.js(순수 마크업 리프 모듈, 바인딩은 ./ui.js)

export const stage = document.querySelector('#stage');
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf7f4ee);

// 집(1층 바닥~지붕) 묶음 그룹 — 선택된 기초 윗면 높이에 맞춰 집 전체를 Y로 통째 이동(말뚝↔매트).
// 집은 말뚝기초 윗면 기준으로 빌드하고, houseGroup.position.y에 (선택 기초 윗면 − 말뚝 윗면)만 준다.
export const houseGroup = new THREE.Group();
scene.add(houseGroup);

// 조명 — 반구광 + 태양광(그림자). scene 셋업과 함께 1회(main.js에서 이동).
scene.add(new THREE.HemisphereLight(0xffffff, 0xc4b49a, 2.1));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(5, 9, -6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0001;
sun.shadow.normalBias = 0.035;
sun.shadow.camera.left = -10;
sun.shadow.camera.right = 10;
sun.shadow.camera.top = 10;
sun.shadow.camera.bottom = -10;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 24;
scene.add(sun);

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
