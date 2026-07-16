// 레이아웃 의존 빌더(3b) — 클로저 파생값이 아니라 인자 + import 상수에만 의존하는 것부터 분리.
// 전부 scene.add를 호출하고, main.js가 호출 순서를 그대로 유지하므로 가시성 그룹핑 회귀는 0.
import * as THREE from 'three';
import { scene } from './scene.js';
import { materials } from './materials.js';
import { box, addGeometryEdges, lerpPoint, railCylinder } from './primitives.js';
import {
  buildingW,
  FLOOR_RIM_W, FLOOR_JOIST_H, FLOOR_JOIST_W, FLOOR_JOIST_SPACING,
} from './constants.js';




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

// ── 레이아웃 무클로저 기하 빌더(난간·박공 벽/캡·지붕 슬래브) — 인자 + import 상수만 의존 ──
export function addStairRailingSegment(startBase, endBase, {
  height = 0.95,
  postSpacing = 0.55,
  balusterSpacing = 0.18,
  sideOffset = 0
} = {}) {
  const start = [startBase[0] + sideOffset, startBase[1], startBase[2]];
  const end = [endBase[0] + sideOffset, endBase[1], endBase[2]];
  const horizontalLength = Math.hypot(end[0] - start[0], end[2] - start[2]);
  const postCount = Math.max(2, Math.ceil(horizontalLength / postSpacing) + 1);
  const balusterCount = Math.max(2, Math.ceil(horizontalLength / balusterSpacing) + 1);

  const handStart = [start[0], start[1] + height, start[2]];
  const handEnd = [end[0], end[1] + height, end[2]];
  const midStart = [start[0], start[1] + height * 0.55, start[2]];
  const midEnd = [end[0], end[1] + height * 0.55, end[2]];

  railCylinder(handStart, handEnd, 0.035);
  railCylinder(midStart, midEnd, 0.018);

  for (let i = 0; i < postCount; i += 1) {
    const t = postCount === 1 ? 0 : i / (postCount - 1);
    const base = lerpPoint(start, end, t);
    railCylinder([base[0], base[1], base[2]], [base[0], base[1] + height, base[2]], 0.028);
  }

  for (let i = 1; i < balusterCount - 1; i += 1) {
    const t = i / (balusterCount - 1);
    const base = lerpPoint(start, end, t);
    railCylinder([base[0], base[1] + 0.08, base[2]], [base[0], base[1] + height - 0.08, base[2]], 0.012);
  }
}

export function yzWallPrism({ x, points, thickness = 0.08, mat }) {
  const vertices = [];
  for (const [z, y] of points) vertices.push(x, y, z);
  for (const [z, y] of points) vertices.push(x + thickness, y, z);

  const n = points.length;
  const indices = [];
  for (let i = 1; i < n - 1; i += 1) indices.push(0, i, i + 1);
  for (let i = 1; i < n - 1; i += 1) indices.push(n, n + i + 1, n + i);
  for (let i = 0; i < n; i += 1) {
    const next = (i + 1) % n;
    indices.push(i, next, n + next, i, n + next, n + i);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  const faceIndexCount = (n - 2) * 3;
  geometry.clearGroups();
  geometry.addGroup(0, faceIndexCount * 2, 0);
  geometry.addGroup(faceIndexCount * 2, n * 6, 1);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, [mat, materials.wallSide]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  addGeometryEdges(mesh);
  return mesh;
}

export function gableEndWallThicknessCap({ x0, x1, z0, zMid, z1, y0, y1, mat }) {
  const lift = 0.008;
  const strips = [
    [
      x0, y0 + lift, z0,
      x1, y0 + lift, z0,
      x1, y1 + lift, zMid,
      x0, y1 + lift, zMid
    ],
    [
      x0, y0 + lift, z1,
      x0, y1 + lift, zMid,
      x1, y1 + lift, zMid,
      x1, y0 + lift, z1
    ]
  ];

  for (const strip of strips) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(strip), 3));
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
}

export function slopedWallTopCap({ x, z0, z1, y0, y1, thickness, mat }) {
  const lift = 0.006;
  const vertices = new Float32Array([
    x, y0 + lift, z0,
    x + thickness, y0 + lift, z0,
    x + thickness, y1 + lift, z1,
    x, y1 + lift, z1
  ]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

export function wallEndThicknessFace({ x, z, y, topY, thickness, mat, offset = 0 }) {
  const faceZ = z + offset;
  const vertices = new Float32Array([
    x, y, faceZ,
    x + thickness, y, faceZ,
    x + thickness, topY, faceZ,
    x, topY, faceZ
  ]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

export function roofSlab({ eaveZ, ridgeZ, eaveY, ridgeY, sideOverhang, thickness, mat }) {
  const x0 = -sideOverhang;
  const x1 = buildingW + sideOverhang;
  const vertices = new Float32Array([
    x0, eaveY, eaveZ,
    x1, eaveY, eaveZ,
    x1, ridgeY, ridgeZ,
    x0, ridgeY, ridgeZ,
    x0, eaveY - thickness, eaveZ,
    x1, eaveY - thickness, eaveZ,
    x1, ridgeY - thickness, ridgeZ,
    x0, ridgeY - thickness, ridgeZ
  ]);
  const indices = [
    0, 1, 2, 0, 2, 3,
    4, 6, 5, 4, 7, 6,
    0, 4, 5, 0, 5, 1,
    3, 2, 6, 3, 6, 7,
    0, 3, 7, 0, 7, 4,
    1, 5, 6, 1, 6, 2
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.clearGroups();
  geometry.addGroup(0, 12, 0);
  geometry.addGroup(12, 24, 1);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, [mat, materials.roofEdge]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}
