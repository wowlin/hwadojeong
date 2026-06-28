import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
execSync('npm run build', { cwd: root, stdio: 'inherit' });
const { chromium } = await import('playwright');
const port = 4184; const url = `http://127.0.0.1:${port}/`;
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
process.on('exit', () => { try { srv.kill(); } catch {} });
for (let i = 0; i < 60; i += 1) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'networkidle' });
const data = await page.evaluate(() => {
  const cc = window.__cc;
  const THREE = cc.THREE || (cc.scene && cc.scene.constructor && null);
  const boxes = [];
  cc.scene.traverse((o) => {
    if (!o.isMesh || !o.geometry || !o.geometry.parameters) return;
    const p = o.geometry.parameters;
    if (p.width == null) return;
    o.updateWorldMatrix(true, false);
    const c = new o.position.constructor();
    o.getWorldPosition(c);
    boxes.push({
      mat: o.material && o.material.name || '',
      x0: +(c.x - p.width / 2).toFixed(3), x1: +(c.x + p.width / 2).toFixed(3),
      y0: +(c.y - p.height / 2).toFixed(3), y1: +(c.y + p.height / 2).toFixed(3),
      z0: +(c.z - p.depth / 2).toFixed(3), z1: +(c.z + p.depth / 2).toFixed(3),
    });
  });
  return boxes;
});
await browser.close();
// 2층 층참 레벨 부근(y 3.5~4.3)·계단 밴드(x 0.2~2.5) 박스만
const near = data.filter((b) => b.x0 < 2.5 && b.x1 > 0.2 && b.y1 > 3.3 && b.y0 < 4.3);
near.sort((a, b) => a.y0 - b.y0 || a.z0 - b.z0);
for (const b of near) console.log(`${b.mat.padEnd(14)} x[${b.x0},${b.x1}] y[${b.y0},${b.y1}] z[${b.z0},${b.z1}]`);
console.log('--- count', near.length);
