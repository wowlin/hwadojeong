// s2 층별 외벽 — 외벽 윗단이 윗층 바닥 슬래브 아랫면에 닿는지 확인.
//   출력: shot-s2wall-junc.png(1층 외벽+2층 바닥, 1-2 경계 줌) · shot-s2wall-junc2.png(반대쪽 줌)
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.error('playwright 없음'); process.exit(2); }

console.log('빌드…');
execSync('npm run build', { cwd: root, stdio: 'inherit' });

const port = 4186;
const url = `http://127.0.0.1:${port}/`;
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
const cleanup = () => { try { srv.kill(); } catch {} };
process.on('exit', cleanup);
for (let i = 0; i < 60; i += 1) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1300 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#tabS2'); await page.waitForTimeout(200);

const setCam = (p, t) => page.evaluate(({ p, t }) => { const { camera, controls } = window.__cc; controls.target.set(...t); camera.position.set(...p); controls.update(); }, { p, t });

// 1층 외벽 + 2층 바닥(슬래브)만 — 1층 외벽 윗단과 2층 슬래브 아랫면 사이 정렬 확인
for (const id of ['bF1Wall', 'bF2Floor']) { try { await page.click('#' + id); } catch (e) { console.log('no', id); } await page.waitForTimeout(150); }
// 1-2 경계 높이(약 지면 위 3m) 측면 줌
await setCam([10, 3.2, -9], [3, 3.0, 0.5]);
await page.waitForTimeout(600);
await page.screenshot({ path: root + '/shot-s2wall-junc.png' });

// 반대(뒤·측백쪽) 코너 줌
await setCam([-3, 3.2, -8], [3, 3.0, 1.5]);
await page.waitForTimeout(600);
await page.screenshot({ path: root + '/shot-s2wall-junc2.png' });

await browser.close();
cleanup();
console.log('저장: shot-s2wall-junc.png, shot-s2wall-junc2.png');
