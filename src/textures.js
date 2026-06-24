// 절차적 캔버스 텍스처 생성기 — THREE만 의존(순수). 자갈·흙·포세린 데크.
import * as THREE from 'three';

// 시드 고정 PRNG(mulberry32) — 텍스처를 결정화해 시각 회귀 테스트(0-b baseline diff)를 0으로 만든다.
// 각 텍스처는 고유 시드의 독립 rand를 써서 호출 순서와 무관하게 동일 패턴을 낸다.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeGravelTexture() {
  const rand = mulberry32(0x1a2b3c4d);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#857f72';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i += 1) {
    const x = rand() * 256;
    const y = rand() * 256;
    const r = rand() * 2.4 + 0.5;
    const base = 92 + rand() * 88;
    ctx.fillStyle = `rgb(${base}, ${Math.max(0, base - 6)}, ${Math.max(0, base - 18)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(11, 5);
  return texture;
}

// 흙(부지) 질감: 흙색 베이스 + 넓은 색얼룩(흙 톤 변화) + 잔 알갱이/작은 돌.
export function makeEarthTexture() {
  const rand = mulberry32(0x2b3c4d5e);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#a3814f';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 64; i += 1) {                 // 넓은 흙 얼룩(밝고 어두운 패치)
    const x = rand() * 256, y = rand() * 256, r = rand() * 42 + 16;
    const c = rand() < 0.5 ? [150, 119, 73] : [121, 92, 54];
    ctx.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0.12)`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  for (let i = 0; i < 2200; i += 1) {               // 잔 알갱이/작은 돌
    const x = rand() * 256, y = rand() * 256, r = rand() * 1.8 + 0.3;
    const b = 70 + rand() * 110;
    ctx.fillStyle = `rgb(${b}, ${Math.round(b * 0.78)}, ${Math.round(b * 0.5)})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 5);
  return texture;
}

// 포세린 타일 데크 — 대형 포세린 포장재(밝은 석재 톤). 썬룸 바닥용.
export function makePorcelainDeckTexture() {
  const rand = mulberry32(0x3c4d5e6f);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  // 밝은 쿨 그레이 바탕
  ctx.fillStyle = '#e4e7e9';
  ctx.fillRect(0, 0, 256, 256);
  // 미세한 얼룩(석재 질감)
  for (let i = 0; i < 1400; i += 1) {
    const x = rand() * 256;
    const y = rand() * 256;
    const r = rand() * 2.2 + 0.3;
    const v = rand() < 0.5 ? 240 + rand() * 14 : 214 + rand() * 16; // 밝고/살짝 어두운 점
    ctx.fillStyle = `rgba(${v}, ${v + 2}, ${v + 4}, 0.16)`;   // 약간 푸른 끼의 중립 회색
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // 은은한 베이닝(불규칙 결)
  for (let g = 0; g < 6; g += 1) {
    ctx.strokeStyle = `rgba(186, 190, 194, ${0.12 + rand() * 0.1})`;
    ctx.lineWidth = rand() * 1.4 + 0.4;
    ctx.beginPath();
    let x = rand() * 256;
    ctx.moveTo(x, 0);
    for (let y = 0; y <= 256; y += 32) {
      x += rand() * 40 - 20;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // 타일 줄눈(상/좌 모서리 — 반복 시 연속 격자) — 얕은 음영
  ctx.fillStyle = 'rgba(150, 144, 132, 0.5)';
  ctx.fillRect(0, 0, 256, 3);
  ctx.fillRect(0, 0, 3, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}
