// 버튼 검증(0-a) — 모든 컨트롤 버튼을 클릭하며 JS 런타임 에러 0 + 상호배타 규칙 위반 0 확인.
//   사용: npm run check:buttons
//   목적: 모듈 분리 리팩토링이 UI 상호작용(토글·뷰 전환)을 깨지 않았는지 자동 회귀.
// build → vite preview(임시 서버) → playwright로 버튼 전수 클릭 → 에러 수집까지 자동.
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

const port = 4179;
const url = `http://127.0.0.1:${port}/`;
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
const cleanup = () => { try { srv.kill(); } catch {} };
process.on('exit', cleanup);

for (let i = 0; i < 60; i += 1) {
  try { if ((await fetch(url)).ok) break; } catch {}
  await new Promise((r) => setTimeout(r, 200));
}

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });

const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console.error: ${m.text()}`); });

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// 컨트롤 패널의 모든 버튼 id를 DOM에서 수집(향후 버튼 추가에도 자동 대응).
const ids = await page.$$eval('.controls button', (els) => els.map((b) => b.id).filter(Boolean));
if (ids.length === 0) { console.error('버튼 0개 — 패널 선택자 확인'); cleanup(); process.exit(1); }
console.log(`버튼 ${ids.length}개 검출:`, ids.join(', '));

const isActive = (id) => page.$eval('#' + id, (b) => b.classList.contains('active'));

// 1) 전 버튼을 순차 클릭(켜기) → 다시 클릭(끄기) — 상호작용 중 런타임 에러 0 확인.
for (const id of ids) {
  await page.click('#' + id); await page.waitForTimeout(120);
}
for (const id of [...ids].reverse()) {
  await page.click('#' + id); await page.waitForTimeout(120);
}

// 2) 상호배타 규칙: 외벽(toggleWall) ↔ 폴딩(toggleFolding)은 동시 active 금지.
//    데크·썬룸을 켜 전제를 만든 뒤 둘을 차례로 눌러 동시 활성 안 됨을 확인.
const violations = [];
if (ids.includes('toggleDeck') && ids.includes('toggle썬룸') && ids.includes('toggleWall') && ids.includes('toggleFolding')) {
  await page.click('#toggleDeck'); await page.waitForTimeout(120);
  await page.click('#toggle썬룸'); await page.waitForTimeout(120);
  await page.click('#toggleWall'); await page.waitForTimeout(120);
  await page.click('#toggleFolding'); await page.waitForTimeout(120);
  if (await isActive('toggleWall') && await isActive('toggleFolding')) {
    violations.push('상호배타 위반: toggleWall·toggleFolding 동시 active');
  }
}

await browser.close();
cleanup();

const problems = [...errors, ...violations];
if (problems.length) {
  console.error('\n✗ 버튼 검증 실패:');
  for (const p of problems) console.error('  -', p);
  process.exit(1);
}
console.log('\n✓ 버튼 검증 통과 — JS 에러 0, 상호배타 위반 0');
