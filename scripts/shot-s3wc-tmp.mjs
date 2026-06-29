import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import('playwright');
execSync('npm run build', { cwd: root, stdio: 'ignore' });
const port = 4197; const url = `http://127.0.0.1:${port}/`;
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
process.on('exit', () => { try { srv.kill(); } catch {} });
for (let i = 0; i < 60; i += 1) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1300 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#tabS2'); await page.waitForTimeout(200);
for (const id of ['bF3Floor', 'bF3Stair']) { try { await page.click('#' + id); } catch {} await page.waitForTimeout(150); }
await page.waitForTimeout(400);
const setCam = (p, t) => page.evaluate(({ p, t }) => { const { camera, controls } = window.__cc; camera.up.set(0,0,1); controls.target.set(...t); camera.position.set(...p); controls.update(); }, { p, t });
await setCam([6.5, 8.5, 2.6], [6.5, 6.9, 2.6]);
await page.waitForTimeout(500);
await page.screenshot({ path: root + '/scratchpad-s3wc.png' });
await browser.close();
console.log('saved');
