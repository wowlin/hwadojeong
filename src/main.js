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
        <button id="viewFirst" type="button">1층</button>
        <button id="viewSecond" type="button">2층</button>
        <button id="viewAll" type="button">전체</button>
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
const alwaysVisibleObjects = [];

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
  openingEdge: new THREE.MeshLambertMaterial({ color: 0x8f6f35 }),
  gable: new THREE.MeshLambertMaterial({ color: 0xf8fafc, side: THREE.DoubleSide }),
  roof: new THREE.MeshLambertMaterial({ color: 0x6f7782, side: THREE.DoubleSide }),
  roofEdge: new THREE.MeshLambertMaterial({ color: 0x515966, side: THREE.DoubleSide })
};

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

function gableEndWall({ x, z, d, y, rise, thickness = 0.08, mat }) {
  const x0 = x;
  const x1 = x + thickness;
  const z0 = z;
  const z1 = z + d;
  const zMid = z + d / 2;
  const y0 = y;
  const y1 = y + rise;
  const vertices = new Float32Array([
    x0, y0, z0, x0, y0, z1, x0, y1, zMid,
    x1, y0, z0, x1, y1, zMid, x1, y0, z1,
    x0, y0, z0, x1, y0, z0, x1, y0, z1, x0, y0, z1,
    x0, y0, z0, x0, y1, zMid, x1, y1, zMid, x1, y0, z0,
    x0, y0, z1, x1, y0, z1, x1, y1, zMid, x0, y1, zMid
  ]);
  const indices = [
    0, 1, 2,
    3, 4, 5,
    6, 7, 8, 6, 8, 9,
    10, 11, 12, 10, 12, 13,
    14, 15, 16, 14, 16, 17
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  gableEndWallThicknessCap({ x0, x1, z0, zMid, z1, y0, y1, mat: materials.wallTop });
  return mesh;
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

function markSecond(...items) {
  secondFloorObjects.push(...items.filter(Boolean));
}

function label(text, x, y, z, size = 0.32) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 768;
  canvas.height = 192;
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#111827';
  let fontSize = 62;
  ctx.font = `800 ${fontSize}px Apple SD Gothic Neo, Noto Sans KR, Arial`;
  while (ctx.measureText(text).width > canvas.width * 0.9 && fontSize > 36) {
    fontSize -= 2;
    ctx.font = `800 ${fontSize}px Apple SD Gothic Neo, Noto Sans KR, Arial`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
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

function interiorDoorVertical(x, z, y, h = interiorDoorH) {
  box({ x: x - 0.03, z, w: 0.06, d: interiorDoorW, y, h, mat: materials.interiorDoor });
  box({ x: x - 0.06, z: z + interiorDoorW - 0.18, w: 0.035, d: 0.05, y: y + Math.min(1.02, h * 0.58), h: 0.05, mat: materials.handle });
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

box({ x: -1.1, z: buildingFrontZ - 1.2, w: 11.8, d: buildingD + 3.0, h: 0.08, mat: materials.site, cast: false });
box({ x: -1.1, z: buildingFrontZ - 1.15, w: 10.4, d: 1.0, h: 0.09, mat: materials.yard, cast: false });
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
const entryDoorH = 2.1;
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
const stairGuardWallH = 1.1;
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
const kitchenSinkW = 2.2;
const kitchenSinkD = 0.6;
const kitchenSinkH = 0.85;
const kitchenSinkX = firstLivingX + (firstLivingW - kitchenSinkW) / 2;
const kitchenSinkZ = insideZ1 - kitchenSinkD;
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
const secondAtticSideWallMaxH = secondWallHeight + gableRise;
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
const frontCornerDimLabelX = buildingW - 0.92;
const frontCornerDimLabelZ = buildingBackZ + 0.22;
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
label(`계단 앞 ${Number(stairClearW.toFixed(2))}x${Number(stairBottomLandingD.toFixed(2))}m`, stairClearX + stairClearW / 2, firstFloorY + 1.45, insideZ0 + stairBottomLandingD * 0.72, 0.3);
box({ x: stairLowXWallX, z: insideZ0, w: interiorWall, d: insideD, y: firstFloorY + floorOverlayLift - floorSurfaceH, h: floorSurfaceH, mat: materials.stairFront, cast: false });
room({ x: stairBathX, z: stairBathZ, w: stairBathW, d: stairBathD, y: firstFloorY + floorOverlayLift + 0.006, mat: materials.bath, text: roomText('계단하부 WC', stairBathW, stairBathD), surfaceH: 0.018 });
label(roomText('계단하부 WC', stairBathW, stairBathD), stairBathX + stairBathW / 2, firstFloorY + 1.35, stairBathZ + stairBathD * 0.42, 0.26);
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
  [livingYardSashX, livingYardSashX + yardSashW],
  [familyYardSashX, familyYardSashX + yardSashW],
  [entryGapStart, entryGapEnd]
], firstWallHeight, exteriorWall, materials.exteriorWall);
lowWall(livingYardSashX, buildingFrontZ, yardSashW, exteriorWall, yardSashTopY, firstWallY + firstWallHeight - yardSashTopY, materials.exteriorWall);
lowWall(familyYardSashX, buildingFrontZ, yardSashW, exteriorWall, yardSashTopY, firstWallY + firstWallHeight - yardSashTopY, materials.exteriorWall);
lowWall(entryGapStart, buildingFrontZ, entryFrameOuterW, exteriorWall, entryDoorBaseY + entryFrameH, firstWallY + firstWallHeight - entryDoorBaseY - entryFrameH, materials.exteriorWall);
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
verticalWallWithGaps(stairHighXWallX, insideZ0, insideD, firstWallY, [
  [familyDoorZ, familyDoorZ + interiorDoorW]
], firstWallHeight, interiorWall);
lowWall(stairHighXWallX, familyDoorZ, interiorWall, interiorDoorW, firstWallY + interiorDoorH, firstWallHeight - interiorDoorH);
horizontalWallWithGaps(stairBathX, stairBathZ, stairBathW, firstWallY, [
  [stairBathDoorX, stairBathDoorEndX]
], stairBathWallH, interiorWall, materials.stairWall);
lowWall(stairBathDoorX, stairBathZ, stairBathDoorW, interiorWall, firstWallY + stairBathDoorH, stairBathWallH - stairBathDoorH, materials.stairWall);
frontSash(livingYardSashX, buildingFrontZ - 0.04, yardSashW, yardSashSillY, yardSashH);
entryDoor(entryGapStart, buildingFrontZ - 0.04, entryFrameOuterW, entryDoorLeafW, entryDoorBaseY);
frontSash(familyYardSashX, buildingFrontZ - 0.04, yardSashW, yardSashSillY, yardSashH);
frontSash(livingRearWindowX, insideZ1 + 0.04, livingRearWindowW, livingRearWindowSillY, livingRearWindowH);
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
  room({ x: secondCorridorX, z: secondCorridorZ, w: secondCorridorW, d: secondCorridorD, y: secondWallY + floorSurfaceH, mat: materials.landing, text: roomText('2층 복도', secondCorridorW, secondCorridorD) });
  room({ x: planRightLivingX, z: secondAtticZ, w: sideRoomW, d: secondAtticD, y: secondWallY + floorSurfaceH + 0.004, mat: materials.bed, text: roomText('다락방1', sideRoomW, secondAtticD) });
  room({ x: secondRoom2X, z: secondAtticZ, w: secondRoom2W, d: secondAtticD, y: secondWallY + floorSurfaceH + 0.004, mat: materials.bed, text: roomText('다락방2', secondRoom2W, secondAtticD) });

  box({ x: frontCornerDimX, z: frontCornerDimZ, w: 0.035, d: 0.035, y: secondWallY, h: secondWallHeight, mat: materials.dimension });
  box({ x: frontCornerDimTickX, z: frontCornerDimZ, w: 0.35, d: 0.035, y: secondWallY, h: 0.035, mat: materials.dimension });
  box({ x: frontCornerDimTickX, z: frontCornerDimZ, w: 0.35, d: 0.035, y: secondWallY + secondWallHeight - 0.035, h: 0.035, mat: materials.dimension });
  label('2층 벽 높이 1.15m', frontCornerDimLabelX, secondWallY + secondWallHeight / 2, frontCornerDimLabelZ, 0.28);

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
}

// Yard-side terrace: all exit sashes and the entry door land on this deck.
box({ x: insideX0, z: buildingFrontZ - 0.48, w: insideX1 - insideX0, d: 0.42, y: firstFloorY, h: yardDeckH, mat: materials.deck });

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

function setView(pos, target) {
  camera.up.set(0, 1, 0);
  camera.position.set(...pos);
  controls.target.set(...target);
  controls.update();
}

function animateRoute(keyframes, duration = 2200) {
  const startedAt = performance.now();
  const smooth = (t) => t * t * (3 - 2 * t);

  function frame(now) {
    const elapsed = Math.min((now - startedAt) / duration, 1);
    const scaled = elapsed * (keyframes.length - 1);
    const index = Math.min(Math.floor(scaled), keyframes.length - 2);
    const local = smooth(scaled - index);
    const from = keyframes[index];
    const to = keyframes[index + 1];

    camera.position.lerpVectors(new THREE.Vector3(...from.pos), new THREE.Vector3(...to.pos), local);
    controls.target.lerpVectors(new THREE.Vector3(...from.target), new THREE.Vector3(...to.target), local);
    controls.update();

    if (elapsed < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

function showSecondFloor(show) {
  for (const item of secondFloorObjects) item.visible = show;
}

function showRoof(show) {
  for (const item of roofObjects) item.visible = show;
}

function setActiveButton(id) {
  for (const button of document.querySelectorAll('.controls button')) {
    button.classList.toggle('active', button.id === id);
  }
}

document.querySelector('#viewFirst').addEventListener('click', () => {
  showSecondFloor(false);
  showRoof(false);
  setActiveButton('viewFirst');
  setView([4.25, 11.2, -5.0], [4.25, firstFloorY, 0.72]);
});

document.querySelector('#viewSecond').addEventListener('click', () => {
  showSecondFloor(true);
  showRoof(false);
  setActiveButton('viewSecond');
  setView([4.25, 12.2, -5.0], [4.25, secondY + secondFloorThickness, 0.72]);
});

document.querySelector('#viewAll').addEventListener('click', () => {
  showSecondFloor(true);
  showRoof(true);
  setActiveButton('viewAll');
  setView([10.8, 6.8, -8.8], [4.55, 2.55, 0.65]);
});

showRoof(true);
setActiveButton('viewAll');

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
