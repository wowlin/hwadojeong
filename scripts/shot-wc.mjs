// 계단하부 WC 내부 — 세면대(안방쪽)·양변기(맨안쪽)·문 스윙·온수기 공간 확인용.
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let chromium;
try { ({ chromium } = await import('playwright')); } catch { console.error('playwright 없음'); process.exit(2); }
console.log('빌드…');
execSync('npm run build', { cwd: root, stdio: 'inherit' });
const port = 4191;
const url = `http://127.0.0.1:${port}/`;
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
const cleanup = () => { try { srv.kill(); } catch {} };
process.on('exit', cleanup);
for (let i = 0; i < 60; i += 1) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });
const setCam = (p, t) => page.evaluate(({ p, t }) => {
  const { camera, controls } = window.__cc;
  controls.target.set(t[0], t[1], t[2]);
  camera.position.set(p[0], p[1], p[2]);
  controls.update();
}, { p, t });
const shotAt = async (file, p, t) => { await setCam(p, t); await page.waitForTimeout(450); await page.screenshot({ path: root + '/scratchpad/' + file }); };
await page.click('#stageFirst');
await page.waitForTimeout(700);
// 문 안쪽(z>0.74) 높은 곳에서 방 길이방향 바닥을 내려다봄 — 세면대(안방쪽 앞)·변기(맨안쪽) 한 화면
await shotAt('wc-A.png', [4.78, 2.35, 0.95], [4.95, 0.65, 2.3]);
// 안방쪽에서 거실쪽으로 가로지르며 내려다봄
await shotAt('wc-B.png', [5.22, 2.2, 1.0], [4.6, 0.66, 1.9]);
await browser.close(); cleanup();
console.log('saved wc-A / wc-B');
