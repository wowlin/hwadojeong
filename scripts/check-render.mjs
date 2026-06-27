// 런타임 렌더 게이트 — 사용자가 보는 dev 서버를 그대로 띄워 '화면이 실제로 그려지는지' 검사.
//   사용: npm run check:render
//   실패(exit 1) 조건: JS 런타임 에러>0 | 캔버스 없음 | 캔버스 width/height==0(백지) | stage에 캔버스 미부착.
//   목적: 빌드·유닛테스트는 통과해도 화면이 백지인 경우(ReferenceError·캔버스 0높이)를 자동으로 잡는다.
//         → '새로고침해서 확인해' 식으로 사용자에게 검증을 떠넘기지 않게 하네스가 강제.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = 5199;
const url = `http://127.0.0.1:${port}/`;

const dev = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
const cleanup = () => { try { dev.kill(); } catch {} };
process.on('exit', cleanup);

let up = false;
for (let i = 0; i < 100; i++) {
  try { if ((await fetch(url)).ok) { up = true; break; } } catch {}
  await new Promise((r) => setTimeout(r, 200));
}
if (!up) { console.error('✗ dev 서버 기동 실패'); process.exit(1); }

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE.ERROR: ' + m.text()); });

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

const diag = await page.evaluate(() => {
  const c = document.querySelector('#stage canvas');
  return {
    hasCanvas: !!c,
    w: c ? c.width : 0,
    h: c ? c.height : 0,
    stageH: document.querySelector('#stage')?.clientHeight || 0,
    buttons: document.querySelectorAll('.sidebar button, .sidebar input').length
  };
});

await page.screenshot({ path: root + '/scratch-render-check.png' });
await browser.close();
cleanup();

const problems = [...errors];
if (!diag.hasCanvas) problems.push('stage에 canvas 없음');
if (diag.w === 0 || diag.h === 0) problems.push(`캔버스 크기 0 (w=${diag.w} h=${diag.h}, stageH=${diag.stageH}) → 화면 백지`);

if (problems.length) {
  console.error('\n✗ 렌더 게이트 실패 — 화면이 정상이 아님:');
  for (const p of problems) console.error('  - ' + p);
  console.error('  진단:', JSON.stringify(diag));
  console.error('  사용자에게 넘기지 말 것. 직접 원인 찾아 고친 뒤 재검증하라.');
  process.exit(1);
}
console.log(`✓ 렌더 게이트 통과 — 캔버스 ${diag.w}x${diag.h}, 버튼 ${diag.buttons}개, JS에러 0`);
