// s2 층별 외벽 확인 — 1·2·3층 외벽 버튼을 켜 측면에서 수직 연결을 본다.
//   출력: shot-s2wall-all.png(세 층 다 켬) · shot-s2wall-13.png(1·3층만 — 2층 자리 빈 띠 보임)
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.error('playwright 없음'); process.exit(2); }

console.log('빌드…');
execSync('npm run build', { cwd: root, stdio: 'inherit' });

const port = 4185;
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

// 세 층 외벽 모두 켜기
for (const id of ['bF1Wall', 'bF2Wall', 'bF3Wall']) { try { await page.click('#' + id); } catch (e) { console.log('no', id); } await page.waitForTimeout(150); }
await setCam([19, 7, -16], [4, 5, 0.5]);
await page.waitForTimeout(600);
await page.screenshot({ path: root + '/shot-s2wall-all.png' });

// 2층 외벽만 끄기 → 2층 자리 빈 띠가 보여 층 경계(연결) 확인
await page.click('#bF2Wall'); await page.waitForTimeout(200);
await page.screenshot({ path: root + '/shot-s2wall-13.png' });

await browser.close();
cleanup();
console.log('저장: shot-s2wall-all.png, shot-s2wall-13.png');
