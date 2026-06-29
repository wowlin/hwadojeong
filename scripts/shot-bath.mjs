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
const page = await browser.newPage({ viewport: { width: 1700, height: 1300 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#tabS2'); await page.waitForTimeout(200);
for (const id of ['cS2Stair3']) { try { await page.click('#' + id); } catch {} await page.waitForTimeout(150); }
await page.waitForTimeout(400);
const setCam = (p, t) => page.evaluate(({ p, t }) => { const { camera, controls } = window.__cc; controls.target.set(...t); camera.position.set(...p); controls.update(); }, { p, t });
// 高x(왼쪽)·뒤(측백) 코너 바깥에서 비스듬히 — 2·3층 화장실 바닥색 적층 확인(계단3엔 벽 없음)
await setCam([14, 9, 9], [6.5, 5.0, 1.5]);
await page.waitForTimeout(400);
await page.screenshot({ path: root + '/shot-bath-iso.png' });
// 더 수평·근접 — 2층/3층 바닥 마커를 층 사이 개방고로 들여다봄
await setCam([13, 6.5, 6.5], [6.6, 5.6, 1.8]);
await page.waitForTimeout(400);
await page.screenshot({ path: root + '/shot-bath-side.png' });
await browser.close();
console.log('saved');
