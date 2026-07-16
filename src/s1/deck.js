// s1/deck.js — 주방 앞 썬룸(포치 골조·폴딩도어·데크 바닥·가구·단물매 지붕)·데크 발자국·
// 데크 계단틀·화목난로 착탈 카세트 (main.js에서 줄 이동 — 난로·계단틀은 옛 S2 배너 안에 있던 s1 부재, 구역 위반 G 해소).
import * as THREE from 'three';
import { scene } from '../scene.js';
import { materials } from '../materials.js';
import { box, addGeometryEdges, fmtDim } from '../primitives.js';
import { label } from '../labels.js';
import { campingChair, ceilingFan, ceilingLight } from '../fixtures.js';
import { buildingW, deckW, deckD, groundTopY, matFoundationH, deckFinishT } from '../constants.js';
import { buildingFrontZ, firstFloorY, deckSurfaceY, deckFootprints } from '../layout.js';
import {
  deckFloorObjects, deckObjects, foldingObjects, extrasObjects,
  썬룸RoofObjects, 썬룸FrameObjects, deckStairFrameObjects,
} from '../groups.js';

export let deckRoofBcrArea;   // 포치(데크 지붕) 건축면적 — buildDeck()에서 산출, 설계 메모(대지 개요)가 읽음

export const s1DeckFurn = {};   // 데크 가구 실측값을 설계메모로 노출(단일 출처) — 썬룸(withFurniture)에서 채움

// 1층 주방 앞 썬룸 — 지붕 길이(전면 돌출) 4m. 지붕 = 오리지널징크(불투명).
//  · 데크 상단(집 바닥 높이)에서 시작, 앞단(최저) 기둥, 건물쪽은 1층 높이에 부착
//  · 프레임/기둥은 지붕 가장자리에서 20cm 안쪽(3면 세로벽이 이 선에 설치)
//  roofLowX/roofW로 X 범위를 지정해 주방 앞·안방 앞에 같은 형식으로 각각 설치한다.
function 썬룸({ roofLowX, roofW, withFurniture = true, nDeckTables = 3, withWalls = true, deckDepth = null, connectRightX = null, withFlatFrame = true, withDeck = true }) {
  const frameInset = 0.2;                      // 가장자리에서 20cm 안쪽
  const beamH = 0.12;
  const beamDrop = 0.04;
  const wallZ = buildingFrontZ;
  const roofSlopeLength = 4.0;                     // 지붕 경사면 길이(실제 지붕면)
  const targetFrontPostH = 2.6;                     // 앞단(최저) 기둥 높이 목표(데크 상단 기준)
  const targetWallPostH = 2.8;                      // 집 벽쪽(건물 부착부) 높이 목표(데크 상단 기준)
  const yAtWall = firstFloorY + targetWallPostH + beamDrop + beamH;  // 건물 부착 높이 = 데크 + 벽쪽높이 + 보
  // 앞단 보 밑면 = 데크 상단 + 기둥높이가 되도록 앞단 지붕높이(yAtFront)를 역산(반복 수렴).
  const targetGlassAtFront = firstFloorY + targetFrontPostH + beamDrop + beamH;
  let yAtFront = targetGlassAtFront;
  for (let i = 0; i < 40; i += 1) {
    const d = yAtWall - yAtFront;
    const run = Math.sqrt(roofSlopeLength * roofSlopeLength - d * d);
    yAtFront = targetGlassAtFront - frameInset * d / run;
  }
  const roofDrop = yAtWall - yAtFront;             // 물매 낙차
  const roofRun = Math.sqrt(roofSlopeLength * roofSlopeLength - roofDrop * roofDrop); // 수평투영 길이(물매 반영)
  const frontZ = wallZ - roofRun;                  // 앞단은 수평투영 거리만큼만 나감
  const roofHighX = roofLowX + roofW;
  const 썬룸Frame = materials.entryFrame;

  // 가시성 그룹 분류용: 이 함수가 scene에 추가하는 모든 객체를 기록해 두고,
  // 데크 바닥/소품(가구)만 따로 표시한 뒤 나머지는 썬룸 구조물로 분류한다.
  const _addStart = scene.children.length;
  const deckLocal = [];      // 데크 바닥·바닥 치수 라벨
  const floorLocal = [];     // 포세린 바닥 → deckFloorObjects('데크 바닥' 토글에서 표시)
  const foldingLocal = [];   // 주방 데크 3면 폴딩도어 — 외벽 대안(상호배타)
  const extrasLocal = [];    // 캠핑 가구(의자 등)
  const roofLocal = [];      // 포치 징크 지붕(경사 단물매) — '지붕' 토글

  // 프레임(지붕 가장자리 20cm 안쪽): 벽측 보 + 앞단 보 + 양측 경사 보
  const fX0 = roofLowX + frameInset;            // = -0.2 (오른쪽 벽선 바깥)
  const fX1 = roofHighX - frameInset;
  const fFrontZ = frontZ + frameInset;
  const fWallZ = wallZ;                          // 벽측은 건물에 부착
  // 데크 기둥 clamp·발자국 기준(반단면)
  const postW = 0.12;
  const deckEdge = postW / 2;
  // 데크 식탁 배치 기준(단일 출처) — nDeckTables만 바꾸면 데크가 딱 그만큼 高X로 늘고 줆.
  const dTW = 0.85, dTD = 0.72, dReserveW = 1.2;                        // 식탁 윗판 폭·깊이 · 난로 예약 폭
  const dOff = dTD / 2 + 0.30, dChairBack = dOff + 0.33, dAisle = 0.9, dEndGap = 0.7;   // 의자 중심·등받이 뒤끝·앞뒤통로(dAisle, s2 1층 동일) · 좌우통로(dEndGap, 데크 폭 안방쪽 맞춤)
  const deckExtraW = withFurniture ? Math.max(0, (fX0 + dReserveW) + nDeckTables * dTW + 2 * dEndGap - fX1) : 0;   // 식탁행+통로가 넘치는 만큼만 데크 高X 확장
  const dX0 = (connectRightX != null) ? connectRightX : fX0 - deckEdge;
  const dX1 = fX1 + deckExtraW;                  // 데크 高X 끝(안방쪽)
  const dWallZ = fWallZ;
  const dFrontZ = (deckDepth != null) ? dWallZ - deckDepth : fFrontZ - deckEdge;

  // ── 포치 프레임(각관 골조) — 기초(데크) 사각형에 맞춤. 네 꼭지점만 기둥, 중간기둥 없음. ──
  // 앞(低Z)은 2.4m 폴딩도어가 들어가는 직육면체, 뒤(집벽쪽)는 지붕 물매만큼 더 높아 옆면이 삼각. 모든 선 = 각관.
  const tube = 0.08;                                          // 각관 단면 8cm
  const railH = deckSurfaceY - (groundTopY + matFoundationH);   // 바닥 가로막대(각관) 윗면 = 데크 포세린 마감면에 맞춤 → 안쪽 타일과 flush(틀은 테두리로 드러남)
  const px0 = Math.max(fX0 - deckEdge, 0) + tube / 2, px1 = dX1 - tube / 2;   // 데크 사각형 안쪽 네 꼭지점 X(주방쪽~안방쪽 끝)
  const pzF = dFrontZ + tube / 2, pzB = dWallZ - tube / 2;    // 앞(低Z)·뒤(집벽) Z
  const fdDoorH = 2.4;                                        // 전면 폴딩도어 높이 — 앞단 개구부를 딱 이 높이에 맞춰 도어가 고정유리 없이 바로 붙음
  const frameTopY = deckSurfaceY + fdDoorH;                   // 프레임 상단(앞단) = 데크 표면 + 도어 높이 → 앞단 개구부 = 도어 크기. 물매는 위 사다리꼴이 전담
  const postBase = groundTopY + matFoundationH;               // 기둥 밑면 = 온통기초 윗면(데크 마감이 아니라 기초에 앉음 — 포세린은 기둥 주위에 깔림)
  // 네 꼭지점 기둥(각관): 기초 윗면 ~ 통일 상단(네 기둥 같은 높이)
  for (const cx of [px0, px1]) for (const cz of [pzF, pzB])
    box({ x: cx - tube / 2, z: cz - tube / 2, w: tube, d: tube, y: postBase, h: frameTopY - postBase, mat: 썬룸Frame });
  // 상단 테두리보(각관) 4변 — 모두 같은 높이(수평 직사각 틀, 옆면 직사각)
  box({ x: px0 - tube / 2, z: pzF - tube / 2, w: (px1 - px0) + tube, d: tube, y: frameTopY - tube, h: tube, mat: 썬룸Frame });   // 앞 상단보
  box({ x: px0 - tube / 2, z: pzB - tube / 2, w: (px1 - px0) + tube, d: tube, y: frameTopY - tube, h: tube, mat: 썬룸Frame });   // 뒤 상단보
  box({ x: px0 - tube / 2, z: pzF - tube / 2, w: tube, d: (pzB - pzF) + tube, y: frameTopY - tube, h: tube, mat: 썬룸Frame });   // 좌 상단보
  box({ x: px1 - tube / 2, z: pzF - tube / 2, w: tube, d: (pzB - pzF) + tube, y: frameTopY - tube, h: tube, mat: 썬룸Frame });   // 우 상단보
  // 바닥 가로막대(각관, 10cm) — 네 변에서 기둥↔바닥 연결(기초 윗면부터)
  box({ x: px0 - tube / 2, z: pzF - tube / 2, w: (px1 - px0) + tube, d: tube, y: postBase, h: railH, mat: 썬룸Frame });   // 앞 바닥막대
  box({ x: px0 - tube / 2, z: pzB - tube / 2, w: (px1 - px0) + tube, d: tube, y: postBase, h: railH, mat: 썬룸Frame });   // 뒤 바닥막대
  box({ x: px0 - tube / 2, z: pzF - tube / 2, w: tube, d: (pzB - pzF) + tube, y: postBase, h: railH, mat: 썬룸Frame });   // 좌 바닥막대
  box({ x: px1 - tube / 2, z: pzF - tube / 2, w: tube, d: (pzB - pzF) + tube, y: postBase, h: railH, mat: 썬룸Frame });   // 우 바닥막대

  const roofBaseFrontH = 0.3, roofBaseBackH = 0.7;      // 앞단·뒤단 두께 — 윗면 물매를 만드는 경사 지붕 받침(지붕 물매 단일 출처)
  // ── 경사 지붕 받침 사다리꼴 육면체 — 프레임 상단(경사면) 위에 얹는다. 앞 낮고·뒤 높아(roofBaseFrontH↔roofBaseBackH) 윗면이 지붕 물매를 이룸(옆면 사다리꼴). ──
  {
    const bx0 = px0, bx1 = px1;     // 지붕프레임 밑면 = 도어프레임과 동일 발자국(같은 기둥 중심선)
    const bzF = pzF, bzB = pzB;
    const yBotF = frameTopY, yBotB = frameTopY;           // 밑면 = 평탄한 프레임 상단(직육면체 윗면)에 밀착
    const yTopF = frameTopY + roofBaseFrontH, yTopB = frameTopY + roofBaseBackH;   // 윗면만 경사 → 물매 전담
    const c = [
      [bx0, yBotF, bzF], [bx1, yBotF, bzF], [bx1, yTopF, bzF], [bx0, yTopF, bzF],   // 앞면(zF) 4점
      [bx0, yBotB, bzB], [bx1, yBotB, bzB], [bx1, yTopB, bzB], [bx0, yTopB, bzB],   // 뒷면(zB) 4점
    ];
    const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];   // 육면체 12모서리 = 각관
    for (const [i, j] of edges) {
      const a = new THREE.Vector3(...c[i]), b = new THREE.Vector3(...c[j]);
      const m = new THREE.Mesh(new THREE.BoxGeometry(tube, tube, a.distanceTo(b) + tube), 썬룸Frame);   // +tube: 모서리 접합부 겹침
      m.position.copy(a).add(b).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), b.clone().sub(a).normalize());
      m.castShadow = true;
      scene.add(m);
    }
  }

  // ── 오리지널징크 단물매 지붕 — 경사 받침 각관 윗면 위에 얹는다. 뒤=집 벽(dWallZ)에서 시작, 앞·왼쪽(안방·高x) 처마 넓게. ──
  {
    const frontOverhang = 1.0;                             // 앞 처마
    const leftOverhang = 1.0, rightOverhang = 0.4;         // 왼쪽(안방·高x=px1)·오른쪽(주방·低x=px0) 처마
    const zincT = 0.06;                                    // 오리지널징크 마감 두께
    const slope = (roofBaseBackH - roofBaseFrontH) / (pzB - pzF);   // 물매(Δy/Δz, 앞→뒤 상승) — 받침 윗면과 동일
    const restY = (z) => frameTopY + roofBaseFrontH + tube / 2 + slope * (z - pzF);   // 받침 각관 윗면(지붕이 얹히는 면) 경사선
    const eaveZ = pzF - frontOverhang;                     // 앞 처마 끝(低Z)
    const ridgeZ = dWallZ;                                 // 뒤 끝 = 집 벽에서 시작
    const rx0 = px0 - rightOverhang, rx1 = px1 + leftOverhang;   // 좌우 처마
    const eaveY = restY(eaveZ) + zincT, ridgeY = restY(ridgeZ) + zincT;   // 윗면 = 받침 윗면 + 마감 두께(밑면이 받침 위에 얹힘)
    // roofSlab과 동일한 8꼭지점 프리즘(윗면 eaveY..ridgeY, 두께 아래로) — X범위만 포치 폭에 맞춤
    const v = new Float32Array([
      rx0, eaveY, eaveZ, rx1, eaveY, eaveZ, rx1, ridgeY, ridgeZ, rx0, ridgeY, ridgeZ,
      rx0, eaveY - zincT, eaveZ, rx1, eaveY - zincT, eaveZ, rx1, ridgeY - zincT, ridgeZ, rx0, ridgeY - zincT, ridgeZ,
    ]);
    const idx = [0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1, 3, 2, 6, 3, 6, 7, 0, 3, 7, 0, 7, 4, 1, 5, 6, 1, 6, 2];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(v, 3));
    g.setIndex(idx); g.clearGroups(); g.addGroup(0, 12, 0); g.addGroup(12, 24, 1);
    g.computeVertexNormals();
    const roofMesh = new THREE.Mesh(g, [materials.roof, materials.roofEdge]);   // 윗면=오리지널징크, 옆·밑=드립엣지
    roofMesh.castShadow = true; roofMesh.receiveShadow = true;
    scene.add(roofMesh);
    roofLocal.push(roofMesh);
  }

  // 평평한 프레임 — 앞단(가장 낮은) 보 높이의 수평면에 사각 틀 + 내부 격자(lattice).
  // 경사 지붕(빗변)·수평 격자(밑변)·집 벽쪽 단차(수직변)로 측면에서 직각삼각형 구조가 보인다.
  // 이 수평면(flatFrameY)에 등·실링팬을 매단다.
  const barW = 0.05, barH = 0.07;
  const flatFrameY = (frameTopY + roofBaseFrontH) - barH;   // 장선(수평 격자) = 평평함 유지 가능한 최상단: 경사 지붕의 가장 낮은 앞단 밑면에 윗면을 맞춤
  if (withFlatFrame) {
    const flatX0 = (connectRightX != null) ? connectRightX : px0;  // 연결 시 이웃까지 이어 붙임. 기본은 프레임 발자국(px0~px1·pzF~pzB)에 정합
    const fw = px1 - flatX0, fd = pzB - pzF;
    const zMid = pzF + fd / 2;
    // 가로 긴 장선 5개(균등 간격) + 앞뒤 세로 장선 7개(균등 간격) — 색 통일(골조색)
    for (const z of Array.from({ length: 5 }, (_, i) => pzF + (i * fd) / 4)) {   // 가로 긴 장선 5개 균등 배치(양 끝 포함)
      box({ x: flatX0, z: z - barW / 2, w: fw, d: barW, y: flatFrameY, h: barH, mat: 썬룸Frame });
    }
    const fanBlade = (52 * 0.0254) / 2 - 0.1;                              // 실링팬 지름 52인치 → 날개 길이(중심 오프셋 0.1 반영)
    const fanDrop = 0.3;                                                   // 실링팬 봉 길이(천장→허브)
    const lightDrop = fanDrop + 0.10;                                      // 전등은 실링팬 날개보다 10cm 아래로 줄에 매닮
    Array.from({ length: 7 }, (_, i) => flatX0 + (i * fw) / 6).forEach((x, i) => {   // 앞뒤 세로 장선 7개 균등 배치(양 끝 포함)
      const n = i + 1;                                                     // 1-based 번호
      const hasLight = n === 2 || n === 4 || n === 6, hasFan = n === 3 || n === 5;
      box({ x: x - barW / 2, z: pzF, w: barW, d: fd, y: flatFrameY, h: barH, mat: 썬룸Frame });
      if (hasLight) ceilingLight({ x, z: zMid, ceilingY: flatFrameY, drop: lightDrop });    // 2·4·6번 장선 중앙 전등(줄로 날개 아래까지 내림)
      else if (hasFan) ceilingFan({ x, z: zMid, ceilingY: flatFrameY, bladeLength: fanBlade, drop: fanDrop });   // 3·5번 장선 중앙 실링팬(52인치)
    });
  }

  // 전면 폴딩도어 — 포치 도어프레임 앞단 개구부(두 앞기둥 사이·2.4m)에 딱 맞춤. 중앙 양개로 접혀 열리며, 열린 가운데가 출입구.
  const _foldingStart = scene.children.length;
  if (withWalls) {
    const fdMove = new THREE.MeshLambertMaterial({ color: 0x9fc0d4, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });     // 접힌(움직인) 짝 유리
    const fdFrame = new THREE.MeshLambertMaterial({ color: 0x3a3f45 });   // 폴딩 알루미늄 프레임(다크그레이)
    const sillH = 0.1;
    const wallBaseY = deckSurfaceY;                                       // 폴딩도어 베이스 = 데크 표면(deckSurfaceY)
    const sy = wallBaseY + sillH, hy = wallBaseY + fdDoorH;               // 유리 하단(문턱 위)·상단(=프레임 상단, 딱 맞음)
    const ax0 = px0 + tube / 2, ax1 = px1 - tube / 2, aMid = (ax0 + ax1) / 2, zc = pzF;   // 두 기둥 안쪽면·중앙(양개 분할)·프레임 앞 평면
    const half = aMid - ax0;
    const nHalf = 5;                                                      // 각 절반 5짝(양개·등폭)
    const pw = half / nHalf;                                             // 짝폭 = 절반폭 정확 분할 → 자투리 없음
    const ang = 60 * Math.PI / 180, sStep = pw * Math.cos(ang), fD = pw * Math.sin(ang);   // 접힘각·짝당 전진/접힘깊이
    // 문턱(하부)·상부 레일 — 전폭(프레임 앞단 개구부에 딱 맞음)
    box({ x: ax0, z: zc - 0.05, w: ax1 - ax0, d: 0.1, y: wallBaseY, h: sillH, mat: fdFrame });                 // 하부 문턱
    box({ x: ax0, z: zc - 0.05, w: ax1 - ax0, d: 0.1, y: hy - 0.08, h: 0.08, mat: fdFrame });                  // 상부 레일(=프레임 상단보 밑)
    // 아코디언 한 세트(경첩점 hinge[k]=[x,z]) — 등폭 짝, 열린(접힌) 상태. 선두짝(중앙쪽 끝)에 레버 손잡이.
    const drawFold = (hinge, nF, sillY = sy, headY = hy) => {
      for (let k = 0; k < nF; k += 1) {
        const [x0p, z0p] = hinge(k), [x1p, z1p] = hinge(k + 1);
        const cxp = (x0p + x1p) / 2, czp = (z0p + z1p) / 2, len = Math.hypot(x1p - x0p, z1p - z0p);
        const m = box({ x: cxp - len / 2, z: czp - 0.025, w: len, d: 0.05, y: sillY, h: headY - sillY, mat: fdMove, cast: false });
        m.rotation.y = Math.atan2(-(z1p - z0p), x1p - x0p);
      }
      for (let k = 0; k <= nF; k += 1) { const [hx, hz] = hinge(k); box({ x: hx - 0.035, z: hz - 0.035, w: 0.07, d: 0.07, y: sillY, h: headY - sillY, mat: fdFrame, cast: false }); }   // 경첩 세로살
      const [lx, lz] = hinge(nF); box({ x: lx - 0.06, z: lz - 0.06, w: 0.045, d: 0.045, y: sillY + 0.95, h: 0.28, mat: materials.handle });   // 선두짝 손잡이
    };
    // 양개 — 좌우 절반이 각자 바깥기둥쪽으로 밖(−Z) 접혀 중앙이 활짝 열림(=출입구). 등폭이라 자투리 없음.
    drawFold((k) => [ax0 + sStep * k, k % 2 === 0 ? zc : zc - fD], nHalf);   // 우측 절반(주방쪽 기둥으로 접힘)
    drawFold((k) => [ax1 - sStep * k, k % 2 === 0 ? zc : zc - fD], nHalf);   // 좌측 절반(안방쪽 기둥으로 접힘)

    // ── 좌우 측면 하부 프라이버시 벽(불투명) — 착석 시선 차단, 위는 개방 유지. 포치 골조 옆면선(px0/px1·pzF~pzB)에 맞춤 ──
    const privacyH = 0.8, privacyThick = 0.06;
    const privacyMat = new THREE.MeshLambertMaterial({ color: 0x8a8f96, side: THREE.DoubleSide });
    for (const sx of [px0, px1])
      box({ x: sx - privacyThick / 2, z: pzF, w: privacyThick, d: pzB - pzF, y: wallBaseY, h: privacyH, mat: privacyMat });

    // ── 좌우 측면 폴딩창 — 프라이버시 벽(하부) 위·프레임 상단(hy) 아래. 각 측면 등폭 아코디언이 뒤(+Z)쪽으로 접혀 열림 ──
    const winSy = wallBaseY + privacyH;                       // 창 하단 = 프라이버시 벽 상단
    const az0 = pzF + tube / 2, az1 = pzB - tube / 2;         // 앞·뒤 기둥 안쪽면(측면 개구)
    const nWin = 8;                                           // 등폭·8짝 고정
    const wpw = (az1 - az0) / nWin, wStep = wpw * Math.cos(ang), wFD = wpw * Math.sin(ang);   // 짝폭·뒤로 전진/밖으로 접힘깊이
    for (const [sx, outSign] of [[px0, -1], [px1, 1]]) {      // 우측(주방쪽·밖=−X)·좌측(안방쪽·밖=+X)
      box({ x: sx - 0.05, z: az0, w: 0.1, d: az1 - az0, y: winSy, h: 0.08, mat: fdFrame });        // 하부 레일(프라이버시 벽 위)
      box({ x: sx - 0.05, z: az0, w: 0.1, d: az1 - az0, y: hy - 0.08, h: 0.08, mat: fdFrame });    // 상부 레일(프레임 상단보 밑)
      drawFold((k) => [sx + (k % 2 === 0 ? 0 : outSign * wFD), az1 - wStep * k], nWin, winSy, hy); // 뒤(az1)서 등폭 접힘
    }
  }
  foldingLocal.push(...scene.children.slice(_foldingStart));   // 폴딩도어 객체 별도 토글 그룹

  // 썬룸 바닥 — 포세린 타일 마감(건식). matFoundationH 온통기초 위 페데스탈(높이조절 받침)에 포세린을 얹는다.
  const deckTopY = deckSurfaceY;                  // 데크 상단 = 온통기초(0.5)+페데스탈(0.10)+포세린(0.02) — 단일 출처
  const deckThickness = 0.02;                    // 포세린 마감 두께 2cm
  if (withDeck) {                                  // 데크 바닥 마감 — 도어프레임 바닥 사각틀 '안쪽'에만 깔아 각관 틀이 테두리로 드러나게
    const pX0 = px0 + tube / 2, pX1 = px1 - tube / 2;   // 각관 안쪽 면(테두리 틀은 덮지 않음)
    const pZ0 = pzF + tube / 2, pZ1 = pzB - tube / 2;
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(pX1 - pX0, deckThickness, pZ1 - pZ0),
      materials.porcelainDeck
    );
    deck.position.set((pX0 + pX1) / 2, deckTopY - deckThickness / 2, (pZ0 + pZ1) / 2);
    deck.receiveShadow = true;
    scene.add(deck);
    floorLocal.push(deck, addGeometryEdges(deck, 0x9a9384));
  }

  // 데크 바닥 사이즈 표시 — 물매 반영한 수평투영(증축 신고 면적 기준)
  if (withDeck) {
    const floorW = fX1 - fX0;
    const floorL = (deckDepth != null) ? deckDepth : (fWallZ - fFrontZ); // 데크 깊이(부분 데크면 그 값)
    const floorArea = floorW * floorL;
    const floorLabelZ = (deckDepth != null) ? fWallZ - deckDepth / 2 : (fWallZ + fFrontZ) / 2;
    deckLocal.push(label(`썬룸 바닥(수평투영) ${fmtDim(floorW)}×${fmtDim(floorL)}m = ${fmtDim(floorArea)}㎡`, (fX0 + fX1) / 2, firstFloorY + 0.06, floorLabelZ, 'dim'));
  }

  // 데크 가구 — 오른쪽(低x) 화목난로 영역 + 나머지에 s2식 식탁·의자(반고 햄프턴 DLX)
  const _furnStart = scene.children.length;
  if (withFurniture) {
    // 데크 우측(低x=주방쪽) = 난로 영역(붉은 예약 구획) — 기존 s1 화목난로 자리. 나머지엔 s2 1층과 동일한 식탁·의자.
    box({ x: fX0, z: dFrontZ, w: dReserveW, d: dWallZ - dFrontZ, y: deckSurfaceY + 0.006, h: 0.012, mat: materials.leftZone, cast: false });   // 난로 영역
    // 식탁 nDeckTables개(윗판 85×72·높이 0.72)를 高x로 이어 붙임. 의자=반고 햄프턴 DLX, 테이블당 앞·뒤 2개 → 의자 2·nDeckTables개.
    const TH = 0.72, top = 0.04, leg = 0.06, woodT = materials.woodFrame;
    const tzX0 = fX0 + dReserveW;                              // 테이블 영역 시작(난로 영역 옆)
    const rowCx = (tzX0 + dX1) / 2;                            // 확장된 데크(난로옆~高X끝) 가운데
    const cxs = Array.from({ length: nDeckTables }, (_, i) => rowCx + (i - (nDeckTables - 1) / 2) * dTW);   // 좌우로 이어 붙인 식탁 중심들
    const cz0 = (dFrontZ + dWallZ) / 2;                        // 데크 깊이 중앙에 행 배치(앞·뒤 의자 대칭)
    for (const cx of cxs) {
      box({ x: cx - dTW / 2, z: cz0 - dTD / 2, w: dTW, d: dTD, y: deckSurfaceY + TH - top, h: top, mat: woodT });     // 윗판
      for (const lx of [cx - dTW / 2 + 0.02, cx + dTW / 2 - 0.02 - leg])
        for (const lz of [cz0 - dTD / 2 + 0.02, cz0 + dTD / 2 - 0.02 - leg])
          box({ x: lx, z: lz, w: leg, d: leg, y: deckSurfaceY, h: TH - top, mat: woodT });                           // 다리 4
    }
    for (const cx of cxs) {
      campingChair({ cx, cz: cz0 - dOff, faceAngle: 0, baseY: deckSurfaceY });          // 앞쪽 — 테이블(+z) 향함
      campingChair({ cx, cz: cz0 + dOff, faceAngle: Math.PI, baseY: deckSurfaceY });    // 뒤쪽 — 테이블(−z) 향함
    }
    // 식탁·의자 둘레 이동공간(반투명 청록) — 앞뒤 통로 dAisle(s2 1층 동일), 좌우 통로 dEndGap(데크 폭 6.0m 맞춤), clamp 없이 원본 그대로.
    const zx0 = cxs[0] - dTW / 2 - dEndGap, zx1 = cxs[cxs.length - 1] + dTW / 2 + dEndGap;
    const zz0 = cz0 - dChairBack - dAisle, zz1 = cz0 + dChairBack + dAisle;
    box({ x: zx0, z: zz0, w: zx1 - zx0, d: zz1 - zz0, y: deckSurfaceY + 0.004, h: 0.012, mat: materials.clearZone, cast: false });
    Object.assign(s1DeckFurn, { nTables: cxs.length, tW: dTW, tD: dTD });   // 식탁 실측값 → 설계메모(단일 출처)
  }
  extrasLocal.push(...scene.children.slice(_furnStart));

  // 추가물 분류: 데크 바닥/가구/폴딩으로 표시된 것 외 나머지는 모두 포치 골조(프레임).
  const _floorSet = new Set(floorLocal);
  const _deckSet = new Set(deckLocal);
  const _foldingSet = new Set(foldingLocal);
  const _extrasSet = new Set(extrasLocal);
  const _roofSet = new Set(roofLocal);
  for (const o of scene.children.slice(_addStart)) {
    if (_floorSet.has(o)) deckFloorObjects.push(o);
    else if (_deckSet.has(o)) deckObjects.push(o);
    else if (_foldingSet.has(o)) foldingObjects.push(o);
    else if (_extrasSet.has(o)) extrasObjects.push(o);
    else if (_roofSet.has(o)) 썬룸RoofObjects.push(o);
    else 썬룸FrameObjects.push(o);
  }

  return { dX0, dX1, dFrontZ, dWallZ, deckTopY };   // 데크 사각형(계단 배치·발자국 단일 출처)
}

export function buildDeck() {


// 주방 앞(우측) 썬룸 — 우측 외벽끝(x=0) 고정, 안방쪽으로 늘려 폴딩벽·데크 폭 deckW(fX1=deckW, 좌측 끝 파생).
//   지붕면은 이 썬룸 폭(roofW)까지만 — 안방 개방 포치 제거로 집 전폭 덮지 않음(기초=데크 위에만).
const kitchen썬룸 = 썬룸({ roofLowX: -0.2, roofW: 5.9, withFurniture: true, nDeckTables: 4, deckDepth: deckD });   // 데크 깊이=deckD. 데크 폭 = deckW(roofW:5.9 파생) + 식탁 nDeckTables가 필요로 하는 확장(deckExtraW). 8인석=nDeckTables:4. 골조·데크는 이 폭(roofW)까지만 — 기초(데크) 위에만.
// (안방 앞 개방 포치 제거 — 기초 없는 부분이라 사용자 요청으로 프레임·지붕·땅기둥 전부 삭제. 포치는 데크 기초 위에만 존재.)

// 데크 기초 — 집과 동일한 시스템말뚝기초(말뚝 + 두부). 두부 위에 둘레 토대보(바닥 골조)가 얹히고, 그 위에 포세린·폴딩/외벽이 올라간다.
// 데크 기초 발자국 — 집 너비(0~buildingW) 안으로 정렬(엣지 돌출 제거). 인접 데크 겹침을 없애 폭 합이 buildingW가 되게.
for (const p of [kitchen썬룸]) {
  const fx0 = Math.max(p.dX0, 0);          // 주방쪽(담장) 끝: 집 기초선 밖으로 안 나가게
  const fx1 = Math.min(p.dX1, buildingW);  // 안방쪽 끝: 집 너비(buildingW) 안으로
  deckFootprints.push({ x: fx0, z: p.dFrontZ, w: fx1 - fx0, d: p.dWallZ - p.dFrontZ });
}
// 포치(데크 지붕) 건축면적 산입면적 — 건축법 시행령 §119① 2호: 벽 없이 기둥으로 받친 지붕은
//   외곽 '기둥 중심선' 안쪽 수평투영이 건축면적(기둥 안쪽엔 1m 처마 공제 없음). 지붕은 단일 패널이
//   전면(주방+안방)을 덮고, 최외곽 기둥은 주방측(deckFootprints[0].x)~안방측(안방 땅기둥 X). 깊이=데크 수평투영.
const deckRoofColX0 = deckFootprints[0].x;                       // 주방측 최외곽 기둥선
const deckRoofColX1 = deckW;                                     // 안방측 최외곽 기둥선 = 주방 데크 高X 프레임선(fX1=deckW), 안방 개방 포치 제거로 여기까지
deckRoofBcrArea = (deckRoofColX1 - deckRoofColX0) * deckFootprints[0].d;   // 포치 건축면적(수평투영)
}

export function buildDeckStairFrame() {
// 데크 계단틀 — 앞쪽(−Z) 계단을 '납작한 직사각형 테두리'로 표시. 지면~데크(deckSurfaceY)를 실사용 단높이(≈0.16m)로 등분해 단수 자동 산출. 윗면 포세린은 '데크' 토글(deckFloorObjects), 각관 틀·다리는 deckStairFrameObjects.
const DECK_STAIR_RISE = 0.16;   // 목표 단높이 — 데크 높이가 바뀌면 단수가 자동으로 따라옴(실사용 계단)
const deckStairNRise = Math.max(2, Math.round((deckSurfaceY - groundTopY) / DECK_STAIR_RISE));   // 지면~데크 등분 수(=오름 수)
const deckStairK = deckStairNRise - 1;                       // 중간 디딤단 수(맨 위 단 = 데크)
const deckStairStepRise = (deckSurfaceY - groundTopY) / deckStairNRise;   // 각 단높이
{
  const df = deckFootprints[0];                     // 데크 footprint(집 기초선 안으로 clamp된 폭) — 계단을 데크보다 크게 그리지 않도록 동일 좌표 사용
  const dXa = df.x, dXb = df.x + df.w, dZa = df.z;
  const tread = 0.3, t = 0.05;                      // 디딤 폭 / 각관 굵기(5×5cm, 구조 보이게) — 단높이·디딤폭은 이 값과 무관
  const run = tread;                                // 한단 크기 — 수평 깊이 한 디딤(0.3m)
  // 밟는 표면(포세린 윗면) 균등 단차 — 지면~데크(deckSurfaceY)를 목표 단높이(≈0.16m)로 등분해 단수 자동 산출(실사용 계단).
  const K = deckStairK, stepRise = deckStairStepRise;   // 중간 디딤단 수(데크가 맨 위 단) / 각 단높이
  const surfAt = (j) => groundTopY + j * stepRise;      // j단(1=최하) 밟는 표면(데크는 맨 위=nRise단)
  const flatRectFrame = (x0, x1, z0, z1, surfaceY) => {   // 밟는 표면 surfaceY에 맞춰 4변 틀 + 윗면 포세린 한 단
    const xw = x1 - x0, zw = z1 - z0;
    const baseY = surfaceY - deckFinishT - t;            // 틀 막대 바닥 = 표면에서 타일 2cm + 막대 t 만큼 아래
    deckStairFrameObjects.push(box({ x: x0, z: z0, w: xw, d: t, y: baseY, h: t, mat: materials.deckStairFrame, cast: false }));        // z0 변
    deckStairFrameObjects.push(box({ x: x0, z: z1 - t, w: xw, d: t, y: baseY, h: t, mat: materials.deckStairFrame, cast: false }));    // z1 변
    deckStairFrameObjects.push(box({ x: x0, z: z0, w: t, d: zw, y: baseY, h: t, mat: materials.deckStairFrame, cast: false }));        // x0 변
    deckStairFrameObjects.push(box({ x: x1 - t, z: z0, w: t, d: zw, y: baseY, h: t, mat: materials.deckStairFrame, cast: false }));    // x1 변
    deckFloorObjects.push(box({ x: x0, z: z0, w: xw, d: zw, y: surfaceY - deckFinishT, h: deckFinishT, mat: materials.porcelainDeck, cast: false }));   // 틀 윗면에 2cm 포세린타일(윗면 = surfaceY) — '데크 바닥' 토글
  };
  // 데크 윗면 포세린은 썬룸 함수의 데크 마감이 '바닥' 단계부터 이미 깔므로 여기선 안 얹음(이중 방지).
  const legW = 0.05;
  const leg = (x, z, surfaceY) => deckStairFrameObjects.push(box({ x, z, w: legW, d: legW, y: groundTopY, h: (surfaceY - deckFinishT - t) - groundTopY, mat: materials.deckStairFrame, cast: false }));
  const groundFrame = (x0, x1, z0, z1) => {   // 지면 외곽 사각틀(전체 단 아래)
    const xw = x1 - x0, zw = z1 - z0;
    deckStairFrameObjects.push(box({ x: x0, z: z0, w: xw, d: t, y: groundTopY, h: t, mat: materials.deckStairFrame, cast: false }));
    deckStairFrameObjects.push(box({ x: x0, z: z1 - t, w: xw, d: t, y: groundTopY, h: t, mat: materials.deckStairFrame, cast: false }));
    deckStairFrameObjects.push(box({ x: x0, z: z0, w: t, d: zw, y: groundTopY, h: t, mat: materials.deckStairFrame, cast: false }));
    deckStairFrameObjects.push(box({ x: x1 - t, z: z0, w: t, d: zw, y: groundTopY, h: t, mat: materials.deckStairFrame, cast: false }));
  };
  // 정면(−Z) 직선 계단 — K단 중첩(데크쪽 j=K, 바깥 j=1). 각 단 바깥 변 양끝 기둥, 맨 위 단은 데크쪽에도 양끝 기둥.
  groundFrame(dXa, dXb, dZa - K * run, dZa);
  for (let j = 1; j <= K; j += 1) {
    const z1 = dZa - (K - j) * run, z0 = z1 - run, s = surfAt(j);
    flatRectFrame(dXa, dXb, z0, z1, s);
    leg(dXa, z0, s); leg(dXb - legW, z0, s);                             // 바깥 변 좌·우 끝
    if (j === K) { leg(dXa, dZa - legW, s); leg(dXb - legW, dZa - legW, s); }   // 맨 위 단: 데크쪽 변 좌·우 끝
  }
}
}

export function buildDeckStoveCassette() {
// 썬룸 화목난로(캠핑용) — 측면 폴딩 "앞에서 3번째 짝"의 하부만 불연패널(연통홀), 상부는 기존 폴딩 유리 유지.
{
  const deckTop = deckSurfaceY;                           // 데크 밟는 표면(단일 출처) — 난로·카세트를 데크 위에 얹음
  const fWallZ = buildingFrontZ;                          // buildingFrontZ (집 벽쪽 끝)
  const roofRun = Math.sqrt(4.0 * 4.0 - 0.2 * 0.2);       // 썬룸 수평투영(폴딩 내부값과 동일)
  const fFrontZ = (buildingFrontZ - roofRun) + 0.2;       // 폴딩 앞단(≈-4.50)
  const panelZ = (fWallZ - fFrontZ) / 6;                  // 측면 한 짝 폭(Z) — (fWallZ−fFrontZ)/6
  const stZ = fFrontZ + 2.5 * panelZ;                    // 앞에서 3번째 짝 '중앙'
  const stX = 0.45;
  const splitH = 0.55;                                   // 분할선 높이(2등분 아님 — 연통 위로만)
  const flueY = deckTop + 0.30;                          // 연통 = 데크 바닥 + 30cm
  const _stoveStart = scene.children.length;
  // 착탈 카세트 — 하부 불연 패널 + 둘레 가스켓 프레임(빼고 끼우는 단위). 짝마다 독립 프레임 → 각각 따로 착탈.
  const drawCassette = (zc) => {
    const a = zc - panelZ / 2 + 0.012, d = panelZ - 0.024, b = a + d;
    box({ x: -0.05, z: a, w: 0.11, d: d, y: deckTop, h: splitH, mat: materials.soundWall });               // 카세트 패널 면(불연)
    box({ x: -0.07, z: a, w: 0.15, d: d, y: deckTop + splitH - 0.02, h: 0.04, mat: materials.entryFrame }); // 상부 프레임(분할선)
    box({ x: -0.09, z: a, w: 0.05, d: d, y: deckTop, h: 0.035, mat: materials.entryFrame });                // 하부 프레임
    box({ x: -0.09, z: a, w: 0.05, d: 0.035, y: deckTop, h: splitH, mat: materials.entryFrame });           // 앞측 세로 프레임
    box({ x: -0.09, z: b - 0.035, w: 0.05, d: 0.035, y: deckTop, h: splitH, mat: materials.entryFrame });   // 뒤측 세로 프레임(독립)
  };
  const z4 = fFrontZ + 3.5 * panelZ;     // 앞에서 4번째 짝 중앙
  drawCassette(stZ);                     // 3번째(현재 겨울=연통홀)
  drawCassette(z4);                      // 4번째(추가, 솔리드 — 연통 없음, 독립 착탈)
  box({ x: stX, z: stZ, w: 0.42, d: 0.42, y: deckTop, h: 0.5, mat: materials.openingEdge });                    // 화목난로
  box({ x: stX - 0.03, z: stZ - 0.24, w: 0.34, d: 0.02, y: deckTop + 0.12, h: 0.24, mat: materials.guard });    // 난로 도어
  const flueH = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 14), materials.guard);
  flueH.rotation.z = Math.PI / 2; flueH.position.set(0.1, flueY, stZ); flueH.castShadow = true; scene.add(flueH);
  // 연통 수직부 — 윗끝이 그 위치(z=stZ)의 썬룸 지붕면보다 1m 위로 오게 길이 산정.
  // 지붕면 높이는 썬룸 물매 파라미터(targetWallPostH / targetFrontPostH / beam)를 동일하게 재현.
  const _beamDrop = 0.04, _beamH = 0.12, _frameInset = 0.2, _slope = 4.0;
  const yAtWall = firstFloorY + 2.8 + _beamDrop + _beamH;
  const targetGlassAtFront = firstFloorY + 2.6 + _beamDrop + _beamH;
  let yAtFront = targetGlassAtFront;
  for (let i = 0; i < 40; i += 1) { const d = yAtWall - yAtFront; const run = Math.sqrt(_slope * _slope - d * d); yAtFront = targetGlassAtFront - _frameInset * d / run; }
  const roofFrontEdgeZ = buildingFrontZ - roofRun;
  const roofYatStZ = yAtWall + (yAtFront - yAtWall) * ((stZ - buildingFrontZ) / (roofFrontEdgeZ - buildingFrontZ));
  const flueBottom = flueY - 0.05;                         // 기존 하단(수평 연통 연결부)
  const flueTopTarget = roofYatStZ + 1.0;                  // 썬룸 지붕면 +1m
  const flueVLen = flueTopTarget - flueBottom;
  const flueV = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, flueVLen, 14), materials.guard);
  flueV.position.set(-0.22, (flueBottom + flueTopTarget) / 2, stZ); flueV.castShadow = true; scene.add(flueV);
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.16, 14), materials.openingEdge);
  hole.rotation.z = Math.PI / 2; hole.position.set(-0.02, flueY, stZ); scene.add(hole);
  extrasObjects.push(...scene.children.slice(_stoveStart));   // 난로·연통·카세트를 '데크' 토글(extrasObjects)에 소속 — 데크와 함께 표시
}
}
