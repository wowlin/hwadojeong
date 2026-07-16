// fixtures.js — 반복 소품 부품 라이브러리: 캠핑의자·실링팬·직부등·간접조명 (main.js에서 줄 이동).
// 같은 부품은 여기 1벌만 정의하고 s1·s2가 가져다 쓴다(요청 5 — 공통 모듈화의 수집처).
import * as THREE from 'three';
import { scene } from './scene.js';
import { materials } from './materials.js';
import { groundTopY, deckFinishT } from './constants.js';
import { box, addGeometryEdges, fmtDim } from './primitives.js';
import { label } from './labels.js';

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

// 데크 계단 — 데크 상단에서 지면까지 3계단(합성목). 가장자리 한 변을 따라 바깥으로 내려간다.
//  axis: 계단이 늘어선 축('x' 또는 'z'). span0~span1: 그 축 범위. edge: 수직축의 데크 가장자리.
//  outward: 가장자리에서 계단이 뻗는 방향(±1). steps: 계단 수.
export function deckStairs({ axis, span0, span1, edge, outward, steps = 3, topY, baseY = groundTopY, tread = 0.3, frameTopY = null, mat = materials.porcelainDeck }) {
  const rise = (topY - baseY) / steps;              // 3계단 = 3개의 단높이(데크가 맨 위 단)
  const tileT = deckFinishT;                        // 포세린 타일 두께(데크 바닥과 동일)
  for (let i = 0; i < steps - 1; i += 1) {          // 중간 디딤판 steps-1개(맨 위는 데크). i=0: 데크에 가장 가까운 단
    // 데크처럼: 계단틀(디딤바) 윗면 위에 얇은 포세린 타일을 얹는다. frameTopY=틀 디딤바 윗면 높이(주면 타일 모드, 없으면 솔리드 블록).
    const treadFrameTop = frameTopY != null ? frameTopY(i) : null;
    const yBottom = treadFrameTop != null ? treadFrameTop : baseY;          // 타일: 틀 윗면 위 / 솔리드: 지면부터
    const h = treadFrameTop != null ? tileT : (topY - (i + 1) * rise - baseY);
    const pNear = edge + outward * (i * tread);
    const pFar = edge + outward * ((i + 1) * tread);
    const pMin = Math.min(pNear, pFar);
    let step;
    if (axis === 'x') {                              // 계단이 x축으로 늘어섬(전면 계단), 수직축은 z
      step = box({ x: span0, z: pMin, w: span1 - span0, d: tread, y: yBottom, h, mat });
    } else {                                         // axis === 'z'(측면 계단), 수직축은 x
      step = box({ x: pMin, z: span0, w: tread, d: span1 - span0, y: yBottom, h, mat });
    }
    addGeometryEdges(step, 0x4a3724);
  }
}

// 콘센트 1벌(#7) — 벽면 커버 플레이트(+소켓). s1·s2·실내·외부 전 콘센트가 이 한 벌을 쓴다.
// face: 벽에서 실내(또는 바깥)로 돌출하는 방향('+X'|'-X'|'+Z'|'-Z'). kind: 'n' 일반(녹)·'h' 고전력(마젠타)·'i' 인덕션 직결 정션박스(보라·소켓 없음).
export function outlet(x, z, oy, face, kind = 'n') {
  const mC = kind === 'h' ? materials.heatOutlet : kind === 'i' ? materials.inductionOutlet : materials.outlet;   // 커버 플레이트 색
  const mS = kind === 'h' ? materials.heatOutletSocket : materials.outletSocket;                                  // 소켓 면 색
  const socket = kind !== 'i';   // 인덕션 = 직결(콘센트 아님) → 소켓 없는 정션박스 블랭크 커버만
  if (face === '+X') {
    box({ x, z: z - 0.065, w: 0.035, d: 0.13, y: oy, h: 0.15, mat: mC });
    if (socket) box({ x: x + 0.035, z: z - 0.045, w: 0.02, d: 0.09, y: oy + 0.03, h: 0.09, mat: mS });
  } else if (face === '-X') {
    box({ x: x - 0.035, z: z - 0.065, w: 0.035, d: 0.13, y: oy, h: 0.15, mat: mC });
    if (socket) box({ x: x - 0.05, z: z - 0.045, w: 0.02, d: 0.09, y: oy + 0.03, h: 0.09, mat: mS });
  } else if (face === '+Z') {
    box({ x: x - 0.065, z, w: 0.13, d: 0.035, y: oy, h: 0.15, mat: mC });
    if (socket) box({ x: x - 0.045, z: z + 0.035, w: 0.09, d: 0.02, y: oy + 0.03, h: 0.09, mat: mS });
  } else {   // '-Z'
    box({ x: x - 0.065, z: z - 0.035, w: 0.13, d: 0.035, y: oy, h: 0.15, mat: mC });
    if (socket) box({ x: x - 0.045, z: z - 0.05, w: 0.09, d: 0.02, y: oy + 0.03, h: 0.09, mat: mS });
  }
}

// 눈막이(스노우가드) 가로바 1줄(#17) — 가로 파이프바 + 브래킷 8개. 생성한 box 목록을 반환(호출부가 그룹에 push).
export function snowGuardRow(x0, width, z, y) {
  const out = [];
  out.push(box({ x: x0, z: z - 0.025, w: width, d: 0.05, y: y + 0.11, h: 0.05, mat: materials.snowGuard, cast: false }));   // 가로 파이프바
  const n = 7;
  for (let i = 0; i <= n; i += 1) {
    const bx = x0 + width * (i / n);
    out.push(box({ x: bx - 0.02, z: z - 0.02, w: 0.04, d: 0.04, y: y + 0.02, h: 0.11, mat: materials.snowGuard, cast: false }));   // 브래킷
  }
  return out;
}

// 태양광 어레이 1벌(#17) — 모듈 spec(solarSpec)대로 슬로프 위에 격자 배치 + 라벨. 생성 객체 목록 반환.
// surfaceY(z) = 그 z의 지붕 마감 윗면. pitch = 슬로프 경사(라디안). centerX/centerZ = 어레이 중심.
export function solarArray({ spec, surfaceY, centerX, centerZ, pitch }) {
  const out = [];
  const cosS = Math.cos(pitch), sinS = Math.sin(pitch);
  const { panelW, panelL, panelThk, gapX, gapZ, cols, rows } = spec;
  const arrayW = cols * panelW + (cols - 1) * gapX;
  const startX = centerX - arrayW / 2 + panelW / 2;
  const rowStepZ = (panelL + gapZ) * cosS;
  const startZ = centerZ - ((rows - 1) / 2) * rowStepZ;
  const liftN = panelThk / 2 + 0.03;
  const panelGeo = new THREE.BoxGeometry(panelW, panelThk, panelL);
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const px = startX + c * (panelW + gapX), pz = startZ + r * rowStepZ, sy = surfaceY(pz);
      const panel = new THREE.Mesh(panelGeo, materials.solarPanel);
      panel.position.set(px, sy + liftN * cosS, pz + liftN * sinS);
      panel.rotation.x = pitch; panel.castShadow = true; panel.receiveShadow = false;
      scene.add(panel);
      out.push(panel, addGeometryEdges(panel, 0x9aa0a8));
    }
  }
  out.push(label(`태양광 3kW (${spec.cols * spec.rows}장)`, centerX, surfaceY(centerZ) + 0.55, centerZ, 'mep'));   // 3kW = 시스템 공칭 용량(제품 사양)
  return out;
}

// 원목 식탁 1벌(#12) — 윗판+다리4(재질 woodFrame). s1 데크·s2 1층 공용(의자는 campingChair).
export function woodTable({ cx, cz, baseY, w = 0.85, d = 0.72, h = 0.72, top = 0.04, leg = 0.06 }) {
  box({ x: cx - w / 2, z: cz - d / 2, w, d, y: baseY + h - top, h: top, mat: materials.woodFrame });               // 윗판
  for (const lx of [cx - w / 2 + 0.02, cx + w / 2 - 0.02 - leg])
    for (const lz of [cz - d / 2 + 0.02, cz + d / 2 - 0.02 - leg])
      box({ x: lx, z: lz, w: leg, d: leg, y: baseY, h: h - top, mat: materials.woodFrame });                       // 다리 4
}

// 매트리스(+치수 라벨)·베개 1벌(#12) — 다락·s2 게스트룸 공용(재질 mattress/pillow, 두께 0.1 고정).
export function mattressWithLabel({ x, z, w, l, y, text }) {
  box({ x, z, w, d: l, y, h: 0.1, mat: materials.mattress });
  label(text, x + w / 2, y + 0.1 + 0.15, z + l / 2, 'furniture');
}
export function pillowAt(cx, z, y) {
  box({ x: cx - 0.35, z, w: 0.7, d: 0.4, y, h: 0.1, mat: materials.pillow });
}

// 양변기 1벌(#12) — 물탱크(뒤벽 붙임)+본체. (x1, z1) = 안방측 외벽 안쪽면 × 뒤 외벽 안쪽면 코너. s2 2·3층 공용(수직 정렬·오수관 직하).
export function toiletAtBack(x1, z1, fy) {
  box({ x: x1 - 0.64, z: z1 - 0.1, w: 0.44, d: 0.1, y: fy, h: 0.5, mat: materials.toilet });    // 물탱크
  box({ x: x1 - 0.62, z: z1 - 0.55, w: 0.4, d: 0.45, y: fy, h: 0.34, mat: materials.toilet });  // 양변기
}

// 한문형 냉장고 311L 1벌(#12·#18) — 뒤벽(+Z)에 등 붙이고 문이 앞(-Z)으로 열리는 배치(s1 1층 주방·s2 2층 안방 공용).
// (s2 1층 주방 것은 좌벽(X축) 등붙임 배치라 별도 — 축이 달라 통일하지 않음.)
export function fridge311AtBack({ x0, backZ, y }) {
  const rW = 0.545, rD = 0.689, rH = 1.70;                    // 폭(X)·깊이(Z, 앞으로 돌출)·높이 — LG 311L 실제 제원
  const rFrontZ = backZ - rD;                                 // 냉장고 앞면 z(-Z쪽)
  box({ x: x0, z: rFrontZ, w: rW, d: rD, y, h: rH, mat: materials.fridge });   // 본체
  const rdt = 0.02, rfzH = rH * 0.30;                         // 문짝 두께·상부 냉동실 비율(2도어 상부냉동)
  box({ x: x0 + 0.005, z: rFrontZ - rdt, w: rW - 0.01, d: rdt, y: y + rH - rfzH, h: rfzH - 0.01, mat: materials.fridgeDoor });   // 상부 냉동실 문
  box({ x: x0 + 0.005, z: rFrontZ - rdt, w: rW - 0.01, d: rdt, y: y + 0.01, h: rH - rfzH - 0.02, mat: materials.fridgeDoor });   // 하부 냉장실 문
  const rhx = x0 + 0.07;                                      // 손잡이 x(경첩 반대편 低X)
  box({ x: rhx, z: rFrontZ - rdt - 0.03, w: 0.04, d: 0.03, y: y + rH - rfzH - 0.42, h: 0.4, mat: materials.guard });    // 하부 문 손잡이
  box({ x: rhx, z: rFrontZ - rdt - 0.03, w: 0.04, d: 0.03, y: y + rH - rfzH + 0.05, h: 0.28, mat: materials.guard });   // 상부 문 손잡이
  label(`한문형 냉장고 311L · ${fmtDim(rW)}×${fmtDim(rD)}`, x0 + rW / 2, y + rH + 0.15, rFrontZ + rD / 2, 'furniture');
}
