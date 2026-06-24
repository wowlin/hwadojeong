// 측면 시점 렌더 캡처 — 높이/폭 차이를 '눈으로' 보기 위한 용도(평면 shot으로는 높이가 안 보임).
//   사용: npm run shot:side
//   출력: shot-side.png(측면 전체) + shot-side-corner.png(좌측 앞 코너 줌)
// 바닥틀(toggleFrame) 뷰에서 시점을 측면으로 크게 기울이고, 코너로 당겨 두 장 찍는다.
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

let chromium;
try { ({ chromium } = await import('playwright')); }
catch {
  console.error('playwright 없음 → 1회 설치: npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}

console.log('빌드…');
execSync('npm run build', { cwd: root, stdio: 'inherit' });

const port = 4181;
const url = `http://127.0.0.1:${port}/`;
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
const cleanup = () => { try { srv.kill(); } catch {} };
process.on('exit', cleanup);
for (let i = 0; i < 60; i += 1) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#toggleFrame');                       // 바닥틀 뷰(계단틀이 보이는 단계)
await page.waitForTimeout(800);

const box = await page.locator('#stage canvas').boundingBox();
const cx = box.x + box.width / 2, cy = box.y + box.height / 2;

// 1) 시점을 측면으로 크게 기울임(위에서 본 평면 → 옆에서 봐 높이가 보이게)
await page.mouse.move(cx, cy);
await page.mouse.down();
await page.mouse.move(cx, cy + 820, { steps: 40 });
await page.mouse.up();
await page.waitForTimeout(500);
await page.screenshot({ path: root + '/shot-side.png' });

// 2) 좌측 앞 코너(부채꼴 계단)로 팬 이동 + 줌인
await page.mouse.move(cx, cy);
await page.mouse.down({ button: 'right' });
await page.mouse.move(cx - 200, cy - 220, { steps: 20 });
await page.mouse.up({ button: 'right' });
await page.waitForTimeout(300);
await page.mouse.move(cx, cy);
for (let i = 0; i < 6; i += 1) { await page.mouse.wheel(0, -120); await page.waitForTimeout(80); }
await page.waitForTimeout(900);
await page.screenshot({ path: root + '/shot-side-corner.png' });

await browser.close();
cleanup();
console.log('저장: shot-side.png, shot-side-corner.png');
