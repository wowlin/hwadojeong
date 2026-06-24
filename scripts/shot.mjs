// 배치도(평면) 렌더 캡처 — 위치/정렬 변경을 "눈으로" 확인하는 용도.
//   사용: npm run shot [출력경로]   (기본 ./shot.png)
//   요구: playwright + chromium 1회 설치 → npm i -D playwright && npx playwright install chromium
// build → vite preview(임시 서버) → 스크린샷 → 서버 종료까지 자동.
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || resolve(root, 'shot.png');

let chromium;
try { ({ chromium } = await import('playwright')); }
catch {
  console.error('playwright 없음 → 1회 설치: npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}

console.log('빌드…');
execSync('npm run build', { cwd: root, stdio: 'inherit' });

const port = 4178;
const url = `http://127.0.0.1:${port}/`;
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
const cleanup = () => { try { srv.kill(); } catch {} };
process.on('exit', cleanup);

for (let i = 0; i < 60; i += 1) {                       // 미리보기 서버 대기
  try { if ((await fetch(url)).ok) break; } catch {}
  await new Promise((r) => setTimeout(r, 200));
}

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(2800);                        // WebGL 렌더 안정화
await page.screenshot({ path: out });
await browser.close();
cleanup();
console.log('저장:', out);
