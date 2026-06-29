import { spawn } from 'node:child_process';
const root = '/Users/aine/work/hwadojeong';
const { chromium } = await import('playwright');
const port = 4195; const url = `http://127.0.0.1:${port}/`;
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
process.on('exit', () => { try { srv.kill(); } catch {} });
for (let i = 0; i < 60; i += 1) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1700, height: 1400 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#tabS2'); await page.waitForTimeout(200);
for (const id of ['bF2Floor', 'bF2Stair']) { try { await page.click('#' + id); } catch {} await page.waitForTimeout(150); }
await page.waitForTimeout(400);
const setCam = (p, t) => page.evaluate(({ p, t }) => { const { camera, controls } = window.__cc; camera.up.set(0,0,1); controls.target.set(...t); camera.position.set(...p); controls.update(); }, { p, t });
const dir = '/private/tmp/claude-501/-Users-aine-work-hwadojeong/86f05740-840d-425a-b2fc-1d79f04fd3ea/scratchpad';
await setCam([6.4, 26, 2.0], [6.4, 4.0, 2.0]); await page.waitForTimeout(400);
await page.screenshot({ path: dir + '/bath-top2.png' });
console.log('saved');
await browser.close();
