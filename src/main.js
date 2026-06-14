import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './styles.css';

const app = document.querySelector('#app');
app.innerHTML = `
  <main class="shell">
    <section class="stage-wrap">
      <div id="stage" aria-label="주말주택 3D 개념 모형"></div>
    </section>
    <aside class="panel">
      <div class="controls">
        <button id="viewFirst" type="button">1층<span class="btn-sub">아세만빌드</span><span class="btn-sub btn-sub-xs">1588-5152</span></button>
        <button id="viewSecond" type="button">+다락</button>
        <button id="viewAll" type="button">+지붕<span class="btn-sub">태연남</span><span class="btn-sub btn-sub-xs">010-4567-2450</span></button>
        <div class="row-break"></div>
        <button id="toggleDeck" type="button" class="toggle">데크<span class="btn-sub">우드24</span><span class="btn-sub btn-sub-xs">1644-6472</span></button>
        <button id="togglePergola" type="button" class="toggle">파고라<span class="btn-sub">치악지붕건축</span><span class="btn-sub btn-sub-xs">0507-1332-8754</span></button>
        <button id="toggleWall" type="button" class="toggle">외벽<span class="btn-sub">주식회사 단우</span><span class="btn-sub btn-sub-xs">1811-8179</span><span class="btn-sub btn-sub-xs">010-5382-8179</span></button>
        <button id="toggleAccessory" type="button" class="toggle">악세사리</button>
      </div>
    </aside>
  </main>
`;

const stage = document.querySelector('#stage');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf7f4ee);

const camera = new THREE.PerspectiveCamera(42, stage.clientWidth / stage.clientHeight, 0.1, 100);
camera.position.set(10.8, 6.8, -8.8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(stage.clientWidth, stage.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(4.55, 2.55, 0.65);
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 4;
controls.maxDistance = 24;

const secondFloorObjects = [];
const roofObjects = [];
const deckObjects = [];      // 데크 바닥·계단(데크 토글)
const pergolaObjects = [];   // 파고라 구조물: 지붕·기둥·프레임·팬·조명·치수(파고라 토글)
const wallObjects = [];      // 파고라 외벽: 다누몰 자바라 폴딩창(외벽 토글 — 시공 업체 별도)
const extrasObjects = [];    // 소품: 의자·그릴·화분(전체일 때만 표시)

const materials = {
  site: new THREE.MeshLambertMaterial({ color: 0xe9efe0 }),
  yard: new THREE.MeshLambertMaterial({ color: 0x76a96b }),
  road: new THREE.MeshLambertMaterial({ color: 0xcfd8e3 }),
  hedge: new THREE.MeshLambertMaterial({ color: 0x2f7d45 }),
  foundation: new THREE.MeshLambertMaterial({ color: 0xb8b8ad }),
  dimension: new THREE.MeshLambertMaterial({ color: 0x111827 }),
  wall: new THREE.MeshLambertMaterial({ color: 0xffffff }),
  wallSide: new THREE.MeshLambertMaterial({ color: 0x9f917f }),
  exteriorWall: new THREE.MeshLambertMaterial({ color: 0xe4ded2, transparent: true, opacity: 0.58, depthWrite: false }),
  wallTop: new THREE.MeshLambertMaterial({ color: 0x8f8374 }),
  living: new THREE.MeshLambertMaterial({ color: 0xfff3c4 }),
  bed: new THREE.MeshLambertMaterial({ color: 0xbed8ff }),
  bath: new THREE.MeshLambertMaterial({ color: 0xbff3ef }),
  toilet: new THREE.MeshLambertMaterial({ color: 0xcbd34a }),
  vanity: new THREE.MeshLambertMaterial({ color: 0x99a13a }),
  shower: new THREE.MeshLambertMaterial({ color: 0xcbd34a }),
  stair: new THREE.MeshLambertMaterial({ color: 0xd9cffb }),
  stairFront: new THREE.MeshLambertMaterial({ color: 0xdfeecf }),
  hall: new THREE.MeshLambertMaterial({ color: 0xeeeeee }),
  landing: new THREE.MeshLambertMaterial({ color: 0xffd166 }),
  stairWall: new THREE.MeshLambertMaterial({ color: 0xf2f0e8 }),
  guard: new THREE.MeshLambertMaterial({ color: 0x374151 }),
  sinkCabinet: new THREE.MeshLambertMaterial({ color: 0xd8c7a4 }),
  counter: new THREE.MeshLambertMaterial({ color: 0xf8fafc }),
  sinkBasin: new THREE.MeshLambertMaterial({ color: 0xb7c7d7 }),
  entry: new THREE.MeshLambertMaterial({ color: 0xffdfbd }),
  deck: new THREE.MeshLambertMaterial({ color: 0xcaa46a }),
  door: new THREE.MeshLambertMaterial({ color: 0x31a354 }),
  interiorDoor: new THREE.MeshLambertMaterial({ color: 0x7a4f32 }),
  pocketDoor: new THREE.MeshLambertMaterial({ color: 0x8b5f3d }),
  entryDoor: new THREE.MeshLambertMaterial({ color: 0x4f3422 }),
  entryFrame: new THREE.MeshLambertMaterial({ color: 0x2f343a }),
  handle: new THREE.MeshLambertMaterial({ color: 0xd4af37 }),
  glass: new THREE.MeshLambertMaterial({ color: 0x9ed0e8, transparent: true, opacity: 0.55 }),
  interiorGlassWall: new THREE.MeshLambertMaterial({ color: 0xd7e6e3, transparent: true, opacity: 0.32, depthWrite: false }),
  openingEdge: new THREE.MeshLambertMaterial({ color: 0x8f6f35 }),
  gable: new THREE.MeshLambertMaterial({ color: 0xf8fafc, side: THREE.DoubleSide }),
  roof: new THREE.MeshLambertMaterial({ color: 0x6f7782, side: THREE.DoubleSide }),
  roofEdge: new THREE.MeshLambertMaterial({ color: 0x515966, side: THREE.DoubleSide })
};

// 파쇄석(앞마당) 질감: 베이스 위에 밝고 어두운 점을 뿌려 자갈처럼 보이게 한다.
function makeGravelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#a8a499';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i += 1) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = Math.random() * 2.4 + 0.5;
    const base = 120 + Math.random() * 95;
    ctx.fillStyle = `rgb(${base}, ${Math.max(0, base - 6)}, ${Math.max(0, base - 18)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(11, 5);
  return texture;
}
materials.gravel = new THREE.MeshLambertMaterial({ map: makeGravelTexture() });

// 합성목(WPC) 데크 — 길이방향 널(板) + 미세 우드그레인. 캐노피 썬룸 바닥용.
function makeCompositeDeckTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const plankCount = 6;                       // 가로 6장 널
  const plankW = 256 / plankCount;
  for (let p = 0; p < plankCount; p += 1) {
    const shade = 92 + (p % 2) * 8 + Math.random() * 6;   // 널마다 살짝 다른 톤
    ctx.fillStyle = `rgb(${shade}, ${Math.round(shade * 0.74)}, ${Math.round(shade * 0.5)})`;
    ctx.fillRect(p * plankW, 0, plankW, 256);
    // 우드그레인(세로결)
    for (let g = 0; g < 26; g += 1) {
      const gx = p * plankW + Math.random() * plankW;
      const gl = Math.round(shade + (Math.random() * 18 - 9));
      ctx.strokeStyle = `rgba(${gl}, ${Math.round(gl * 0.72)}, ${Math.round(gl * 0.48)}, 0.5)`;
      ctx.lineWidth = Math.random() * 1.1 + 0.3;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx + (Math.random() * 6 - 3), 256);
      ctx.stroke();
    }
    // 널 사이 음영 홈(gap)
    ctx.fillStyle = 'rgba(20, 14, 8, 0.55)';
    ctx.fillRect(p * plankW, 0, 2, 256);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}
materials.compositeDeck = new THREE.MeshLambertMaterial({ map: makeCompositeDeckTexture() });

scene.add(new THREE.HemisphereLight(0xffffff, 0xc4b49a, 2.1));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(5, 9, -6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0001;
sun.shadow.normalBias = 0.035;
sun.shadow.camera.left = -10;
sun.shadow.camera.right = 10;
sun.shadow.camera.top = 10;
sun.shadow.camera.bottom = -10;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 24;
scene.add(sun);

function box({ x, z, w, d, h = 0.08, y = 0, mat, name, cast = true, receive = true }) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x + w / 2, y + h / 2, z + d / 2);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  mesh.name = name || '';
  scene.add(mesh);
  return mesh;
}

function addGeometryEdges(mesh, color = 0x6f6254) {
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry, 20),
    new THREE.LineBasicMaterial({ color })
  );
  edges.position.copy(mesh.position);
  edges.quaternion.copy(mesh.quaternion);
  edges.scale.copy(mesh.scale);
  scene.add(edges);
  return edges;
}

function stairWallTopCap({ x, z, w, d, topY }) {
  return box({
    x,
    z,
    w,
    d,
    y: topY,
    h: 0.018,
    mat: materials.wallTop,
    cast: false,
    receive: true
  });
}

function railCylinder(start, end, radius = 0.035, cast = false) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const direction = new THREE.Vector3().subVectors(b, a);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 10);
  const mesh = new THREE.Mesh(geometry, materials.guard);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = cast;
  mesh.receiveShadow = false;
  scene.add(mesh);
  return mesh;
}

function lerpPoint(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  ];
}

function addStairRailingSegment(startBase, endBase, {
  height = 0.95,
  postSpacing = 0.55,
  balusterSpacing = 0.18,
  sideOffset = 0
} = {}) {
  const start = [startBase[0] + sideOffset, startBase[1], startBase[2]];
  const end = [endBase[0] + sideOffset, endBase[1], endBase[2]];
  const horizontalLength = Math.hypot(end[0] - start[0], end[2] - start[2]);
  const postCount = Math.max(2, Math.ceil(horizontalLength / postSpacing) + 1);
  const balusterCount = Math.max(2, Math.ceil(horizontalLength / balusterSpacing) + 1);

  const handStart = [start[0], start[1] + height, start[2]];
  const handEnd = [end[0], end[1] + height, end[2]];
  const midStart = [start[0], start[1] + height * 0.55, start[2]];
  const midEnd = [end[0], end[1] + height * 0.55, end[2]];

  railCylinder(handStart, handEnd, 0.035);
  railCylinder(midStart, midEnd, 0.018);

  for (let i = 0; i < postCount; i += 1) {
    const t = postCount === 1 ? 0 : i / (postCount - 1);
    const base = lerpPoint(start, end, t);
    railCylinder([base[0], base[1], base[2]], [base[0], base[1] + height, base[2]], 0.028);
  }

  for (let i = 1; i < balusterCount - 1; i += 1) {
    const t = i / (balusterCount - 1);
    const base = lerpPoint(start, end, t);
    railCylinder([base[0], base[1] + 0.08, base[2]], [base[0], base[1] + height - 0.08, base[2]], 0.012);
  }
}

function yzWallPrism({ x, points, thickness = 0.08, mat }) {
  const vertices = [];
  for (const [z, y] of points) vertices.push(x, y, z);
  for (const [z, y] of points) vertices.push(x + thickness, y, z);

  const n = points.length;
  const indices = [];
  for (let i = 1; i < n - 1; i += 1) indices.push(0, i, i + 1);
  for (let i = 1; i < n - 1; i += 1) indices.push(n, n + i + 1, n + i);
  for (let i = 0; i < n; i += 1) {
    const next = (i + 1) % n;
    indices.push(i, next, n + next, i, n + next, n + i);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  const faceIndexCount = (n - 2) * 3;
  geometry.clearGroups();
  geometry.addGroup(0, faceIndexCount * 2, 0);
  geometry.addGroup(faceIndexCount * 2, n * 6, 1);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, [mat, materials.wallSide]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  addGeometryEdges(mesh);
  return mesh;
}

function gableEndWallWithWindow({
  x,
  z,
  d,
  y,
  rise,
  thickness = 0.08,
  mat,
  windowZ,
  windowW,
  windowBottomY,
  windowH,
  sashSide = 1
}) {
  const z0 = z;
  const z1 = z + d;
  const zMid = z + d / 2;
  const y0 = y;
  const y1 = y + rise;
  const halfD = d / 2;
  const windowZ0 = windowZ - windowW / 2;
  const windowZ1 = windowZ + windowW / 2;
  const windowTopY = windowBottomY + windowH;
  const topAt = (itemZ) => y0 + rise * Math.max(0, 1 - Math.abs(itemZ - zMid) / halfD);
  const zAtHeight = (itemY, side) => {
    const t = Math.max(0, Math.min(1, (itemY - y0) / rise));
    return zMid + side * halfD * (1 - t);
  };
  const leftAtBottom = zAtHeight(windowBottomY, -1);
  const rightAtBottom = zAtHeight(windowBottomY, 1);

  yzWallPrism({
    x,
    thickness,
    mat,
    points: [
      [z0, y0],
      [z1, y0],
      [rightAtBottom, windowBottomY],
      [leftAtBottom, windowBottomY]
    ]
  });
  yzWallPrism({
    x,
    thickness,
    mat,
    points: [
      [leftAtBottom, windowBottomY],
      [windowZ0, windowBottomY],
      [windowZ0, topAt(windowZ0)]
    ]
  });
  yzWallPrism({
    x,
    thickness,
    mat,
    points: [
      [windowZ1, windowBottomY],
      [rightAtBottom, windowBottomY],
      [windowZ1, topAt(windowZ1)]
    ]
  });
  yzWallPrism({
    x,
    thickness,
    mat,
    points: [
      [windowZ0, windowTopY],
      [windowZ1, windowTopY],
      [windowZ1, topAt(windowZ1)],
      [zMid, y1],
      [windowZ0, topAt(windowZ0)]
    ]
  });

  gableEndWallThicknessCap({ x0: x, x1: x + thickness, z0, zMid, z1, y0, y1, mat: materials.wallTop });
  sideSash(x + (sashSide > 0 ? thickness + 0.04 : 0), windowZ0, windowW, windowBottomY, windowH);
}

function gableEndWallThicknessCap({ x0, x1, z0, zMid, z1, y0, y1, mat }) {
  const lift = 0.008;
  const strips = [
    [
      x0, y0 + lift, z0,
      x1, y0 + lift, z0,
      x1, y1 + lift, zMid,
      x0, y1 + lift, zMid
    ],
    [
      x0, y0 + lift, z1,
      x0, y1 + lift, zMid,
      x1, y1 + lift, zMid,
      x1, y0 + lift, z1
    ]
  ];

  for (const strip of strips) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(strip), 3));
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
}

function roofRiseAtZ(z) {
  const ridgeZ = buildingFrontZ + buildingD / 2;
  const halfDepth = buildingD / 2;
  return roofSlopeTan * Math.max(0, halfDepth - Math.abs(z - ridgeZ));
}

function slopedWallTopCap({ x, z0, z1, y0, y1, thickness, mat }) {
  const lift = 0.006;
  const vertices = new Float32Array([
    x, y0 + lift, z0,
    x + thickness, y0 + lift, z0,
    x + thickness, y1 + lift, z1,
    x, y1 + lift, z1
  ]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function wallEndThicknessFace({ x, z, y, topY, thickness, mat, offset = 0 }) {
  const faceZ = z + offset;
  const vertices = new Float32Array([
    x, y, faceZ,
    x + thickness, y, faceZ,
    x + thickness, topY, faceZ,
    x, topY, faceZ
  ]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function gableLongWallX({ x, z, d, y, baseH, thickness = 0.08, mat }) {
  const x0 = x;
  const x1 = x + thickness;
  const z0 = z;
  const z1 = z + d;
  const ridgeZ = buildingFrontZ + buildingD / 2;
  const topStops = [z0];
  if (ridgeZ > z0 && ridgeZ < z1) topStops.push(ridgeZ);
  topStops.push(z1);

  const profile = [
    [z0, y],
    [z1, y],
    ...topStops.reverse().map((itemZ) => [itemZ, y + baseH + roofRiseAtZ(itemZ)])
  ];
  const vertices = [];
  for (const [itemZ, itemY] of profile) vertices.push(x0, itemY, itemZ);
  for (const [itemZ, itemY] of profile) vertices.push(x1, itemY, itemZ);

  const n = profile.length;
  const indices = [];
  for (let i = 1; i < n - 1; i += 1) indices.push(0, i, i + 1);
  for (let i = 1; i < n - 1; i += 1) indices.push(n, n + i + 1, n + i);
  for (let i = 0; i < n; i += 1) {
    const next = (i + 1) % n;
    indices.push(i, next, n + next, i, n + next, n + i);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  const faceIndexCount = (n - 2) * 3;
  geometry.clearGroups();
  geometry.addGroup(0, faceIndexCount * 2, 0);
  geometry.addGroup(faceIndexCount * 2, n * 6, 1);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, [mat, materials.wallSide]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  addGeometryEdges(mesh);
  wallEndThicknessFace({
    x,
    z: z0,
    y,
    topY: y + baseH + roofRiseAtZ(z0),
    thickness,
    mat: materials.wallTop,
    offset: -0.006
  });
  wallEndThicknessFace({
    x,
    z: z1,
    y,
    topY: y + baseH + roofRiseAtZ(z1),
    thickness,
    mat: materials.wallTop,
    offset: 0.006
  });

  const capStops = [z0];
  if (ridgeZ > z0 && ridgeZ < z1) capStops.push(ridgeZ);
  capStops.push(z1);
  for (let i = 0; i < capStops.length - 1; i += 1) {
    const startZ = capStops[i];
    const endZ = capStops[i + 1];
    slopedWallTopCap({
      x,
      z0: startZ,
      z1: endZ,
      y0: y + baseH + roofRiseAtZ(startZ),
      y1: y + baseH + roofRiseAtZ(endZ),
      thickness,
      mat: materials.wallTop
    });
  }

  return mesh;
}

function roofSlab({ eaveZ, ridgeZ, eaveY, ridgeY, sideOverhang, thickness, mat }) {
  const x0 = -sideOverhang;
  const x1 = buildingW + sideOverhang;
  const vertices = new Float32Array([
    x0, eaveY, eaveZ,
    x1, eaveY, eaveZ,
    x1, ridgeY, ridgeZ,
    x0, ridgeY, ridgeZ,
    x0, eaveY - thickness, eaveZ,
    x1, eaveY - thickness, eaveZ,
    x1, ridgeY - thickness, ridgeZ,
    x0, ridgeY - thickness, ridgeZ
  ]);
  const indices = [
    0, 1, 2, 0, 2, 3,
    4, 6, 5, 4, 7, 6,
    0, 4, 5, 0, 5, 1,
    3, 2, 6, 3, 6, 7,
    0, 3, 7, 0, 7, 4,
    1, 5, 6, 1, 6, 2
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.clearGroups();
  geometry.addGroup(0, 12, 0);
  geometry.addGroup(12, 24, 1);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, [mat, materials.roofEdge]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function flatPoly({ points, y, h = 0.08, mat, name, cast = true, receive = true }) {
  const vertices = [];
  for (const [x, z] of points) vertices.push(x, y, z);
  for (const [x, z] of points) vertices.push(x, y + h, z);
  const n = points.length;
  const indices = [];
  for (let i = 1; i < n - 1; i += 1) indices.push(0, i, i + 1);
  for (let i = 1; i < n - 1; i += 1) indices.push(n, n + i + 1, n + i);
  for (let i = 0; i < n; i += 1) {
    const next = (i + 1) % n;
    indices.push(i, next, n + next, i, n + next, n + i);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  mesh.name = name || '';
  scene.add(mesh);
  return mesh;
}

function label(text, x, y, z, size = 0.32) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 768;
  canvas.height = 192;
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#111827';
  const lines = String(text).split('\n');                      // '\n'으로 여러 줄 지원
  let fontSize = 62;
  const widest = () => Math.max(...lines.map((l) => ctx.measureText(l).width));
  ctx.font = `800 ${fontSize}px Apple SD Gothic Neo, Noto Sans KR, Arial`;
  while ((widest() > canvas.width * 0.9 || fontSize * 1.18 * lines.length > canvas.height * 0.92) && fontSize > 30) {
    fontSize -= 2;
    ctx.font = `800 ${fontSize}px Apple SD Gothic Neo, Noto Sans KR, Arial`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lineH = fontSize * 1.18;
  const startY = canvas.height / 2 - lineH * (lines.length - 1) / 2;
  lines.forEach((l, i) => ctx.fillText(l, canvas.width / 2, startY + i * lineH));
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
  const readableSize = Math.max(size, 0.28);
  sprite.position.set(x, y, z);
  sprite.scale.set(readableSize * 4.8, readableSize * 1.2, 1);
  scene.add(sprite);
  return sprite;
}

function lowWall(x, z, w, d, y = 0.08, h = 0.7, mat = materials.wall) {
  return box({ x, z, w, d, y, h, mat });
}

function horizontalWallWithGaps(x, z, w, y, gaps = [], h = 0.7, thickness = 0.08, mat = materials.wall) {
  let cursor = x;
  const sortedGaps = gaps
    .map(([start, end]) => [Math.max(x, start), Math.min(x + w, end)])
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0]);

  for (const [start, end] of sortedGaps) {
    if (start > cursor) lowWall(cursor, z, start - cursor, thickness, y, h, mat);
    cursor = Math.max(cursor, end);
  }
  if (cursor < x + w) lowWall(cursor, z, x + w - cursor, thickness, y, h, mat);
}

function verticalWallWithGaps(x, z, d, y, gaps = [], h = 0.7, thickness = 0.08, mat = materials.wall) {
  let cursor = z;
  const sortedGaps = gaps
    .map(([start, end]) => [Math.max(z, start), Math.min(z + d, end)])
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0]);

  for (const [start, end] of sortedGaps) {
    if (start > cursor) lowWall(x, cursor, thickness, start - cursor, y, h, mat);
    cursor = Math.max(cursor, end);
  }
  if (cursor < z + d) lowWall(x, cursor, thickness, z + d - cursor, y, h, mat);
}

function room({ x, z, w, d, y, mat, text, surfaceH = 0.02 }) {
  box({ x, z, w, d, y: y - surfaceH, h: surfaceH, mat, cast: false });
  label(text, x + w / 2, y + 0.16, z + d / 2, 0.3);
}

function roomText(name, w, d) {
  return `${name} ${Number(w.toFixed(2))}x${Number(d.toFixed(2))}m`;
}

function interiorDoorHorizontal(x, z, y, w = interiorDoorW, h = interiorDoorH) {
  box({ x, z: z - 0.03, w, d: 0.06, y, h, mat: materials.interiorDoor });
  box({ x: x + w - 0.18, z: z - 0.06, w: 0.05, d: 0.035, y: y + Math.min(1.02, h * 0.58), h: 0.05, mat: materials.handle });
}

function pocketDoorHorizontal(x, z, y, w = interiorDoorW, h = interiorDoorH, slideDir = 1) {
  const pocketW = w;
  const trackX = slideDir > 0 ? x : x - pocketW;
  const panelX = slideDir > 0 ? x + w + 0.04 : x - pocketW + 0.04;
  const panelW = Math.max(0.12, pocketW - 0.08);
  box({ x: trackX, z: z - 0.055, w: w + pocketW, d: 0.03, y: y + h + 0.03, h: 0.035, mat: materials.entryFrame });
  box({ x: panelX, z: z - 0.035, w: panelW, d: 0.045, y, h, mat: materials.pocketDoor });
  box({ x: panelX + (slideDir > 0 ? 0.08 : panelW - 0.13), z: z - 0.065, w: 0.05, d: 0.03, y: y + Math.min(0.95, h * 0.5), h: 0.05, mat: materials.handle });
  box({ x, z: z - 0.065, w, d: 0.02, y: y + 0.08, h: 0.035, mat: materials.openingEdge });
}

function pocketDoorVertical(x, z, y, h = interiorDoorH, slideDir = 1) {
  const pocketD = interiorDoorW;
  const trackZ = slideDir > 0 ? z : z - pocketD;
  const panelZ = slideDir > 0 ? z + interiorDoorW + 0.04 : z - pocketD + 0.04;
  const panelD = Math.max(0.12, pocketD - 0.08);
  box({ x: x - 0.055, z: trackZ, w: 0.03, d: interiorDoorW + pocketD, y: y + h + 0.03, h: 0.035, mat: materials.entryFrame });
  box({ x: x - 0.035, z: panelZ, w: 0.045, d: panelD, y, h, mat: materials.pocketDoor });
  box({ x: x - 0.065, z: panelZ + (slideDir > 0 ? 0.08 : panelD - 0.13), w: 0.03, d: 0.05, y: y + Math.min(0.95, h * 0.5), h: 0.05, mat: materials.handle });
  box({ x: x - 0.065, z, w: 0.02, d: interiorDoorW, y: y + 0.08, h: 0.035, mat: materials.openingEdge });
}

function entryDoor(x, z, outerW, leafW, y) {
  const frameW = (outerW - leafW) / 2;
  const doorH = 2.1;
  const frameH = 2.18;
  box({ x, z: z - 0.02, w: frameW, d: 0.12, y, h: frameH, mat: materials.entryFrame });
  box({ x: x + outerW - frameW, z: z - 0.02, w: frameW, d: 0.12, y, h: frameH, mat: materials.entryFrame });
  box({ x, z: z - 0.02, w: outerW, d: 0.12, y: y + doorH, h: frameH - doorH, mat: materials.entryFrame });
  box({ x: x + frameW, z, w: leafW, d: 0.08, y, h: doorH, mat: materials.entryDoor });
  box({ x: x + frameW + leafW - 0.18, z: z - 0.035, w: 0.06, d: 0.04, y: y + 1.02, h: 0.06, mat: materials.handle });
}

function frontSash(x, z, w, sillY, h) {
  const frame = 0.05;
  const glassZ = z - 0.035;
  box({ x, z: z - 0.04, w: frame, d: 0.1, y: sillY, h, mat: materials.entryFrame });
  box({ x: x + w - frame, z: z - 0.04, w: frame, d: 0.1, y: sillY, h, mat: materials.entryFrame });
  box({ x, z: z - 0.04, w, d: 0.1, y: sillY, h: frame, mat: materials.entryFrame });
  box({ x, z: z - 0.04, w, d: 0.1, y: sillY + h - frame, h: frame, mat: materials.entryFrame });
  box({ x: x + w / 2 - frame / 2, z: z - 0.04, w: frame, d: 0.1, y: sillY, h, mat: materials.entryFrame });
  box({ x: x + frame, z: glassZ, w: w - frame * 2, d: 0.04, y: sillY + frame, h: h - frame * 2, mat: materials.glass });
}

function sideSash(x, z, d, sillY, h) {
  const frame = 0.05;
  const frameX = x - 0.04;
  const glassX = x - 0.035;
  box({ x: frameX, z, w: 0.1, d: frame, y: sillY, h, mat: materials.entryFrame });
  box({ x: frameX, z: z + d - frame, w: 0.1, d: frame, y: sillY, h, mat: materials.entryFrame });
  box({ x: frameX, z, w: 0.1, d, y: sillY, h: frame, mat: materials.entryFrame });
  box({ x: frameX, z, w: 0.1, d, y: sillY + h - frame, h: frame, mat: materials.entryFrame });
  box({ x: frameX, z: z + d / 2 - frame / 2, w: 0.1, d: frame, y: sillY, h, mat: materials.entryFrame });
  box({ x: glassX, z: z + frame, w: 0.04, d: d - frame * 2, y: sillY + frame, h: h - frame * 2, mat: materials.glass });
}

function openingEdge(x, z, w, d, y) {
  box({ x, z, w, d, y: y + 0.14, h: 0.035, mat: materials.openingEdge });
}

function captureSecond(fn) {
  const start = scene.children.length;
  const result = fn();
  secondFloorObjects.push(...scene.children.slice(start));
  return result;
}

// Orientation contract for every future edit and answer:
// Use the plan as displayed with the entrance/deck at the bottom.
// Plan-left = family room. Plan-right = living+kitchen.
// Bottom = front/yard/entrance. Top = rear wall/stair-back wall.
// Do not reinterpret plan-left/plan-right by camera angle or viewer position.
const buildingW = 8.5;
const buildingFrontZ = -0.7;
const buildingBackZ = 3.3;
const buildingD = buildingBackZ - buildingFrontZ;
const groundTopY = 0.08;
const foundationHeight = 0.5;
const firstFloorY = groundTopY + foundationHeight;
const foundationTopY = firstFloorY;

box({ x: -1.1, z: buildingFrontZ - 4.3, w: 11.8, d: buildingD + 6.1, h: 0.08, mat: materials.site, cast: false });
box({ x: -1.1, z: buildingFrontZ - 4.3, w: 10.4, d: 4.3, h: 0.09, mat: materials.gravel, cast: false });
box({ x: 8.75, z: buildingFrontZ - 1.15, w: 1.1, d: buildingD + 2.4, h: 0.1, mat: materials.road, cast: false });
box({ x: -1.1, z: buildingBackZ + 0.35, w: 10.95, d: 1.0, h: 0.1, mat: materials.road, cast: false });
box({ x: 0, z: buildingFrontZ, w: buildingW, d: buildingD, y: groundTopY, h: foundationHeight, mat: materials.foundation });
box({ x: 0, z: buildingBackZ + 0.18, w: buildingW, d: 0.035, y: foundationTopY + 0.02, h: 0.035, mat: materials.dimension });
box({ x: 0, z: buildingBackZ + 0.08, w: 0.035, d: 0.27, y: foundationTopY + 0.02, h: 0.035, mat: materials.dimension });
box({ x: buildingW - 0.035, z: buildingBackZ + 0.08, w: 0.035, d: 0.27, y: foundationTopY + 0.02, h: 0.035, mat: materials.dimension });
label('기초 가로 8.5m', buildingW / 2, foundationTopY + 0.3, buildingBackZ + 0.5, 0.34);
box({ x: buildingW + 0.18, z: buildingFrontZ, w: 0.035, d: buildingD, y: foundationTopY + 0.02, h: 0.035, mat: materials.dimension });
box({ x: buildingW + 0.08, z: buildingFrontZ, w: 0.27, d: 0.035, y: foundationTopY + 0.02, h: 0.035, mat: materials.dimension });
box({ x: buildingW + 0.08, z: buildingBackZ - 0.035, w: 0.27, d: 0.035, y: foundationTopY + 0.02, h: 0.035, mat: materials.dimension });
label('기초 세로 4.0m', buildingW + 0.58, foundationTopY + 0.3, buildingFrontZ + buildingD / 2, 0.34);

// 1F measured plan. Dimensions are in meters within an 8.5m x 4.0m footprint.
const firstWallY = firstFloorY;
const firstWallHeight = 2.6;
const exteriorWall = 0.2;
const interiorWall = 0.1;
const insideX0 = exteriorWall;
const insideZ0 = buildingFrontZ + exteriorWall;
const insideX1 = buildingW - exteriorWall;
const insideZ1 = buildingBackZ - exteriorWall;
const insideD = insideZ1 - insideZ0;
const layoutD = insideD;
const stairRunW = 1.0;
const stairGap = interiorWall;
const stairClearW = stairRunW * 2 + stairGap;
const sideRoomW = (insideX1 - insideX0 - stairClearW - interiorWall * 2) / 2;
const sideRoomD = layoutD;
const stairClearX = insideX0 + sideRoomW + interiorWall;
const stairLowXRunX = stairClearX;
const stairHighXRunX = stairLowXRunX + stairRunW + stairGap;
const stairLowXWallX = stairClearX - interiorWall;
const stairHighXWallX = stairClearX + stairClearW;
const stairHighXClearX = stairHighXWallX + interiorWall;
// World x is mirrored in the front camera. With the entrance at the bottom,
// plan-left/family is the larger x side and plan-right/living is the smaller x side.
const planRightLivingX = insideX0;
const planLeftFamilyX = stairHighXClearX;
const firstLivingW = sideRoomW;
const firstLivingD = sideRoomD;
const firstFamilyW = sideRoomW;
const firstFamilyD = sideRoomD;
const firstLivingX = planRightLivingX;
const firstFamilyX = planLeftFamilyX;
const entryDoorLeafW = 0.9;
const entryFrameOuterW = 1.0;
const entryGapStart = stairClearX + (stairClearW - entryFrameOuterW) / 2;
const entryFrameH = 2.18;
const entryGapEnd = entryGapStart + entryFrameOuterW;
const interiorDoorW = 0.9;
const interiorDoorH = 2.1;
const familyDoorZ = insideZ0;
const yardSashW = 2.35;
const yardSashH = 2.1;
const yardDeckH = 0.08;
const yardSashSillY = firstFloorY + yardDeckH;
const sideWindowSillY = firstFloorY + 0.9;
const sideWindowH = 1.2;
const secondFloorThickness = 0.15;
const secondWallHeight = 1.15;
const roofSlopeDeg = 33;
const roofSlopeTan = Math.tan(THREE.MathUtils.degToRad(roofSlopeDeg));
const gableRise = roofSlopeTan * (buildingD / 2);
const roofThickness = 0.26;
const stairRiserCount = 16;
const lowerStraightTreadCount = 6;
const winderTreadCount = 3;
const upperStraightTreadCount = stairRiserCount - 1 - lowerStraightTreadCount - winderTreadCount;
const stairTreadDepth = 0.27;
const stairTurnD = stairRunW;
const stairTurnStart = insideZ1 - stairTurnD;
const stairFirstRunStart = stairTurnStart - stairTreadDepth * lowerStraightTreadCount;
const stairOpeningStart = stairTurnStart - stairTreadDepth * upperStraightTreadCount;
const stairBottomLandingD = stairOpeningStart - insideZ0;
const stairFirstRunEnd = stairTurnStart;
const stairBathX = stairHighXRunX;
const stairBathZ = stairFirstRunStart;
const stairBathW = stairRunW;
const stairBathD = stairFirstRunEnd - stairFirstRunStart;
const stairBathDoorW = interiorDoorW;
const stairBathDoorX = stairBathX + (stairBathW - stairBathDoorW) / 2;
const stairBathDoorEndX = stairBathDoorX + stairBathDoorW;
const stairBathDoorH = interiorDoorH;
const stairBathWallH = firstWallHeight;
const floorSurfaceH = 0.02;
const floorOverlayLift = 0.002;
const livingYardSashX = firstLivingX + (firstLivingW - yardSashW) / 2;
const familyYardSashX = firstFamilyX + (firstFamilyW - yardSashW) / 2;
const yardSashTopY = yardSashSillY + yardSashH;
const entryDoorBaseY = firstWallY + yardDeckH;
const livingRearWindowW = 2.35;
const livingRearWindowX = firstLivingX + (firstLivingW - livingRearWindowW) / 2;
const livingRearWindowSillY = firstFloorY + 1.15;
const livingRearWindowH = 0.75;
const livingRearWindowTopY = livingRearWindowSillY + livingRearWindowH;
const familyRearWindowW = 1.8;
const familyRearWindowX = firstFamilyX + (firstFamilyW - familyRearWindowW) / 2;
const familyRearWindowSillY = firstFloorY + 0.9;
const familyRearWindowH = 1.2;
const familyRearWindowTopY = familyRearWindowSillY + familyRearWindowH;
// 거실 후면 창 — 가족방 후면 창과 동일 규격
const livingBackWindowW = familyRearWindowW;
const livingBackWindowX = firstLivingX + (firstLivingW - livingBackWindowW) / 2;
const livingBackWindowSillY = familyRearWindowSillY;
const livingBackWindowH = familyRearWindowH;
const livingBackWindowTopY = livingBackWindowSillY + livingBackWindowH;
const kitchenSinkW = 2.2;
const kitchenSinkD = 0.6;
const kitchenSinkH = 0.85;
const kitchenSinkX = insideX0;   // 오른쪽(저X) 외벽에 붙임
const kitchenSinkZ = insideZ1 - kitchenSinkD;   // 싱크대는 뒤쪽 벽으로(앞 입구 확보), 창문은 전면 유지
const familyRoadWindowW = 1.8;
const familyRoadWindowZ = insideZ0 + (firstFamilyD - familyRoadWindowW) / 2;
const sideWindowTopY = sideWindowSillY + sideWindowH;
const secondRoom2X = stairHighXClearX;
const secondRoom2W = insideX1 - secondRoom2X;
const secondCorridorX = insideX0;
const secondCorridorZ = insideZ0;
const secondCorridorW = insideX1 - insideX0;
const secondCorridorD = stairBottomLandingD;
const secondAtticWallZ = secondCorridorZ + secondCorridorD;
const secondAtticZ = secondAtticWallZ + interiorWall;
const secondAtticD = insideZ1 - secondAtticZ;
const secondAtticFrontWallH = secondWallHeight + roofRiseAtZ(secondAtticWallZ);
const secondAtticDoorH = 1.8;
const secondRoom1DoorX = planRightLivingX + (sideRoomW - interiorDoorW) / 2;
const secondRoom2DoorX = secondRoom2X + (secondRoom2W - interiorDoorW) / 2;
const secondCorridorWindowW = 1.8;
const secondCorridorWindowH = 0.45;
const secondCorridorWindowSillOffset = 0.42;
const secondCorridorWindowTopOffset = secondCorridorWindowSillOffset + secondCorridorWindowH;
const secondCorridorWindow1X = planRightLivingX + (sideRoomW - secondCorridorWindowW) / 2;
const secondCorridorWindow2X = secondRoom2X + (secondRoom2W - secondCorridorWindowW) / 2;
const atticRearWindowW = 2.0;
const atticRearWindowH = 0.45;
const atticRearWindowSillOffset = 0.42;
const atticRearWindowTopOffset = atticRearWindowSillOffset + atticRearWindowH;
const atticRoom1RearWindowX = planRightLivingX + (sideRoomW - atticRearWindowW) / 2;
const atticRoom2RearWindowX = secondRoom2X + (secondRoom2W - atticRearWindowW) / 2;
const frontCornerDimX = buildingW + 0.04;
const frontCornerDimZ = buildingBackZ + 0.12;
const frontCornerDimTickX = buildingW - 0.16;
// 높이 치수 라벨은 세로 치수 막대(frontCornerDim*)가 있는 평면 왼쪽(도로 쪽, 높은 X) 뒤쪽
// 모서리 바깥에 나란히 붙여, 치수 막대와 라벨이 같은 모서리에 모이게 한다.
const frontCornerDimLabelX = buildingW + 0.62;
const frontCornerDimLabelZ = frontCornerDimZ;
const sideGableWindowW = 1.0;
const sideGableWindowH = 0.5;
const sideGableWindowSillOffset = 0.35;

box({ x: frontCornerDimX, z: frontCornerDimZ, w: 0.035, d: 0.035, y: firstWallY, h: firstWallHeight, mat: materials.dimension });
box({ x: frontCornerDimTickX, z: frontCornerDimZ, w: 0.35, d: 0.035, y: firstWallY, h: 0.035, mat: materials.dimension });
box({ x: frontCornerDimTickX, z: frontCornerDimZ, w: 0.35, d: 0.035, y: firstWallY + firstWallHeight - 0.035, h: 0.035, mat: materials.dimension });
label('1층 높이 2.6m', frontCornerDimLabelX, firstWallY + firstWallHeight / 2, frontCornerDimLabelZ, 0.32);

room({ x: firstLivingX, z: insideZ0, w: firstLivingW, d: firstLivingD, y: firstFloorY + floorOverlayLift, mat: materials.living, text: roomText('거실+주방', firstLivingW, firstLivingD) });
box({ x: kitchenSinkX, z: kitchenSinkZ, w: kitchenSinkW, d: kitchenSinkD, y: firstFloorY, h: kitchenSinkH, mat: materials.sinkCabinet });
box({ x: kitchenSinkX, z: kitchenSinkZ, w: kitchenSinkW, d: kitchenSinkD, y: firstFloorY + kitchenSinkH, h: 0.05, mat: materials.counter });
box({ x: kitchenSinkX + 0.62, z: kitchenSinkZ + 0.16, w: 0.72, d: 0.32, y: firstFloorY + kitchenSinkH + 0.05, h: 0.04, mat: materials.sinkBasin });
box({ x: kitchenSinkX + 1.03, z: kitchenSinkZ + 0.08, w: 0.08, d: 0.08, y: firstFloorY + kitchenSinkH + 0.09, h: 0.24, mat: materials.entryFrame });
label(`싱크대 ${Number(kitchenSinkW.toFixed(2))}x${Number(kitchenSinkD.toFixed(2))}m`, kitchenSinkX + kitchenSinkW / 2, firstFloorY + 1.2, kitchenSinkZ + kitchenSinkD / 2, 0.26);
box({ x: stairClearX, z: insideZ0, w: stairClearW, d: stairBottomLandingD, y: firstFloorY + floorOverlayLift - floorSurfaceH, h: floorSurfaceH, mat: materials.stairFront, cast: false });
label(`계단 앞 ${Number(stairClearW.toFixed(2))}x${Number(stairBottomLandingD.toFixed(2))}m`, stairClearX + stairClearW / 2, firstFloorY + floorOverlayLift + 0.18, insideZ0 + stairBottomLandingD * 0.72, 0.3);
box({ x: stairLowXWallX, z: insideZ0, w: interiorWall, d: insideD, y: firstFloorY + floorOverlayLift - floorSurfaceH, h: floorSurfaceH, mat: materials.stairFront, cast: false });
room({ x: stairBathX, z: stairBathZ, w: stairBathW, d: stairBathD, y: firstFloorY + floorOverlayLift + 0.006, mat: materials.bath, text: roomText('계단하부 WC', stairBathW, stairBathD), surfaceH: 0.018 });
label(roomText('계단하부 WC', stairBathW, stairBathD), stairBathDoorX + stairBathDoorW / 2, firstFloorY + stairBathDoorH / 2, stairBathZ - 0.12, 0.26);
box({ x: stairBathX + 0.1, z: stairBathZ + 0.18, w: 0.32, d: 0.34, y: firstFloorY, h: 0.72, mat: materials.vanity });
box({ x: stairBathX + 0.14, z: stairBathZ + 0.23, w: 0.24, d: 0.22, y: firstFloorY + 0.72, h: 0.04, mat: materials.sinkBasin });
box({ x: stairBathX + 0.64, z: stairBathZ + 0.14, w: 0.28, d: 0.5, y: firstFloorY, h: 0.035, mat: materials.shower });
box({ x: stairBathX + 0.76, z: stairBathZ + 0.21, w: 0.05, d: 0.05, y: firstFloorY + 1.15, h: 0.05, mat: materials.entryFrame });
box({ x: stairBathX + 0.28, z: stairBathZ + stairBathD - 0.62, w: 0.44, d: 0.5, y: firstFloorY, h: 0.34, mat: materials.toilet });
box({ x: stairBathX + 0.25, z: stairBathZ + stairBathD - 0.14, w: 0.5, d: 0.1, y: firstFloorY, h: 0.58, mat: materials.toilet });
box({ x: stairClearX, z: stairOpeningStart, w: stairClearW, d: insideZ1 - stairOpeningStart, y: firstFloorY + floorOverlayLift - floorSurfaceH, h: floorSurfaceH, mat: materials.stair, cast: false });
room({ x: firstFamilyX, z: insideZ0, w: firstFamilyW, d: firstFamilyD, y: firstFloorY + floorOverlayLift, mat: materials.bed, text: roomText('가족방', firstFamilyW, firstFamilyD) });

// 1F walls
horizontalWallWithGaps(0, buildingFrontZ, 8.5, firstWallY, [
  [livingBackWindowX, livingBackWindowX + livingBackWindowW],
  [familyYardSashX, familyYardSashX + yardSashW],
  [entryGapStart, entryGapEnd]
], firstWallHeight, exteriorWall, materials.exteriorWall);
// 거실 전면: 싱크대가 뒤로 가서 전면엔 일반 창(가족방 스타일)
lowWall(livingBackWindowX, buildingFrontZ, livingBackWindowW, exteriorWall, firstWallY, livingBackWindowSillY - firstWallY, materials.exteriorWall);
lowWall(livingBackWindowX, buildingFrontZ, livingBackWindowW, exteriorWall, livingBackWindowTopY, firstWallY + firstWallHeight - livingBackWindowTopY, materials.exteriorWall);
lowWall(familyYardSashX, buildingFrontZ, yardSashW, exteriorWall, yardSashTopY, firstWallY + firstWallHeight - yardSashTopY, materials.exteriorWall);
lowWall(entryGapStart, buildingFrontZ, entryFrameOuterW, exteriorWall, entryDoorBaseY + entryFrameH, firstWallY + firstWallHeight - entryDoorBaseY - entryFrameH, materials.exteriorWall);
// 후면 벽: 거실은 싱크대용 창(전면에서 이동), 가족방 후면 창
horizontalWallWithGaps(0, insideZ1, buildingW, firstWallY, [
  [livingRearWindowX, livingRearWindowX + livingRearWindowW],
  [familyRearWindowX, familyRearWindowX + familyRearWindowW]
], firstWallHeight, exteriorWall, materials.exteriorWall);
lowWall(livingRearWindowX, insideZ1, livingRearWindowW, exteriorWall, firstWallY, livingRearWindowSillY - firstWallY, materials.exteriorWall);
lowWall(livingRearWindowX, insideZ1, livingRearWindowW, exteriorWall, livingRearWindowTopY, firstWallY + firstWallHeight - livingRearWindowTopY, materials.exteriorWall);
lowWall(familyRearWindowX, insideZ1, familyRearWindowW, exteriorWall, firstWallY, familyRearWindowSillY - firstWallY, materials.exteriorWall);
lowWall(familyRearWindowX, insideZ1, familyRearWindowW, exteriorWall, familyRearWindowTopY, firstWallY + firstWallHeight - familyRearWindowTopY, materials.exteriorWall);
lowWall(0, buildingFrontZ, exteriorWall, buildingD, firstWallY, firstWallHeight, materials.exteriorWall);
verticalWallWithGaps(insideX1, buildingFrontZ, buildingD, firstWallY, [
  [familyRoadWindowZ, familyRoadWindowZ + familyRoadWindowW]
], firstWallHeight, exteriorWall, materials.exteriorWall);
lowWall(insideX1, familyRoadWindowZ, exteriorWall, familyRoadWindowW, firstWallY, sideWindowSillY - firstWallY, materials.exteriorWall);
lowWall(insideX1, familyRoadWindowZ, exteriorWall, familyRoadWindowW, sideWindowTopY, firstWallY + firstWallHeight - sideWindowTopY, materials.exteriorWall);
// 가족방 내벽 — 반투명(불투명 유리 파티션)으로 화장실 내부가 비쳐 보이게 함
verticalWallWithGaps(stairHighXWallX, insideZ0, insideD, firstWallY, [
  [familyDoorZ, familyDoorZ + interiorDoorW]
], firstWallHeight, interiorWall, materials.interiorGlassWall);
lowWall(stairHighXWallX, familyDoorZ, interiorWall, interiorDoorW, firstWallY + interiorDoorH, firstWallHeight - interiorDoorH, materials.interiorGlassWall);
horizontalWallWithGaps(stairBathX, stairBathZ, stairBathW, firstWallY, [
  [stairBathDoorX, stairBathDoorEndX]
], stairBathWallH, interiorWall, materials.stairWall);
lowWall(stairBathDoorX, stairBathZ, stairBathDoorW, interiorWall, firstWallY + stairBathDoorH, stairBathWallH - stairBathDoorH, materials.stairWall);
frontSash(livingBackWindowX, buildingFrontZ - 0.04, livingBackWindowW, livingBackWindowSillY, livingBackWindowH); // 거실 전면 창(가족방 스타일)
entryDoor(entryGapStart, buildingFrontZ - 0.04, entryFrameOuterW, entryDoorLeafW, entryDoorBaseY);
frontSash(familyYardSashX, buildingFrontZ - 0.04, yardSashW, yardSashSillY, yardSashH);
frontSash(livingRearWindowX, insideZ1 + 0.04, livingRearWindowW, livingRearWindowSillY, livingRearWindowH); // 싱크대용 창(후면)
frontSash(familyRearWindowX, insideZ1 + 0.04, familyRearWindowW, familyRearWindowSillY, familyRearWindowH);
sideSash(insideX1 + 0.04, familyRoadWindowZ, familyRoadWindowW, sideWindowSillY, sideWindowH);
interiorDoorHorizontal(stairBathDoorX, stairBathZ, firstFloorY, stairBathDoorW, stairBathDoorH);
pocketDoorVertical(stairHighXWallX, familyDoorZ, firstFloorY, interiorDoorH, 1);

const secondY = firstWallY + firstWallHeight;
captureSecond(() => {
  // 2F measured plan. The stair arrival continues left/right as a front corridor,
  // with attic rooms behind it.
  const slabMat = new THREE.MeshLambertMaterial({ color: 0xf6f6f6, transparent: true, opacity: 0.94 });
  const secondWallY = secondY + secondFloorThickness;
  const gableBaseY = secondWallY + secondWallHeight;
  box({ x: planRightLivingX, z: insideZ0, w: sideRoomW, d: insideD, y: secondY, h: secondFloorThickness, mat: slabMat });
  box({ x: stairClearX, z: insideZ0, w: stairClearW, d: secondCorridorD, y: secondY, h: secondFloorThickness, mat: slabMat });
  box({ x: secondRoom2X, z: insideZ0, w: secondRoom2W, d: insideD, y: secondY, h: secondFloorThickness, mat: slabMat });
  room({ x: secondCorridorX, z: secondCorridorZ, w: secondCorridorW, d: secondCorridorD, y: secondWallY + floorSurfaceH, mat: materials.landing, text: roomText('다락 복도', secondCorridorW, secondCorridorD) });
  room({ x: planRightLivingX, z: secondAtticZ, w: sideRoomW, d: secondAtticD, y: secondWallY + floorSurfaceH + 0.004, mat: materials.bed, text: roomText('다락방1', sideRoomW, secondAtticD) });
  room({ x: secondRoom2X, z: secondAtticZ, w: secondRoom2W, d: secondAtticD, y: secondWallY + floorSurfaceH + 0.004, mat: materials.bed, text: roomText('다락방2', secondRoom2W, secondAtticD) });

  box({ x: frontCornerDimX, z: frontCornerDimZ, w: 0.035, d: 0.035, y: secondWallY, h: secondWallHeight, mat: materials.dimension });
  box({ x: frontCornerDimTickX, z: frontCornerDimZ, w: 0.35, d: 0.035, y: secondWallY, h: 0.035, mat: materials.dimension });
  box({ x: frontCornerDimTickX, z: frontCornerDimZ, w: 0.35, d: 0.035, y: secondWallY + secondWallHeight - 0.035, h: 0.035, mat: materials.dimension });
  label('다락 높이 1.15m', frontCornerDimLabelX, secondWallY + secondWallHeight / 2, frontCornerDimLabelZ, 0.28);

  // 2F exterior walls use a 1.15m loft eave wall; the gable rise is calculated from a 33 degree roof pitch.
  horizontalWallWithGaps(0, buildingFrontZ, buildingW, secondWallY, [
    [secondCorridorWindow1X, secondCorridorWindow1X + secondCorridorWindowW],
    [secondCorridorWindow2X, secondCorridorWindow2X + secondCorridorWindowW]
  ], secondWallHeight, exteriorWall, materials.exteriorWall);
  for (const windowX of [secondCorridorWindow1X, secondCorridorWindow2X]) {
    lowWall(windowX, buildingFrontZ, secondCorridorWindowW, exteriorWall, secondWallY, secondCorridorWindowSillOffset, materials.exteriorWall);
    lowWall(windowX, buildingFrontZ, secondCorridorWindowW, exteriorWall, secondWallY + secondCorridorWindowTopOffset, secondWallHeight - secondCorridorWindowTopOffset, materials.exteriorWall);
    frontSash(windowX, buildingFrontZ - 0.04, secondCorridorWindowW, secondWallY + secondCorridorWindowSillOffset, secondCorridorWindowH);
  }
  horizontalWallWithGaps(0, insideZ1, buildingW, secondWallY, [
    [atticRoom1RearWindowX, atticRoom1RearWindowX + atticRearWindowW],
    [atticRoom2RearWindowX, atticRoom2RearWindowX + atticRearWindowW]
  ], secondWallHeight, exteriorWall, materials.exteriorWall);
  for (const windowX of [atticRoom1RearWindowX, atticRoom2RearWindowX]) {
    lowWall(windowX, insideZ1, atticRearWindowW, exteriorWall, secondWallY, atticRearWindowSillOffset, materials.exteriorWall);
    lowWall(windowX, insideZ1, atticRearWindowW, exteriorWall, secondWallY + atticRearWindowTopOffset, secondWallHeight - atticRearWindowTopOffset, materials.exteriorWall);
    frontSash(windowX, insideZ1 + 0.04, atticRearWindowW, secondWallY + atticRearWindowSillOffset, atticRearWindowH);
  }
  lowWall(0, buildingFrontZ, exteriorWall, buildingD, secondWallY, secondWallHeight, materials.exteriorWall);
  lowWall(insideX1, buildingFrontZ, exteriorWall, buildingD, secondWallY, secondWallHeight, materials.exteriorWall);
  gableEndWallWithWindow({
    x: 0,
    z: buildingFrontZ,
    d: buildingD,
    y: gableBaseY,
    rise: gableRise,
    thickness: exteriorWall,
    mat: materials.exteriorWall,
    windowZ: buildingFrontZ + buildingD / 2,
    windowW: sideGableWindowW,
    windowBottomY: gableBaseY + sideGableWindowSillOffset,
    windowH: sideGableWindowH,
    sashSide: -1
  });
  gableEndWallWithWindow({
    x: insideX1,
    z: buildingFrontZ,
    d: buildingD,
    y: gableBaseY,
    rise: gableRise,
    thickness: exteriorWall,
    mat: materials.exteriorWall,
    windowZ: buildingFrontZ + buildingD / 2,
    windowW: sideGableWindowW,
    windowBottomY: gableBaseY + sideGableWindowSillOffset,
    windowH: sideGableWindowH,
    sashSide: 1
  });

  // 2F attic partitions follow the same gable profile as the exterior walls.
  horizontalWallWithGaps(planRightLivingX, secondAtticWallZ, sideRoomW, secondWallY, [
    [secondRoom1DoorX, secondRoom1DoorX + interiorDoorW]
  ], secondAtticFrontWallH, interiorWall);
  horizontalWallWithGaps(secondRoom2X, secondAtticWallZ, secondRoom2W, secondWallY, [
    [secondRoom2DoorX, secondRoom2DoorX + interiorDoorW]
  ], secondAtticFrontWallH, interiorWall);
  gableLongWallX({ x: stairLowXWallX, z: secondAtticWallZ, d: insideZ1 - secondAtticWallZ, y: secondWallY, baseH: secondWallHeight, thickness: interiorWall, mat: materials.wall });
  gableLongWallX({ x: stairHighXWallX, z: secondAtticWallZ, d: insideZ1 - secondAtticWallZ, y: secondWallY, baseH: secondWallHeight, thickness: interiorWall, mat: materials.wall });
  box({ x: stairClearX, z: stairOpeningStart - 0.05, w: stairHighXRunX - stairClearX, d: interiorWall, y: secondWallY, h: 0.12, mat: materials.stairWall });
  stairWallTopCap({ x: stairClearX, z: stairOpeningStart - 0.05, w: stairHighXRunX - stairClearX, d: interiorWall, topY: secondWallY + 0.12 });
  addStairRailingSegment(
    [stairClearX, secondWallY + 0.12, stairOpeningStart],
    [stairHighXRunX, secondWallY + 0.12, stairOpeningStart],
    { height: 0.98, postSpacing: 0.45, balusterSpacing: 0.16 }
  );
  pocketDoorHorizontal(secondRoom1DoorX, secondAtticWallZ, secondWallY, interiorDoorW, secondAtticDoorH, -1);
  pocketDoorHorizontal(secondRoom2DoorX, secondAtticWallZ, secondWallY, interiorDoorW, secondAtticDoorH, 1);
});

{
  const roofSideOverhang = 0.4;
  const roofEaveOverhang = 0.6;
  const secondWallTop = secondY + secondFloorThickness + secondWallHeight;
  const ridgeY = secondWallTop + gableRise;
  const outerEaveY = secondWallTop - roofSlopeTan * roofEaveOverhang;
  const ridgeZ = buildingFrontZ + buildingD / 2;
  roofObjects.push(
    roofSlab({
      eaveZ: buildingFrontZ - roofEaveOverhang,
      ridgeZ,
      eaveY: outerEaveY,
      ridgeY,
      sideOverhang: roofSideOverhang,
      thickness: roofThickness,
      mat: materials.roof
    }),
    roofSlab({
      eaveZ: buildingBackZ + roofEaveOverhang,
      ridgeZ,
      eaveY: outerEaveY,
      ridgeY,
      sideOverhang: roofSideOverhang,
      thickness: roofThickness,
      mat: materials.roof
    })
  );
  // 지붕 경사 각도 표기 — 전면 경사면 중턱 위에 띄움(+지붕 뷰에서만)
  const eaveZ = buildingFrontZ - roofEaveOverhang;
  const slopeMidZ = (eaveZ + ridgeZ) / 2;
  const slopeMidY = (outerEaveY + ridgeY) / 2;
  roofObjects.push(label('지붕 경사 32~33°\n(태양광 전선 연결)', buildingW / 2, slopeMidY + 0.4, slopeMidZ, 0.34));
}

// 캠핑 가구 재질 & 헬퍼 — 스노우피크 IGT 테이블, 반고 햄프턴 DLX 캠핑의자
const igtMetalMat = new THREE.MeshLambertMaterial({ color: 0x8f969d });   // IGT 알루미늄 프레임/다리
const igtTopMat = new THREE.MeshLambertMaterial({ color: 0xc7a06a });     // 대나무 상판
const chairFrameMat = new THREE.MeshLambertMaterial({ color: 0x23282f }); // 의자 프레임

// 스노우피크 IGT: bays칸 + 한쪽 사이드테이블(sideTableSide). 긴 방향은 X축.
function igtTable({ cx, cz, bays, sideTableSide = 1, height = 0.66, baseY = groundTopY }) {
  const bayW = 0.27;
  const depth = 0.40;
  const frame = 0.025;
  const topT = 0.03;
  const legT = 0.03;
  const innerW = bays * bayW;
  const topW = innerW + 2 * frame;
  const topBottomY = baseY + height - topT;
  const halfLong = topW / 2;
  const halfShort = depth / 2;
  const T = (lx, lz, w, d, y, h, mat) => box({ x: cx + lx - w / 2, z: cz + lz - d / 2, w, d, y, h, mat });
  for (let i = 0; i < bays; i += 1) {  // 대나무 칸 상판
    T(-innerW / 2 + bayW * (i + 0.5), 0, bayW - 0.03, depth - 2 * frame, topBottomY + 0.002, topT, igtTopMat);
  }
  T(0, -halfShort + frame / 2, topW, frame, topBottomY, topT, igtMetalMat);  // 긴 변 프레임
  T(0, halfShort - frame / 2, topW, frame, topBottomY, topT, igtMetalMat);
  for (let i = 0; i <= bays; i += 1) {  // 칸 구분바
    T(-innerW / 2 + bayW * i, 0, frame, depth, topBottomY, topT, igtMetalMat);
  }
  for (const sx of [-halfLong + legT, halfLong - legT]) {  // 다리 4
    for (const sz of [-halfShort + legT, halfShort - legT]) {
      T(sx, sz, legT, legT, baseY, height - topT, igtMetalMat);
    }
  }
  if (sideTableSide !== 0) {  // 사이드테이블(한쪽)
    const stW = 0.30;
    const sgn = Math.sign(sideTableSide);
    const stCx = sgn * (halfLong + stW / 2);
    T(stCx, 0, stW, depth - 0.04, topBottomY, topT, igtTopMat);
    T(stCx, -halfShort + frame / 2, stW, frame, topBottomY, topT, igtMetalMat);
    T(stCx, halfShort - frame / 2, stW, frame, topBottomY, topT, igtMetalMat);
    for (const sz of [-halfShort + legT, halfShort - legT]) {
      T(sgn * (halfLong + stW - legT), sz, legT, legT, baseY, height - topT, igtMetalMat);
    }
  }
}

// 반고 햄프턴 DLX: 높은 등받이 + 팔걸이 폴딩 캠핑의자. faceAngle은 의자 정면(+z) 방향.
function campingChair({ cx, cz, faceAngle = 0, color = 0x47535f, baseY = groundTopY }) {
  const group = new THREE.Group();
  const fabric = new THREE.MeshLambertMaterial({ color });
  const add = (w, h, d, x, y, z, mat, rotX = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (rotX) m.rotation.x = rotX;
    m.castShadow = true;
    m.receiveShadow = false;
    group.add(m);
  };
  const seatY = 0.42;
  add(0.52, 0.08, 0.50, 0, seatY, 0, fabric);                         // 좌판
  add(0.52, 0.60, 0.07, 0, seatY + 0.33, -0.23, fabric, -0.16);       // 높은 등받이(리클라인)
  add(0.06, 0.05, 0.46, -0.27, seatY + 0.22, 0.02, chairFrameMat);    // 팔걸이 좌
  add(0.06, 0.05, 0.46, 0.27, seatY + 0.22, 0.02, chairFrameMat);     // 팔걸이 우
  add(0.05, 0.24, 0.05, -0.27, seatY + 0.10, 0.22, chairFrameMat);    // 팔걸이 앞기둥 좌
  add(0.05, 0.24, 0.05, 0.27, seatY + 0.10, 0.22, chairFrameMat);     // 팔걸이 앞기둥 우
  for (const lx of [-0.23, 0.23]) {
    for (const lz of [-0.20, 0.22]) {
      add(0.045, seatY, 0.045, lx, seatY / 2, lz, chairFrameMat);     // 다리
    }
  }
  group.position.set(cx, baseY, cz);
  group.rotation.y = faceAngle;
  scene.add(group);
}

// 1층 현관 앞 렉산(폴리카보네이트) 캐노피/파고라 — 지붕 길이(전면 돌출) 4m, 반투명 브론즈.
//  · 데크 상단(집 바닥 높이)에서 시작, 앞단(최저) 기둥 2.4m, 건물쪽은 1층 높이에 부착
//  · 프레임/기둥은 지붕 가장자리에서 20cm 안쪽(3면 세로벽이 이 선에 설치)
//  roofLowX/roofW로 X 범위를 지정해 거실 앞·가족방 앞에 같은 형식으로 각각 설치한다.
function pergola({ roofLowX, roofW, withFurniture = true, withPostDims = true, withWalls = true, deckDepth = null, postsToGround = false, connectRightX = null, withFan = true, withShortPostDim = false, withFlatFrame = true }) {
  const frameInset = 0.2;                      // 가장자리에서 20cm 안쪽
  const beamH = 0.12;
  const beamDrop = 0.04;
  const wallZ = buildingFrontZ;
  const roofSlopeLength = 4.0;                     // 지붕 경사면 길이(실제 지붕면)
  const targetFrontPostH = 2.4;                     // 앞단(최저) 기둥 높이 목표(데크 상단 기준)
  const targetWallPostH = 2.8;                      // 집 벽쪽(건물 부착부) 높이 목표(데크 상단 기준)
  const yAtWall = firstFloorY + targetWallPostH + beamDrop + beamH;  // 건물 부착 높이 = 데크 + 벽쪽높이 + 보
  // 앞단 보 밑면 = 데크 상단 + 기둥높이가 되도록 앞단 지붕높이(yAtFront)를 역산(반복 수렴).
  const targetGlassAtFront = firstFloorY + targetFrontPostH + beamDrop + beamH;
  let yAtFront = targetGlassAtFront;
  for (let i = 0; i < 40; i += 1) {
    const d = yAtWall - yAtFront;
    const run = Math.sqrt(roofSlopeLength * roofSlopeLength - d * d);
    yAtFront = targetGlassAtFront - frameInset * d / run;
  }
  const roofDrop = yAtWall - yAtFront;             // 물매 낙차
  const roofRun = Math.sqrt(roofSlopeLength * roofSlopeLength - roofDrop * roofDrop); // 수평투영 길이(물매 반영)
  const frontZ = wallZ - roofRun;                  // 앞단은 수평투영 거리만큼만 나감
  const roofHighX = roofLowX + roofW;
  const roofCenterX = (roofLowX + roofHighX) / 2;
  const glassYatZ = (z) => yAtWall + (yAtFront - yAtWall) * ((z - wallZ) / (frontZ - wallZ));
  const tilt = Math.atan2(Math.abs(yAtFront - yAtWall), Math.abs(frontZ - wallZ));
  const lexan = new THREE.MeshLambertMaterial({
    color: 0x6e4a28, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false
  });
  const canopyFrame = materials.entryFrame;

  // 가시성 그룹 분류용: 이 함수가 scene에 추가하는 모든 객체를 기록해 두고,
  // 데크 바닥/소품(가구)만 따로 표시한 뒤 나머지는 파고라 구조물로 분류한다.
  const _addStart = scene.children.length;
  const deckLocal = [];      // 데크 바닥·바닥 치수 라벨
  const wallLocal = [];      // 캐노피 외벽(다누몰 자바라) — 별도 토글
  const extrasLocal = [];    // 캠핑 가구(의자 등)

  // 렉산 지붕면(앞으로 물매)
  const panelLen = Math.hypot(frontZ - wallZ, yAtFront - yAtWall);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(roofW, 0.04, panelLen), lexan);
  panel.position.set(roofCenterX, (yAtWall + yAtFront) / 2, (wallZ + frontZ) / 2);
  panel.rotation.x = -tilt;
  panel.renderOrder = 1;
  scene.add(panel);

  // 프레임(지붕 가장자리 20cm 안쪽): 벽측 보 + 앞단 보 + 양측 경사 보
  const fX0 = roofLowX + frameInset;            // = -0.2 (오른쪽 벽선 바깥)
  const fX1 = roofHighX - frameInset;
  const fFrontZ = frontZ + frameInset;
  const fWallZ = wallZ;                          // 벽측은 건물에 부착
  // connectRightX가 지정되면 오른쪽(낮은 X) 프레임을 별도로 두지 않고 이웃 파고라 프레임선까지 보를 연장한다.
  const beamX0 = (connectRightX != null) ? connectRightX : fX0;
  box({ x: beamX0, z: fWallZ - 0.04, w: fX1 - beamX0, d: 0.08, y: glassYatZ(fWallZ) - beamDrop - beamH, h: beamH, mat: canopyFrame });
  box({ x: beamX0, z: fFrontZ - 0.04, w: fX1 - beamX0, d: 0.08, y: glassYatZ(fFrontZ) - beamDrop - beamH, h: beamH, mat: canopyFrame });
  const sideLen = Math.hypot(fFrontZ - fWallZ, glassYatZ(fFrontZ) - glassYatZ(fWallZ));
  const sideMidZ = (fWallZ + fFrontZ) / 2;
  const sideMidY = (glassYatZ(fWallZ) + glassYatZ(fFrontZ)) / 2 - beamDrop - beamH / 2;
  const sideXs = (connectRightX != null) ? [fX1 - 0.04] : [fX0 + 0.04, fX1 - 0.04]; // 오른쪽 측면 보 생략
  for (const sx of sideXs) {
    const sideBeam = new THREE.Mesh(new THREE.BoxGeometry(0.08, beamH, sideLen), canopyFrame);
    sideBeam.position.set(sx, sideMidY, sideMidZ);
    sideBeam.rotation.x = -tilt;
    sideBeam.castShadow = true;
    sideBeam.receiveShadow = false;
    scene.add(sideBeam);
  }
  // 렉산(경사 지붕) 프레임은 둘레(테두리) 보만 둔다 — 내부 격자는 두꺼워 내부가 안 보이므로 생략.

  // 지지 기둥(프레임 선 위, 지면~보 밑면): 전면 3개 + 양측 중앙 2개 (오른쪽 연결 시 오른쪽 기둥 생략)
  const postW = 0.12;
  const postPlaces = (connectRightX != null)
    ? [[(fX0 + fX1) / 2, fFrontZ], [fX1, fFrontZ], [fX1, sideMidZ]]
    : [[fX0, fFrontZ], [(fX0 + fX1) / 2, fFrontZ], [fX1, fFrontZ], [fX0, sideMidZ], [fX1, sideMidZ]];
  const postBaseY = postsToGround ? groundTopY : firstFloorY;   // 부분 데크/무벽이면 지면에 세움
  for (const [px, pz] of postPlaces) {
    const topY = glassYatZ(pz) - beamDrop - beamH;
    box({ x: px - postW / 2, z: pz - postW / 2, w: postW, d: postW, y: postBaseY, h: topY - postBaseY, mat: canopyFrame });
  }

  // 평평한 프레임 — 앞단(가장 낮은) 보 높이의 수평면에 사각 틀 + 내부 격자(lattice).
  // 경사 지붕(빗변)·수평 격자(밑변)·집 벽쪽 단차(수직변)로 측면에서 직각삼각형 구조가 보인다.
  // 이 수평면(flatFrameY)에 등·실링팬을 매단다.
  const flatFrameY = glassYatZ(fFrontZ) - beamDrop - beamH;   // 앞단 보 밑면 = 가장 낮은 수평면(2.4m)
  if (withFlatFrame) {
    const flatX0 = (connectRightX != null) ? connectRightX : fX0;  // 연결 시 이웃까지 이어 붙임
    const barW = 0.05, barH = 0.07;
    const fw = fX1 - flatX0, fd = fWallZ - fFrontZ;
    const xMid = flatX0 + fw / 2, zMid = fFrontZ + fd / 2;
    // 사각 틀(둘레) + 가운데 십자(가로 1·세로 1)
    for (const z of [fFrontZ, fWallZ, zMid]) {              // 앞·뒤 + 십자 가로
      box({ x: flatX0, z: z - barW / 2, w: fw, d: barW, y: flatFrameY, h: barH, mat: canopyFrame });
    }
    for (const x of [flatX0, fX1, xMid]) {                  // 좌·우 + 십자 세로
      box({ x: x - barW / 2, z: fFrontZ, w: barW, d: fd, y: flatFrameY, h: barH, mat: canopyFrame });
    }
  }

  // 캐노피 외벽 — 다누몰 포시즌 자바라(폴리카보네이트 접이식 폴딩 창)로 3면(전면·양측) 시공.
  // 좁은 세로 패널들이 접이 경첩(세로 분할살)으로 나뉜 형태이므로, 반투명 폴리카보네이트 면을
  // 일정 간격의 세로 자바라 살로 분할해 표현한다. 데크 상단(집 바닥)에서 상부 보 밑면까지.
  const wallTopAtZ = (z) => glassYatZ(z) - beamDrop - beamH;   // 상부 보 밑면
  const _wallStart = scene.children.length;
  if (withWalls) {
    const polyPanel = new THREE.MeshLambertMaterial({           // 다누몰 폴리카보네이트(반투명 우윳빛 갈색)
      color: 0xc7b48c, transparent: true, opacity: 0.30, side: THREE.DoubleSide, depthWrite: false
    });
    const jabaraFrame = new THREE.MeshLambertMaterial({ color: 0x6f5234 });   // 자바라 알루미늄 프레임(브론즈)
    const glaze = 0.04;
    const sillH = 0.1;
    const wallBaseY = firstFloorY;                              // 창벽 하단 = 데크 상단
    const mullW = 0.035;                                        // 세로 자바라 살 두께
    const panelTarget = 0.34;                                   // 접이 패널 1장 목표 폭

    // 전면 창벽(수평 상부)
    const frontTopY = wallTopAtZ(fFrontZ);
    box({ x: fX0, z: fFrontZ - glaze / 2, w: fX1 - fX0, d: glaze, y: wallBaseY + sillH, h: frontTopY - wallBaseY - sillH, mat: polyPanel, cast: false });
    box({ x: fX0, z: fFrontZ - 0.05, w: fX1 - fX0, d: 0.1, y: wallBaseY, h: sillH, mat: jabaraFrame });               // 하부 레일(문턱)
    box({ x: fX0, z: fFrontZ - 0.05, w: fX1 - fX0, d: 0.1, y: frontTopY - 0.06, h: 0.06, mat: jabaraFrame });          // 상부 레일
    const frontPanels = Math.max(2, Math.round((fX1 - fX0) / panelTarget));
    for (let i = 0; i <= frontPanels; i += 1) {                 // 세로 자바라 접이살
      const mx = fX0 + (fX1 - fX0) * (i / frontPanels);
      box({ x: mx - mullW / 2, z: fFrontZ - 0.06, w: mullW, d: 0.12, y: wallBaseY + sillH, h: frontTopY - wallBaseY - sillH, mat: jabaraFrame, cast: false });
    }

    // 양측 창벽(경사 상부, 사다리꼴)
    for (const sideX of [fX0, fX1]) {
      yzWallPrism({
        x: sideX - glaze / 2,
        thickness: glaze,
        mat: polyPanel,
        points: [
          [fWallZ, wallBaseY + sillH],
          [fFrontZ, wallBaseY + sillH],
          [fFrontZ, wallTopAtZ(fFrontZ)],
          [fWallZ, wallTopAtZ(fWallZ)]
        ]
      });
      box({ x: sideX - 0.05, z: fFrontZ, w: 0.1, d: fWallZ - fFrontZ, y: wallBaseY, h: sillH, mat: jabaraFrame });      // 하부 레일(문턱)
      const sidePanels = Math.max(2, Math.round((fWallZ - fFrontZ) / panelTarget));
      for (let i = 0; i <= sidePanels; i += 1) {               // 세로 자바라 접이살(상부는 지붕 물매를 따라감)
        const mz = fFrontZ + (fWallZ - fFrontZ) * (i / sidePanels);
        const topY = wallTopAtZ(mz);
        box({ x: sideX - 0.06, z: mz - mullW / 2, w: 0.12, d: mullW, y: wallBaseY + sillH, h: topY - wallBaseY - sillH, mat: jabaraFrame, cast: false });
      }
    }
  }
  wallLocal.push(...scene.children.slice(_wallStart));   // 외벽(자바라) 객체를 별도 토글 그룹으로 수집

  // 캐노피 썬룸 바닥 — 합성목(WPC) 데크. 상단을 집 1층 바닥 높이에 맞춘 레이즈드 데크(지면부터 채움).
  const deckTopY = firstFloorY;                  // 데크 상단 = 집 바닥 높이(실내와 단차 없이 평탄)
  const deckThickness = deckTopY - groundTopY;   // 지면~바닥
  const deckEdge = postW / 2;                    // 기둥(프레임 선)이 데크 위에 완전히 얹히도록 기둥 바깥면까지 확장
  const dX0 = (connectRightX != null) ? connectRightX : fX0 - deckEdge; // 오른쪽: 연결 시 이웃 데크까지 이어 붙임
  const dX1 = fX1 + deckEdge;                    // 왼쪽 기둥 바깥면까지
  const dWallZ = fWallZ;                          // 건물쪽은 벽에 붙임
  // deckDepth가 지정되면 건물 벽에서 그 거리까지만 데크를 깐다(부분 데크).
  const dFrontZ = (deckDepth != null) ? dWallZ - deckDepth : fFrontZ - deckEdge;
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(dX1 - dX0, deckThickness, dWallZ - dFrontZ),
    materials.compositeDeck
  );
  deck.position.set((dX0 + dX1) / 2, deckTopY - deckThickness / 2, (dFrontZ + dWallZ) / 2);
  deck.receiveShadow = true;
  scene.add(deck);
  deckLocal.push(deck, addGeometryEdges(deck, 0x4a3724));

  // 캐노피 지붕/바닥 사이즈 표시 — 지붕은 경사면 길이, 바닥은 물매 반영한 수평투영(증축 신고 면적 기준)
  const roofMidZ = (wallZ + frontZ) / 2;
  label(`캐노피 지붕 ${Number(roofW.toFixed(2))}×${Number(roofSlopeLength.toFixed(2))}m (경사면)`, roofCenterX, glassYatZ(roofMidZ) + 0.34, roofMidZ, 0.3);
  const floorW = fX1 - fX0;
  const floorL = (deckDepth != null) ? deckDepth : (fWallZ - fFrontZ); // 데크 깊이(부분 데크면 그 값)
  const floorArea = floorW * floorL;
  const floorLabelZ = (deckDepth != null) ? fWallZ - deckDepth / 2 : (fWallZ + fFrontZ) / 2;
  deckLocal.push(label(`캐노피 바닥(수평투영) ${Number(floorW.toFixed(2))}×${Number(floorL.toFixed(2))}m = ${floorArea.toFixed(1)}㎡`, (fX0 + fX1) / 2, firstFloorY + 0.06, floorLabelZ, 0.28));

  // 기둥 높이 치수(앞단·집 벽쪽) — 두 파고라가 같은 규격이라 한쪽에만 표기
  if (withPostDims) {
    // 건물에서 가장 먼쪽(앞단) = 가장 낮은 기둥 높이 표시
    const frontPostTopY = glassYatZ(fFrontZ) - beamDrop - beamH;
    const frontPostHeight = frontPostTopY - firstFloorY;   // 데크 상단~보 밑면(데크 위 기둥 길이)
    const dimZ = fFrontZ - 0.25;                       // 앞단 기둥 앞쪽으로 치수선을 뺀다
    box({ x: fX0 - 0.018, z: dimZ, w: 0.035, d: 0.035, y: firstFloorY, h: frontPostHeight, mat: materials.dimension }); // 세로 치수선
    box({ x: fX0 - 0.2, z: dimZ, w: 0.4, d: 0.035, y: firstFloorY, h: 0.035, mat: materials.dimension });              // 하단 틱(데크 상단)
    box({ x: fX0 - 0.2, z: dimZ, w: 0.4, d: 0.035, y: frontPostTopY - 0.035, h: 0.035, mat: materials.dimension });    // 상단 틱
    label(`최저(앞단) 기둥 ${Number(frontPostHeight.toFixed(2))}m`, fX0 - 0.1, firstFloorY + frontPostHeight / 2, dimZ - 0.4, 0.28);

    // 집 벽쪽(건물 부착부, 가장 높은 쪽) 높이 표시 — 데크 상단~보 밑면
    const wallPostTopY = wallTopAtZ(fWallZ);
    const wallPostHeight = wallPostTopY - firstFloorY;
    const dimX = fX0 - 0.25;                           // 우측 모서리 바깥으로 치수선을 뺀다
    box({ x: dimX - 0.018, z: fWallZ - 0.018, w: 0.035, d: 0.035, y: firstFloorY, h: wallPostHeight, mat: materials.dimension }); // 세로 치수선
    box({ x: dimX - 0.2, z: fWallZ - 0.018, w: 0.4, d: 0.035, y: firstFloorY, h: 0.035, mat: materials.dimension });             // 하단 틱(데크 상단)
    box({ x: dimX - 0.2, z: fWallZ - 0.018, w: 0.4, d: 0.035, y: wallPostTopY - 0.035, h: 0.035, mat: materials.dimension });    // 상단 틱
    label(`집 벽쪽 높이 ${Number(wallPostHeight.toFixed(2))}m`, dimX - 0.45, firstFloorY + wallPostHeight / 2, fWallZ, 0.28);
  }

  // 가장 짧은(앞단) 기둥 높이 — 기둥이 지면에 서는 개방형 파고라용(가족방 앞). 왼쪽(높은 X) 기둥 바깥에 표기.
  if (withShortPostDim) {
    const fpTopY = glassYatZ(fFrontZ) - beamDrop - beamH;   // 앞단 보 밑면
    const fpH = fpTopY - postBaseY;                          // 지면(postBaseY)~보 밑면 = 가장 짧은 기둥
    const dimX2 = fX1 + 0.25;                                // 왼쪽 기둥 바깥으로 치수선
    box({ x: dimX2 - 0.018, z: fFrontZ - 0.018, w: 0.035, d: 0.035, y: postBaseY, h: fpH, mat: materials.dimension }); // 세로 치수선
    box({ x: dimX2 - 0.2, z: fFrontZ - 0.018, w: 0.4, d: 0.035, y: postBaseY, h: 0.035, mat: materials.dimension });   // 하단 틱(지면)
    box({ x: dimX2 - 0.2, z: fFrontZ - 0.018, w: 0.4, d: 0.035, y: fpTopY - 0.035, h: 0.035, mat: materials.dimension }); // 상단 틱
    label(`최저(앞단) 기둥 ${Number(fpH.toFixed(2))}m`, dimX2 + 0.35, postBaseY + fpH / 2, fFrontZ, 0.28);
  }

  // 캐노피 천장: 실링팬(옵션) + 양옆 조명(오른쪽 1, 왼쪽 1) — 추가된 평평한 프레임에 매단다
  const porchCenterX = (fX0 + fX1) / 2;
  const porchCenterZ = (fWallZ + fFrontZ) / 2;
  const porchCeilY = withFlatFrame ? flatFrameY : glassYatZ(porchCenterZ) - 0.02;   // 평평한 프레임 밑면(없으면 경사 지붕 밑면)
  if (withFan) ceilingFan({ x: porchCenterX, z: porchCenterZ, ceilingY: porchCeilY, drop: 0.25, bladeLength: 0.55 });
  const porchLampMat = new THREE.MeshLambertMaterial({ color: 0xfff4cf, emissive: 0xffe39c, emissiveIntensity: 0.9 });
  for (const lampX of [porchCenterX - 1.3, porchCenterX + 1.3]) {  // -:오른쪽(낮은 X), +:왼쪽(높은 X)
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.05, 16), materials.guard);
    housing.position.set(lampX, porchCeilY - 0.025, porchCenterZ);
    housing.castShadow = false;
    housing.receiveShadow = false;
    scene.add(housing);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.035, 16), porchLampMat);
    lens.position.set(lampX, porchCeilY - 0.06, porchCenterZ);
    lens.castShadow = false;
    lens.receiveShadow = false;
    scene.add(lens);
  }

  // 캐노피 캠핑 가구 — 스노우피크 IGT 4칸/3칸(한쪽 사이드테이블) + 반고 햄프턴 DLX 의자
  const _furnStart = scene.children.length;
  if (withFurniture) {
    const tableZ = porchCenterZ - 0.05;
    igtTable({ cx: porchCenterX - 1.05, cz: tableZ, bays: 4, sideTableSide: -1, baseY: firstFloorY });
    igtTable({ cx: porchCenterX + 1.25, cz: tableZ, bays: 3, sideTableSide: 1, baseY: firstFloorY });
    campingChair({ cx: porchCenterX - 1.05, cz: tableZ - 0.72, faceAngle: 0, baseY: firstFloorY });
    campingChair({ cx: porchCenterX - 1.05, cz: tableZ + 0.72, faceAngle: Math.PI, baseY: firstFloorY });
    campingChair({ cx: porchCenterX + 1.25, cz: tableZ - 0.72, faceAngle: 0, baseY: firstFloorY });
    campingChair({ cx: porchCenterX + 1.25, cz: tableZ + 0.72, faceAngle: Math.PI, baseY: firstFloorY });
    label('스노우피크 IGT(4·3칸) + 반고 햄프턴 DLX', porchCenterX, firstFloorY + 1.15, tableZ + 0.05, 0.26);
  }
  extrasLocal.push(...scene.children.slice(_furnStart));

  // 추가물 분류: 데크 바닥/가구로 표시된 것 외 나머지는 모두 파고라 구조물.
  const _deckSet = new Set(deckLocal);
  const _wallSet = new Set(wallLocal);
  const _extrasSet = new Set(extrasLocal);
  for (const o of scene.children.slice(_addStart)) {
    if (_deckSet.has(o)) deckObjects.push(o);
    else if (_wallSet.has(o)) wallObjects.push(o);
    else if (_extrasSet.has(o)) extrasObjects.push(o);
    else pergolaObjects.push(o);
  }

  return { dX0, dX1, dFrontZ, dWallZ, deckTopY };   // 데크 사각형(계단 배치에 사용)
}

// 데크 계단 — 데크 상단에서 지면까지 3계단(합성목). 가장자리 한 변을 따라 바깥으로 내려간다.
//  axis: 계단이 늘어선 축('x' 또는 'z'). span0~span1: 그 축 범위. edge: 수직축의 데크 가장자리.
//  outward: 가장자리에서 계단이 뻗는 방향(±1). steps: 계단 수.
function deckStairs({ axis, span0, span1, edge, outward, steps = 3, topY = firstFloorY, baseY = groundTopY, tread = 0.3, mat = materials.compositeDeck }) {
  const rise = (topY - baseY) / steps;              // 3계단 = 3개의 단높이(데크가 맨 위 단)
  for (let i = 0; i < steps - 1; i += 1) {          // 중간 디딤판 steps-1개(맨 위는 데크). i=0: 데크에 가장 가까운 단
    const h = (topY - (i + 1) * rise) - baseY;      // 지면~단 상단
    const pNear = edge + outward * (i * tread);
    const pFar = edge + outward * ((i + 1) * tread);
    const pMin = Math.min(pNear, pFar);
    let step;
    if (axis === 'x') {                              // 계단이 x축으로 늘어섬(전면 계단), 수직축은 z
      step = box({ x: span0, z: pMin, w: span1 - span0, d: tread, y: baseY, h, mat });
    } else {                                         // axis === 'z'(측면 계단), 수직축은 x
      step = box({ x: pMin, z: span0, w: tread, d: span1 - span0, y: baseY, h, mat });
    }
    addGeometryEdges(step, 0x4a3724);
  }
}

// 원통형 흰색 나무 화분(지름×높이 기본 50×50cm) + 둥근 관목
function whitePlanter({ cx, cz, diameter = 0.5, height = 0.5, baseY = firstFloorY }) {
  const R = diameter / 2;
  const potMat = new THREE.MeshLambertMaterial({ color: 0xf2efe7 });   // 흰색 나무
  const rimMat = new THREE.MeshLambertMaterial({ color: 0xe4dfd3 });
  const soilMat = new THREE.MeshLambertMaterial({ color: 0x3a2c20 });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x24502b });   // 주목 — 짙은 상록 녹색
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4a32 });   // 주목 줄기(적갈색)
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.9, height, 22), potMat);
  pot.position.set(cx, baseY + height / 2, cz); pot.castShadow = true; scene.add(pot);
  addGeometryEdges(pot, 0xcfc9bb);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.04, R * 1.04, 0.05, 22), rimMat);
  rim.position.set(cx, baseY + height - 0.02, cz); scene.add(rim);
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.88, R * 0.88, 0.04, 22), soilMat);
  soil.position.set(cx, baseY + height - 0.005, cz); scene.add(soil);
  // 주목: 짧은 줄기 + 원뿔형으로 다듬은 짙은 녹색 수형(2단 콘으로 풍성하게)
  const soilTopY = baseY + height;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.12, R * 0.16, R * 0.5, 10), trunkMat);
  trunk.position.set(cx, soilTopY + R * 0.25, cz); trunk.castShadow = true; scene.add(trunk);
  const coneBaseY = soilTopY + R * 0.4;
  const lower = new THREE.Mesh(new THREE.ConeGeometry(R * 1.0, R * 1.8, 18), leafMat);
  lower.position.set(cx, coneBaseY + R * 0.9, cz); lower.castShadow = true; scene.add(lower);
  const upper = new THREE.Mesh(new THREE.ConeGeometry(R * 0.7, R * 1.6, 18), leafMat);
  upper.position.set(cx, coneBaseY + R * 1.9, cz); upper.castShadow = true; scene.add(upper);
}

// 두 개의 파고라를 같은 형식으로 설치
// · 거실 앞(우측): 우측 외벽끝(x=0) 고정, 폭 5.6m → 좌측 끝 x=5.4
const livingPergola = pergola({ roofLowX: -0.2, roofW: 5.6, withFurniture: true, withPostDims: true });
// · 가족방 앞(좌측, 남은 부분): 거실 파고라 좌측 끝(5.4)에서 좌측 외벽끝 바깥(8.7)까지, 폭 3.3m
//   벽 없는 개방형 파고라 + 데크는 건물에서 앞으로 1m까지만(나머지는 개방), 기둥은 지면에 세움
//   오른쪽 프레임/데크는 별도로 두지 않고 거실 파고라 좌측 프레임선(fX1=5.2)에 이어 붙인다.
const familyPergola = pergola({ roofLowX: 5.4, roofW: 3.3, withFurniture: false, withPostDims: false, withWalls: false, deckDepth: 1.0, postsToGround: true, connectRightX: 5.2, withFan: false, withShortPostDim: true });

// 데크 계단 3곳(각 3계단) — 데크 그룹에 포함
const _stairStart = scene.children.length;
// · 거실 데크 앞쪽(전면, -z로 내려감)
deckStairs({ axis: 'x', span0: livingPergola.dX0, span1: livingPergola.dX1, edge: livingPergola.dFrontZ, outward: -1 });
// · 가족방 데크 앞쪽(전면, -z로 내려감)
deckStairs({ axis: 'x', span0: familyPergola.dX0, span1: familyPergola.dX1, edge: familyPergola.dFrontZ, outward: -1 });
// · 거실 데크의 가족방쪽(높은 X) 옆면 — 가족방 데크가 시작되기 전 노출된 앞부분만(+x로 내려감)
deckStairs({ axis: 'z', span0: livingPergola.dFrontZ, span1: familyPergola.dFrontZ, edge: livingPergola.dX1, outward: 1 });
// · 가족방 데크의 왼쪽(높은 X) 옆면 → 왼쪽 야외 부동수전 쪽으로 내려가는 계단(+x로 내려감)
deckStairs({ axis: 'z', span0: familyPergola.dFrontZ, span1: familyPergola.dWallZ, edge: familyPergola.dX1, outward: 1 });
deckObjects.push(...scene.children.slice(_stairStart));

// 계단이 90도로 갈라지는 코너 안쪽(두 계단 사이 오목한 포켓, 마당 바닥)에 흰색 원통 나무 화분 — 모서리 충돌 방지.
// 화분은 소품 그룹(전체일 때만 표시)
const _planterStart = scene.children.length;
// 1) 거실 데크: 전면 계단(−z)과 가족방쪽 옆면 계단(+x)이 갈라지는 코너 안쪽
whitePlanter({ cx: livingPergola.dX1 + 0.3, cz: livingPergola.dFrontZ - 0.3, baseY: groundTopY });
// 2) 가족방 데크: 전면 계단(−z)과 야외수전 쪽 옆면 계단(+x)이 갈라지는 코너 안쪽
whitePlanter({ cx: familyPergola.dX1 + 0.3, cz: familyPergola.dFrontZ - 0.3, baseY: groundTopY });
extrasObjects.push(...scene.children.slice(_planterStart));

// 가족방 파고라 아래 자갈 마당에 웨버 켈틀 그릴(지름 50cm) — 소품 그룹(전체일 때만 표시)
const _grillStart = scene.children.length;
{
  const gx = 7.0;                          // 가족방 파고라 폭(5.6~8.5) 중앙
  const gz = -3.3;                         // 1m 데크 앞쪽 개방 자갈 구역(지붕 아래)
  const baseY = groundTopY;
  const R = 0.25;                          // 반지름(지름 50cm)
  const bowlCenterY = baseY + 0.7;         // 다리 위 보울(조리부) 중심
  const kettleMat = new THREE.MeshLambertMaterial({ color: 0x1c1c1e });   // 켈틀 블랙
  const lidMat = new THREE.MeshLambertMaterial({ color: 0x242428 });
  const metalMat = new THREE.MeshLambertMaterial({ color: 0x3a3d42 });
  const grateMat = new THREE.MeshLambertMaterial({ color: 0x9a9da1 });

  // 보울(하반구) + 조리 그레이트
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(R, 28, 18, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), kettleMat);
  bowl.position.set(gx, bowlCenterY, gz); bowl.castShadow = true; scene.add(bowl);
  const grate = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.9, R * 0.9, 0.012, 28), grateMat);
  grate.position.set(gx, bowlCenterY + 0.005, gz); scene.add(grate);
  // 뚜껑(상반구)
  const lid = new THREE.Mesh(new THREE.SphereGeometry(R * 1.02, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2), lidMat);
  lid.position.set(gx, bowlCenterY + 0.02, gz); lid.castShadow = true; scene.add(lid);
  const lidTopY = bowlCenterY + 0.02 + R * 1.02;
  // 상단 공기구멍 캡 + 손잡이(가로 바 + 지지대 2개)
  const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12), metalMat);
  vent.position.set(gx, lidTopY - 0.01, gz); scene.add(vent);
  const hbar = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.15, 12), metalMat);
  hbar.rotation.z = Math.PI / 2; hbar.position.set(gx, lidTopY + 0.05, gz); scene.add(hbar);
  for (const dx of [-0.055, 0.055]) {
    const hp = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.05, 8), metalMat);
    hp.position.set(gx + dx, lidTopY + 0.025, gz); scene.add(hp);
  }
  // 삼각대 다리 3개(보울 하부 → 지면으로 벌어짐) + 뒤쪽 바퀴 2개
  const up = new THREE.Vector3(0, 1, 0);
  const legTopY = bowlCenterY - R * 0.8;
  for (let i = 0; i < 3; i += 1) {
    const ang = (i / 3) * Math.PI * 2 + Math.PI / 6;
    const p0 = new THREE.Vector3(gx + Math.cos(ang) * R * 0.3, legTopY, gz + Math.sin(ang) * R * 0.3);
    const p1 = new THREE.Vector3(gx + Math.cos(ang) * R * 1.7, baseY, gz + Math.sin(ang) * R * 1.7);
    const dir = new THREE.Vector3().subVectors(p1, p0);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, dir.length(), 8), metalMat);
    leg.position.copy(p0).addScaledVector(dir, 0.5);
    leg.quaternion.setFromUnitVectors(up, dir.clone().normalize());
    leg.castShadow = true; scene.add(leg);
    if (i >= 1) {  // 뒤쪽 두 다리 밑 바퀴
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 16), kettleMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(p1.x, baseY + 0.07, p1.z);
      wheel.castShadow = true; scene.add(wheel);
    }
  }
  label('웨버 그릴 Ø50cm', gx, lidTopY + 0.4, gz, 0.26);
}
extrasObjects.push(...scene.children.slice(_grillStart));

// 출입문과 거실 샷시 사이 전면 외벽에 외부(방수) 콘센트
{
  const livingSashEndX = livingYardSashX + yardSashW;   // 거실 샷시 높은 X쪽 끝(2.825)
  const outletX = (livingSashEndX + entryGapStart) / 2;  // 샷시~현관문 중간
  const wallFaceZ = buildingFrontZ;                      // 전면 외벽 바깥면
  const outletY = firstFloorY + 0.32;
  box({ x: outletX - 0.065, z: wallFaceZ - 0.035, w: 0.13, d: 0.035, y: outletY, h: 0.15, mat: materials.counter });      // 커버 플레이트
  box({ x: outletX - 0.045, z: wallFaceZ - 0.05, w: 0.09, d: 0.02, y: outletY + 0.03, h: 0.09, mat: materials.entryFrame }); // 소켓 면
  label('외부 콘센트', outletX, outletY + 0.42, wallFaceZ - 0.2, 0.24);
}

// 가족방 왼쪽(도로측, 높은 X) 외벽에 외부 부동수전(동파방지 벽붙이형)
{
  const faucetX = buildingW;             // 외벽 바깥면(x=8.5)
  const faucetZ = 0.0;                    // 도로측 창(0.4~2.2) 앞쪽 코너 부근
  const brass = materials.handle;         // 황동색
  const bodyX = faucetX + 0.06;           // 벽에서 약간 떨어진 수직 몸체 중심
  const spoutY = 0.42;                    // 하단 토수구
  const topY = 0.82;                      // 상단 유입부/핸들(긴 부동 몸체)
  const cyl = (rTop, rBot, len, x, y, z, rotAxis, rot) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, len, 12), brass);
    m.position.set(x, y, z);
    if (rotAxis === 'x') m.rotation.x = rot;
    if (rotAxis === 'z') m.rotation.z = rot;
    m.castShadow = true;
    m.receiveShadow = false;
    scene.add(m);
    return m;
  };
  // 벽 유입부 플랜지 + 수평 엘보(부동수전 밸브는 벽 안쪽 깊이 위치)
  box({ x: faucetX, z: faucetZ - 0.06, w: 0.03, d: 0.12, y: topY - 0.06, h: 0.12, mat: brass });
  cyl(0.02, 0.02, 0.08, faucetX + 0.03, topY, faucetZ, 'z', Math.PI / 2);
  // 긴 수직 부동 몸체
  cyl(0.025, 0.025, topY - spoutY, bodyX, (topY + spoutY) / 2, faucetZ, null, 0);
  // 상단 레버 핸들(가로 T)
  cyl(0.018, 0.018, 0.04, bodyX, topY + 0.03, faucetZ, null, 0);
  cyl(0.016, 0.016, 0.24, bodyX, topY + 0.05, faucetZ, 'x', Math.PI / 2);
  // 하단 토수구(앞 아래) + 호스 연결구
  cyl(0.02, 0.018, 0.12, bodyX, spoutY - 0.03, faucetZ + 0.025, 'x', 0.32);
  cyl(0.023, 0.023, 0.035, bodyX, spoutY - 0.11, faucetZ + 0.06, 'x', 0.32);
  label('외부 부동수전', faucetX + 0.5, topY + 0.85, faucetZ - 0.25, 0.24); // 수전이 가려지지 않게 위쪽·옆으로
}

{
  // Winder U stair: equal risers. The last visible tread remains one riser
  // below the 2F floor.
  const stairTreadH = 0.08;
  const riserH = (secondY + secondFloorThickness - firstFloorY) / stairRiserCount;
  const firstRunStart = stairFirstRunStart;
  const turnStart = stairTurnStart;
  const runGap = stairTreadDepth;
  const riserFaceD = 0.035;
  const stairCenterWallX = stairLowXRunX + stairRunW;
  const stairCenterLineX = stairCenterWallX + stairGap / 2;
  const stairTurnMidX = stairClearX + stairClearW / 2;
  const stairTurnMidZ = turnStart + stairTurnD / 2;
  const centerRailHeight = 0.92;
  const openRailHeight = 0.95;
  const planRightLivingSideRailX = stairLowXRunX;

  for (let i = 0; i < lowerStraightTreadCount; i += 1) {
    box({
      x: stairLowXRunX,
      z: firstRunStart + i * runGap - riserFaceD,
      w: stairRunW,
      d: riserFaceD,
      y: firstFloorY + i * riserH,
      h: riserH,
      mat: materials.stair,
      cast: false,
      receive: false
    });
    box({
      x: stairLowXRunX,
      z: firstRunStart + i * runGap,
      w: stairRunW,
      d: stairTreadDepth,
      y: firstFloorY + (i + 1) * riserH - stairTreadH,
      h: stairTreadH,
      mat: materials.stair,
      cast: false,
      receive: false
    });
    const firstRunTop = firstFloorY + (i + 1) * riserH;
    box({
      x: stairCenterWallX,
      z: firstRunStart + i * runGap,
      w: stairGap,
      d: stairTreadDepth,
      y: firstFloorY,
      h: firstRunTop - firstFloorY,
      mat: materials.stairWall,
      cast: false,
      receive: false
    });
    stairWallTopCap({
      x: stairCenterWallX,
      z: firstRunStart + i * runGap,
      w: stairGap,
      d: stairTreadDepth,
      topY: firstRunTop
    });
    box({
      x: stairLowXWallX,
      z: firstRunStart + i * runGap,
      w: interiorWall,
      d: stairTreadDepth,
      y: firstFloorY,
      h: firstRunTop - firstFloorY,
      mat: materials.stairWall,
      cast: false,
      receive: false
    });
    stairWallTopCap({
      x: stairLowXWallX,
      z: firstRunStart + i * runGap,
      w: interiorWall,
      d: stairTreadDepth,
      topY: firstRunTop
    });
  }
  const turnSideWallTop = firstFloorY + (lowerStraightTreadCount + winderTreadCount) * riserH;
  box({
    x: stairLowXWallX,
    z: turnStart,
    w: interiorWall,
    d: stairTurnD,
    y: firstFloorY,
    h: turnSideWallTop - firstFloorY,
    mat: materials.stairWall,
    cast: false,
    receive: false
  });
  stairWallTopCap({
    x: stairLowXWallX,
    z: turnStart,
    w: interiorWall,
    d: stairTurnD,
    topY: turnSideWallTop
  });

  const winderShapes = [
    [
      [stairLowXRunX, turnStart],
      [stairLowXRunX + stairRunW, turnStart],
      [stairTurnMidX, stairTurnMidZ],
      [stairLowXRunX, stairTurnMidZ]
    ],
    [
      [stairLowXRunX, stairTurnMidZ],
      [stairTurnMidX, stairTurnMidZ],
      [stairHighXWallX, stairTurnMidZ],
      [stairHighXWallX, insideZ1],
      [stairLowXRunX, insideZ1]
    ],
    [
      [stairHighXRunX, turnStart],
      [stairHighXWallX, turnStart],
      [stairHighXWallX, stairTurnMidZ],
      [stairTurnMidX, stairTurnMidZ]
    ]
  ];
  for (let i = 0; i < winderTreadCount; i += 1) {
    flatPoly({
      points: winderShapes[i],
      y: firstFloorY + (lowerStraightTreadCount + i + 1) * riserH - stairTreadH,
      h: stairTreadH,
      mat: materials.stair,
      cast: false,
      receive: false
    });
  }
  for (let i = 0; i < upperStraightTreadCount; i += 1) {
    box({
      x: stairHighXRunX,
      z: turnStart - (i + 1) * runGap,
      w: stairRunW,
      d: stairTreadDepth,
      y: firstFloorY + (lowerStraightTreadCount + winderTreadCount + i + 1) * riserH - stairTreadH,
      h: stairTreadH,
      mat: materials.stair,
      cast: false,
      receive: false
    });
    box({
      x: stairCenterWallX,
      z: turnStart - (i + 1) * runGap,
      w: stairGap,
      d: stairTreadDepth,
      y: firstFloorY,
      h: firstFloorY + (lowerStraightTreadCount + winderTreadCount + i + 1) * riserH - firstFloorY,
      mat: materials.stairWall,
      cast: false,
      receive: false
    });
    stairWallTopCap({
      x: stairCenterWallX,
      z: turnStart - (i + 1) * runGap,
      w: stairGap,
      d: stairTreadDepth,
      topY: firstFloorY + (lowerStraightTreadCount + winderTreadCount + i + 1) * riserH
    });
  }

  addStairRailingSegment(
    [stairCenterLineX, firstFloorY + riserH, firstRunStart],
    [stairCenterLineX, firstFloorY + lowerStraightTreadCount * riserH, turnStart],
    { height: centerRailHeight }
  );
  addStairRailingSegment(
    [stairCenterLineX, firstFloorY + lowerStraightTreadCount * riserH, turnStart],
    [stairCenterLineX, firstFloorY + (lowerStraightTreadCount + winderTreadCount + 1) * riserH, turnStart - runGap],
    { height: centerRailHeight }
  );
  addStairRailingSegment(
    [stairCenterLineX, firstFloorY + (lowerStraightTreadCount + winderTreadCount + 1) * riserH, turnStart - runGap],
    [stairCenterLineX, firstFloorY + (stairRiserCount - 1) * riserH, turnStart - upperStraightTreadCount * runGap],
    { height: centerRailHeight }
  );
  label(
    `계단실 ${Number(stairClearW.toFixed(2))}x${Number((insideZ1 - stairOpeningStart).toFixed(2))}m`,
    stairCenterLineX,
    firstFloorY + ((lowerStraightTreadCount + winderTreadCount + 1 + stairRiserCount - 1) / 2) * riserH + centerRailHeight + 0.18,
    turnStart - ((upperStraightTreadCount + 1) / 2) * runGap,
    0.28
  );

  addStairRailingSegment(
    [planRightLivingSideRailX, firstFloorY + riserH, firstRunStart],
    [planRightLivingSideRailX, firstFloorY + lowerStraightTreadCount * riserH, turnStart],
    { height: openRailHeight, postSpacing: 0.5, balusterSpacing: 0.16 }
  );
  addStairRailingSegment(
    [planRightLivingSideRailX, firstFloorY + lowerStraightTreadCount * riserH, turnStart],
    [planRightLivingSideRailX, firstFloorY + (lowerStraightTreadCount + winderTreadCount) * riserH, insideZ1],
    { height: openRailHeight, postSpacing: 0.5, balusterSpacing: 0.16 }
  );

}

function ceilingFan({ x, z, ceilingY, bladeCount = 5, bladeLength = 0.62, drop = 0.3 }) {
  const dropY = ceilingY - drop;
  // 천장 마운트
  const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.05, 16), materials.guard);
  mount.position.set(x, ceilingY - 0.025, z);
  mount.castShadow = true;
  mount.receiveShadow = false;
  scene.add(mount);
  // 다운로드(봉)
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, drop, 12), materials.guard);
  rod.position.set(x, ceilingY - drop / 2, z);
  rod.castShadow = true;
  rod.receiveShadow = false;
  scene.add(rod);
  // 모터 허브
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.12, 20), materials.guard);
  hub.position.set(x, dropY, z);
  hub.castShadow = true;
  hub.receiveShadow = false;
  scene.add(hub);
  // 날개
  const bladeY = dropY + 0.015;
  const bladeGeo = new THREE.BoxGeometry(bladeLength, 0.012, 0.16);
  for (let i = 0; i < bladeCount; i += 1) {
    const angle = (i / bladeCount) * Math.PI * 2;
    const reach = bladeLength / 2 + 0.1;
    const blade = new THREE.Mesh(bladeGeo, materials.interiorDoor);
    blade.position.set(x + Math.cos(angle) * reach, bladeY, z + Math.sin(angle) * reach);
    blade.rotation.y = -angle;
    blade.castShadow = true;
    blade.receiveShadow = false;
    scene.add(blade);
  }
  // 하부 조명 캡
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), materials.counter);
  lamp.position.set(x, dropY - 0.085, z);
  lamp.castShadow = false;
  lamp.receiveShadow = false;
  scene.add(lamp);
}

const firstCeilingY = secondY;
ceilingFan({ x: firstLivingX + firstLivingW / 2, z: insideZ0 + firstLivingD / 2, ceilingY: firstCeilingY });
ceilingFan({ x: firstFamilyX + firstFamilyW / 2, z: insideZ0 + firstFamilyD / 2, ceilingY: firstCeilingY });

// 다락 계단실 상부: 지붕 최고점(용마루) 밑면에 부착하는 실링팬
const atticSecondWallTop = secondY + secondFloorThickness + secondWallHeight;
const atticRidgeY = atticSecondWallTop + gableRise;
const atticRidgeZ = buildingFrontZ + buildingD / 2;
const stairwellFanX = stairClearX + stairRunW + stairGap / 2;
const stairwellFanZ = atticRidgeZ; // 용마루(가장 높은 곳) 바로 아래, 계단실 개구부 범위 안
const stairwellCeilingY = atticRidgeY - roofThickness - roofSlopeTan * Math.abs(stairwellFanZ - atticRidgeZ);
captureSecond(() => {
  ceilingFan({ x: stairwellFanX, z: stairwellFanZ, ceilingY: stairwellCeilingY, drop: 0.45 });
});

// 뒤쪽 지붕(용마루~뒤처마) · 다락방2(높은 X) 쪽에 태양광 패널 3KW
{
  const solarMat = new THREE.MeshLambertMaterial({ color: 0x16264a });
  const roofSlopeRad = THREE.MathUtils.degToRad(roofSlopeDeg);
  const cosS = Math.cos(roofSlopeRad);
  const sinS = Math.sin(roofSlopeRad);
  const surfaceY = (z) => atticRidgeY - roofSlopeTan * (z - atticRidgeZ);
  const panelW = 0.62;   // X 폭
  const panelL = 1.0;    // 경사 방향 길이
  const panelThk = 0.05;
  const gapX = 0.04;
  const gapZ = 0.04;
  const cols = 4;
  const rows = 2;        // 4 x 2 = 8장 ≈ 3KW
  const arrayW = cols * panelW + (cols - 1) * gapX;
  const arrayCenterX = (secondRoom2X + insideX1) / 2;
  const startX = arrayCenterX - arrayW / 2 + panelW / 2;
  const rowStepZ = (panelL + gapZ) * cosS;
  const arrayCenterZ = 2.4;
  const startZ = arrayCenterZ - ((rows - 1) / 2) * rowStepZ;
  const liftN = panelThk / 2 + 0.03;
  const panelGeo = new THREE.BoxGeometry(panelW, panelThk, panelL);
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const px = startX + c * (panelW + gapX);
      const pz = startZ + r * rowStepZ;
      const sy = surfaceY(pz);
      const panel = new THREE.Mesh(panelGeo, solarMat);
      panel.position.set(px, sy + liftN * cosS, pz + liftN * sinS);
      panel.rotation.x = roofSlopeRad;
      panel.castShadow = true;
      panel.receiveShadow = false;
      scene.add(panel);
      roofObjects.push(panel);
      roofObjects.push(addGeometryEdges(panel, 0x9aa0a8));
    }
  }
  roofObjects.push(label('태양광 3KW', arrayCenterX, surfaceY(arrayCenterZ) + 0.55, arrayCenterZ, 0.3));
}

function setView(pos, target) {
  camera.up.set(0, 1, 0);
  camera.position.set(...pos);
  controls.target.set(...target);
  controls.update();
}

// 가시성 상태
//  · building: '1층' / '+다락' / '+지붕' 중 하나만 선택되는 건물 누적 뷰(집만 제어)
//  · deckOn / pergolaOn / wallOn / accessoryOn: 데크·파고라·외벽·악세사리 독립 on/off 토글
//    - 파고라는 데크가 켜진 경우에만 가능(파고라는 데크 위에 얹힘)
//    - 외벽(다누몰 자바라, 시공 업체 별도)은 파고라가 켜진 경우에만 가능(외벽은 파고라에 매달림)
//    - 악세사리(화분·의자·테이블·그릴)는 완전 독립 토글
const viewState = { building: 'all', deckOn: true, pergolaOn: true, wallOn: true, accessoryOn: true };

function applyVisibility() {
  const { building, deckOn, pergolaOn, wallOn, accessoryOn } = viewState;
  const showAttic = building !== 'first';   // +다락·+지붕에서 다락 표시
  const showRoof = building === 'all';      // 집 지붕은 +지붕에서만

  for (const item of secondFloorObjects) item.visible = showAttic;
  for (const item of roofObjects) item.visible = showRoof;
  for (const item of deckObjects) item.visible = deckOn;
  for (const item of pergolaObjects) item.visible = deckOn && pergolaOn;            // 파고라는 데크 위에만
  for (const item of wallObjects) item.visible = deckOn && pergolaOn && wallOn;     // 외벽은 파고라 위에만
  for (const item of extrasObjects) item.visible = accessoryOn;                     // 악세사리: 독립 토글

  // 버튼 상태 반영
  document.querySelector('#viewFirst').classList.toggle('active', building === 'first');
  document.querySelector('#viewSecond').classList.toggle('active', building === 'second');
  document.querySelector('#viewAll').classList.toggle('active', building === 'all');
  document.querySelector('#toggleDeck').classList.toggle('active', deckOn);
  const pergolaBtn = document.querySelector('#togglePergola');
  pergolaBtn.classList.toggle('active', deckOn && pergolaOn);
  pergolaBtn.disabled = !deckOn;            // 데크가 꺼져 있으면 파고라 토글 불가
  const wallBtn = document.querySelector('#toggleWall');
  wallBtn.classList.toggle('active', deckOn && pergolaOn && wallOn);
  wallBtn.disabled = !(deckOn && pergolaOn);  // 파고라가 꺼져 있으면 외벽 토글 불가
  document.querySelector('#toggleAccessory').classList.toggle('active', accessoryOn);
}

document.querySelector('#viewFirst').addEventListener('click', () => {
  viewState.building = 'first';
  applyVisibility();
  setView([4.25, 11.2, -5.0], [4.25, firstFloorY, 0.72]);
});

document.querySelector('#viewSecond').addEventListener('click', () => {
  viewState.building = 'second';
  applyVisibility();
  setView([4.25, 12.2, -5.0], [4.25, secondY + secondFloorThickness, 0.72]);
});

document.querySelector('#viewAll').addEventListener('click', () => {
  viewState.building = 'all';               // +지붕 = 집 지붕까지(데크·파고라·악세사리는 각 토글 상태 유지)
  applyVisibility();
  setView([10.8, 6.8, -8.8], [4.55, 2.55, 0.65]);
});

document.querySelector('#toggleDeck').addEventListener('click', () => {
  viewState.deckOn = !viewState.deckOn;
  if (!viewState.deckOn) viewState.pergolaOn = false;   // 데크를 끄면 파고라도 함께 off
  applyVisibility();
});

document.querySelector('#togglePergola').addEventListener('click', () => {
  if (!viewState.deckOn) return;            // 데크가 꺼져 있으면 파고라 토글 불가
  viewState.pergolaOn = !viewState.pergolaOn;
  applyVisibility();
});

document.querySelector('#toggleWall').addEventListener('click', () => {
  if (!viewState.deckOn || !viewState.pergolaOn) return;   // 파고라가 꺼져 있으면 외벽 토글 불가
  viewState.wallOn = !viewState.wallOn;
  applyVisibility();
});

document.querySelector('#toggleAccessory').addEventListener('click', () => {
  viewState.accessoryOn = !viewState.accessoryOn;
  applyVisibility();
});

applyVisibility();

function resize() {
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
window.addEventListener('resize', resize);

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
