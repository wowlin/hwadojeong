// site.js — 대지(부지)·도로·측백담장·옆집담장 (main.js에서 줄 이동).
// fenceMat·fenceH·hedgeH는 담장 발자국(s1 평면)·설계 메모가 공유하는 단일 출처.
import * as THREE from 'three';
import { materials } from './materials.js';
import { box } from './primitives.js';
import { lotX0, lotX1, lotZ0, lotZ1 } from './layout.js';
import { lotW, lotD, roadW, groundTopY, hedgeThickness } from './constants.js';
import { siteBaseObjects, fenceObjects, hedgeObjects } from './groups.js';

export const fenceMat = new THREE.MeshLambertMaterial({ color: 0xb0a692 });
export const fenceH = 1.1;   // 옆집담장 높이 — 그리기·메모 단일 출처
export const hedgeH = 1.5;   // 측백담장(생울타리) 높이 — 그리기·메모 단일 출처

export function buildSite() {
// 부지(흙색 지면): 집 너비 방향(X) 9.95m × 정면 방향(Z) 9m. 집을 X로 중앙 배치, 뒤로 1m 여유.
// siteBaseObjects는 ./groups.js에 정의됨(여기선 빌더가 push만).
siteBaseObjects.push(box({ x: lotX0, z: lotZ0, w: lotW, d: lotD, h: 0.002, mat: materials.site, cast: false, name: 'ground' }));   // 평면(높이 0 취급) — 깜빡임만 막는 2mm
// 도로(접도) — 부지 바깥. 우측면 + 후면 ㄱ자.
siteBaseObjects.push(box({ x: lotX1, z: lotZ0, w: roadW, d: lotD, h: 0.002, mat: materials.road, cast: false, name: 'ground' }));          // 우측 도로(부지 밖)
siteBaseObjects.push(box({ x: lotX0, z: lotZ1, w: lotW + roadW, d: roadW, h: 0.002, mat: materials.road, cast: false, name: 'ground' }));   // 후면 도로(부지 밖, 모서리 연결)

// 경계 — 측백담장(측백 생울타리)·옆집담장(우측 콘크리트) 두 토글로 분리.
// 옆집담장(경계벽) — 대지 오른쪽(주방 쪽, 낮은 X) 바깥. 폭 0.2m × 높이 fenceH, 경계선 전체 길이.
fenceObjects.push(box({ x: lotX0 - 0.2, z: lotZ0, w: 0.2, d: lotD, y: groundTopY, h: fenceH, mat: fenceMat, name: 'ground' }));
// 측백나무 생울타리(상록) — 뒤쪽 + 왼쪽(안방 쪽, 높은 X) 경계 안쪽 50cm.
hedgeObjects.push(box({ x: lotX0, z: lotZ1 - hedgeThickness, w: lotW, d: hedgeThickness, y: groundTopY, h: hedgeH, mat: materials.hedge, name: 'ground' }));   // 후면 생울타리
hedgeObjects.push(box({ x: lotX1 - hedgeThickness, z: lotZ0, w: hedgeThickness, d: lotD, y: groundTopY, h: hedgeH, mat: materials.hedge, name: 'ground' }));   // 왼쪽(안방) 생울타리
}
