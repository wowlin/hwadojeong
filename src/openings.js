// openings.js — 벽(개구부)·문·창(미서기/픽스/어닝)·박공벽 헬퍼 (main.js에서 줄 이동).
// 의존: THREE·scene·materials·primitives(box·addGeometryEdges)·builders(경사 캡·마구리)·layout(roofRiseAtZ).
import * as THREE from 'three';
import { scene } from './scene.js';
import { materials } from './materials.js';
import { box, addGeometryEdges } from './primitives.js';
import { slopedWallTopCap, wallEndThicknessFace } from './builders.js';
import { buildingFrontZ, roofRiseAtZ } from './layout.js';
import { buildingD, interiorDoorW, interiorDoorH } from './constants.js';

export function gableLongWallX({ x, z, d, y, baseH, thickness = 0.08, mat }) {
  const x0 = x;
  const x1 = x + thickness;
  const z0 = z;
  const z1 = z + d;
  const ridgeZ = buildingFrontZ + buildingD / 2;
  const topStops = [z0];
  if (ridgeZ > z0 && ridgeZ < z1) topStops.push(ridgeZ);
  topStops.push(z1);

  const profile = [
    [z0, y],
    [z1, y],
    ...topStops.reverse().map((itemZ) => [itemZ, y + baseH + roofRiseAtZ(itemZ)])
  ];
  const vertices = [];
  for (const [itemZ, itemY] of profile) vertices.push(x0, itemY, itemZ);
  for (const [itemZ, itemY] of profile) vertices.push(x1, itemY, itemZ);

  const n = profile.length;
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
  wallEndThicknessFace({
    x,
    z: z0,
    y,
    topY: y + baseH + roofRiseAtZ(z0),
    thickness,
    mat: materials.wallTop,
    offset: -0.006
  });
  wallEndThicknessFace({
    x,
    z: z1,
    y,
    topY: y + baseH + roofRiseAtZ(z1),
    thickness,
    mat: materials.wallTop,
    offset: 0.006
  });

  const capStops = [z0];
  if (ridgeZ > z0 && ridgeZ < z1) capStops.push(ridgeZ);
  capStops.push(z1);
  for (let i = 0; i < capStops.length - 1; i += 1) {
    const startZ = capStops[i];
    const endZ = capStops[i + 1];
    slopedWallTopCap({
      x,
      z0: startZ,
      z1: endZ,
      y0: y + baseH + roofRiseAtZ(startZ),
      y1: y + baseH + roofRiseAtZ(endZ),
      thickness,
      mat: materials.wallTop
    });
  }

  return mesh;
}

export function lowWall(x, z, w, d, y = 0.08, h = 0.7, mat = materials.wall) {
  return box({ x, z, w, d, y, h, mat });
}

export function horizontalWallWithGaps(x, z, w, y, gaps = [], h = 0.7, thickness = 0.08, mat = materials.wall) {
  let cursor = x;
  const sortedGaps = gaps
    .map(([start, end]) => [Math.max(x, start), Math.min(x + w, end)])
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0]);

  for (const [start, end] of sortedGaps) {
    if (start > cursor) lowWall(cursor, z, start - cursor, thickness, y, h, mat);
    cursor = Math.max(cursor, end);
  }
  if (cursor < x + w) lowWall(cursor, z, x + w - cursor, thickness, y, h, mat);
}

export function verticalWallWithGaps(x, z, d, y, gaps = [], h = 0.7, thickness = 0.08, mat = materials.wall) {
  let cursor = z;
  const sortedGaps = gaps
    .map(([start, end]) => [Math.max(z, start), Math.min(z + d, end)])
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0]);

  for (const [start, end] of sortedGaps) {
    if (start > cursor) lowWall(x, cursor, thickness, start - cursor, y, h, mat);
    cursor = Math.max(cursor, end);
  }
  if (cursor < z + d) lowWall(x, cursor, thickness, z + d - cursor, y, h, mat);
}

export function interiorDoorHorizontal(x, z, y, w = interiorDoorW, h = interiorDoorH, mat = materials.interiorDoor) {
  box({ x, z: z - 0.03, w, d: 0.06, y, h, mat });
  box({ x: x + w - 0.18, z: z - 0.06, w: 0.05, d: 0.035, y: y + Math.min(1.02, h * 0.58), h: 0.05, mat: materials.handle });
}

export function pocketDoorHorizontal(x, z, y, w = interiorDoorW, h = interiorDoorH, slideDir = 1, mat = materials.pocketDoor) {
  const pocketW = w;
  const trackX = slideDir > 0 ? x : x - pocketW;
  const panelX = slideDir > 0 ? x + w + 0.04 : x - pocketW + 0.04;
  const panelW = Math.max(0.12, pocketW - 0.08);
  box({ x: trackX, z: z - 0.055, w: w + pocketW, d: 0.03, y: y + h + 0.03, h: 0.035, mat: materials.entryFrame });
  box({ x: panelX, z: z - 0.035, w: panelW, d: 0.045, y, h, mat });
  box({ x: panelX + (slideDir > 0 ? 0.08 : panelW - 0.13), z: z - 0.065, w: 0.05, d: 0.03, y: y + Math.min(0.95, h * 0.5), h: 0.05, mat: materials.handle });
  box({ x, z: z - 0.065, w, d: 0.02, y: y + 0.08, h: 0.035, mat: materials.openingEdge });
}

export function pocketDoorVertical(x, z, y, h = interiorDoorH, slideDir = 1, dw = interiorDoorW, mat = materials.pocketDoor) {
  const pocketD = dw;
  const trackZ = slideDir > 0 ? z : z - pocketD;
  const panelZ = slideDir > 0 ? z + dw + 0.04 : z - pocketD + 0.04;
  const panelD = Math.max(0.12, pocketD - 0.08);
  box({ x: x - 0.055, z: trackZ, w: 0.03, d: dw + pocketD, y: y + h + 0.03, h: 0.035, mat: materials.entryFrame });
  box({ x: x - 0.035, z: panelZ, w: 0.045, d: panelD, y, h, mat });
  box({ x: x - 0.065, z: panelZ + (slideDir > 0 ? 0.08 : panelD - 0.13), w: 0.03, d: 0.05, y: y + Math.min(0.95, h * 0.5), h: 0.05, mat: materials.handle });
  box({ x: x - 0.065, z, w: 0.02, d: dw, y: y + 0.08, h: 0.035, mat: materials.openingEdge });
}

// 측면 외짝 방화문(Z스팬·+X면) — 외짝문을 X↔Z축만 바꿔 옆벽에 세운 것. x = 바깥면(高X), z = 개구 앞 모서리.
export function sideEntryDoor(x, z, outerD, leafD, y, doorH) {
  const frameD = (outerD - leafD) / 2;
  const frameH = doorH + 0.08;
  box({ x: x - 0.12, z, w: 0.12, d: frameD, y, h: frameH, mat: materials.windowFrame });                          // 앞 세로틀
  box({ x: x - 0.12, z: z + outerD - frameD, w: 0.12, d: frameD, y, h: frameH, mat: materials.windowFrame });     // 뒤 세로틀
  box({ x: x - 0.12, z, w: 0.12, d: outerD, y: y + doorH, h: frameH - doorH, mat: materials.windowFrame });       // 상부 인방틀
  box({ x: x - 0.08, z: z + frameD, w: 0.08, d: leafD, y, h: doorH, mat: materials.windowFrame });                // 문짝
  box({ x: x - 0.055, z: z + frameD + leafD - 0.18, w: 0.06, d: 0.06, y: y + 1.02, h: 0.04, mat: materials.handle });   // 실내측 손잡이
}

// 정면 픽스창(X스팬·-Z면) — 미들바 없는 단일 고정 유리. 비개폐(픽스).
export function frontFixSash(x, z, w, sillY, h) {
  const frame = 0.05, glassZ = z - 0.035;
  box({ x, z: z - 0.04, w: frame, d: 0.1, y: sillY, h, mat: materials.windowFrame });                    // 좌 세로틀
  box({ x: x + w - frame, z: z - 0.04, w: frame, d: 0.1, y: sillY, h, mat: materials.windowFrame });      // 우 세로틀
  box({ x, z: z - 0.04, w, d: 0.1, y: sillY, h: frame, mat: materials.windowFrame });                     // 하부틀
  box({ x, z: z - 0.04, w, d: 0.1, y: sillY + h - frame, h: frame, mat: materials.windowFrame });         // 상부틀
  box({ x: x + frame, z: glassZ, w: w - frame * 2, d: 0.04, y: sillY + frame, h: h - frame * 2, mat: materials.glass });   // 단일 유리
}

// 배면(뒤 외벽·+Z면) 미서기 창 — n짝(기본 2짝: 좌고정+우미닫이 / 4짝: 양끝 고정+가운데 2짝 미닫이, 중앙서 열림). 짝을 X로 나눔·유리는 Z면. zc = 유리 중심 Z면
export function rearSlider(x, w, sillY, h, zc, n = 2) {
  const F = materials.windowFrame, trk = 0.03, pw = w / n, mullW = 0.05;
  const slGlass = materials.slidingFixedGlass;   // 고정 짝
  const slMove  = materials.slidingMoveGlass;    // 미닫이 짝
  box({ x, z: zc - 0.06, w, d: 0.12, y: sillY, h: 0.08, mat: F });                     // 하부 레일(전폭)
  box({ x, z: zc - 0.06, w, d: 0.12, y: sillY + h - 0.08, h: 0.08, mat: F });          // 상부 레일
  const pane = (xp, zt, mat) => {
    box({ x: xp, z: zt - 0.025, w: pw, d: 0.05, y: sillY, h, mat, cast: false });                     // 유리
    box({ x: xp, z: zt - 0.035, w: mullW, d: 0.07, y: sillY, h, mat: F, cast: false });               // 좌 세로살
    box({ x: xp + pw - mullW, z: zt - 0.035, w: mullW, d: 0.07, y: sillY, h, mat: F, cast: false });   // 우 세로살
  };
  // 짝 배치 — 2짝: 좌 고정·우 미닫이 / 4짝: 양끝 고정·가운데 2짝 미닫이. 고정=바깥트랙(高Z), 미닫이=안쪽트랙(低Z)
  const isFixed = (i) => (n === 2) ? (i === 0) : (i === 0 || i === n - 1);
  for (let i = 0; i < n; i += 1) {
    const fixed = isFixed(i);
    pane(x + i * pw, zc + (fixed ? trk : -trk), fixed ? slGlass : slMove);
  }
  if (n === 2) {
    box({ x: x + pw + 0.06, z: zc - trk - 0.085, w: 0.045, d: 0.045, y: sillY + 0.26, h: 0.28, mat: materials.handle });     // 미닫이 손잡이
  } else {
    box({ x: x + 2 * pw - 0.105, z: zc - trk - 0.085, w: 0.045, d: 0.045, y: sillY + 0.26, h: 0.28, mat: materials.handle }); // 좌중 미닫이 손잡이(중앙)
    box({ x: x + 2 * pw + 0.06, z: zc - trk - 0.085, w: 0.045, d: 0.045, y: sillY + 0.26, h: 0.28, mat: materials.handle });  // 우중 미닫이 손잡이(중앙)
  }
}

// 옆(좌·우 외벽·±X면) 미서기 창 — 2짝(앞짝 고정 + 뒤짝 미닫이). 짝을 Z로 나눔·유리는 X면. xc = 유리 중심 X면
export function sideRearSlider(z, w, sillY, h, xc) {
  const F = materials.windowFrame, trk = 0.03, pd = w / 2, mullD = 0.05;
  const slGlass = materials.slidingFixedGlass;   // 고정 짝
  const slMove  = materials.slidingMoveGlass;    // 미닫이 짝
  box({ x: xc - 0.06, z, w: 0.12, d: w, y: sillY, h: 0.08, mat: F });                     // 하부 레일(2트랙 전폭)
  box({ x: xc - 0.06, z, w: 0.12, d: w, y: sillY + h - 0.08, h: 0.08, mat: F });          // 상부 레일
  const pane = (zp, xt, mat) => {
    box({ x: xt - 0.025, z: zp, w: 0.05, d: pd, y: sillY, h, mat, cast: false });                     // 유리
    box({ x: xt - 0.035, z: zp, w: 0.07, d: mullD, y: sillY, h, mat: F, cast: false });               // 앞 세로살
    box({ x: xt - 0.035, z: zp + pd - mullD, w: 0.07, d: mullD, y: sillY, h, mat: F, cast: false });   // 뒤 세로살
  };
  pane(z, xc + trk, slGlass);        // 앞짝 고정 — 바깥트랙(低Z)
  pane(z + pd, xc - trk, slMove);    // 뒤짝 미닫이 — 안쪽트랙(高Z)
  box({ x: xc - trk - 0.085, z: z + pd + 0.06, w: 0.045, d: 0.045, y: sillY + 0.26, h: 0.28, mat: materials.handle });   // 미닫이 손잡이
}

// 정면/배면 프로젝트(어닝)창 — X스팬·±Z면. 상부 경첩·하부 바깥으로 밀림. outZ = 외부 방향(+1: 뒤 高Z 바깥, -1: 앞 低Z 바깥)
export function frontAwningSash(x, z, w, sillY, h, outZ) {
  const frame = 0.05, F = materials.windowFrame;
  box({ x, z: z - 0.04, w: frame, d: 0.1, y: sillY, h, mat: F });                    // 좌 세로틀
  box({ x: x + w - frame, z: z - 0.04, w: frame, d: 0.1, y: sillY, h, mat: F });      // 우 세로틀
  box({ x, z: z - 0.04, w, d: 0.1, y: sillY, h: frame, mat: F });                     // 하부틀
  box({ x, z: z - 0.04, w, d: 0.1, y: sillY + h - frame, h: frame, mat: F });         // 상부틀
  // 여는 유리짝 — 상부(경첩) 고정, 하부가 바깥(outZ·Z)으로 젖혀짐. 상단 모서리 기준 X축 회전으로 어닝 개방 표현.
  const a = 0.35, paneW = w - frame * 2, paneH = h - frame * 2, topY = sillY + h - frame, xc = x + w / 2, zc = z - 0.015;
  const pane = new THREE.Mesh(new THREE.BoxGeometry(paneW, paneH, 0.04), materials.glass);
  pane.position.set(xc, topY - Math.cos(a) * paneH / 2, zc + outZ * Math.sin(a) * paneH / 2);
  pane.rotation.x = -outZ * a;
  scene.add(pane);
  box({ x: xc - 0.025, z: (z - 0.04) - outZ * 0.06, w: 0.05, d: 0.04, y: sillY + frame + 0.03, h: 0.14, mat: materials.handle });   // 하부 실내측 손잡이
}

export function sideSash(x, z, d, sillY, h) {
  const frame = 0.05;
  const frameX = x - 0.04;
  const glassX = x - 0.035;
  box({ x: frameX, z, w: 0.1, d: frame, y: sillY, h, mat: materials.windowFrame });
  box({ x: frameX, z: z + d - frame, w: 0.1, d: frame, y: sillY, h, mat: materials.windowFrame });
  box({ x: frameX, z, w: 0.1, d, y: sillY, h: frame, mat: materials.windowFrame });
  box({ x: frameX, z, w: 0.1, d, y: sillY + h - frame, h: frame, mat: materials.windowFrame });
  box({ x: frameX, z: z + d / 2 - frame / 2, w: 0.1, d: frame, y: sillY, h, mat: materials.windowFrame });
  box({ x: glassX, z: z + frame, w: 0.04, d: d - frame * 2, y: sillY + frame, h: h - frame * 2, mat: materials.glass });
}

// 프로젝트(어닝) 시스템창 — Z스팬·+X(안방쪽 高X)면. 상부 경첩·하부 바깥으로 밀어 열림. 창짝을 바깥으로 젖혀 어닝 형태 표현 + 하부 실내측 손잡이.
export function awningSash(x, z, d, sillY, h) {
  const frame = 0.05, frameX = x - 0.04;
  box({ x: frameX, z, w: 0.1, d: frame, y: sillY, h, mat: materials.windowFrame });                  // 앞 세로틀(低Z)
  box({ x: frameX, z: z + d - frame, w: 0.1, d: frame, y: sillY, h, mat: materials.windowFrame });    // 뒤 세로틀(高Z)
  box({ x: frameX, z, w: 0.1, d, y: sillY, h: frame, mat: materials.windowFrame });                   // 하부틀
  box({ x: frameX, z, w: 0.1, d, y: sillY + h - frame, h: frame, mat: materials.windowFrame });       // 상부틀
  // 여는 유리짝 — 상부(경첩) 고정, 하부가 바깥(+X)으로 젖혀짐. 상단 모서리 기준 Z축 회전으로 어닝 개방 표현.
  const a = 0.35, paneH = h - frame * 2, paneD = d - frame * 2, topY = sillY + h - frame, zc = z + d / 2;
  const pane = new THREE.Mesh(new THREE.BoxGeometry(0.04, paneH, paneD), materials.glass);
  pane.position.set(frameX + Math.sin(a) * paneH / 2, topY - Math.cos(a) * paneH / 2, zc);
  pane.rotation.z = a;
  scene.add(pane);
  box({ x: x - 0.12, z: z + frame + 0.02, w: 0.05, d: 0.04, y: sillY + frame + 0.03, h: 0.14, mat: materials.handle });   // 하부 실내측 손잡이(밀어 열기)
}
