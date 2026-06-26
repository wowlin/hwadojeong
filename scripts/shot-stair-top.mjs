// 계단 화면 — 위에서 내려다본 확대 캡처(내벽↔외벽 겹침 확인용).
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let chromium; try { ({ chromium } = await import('playwright')); } catch { console.error('no playwright'); process.exit(2); }
execSync('npm run build', { cwd: root, stdio: 'inherit' });
const port = 4191; const url = `http://127.0.0.1:${port}/`;
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
const cleanup = () => { try { srv.kill(); } catch {} }; process.on('exit', cleanup);
for (let i = 0; i < 60; i += 1) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#stageStair');
await page.waitForTimeout(700);
const setCam = (p, t) => page.evaluate(({ p, t }) => {
  const { camera, controls } = window.__cc;
  controls.target.set(t[0], t[1], t[2]); camera.position.set(p[0], p[1], p[2]); controls.update();
}, { p, t });
const shotAt = async (file, p, t) => { await setCam(p, t); await page.waitForTimeout(400); await page.screenshot({ path: root + '/scratchpad/' + file }); };
// 전체 위에서: 집 중심(4.25, 1.3), 카메라 바로 위
await shotAt('stair-top.png', [4.25, 12, 1.31], [4.25, 0, 1.3]);
// 앞쪽 모서리 확대: 내벽 앞 끝이 외벽(앞 띠)에 닿는 부분
await shotAt('stair-top-front.png', [4.25, 5.5, -0.5], [4.25, 0, -0.55]);
// 뒤쪽 모서리 확대
await shotAt('stair-top-back.png', [4.25, 5.5, 3.15], [4.25, 0, 3.1]);
// 측면 입면(거실측 저-X에서 +X 바라봄) — 내벽 앞/뒤 끝이 외벽 자리(앞 z=-0.7·뒤 z=3.3)를 넘는지 Z방향으로 확인
await shotAt('stair-side-z.png', [-6, 2.2, 1.3], [4.25, 1.4, 1.3]);
// 계단실만 위에서 확대 — 런이 양쪽 벽 안쪽 면에 붙었는지, gap 메움 사각형이 두 런 사이를 정확히 채우는지
await shotAt('stair-room-top.png', [4.25, 7.5, 1.3], [4.25, 0, 1.3]);
await browser.close(); cleanup();
console.log('saved stair-top.png / stair-top-front.png / stair-top-back.png');
