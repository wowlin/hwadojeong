import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import('playwright');
execSync('npm run build', { cwd: root, stdio: 'inherit' });
const port = 4193; const url = `http://127.0.0.1:${port}/`;
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
// 2층 중심 똑바로 위에서. 멀리(y=70) → 원근 거의 없는 부감. up=+Z → 앞(-Z)이 화면 아래(도면 방향).
await setCam([4.0, 70, 0.5], [4.0, 4.5, 0.5]);
await page.waitForTimeout(500);
await page.screenshot({ path: root + '/shot-s2f2-top.png' });
// 뒤쪽(계단·화장실·내벽) 구역 확대 — 벽이 외벽까지 닿는지 본다.
await setCam([4.0, 24, 2.0], [4.0, 4.5, 2.0]);
await page.waitForTimeout(500);
await page.screenshot({ path: root + '/shot-s2f2-back.png' });
console.log('saved shot-s2f2-top.png');
await browser.close();
