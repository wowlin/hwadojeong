import { spawn, execSync } from 'node:child_process';
const root = '/Users/aine/work/three-house';
const out = '/private/tmp/claude-501/-Users-aine-work-three-house/967a1c79-4615-4b8e-9294-97c30f906f16/scratchpad';
const { chromium } = await import('playwright');
execSync('npm run build', { cwd: root, stdio: 'inherit' });
const port = 4191; const url = `http://127.0.0.1:${port}/`;
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
process.on('exit', () => { try { srv.kill(); } catch {} });
for (let i = 0; i < 60; i += 1) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1300 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#tabS2'); await page.waitForTimeout(200);
// 2층·3층 외벽 켜기
for (const id of ['bF2Wall','bF3Wall']) { try { await page.click('#'+id); } catch(e){} await page.waitForTimeout(150); }
await page.waitForTimeout(400);
const setCam = (p, t) => page.evaluate(({ p, t }) => { const { camera, controls } = window.__cc; controls.target.set(...t); camera.position.set(...p); controls.update(); }, { p, t });
// 정면(−Z 앞쪽)에서 정직시 — 2층 안방 픽스창 왼끝 vs 3층 게스트룸2 정면창 왼끝 정렬 확인
await setCam([4, 5, -12], [4, 4.5, -2.7]);
await page.waitForTimeout(500);
await page.screenshot({ path: out + '/front-align.png' });
// 高X(왼쪽·안방)쪽 비스듬 — 끝선 겹침 확대
await setCam([9, 5.5, -10], [5.5, 4.3, -2.7]);
await page.waitForTimeout(500);
await page.screenshot({ path: out + '/front-align2.png' });
await browser.close();
console.log('saved');
