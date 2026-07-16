// s1/plan.js — s1 평면: 집·데크 발자국·매트(온통)기초·담장 발자국·평면 치수·모눈 기준선 (main.js에서 줄 이동).
import * as THREE from 'three';
import { materials } from '../materials.js';
import { box, fmtDim, captureInto } from '../primitives.js';
import { planXDim, planYDim, planZDim } from '../labels.js';
import { fenceMat } from '../site.js';
import { buildingW, buildingD, buildingBackZ, groundTopY, matFoundationH, hedgeThickness, lotW, lotD } from '../constants.js';
import { buildingFrontZ, deckFootprints, lotX0, lotX1, lotZ0, lotZ1, planY, planH } from '../layout.js';
import {
  footprintObjects, matFoundationFullObjects, siteBaseObjects,
  dimObjects, hedgeDimObjects, gapDimObjects,
} from '../groups.js';

export function buildPlan() {
// ── 바닥(평면도): 납작한 발자국 + 평면 치수 ───────────────────────────────── (planY·planH는 ./layout.js)
// 기초 발자국(집 + 데크) — 단일 출처(footprintObjects). 모든 화면에 동일 표시.
footprintObjects.push(box({ x: 0, z: buildingFrontZ, w: buildingW, d: buildingD, y: planY, h: planH, mat: materials.foundation, cast: false, name: 'ground' }));
for (const f of deckFootprints) {
  footprintObjects.push(box({ x: f.x, z: f.z, w: f.w, d: f.d, y: planY, h: planH, mat: materials.deckFoundation, cast: false, name: 'ground' }));   // 데크 기초(deckFoundationH) — 청회색으로 집 기초(matFoundationH)와 구분
}
// 매트(온통)기초 — 말뚝기초의 대안. matFoundationH 콘크리트 슬래브. 집+데크 전체.
captureInto(matFoundationFullObjects, () => {
  box({ x: 0, z: buildingFrontZ, w: buildingW, d: buildingD, y: groundTopY, h: matFoundationH, mat: materials.matFoundation });   // 집 매트
  for (const f of deckFootprints) box({ x: f.x, z: f.z, w: f.w, d: f.d, y: groundTopY, h: matFoundationH, mat: materials.matFoundation });   // 데크 매트
  planYDim(-0.1, buildingBackZ + 0.1, groundTopY, groundTopY + matFoundationH, '기초 0.5m');   // 남쪽 모서리(옆집벽·측백벽 만나는 곳 = 낮은 X·뒤 Z) 높이 치수
});
// 독립기초(시스템말뚝) 위치 — 발자국 위에 어두운 점으로 표시(입체 기초 말뚝 격자와 동일 정렬)
// (평면 말뚝 마커·PILE_POS 좌표표 제거 — 말뚝기초 삭제 + 안방 개방 포치 삭제로 남은 참조가 없어짐.)
// 담장 발자국(측백·옆집) — siteBaseObjects(공통, 항상 표시)에 넣어 모든 탭이 공유. 기초 등 다른 토글과 무관하게 바탕에 늘 깔린다.
siteBaseObjects.push(box({ x: lotX0 - 0.2, z: lotZ0, w: 0.2, d: lotD, y: planY, h: planH, mat: fenceMat, cast: false, name: 'ground' }));        // 옆집담장(우측 콘크리트)
siteBaseObjects.push(box({ x: lotX0, z: lotZ1 - hedgeThickness, w: lotW, d: hedgeThickness, y: planY, h: planH, mat: materials.hedge, cast: false, name: 'ground' }));   // 측백(후면)
siteBaseObjects.push(box({ x: lotX1 - hedgeThickness, z: lotZ0, w: hedgeThickness, d: lotD, y: planY, h: planH, mat: materials.hedge, cast: false, name: 'ground' }));   // 측백(좌측)
// 평면 치수 — 가로(buildingW)는 위쪽, 세로(buildingD)는 양쪽, 이격 치수 + 모눈 가이드라인. 바닥+기초 공통(dimObjects).
captureInto(dimObjects, () => {
  const dL = deckFootprints[0];   // 주방 데크 기초(안방 앞 데크 제거됨)
  // 가로 — 위쪽: 기초 buildingW / 안방 측백 0.5 (주방 0.5는 아래쪽으로 이동)
  planXDim(lotZ1 + 0.4, 0, buildingW, `${fmtDim(buildingW)}m`);
  captureInto(hedgeDimObjects, () => planXDim(lotZ1 + 0.4, lotX1 - hedgeThickness, lotX1, `측백 ${fmtDim(hedgeThickness)}m`));   // 안방 측백(좌상단) — 측백담장 토글+배치도
  // 세로 — 안방(왼쪽) 건물 깊이 buildingD / 주방(오른쪽) 뒤 이격 합 1m + 건물 깊이 buildingD + 데크 깊이
  planZDim(lotX1 + 0.35, buildingFrontZ, buildingBackZ, '4.0m');          // 안방 건물 깊이
  captureInto(hedgeDimObjects, () => planZDim(lotX1 + 0.35, lotZ1 - hedgeThickness, lotZ1, `측백 ${fmtDim(hedgeThickness)}m`));   // 뒤(가로) 측백 — 측백담장 토글+배치도
  captureInto(gapDimObjects, () => planZDim(lotX0 - 0.4, buildingBackZ, lotZ1, '1.0m'));   // 뒤 이격 합 1m — 공통(집-담장 이격)
  planZDim(lotX0 - 0.4, buildingFrontZ, buildingBackZ, '4.0m');          // 주방 건물 깊이
  planZDim(lotX0 - 0.4, dL.z, buildingFrontZ, `${fmtDim(dL.d)}m`);   // 주방 데크 깊이(오른쪽 가장자리)
  // 아래쪽 가장자리: 주방 데크 폭 / 주방 이격 분할
  planXDim(dL.z - 0.45, 0, dL.x + dL.w, `${fmtDim(dL.w)}m`);        // 주방 데크 폭
  captureInto(gapDimObjects, () => planXDim(dL.z - 0.45, lotX0, 0, '0.5m'));   // 주방 이격 0.5 — 공통(집-담장 이격)
  // 모눈 가이드라인 — 각 치수 끝점(X/Z)을 지나 전체로 얇게(드래프팅 보조선처럼)
  const gridMat = new THREE.MeshBasicMaterial({ color: 0x5b7185 });   // 회청색 보조선(무광 — 조명 영향 없이 또렷)
  const gw = 0.02, gy = 0.009, gh = 0.002;   // 기준선 — 바닥에 붙임(색면 위 1mm), 두께 2mm
  const gz0 = lotZ0 - 0.6, gz1 = lotZ1 + 0.6, gx0 = lotX0 - 0.6, gx1 = lotX1 + 0.6;
  const vGuide = (x) => box({ x: x - gw / 2, z: gz0, w: gw, d: gz1 - gz0, y: gy, h: gh, mat: gridMat, cast: false, name: 'ground' });   // 세로 보조선
  const hGuide = (z) => box({ x: gx0, z: z - gw / 2, w: gx1 - gx0, d: gw, y: gy, h: gh, mat: gridMat, cast: false, name: 'ground' });   // 가로 보조선
  // 측백·이격 치수의 기준선 — 공통(모든 탭). 끝점: X=대지 좌/우·주방0 / Z=집 뒤벽·대지 뒤.
  captureInto(gapDimObjects, () => {
    for (const x of [lotX0, 0, lotX1]) vGuide(x);
    for (const z of [buildingBackZ, lotZ1]) hGuide(z);
  });
  // 집·데크 크기 치수의 기준선 — 현재 탭(s1)만. (dL.x+dL.w = 주방 데크 안방쪽 끝)
  for (const x of [dL.x + dL.w, buildingW]) vGuide(x);
  for (const z of [dL.z, buildingFrontZ]) hGuide(z);
});
}
