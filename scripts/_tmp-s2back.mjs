import { spawn, execSync } from 'node:child_process';
const root = '/Users/aine/work/hwadojeong';
const out = '/private/tmp/claude-501/-Users-aine-work-hwadojeong/0123b31c-7348-48dc-9ccf-ac08774079f7/scratchpad';
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
await page.click('#bF1Wall'); await page.waitForTimeout(300);
const setCam = (p, t) => page.evaluate(({ p, t }) => { const { camera, controls } = window.__cc; controls.target.set(...t); camera.position.set(...p); controls.update(); }, { p, t });
// 뒤벽(z=3.3) 코앞에서 직시 — 막혔으면 평평한 벽, 열렸으면 근접 프레임
await setCam([4, 1.8, 7.5], [4, 1.8, 3.3]);
await page.waitForTimeout(600);
await page.screenshot({ path: out + '/s2w-backclose.png' });
// 뒤벽 살짝 위·옆에서 — 상단 엣지 연속성 확인
await setCam([1, 4.5, 8], [4, 1.5, 3.3]);
await page.waitForTimeout(600);
await page.screenshot({ path: out + '/s2w-backtop.png' });
await browser.close();
console.log('done');
