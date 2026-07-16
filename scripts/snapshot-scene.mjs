// 스냅샷 가드(리팩토링 §5-1) — scene 전체 부재의 이름·좌표·치수(기하 해시)·재질·그룹 귀속·가시성을
//   JSON으로 덤프해 기준 스냅샷과 기계 비교. 무변경 리팩토링이면 diff=0이어야 함.
//   사용: npm run check:scene            (기준과 비교 — 불일치 시 exit 1)
//         npm run check:scene -- --update (현재 상태로 기준 갱신 — 의도된 변경 후에만)
//   좌표·수치는 1e-6 반올림 — 값을 파생식으로 바꿀 때의 이진 부동소수 오차(~1e-15)를 흡수.
//   가시성은 부팅 직후(s2 탭)와 s1 탭 전환 후 두 번 캡처(vis·vis2).
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = resolve(root, 'test/baseline-scene.json');
const update = process.argv.includes('--update');

const port = 5198;
const url = `http://127.0.0.1:${port}/`;
const dev = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
const cleanup = () => { try { dev.kill(); } catch { /* 이미 종료 */ } };
process.on('exit', cleanup);

let up = false;
for (let i = 0; i < 100; i++) {
  try { if ((await fetch(url)).ok) { up = true; break; } } catch { /* 기동 대기 */ }
  await new Promise((r) => setTimeout(r, 200));
}
if (!up) { console.error('✗ dev 서버 기동 실패'); process.exit(1); }

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const snap = await page.evaluate(async () => {
  const groupsMod = await import('/src/groups.js');
  const { scene } = window.__cc;

  const r6 = (v) => { const x = Math.round(v * 1e6) / 1e6; return Object.is(x, -0) ? 0 : x; };
  const fnv = (str) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16);
  };

  // 기하 서명 — 타입 + position 정점 전체(1e-6 반올림) + index 해시. 파라미터 종류와 무관하게 균일.
  const geomSig = (geo) => {
    if (!geo) return null;
    const pos = geo.getAttribute && geo.getAttribute('position');
    let s = geo.type + ':' + (pos ? pos.count : 0);
    if (pos) {
      const parts = [];
      for (let i = 0; i < pos.array.length; i++) parts.push(r6(pos.array[i]));
      s += ':' + fnv(parts.join(','));
    }
    const idx = geo.getIndex && geo.getIndex();
    if (idx) s += ':i' + fnv(Array.prototype.join.call(idx.array, ','));
    return s;
  };

  // 재질 서명 — 타입·색·투명도·면·캔버스 텍스처(라벨 텍스트) 해시. clone된 재질도 값이 같으면 동일 서명.
  const matOne = (m) => {
    const col = m.color ? m.color.getHexString() : '';
    let map = '';
    const img = m.map && m.map.image;
    if (img && img.toDataURL) { try { map = fnv(img.toDataURL()); } catch { map = 'x'; } }
    return [m.type, col, r6(m.opacity ?? 1), m.transparent ? 1 : 0, m.side ?? '', m.depthWrite ? 1 : 0, map].join(',');
  };
  const matSig = (m) => !m ? null : (Array.isArray(m) ? m.map(matOne).join('|') : matOne(m));

  // 그룹 귀속 — groups.js의 모든 배열 export를 uuid → 'group#index' 목록으로 역인덱스.
  const membership = new Map();
  const orphans = [];
  for (const [gname, arr] of Object.entries(groupsMod)) {
    if (!Array.isArray(arr)) continue;
    arr.forEach((o, i) => {
      if (!o || !o.uuid) { orphans.push(`${gname}#${i}:비객체`); return; }
      if (!membership.has(o.uuid)) membership.set(o.uuid, []);
      membership.get(o.uuid).push(`${gname}#${i}`);
    });
  }

  const seen = new Set();
  const entries = [];
  const walk = (o, path) => {
    seen.add(o.uuid);
    const e = {
      path,
      type: o.type,
      name: o.name || '',
      pos: [r6(o.position.x), r6(o.position.y), r6(o.position.z)],
      quat: [r6(o.quaternion.x), r6(o.quaternion.y), r6(o.quaternion.z), r6(o.quaternion.w)],
      scale: [r6(o.scale.x), r6(o.scale.y), r6(o.scale.z)],
      vis: o.visible ? 1 : 0,
      cast: o.castShadow ? 1 : 0,
      recv: o.receiveShadow ? 1 : 0,
      ro: o.renderOrder || 0,
      geo: geomSig(o.geometry),
      mat: matSig(o.material),
      groups: (membership.get(o.uuid) || []).slice().sort()
    };
    if (o.isLight) e.light = [o.color ? o.color.getHexString() : '', r6(o.intensity)];
    entries.push(e);
    o.children.forEach((c, i) => walk(c, path + '/' + i));
  };
  scene.children.forEach((c, i) => walk(c, String(i)));

  // 그룹 배열에 있는데 scene 그래프에 없는 객체 — 유령 귀속 검출.
  for (const [gname, arr] of Object.entries(groupsMod)) {
    if (!Array.isArray(arr)) continue;
    arr.forEach((o, i) => { if (o && o.uuid && !seen.has(o.uuid)) orphans.push(`${gname}#${i}:${o.type}:${o.name || ''}`); });
  }

  // s1 탭 전환 후 가시성 2차 캡처 — 탭별 게이팅 회귀 검출.
  const tab = document.querySelector('#tabS1');
  if (tab) tab.click();
  await new Promise((r) => setTimeout(r, 300));
  let k = 0;
  const walkVis = (o) => { entries[k++].vis2 = o.visible ? 1 : 0; o.children.forEach(walkVis); };
  scene.children.forEach(walkVis);

  return { entries, orphans: orphans.sort() };
});

await browser.close();
cleanup();

if (errors.length) {
  console.error('✗ 페이지 JS 에러 — 스냅샷 무효:');
  for (const e of errors) console.error('  ' + e);
  process.exit(1);
}

const out = JSON.stringify({ count: snap.entries.length, orphans: snap.orphans, entries: snap.entries }, null, 0)
  .replace(/\{"path"/g, '\n{"path"');

if (update || !existsSync(baselinePath)) {
  writeFileSync(baselinePath, out + '\n');
  console.log(`기준 스냅샷 저장: ${baselinePath} (부재 ${snap.entries.length}개, 고아 ${snap.orphans.length}건)`);
  if (snap.orphans.length) for (const o of snap.orphans) console.log('  고아: ' + o);
  process.exit(0);
}

const base = JSON.parse(readFileSync(baselinePath, 'utf8'));
const diffs = [];
if (base.count !== snap.entries.length) diffs.push(`부재 수: 기준 ${base.count} ≠ 현재 ${snap.entries.length}`);
if (JSON.stringify(base.orphans) !== JSON.stringify(snap.orphans)) diffs.push(`고아 목록 변화: ${JSON.stringify(base.orphans)} → ${JSON.stringify(snap.orphans)}`);
const n = Math.min(base.entries.length, snap.entries.length);
for (let i = 0; i < n && diffs.length < 40; i++) {
  const a = base.entries[i]; const b = snap.entries[i];
  const sa = JSON.stringify(a); const sb = JSON.stringify(b);
  if (sa !== sb) {
    const fields = Object.keys(b).filter((f) => JSON.stringify(a[f]) !== JSON.stringify(b[f]));
    diffs.push(`[${b.path}] ${b.type} "${b.name}" 필드 ${fields.join(',')}: ${fields.map((f) => `${JSON.stringify(a[f])}→${JSON.stringify(b[f])}`).join(' | ')}`);
  }
}
if (diffs.length) {
  console.error(`✗ 스냅샷 diff ${diffs.length}건+ — 화면 불변 원칙 위반:`);
  for (const d of diffs) console.error('  - ' + d);
  console.error('의도된 변경(§5-11 표시 버그 수리 등)이면: npm run check:scene -- --update');
  process.exit(1);
}
console.log(`✓ 스냅샷 diff=0 — 부재 ${snap.entries.length}개 전부 기준과 일치`);
