// 계단 화면 측면 — 다락 바닥(30cm 고정)과 양쪽 내벽 윗면 맞물림 확인. 기본 + 계단 높임 비교.
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let chromium;
try { ({ chromium } = await import('playwright')); } catch { console.error('playwright 없음'); process.exit(2); }
console.log('빌드…');
execSync('npm run build', { cwd: root, stdio: 'inherit' });
const port = 4185;
const url = `http://127.0.0.1:${port}/`;
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
const cleanup = () => { try { srv.kill(); } catch {} };
process.on('exit', cleanup);
for (let i = 0; i < 60; i += 1) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#cStair');
await page.waitForTimeout(700);

const setCam = (p, t) => page.evaluate(({ p, t }) => {
  const { camera, controls } = window.__cc;
  controls.target.set(t[0], t[1], t[2]);
  camera.position.set(p[0], p[1], p[2]);
  controls.update();
}, { p, t });

// 다락 바닥 앞부분(laneB, Z≈insideZ0)과 벽 윗면 맞물림을 측면(거실측 저-X에서 +X)으로
const shotAt = async (file) => {
  await setCam([ -7, 2.6, 0.2 ], [ 4.3, 2.8, 0.4 ]);
  await page.waitForTimeout(400);
  await page.screenshot({ path: root + '/scratchpad/' + file });
};

// 1) 기본(R=0.18, N=15)
await shotAt('st-default.png');

// 2) 계단 높임: 단높이 0.22로 → 전체 높아짐. 바닥 두께는 30cm 유지, 벽이 따라 높아져야.
await page.fill('#sp_r', '0.22');
await page.dispatchEvent('#sp_r', 'input');
await page.waitForTimeout(500);
await shotAt('st-tall.png');

// 3) 계단 낮춤: 단높이 0.15 → 전체 낮아짐. 벽도 낮아져야.
await page.fill('#sp_r', '0.15');
await page.dispatchEvent('#sp_r', 'input');
await page.waitForTimeout(500);
await shotAt('st-short.png');

await browser.close();
cleanup();
console.log('저장: st-default.png, st-tall.png, st-short.png');
