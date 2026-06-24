// 시각 회귀 검증(0-b) — 전 화면을 캡처해 baseline md5와 비교. 무변경 리팩토링이면 diff 0이어야 함.
//   사용: npm run check:views           (baseline과 비교 — 불일치 시 실패)
//         npm run check:views -- --update (현재 렌더로 baseline 갱신 — 의도된 시각 변경 후에만)
//   전제(0-b-pre): textures.js 시드 고정으로 렌더가 결정적 → 동일 화면은 md5가 일치한다.
//   주의: swiftshader 렌더라 머신/드라이버가 다르면 baseline이 안 맞을 수 있음(단일 개발 환경 기준).
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = resolve(root, 'tests/baseline-views.json');
const update = process.argv.includes('--update');

// 캡처할 화면 = scene을 바꾸는 단계 버튼들(각자 깨끗한 새 로드에서 1개만 클릭).
const VIEWS = ['viewPlan', 'viewFoundation', 'toggleFrame', 'stageFloor', 'stageFirst', 'stageAttic', 'stageRoof'];

let chromium;
try { ({ chromium } = await import('playwright')); }
catch {
  console.error('playwright 없음 → 1회 설치: npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}

console.log('빌드…');
execSync('npm run build', { cwd: root, stdio: 'inherit' });

const port = 4180;
const url = `http://127.0.0.1:${port}/`;
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
const cleanup = () => { try { srv.kill(); } catch {} };
process.on('exit', cleanup);

for (let i = 0; i < 60; i += 1) {
  try { if ((await fetch(url)).ok) break; } catch {}
  await new Promise((r) => setTimeout(r, 200));
}

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });

const hashes = {};
for (const view of VIEWS) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.click('#' + view);
  await page.waitForTimeout(2800);                       // WebGL 렌더 안정화(shot.mjs와 동일)
  const buf = await page.screenshot();
  hashes[view] = createHash('md5').update(buf).digest('hex');
  await page.close();
}
await browser.close();
cleanup();

if (update || !existsSync(manifestPath)) {
  writeFileSync(manifestPath, JSON.stringify(hashes, null, 2) + '\n');
  console.log((existsSync(manifestPath) ? '갱신' : '생성') + ':', manifestPath);
  for (const v of VIEWS) console.log(`  ${v}: ${hashes[v]}`);
  process.exit(0);
}

const base = JSON.parse(readFileSync(manifestPath, 'utf8'));
const diffs = VIEWS.filter((v) => base[v] !== hashes[v]);
if (diffs.length) {
  console.error('\n✗ 시각 회귀 감지 — baseline과 다른 화면:');
  for (const v of diffs) console.error(`  - ${v}: baseline ${base[v]} ≠ 현재 ${hashes[v]}`);
  console.error('의도된 시각 변경이면: npm run check:views -- --update');
  process.exit(1);
}
console.log('\n✓ 시각 회귀 0 — 전 화면 baseline 일치');
