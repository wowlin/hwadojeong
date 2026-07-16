// labels.js — 라벨(캔버스 스프라이트)·치수 헬퍼(planX/Y/ZDim)·방 색면 (main.js에서 줄 이동).
// 의존: THREE·scene·materials·primitives(box·fmtDim). 치수선 box는 반드시 이 파일의 헬퍼 안에서만 그린다(test ⑨).
import * as THREE from 'three';
import { scene } from './scene.js';
import { materials } from './materials.js';
import { box, fmtDim } from './primitives.js';

export function label(text, x, y, z, group = 'dim') {
  const { bg, size } = LABEL_GROUPS[group] || LABEL_GROUPS.dim;   // 그룹이 배경색·글자크기 결정
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const H = 192;                                                // 캔버스 높이(세로)는 고정 — 월드 높이 불변
  const lines = String(text).split('\n');                      // '\n'으로 여러 줄 지원
  let fontSize = 62;
  const setFont = () => { ctx.font = `800 ${fontSize}px Apple SD Gothic Neo, Noto Sans KR, Arial`; };
  setFont();
  while (fontSize * 1.18 * lines.length > H * 0.92 && fontSize > 30) {   // 줄 수에 맞춰 세로 축소(가로는 캔버스를 늘려 맞춤)
    fontSize -= 2;
    setFont();
  }
  const pad = 40;                                              // 좌우 여백(px) — 글자에 딱 붙지 않게
  const textW = Math.max(...lines.map((l) => ctx.measureText(l).width));
  canvas.width = Math.max(120, Math.ceil(textW + pad * 2));    // 가로폭 = 텍스트 폭 + 여백(고정 768 폐기)
  canvas.height = H;
  setFont();                                                   // 캔버스 리사이즈로 컨텍스트 초기화됨 → 재설정
  // 배경 박스 없음(투명) → 뒤 구조가 안 가려짐. 대신 글자에 외곽선 + 옅은 입체 두께로 어디서나 또렷.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const faceColor = bg.replace(/[\d.]+\)\s*$/, '1)');   // 그룹색을 불투명으로 → 글자 윗면 색(그룹 구분 유지)
  const depth = Math.max(2, Math.round(fontSize * 0.07));   // 입체 두께(px)
  const lineH = fontSize * 1.18;
  const startY = canvas.height / 2 - lineH * (lines.length - 1) / 2;
  const cx = canvas.width / 2;
  lines.forEach((l, i) => {
    const ly = startY + i * lineH;
    for (let d = depth; d >= 1; d -= 1) {            // 옆면(아래·오른쪽으로 밀린 어두운 복제) = 두께
      ctx.fillStyle = '#374151';
      ctx.fillText(l, cx + d, ly + d);
    }
    ctx.lineWidth = Math.max(4, fontSize * 0.16);    // 외곽선 — 배경 없이도 밝/어두운 바탕 모두에서 또렷
    ctx.strokeStyle = '#1f2937';
    ctx.strokeText(l, cx, ly);
    ctx.fillStyle = faceColor;                        // 윗면(그룹색)
    ctx.fillText(l, cx, ly);
  });
  const texture = new THREE.CanvasTexture(canvas);
  const isDim = group === 'dim';   // 치수 라벨은 항상 맨 위에 그려 땅·두부·구조에 안 묻히게(깊이 무시)
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: !isDim, depthWrite: !isDim }));
  sprite.userData.labelGroup = group;   // 라벨 그룹(치수/방/가구/설비/개구부…) 기록 — 층별 라벨 정리에 사용
  if (isDim) sprite.renderOrder = 10;
  const readableSize = Math.max(size, 0.28);
  const worldH = readableSize * 1.2;                           // 세로(월드 높이) — 기존과 동일
  sprite.position.set(x, y, z);
  sprite.scale.set(worldH * (canvas.width / canvas.height), worldH, 1);   // 가로폭만 텍스트 비율에 맞춤
  scene.add(sprite);
  return sprite;
}

// ★라벨 그룹★ — 그룹별 배경색(bg) + 글자(스프라이트) 크기(size)를 한 곳에서 통일 관리.
//   크기·색을 바꾸려면 해당 그룹의 size/bg만 고치면 그 그룹 전체에 적용된다.
// 라벨 글자 크기 = 단일 표준(LABEL_SIZE). 종류(치수·방·가구·설비·개구부·구조)는 배경색으로만 구분하고,
// 폰트 크기는 모두 이 한 값을 쓴다. 크기를 바꾸려면 여기 한 곳만 고친다.
const LABEL_SIZE = 0.50;
const LABEL_GROUPS = {
  dim:       { bg: 'rgba(255,255,255,0.88)', size: LABEL_SIZE },   // 치수
  room:      { bg: 'rgba(255,243,196,0.92)', size: LABEL_SIZE },   // 방 이름 — 연노랑
  furniture: { bg: 'rgba(205,227,247,0.92)', size: LABEL_SIZE },   // 가구·집기 — 연파랑
  mep:       { bg: 'rgba(255,224,189,0.92)', size: LABEL_SIZE },   // 설비(전기·수도·냉난방·태양광·배수) — 연주황
  opening:   { bg: 'rgba(213,237,209,0.92)', size: LABEL_SIZE },   // 개구부(문·창) — 연녹
  struct:    { bg: 'rgba(226,226,226,0.92)', size: LABEL_SIZE },   // 구조·마감·사양 — 연회색
};

// 세로(높이) 치수 — 한 모서리에 수직선 + 상·하 틱(X방향) + 라벨. name:'ground'로 프레이밍 제외.
export function planYDim(x, z, y0, y1, text) {
  const lw = 0.025;   // 치수선 굵기 — 가로·세로와 동일
  box({ x: x - lw / 2, z: z - lw / 2, w: lw, d: lw, y: y0, h: y1 - y0, mat: materials.dimension, cast: false, name: 'ground' });
  box({ x: x - 0.13, z: z - lw / 2, w: 0.26, d: lw, y: y0, h: lw, mat: materials.dimension, cast: false, name: 'ground' });
  box({ x: x - 0.13, z: z - lw / 2, w: 0.26, d: lw, y: y1 - lw, h: lw, mat: materials.dimension, cast: false, name: 'ground' });
  label(text, x, y1 + 0.2, z, 'dim');   // 라벨은 수직 치수선 위쪽 끝(y1)에서 가깝게(0.2) — 가로·세로와 동일
}

// 평면(배치도) 가로(x축) 치수 — 가로선 + 양끝 틱 + 라벨. 라벨은 치수선 중앙(x 가운데, z=선 위치), y축으로 살짝 위(0.5).
export function planXDim(fixed, a, b, text) {
  const y = 0.012, h = 0.002, lw = 0.025, tick = 0.3;
  box({ x: a, z: fixed - lw / 2, w: b - a, d: lw, y, h, mat: materials.dimension, cast: false, name: 'ground' });   // 가로선
  box({ x: a, z: fixed - tick / 2, w: lw, d: tick, y, h, mat: materials.dimension, cast: false, name: 'ground' });  // a끝 틱
  box({ x: b - lw, z: fixed - tick / 2, w: lw, d: tick, y, h, mat: materials.dimension, cast: false, name: 'ground' });  // b끝 틱
  label(text, (a + b) / 2, 0.2, fixed, 'dim');   // 라벨은 치수선 중앙, y축으로 치수선보다 살짝 위(배경 없으니 가깝게)
}
// 평면(배치도) 세로(z축) 치수 — 가로와 별개. 라벨은 선 위쪽 끝(+Z=화면 상단) 위에. 카드가 땅에 안 박히게 y로 띄움.
export function planZDim(fixed, a, b, text) {
  const y = 0.012, h = 0.002, lw = 0.025, tick = 0.3;
  box({ x: fixed - lw / 2, z: a, w: lw, d: b - a, y, h, mat: materials.dimension, cast: false, name: 'ground' });   // 세로선
  box({ x: fixed - tick / 2, z: a, w: tick, d: lw, y, h, mat: materials.dimension, cast: false, name: 'ground' });  // 아래 틱(−Z)
  box({ x: fixed - tick / 2, z: b - lw, w: tick, d: lw, y, h, mat: materials.dimension, cast: false, name: 'ground' });  // 위 틱(+Z)
  label(text, fixed, 0.2, (a + b) / 2, 'dim');   // 라벨은 치수선 중앙(z 가운데, x=선 위치), y축으로 치수선보다 살짝 위(배경 없으니 가깝게)
}

export function room({ x, z, w, d, y, mat, text, surfaceH = 0.02 }) {
  box({ x, z, w, d, y: y - surfaceH, h: surfaceH, mat, cast: false });
  if (text) label(text, x + w / 2, y + 0.16, z + d / 2, 'room');   // text 없으면 색면만(라벨은 바닥 토글이 단독으로 담당)
}

export function roomText(name, w, d) {
  return `${name} ${fmtDim(w)}x${fmtDim(d)}m`;
}
