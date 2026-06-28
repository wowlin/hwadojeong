import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import('playwright');
execSync('npm run build', { cwd: root, stdio: 'inherit' });
const port = 4190; const url = `http://127.0.0.1:${port}/`;
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
process.on('exit', () => { try { srv.kill(); } catch {} });
for (let i = 0; i < 60; i += 1) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1700, height: 1300 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#tabS2'); await page.waitForTimeout(200);
for (const id of ['cS2Stair2']) { try { await page.click('#' + id); } catch {} await page.waitForTimeout(150); }
await page.waitForTimeout(400);
const setCam = (p, t) => page.evaluate(({ p, t }) => { const { camera, controls } = window.__cc; controls.target.set(...t); camera.position.set(...p); controls.update(); }, { p, t });
// 위에서 거의 평면 — L자(가로런+코너참)+U자 배치 확인
await setCam([2.2, 14, 0.4], [2.2, 2.5, 0.3]);
await page.waitForTimeout(400);
await page.screenshot({ path: root + '/shot-s2st2-top.png' });
// 비스듬 3D — 입체로 계단참 2개·런 구성 확인
await setCam([9.0, 7.0, 9.0], [2.4, 3.2, 0.3]);
await page.waitForTimeout(400);
await page.screenshot({ path: root + '/shot-s2st2-iso.png' });
await browser.close();
console.log('saved');
