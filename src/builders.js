// 레이아웃 의존 빌더(3b) — 클로저 파생값이 아니라 인자 + import 상수에만 의존하는 것부터 분리.
// 전부 scene.add를 호출하고, main.js가 호출 순서를 그대로 유지하므로 가시성 그룹핑 회귀는 0.
import * as THREE from 'three';
import { scene } from './scene.js';
import { materials } from './materials.js';
import { box } from './primitives.js';
import {
  pileR, pileCapW, pileCapH, groundTopY,
  FLOOR_RIM_W, FLOOR_JOIST_H, FLOOR_JOIST_W, FLOOR_JOIST_SPACING,
} from './constants.js';

export function pileGridCoords(x0, z0, w, d, spacingX, spacingZ) {
  const nx = Math.max(1, Math.round(w / spacingX));
  const nz = Math.max(1, Math.round(d / spacingZ));
  const xs = [];
  const zs = [];
  for (let i = 0; i <= nx; i += 1) xs.push(x0 + (w * i) / nx);
  for (let j = 0; j <= nz; j += 1) zs.push(z0 + (d * j) / nz);
  return { xs, zs };
}

// 말뚝 1본(중심 cx,cz) — 강관(지면~두부) + 검정 두부 헤드 브래킷. 두부 상단 = headTopY(여기에 골조 볼트 체결).
export function systemPile(cx, cz, headTopY, cast = false, headMat = materials.pileHead) {
  const capBotY = headTopY - pileCapH;
  const shaftH = capBotY - groundTopY;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(pileR, pileR, shaftH, 16), materials.pile);
  shaft.position.set(cx, groundTopY + shaftH / 2, cz);
  shaft.castShadow = cast;
  shaft.receiveShadow = false;
  scene.add(shaft);
  box({ x: cx - pileCapW / 2, z: cz - pileCapW / 2, w: pileCapW, d: pileCapW, y: capBotY, h: pileCapH, mat: headMat, cast, receive: false });   // 두부 헤드 브래킷(골조 볼트 체결)
}

// 말뚝 격자(시스템말뚝기초). headTopY = 두부 상단(= 그 위에 스틸 골조/바닥이 직접 얹혀 볼트 체결).
//   xs 지정 시: 등간격 대신 그 X열들(하중 경로=벽·실 중앙)에 말뚝을 박는다.
export function pileFoundation(x0, z0, w, d, headTopY, { spacingX = 1.7, spacingZ = 1.9, cast = false, headMat = materials.pileHead, xs = null } = {}) {
  const grid = pileGridCoords(x0, z0, w, d, spacingX, spacingZ);
  const cols = xs || grid.xs;
  for (const x of cols) for (const z of grid.zs) systemPile(x, z, headTopY, cast, headMat);
}

export function floorFrame(x0, z0, w, d, yBottom, mat, joistXs = null, rim = FLOOR_RIM_W) {
  const x1 = x0 + w, z1 = z0 + d, jh = FLOOR_JOIST_H, jw = FLOOR_JOIST_W;
  box({ x: x0, z: z0, w, d: rim, y: yBottom, h: jh, mat, cast: false, receive: false });        // 앞(−Z) 림장선
  box({ x: x0, z: z1 - rim, w, d: rim, y: yBottom, h: jh, mat, cast: false, receive: false });   // 뒤(+Z) 림장선
  box({ x: x0, z: z0, w: rim, d, y: yBottom, h: jh, mat, cast: false, receive: false });         // 저X측 림장선
  box({ x: x1 - rim, z: z0, w: rim, d, y: yBottom, h: jh, mat, cast: false, receive: false });    // 고X측 림장선
  box({ x: x0, z: z0 + d / 2 - FLOOR_RIM_W / 2, w, d: FLOOR_RIM_W, y: yBottom, h: jh, mat, cast: false, receive: false });  // 중앙 가로보 — 테두리 아님, rim 무관·항상 기본 폭
  if (joistXs) {   // 세로(Z) 장선을 지정 X열(기초말뚝)에만 — 말뚝 안 지나는 등간격 장선 제거
    for (const jx of joistXs) {
      if (jx <= x0 + rim || jx >= x1 - rim) continue;   // 둘레 림장선과 겹치는 단부 열은 제외
      box({ x: jx - jw / 2, z: z0 + rim, w: jw, d: d - 2 * rim, y: yBottom, h: jh, mat, cast: false, receive: false });
    }
  } else if (d <= w) {   // Z가 짧음 → 장선은 Z로 스팬, X 따라 등간격
    const a = x0 + rim, b = x1 - rim, n = Math.max(1, Math.round((b - a) / FLOOR_JOIST_SPACING));
    for (let i = 1; i < n; i += 1) {
      const jx = a + (b - a) * (i / n);
      box({ x: jx - jw / 2, z: z0 + rim, w: jw, d: d - 2 * rim, y: yBottom, h: jh, mat, cast: false, receive: false });
    }
  } else {        // X가 짧음 → 장선은 X로 스팬, Z 따라 등간격
    const a = z0 + rim, b = z1 - rim, n = Math.max(1, Math.round((b - a) / FLOOR_JOIST_SPACING));
    for (let i = 1; i < n; i += 1) {
      const jz = a + (b - a) * (i / n);
      box({ x: x0 + rim, z: jz - jw / 2, w: w - 2 * rim, d: jw, y: yBottom, h: jh, mat, cast: false, receive: false });
    }
  }
}
