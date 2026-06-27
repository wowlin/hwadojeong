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

// 사이드바의 모든 부품 토글(체크박스)·뷰 버튼 id를 DOM에서 수집(향후 부품 추가에도 자동 대응).
const ids = await page.$$eval('.sidebar input, .sidebar button', (els) => els.map((b) => b.id).filter(Boolean));
if (ids.length === 0) { console.error('토글 0개 — 사이드바 선택자 확인'); cleanup(); process.exit(1); }
console.log(`토글 ${ids.length}개 검출:`, ids.join(', '));

const violations = [];

// 1) 전 부품 토글·뷰 버튼을 순차 클릭(켜기) → 역순 클릭(끄기) — 상호작용 중 런타임 에러 0 확인.
for (const id of ids) {
  await page.click('#' + id); await page.waitForTimeout(80);
}
for (const id of [...ids].reverse()) {
  await page.click('#' + id); await page.waitForTimeout(80);
}

// 2) 프리셋 뷰: 현재 전체 모델(vAll)은 모든 부품 체크박스를 켜고, 배치도(vPlan)는 모두 끈다.
await page.click('#vAll'); await page.waitForTimeout(200);
const allOn = await page.$$eval('.sidebar input[type=checkbox]', (els) => els.every((c) => c.checked));
if (!allOn) violations.push('전체 모델(vAll) 클릭 후 일부 부품이 꺼져 있음');
await page.click('#vPlan'); await page.waitForTimeout(200);
const allOff = await page.$$eval('.sidebar input[type=checkbox]', (els) => els.every((c) => !c.checked));
if (!allOff) violations.push('배치도(vPlan) 클릭 후 일부 부품이 켜져 있음');

await browser.close();
cleanup();

const problems = [...errors, ...violations];
if (problems.length) {
  console.error('\n✗ 버튼 검증 실패:');
  for (const p of problems) console.error('  -', p);
  process.exit(1);
}
console.log('\n✓ 토글 검증 통과 — JS 에러 0, 프리셋(전체/배치도) 일관성 OK');
