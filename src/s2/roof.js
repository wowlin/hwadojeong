// s2/roof.js — s2 지붕(단열 260T+징크 박공·처마·눈막이)·태양광 3kW (main.js S2 구역에서 줄 이동).
import * as THREE from 'three';
import { scene } from '../scene.js';
import { materials } from '../materials.js';
import { box, addGeometryEdges, captureInto } from '../primitives.js';
import { label } from '../labels.js';
import { roofThickness } from '../constants.js';
import {
  s2W, s2X0, s2BackZ, s2FrontZ, roofY, s2RoofPitch, s2RoofSideOver, s2RoofEaveOver,
  s2SnowGuardT, s2Solar, s2RidgeZ, s2RoofUnderY,
} from './constants.js';
import { s2Roof3Objects, s2Solar3Objects } from '../groups.js';

export function buildS2Roof() {
// ── s2 지붕(징크 박공) + 눈막이 + 태양광 — 3층 '지붕'·'태양광' 토글 ──
//   처마=3층 벽 상단(roofY) 밑선. 두께 260mm(단열 260T) + 징크 마감. 처마 앞뒤 1.0m·좌우 0.45m.
{
  const sideOver = s2RoofSideOver, eaveOver = s2RoofEaveOver, thk = roofThickness, zf = 0.05, tan = Math.tan(s2RoofPitch);
  const undEaveY = roofY - tan * eaveOver;            // 처마 끝(내민 1m) 밑선 — 경사 연장
  const undRidgeY = s2RoofUnderY(s2RidgeZ);           // 용마루 밑선(단일 출처)
  const eFront = s2FrontZ - eaveOver, eBack = s2BackZ + eaveOver;   // 앞·뒤 처마 끝 Z
  const topEaveY = undEaveY + thk + zf, topRidgeY = undRidgeY + thk + zf;   // 징크 윗면(처마·용마루)
  // s2 폭(0~s2W) 박공 슬래브 한 면 — roofSlab과 같은 8면체지만 X범위를 s2에 맞춤. 윗면 eaveY..ridgeY, 두께 아래로.
  const s2RoofSlab = (eaveZ, eaveY, ridgeY, thickness, mat) => {
    const x0 = s2X0 - sideOver, x1 = s2W + sideOver, rz = s2RidgeZ;
    const v = new Float32Array([
      x0, eaveY, eaveZ, x1, eaveY, eaveZ, x1, ridgeY, rz, x0, ridgeY, rz,
      x0, eaveY - thickness, eaveZ, x1, eaveY - thickness, eaveZ, x1, ridgeY - thickness, rz, x0, ridgeY - thickness, rz,
    ]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(v, 3));
    g.setIndex([0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1, 3, 2, 6, 3, 6, 7, 0, 3, 7, 0, 7, 4, 1, 5, 6, 1, 6, 2]);
    g.clearGroups(); g.addGroup(0, 12, 0); g.addGroup(12, 24, 1); g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, [mat, materials.roofEdge]);
    mesh.castShadow = true; mesh.receiveShadow = true;
    scene.add(mesh);   // captureInto가 s2Roof3Objects로 자동 수집
    return mesh;
  };
  captureInto(s2Roof3Objects, () => {
    // 단열 260T(밑선=천장) — 앞·뒤 슬로프
    s2RoofSlab(eFront, undEaveY + thk, undRidgeY + thk, thk, materials.roofInsul);
    s2RoofSlab(eBack, undEaveY + thk, undRidgeY + thk, thk, materials.roofInsul);
    // 징크 마감(단열 위)
    s2RoofSlab(eFront, topEaveY, topRidgeY, zf, materials.roof);
    s2RoofSlab(eBack, topEaveY, topRidgeY, zf, materials.roof);
    label('지붕: 단열 260T + 오리지널징크 · 박공 32° · 처마 앞뒤 1.0m·좌우 0.45m', s2W / 2, topRidgeY + 0.45, s2RidgeZ - 1.4, 'struct');
    // 눈막이(스노우가드) 가로바 — 양 슬로프 처마 근처 2줄(쌓인 눈이 한꺼번에 미끄러지지 않게)
    const onTop = (ez, t) => ({ z: ez + t * (s2RidgeZ - ez), y: topEaveY + t * (topRidgeY - topEaveY) });
    const snowGuard = (ez, t) => {
      const p = onTop(ez, t);
      box({ x: s2X0 - sideOver, z: p.z - 0.025, w: s2W + sideOver * 2, d: 0.05, y: p.y + 0.11, h: 0.05, mat: materials.snowGuard, cast: false });   // 가로 파이프바
      const n = 7;
      for (let i = 0; i <= n; i += 1) {
        const bx = s2X0 - sideOver + (s2W + sideOver * 2) * (i / n);
        box({ x: bx - 0.02, z: p.z - 0.02, w: 0.04, d: 0.04, y: p.y + 0.02, h: 0.11, mat: materials.snowGuard, cast: false });   // 브래킷
      }
    };
    for (const t of s2SnowGuardT) { snowGuard(eBack, t); snowGuard(eFront, t); }   // 뒤(남측)·앞(정면) 각 슬로프 s2SnowGuardT.length줄
  });
  // 태양광 3kW — 뒤쪽(남측) 슬로프, 모듈 8장(가로 4 × 세로 2, ≈400W). 지붕 폭 중앙 정렬
  captureInto(s2Solar3Objects, () => {
    const solarMat = materials.solarPanel;
    const cosS = Math.cos(s2RoofPitch), sinS = Math.sin(s2RoofPitch);
    const surfaceY = (z) => topRidgeY - tan * (z - s2RidgeZ);   // 뒤 슬로프(z>용마루) 징크 윗면
    const { panelW, panelL, panelThk, gapX, gapZ, cols, rows } = s2Solar;
    const arrayW = cols * panelW + (cols - 1) * gapX;
    const arrayCenterX = s2W / 2;
    const startX = arrayCenterX - arrayW / 2 + panelW / 2;
    const rowStepZ = (panelL + gapZ) * cosS;
    const arrayCenterZ = 1.9;                  // 용마루~뒤 벽 사이
    const startZ = arrayCenterZ - ((rows - 1) / 2) * rowStepZ;
    const liftN = panelThk / 2 + 0.03;
    const panelGeo = new THREE.BoxGeometry(panelW, panelThk, panelL);
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const px = startX + c * (panelW + gapX), pz = startZ + r * rowStepZ, sy = surfaceY(pz);
        const panel = new THREE.Mesh(panelGeo, solarMat);
        panel.position.set(px, sy + liftN * cosS, pz + liftN * sinS);
        panel.rotation.x = s2RoofPitch; panel.castShadow = true; panel.receiveShadow = false;
        scene.add(panel);   // captureInto가 s2Solar3Objects로 자동 수집
        addGeometryEdges(panel, 0x9aa0a8);
      }
    }
    label('태양광 3kW (8장)', arrayCenterX, surfaceY(arrayCenterZ) + 0.55, arrayCenterZ, 'mep');
  });
}
}
