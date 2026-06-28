import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import('playwright');
execSync('npm run build', { cwd: root, stdio: 'inherit' });
const port = 4187; const url = `http://127.0.0.1:${port}/`;
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
process.on('exit', () => { try { srv.kill(); } catch {} });
for (let i = 0; i < 60; i += 1) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 1400 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#tabS2'); await page.waitForTimeout(200);
for (const id of ['cS2Stair']) { try { await page.click('#' + id); } catch {} await page.waitForTimeout(120); }
await page.waitForTimeout(400);
const setCam = (p, t) => page.evaluate(({ p, t }) => { const { camera, controls } = window.__cc; controls.target.set(...t); camera.position.set(...p); controls.update(); }, { p, t });
// 정면(앞=-z) 엘리베이션 — 동쪽(치수선 쪽) 정면에서 봄. 치수선은 x≈8.05·8.6, z≈-2.1.
await setCam([8.3, 5.5, -16], [8.3, 5.5, -2.1]);
await page.waitForTimeout(400);
await page.screenshot({ path: root + '/shot-s2lvl.png' });
// 라벨 줌인 — 치수선 위쪽 끝 라벨 읽기
await setCam([8.3, 5.5, -9], [8.3, 5.5, -2.1]);
await page.waitForTimeout(400);
await page.screenshot({ path: root + '/shot-s2lvl-zoom.png' });
await browser.close();
console.log('saved');
