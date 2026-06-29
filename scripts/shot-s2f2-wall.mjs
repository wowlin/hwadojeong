import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import('playwright');
execSync('npm run build', { cwd: root, stdio: 'inherit' });
const port = 4194; const url = `http://127.0.0.1:${port}/`;
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
process.on('exit', () => { try { srv.kill(); } catch {} });
for (let i = 0; i < 60; i += 1) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1700, height: 1400 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#tabS2'); await page.waitForTimeout(200);
for (const id of ['bF2Floor', 'bF2Stair']) { try { await page.click('#' + id); } catch {} await page.waitForTimeout(150); }
await page.waitForTimeout(500);
const setCam = (p, t) => page.evaluate(({ p, t }) => { const { camera, controls } = window.__cc; camera.up.set(0,0,1); controls.target.set(...t); camera.position.set(...p); controls.update(); }, { p, t });
// 가로벽 라인(z 약 zB0-0.15) 부근만, 좌(高X)·우(低X) 끝 각각 확대.
// 高X(좌) 끝: x 큰 쪽. 低X(우) 끝: x 작은 쪽. 카메라는 위에서 내려다봄.
await setCam([6.7, 16, 1.5], [6.7, 4.5, 1.5]);  // 高X 끝 확대 (좌)
await page.waitForTimeout(400);
await page.screenshot({ path: root + '/shot-s2f2-highx.png' });
await setCam([1.3, 16, 1.5], [1.3, 4.5, 1.5]);  // 低X 끝 확대 (우)
await page.waitForTimeout(400);
await page.screenshot({ path: root + '/shot-s2f2-lowx.png' });
console.log('saved');
await browser.close();
