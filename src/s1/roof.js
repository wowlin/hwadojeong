// s1/roof.js — 지붕(단열 260T+징크)·경사 라벨·눈막이·홈통·우수관 + 태양광 3kW (main.js에서 줄 이동).
import * as THREE from 'three';
import { scene } from '../scene.js';
import { materials } from '../materials.js';
import { box, addGeometryEdges } from '../primitives.js';
import { label } from '../labels.js';
import { roofSlab } from '../builders.js';
import {
  buildingW, buildingD, buildingBackZ, groundTopY, roofThickness, roofSlopeDeg,
  secondFloorThickness, secondWallHeight,
} from '../constants.js';
import { buildingFrontZ, secondY, roofSlopeTan, gableRise, atticSecondWallTop, atticRidgeZ } from '../layout.js';
import { roofObjects, solarObjects } from '../groups.js';

export function buildRoof() {
{
  const roofSideOverhang = 0.4;
  const roofEaveOverhang = 0.6;
  const secondWallTop = secondY + secondFloorThickness + secondWallHeight;
  // 지붕 밑면(roofSlab는 eaveY/ridgeY가 윗면)이 다락 벽 윗면(secondWallTop)에 얹히도록 두께(roofThickness)만큼 올림
  const ridgeY = secondWallTop + gableRise + roofThickness;
  const outerEaveY = secondWallTop - roofSlopeTan * roofEaveOverhang + roofThickness;
  const ridgeZ = buildingFrontZ + buildingD / 2;
  // 다락 위 지붕 구성: 단열 260T(다락 천장 단열층) + 그 위 징크 마감 — 재질(roofInsul)은 materials.js 정의부.
  const zincFin = 0.05;   // 징크 마감 두께
  const eaveZF = buildingFrontZ - roofEaveOverhang;
  const eaveZB = buildingBackZ + roofEaveOverhang;
  roofObjects.push(
    // 단열재 260T
    roofSlab({ eaveZ: eaveZF, ridgeZ, eaveY: outerEaveY, ridgeY, sideOverhang: roofSideOverhang, thickness: roofThickness, mat: materials.roofInsul }),
    roofSlab({ eaveZ: eaveZB, ridgeZ, eaveY: outerEaveY, ridgeY, sideOverhang: roofSideOverhang, thickness: roofThickness, mat: materials.roofInsul }),
    // 징크 마감(단열 위)
    roofSlab({ eaveZ: eaveZF, ridgeZ, eaveY: outerEaveY + zincFin, ridgeY: ridgeY + zincFin, sideOverhang: roofSideOverhang, thickness: zincFin, mat: materials.roof }),
    roofSlab({ eaveZ: eaveZB, ridgeZ, eaveY: outerEaveY + zincFin, ridgeY: ridgeY + zincFin, sideOverhang: roofSideOverhang, thickness: zincFin, mat: materials.roof })
  );
  // 지붕 경사 각도 표기 — 전면 경사면 중턱 위에 띄움(+지붕 뷰에서만)
  const eaveZ = buildingFrontZ - roofEaveOverhang;
  const slopeMidZ = (eaveZ + ridgeZ) / 2;
  const slopeMidY = (outerEaveY + ridgeY) / 2;
  roofObjects.push(label('지붕: 단열 260T + 오리지널징크(티타늄아연, 갈바륨 아님) · 경사 33°', buildingW / 2, slopeMidY + 0.55, slopeMidZ, 'struct'));
  // 태양광 패널은 뒤쪽(남측) 지붕 별도 블록에서 그림 — 여기선 눈막이용 헬퍼만 둠(재질 snowGuard는 materials.js).
  const backEaveZ = buildingBackZ + roofEaveOverhang;
  const onSlope = (ez, t) => ({ z: ez + t * (ridgeZ - ez), y: outerEaveY + t * (ridgeY - outerEaveY) });   // t=0 처마 → 1 용마루

  // ── 눈막이(스노우가드) 가로바 — 처마 근처, 양 슬로프 각 2줄(쌓인 눈이 한꺼번에 미끄러지지 않게) ──
  const snowGuard = (ez, t) => {
    const p = onSlope(ez, t);
    roofObjects.push(box({ x: -roofSideOverhang, z: p.z - 0.025, w: buildingW + roofSideOverhang * 2, d: 0.05, y: p.y + 0.11, h: 0.05, mat: materials.snowGuard, cast: false }));   // 가로 파이프바
    const n = 7;
    for (let i = 0; i <= n; i += 1) {
      const bx = -roofSideOverhang + (buildingW + roofSideOverhang * 2) * (i / n);
      roofObjects.push(box({ x: bx - 0.02, z: p.z - 0.02, w: 0.04, d: 0.04, y: p.y + 0.02, h: 0.11, mat: materials.snowGuard, cast: false }));   // 브래킷
    }
  };
  snowGuard(backEaveZ, 0.12); snowGuard(backEaveZ, 0.22);   // 남측(집 뒤) — 태양광 아래(z≈3.1) ~ 처마쪽
  snowGuard(eaveZ, 0.12); snowGuard(eaveZ, 0.22);           // 북측(정면) — 처마쪽 2줄

  // ── 처마 물받이(홈통) + 도로측(고-X) 우수관 ── (재질 gutter는 materials.js)
  const eaveTopY = outerEaveY + zincFin;
  [eaveZ, backEaveZ].forEach((ez) => {
    const out = ez < ridgeZ ? -1 : 1;            // 처마 바깥 방향(Z)
    const gz = ez + out * 0.06;
    const gutterY = eaveTopY - 0.17;
    roofObjects.push(box({ x: -roofSideOverhang - 0.05, z: gz - 0.065, w: buildingW + roofSideOverhang * 2 + 0.1, d: 0.13, y: gutterY, h: 0.12, mat: materials.gutter, cast: false }));   // 처마홈통(가로)
    // 우수관: 고-X(도로측) 벽 모서리를 타고 수직으로. 처마홈통 → 벽 모서리 연결관 → 지면까지.
    const cornerZ = ez < ridgeZ ? buildingFrontZ : buildingBackZ;   // 고-X 벽의 앞/뒤 모서리
    const dx = buildingW + 0.04;                                    // 고-X 벽 바깥면(buildingW+0.04)
    roofObjects.push(box({ x: dx, z: Math.min(gz, cornerZ) - 0.04, w: 0.08, d: Math.abs(cornerZ - gz) + 0.08, y: gutterY - 0.05, h: 0.08, mat: materials.gutter, cast: false }));   // 처마→벽모서리 연결관
    roofObjects.push(box({ x: dx, z: cornerZ - 0.04, w: 0.08, d: 0.08, y: groundTopY, h: (gutterY - 0.03) - groundTopY, mat: materials.gutter, cast: false }));   // 수직 우수관(벽 모서리)
  });
  roofObjects.push(label('우수관(도로측 벽 모서리)', buildingW + 0.5, 1.9, buildingBackZ, 'mep'));
}}

// 뒤쪽(남측) 지붕 태양광 — 다락 지붕 마감 위 실물 모듈 배열. scene 순서 보존을 위해 s2 구획 뒤에서 호출.
export function buildRoofSolar() {
const atticRidgeY = atticSecondWallTop + gableRise;
// (다락 계단실 상부 실링팬 삭제)

// 뒤쪽(남측) 지붕에 태양광 3kW — 실물 모듈 8장(2열×4, 1.66×1.0m 가로형 ≈400W), 지붕 폭 중앙 정렬
{
  const solarMat = new THREE.MeshLambertMaterial({ color: 0x16264a });
  const roofSlopeRad = THREE.MathUtils.degToRad(roofSlopeDeg);
  const cosS = Math.cos(roofSlopeRad);
  const sinS = Math.sin(roofSlopeRad);
  const surfaceY = (z) => (atticRidgeY + roofThickness) - roofSlopeTan * (z - atticRidgeZ);   // 지붕 마감 윗면 = 구조 밑면(atticRidgeY) + 지붕두께 — 패널이 지붕 위에 얹히게
  const panelW = 1.66;   // X 폭(실물 모듈 가로)
  const panelL = 1.0;    // 경사 방향 길이
  const panelThk = 0.05;
  const gapX = 0.04;
  const gapZ = 0.04;
  const cols = 4;
  const rows = 2;        // 4 x 2 = 8장 × 약 400W ≈ 3.2kW
  const arrayW = cols * panelW + (cols - 1) * gapX;
  const arrayCenterX = buildingW / 2;   // 지붕 폭 중앙
  const startX = arrayCenterX - arrayW / 2 + panelW / 2;
  const rowStepZ = (panelL + gapZ) * cosS;
  const arrayCenterZ = 2.25;            // 용마루 아래~뒤 벽선 사이
  const startZ = arrayCenterZ - ((rows - 1) / 2) * rowStepZ;
  const liftN = panelThk / 2 + 0.03;
  const panelGeo = new THREE.BoxGeometry(panelW, panelThk, panelL);
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const px = startX + c * (panelW + gapX);
      const pz = startZ + r * rowStepZ;
      const sy = surfaceY(pz);
      const panel = new THREE.Mesh(panelGeo, solarMat);
      panel.position.set(px, sy + liftN * cosS, pz + liftN * sinS);
      panel.rotation.x = roofSlopeRad;
      panel.castShadow = true;
      panel.receiveShadow = false;
      scene.add(panel);
      solarObjects.push(panel);
      solarObjects.push(addGeometryEdges(panel, 0x9aa0a8));
    }
  }
  solarObjects.push(label('태양광 3kW (8장)', arrayCenterX, surfaceY(arrayCenterZ) + 0.55, arrayCenterZ, 'mep'));
}
}
