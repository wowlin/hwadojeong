import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import('playwright');
execSync('npm run build', { cwd: root, stdio: 'inherit' });
const port = 4189; const url = `http://127.0.0.1:${port}/`;
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
process.on('exit', () => { try { srv.kill(); } catch {} });
for (let i = 0; i < 60; i += 1) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1700, height: 1300 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#tabS2'); await page.waitForTimeout(200);
for (const id of ['cS2Stair']) { try { await page.click('#' + id); } catch {} await page.waitForTimeout(120); }
await page.waitForTimeout(400);
const setCam = (p, t) => page.evaluate(({ p, t }) => { const { camera, controls } = window.__cc; controls.target.set(...t); camera.position.set(...p); controls.update(); }, { p, t });
// 측면 단면 — +X에서 -X로 봄. 깊이(z)=가로, 높이(y)=세로. 뒷벽(z=3.3)·앞(z=-2.7).
// 콜A·콜B 두 런이 X로 겹쳐 지그재그 단면이 보이고, 중간참이 뒷벽 쪽 끝에 붙었는지 확인.
await setCam([22, 4.5, 0.3], [0.85, 4.5, 0.3]);
await page.waitForTimeout(400);
await page.screenshot({ path: root + '/shot-s2sec.png' });
// 뒤쪽(z=3.0 안쪽 면) 확대 — 중간참 뒷면이 바닥판 뒷면과 맞닿았는지. 위(z=back) 가장자리 줌.
await setCam([9, 5.2, 2.7], [0.85, 5.2, 2.6]);
await page.waitForTimeout(400);
await page.screenshot({ path: root + '/shot-s2sec-back.png' });
await browser.close();
console.log('saved');
