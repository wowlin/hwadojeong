// fixtures.js — 반복 소품 부품 라이브러리: 캠핑의자·실링팬·직부등·간접조명 (main.js에서 줄 이동).
// 같은 부품은 여기 1벌만 정의하고 s1·s2가 가져다 쓴다(요청 5 — 공통 모듈화의 수집처).
import * as THREE from 'three';
import { scene } from './scene.js';
import { materials } from './materials.js';
import { groundTopY } from './constants.js';

// 캠핑 가구 재질 — 반고 햄프턴 DLX 캠핑의자 프레임(책상 의자도 공유)
export const chairFrameMat = new THREE.MeshLambertMaterial({ color: 0x23282f }); // 의자 프레임

// 반고 햄프턴 DLX: 높은 등받이 + 팔걸이 폴딩 캠핑의자. faceAngle은 의자 정면(+z) 방향.
export function campingChair({ cx, cz, faceAngle = 0, color = 0x47535f, baseY = groundTopY }) {
  const group = new THREE.Group();
  const fabric = new THREE.MeshLambertMaterial({ color });
  const add = (w, h, d, x, y, z, mat, rotX = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (rotX) m.rotation.x = rotX;
    m.castShadow = true;
    m.receiveShadow = false;
    group.add(m);
  };
  const seatY = 0.42;
  add(0.52, 0.08, 0.50, 0, seatY, 0, fabric);                         // 좌판
  add(0.52, 0.60, 0.07, 0, seatY + 0.33, -0.23, fabric, -0.16);       // 높은 등받이(리클라인)
  add(0.06, 0.05, 0.46, -0.27, seatY + 0.22, 0.02, chairFrameMat);    // 팔걸이 좌
  add(0.06, 0.05, 0.46, 0.27, seatY + 0.22, 0.02, chairFrameMat);     // 팔걸이 우
  add(0.05, 0.24, 0.05, -0.27, seatY + 0.10, 0.22, chairFrameMat);    // 팔걸이 앞기둥 좌
  add(0.05, 0.24, 0.05, 0.27, seatY + 0.10, 0.22, chairFrameMat);     // 팔걸이 앞기둥 우
  for (const lx of [-0.23, 0.23]) {
    for (const lz of [-0.20, 0.22]) {
      add(0.045, seatY, 0.045, lx, seatY / 2, lz, chairFrameMat);     // 다리
    }
  }
  group.position.set(cx, baseY, cz);
  group.rotation.y = faceAngle;
  scene.add(group);
}

export function ceilingFan({ x, z, ceilingY, bladeCount = 5, bladeLength = 0.62, drop = 0.3 }) {
  const dropY = ceilingY - drop;
  // 천장 마운트
  const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.05, 16), materials.guard);
  mount.position.set(x, ceilingY - 0.025, z);
  mount.castShadow = true;
  mount.receiveShadow = false;
  scene.add(mount);
  // 다운로드(봉)
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, drop, 12), materials.guard);
  rod.position.set(x, ceilingY - drop / 2, z);
  rod.castShadow = true;
  rod.receiveShadow = false;
  scene.add(rod);
  // 모터 허브
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.12, 20), materials.guard);
  hub.position.set(x, dropY, z);
  hub.castShadow = true;
  hub.receiveShadow = false;
  scene.add(hub);
  // 날개
  const bladeY = dropY + 0.015;
  const bladeGeo = new THREE.BoxGeometry(bladeLength, 0.012, 0.16);
  for (let i = 0; i < bladeCount; i += 1) {
    const angle = (i / bladeCount) * Math.PI * 2;
    const reach = bladeLength / 2 + 0.1;
    const blade = new THREE.Mesh(bladeGeo, materials.interiorDoor);
    blade.position.set(x + Math.cos(angle) * reach, bladeY, z + Math.sin(angle) * reach);
    blade.rotation.y = -angle;
    blade.castShadow = true;
    blade.receiveShadow = false;
    scene.add(blade);
  }
}

// 천장 직부등 — 하우징 + 발광 렌즈(썬룸 조명과 동일 규격). drop=0이면 천장면 직부, drop>0이면 줄로 그만큼 내려 매닮.
export function ceilingLight({ x, z, ceilingY, drop = 0 }) {
  const baseY = ceilingY - drop;
  if (drop > 0) {   // 천장에서 늘어뜨리는 줄
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, drop, 8), materials.guard);
    cord.position.set(x, ceilingY - drop / 2, z);
    cord.castShadow = true;
    cord.receiveShadow = false;
    scene.add(cord);
  }
  const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.05, 16), materials.guard);
  housing.position.set(x, baseY - 0.025, z);
  housing.castShadow = false;
  housing.receiveShadow = false;
  scene.add(housing);
  const lensMat = new THREE.MeshLambertMaterial({ color: 0xfff4cf, emissive: 0xffe39c, emissiveIntensity: 0.9 });
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.035, 16), lensMat);
  lens.position.set(x, baseY - 0.06, z);
  lens.castShadow = false;
  lens.receiveShadow = false;
  scene.add(lens);
}

// 벽면 간접조명(코브) — 벽 상단 천장 살짝 아래에 붙는 발광 띠. 천장·벽을 은은히 비춤(직부등 대체).
export function coveLight({ x, z, len, axis = 'z', ceilingY }) {
  const mat = new THREE.MeshLambertMaterial({ color: 0xfff4e8, emissive: 0xffe9ce, emissiveIntensity: 0.9 });
  const w = 0.05, h = 0.05;
  const geo = axis === 'z' ? new THREE.BoxGeometry(w, h, len) : new THREE.BoxGeometry(len, h, w);
  const strip = new THREE.Mesh(geo, mat);
  strip.position.set(x, ceilingY - 0.09, z);
  strip.castShadow = false;
  strip.receiveShadow = false;
  scene.add(strip);
}
