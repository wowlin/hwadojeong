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
const manifestPath = resolve(root, 'test/baseline-views.json');
const update = process.argv.includes('--update');

// 캡처할 화면 = 클릭 시퀀스(깨끗한 새 로드에서 순서대로 클릭). 이름은 id를 +로 연결.
// 현행 UI(세그 토글) 기준 — s2 기본·주요 토글 + s1 탭·주요 토글.
const VIEWS = [
  [],                                                      // 부팅 기본(s2 탭)
  ['bStair', 'bLift'],
  ['bF1Wall', 'bF2Wall', 'bF3Wall'],
  ['bF3Roof', 'bF3Solar'],
  ['bF1Foundation', 'bF1Floor', 'bF1Sink', 'bF1Stove'],
  ['tabS1'],
  ['tabS1', 'bFirstWall', 'bFirstOutlet', 'bFirstCeiling'],
  ['tabS1', 'bRoof', 'bSolar', 'bLoft', 'bAtticExtWall', 'bAtticInnerWall'],
  ['tabS1', 'bDeck', 'bFolding', 'bSunRoof', 'bFrame'],
  ['tabS1', 'bMatFull', 'bS1Stair', 'bFirstFloorFinish', 'bHedge', 'bFence'],
];
const viewName = (clicks) => clicks.length ? clicks.join('+') : 'default';

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
const cleanup = () => { try { srv.kill(); } catch { /* 기동 대기·정리 실패 무시 */ } };
process.on('exit', cleanup);

for (let i = 0; i < 60; i += 1) {
  try { if ((await fetch(url)).ok) break; } catch { /* 기동 대기·정리 실패 무시 */ }
  await new Promise((r) => setTimeout(r, 200));
}

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });

const hashes = {};
for (const clicks of VIEWS) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });   // dsf 1 — 10개 화면 연속 캡처라 swiftshader 부하 절감(해시 비교엔 배율 무관)
  await page.goto(url, { waitUntil: 'networkidle' });
  for (const id of clicks) await page.$eval('#' + id, (el) => el.click());   // JS 직접 클릭 — 탭 전환 애니메이션·가시성 대기 없이 결정적
  await page.waitForTimeout(2800);                       // WebGL 렌더 안정화(shot.mjs와 동일)
  // 카메라 감쇠(damping)가 몇 프레임 더 미세 이동시켜 md5가 실행마다 흔들림 → 캡처 직전 감쇠를 끄고 시점을 고정(결정성 확보)
  await page.evaluate(() => { const c = window.__cc.controls; c.enableDamping = false; c.update(); });
  await page.waitForTimeout(400);
  const buf = await page.screenshot({ timeout: 90000 });
  hashes[viewName(clicks)] = createHash('md5').update(buf).digest('hex');
  await page.close();
}
await browser.close();
cleanup();

const names = VIEWS.map(viewName);
if (update || !existsSync(manifestPath)) {
  writeFileSync(manifestPath, JSON.stringify(hashes, null, 2) + '\n');
  console.log((existsSync(manifestPath) ? '갱신' : '생성') + ':', manifestPath);
  for (const v of names) console.log(`  ${v}: ${hashes[v]}`);
  process.exit(0);
}

const base = JSON.parse(readFileSync(manifestPath, 'utf8'));
const diffs = names.filter((v) => base[v] !== hashes[v]);
if (diffs.length) {
  console.error('\n✗ 시각 회귀 감지 — baseline과 다른 화면:');
  for (const v of diffs) console.error(`  - ${v}: baseline ${base[v]} ≠ 현재 ${hashes[v]}`);
  console.error('의도된 시각 변경이면: npm run check:views -- --update');
  process.exit(1);
}
console.log('\n✓ 시각 회귀 0 — 전 화면 baseline 일치');
