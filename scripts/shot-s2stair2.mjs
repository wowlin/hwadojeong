import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import('playwright');
execSync('npm run build', { cwd: root, stdio: 'inherit' });
const port = 4183; const url = `http://127.0.0.1:${port}/`;
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
process.on('exit', () => { try { srv.kill(); } catch {} });
for (let i = 0; i < 60; i += 1) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#tabS2'); await page.waitForTimeout(200);
for (const id of ['cS2Stair']) { try { await page.click('#' + id); } catch {} await page.waitForTimeout(120); }
await page.waitForTimeout(400);
// 거의 직교 측면(+X에서 -X로) — 좁은 FOV로 원근 최소화. 2층 도착부 줌.
const setCam = (p, t, fov) => page.evaluate(({ p, t, fov }) => {
  const { camera, controls } = window.__cc;
  controls.target.set(...t); camera.position.set(...p);
  if (fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  controls.update();
}, { p, t, fov });
await setCam([40, 3.5, -1.0], [0, 3.5, -1.0], 9);
await page.waitForTimeout(400);
await page.screenshot({ path: root + '/shot-s2stair-ortho.png' });
// 2층 바닥 가장자리에서 3층으로 올라가는 첫 단 junction 확대(정측면)
await setCam([40, 4.15, -0.4], [0, 4.15, -0.4], 6);
await page.waitForTimeout(400);
await page.screenshot({ path: root + '/shot-s2stair-junc2.png' });
// 중간참 junction(뒤, 1→2층) 확대 — 비교용
await setCam([40, 1.8, 1.7], [0, 1.8, 1.7], 7);
await page.waitForTimeout(400);
await page.screenshot({ path: root + '/shot-s2stair-juncMid.png' });
// 디딤판 바로 위에 바닥판(landing)이 덮였는지 장면에서 직접 측정
const headroom = await page.evaluate(() => {
  const cc = window.__cc; const THREE = cc.THREE; const root = cc.scene;
  const vis = (o) => { let p = o; while (p) { if (p.visible === false) return false; p = p.parent; } return true; };
  const meshes = [];
  root.traverse((o) => { if (o.isMesh && vis(o)) meshes.push(o); });   // 실제 렌더되는(보이는) 부재만
  const boxes = meshes.map((m) => { const b = new THREE.Box3().setFromObject(m); return { b, name: m.name, color: m.material && m.material.color && m.material.color.getHexString() }; }).filter((x) => isFinite(x.b.min.x));
  // 위쪽 런 디딤판: 보라(d9cffb=stair) 얇은 판, 2층 도착 부근(y 3.0~4.1)
  const treads = boxes.filter((x) => x.color === 'd9cffb' && (x.b.max.y - x.b.min.y) < 0.12 && x.b.max.y > 3.0 && x.b.max.y < 4.1);
  const ov = (a, b) => Math.max(0, Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x)) * Math.max(0, Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z));
  const out = [];
  for (const t of treads) {
    const topY = t.b.max.y;
    let cover = null;   // 발자국이 겹치면서 위에 있는 박스 중 가장 낮은 것
    for (const o of boxes) {
      if (o === t) continue;
      if (o.b.min.y >= topY - 0.005 && ov(t.b, o.b) > 0.02) {
        if (!cover || o.b.min.y < cover.minY) cover = { minY: o.b.min.y, color: o.color, area: +ov(t.b, o.b).toFixed(2) };
      }
    }
    out.push({ z: +((t.b.min.z + t.b.max.z) / 2).toFixed(2), topY: +topY.toFixed(2), headroom: cover ? +(cover.minY - topY).toFixed(2) : null, coverColor: cover ? cover.color : null, overlapArea: cover ? cover.area : null });
  }
  out.sort((a, b) => b.topY - a.topY);
  // 2층 전이부: levels[1]≈4.08 주변 디딤판(d9cffb)·바닥판(ffd166)을 lane·z로 나열
  const near = boxes.filter((x) => (x.color === 'd9cffb' || x.color === 'ffd166') && x.b.max.y > 3.7 && x.b.max.y < 4.5)
    .map((x) => ({ kind: x.color === 'ffd166' ? '바닥/참' : '디딤', lane: x.b.min.x < 1.35 ? 'A(거실측)' : 'B', x0: +x.b.min.x.toFixed(2), x1: +x.b.max.x.toFixed(2), z0: +x.b.min.z.toFixed(2), z1: +x.b.max.z.toFixed(2), top: +x.b.max.y.toFixed(2) }))
    .sort((a, b) => a.top - b.top || a.z0 - b.z0);
  return { headroom: out, near };
});
console.log('HEADROOM', JSON.stringify(headroom.headroom, null, 0));
console.log('NEAR2F', JSON.stringify(headroom.near, null, 0));
await browser.close();
console.log('saved');
