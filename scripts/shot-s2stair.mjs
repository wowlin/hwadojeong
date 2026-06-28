import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import('playwright');
execSync('npm run build', { cwd: root, stdio: 'inherit' });
const port = 4182; const url = `http://127.0.0.1:${port}/`;
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
process.on('exit', () => { try { srv.kill(); } catch {} });
for (let i = 0; i < 60; i += 1) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#tabS2'); await page.waitForTimeout(200);
// s2 계단만 + 외벽 일부 켜기
for (const id of ['cS2Stair']) { try { await page.click('#' + id); } catch {} await page.waitForTimeout(120); }
await page.waitForTimeout(500);
const setCam = (p, t) => page.evaluate(({ p, t }) => { const { camera, controls } = window.__cc; controls.target.set(...t); camera.position.set(...p); controls.update(); }, { p, t });
// 위에서 내려다보기(살짝 기울임) — 계단·층참 발자국 겹침 확인
await setCam([2.0, 15, 4.0], [2.0, 3.6, -0.3]);
await page.waitForTimeout(500);
await page.screenshot({ path: root + '/shot-s2stair-side.png' });
// 1→2 계단 머리 ↔ 2층 층참 접합부 바짝 줌(계단쪽 -X, 거실바닥은 뒤로)
await setCam([-4.2, 3.95, -2.6], [1.4, 3.5, -0.55]);
await page.waitForTimeout(500);
await page.screenshot({ path: root + '/shot-s2stair-zoom.png' });
await browser.close();
console.log('saved');
