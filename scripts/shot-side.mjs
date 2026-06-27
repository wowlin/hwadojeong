// 측면 시점 렌더 캡처 — 높이/폭 차이를 '눈으로' 보기 위한 용도(평면 shot으로는 높이가 안 보임).
//   사용: npm run shot:side
//   출력: shot-side.png(측면 전체) + shot-side-corner.png(좌측 앞 코너 줌)
// 바닥틀(toggleFrame) 뷰에서 시점을 측면으로 크게 기울이고, 코너로 당겨 두 장 찍는다.
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

let chromium;
try { ({ chromium } = await import('playwright')); }
catch {
  console.error('playwright 없음 → 1회 설치: npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}

console.log('빌드…');
execSync('npm run build', { cwd: root, stdio: 'inherit' });

const port = 4181;
const url = `http://127.0.0.1:${port}/`;
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
const cleanup = () => { try { srv.kill(); } catch {} };
process.on('exit', cleanup);
for (let i = 0; i < 60; i += 1) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });
// 바닥틀+바닥+데크+계단 부품을 켜 계단틀·단차가 측면으로 보이게 한다(부품별 체크박스 토글).
for (const id of ['cFrame', 'cFloor', 'cDeck', 'cStair']) { await page.click('#' + id); await page.waitForTimeout(120); }
await page.waitForTimeout(800);

// 시점은 카메라 핸들(window.__cc)로 직접 잡는다 — 이 환경에선 마우스 드래그 회전이 안 먹어서.
// 데크 앞 계단줄을 낮은 측면에서 본다(높이·단차가 옆모습으로 보이게).
const setCam = (camPos, target) => page.evaluate(({ p, t }) => {
  const { camera, controls } = window.__cc;
  controls.target.set(t[0], t[1], t[2]);
  camera.position.set(p[0], p[1], p[2]);
  controls.update();
}, { p: camPos, t: target });

// 1) 데크 앞 계단 전체를 낮은 앞-측면에서(눈높이 ~지면 위 1.5m, 앞쪽 -Z 멀리서 데크/계단 정면을 옆으로)
await setCam([8.5, 1.6, -9.5], [3.0, 0.6, -1.0]);
await page.waitForTimeout(600);
await page.screenshot({ path: root + '/shot-side.png' });

// 2) 좌측 앞 코너(부채꼴 계단)를 가까이 낮은 측면에서
await setCam([6.6, 1.2, -5.2], [4.6, 0.4, -1.4]);
await page.waitForTimeout(600);
await page.screenshot({ path: root + '/shot-side-corner.png' });

await browser.close();
cleanup();
console.log('저장: shot-side.png, shot-side-corner.png');
