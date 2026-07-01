import { spawn, execSync } from 'node:child_process';
const root = '/Users/aine/work/three-house';
const out = '/private/tmp/claude-501/-Users-aine-work-three-house/967a1c79-4615-4b8e-9294-97c30f906f16/scratchpad';
const { chromium } = await import('playwright');
execSync('npm run build', { cwd: root, stdio: 'inherit' });
const port = 4192; const url = `http://127.0.0.1:${port}/`;
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
process.on('exit', () => { try { srv.kill(); } catch {} });
for (let i = 0; i < 60; i += 1) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 1100 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.click('#tabS2'); await page.waitForTimeout(200);
for (const id of ['bF1Stair','bF2Stair','bF3Stair','bF1Floor','bF2Floor','bF3Floor']) { try { await page.click('#'+id); } catch(e){} await page.waitForTimeout(120); }
await page.waitForTimeout(400);
const r = await page.evaluate(() => {
  const s = window.__cc.scene; const lands = [], floors = [];
  s.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    o.geometry.computeBoundingBox();
    const bb = o.geometry.boundingBox.clone(); bb.applyMatrix4(o.matrixWorld);
    const dy = bb.max.y - bb.min.y, dx = bb.max.x - bb.min.x, dz = bb.max.z - bb.min.z;
    const rec = { top:+bb.max.y.toFixed(3), bot:+bb.min.y.toFixed(3), x0:+bb.min.x.toFixed(2), x1:+bb.max.x.toFixed(2), z0:+bb.min.z.toFixed(2), z1:+bb.max.z.toFixed(2) };
    // 계단참: 얇은 판(0.04<dy<0.08), X폭 0.7~0.8(=계단폭 W), Z깊이 1.0~1.8(=wF 두 행)
    if (dy>0.04 && dy<0.08 && dx>0.68 && dx<0.82 && dz>0.9 && dz<1.9) lands.push(rec);
    // 바닥 슬래브: 두께 0.28~0.32, 넓은 판
    if (dy>0.28 && dy<0.32 && dx>2 && dz>2) floors.push({top:rec.top, bot:rec.bot, x0:rec.x0, x1:rec.x1});
  });
  return { lands, floors };
});
const fs = await import('node:fs');
fs.writeFileSync(out + '/landmeas.json', JSON.stringify(r, null, 1));
await browser.close();
console.log('saved');
