import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import('playwright');
execSync('npm run build', { cwd: root, stdio: 'inherit' });
const port = 4199; const url = `http://127.0.0.1:${port}/`;
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
process.on('exit', () => { try { srv.kill(); } catch {} });
for (let i = 0; i < 60; i += 1) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1700, height: 1300 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#tabS2'); await page.waitForTimeout(200);
for (const id of ['bF1Stair', 'bF2Stair', 'bF3Stair', 'bF1Floor', 'bF2Floor', 'bF3Floor']) {
  try { await page.click('#' + id); } catch (e) { console.log('miss', id); }
  await page.waitForTimeout(120);
}
await page.waitForTimeout(400);
const setCam = (p, t) => page.evaluate(({ p, t }) => { const { camera, controls } = window.__cc; controls.target.set(...t); camera.position.set(...p); controls.update(); }, { p, t });
// 좌측(-X)에서 본 측단면 — 전 비행 계단·각 층 바닥구멍이 한눈에. 위에서부터 8·10·10·10 확인용.
await setCam([-16, 6.0, 1.4], [3.0, 6.0, 1.4]);
await page.waitForTimeout(400);
await page.screenshot({ path: root + '/shot-stairfix-secL.png' });
// Z축 따라 본 진짜 단면 — 지그재그 계단 옆모습(단 개수·착지 확인). 2→3 비행.
await page.evaluate(() => { const { camera } = window.__cc; camera.up.set(0, 1, 0); });
const setCamZ = (p, t) => page.evaluate(({ p, t }) => { const { camera, controls } = window.__cc; controls.target.set(...t); camera.position.set(...p); controls.update(); }, { p, t });
await setCamZ([2.6, 7.6, -14], [2.6, 7.6, 2.0]);
await page.waitForTimeout(400);
await page.screenshot({ path: root + '/shot-stairfix-top.png' });
await browser.close();
console.log('saved');
