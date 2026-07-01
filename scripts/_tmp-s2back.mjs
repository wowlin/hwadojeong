import { spawn, execSync } from 'node:child_process';
const root = '/Users/aine/work/three-house';
const out = '/private/tmp/claude-501/-Users-aine-work-three-house/967a1c79-4615-4b8e-9294-97c30f906f16/scratchpad';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { console.error('no pw'); process.exit(2); }
execSync('npm run build', { cwd: root, stdio: 'inherit' });
const port = 4188; const url = `http://127.0.0.1:${port}/`;
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
process.on('exit', () => { try { srv.kill(); } catch {} });
for (let i = 0; i < 60; i += 1) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1500, height: 1200 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#tabS2'); await page.waitForTimeout(200);
await page.click('#bF2Wall'); await page.waitForTimeout(300);   // 2층 외벽 켜기
const setCam = (p, t) => page.evaluate(({ p, t }) => { const { camera, controls } = window.__cc; controls.target.set(...t); camera.position.set(...p); controls.update(); }, { p, t });
// 뒤벽(z=3.3) 바깥에서 직시 — 2층 층계참 프로젝트창 확인 (창 X는 안방쪽 高X 근처)
await setCam([6, 4.5, 9], [6, 4.2, 3.3]);
await page.waitForTimeout(600);
await page.screenshot({ path: out + '/s2w2-backclose.png' });
// 옆·위에서 — 3층 뒤 복도창과의 정렬 확인
await setCam([2, 6, 9], [6, 4, 3.3]);
await page.waitForTimeout(600);
await page.screenshot({ path: out + '/s2w2-backtop.png' });
await browser.close();
console.log('done');
