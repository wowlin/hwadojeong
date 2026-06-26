// primitives.js — 무(無)레이아웃 기하 프리미티브 헬퍼.
// 의존: THREE, scene(싱글톤)만. 레이아웃 파생값·materials·constants 무참조 → 순수 이동(3a).
import * as THREE from 'three';
import { scene } from './scene.js';
import { materials } from './materials.js';

export function box({ x, z, w, d, h = 0.08, y = 0, mat, name, cast = true, receive = true }) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x + w / 2, y + h / 2, z + d / 2);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  mesh.name = name || '';
  scene.add(mesh);
  return mesh;
}

export function addGeometryEdges(mesh, color = 0x6f6254) {
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry, 20),
    new THREE.LineBasicMaterial({ color })
  );
  // 외곽선은 mesh의 자식으로 붙인다 — 부모 가시성(단계/그룹 토글)을 그대로 상속.
  // (예전엔 scene에 따로 추가돼 그룹 토글을 무시하고 모든 단계에 누출됐다 — 부채꼴 호 버그.)
  mesh.add(edges);
  return edges;
}

export function lerpPoint(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  ];
}

export function flatPoly({ points, y, h = 0.08, mat, name, cast = true, receive = true }) {
  const vertices = [];
  for (const [x, z] of points) vertices.push(x, y, z);
  for (const [x, z] of points) vertices.push(x, y + h, z);
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
  geometry.computeVertexNormals();
  // 폴리곤마다 점 순서(시계/반시계)가 섞여 윗면·옆면이 뒷면 컬링으로 사라지는 것 방지 → 양면 렌더
  const dmat = mat.clone();
  dmat.side = THREE.DoubleSide;
  const mesh = new THREE.Mesh(geometry, dmat);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  mesh.name = name || '';
  scene.add(mesh);
  return mesh;
}

// 치수 숫자 포맷 — 기본 소수점 1자리(4→4.0), 필요시 2~3자리(불필요한 끝 0은 제거). 'm'은 호출부에서.
export function fmtDim(v) {
  const s = Number(v).toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  return s.includes('.') ? s : `${s}.0`;
}

export function stairWallTopCap({ x, z, w, d, topY }) {
  return box({
    x,
    z,
    w,
    d,
    y: topY,
    h: 0.018,
    mat: materials.wallTop,
    cast: false,
    receive: true
  });
}

export function railCylinder(start, end, radius = 0.035, cast = false) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const direction = new THREE.Vector3().subVectors(b, a);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 10);
  const mesh = new THREE.Mesh(geometry, materials.guard);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = cast;
  mesh.receiveShadow = false;
  scene.add(mesh);
  return mesh;
}
