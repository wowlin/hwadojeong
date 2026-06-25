// 계단 화면 전용 측면/사선 렌더 — stageStair 클릭 후 window.__cc로 시점 지정.
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
await page.click('#stageStair');
await page.waitForTimeout(800);

const setCam = (p, t) => page.evaluate(({ p, t }) => {
  const { camera, controls } = window.__cc;
  controls.target.set(t[0], t[1], t[2]);
  camera.position.set(p[0], p[1], p[2]);
  controls.update();
}, { p, t });

// 1) 측면(X축에서 -X로 봄) — 앞뒤(Z) 흐름과 높이(Y) 단면, ㄷ자 반환 프로필
await setCam([12.5, 2.6, 1.4], [4.25, 1.9, 1.4]);
await page.waitForTimeout(500);
await page.screenshot({ path: root + '/scratchpad/st-side.png' });

// 2) 앞-사선 코너(앞쪽 -Z, 우측 +X 위에서) — 사선 3단·계단참·두 곧은계단
await setCam([8.6, 2.8, -4.2], [4.25, 1.6, 1.4]);
await page.waitForTimeout(500);
await page.screenshot({ path: root + '/scratchpad/st-corner.png' });

await browser.close();
cleanup();
console.log('저장: scratchpad/st-side.png, scratchpad/st-corner.png');
