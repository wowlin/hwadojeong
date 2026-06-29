import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import('playwright');
execSync('npm run build', { cwd: root, stdio: 'inherit' });
const port = 4188; const url = `http://127.0.0.1:${port}/`;
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
process.on('exit', () => { try { srv.kill(); } catch {} });
for (let i = 0; i < 60; i += 1) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#tabS2'); await page.waitForTimeout(200);
for (const id of ['bS2StairF1']) { try { await page.click('#' + id); } catch (e) { console.log('no', id); } await page.waitForTimeout(150); }
await page.waitForTimeout(400);
const setCam = (p, t) => page.evaluate(({ p, t }) => { const { camera, controls } = window.__cc; controls.target.set(...t); camera.position.set(...p); controls.update(); }, { p, t });
// 1) 메모 패널 확인 — 우측 설계 메모에 옷장 치수가 뜨는지
await page.screenshot({ path: root + '/scratchpad-closet-front.png' });
// 2) 측면 단면 +X→-X, 1층 높이 — 계단참·하부런·공간 단면
await setCam([22, 1.6, 2.5], [0.85, 1.6, 2.5]);
await page.waitForTimeout(400);
await page.screenshot({ path: root + '/scratchpad-closet-sec.png' });
// 3) 위에서 — 풋프린트
await setCam([0.8, 12, 1.8], [0.8, 0.7, 1.8]);
await page.waitForTimeout(400);
await page.screenshot({ path: root + '/scratchpad-closet-top.png' });
await browser.close();
console.log('saved');
