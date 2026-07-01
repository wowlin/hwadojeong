import { spawn, execSync } from 'node:child_process';
const root = '/Users/aine/work/three-house';
const out = '/private/tmp/claude-501/-Users-aine-work-three-house/967a1c79-4615-4b8e-9294-97c30f906f16/scratchpad';
const { chromium } = await import('playwright');
execSync('npm run build', { cwd: root, stdio: 'inherit' });
const port = 4190; const url = `http://127.0.0.1:${port}/`;
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
process.on('exit', () => { try { srv.kill(); } catch {} });
for (let i = 0; i < 60; i += 1) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1700, height: 1300 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#tabS2'); await page.waitForTimeout(200);
// 계단 + 각층 바닥 슬래브 켜기
for (const id of ['bF1Stair','bF2Stair','bF3Stair','bF1Floor','bF2Floor','bF3Floor']) { try { await page.click('#'+id); } catch(e){} await page.waitForTimeout(120); }
await page.waitForTimeout(400);
// 씬에서 계단참(materials.landing)·바닥슬래브 y범위 측정
const meas = await page.evaluate(() => {
  const s = window.__cc.scene; const res = { landings: [], slabs: [] };
  s.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    o.geometry.computeBoundingBox();
    const bb = o.geometry.boundingBox.clone(); bb.applyMatrix4(o.matrixWorld);
    const name = (o.material && o.material.name) || '';
    const c = o.material && o.material.color ? o.material.color.getHexString() : '';
    const dy = bb.max.y - bb.min.y, dx = bb.max.x - bb.min.x, dz = bb.max.z - bb.min.z;
    // 계단참: 얇고(두께<0.1) 넓은 판, landing 계열 색
    if (dy < 0.1 && dx > 0.6 && dz > 0.6) res.landings.push({ topY: +bb.max.y.toFixed(3), x0:+bb.min.x.toFixed(2), x1:+bb.max.x.toFixed(2), z0:+bb.min.z.toFixed(2), z1:+bb.max.z.toFixed(2), c });
  });
  return res;
});
const fs = await import('node:fs');
fs.writeFileSync(out + '/stair-meas.json', JSON.stringify(meas, null, 1));
const setCam = (p, t) => page.evaluate(({ p, t }) => { const { camera, controls } = window.__cc; controls.target.set(...t); camera.position.set(...p); controls.update(); }, { p, t });
await setCam([22, 4.5, 0.3], [0.85, 4.5, 0.3]);
await page.waitForTimeout(400);
await page.screenshot({ path: out + '/stairsec.png' });
await browser.close();
console.log('saved');
