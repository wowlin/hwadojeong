import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import('playwright');
execSync('npm run build', { cwd: root, stdio: 'inherit' });
const port = 4197; const url = `http://127.0.0.1:${port}/`;
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
process.on('exit', () => { try { srv.kill(); } catch {} });
for (let i = 0; i < 60; i += 1) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1700, height: 1400 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#tabS2'); await page.waitForTimeout(200);
for (const id of ['bF2Floor', 'bF2Stair']) { try { await page.click('#' + id); } catch {} await page.waitForTimeout(150); }
await page.waitForTimeout(500);
const setCam = (p, t, up = [0, 1, 0]) => page.evaluate(({ p, t, up }) => { const { camera, controls } = window.__cc; camera.up.set(...up); controls.target.set(...t); camera.position.set(...p); controls.update(); }, { p, t, up });
const FY = 4.08;
// 1) 앞(低Z)서 화장실 안을 비스듬히 — 문 스윙·온수기 높이·세탁기 적층
await setCam([6.0, FY + 1.4, -1.6], [6.6, FY + 0.9, 2.0]);
await page.waitForTimeout(500);
await page.screenshot({ path: root + '/scratchpad/vrf-iso.png' });
// 2) 거실쪽(低X)서 안방쪽(高X) 바라보며 수평 측면 — 온수기 벽거치 높이/세탁기/변기
await setCam([2.0, FY + 1.0, 2.0], [7.5, FY + 1.0, 2.6]);
await page.waitForTimeout(500);
await page.screenshot({ path: root + '/scratchpad/vrf-side.png' });
// 3) 뒤(高Z)서 앞 바라보며 — 변기/온수기/샤워 정면
await setCam([6.2, FY + 1.2, 6.5], [6.2, FY + 1.0, 2.0]);
await page.waitForTimeout(500);
await page.screenshot({ path: root + '/scratchpad/vrf-back.png' });
console.log('saved vrf2');
await browser.close();
