// ════════════════════════════════════════════════════════════════════════════
// 화도정 3D 개념 모형 — 편집 가이드 (자주 바뀌는 도면이라 수정 포인트를 여기 정리)
// ════════════════════════════════════════════════════════════════════════════
// ▌좌표계 (단위 m)
//   X = 동서 :  +X = 동(도로측) / −X = 서      (평면도에선 동이 화면 왼쪽 = 미러)
//   Z = 남북 :  +Z = 남(집 뒤)  / −Z = 북(정면·현관·썬룸)
//   Y = 상하 :  지면 상단 groundTopY=0.08, 1층 바닥 firstFloorY=0.78
//   집 발자국 : X 0~8.5, Z −0.7~3.3 (8.5×4.0m). 정면(−Z=북)에 데크/썬룸.
//   ★ 좌우/앞뒤 (주 출입문 보는 시점 — 사용자 확정, 절대 헷갈리지 말 것):
//     왼쪽(좌) = 동 = 높은 X(8.5쪽) = 도로·안방측 │ 오른쪽(우) = 서 = 낮은 X(0쪽) = 거실측
//     앞 = 정면(−Z, 현관·썬룸·마당) │ 뒤 = 집뒤(+Z, 측백·도로 — 마당 없음)
//
// ▌치수는 어디서 바꾸나
//   · 건물·층고·기초·바닥재 : "주요 제원" 블록 (buildingW, foundationHeight, firstWallHeight …)
//   · 다락·지붕 각도/두께   : secondWallHeight, roofSlopeDeg, roofThickness
//   · 대지(부지) 형상       : lotNW/lotNE/lotSE/lotSW 코너 (도로·측백·치수 자동 추종)
//   · 창호/문 크기·위치     : 1층 섹션의 yardSash*, familyWindow*, sideDoor*, livingRearWindow*, entryDoor*
//   · 썬룸                : 썬룸() 내부 targetFrontPostH / targetWallPostH / roofSlopeLength
//   · 데크 계단             : deckStairs({...}) 호출부
//   · 색·재질               : 상단 materials = { … } 객체
//   · 버튼 라벨/업체         : 상단 app.innerHTML 의 <button>
//
// ▌객체 추가/제거 — 토글 그룹 시스템
//   표시는 "그룹 배열 + applyVisibility()" 로 제어. 객체는 한 그룹에 속함:
//     firstFloorObjects/secondFloorObjects/roofObjects/deckObjects/썬룸Objects/
//     wallObjects/foldingObjects/outletObjects/boundaryObjects/foundationObjects/planObjects/extrasObjects
//   · 추가 : 해당 위치에서 box({…})/label(…) → 캡처범위에 자동 분류, 또는 group.push(box({…}))(콘센트·담장식).
//            캡처 패턴: const _s = scene.children.length; … ; group.push(...scene.children.slice(_s));
//            (1층=_firstFloorStart, 다락=captureSecond(), 썬룸=썬룸() 내부)
//   · 제거 : 그 box()/label() 줄 삭제(딸린 치수·라벨도 함께).
//   · 토글 추가: ① app.innerHTML <button id="toggleX"> ② 그룹배열 const ③ applyVisibility() 규칙 ④ 하단 addEventListener.
//
// ▌헬퍼 (전부 전역, x·z는 최소 모서리, 단위 m)
//   box({x,z,w,d,y,h,mat,name,cast}) · label(text,x,y,z,size) · flatPoly({points:[[x,z]…],y,h,mat,name})
//   room/frontSash/sideSash/sideDoor/germanSlidingDoor/entryDoor/pocketDoor* · foundationHeightDim/planDim · setView/applyVisibility
//
// ▌주의 (ES모듈·strict)
//   · 같은 이름 function/const 재정의 금지 → 앱 전체가 깨짐. 새 헬퍼는 새 이름으로.
//   · const는 쓰기 전에 정의(파생값은 원본 뒤). "수치만" 변경은 안전, "줄 이동"은 의존성 확인.
//   · 수정 후 콘솔 에러 0 + 해당 뷰 스크린샷으로 검증.
// ════════════════════════════════════════════════════════════════════════════
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
        <button id="viewPlan" type="button">바닥<span class="btn-sub">배치도</span></button>
        <button id="viewFoundation" type="button">기초<span class="btn-sub">KC금강컨테이너</span><span class="btn-sub btn-sub-xs">시스템말뚝기초 주택용</span></button>
        <button id="viewFirst" type="button">+1층</button>
        <button id="viewSecond" type="button">+다락</button>
        <button id="viewAll" type="button">+지붕<span class="btn-sub">태연남(태양광)</span><span class="btn-sub btn-sub-xs">010-4567-2450</span></button>
        <button id="toggleDeck" type="button" class="toggle">데크<span class="btn-sub">포세린</span><span class="btn-sub btn-sub-xs">1644-6472</span></button>
        <button id="toggle썬룸" type="button" class="toggle">썬룸</button>
        <button id="toggleWall" type="button" class="toggle">외벽<span class="btn-sub">주식회사 단우</span><span class="btn-sub btn-sub-xs">1811-8179</span><span class="btn-sub btn-sub-xs">010-5382-8179</span></button>
        <button id="toggleFolding" type="button" class="toggle">폴딩도어<span class="btn-sub">JJ시스템</span><span class="btn-sub btn-sub-xs">1899-9043</span></button>
        <button id="toggleAccessory" type="button" class="toggle">악세사리</button>
        <button id="toggleOutlet" type="button" class="toggle">콘센트</button>
        <button id="toggleBoundary" type="button" class="toggle">담장<span class="btn-sub">3면 경계</span></button>
        <button id="toggleSteelFrame" type="button" class="toggle">스틸골조<span class="btn-sub">(주)세움스틸하우스</span><span class="btn-sub btn-sub-xs">1544-2909</span></button>
        <button id="toggleWoodFrame" type="button" class="toggle">목골조<span class="btn-sub">중목·경량목구조</span><span class="btn-sub btn-sub-xs">업체 TBD</span></button>
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
controls.maxDistance = 32;

const firstFloorObjects = [];   // 1층 골조·실내(기초 토글 시 숨김)
const secondFloorObjects = [];
const roofObjects = [];
const deckObjects = [];      // 데크 바닥·계단(데크 토글)
const 썬룸Objects = [];   // 썬룸 구조물: 지붕·팬·조명·치수·외피(썬룸 토글)
const 썬룸FrameObjects = []; // 썬룸 철골 골조: 기둥·보·평프레임(골조 토글 또는 썬룸 토글 중 하나라도 켜지면 표시)
const wallObjects = [];      // 썬룸 외벽: 다누몰 자바라 폴딩창(외벽 토글 — 시공 업체 별도)
const foldingObjects = [];   // 거실 데크 3면 폴딩도어(폴딩도어 토글 — 외벽과 상호배타)
const extrasObjects = [];    // 소품: 의자·그릴·화분(전체일 때만 표시)
const outletObjects = [];       // 전기 콘센트(1층) — 콘센트 토글
const atticOutletObjects = [];  // 전기 콘센트(다락) — 콘센트 토글 + 다락 표시 시
const boundaryObjects = [];     // 3면 경계(우측 콘크리트 담장 + 뒤·좌측 측백나무 생울타리) — 담장 토글
const foundationObjects = [];   // 입체 기초(집+데크 시스템말뚝·두부, 높이 치수) — 바닥(평면도)에선 숨김
const foundationDimObjects = []; // 기초 가로/세로·대지 가로/세로 길이 치수 — 기초 뷰에서만(1층·다락·지붕에선 숨김)
const planObjects = [];         // 바닥(평면도): 납작한 기초 발자국 + 평면 치수 — 바닥에서만
const planBoundaryObjects = []; // 바닥(평면도): 납작한 담장·생울타리 발자국 — 바닥 + 담장 토글 시

const materials = {
  site: new THREE.MeshLambertMaterial({ color: 0xa3814f }),   // 흙색(부지 지면)
  yard: new THREE.MeshLambertMaterial({ color: 0x76a96b }),
  road: new THREE.MeshLambertMaterial({ color: 0xcfd8e3 }),
  hedge: new THREE.MeshLambertMaterial({ color: 0x2f7d45 }),
  foundation: new THREE.MeshLambertMaterial({ color: 0xb8b8ad }),
  pile: new THREE.MeshLambertMaterial({ color: 0x7d8186 }),          // 강관 말뚝(아연도금)
  pileHead: new THREE.MeshLambertMaterial({ color: 0x2c3036 }),      // 두부 헤드 브래킷(검정) — 스틸 골조가 볼트 체결되는 부분
  floorFinish: new THREE.MeshLambertMaterial({ color: 0xcdb892 }),   // 바닥재(바닥 시공 20cm) — 기초 위, 1층 마감 아래
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
  soundWall: new THREE.MeshLambertMaterial({ color: 0xcfc6b4 }),   // 방음벽(솔리드): 스틸스터드+암면+석고2겹
  openingEdge: new THREE.MeshLambertMaterial({ color: 0x8f6f35 }),
  gable: new THREE.MeshLambertMaterial({ color: 0xf8fafc, side: THREE.DoubleSide }),
  roof: new THREE.MeshLambertMaterial({ color: 0x565c64, side: THREE.DoubleSide }),   // 징크(그래파이트 그레이) 지붕 260T
  roofEdge: new THREE.MeshLambertMaterial({ color: 0x515966, side: THREE.DoubleSide })
};

// 파쇄석(앞마당) 질감: 베이스 위에 밝고 어두운 점을 뿌려 자갈처럼 보이게 한다.
function makeGravelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#857f72';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i += 1) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = Math.random() * 2.4 + 0.5;
    const base = 92 + Math.random() * 88;
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

// 흙(부지) 질감: 흙색 베이스 + 넓은 색얼룩(흙 톤 변화) + 잔 알갱이/작은 돌.
function makeEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#a3814f';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 64; i += 1) {                 // 넓은 흙 얼룩(밝고 어두운 패치)
    const x = Math.random() * 256, y = Math.random() * 256, r = Math.random() * 42 + 16;
    const c = Math.random() < 0.5 ? [150, 119, 73] : [121, 92, 54];
    ctx.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0.12)`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  for (let i = 0; i < 2200; i += 1) {               // 잔 알갱이/작은 돌
    const x = Math.random() * 256, y = Math.random() * 256, r = Math.random() * 1.8 + 0.3;
    const b = 70 + Math.random() * 110;
    ctx.fillStyle = `rgb(${b}, ${Math.round(b * 0.78)}, ${Math.round(b * 0.5)})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 5);
  return texture;
}
materials.site = new THREE.MeshLambertMaterial({ map: makeEarthTexture() });

// 포세린 타일 데크 — 대형 포세린 포장재(밝은 석재 톤). 썬룸 바닥용.
function makePorcelainDeckTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  // 밝은 쿨 그레이 바탕
  ctx.fillStyle = '#e4e7e9';
  ctx.fillRect(0, 0, 256, 256);
  // 미세한 얼룩(석재 질감)
  for (let i = 0; i < 1400; i += 1) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = Math.random() * 2.2 + 0.3;
    const v = Math.random() < 0.5 ? 240 + Math.random() * 14 : 214 + Math.random() * 16; // 밝고/살짝 어두운 점
    ctx.fillStyle = `rgba(${v}, ${v + 2}, ${v + 4}, 0.16)`;   // 약간 푸른 끼의 중립 회색
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // 은은한 베이닝(불규칙 결)
  for (let g = 0; g < 6; g += 1) {
    ctx.strokeStyle = `rgba(186, 190, 194, ${0.12 + Math.random() * 0.1})`;
    ctx.lineWidth = Math.random() * 1.4 + 0.4;
    ctx.beginPath();
    let x = Math.random() * 256;
    ctx.moveTo(x, 0);
    for (let y = 0; y <= 256; y += 32) {
      x += Math.random() * 40 - 20;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // 타일 줄눈(상/좌 모서리 — 반복 시 연속 격자) — 얕은 음영
  ctx.fillStyle = 'rgba(150, 144, 132, 0.5)';
  ctx.fillRect(0, 0, 256, 3);
  ctx.fillRect(0, 0, 3, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}
materials.porcelainDeck = new THREE.MeshLambertMaterial({ map: makePorcelainDeckTexture() });

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

// 세로(높이) 치수 — 한 모서리에 수직선 + 상·하 틱(X방향) + 라벨. name:'ground'로 프레이밍 제외.
function foundationHeightDim(x, z, y0, y1, text, labelDx = -0.55) {
  const lw = 0.03;
  box({ x: x - lw / 2, z: z - lw / 2, w: lw, d: lw, y: y0, h: y1 - y0, mat: materials.dimension, cast: false, name: 'ground' });
  box({ x: x - 0.13, z: z - lw / 2, w: 0.26, d: lw, y: y0, h: lw, mat: materials.dimension, cast: false, name: 'ground' });
  box({ x: x - 0.13, z: z - lw / 2, w: 0.26, d: lw, y: y1 - lw, h: lw, mat: materials.dimension, cast: false, name: 'ground' });
  label(text, x + labelDx, (y0 + y1) / 2, z, 0.26);   // labelDx: 라벨을 어느 쪽으로 뺄지(+면 바깥)
}

// ── 시스템 말뚝기초(독립기초) — KC금강컨테이너 주택용 ──────────────────────────
// 통슬래브(매트) 대신 강관 말뚝을 격자로 박고, 두부 헤드 브래킷 위에 스틸 골조가 바로 얹혀
// 볼트로 체결된다(별도 받침 각관 없음). 그 위에 바닥(집)·포세린(데크)이 올라간다.
// 말뚝/두부는 그림자 생략(가벼움).
function pileGridCoords(x0, z0, w, d, spacingX, spacingZ) {
  const nx = Math.max(1, Math.round(w / spacingX));
  const nz = Math.max(1, Math.round(d / spacingZ));
  const xs = [];
  const zs = [];
  for (let i = 0; i <= nx; i += 1) xs.push(x0 + (w * i) / nx);
  for (let j = 0; j <= nz; j += 1) zs.push(z0 + (d * j) / nz);
  return { xs, zs };
}

// 말뚝 1본(중심 cx,cz) — 강관(지면~두부) + 검정 두부 헤드 브래킷. 두부 상단 = headTopY(여기에 골조 볼트 체결).
function systemPile(cx, cz, headTopY, cast = false) {
  const capBotY = headTopY - pileCapH;
  const shaftH = capBotY - groundTopY;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(pileR, pileR, shaftH, 16), materials.pile);
  shaft.position.set(cx, groundTopY + shaftH / 2, cz);
  shaft.castShadow = cast;
  shaft.receiveShadow = false;
  scene.add(shaft);
  box({ x: cx - pileCapW / 2, z: cz - pileCapW / 2, w: pileCapW, d: pileCapW, y: capBotY, h: pileCapH, mat: materials.pileHead, cast, receive: false });   // 두부 헤드 브래킷(골조 볼트 체결)
}

// 말뚝 격자(시스템말뚝기초). headTopY = 두부 상단(= 그 위에 스틸 골조/바닥이 직접 얹혀 볼트 체결).
function pileFoundation(x0, z0, w, d, headTopY, { spacingX = 1.7, spacingZ = 1.9, cast = false } = {}) {
  const { xs, zs } = pileGridCoords(x0, z0, w, d, spacingX, spacingZ);
  for (const x of xs) for (const z of zs) systemPile(x, z, headTopY, cast);
}

// 평면(바닥 도면) 치수 — 지면 높이에 납작하게. axis 'z'(고정 x, Z방향) / 'x'(고정 z, X방향).
// labelSide: 라벨을 선 기준 어느 쪽으로 띄울지(+1/-1).
function planDim(axis, fixed, a, b, text, labelSide = -1, labelSize = 0.55, labelDist = 0.6) {
  const y = 0.13, lw = 0.04, tick = 0.3;
  if (axis === 'z') {
    box({ x: fixed - lw / 2, z: a, w: lw, d: b - a, y, h: 0.04, mat: materials.dimension, cast: false, name: 'ground' });
    box({ x: fixed - tick / 2, z: a, w: tick, d: lw, y, h: 0.04, mat: materials.dimension, cast: false, name: 'ground' });
    box({ x: fixed - tick / 2, z: b - lw, w: tick, d: lw, y, h: 0.04, mat: materials.dimension, cast: false, name: 'ground' });
    label(text, fixed + labelSide * labelDist, y + 0.2, (a + b) / 2, labelSize);
  } else {
    box({ x: a, z: fixed - lw / 2, w: b - a, d: lw, y, h: 0.04, mat: materials.dimension, cast: false, name: 'ground' });
    box({ x: a, z: fixed - tick / 2, w: lw, d: tick, y, h: 0.04, mat: materials.dimension, cast: false, name: 'ground' });
    box({ x: b - lw, z: fixed - tick / 2, w: lw, d: tick, y, h: 0.04, mat: materials.dimension, cast: false, name: 'ground' });
    label(text, (a + b) / 2, y + 0.2, fixed + labelSide * labelDist, labelSize);
  }
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
  box({ x: x + frameW, z, w: leafW, d: 0.08, y, h: doorH, mat: materials.entryFrame });   // 문짝 색 = 다른 문·창과 동일(다크그레이)
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

// 거실 전면: 독일식 수평밀착 슬라이딩 시스템도어(출입 가능) — VATON(제이제이시스템) AL PS 타입.
// 굵은 80mm 프로파일 + 2짝 미닫이 만남대(인터록) + 하부 레일 + 세로 손잡이로 일반창과 구분.
function germanSlidingDoor(x, z, w, sillY, h) {
  const frame = 0.08;            // 80mm 독일식 알루미늄 프로파일
  const fd = 0.13;               // 프레임 깊이
  const fz = z - 0.05;
  const glassZ = z - 0.04;
  const F = materials.entryFrame;
  box({ x, z: fz, w: frame, d: fd, y: sillY, h, mat: F });                            // 좌 세로 프레임
  box({ x: x + w - frame, z: fz, w: frame, d: fd, y: sillY, h, mat: F });             // 우 세로 프레임
  box({ x, z: fz, w, d: fd, y: sillY + h - frame, h: frame, mat: F });                // 상부
  box({ x, z: fz, w, d: fd, y: sillY, h: frame * 1.4, mat: F });                      // 하부 레일(출입 문턱)
  const cx = x + w / 2;
  box({ x: cx - frame, z: glassZ + 0.015, w: frame, d: 0.05, y: sillY + frame, h: h - frame * 2, mat: F });  // 앞짝 만남대
  box({ x: cx, z: glassZ - 0.025, w: frame, d: 0.05, y: sillY + frame, h: h - frame * 2, mat: F });          // 뒷짝 만남대
  box({ x: x + frame, z: glassZ + 0.015, w: w / 2 - frame * 1.5, d: 0.045, y: sillY + frame, h: h - frame * 2, mat: materials.glass });  // 좌(앞짝) 유리
  box({ x: cx + frame, z: glassZ - 0.025, w: w / 2 - frame * 1.5, d: 0.045, y: sillY + frame, h: h - frame * 2, mat: materials.glass });  // 우(뒷짝) 유리
  box({ x: cx - frame - 0.04, z: glassZ + 0.07, w: 0.04, d: 0.04, y: sillY + h * 0.4, h: h * 0.22, mat: materials.handle });             // 세로 손잡이
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

// 안방 측면(도로측, 고X 벽) 작은 출입문 — JJ시스템(VATON) AL 시스템도어 SD 여닫이형. 바닥까지 내려오는 유리 leaf + 하부 문턱 + 손잡이.
function sideDoor(x, z, d, baseY, h) {
  const frame = 0.06;
  const frameX = x - 0.04;
  const glassX = x - 0.035;
  const F = materials.entryFrame;
  box({ x: frameX, z, w: 0.1, d: frame, y: baseY, h, mat: F });                       // 앞(저Z) 세로 프레임
  box({ x: frameX, z: z + d - frame, w: 0.1, d: frame, y: baseY, h, mat: F });        // 뒤(고Z) 세로 프레임
  box({ x: frameX, z, w: 0.1, d, y: baseY + h - frame, h: frame, mat: F });           // 상부
  box({ x: frameX, z, w: 0.1, d, y: baseY, h: frame, mat: F });                       // 하부 문턱
  box({ x: glassX, z: z + frame, w: 0.04, d: d - frame * 2, y: baseY + frame, h: h - frame * 2, mat: materials.glass });   // 유리 leaf
  box({ x: glassX - 0.02, z: z + d - 0.2, w: 0.05, d: 0.04, y: baseY + h * 0.42, h: h * 0.16, mat: materials.handle });    // 세로 손잡이
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

// ═══════════ 주요 제원 (여기서 치수 수정 — 단위 m) ═══════════
//   건물 외형
const buildingW = 8.5;                 // 집 가로(동서)
const buildingFrontZ = -0.7;           // 정면(북) 외벽 Z
const buildingBackZ = 3.3;             // 후면(남) 외벽 Z
const buildingD = buildingBackZ - buildingFrontZ;   // 집 깊이(=4.0, 파생)
//   기초·바닥
const groundTopY = 0.08;               // 지면 상단
const foundationHeight = 0.5;          // 집 기초 높이(지면~받침보 상단)
const foundationTopY = groundTopY + foundationHeight;   // 말뚝 두부 상단(0.58) = 바닥재 하단
//   시스템 말뚝기초(독립기초, KC금강컨테이너 주택용) — 강관 말뚝 + 두부 헤드 브래킷(골조 볼트 체결)
const pileR = 0.075;                    // 강관 말뚝 외경 Ø150 (반지름)
const pileCapW = 0.2;                   // 두부 헤드 브래킷 한 변
const pileCapH = 0.12;                  // 두부 헤드 브래킷 높이(스틸 골조 볼트 체결부)
const floorFinishH = 0.20;                              // 바닥재(바닥 시공) 두께 20cm
const firstFloorY = foundationTopY + floorFinishH;      // 1층 바닥 마감 상단(0.78) — 벽·계단·가구가 여기서 시작
const deckFinishT = 0.04;   // 포세린 마감 두께(데크 기초 위에 얹힘 — 건식)
const deckFoundationH = 0.4;    // 데크/썬룸 기초 높이 40cm(집 50cm보다 10cm 낮게 — 단차). 말뚝기초라 높이 자유.
const deckTopY0 = groundTopY + deckFoundationH;   // 데크/썬룸 기초 상단(0.48) = 집 기초 상단(0.58)보다 0.1m 낮음

// 부지(흙색 지면): 집 너비 방향(X) 9.95m × 정면 방향(Z) 9m. 집을 X로 중앙 배치, 뒤로 1m 여유.
const lotW = 9.95;
const lotD = 9;
const lotX0 = -0.50;                    // 거실(정면 오른쪽, 낮은 X) 외벽(x=0)에서 50cm 이격 — 민법 242조(경계 반미터 이상)
const lotX1 = lotX0 + lotW;
const lotZ1 = buildingBackZ + 1;        // 후면 경계(집 뒤 1m)
const lotZ0 = lotZ1 - lotD;             // 전면 경계
box({ x: lotX0, z: lotZ0, w: lotW, d: lotD, h: 0.08, mat: materials.site, cast: false, name: 'ground' });
// 도로(접도) — 부지 바깥. 우측면 + 후면 ㄱ자.
const roadW = 1.1;
box({ x: lotX1, z: lotZ0, w: roadW, d: lotD, h: 0.1, mat: materials.road, cast: false, name: 'ground' });          // 우측 도로(부지 밖)
box({ x: lotX0, z: lotZ1, w: lotW + roadW, d: roadW, h: 0.1, mat: materials.road, cast: false, name: 'ground' });   // 후면 도로(부지 밖, 모서리 연결)

// 3면 경계(담장 토글) — boundaryObjects로 수집해 버튼 하나로 표시 토글.
// 담장(경계벽) — 대지 오른쪽(거실 쪽, 낮은 X) 바깥. 폭 0.2m × 높이 1.0m, 경계선 전체 길이.
const fenceMat = new THREE.MeshLambertMaterial({ color: 0xb0a692 });
boundaryObjects.push(box({ x: lotX0 - 0.2, z: lotZ0, w: 0.2, d: lotD, y: groundTopY, h: 1.0, mat: fenceMat, name: 'ground' }));
// 측백나무 생울타리(상록) — 뒤쪽 + 왼쪽(가족방 쪽, 높은 X) 경계 안쪽 50cm, 높이 1.8m.
boundaryObjects.push(box({ x: lotX0, z: lotZ1 - 0.5, w: lotW, d: 0.5, y: groundTopY, h: 1.8, mat: materials.hedge, name: 'ground' }));   // 후면 생울타리
boundaryObjects.push(box({ x: lotX1 - 0.5, z: lotZ0, w: 0.5, d: lotD, y: groundTopY, h: 1.8, mat: materials.hedge, name: 'ground' }));   // 왼쪽(가족방) 생울타리

// 대지 가로/세로(전체) 치수 — 입체 뷰에서만. 바닥(평면도)에선 분할 치수를 쓰므로 숨김(foundationObjects).
captureInto(foundationObjects, () => {
  const lotDimY = 0.12;
  const lotDimZ = lotZ0 - 0.35;   // 전면 바깥쪽 가로 치수선
  box({ x: lotX0, z: lotDimZ, w: lotW, d: 0.04, y: lotDimY, h: 0.04, mat: materials.dimension, cast: false, name: 'ground' });
  box({ x: lotX0, z: lotDimZ - 0.15, w: 0.04, d: 0.34, y: lotDimY, h: 0.04, mat: materials.dimension, cast: false, name: 'ground' });
  box({ x: lotX1 - 0.04, z: lotDimZ - 0.15, w: 0.04, d: 0.34, y: lotDimY, h: 0.04, mat: materials.dimension, cast: false, name: 'ground' });
  label(`대지 가로 ${lotW}m`, (lotX0 + lotX1) / 2, 0.34, lotDimZ - 0.5, 0.36);
  const lotDimX = lotX0 - 0.35;   // 좌측 바깥쪽 세로 치수선
  box({ x: lotDimX, z: lotZ0, w: 0.04, d: lotD, y: lotDimY, h: 0.04, mat: materials.dimension, cast: false, name: 'ground' });
  box({ x: lotDimX - 0.15, z: lotZ0, w: 0.34, d: 0.04, y: lotDimY, h: 0.04, mat: materials.dimension, cast: false, name: 'ground' });
  box({ x: lotDimX - 0.15, z: lotZ1 - 0.04, w: 0.34, d: 0.04, y: lotDimY, h: 0.04, mat: materials.dimension, cast: false, name: 'ground' });
  label(`대지 세로 ${lotD}m`, lotDimX - 0.55, 0.34, (lotZ0 + lotZ1) / 2, 0.36);
});
// 입체 집 기초(시스템말뚝 + 두부) — foundationObjects(1층·다락·지붕에도 표시, 바닥에선 발자국으로 대체)
captureInto(foundationObjects, () => {
  // 말뚝 격자는 외주 벽 중심선(가장자리에서 0.1=외벽/2 안쪽)에 정렬.
  const m = 0.1;
  pileFoundation(m, buildingFrontZ + m, buildingW - 2 * m, buildingD - 2 * m, foundationTopY, { spacingX: 1.7, spacingZ: 1.9 });
  foundationHeightDim(buildingW + 0.2, buildingBackZ - 0.4, groundTopY, foundationTopY, '말뚝기초 0.5m', 0.6);
});
// 기초 가로/세로 길이 치수 — 기초 뷰에서만(1층·다락·지붕에선 숨김)
captureInto(foundationDimObjects, () => {
  box({ x: 0, z: buildingBackZ + 0.18, w: buildingW, d: 0.035, y: foundationTopY + 0.02, h: 0.035, mat: materials.dimension });
  box({ x: 0, z: buildingBackZ + 0.08, w: 0.035, d: 0.27, y: foundationTopY + 0.02, h: 0.035, mat: materials.dimension });
  box({ x: buildingW - 0.035, z: buildingBackZ + 0.08, w: 0.035, d: 0.27, y: foundationTopY + 0.02, h: 0.035, mat: materials.dimension });
  label('기초 가로 8.5m', buildingW / 2, foundationTopY + 0.3, buildingBackZ + 0.5, 0.34);
  box({ x: buildingW + 0.18, z: buildingFrontZ, w: 0.035, d: buildingD, y: foundationTopY + 0.02, h: 0.035, mat: materials.dimension });
  box({ x: buildingW + 0.08, z: buildingFrontZ, w: 0.27, d: 0.035, y: foundationTopY + 0.02, h: 0.035, mat: materials.dimension });
  box({ x: buildingW + 0.08, z: buildingBackZ - 0.035, w: 0.27, d: 0.035, y: foundationTopY + 0.02, h: 0.035, mat: materials.dimension });
  label('기초 세로 4.0m', buildingW + 0.58, foundationTopY + 0.3, buildingFrontZ + buildingD / 2, 0.34);
});

const _firstFloorStart = scene.children.length;   // 여기부터 다락 빌드 직전까지가 1층 그룹

// 바닥재(바닥 시공 20cm) — 기초 슬래브 위에 얹히는 마감층. 1층 벽·계단·가구는 이 위(firstFloorY)에서 시작.
box({ x: 0, z: buildingFrontZ, w: buildingW, d: buildingD, y: foundationTopY, h: floorFinishH, mat: materials.floorFinish });
foundationHeightDim(-0.2, buildingFrontZ + 0.5, foundationTopY, firstFloorY, '바닥재 0.2m');

// 1F measured plan. Dimensions are in meters within an 8.5m x 4.0m footprint.
//   1층 층고·벽 두께 (제원)
const firstWallY = firstFloorY;
const firstWallHeight = 2.6;            // 1층 벽 높이
const exteriorWall = 0.2;               // 외벽 두께
const interiorWall = 0.1;               // 내벽 두께
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
const entryDoorLeafW = 1.0;     // 현관 문짝 유효폭 1000mm
const entryFrameOuterW = 1.1;   // 문틀 외곽(좌우 프레임 50mm씩 포함)
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
//   다락·지붕 (제원)
const secondFloorThickness = 0.15;     // 다락 바닥 슬래브 두께
const secondWallHeight = 1.10;         // 다락 무릎벽 높이(가중평균 ~1.75m로 다락 1.8m 한도 안전마진)
const roofSlopeDeg = 33;               // 지붕 물매(도)
const roofSlopeTan = Math.tan(THREE.MathUtils.degToRad(roofSlopeDeg));
const gableRise = roofSlopeTan * (buildingD / 2);
const roofThickness = 0.26;            // 지붕(단열 260T+징크) 두께
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
const stairBathD = insideZ1 - stairBathZ;   // WC를 계단 턴 아래까지 늘려 뒤쪽 외벽에 맞붙임(2.62m)
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
// 안방 전면은 출입창이 아니라 일반 창문 — 통상 규격: 폭 1800, 창대(sill) 바닥+900, 상단은 현관·거실 도어와 동일선
const familyWindowW = 1.8;
const familyWindowX = firstFamilyX + (firstFamilyW - familyWindowW) / 2;
const familyWindowSillY = firstFloorY + 0.9;
const familyWindowTopY = yardSashTopY;
const familyWindowH = familyWindowTopY - familyWindowSillY;   // ≈1.28m
const entryDoorBaseY = firstWallY + yardDeckH;
const kitchenSinkW = 2.2;
const kitchenSinkD = 0.6;
const kitchenSinkH = 0.85;
const kitchenSinkX = insideX0;   // 오른쪽(저X) 외벽에 붙임
const kitchenSinkZ = insideZ1 - kitchenSinkD;   // 싱크대는 뒤쪽 벽으로(앞 입구 확보)
const kitchenCounterY = firstFloorY + kitchenSinkH + 0.05;   // 싱크대 상판 높이(≈바닥+0.90)
// 싱크대 창: 상판+백스플래시 위에서 시작, 윗선은 전면 도어와 동일선(2.18), 싱크대 위로 센터링
const livingRearWindowW = 2.0;
const livingRearWindowX = kitchenSinkX + (kitchenSinkW - livingRearWindowW) / 2;
const livingRearWindowSillY = kitchenCounterY + 0.15;
const livingRearWindowTopY = yardSashTopY;
const livingRearWindowH = livingRearWindowTopY - livingRearWindowSillY;
const familyRearWindowW = 1.8;                       // 안방 전면창과 동일 폭
const familyRearWindowX = firstFamilyX + (firstFamilyW - familyRearWindowW) / 2;   // 안방 중앙
const familyRearWindowSillY = firstFloorY + 0.9;     // 일반 창대(전면창과 동일)
const familyRearWindowTopY = yardSashTopY;           // 윗선을 거실 싱크대 창·전면 개구부와 동일선(2.18)
const familyRearWindowH = familyRearWindowTopY - familyRearWindowSillY;   // ≈1.28m
const familyRoadWindowW = 1.8;
// 안방 측면(도로측) 전면쪽 작은 출입문 — 800×2100 여닫이. 바깥 작은 공간으로 출입.
const sideDoorW = 0.8;
const sideDoorZ = insideZ0 + 0.2;                        // 전면쪽(코너에서 0.2m 띄움)
const sideDoorBaseY = firstFloorY;                       // 바닥에서 시작(출입)
const sideDoorH = 2.1;
const sideDoorTopY = sideDoorBaseY + sideDoorH;
const familyRoadWindowZ = sideDoorZ + sideDoorW + 0.3;   // 문 뒤로 0.3m 벽기둥 두고 도로측 창
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
// 다락 정면 복도쪽: 기존 창 2개 제거 → 중앙 환기창 1개
const atticVentWindowW = 0.9;                              // 환기창 폭
const atticVentWindowX = (buildingW - atticVentWindowW) / 2;   // 정면 중앙
// 계단 픽스창 — 1층에서 올라갈 때 첫 구간(저-X 런)은 후면(+Z)을 보고 오르므로, 후면에 둬야 올라가며 하늘이 보임
const atticSkyWindowW = 0.7;
const atticSkyWindowH = 0.95;
const atticSkyWindowSillOffset = 0.10;
const atticSkyWindowX = (stairClearX + stairHighXWallX) / 2 - atticSkyWindowW / 2;   // 계단실 가로 중앙
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

// 1층 높이는 바닥재(20cm)를 포함 — 기초 상단(바닥재 하단)부터 천장까지 2.8m
box({ x: frontCornerDimX, z: frontCornerDimZ, w: 0.035, d: 0.035, y: foundationTopY, h: firstWallHeight + floorFinishH, mat: materials.dimension });
box({ x: frontCornerDimTickX, z: frontCornerDimZ, w: 0.35, d: 0.035, y: foundationTopY, h: 0.035, mat: materials.dimension });
box({ x: frontCornerDimTickX, z: frontCornerDimZ, w: 0.35, d: 0.035, y: firstWallY + firstWallHeight - 0.035, h: 0.035, mat: materials.dimension });
label('1층 높이 2.8m', frontCornerDimLabelX, (foundationTopY + firstWallY + firstWallHeight) / 2, frontCornerDimLabelZ, 0.32);

room({ x: firstLivingX, z: insideZ0, w: firstLivingW, d: firstLivingD, y: firstFloorY + floorOverlayLift, mat: materials.living, text: roomText('거실+주방', firstLivingW, firstLivingD) });
// 거실 벽걸이 에어컨(실내기) — 오른쪽(서측) 외벽 x=insideX0 안쪽, 천장 가까이. 실외기는 통풍 좋은 곳에 별도.
{
  const acW = 0.85, acH = 0.30, acD = 0.22;
  const acZ = insideZ0 + 1.2;
  const acY = firstFloorY + firstWallHeight - 0.45;
  box({ x: insideX0, z: acZ, w: acD, d: acW, y: acY, h: acH, mat: materials.wall });                                           // 본체(흰색)
  box({ x: insideX0 + 0.05, z: acZ + 0.06, w: acD - 0.04, d: acW - 0.12, y: acY - 0.015, h: 0.025, mat: materials.openingEdge });   // 하부 토출 슬릿
  label('벽걸이 에어컨', insideX0 + 0.55, acY + 0.17, acZ + acW / 2, 0.22);
}
// 에어컨 실외기 — 후면(뒤) 거실(서)쪽 코너, 측백 향해(+Z) 토출. 배관은 서측 외벽 따라 뒤로.
{
  const esW = 0.8, esD = 0.35, esH = 0.6;
  const esX = 0.3;                          // 서(거실)측 코너
  const esZ = buildingBackZ + 0.1;          // 집 뒤 벽 바로 뒤(집~측백 사이)
  box({ x: -0.04, z: 1.0, w: 0.06, d: (esZ + 0.1) - 1.0, y: groundTopY + 0.35, h: 0.06, mat: materials.guard });        // 배관(서측 외벽 따라 뒤로)
  box({ x: esX, z: esZ, w: esW, d: esD, y: groundTopY, h: esH, mat: materials.guard });                                 // 실외기 본체
  box({ x: esX + 0.15, z: esZ + esD - 0.02, w: esW - 0.3, d: 0.025, y: groundTopY + 0.13, h: 0.42, mat: materials.openingEdge });   // 토출 팬그릴(측백쪽 +Z)
  label('에어컨 실외기', esX + esW / 2, groundTopY + esH + 0.28, esZ + 0.2, 0.24);
}
box({ x: kitchenSinkX, z: kitchenSinkZ, w: kitchenSinkW, d: kitchenSinkD, y: firstFloorY, h: kitchenSinkH, mat: materials.sinkCabinet });
box({ x: kitchenSinkX, z: kitchenSinkZ, w: kitchenSinkW, d: kitchenSinkD, y: firstFloorY + kitchenSinkH, h: 0.05, mat: materials.counter });
box({ x: kitchenSinkX + 0.62, z: kitchenSinkZ + 0.16, w: 0.72, d: 0.32, y: firstFloorY + kitchenSinkH + 0.05, h: 0.04, mat: materials.sinkBasin });
box({ x: kitchenSinkX + 1.03, z: kitchenSinkZ + 0.08, w: 0.08, d: 0.08, y: firstFloorY + kitchenSinkH + 0.09, h: 0.24, mat: materials.entryFrame });
label(`싱크대 ${Number(kitchenSinkW.toFixed(2))}x${Number(kitchenSinkD.toFixed(2))}m`, kitchenSinkX + kitchenSinkW / 2, firstFloorY + 1.2, kitchenSinkZ + kitchenSinkD / 2, 0.26);
// 인덕션 쿡탑 — 싱크대 우측. 가스레인지·LPG 대체(전기 일원화, 가스통 불필요).
{
  const ckX = kitchenSinkX + 1.5, ckZ = kitchenSinkZ + 0.08, ckW = 0.55, ckD = 0.45;
  box({ x: ckX, z: ckZ, w: ckW, d: ckD, y: kitchenCounterY, h: 0.012, mat: materials.openingEdge });                         // 인덕션 검정 유리 상판
  box({ x: ckX + 0.09, z: ckZ + 0.11, w: 0.18, d: 0.18, y: kitchenCounterY + 0.012, h: 0.004, mat: materials.guard });      // 화구1
  box({ x: ckX + 0.33, z: ckZ + 0.16, w: 0.14, d: 0.14, y: kitchenCounterY + 0.012, h: 0.004, mat: materials.guard });      // 화구2
  label('인덕션', ckX + ckW / 2, kitchenCounterY + 0.22, ckZ + ckD / 2, 0.22);
}
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
// 계단하부 WC는 외벽에 안 접한 무창 화장실 → 기계환기 필수: 천장 배기팬 + 덕트로 뒤쪽 외벽에서 외부 환기캡으로 배기
{
  const ventX = stairBathX + stairBathW / 2;
  // WC 천장은 계단 밑 경사면 → 뒤쪽 실사용 천장선은 바닥+약 1.3m(벽 절반). 배기팬은 그 천장선 바로 아래(WC 실내 공기 안)여야 실제로 배기됨.
  const capY = firstFloorY + 1.08;
  box({ x: ventX - 0.12, z: insideZ1 - 0.06, w: 0.24, d: 0.06, y: capY, h: 0.22, mat: materials.guard });           // 실내 벽붙이 배기팬 그릴(천장선 바로 아래)
  box({ x: ventX - 0.05, z: insideZ1 - 0.11, w: 0.1, d: 0.06, y: capY + 0.06, h: 0.1, mat: materials.guard });      // 팬 흡입구
  box({ x: ventX - 0.13, z: buildingBackZ, w: 0.26, d: 0.05, y: capY, h: 0.22, mat: materials.entryFrame });          // 뒤 외벽 외부 환기캡(방수 후드)
  box({ x: ventX - 0.14, z: buildingBackZ + 0.03, w: 0.28, d: 0.06, y: capY - 0.03, h: 0.05, mat: materials.entryFrame });  // 하단 빗물막이 립
  label('화장실 배기구', ventX, capY + 0.34, buildingBackZ + 0.28, 0.24);
}
box({ x: stairClearX, z: stairOpeningStart, w: stairClearW, d: insideZ1 - stairOpeningStart, y: firstFloorY + floorOverlayLift - floorSurfaceH, h: floorSurfaceH, mat: materials.stair, cast: false });
room({ x: firstFamilyX, z: insideZ0, w: firstFamilyW, d: firstFamilyD, y: firstFloorY + floorOverlayLift, mat: materials.bed, text: roomText('안방', firstFamilyW, firstFamilyD) });

// 1F walls
horizontalWallWithGaps(0, buildingFrontZ, 8.5, firstWallY, [
  [livingYardSashX, livingYardSashX + yardSashW],
  [familyWindowX, familyWindowX + familyWindowW],
  [entryGapStart, entryGapEnd]
], firstWallHeight, exteriorWall, materials.exteriorWall);
// 거실 전면: 가족방과 동일한 출입 가능 샷시(데크로 통하는 전면 도어창) — 상부 인방만
lowWall(livingYardSashX, buildingFrontZ, yardSashW, exteriorWall, yardSashTopY, firstWallY + firstWallHeight - yardSashTopY, materials.exteriorWall);
lowWall(familyWindowX, buildingFrontZ, familyWindowW, exteriorWall, firstWallY, familyWindowSillY - firstWallY, materials.exteriorWall);          // 안방 창 아래(창대벽 900)
lowWall(familyWindowX, buildingFrontZ, familyWindowW, exteriorWall, familyWindowTopY, firstWallY + firstWallHeight - familyWindowTopY, materials.exteriorWall);   // 안방 창 위(인방)
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
  [sideDoorZ, sideDoorZ + sideDoorW]
], firstWallHeight, exteriorWall, materials.exteriorWall);
lowWall(insideX1, sideDoorZ, exteriorWall, sideDoorW, sideDoorTopY, firstWallY + firstWallHeight - sideDoorTopY, materials.exteriorWall);   // 측면 출입문 위(인방)
// 안방-화장실/계단 사이 내벽 — 방음벽(솔리드): 스틸스터드+암면 충진+양면 석고 2겹. 두께 0.16(일반 내벽 0.10보다 두껍게).
const soundWall = 0.16;
verticalWallWithGaps(stairHighXWallX, insideZ0, insideD, firstWallY, [
  [familyDoorZ, familyDoorZ + interiorDoorW]
], firstWallHeight, soundWall, materials.soundWall);
lowWall(stairHighXWallX, familyDoorZ, soundWall, interiorDoorW, firstWallY + interiorDoorH, firstWallHeight - interiorDoorH, materials.soundWall);
label('안방·화장실 방음벽\n(암면+석고2겹)', stairHighXWallX + 0.1, firstFloorY + 1.95, 1.8, 0.24);
horizontalWallWithGaps(stairBathX, stairBathZ, stairBathW, firstWallY, [
  [stairBathDoorX, stairBathDoorEndX]
], stairBathWallH, interiorWall, materials.stairWall);
lowWall(stairBathDoorX, stairBathZ, stairBathDoorW, interiorWall, firstWallY + stairBathDoorH, stairBathWallH - stairBathDoorH, materials.stairWall);
germanSlidingDoor(livingYardSashX, buildingFrontZ - 0.04, yardSashW, yardSashSillY, yardSashH); // 거실 전면 독일식 시스템도어(출입·현관 높이 2.1m)
label('거실 독일식 시스템도어 VATON PS', livingYardSashX + yardSashW / 2, yardSashTopY + 0.14, buildingFrontZ - 0.35, 0.24);
entryDoor(entryGapStart, buildingFrontZ - 0.04, entryFrameOuterW, entryDoorLeafW, entryDoorBaseY);
frontSash(familyWindowX, buildingFrontZ - 0.04, familyWindowW, familyWindowSillY, familyWindowH);   // 안방 전면 창문(1800×1280, 창대 900)
frontSash(livingRearWindowX, insideZ1 + 0.04, livingRearWindowW, livingRearWindowSillY, livingRearWindowH); // 싱크대용 창(후면)
frontSash(familyRearWindowX, insideZ1 + 0.04, familyRearWindowW, familyRearWindowSillY, familyRearWindowH);
sideDoor(insideX1 + 0.04, sideDoorZ, sideDoorW, sideDoorBaseY, sideDoorH);   // 안방 측면 출입문(전면쪽, 도로측 창 대신)
label('안방 측면 출입문', insideX1 + 0.5, sideDoorTopY + 0.05, sideDoorZ + sideDoorW / 2, 0.24);
interiorDoorHorizontal(stairBathDoorX, stairBathZ, firstFloorY, stairBathDoorW, stairBathDoorH);
pocketDoorVertical(stairHighXWallX, familyDoorZ, firstFloorY, interiorDoorH, 1);

// 안방 침대 2.0 x 2.0m — 뒤쪽 벽(높은 Z) + 동쪽(도로측, 높은 X) 코너. 머리맡=동쪽(높은 X) 벽.
{
  const bedW = 2.0;
  const bedD = 2.0;
  const bedX = insideX1 - bedW;        // 왼쪽(높은 X) 외벽에 붙임
  const bedZ = insideZ1 - bedD;        // 뒤쪽 외벽에 붙임
  const frameMat = new THREE.MeshLambertMaterial({ color: 0x8a6b4a });    // 원목 프레임
  const mattressMat = new THREE.MeshLambertMaterial({ color: 0xf3eee3 }); // 매트리스
  const duvetMat = new THREE.MeshLambertMaterial({ color: 0xb9cbe0 });    // 이불
  const pillowMat = new THREE.MeshLambertMaterial({ color: 0xffffff });   // 베개
  const frameH = 0.3;
  const mattressH = 0.2;
  box({ x: bedX, z: bedZ, w: bedW, d: bedD, y: firstFloorY, h: frameH, mat: frameMat });                            // 프레임
  box({ x: insideX1 - 0.08, z: bedZ, w: 0.08, d: bedD, y: firstFloorY, h: frameH + 0.45, mat: frameMat });          // 헤드보드(동쪽=높은 X 벽)
  box({ x: bedX + 0.05, z: bedZ + 0.05, w: bedW - 0.13, d: bedD - 0.1, y: firstFloorY + frameH, h: mattressH, mat: mattressMat });
  box({ x: bedX + 0.05, z: bedZ + 0.05, w: (bedW - 0.13) * 0.6, d: bedD - 0.1, y: firstFloorY + frameH + mattressH, h: 0.06, mat: duvetMat });  // 이불(발치=서쪽~중간)
  for (const pz of [bedZ + 0.18, bedZ + bedD - 0.18 - 0.7]) {              // 베개 2개(머리맡=동쪽/높은 X)
    box({ x: insideX1 - 0.5, z: pz, w: 0.4, d: 0.7, y: firstFloorY + frameH + mattressH, h: 0.12, mat: pillowMat });
  }
  label('침대 2.0x2.0m', bedX + bedW / 2, firstFloorY + 1.0, bedZ + bedD / 2, 0.28);
}

// 1층 창 전동커튼 레일(펠멧) — 창 상부 안쪽에 슬림 박스. 전동커튼 설치를 전제(콘센트는 별도).
const curtainBoxMat = new THREE.MeshLambertMaterial({ color: 0xe7e1d4 });
function curtainRail({ x, z, len, headY, axis = 'x', sign = 1 }) {
  const boxH = 0.12;
  const proj = 0.14;                  // 실내로 돌출
  const ceil = firstWallY + firstWallHeight;
  const y = Math.min(headY + 0.02, ceil - 0.02) - boxH;
  if (axis === 'x') {                 // 전/후면 벽(창이 x를 따라). sign: 실내 방향(+z/-z)
    box({ x: x - 0.05, z: sign > 0 ? z : z - proj, w: len + 0.1, d: proj, y, h: boxH, mat: curtainBoxMat, cast: false, receive: false });
  } else {                            // 측벽(창이 z를 따라). sign: 실내 방향(+x/-x)
    box({ x: sign > 0 ? x : x - proj, z: z - 0.05, w: proj, d: len + 0.1, y, h: boxH, mat: curtainBoxMat, cast: false, receive: false });
  }
}
curtainRail({ x: livingYardSashX, z: insideZ0, len: yardSashW, headY: yardSashTopY, axis: 'x', sign: 1 });           // 거실 전면 출입창
curtainRail({ x: familyWindowX, z: insideZ0, len: familyWindowW, headY: familyWindowTopY, axis: 'x', sign: 1 });          // 안방 전면 창문
curtainRail({ x: livingRearWindowX, z: insideZ1, len: livingRearWindowW, headY: livingRearWindowTopY, axis: 'x', sign: -1 }); // 거실 후면창
curtainRail({ x: familyRearWindowX, z: insideZ1, len: familyRearWindowW, headY: familyRearWindowTopY, axis: 'x', sign: -1 }); // 가족방 후면창

firstFloorObjects.push(...scene.children.slice(_firstFloorStart));   // 1층 골조·실내 그룹 확정(다락 빌드 전)

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
  label(`다락 벽높이 ${secondWallHeight.toFixed(2)}m`, frontCornerDimLabelX, secondWallY + secondWallHeight / 2, frontCornerDimLabelZ, 0.28);

  // 용마루(뾰족) 높이 — 왼쪽(도로측) 벽, 박공 꼭짓점(z=용마루 중앙)
  const atticRidgeZ = buildingFrontZ + buildingD / 2;
  const atticPeakH = secondWallHeight + gableRise;
  box({ x: frontCornerDimX, z: atticRidgeZ, w: 0.035, d: 0.035, y: secondWallY, h: atticPeakH, mat: materials.dimension });
  box({ x: frontCornerDimTickX, z: atticRidgeZ, w: 0.35, d: 0.035, y: secondWallY, h: 0.035, mat: materials.dimension });
  box({ x: frontCornerDimTickX, z: atticRidgeZ, w: 0.35, d: 0.035, y: secondWallY + atticPeakH - 0.035, h: 0.035, mat: materials.dimension });
  label(`용마루 ${atticPeakH.toFixed(2)}m`, frontCornerDimLabelX, secondWallY + atticPeakH / 2, atticRidgeZ, 0.28);

  // 다락방 문이 있는 벽 높이 — 칸막이(secondAtticWallZ) 위치, 왼쪽 벽
  box({ x: frontCornerDimX, z: secondAtticWallZ, w: 0.035, d: 0.035, y: secondWallY, h: secondAtticFrontWallH, mat: materials.dimension });
  box({ x: frontCornerDimTickX, z: secondAtticWallZ, w: 0.35, d: 0.035, y: secondWallY, h: 0.035, mat: materials.dimension });
  box({ x: frontCornerDimTickX, z: secondAtticWallZ, w: 0.35, d: 0.035, y: secondWallY + secondAtticFrontWallH - 0.035, h: 0.035, mat: materials.dimension });
  label(`다락방 벽 ${secondAtticFrontWallH.toFixed(2)}m`, frontCornerDimLabelX, secondWallY + secondAtticFrontWallH / 2, secondAtticWallZ, 0.28);

  // 2F exterior walls use a 1.15m loft eave wall; the gable rise is calculated from a 33 degree roof pitch.
  horizontalWallWithGaps(0, buildingFrontZ, buildingW, secondWallY, [
    [atticVentWindowX, atticVentWindowX + atticVentWindowW]
  ], secondWallHeight, exteriorWall, materials.exteriorWall);
  lowWall(atticVentWindowX, buildingFrontZ, atticVentWindowW, exteriorWall, secondWallY, secondCorridorWindowSillOffset, materials.exteriorWall);
  lowWall(atticVentWindowX, buildingFrontZ, atticVentWindowW, exteriorWall, secondWallY + secondCorridorWindowTopOffset, secondWallHeight - secondCorridorWindowTopOffset, materials.exteriorWall);
  frontSash(atticVentWindowX, buildingFrontZ - 0.04, atticVentWindowW, secondWallY + secondCorridorWindowSillOffset, secondCorridorWindowH);
  horizontalWallWithGaps(0, insideZ1, buildingW, secondWallY, [
    [atticRoom1RearWindowX, atticRoom1RearWindowX + atticRearWindowW],
    [atticRoom2RearWindowX, atticRoom2RearWindowX + atticRearWindowW],
    [atticSkyWindowX, atticSkyWindowX + atticSkyWindowW]
  ], secondWallHeight, exteriorWall, materials.exteriorWall);
  for (const windowX of [atticRoom1RearWindowX, atticRoom2RearWindowX]) {
    lowWall(windowX, insideZ1, atticRearWindowW, exteriorWall, secondWallY, atticRearWindowSillOffset, materials.exteriorWall);
    lowWall(windowX, insideZ1, atticRearWindowW, exteriorWall, secondWallY + atticRearWindowTopOffset, secondWallHeight - atticRearWindowTopOffset, materials.exteriorWall);
    frontSash(windowX, insideZ1 + 0.04, atticRearWindowW, secondWallY + atticRearWindowSillOffset, atticRearWindowH);
  }
  // 계단 픽스창(후면 중앙, 저-X 런 정면 — 1층에서 올라가며 하늘 보임)
  lowWall(atticSkyWindowX, insideZ1, atticSkyWindowW, exteriorWall, secondWallY, atticSkyWindowSillOffset, materials.exteriorWall);
  lowWall(atticSkyWindowX, insideZ1, atticSkyWindowW, exteriorWall, secondWallY + atticSkyWindowSillOffset + atticSkyWindowH, secondWallHeight - (atticSkyWindowSillOffset + atticSkyWindowH), materials.exteriorWall);
  frontSash(atticSkyWindowX, insideZ1 + 0.04, atticSkyWindowW, secondWallY + atticSkyWindowSillOffset, atticSkyWindowH);
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
  // (계단 개구부 앞 난간·커브는 아래 '다락 입구 가로벽'이 대신하므로 제거 — 벽이 막으니 난간 불필요)
  pocketDoorHorizontal(secondRoom1DoorX, secondAtticWallZ, secondWallY, interiorDoorW, secondAtticDoorH, -1);
  pocketDoorHorizontal(secondRoom2DoorX, secondAtticWallZ, secondWallY, interiorDoorW, secondAtticDoorH, 1);
  lowWall(secondRoom1DoorX, secondAtticWallZ, interiorDoorW, interiorWall, secondWallY + secondAtticDoorH, secondAtticFrontWallH - secondAtticDoorH, materials.wall);   // 다락방1 문 위 인방
  lowWall(secondRoom2DoorX, secondAtticWallZ, interiorDoorW, interiorWall, secondWallY + secondAtticDoorH, secondAtticFrontWallH - secondAtticDoorH, materials.wall);   // 다락방2 문 위 인방

  // 다락 입구 — 계단 개구부를 가로벽(문 구멍 1개)으로 막음. 닫으면 다락 전체가 1층과 분리(1층 개방 유지).
  // 다락방 칸막이와 같은 Z선(secondAtticWallZ=stairOpeningStart)·높이라 벽이 한 줄로 이어짐.
  const atticStairDoorX = stairHighXRunX + (stairRunW - interiorDoorW) / 2;
  horizontalWallWithGaps(stairClearX, stairOpeningStart, stairClearW, secondWallY, [[atticStairDoorX, atticStairDoorX + interiorDoorW]], secondAtticFrontWallH, interiorWall);
  lowWall(atticStairDoorX, stairOpeningStart, interiorDoorW, interiorWall, secondWallY + secondAtticDoorH, secondAtticFrontWallH - secondAtticDoorH, materials.wall);   // 문 위 인방(개구부 위 막음)
  interiorDoorHorizontal(atticStairDoorX, stairOpeningStart, secondWallY, interiorDoorW, secondAtticDoorH);
  label('다락 입구 단열문', atticStairDoorX + interiorDoorW / 2, secondWallY + 1.0, stairOpeningStart - 0.5, 0.24);
});

{
  const roofSideOverhang = 0.4;
  const roofEaveOverhang = 0.6;
  const secondWallTop = secondY + secondFloorThickness + secondWallHeight;
  const ridgeY = secondWallTop + gableRise;
  const outerEaveY = secondWallTop - roofSlopeTan * roofEaveOverhang;
  const ridgeZ = buildingFrontZ + buildingD / 2;
  // 다락 위 지붕 구성: 단열 260T(다락 천장 단열층) + 그 위 징크 마감
  materials.roofInsul = new THREE.MeshLambertMaterial({ color: 0xe6d9b8, side: THREE.DoubleSide });   // 단열재 260T
  const zincFin = 0.05;   // 징크 마감 두께
  const eaveZF = buildingFrontZ - roofEaveOverhang;
  const eaveZB = buildingBackZ + roofEaveOverhang;
  roofObjects.push(
    // 단열재 260T
    roofSlab({ eaveZ: eaveZF, ridgeZ, eaveY: outerEaveY, ridgeY, sideOverhang: roofSideOverhang, thickness: roofThickness, mat: materials.roofInsul }),
    roofSlab({ eaveZ: eaveZB, ridgeZ, eaveY: outerEaveY, ridgeY, sideOverhang: roofSideOverhang, thickness: roofThickness, mat: materials.roofInsul }),
    // 징크 마감(단열 위)
    roofSlab({ eaveZ: eaveZF, ridgeZ, eaveY: outerEaveY + zincFin, ridgeY: ridgeY + zincFin, sideOverhang: roofSideOverhang, thickness: zincFin, mat: materials.roof }),
    roofSlab({ eaveZ: eaveZB, ridgeZ, eaveY: outerEaveY + zincFin, ridgeY: ridgeY + zincFin, sideOverhang: roofSideOverhang, thickness: zincFin, mat: materials.roof })
  );
  // 지붕 경사 각도 표기 — 전면 경사면 중턱 위에 띄움(+지붕 뷰에서만)
  const eaveZ = buildingFrontZ - roofEaveOverhang;
  const slopeMidZ = (eaveZ + ridgeZ) / 2;
  const slopeMidY = (outerEaveY + ridgeY) / 2;
  roofObjects.push(label('지붕: 단열 260T + 리얼징크(티타늄아연, 갈바륨 아님) · 경사 33°', buildingW / 2, slopeMidY + 0.55, slopeMidZ, 0.34));
  // 태양광 패널은 뒤쪽(남측) 지붕 별도 블록에서 그림 — 여기선 눈막이용 헬퍼만 둠.
  materials.snowGuard = new THREE.MeshLambertMaterial({ color: 0xaeb7bf });    // 눈막이 금속
  const backEaveZ = buildingBackZ + roofEaveOverhang;
  const onSlope = (ez, t) => ({ z: ez + t * (ridgeZ - ez), y: outerEaveY + t * (ridgeY - outerEaveY) });   // t=0 처마 → 1 용마루

  // ── 눈막이(스노우가드) 가로바 — 처마 근처, 양 슬로프 각 2줄(쌓인 눈이 한꺼번에 미끄러지지 않게) ──
  const snowGuard = (ez, t) => {
    const p = onSlope(ez, t);
    roofObjects.push(box({ x: -roofSideOverhang, z: p.z - 0.025, w: buildingW + roofSideOverhang * 2, d: 0.05, y: p.y + 0.11, h: 0.05, mat: materials.snowGuard, cast: false }));   // 가로 파이프바
    const n = 7;
    for (let i = 0; i <= n; i += 1) {
      const bx = -roofSideOverhang + (buildingW + roofSideOverhang * 2) * (i / n);
      roofObjects.push(box({ x: bx - 0.02, z: p.z - 0.02, w: 0.04, d: 0.04, y: p.y + 0.02, h: 0.11, mat: materials.snowGuard, cast: false }));   // 브래킷
    }
  };
  snowGuard(backEaveZ, 0.12); snowGuard(backEaveZ, 0.22);   // 남측(집 뒤) — 태양광 아래(z≈3.1) ~ 처마쪽
  snowGuard(eaveZ, 0.12); snowGuard(eaveZ, 0.22);           // 북측(정면) — 처마쪽 2줄

  // ── 처마 물받이(홈통) + 도로측(고-X) 우수관 ──
  materials.gutter = new THREE.MeshLambertMaterial({ color: 0x9aa1a8 });
  const eaveTopY = outerEaveY + zincFin;
  [eaveZ, backEaveZ].forEach((ez) => {
    const out = ez < ridgeZ ? -1 : 1;            // 처마 바깥 방향(Z)
    const gz = ez + out * 0.06;
    const gutterY = eaveTopY - 0.17;
    roofObjects.push(box({ x: -roofSideOverhang - 0.05, z: gz - 0.065, w: buildingW + roofSideOverhang * 2 + 0.1, d: 0.13, y: gutterY, h: 0.12, mat: materials.gutter, cast: false }));   // 처마홈통(가로)
    // 우수관: 고-X(도로측) 벽 모서리를 타고 수직으로. 처마홈통 → 벽 모서리 연결관 → 지면까지.
    const cornerZ = ez < ridgeZ ? buildingFrontZ : buildingBackZ;   // 고-X 벽의 앞/뒤 모서리
    const dx = buildingW + 0.04;                                    // 고-X 벽 바깥면(8.54)
    roofObjects.push(box({ x: dx, z: Math.min(gz, cornerZ) - 0.04, w: 0.08, d: Math.abs(cornerZ - gz) + 0.08, y: gutterY - 0.05, h: 0.08, mat: materials.gutter, cast: false }));   // 처마→벽모서리 연결관
    roofObjects.push(box({ x: dx, z: cornerZ - 0.04, w: 0.08, d: 0.08, y: groundTopY, h: (gutterY - 0.03) - groundTopY, mat: materials.gutter, cast: false }));   // 수직 우수관(벽 모서리)
  });
  roofObjects.push(label('우수관(도로측 벽 모서리)', buildingW + 0.5, 1.9, buildingBackZ, 0.28));
}

// ───────────────────────────────────────────────────────────────────────────
// 스틸 골조((주)세움스틸하우스) — 1층/다락/지붕 골조. "골조" 단일 토글로 일괄 제어.
// 부재는 아연도금 경량형강 느낌의 얇은 회색 박스로 표현(스터드·트랙·장선·서까래·용마루).
// ───────────────────────────────────────────────────────────────────────────
materials.steelFrame = new THREE.MeshLambertMaterial({ color: 0x9fb1bd });
materials.woodFrame = new THREE.MeshLambertMaterial({ color: 0xc69c6d });   // 목골조(중목·경량목) 목재 마감

const steelFrameObjects = [];   // 스틸 골조(스틸골조 토글) — 1층·다락·지붕 일괄
const woodFrameObjects = [];    // 목골조(목골조 토글) — 동일 형상, 목재 마감
let frameMat = materials.steelFrame;   // 현재 골조 빌드 재질(스틸/목재 두 벌로 빌드)

const STUD_SPACING = 0.5;       // 스터드 간격(통상 45~60cm)
const FRAME_WEB = 0.092;        // C형강 웨브(벽 두께 방향)
const FRAME_FLANGE = 0.045;     // C형강 플랜지(벽 길이 방향)
const TRACK_H = 0.05;           // 상·하 트랙(러너) 높이

function captureInto(arr, fn) {
  const s = scene.children.length;
  fn();
  arr.push(...scene.children.slice(s));
}

// 수직 스터드 1개(중심 cx,cz). axis 'x'=벽이 X축을 따라감(플랜지가 x), 'z'=벽이 Z축을 따라감.
function frameStud(cx, cz, yBottom, height, axis) {
  if (height <= 0) return;
  const w = axis === 'x' ? FRAME_FLANGE : FRAME_WEB;
  const d = axis === 'x' ? FRAME_WEB : FRAME_FLANGE;
  box({ x: cx - w / 2, z: cz - d / 2, w, d, y: yBottom, h: height, mat: frameMat, cast: false, receive: false });
}

// 수평 트랙(러너). axis 'x'=고정 z를 따라 X로, 'z'=고정 x를 따라 Z로.
function frameTrack(axis, fixed, start, end, y) {
  if (axis === 'x') box({ x: start, z: fixed - FRAME_WEB / 2, w: end - start, d: FRAME_WEB, y, h: TRACK_H, mat: frameMat, cast: false, receive: false });
  else box({ x: fixed - FRAME_WEB / 2, z: start, w: FRAME_WEB, d: end - start, y, h: TRACK_H, mat: frameMat, cast: false, receive: false });
}

// 스터드 벽(상·하 트랙 + 등간격 스터드).
function studWall(axis, fixed, start, end, yBottom, height) {
  frameTrack(axis, fixed, start, end, yBottom);
  frameTrack(axis, fixed, start, end, yBottom + height - TRACK_H);
  const len = end - start;
  const n = Math.max(1, Math.round(len / STUD_SPACING));
  for (let i = 0; i <= n; i += 1) {
    const t = start + len * (i / n);
    if (axis === 'x') frameStud(t, fixed, yBottom + TRACK_H, height - 2 * TRACK_H, 'x');
    else frameStud(fixed, t, yBottom + TRACK_H, height - 2 * TRACK_H, 'z');
  }
}

// 경사 서까래 1개(x 고정, z-y 평면에서 (z0,y0)→(z1,y1)).
function rafter(x, z0, y0, z1, y1, depth = 0.14) {
  const dz = z1 - z0, dy = y1 - y0;
  const len = Math.hypot(dz, dy);
  const m = new THREE.Mesh(new THREE.BoxGeometry(FRAME_FLANGE, depth, len), frameMat);
  m.position.set(x, (y0 + y1) / 2, (z0 + z1) / 2);
  m.rotation.x = Math.atan2(-dy, dz);
  m.castShadow = false;
  m.receiveShadow = false;
  scene.add(m);
}

// 골조 기준 좌표(벽 중심선 / 지붕 기하 — 지붕 슬래브 블록과 동일 값)
const frFrontZ = buildingFrontZ + exteriorWall / 2;    // 전면 벽 중심선
const frBackZ = buildingBackZ - exteriorWall / 2;      // 후면 벽 중심선
const frLeftX = exteriorWall / 2;                      // 좌측 박공벽 중심선
const frRightX = buildingW - exteriorWall / 2;         // 우측 박공벽 중심선
const frSecondWallY = secondY + secondFloorThickness;  // 다락 무릎벽 하단
const frGableBaseY = frSecondWallY + secondWallHeight;  // 박공 시작(무릎벽 상단)
const frRidgeY = frGableBaseY + gableRise;             // 용마루
const frRidgeZ = buildingFrontZ + buildingD / 2;
const frEaveOverhang = 0.6;
const frSideOverhang = 0.4;
const frOuterEaveY = frGableBaseY - roofSlopeTan * frEaveOverhang;
const frEaveZFront = buildingFrontZ - frEaveOverhang;
const frEaveZBack = buildingBackZ + frEaveOverhang;
const gableTopY = (z) => frGableBaseY + gableRise - roofSlopeTan * Math.abs(z - frRidgeZ);

// 집 골조 1벌 빌드(현재 frameMat 재질로) — 1층 외주벽+계단 내벽 / 다락 장선·무릎벽·박공 / 지붕 용마루·서까래.
// 스틸·목재 두 벌로 각각 빌드해 상호배타 토글로 한 번에 하나만 표시.
function buildHouseFrame(name) {
  // ── 1층 골조: 외주 스터드 벽 4면 + 계단 코어 내벽 2면 ──
  studWall('x', frFrontZ, frLeftX, frRightX, firstWallY, firstWallHeight);   // 전면
  studWall('x', frBackZ, frLeftX, frRightX, firstWallY, firstWallHeight);    // 후면
  studWall('z', frLeftX, frFrontZ, frBackZ, firstWallY, firstWallHeight);    // 좌측 박공
  studWall('z', frRightX, frFrontZ, frBackZ, firstWallY, firstWallHeight);   // 우측 박공
  studWall('z', stairLowXWallX, insideZ0, insideZ1, firstWallY, firstWallHeight);   // 계단 내벽(우)
  studWall('z', stairHighXWallX, insideZ0, insideZ1, firstWallY, firstWallHeight);  // 계단 내벽(좌)
  // ── 다락 골조: 바닥 장선 + 무릎벽(전·후) + 박공 단부 스터드(좌·우) ──
  const joistY = secondY;
  const joistH = secondFloorThickness - 0.01;
  const nJoist = Math.max(1, Math.round((insideX1 - insideX0) / 0.45));     // 짧은 방향(Z)으로 스팬, X 등간격
  for (let i = 0; i <= nJoist; i += 1) {
    const jx = insideX0 + (insideX1 - insideX0) * (i / nJoist);
    box({ x: jx - FRAME_FLANGE / 2, z: insideZ0, w: FRAME_FLANGE, d: insideD, y: joistY, h: joistH, mat: frameMat, cast: false, receive: false });
  }
  box({ x: insideX0, z: insideZ0, w: insideX1 - insideX0, d: FRAME_FLANGE, y: joistY, h: joistH, mat: frameMat, cast: false, receive: false });            // 림장선(전)
  box({ x: insideX0, z: insideZ1 - FRAME_FLANGE, w: insideX1 - insideX0, d: FRAME_FLANGE, y: joistY, h: joistH, mat: frameMat, cast: false, receive: false }); // 림장선(후)
  studWall('x', frFrontZ, frLeftX, frRightX, frSecondWallY, secondWallHeight);   // 전면 무릎벽 1.15m
  studWall('x', frBackZ, frLeftX, frRightX, frSecondWallY, secondWallHeight);    // 후면 무릎벽 1.15m
  for (const gx of [frLeftX, frRightX]) {                                        // 박공 단부 스터드(경사 상단까지)
    frameTrack('z', gx, frFrontZ, frBackZ, frSecondWallY);
    const len = frBackZ - frFrontZ;
    const n = Math.max(1, Math.round(len / STUD_SPACING));
    for (let i = 0; i <= n; i += 1) {
      const z = frFrontZ + len * (i / n);
      frameStud(gx, z, frSecondWallY + TRACK_H, gableTopY(z) - frSecondWallY - TRACK_H, 'z');
    }
  }
  // ── 지붕 골조: 용마루 보 + 양면 서까래(오버행 포함) ──
  const ridgeX0 = frLeftX - frSideOverhang - 0.05;
  const ridgeX1 = frRightX + frSideOverhang + 0.05;
  box({ x: ridgeX0, z: frRidgeZ - 0.04, w: ridgeX1 - ridgeX0, d: 0.08, y: frRidgeY - 0.16, h: 0.16, mat: frameMat, cast: false, receive: false }); // 용마루 보
  const rx0 = frLeftX - frSideOverhang;
  const rx1 = frRightX + frSideOverhang;
  const nr = Math.max(1, Math.round((rx1 - rx0) / 0.6));
  for (let i = 0; i <= nr; i += 1) {
    const x = rx0 + (rx1 - rx0) * (i / nr);
    rafter(x, frRidgeZ, frRidgeY, frEaveZFront, frOuterEaveY);   // 전면 슬로프
    rafter(x, frRidgeZ, frRidgeY, frEaveZBack, frOuterEaveY);    // 후면 슬로프
  }
  label(name, frRightX + 0.7, frGableBaseY + 0.2, frRidgeZ, 0.36);
}

// 두 모드(스틸/목재)로 각각 빌드 — 상호배타 토글로 한 번에 하나만 표시.
frameMat = materials.steelFrame;
captureInto(steelFrameObjects, () => buildHouseFrame('스틸 골조 (C형강 · 세움스틸)'));
frameMat = materials.woodFrame;
captureInto(woodFrameObjects, () => buildHouseFrame('목골조 (중목 · 경량목구조)'));
frameMat = materials.steelFrame;

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

// 1층 거실 앞 썬룸 — 지붕 길이(전면 돌출) 4m. 지붕 = 리얼징크(불투명).
//  · 데크 상단(집 바닥 높이)에서 시작, 앞단(최저) 기둥 2.4m, 건물쪽은 1층 높이에 부착
//  · 프레임/기둥은 지붕 가장자리에서 20cm 안쪽(3면 세로벽이 이 선에 설치)
//  roofLowX/roofW로 X 범위를 지정해 거실 앞·가족방 앞에 같은 형식으로 각각 설치한다.
function 썬룸({ roofLowX, roofW, withFurniture = true, withPostDims = true, withWalls = true, deckDepth = null, postsToGround = false, connectRightX = null, withFan = true, withShortPostDim = false, withFlatFrame = true, withGutter = false, withDownspout = false, withDeck = true, withRoofPanel = true, roofPanelW = null, roofPanelCenterX = null }) {
  const frameInset = 0.2;                      // 가장자리에서 20cm 안쪽
  const beamH = 0.12;
  const beamDrop = 0.04;
  const wallZ = buildingFrontZ;
  const roofSlopeLength = 4.0;                     // 지붕 경사면 길이(실제 지붕면)
  const targetFrontPostH = 2.6;                     // 앞단(최저) 기둥 높이 목표(데크 상단 기준)
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
  // 썬룸 지붕 = 리얼징크(불투명, 본 지붕과 동일 그래파이트 그레이). 50년·적설·본 지붕 통일로 확정.
  const 썬룸RoofMat = new THREE.MeshLambertMaterial({ color: 0x565c64, side: THREE.DoubleSide });
  const 썬룸Frame = materials.entryFrame;

  // 가시성 그룹 분류용: 이 함수가 scene에 추가하는 모든 객체를 기록해 두고,
  // 데크 바닥/소품(가구)만 따로 표시한 뒤 나머지는 썬룸 구조물로 분류한다.
  const _addStart = scene.children.length;
  const deckLocal = [];      // 데크 바닥·바닥 치수 라벨
  const wallLocal = [];      // 썬룸 외벽(다누몰 자바라) — 별도 토글
  const foldingLocal = [];   // 거실 데크 3면 폴딩도어 — 외벽 대안(상호배타)
  const extrasLocal = [];    // 캠핑 가구(의자 등)
  const foundationLocal = []; // 땅 기둥 시스템말뚝(+두부·라벨) — 기초 그룹으로 분류(썬룸 토글 무관, 기초 뷰에도 표시)
  const frameLocal = [];      // 썬룸 철골 골조(기둥·보·평프레임) — 골조 그룹으로 분류(골조 토글에도 표시)

  // 리얼징크 지붕면(앞으로 물매) — 불투명 금속. 단일 지붕으로 합칠 때 폭/중심을 override해 하나의 패널로.
  const panelLen = Math.hypot(frontZ - wallZ, yAtFront - yAtWall);
  const rpW = (roofPanelW != null) ? roofPanelW : roofW;       // 단일 합치기 시 실제 지붕면 폭
  const rpCx = (roofPanelCenterX != null) ? roofPanelCenterX : roofCenterX;
  if (withRoofPanel) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(rpW, 0.04, panelLen), 썬룸RoofMat);
    panel.position.set(rpCx, (yAtWall + yAtFront) / 2, (wallZ + frontZ) / 2);
    panel.rotation.x = -tilt;
    scene.add(panel);
  }

  // 프레임(지붕 가장자리 20cm 안쪽): 벽측 보 + 앞단 보 + 양측 경사 보
  const fX0 = roofLowX + frameInset;            // = -0.2 (오른쪽 벽선 바깥)
  const fX1 = roofHighX - frameInset;
  const fFrontZ = frontZ + frameInset;
  const fWallZ = wallZ;                          // 벽측은 건물에 부착
  // connectRightX가 지정되면 오른쪽(낮은 X) 프레임을 별도로 두지 않고 이웃 썬룸 프레임선까지 보를 연장한다.
  const beamX0 = (connectRightX != null) ? connectRightX : fX0;
  frameLocal.push(box({ x: beamX0, z: fWallZ - 0.04, w: fX1 - beamX0, d: 0.08, y: glassYatZ(fWallZ) - beamDrop - beamH, h: beamH, mat: 썬룸Frame }));
  frameLocal.push(box({ x: beamX0, z: fFrontZ - 0.04, w: fX1 - beamX0, d: 0.08, y: glassYatZ(fFrontZ) - beamDrop - beamH, h: beamH, mat: 썬룸Frame }));
  const sideLen = Math.hypot(fFrontZ - fWallZ, glassYatZ(fFrontZ) - glassYatZ(fWallZ));
  const sideMidZ = (fWallZ + fFrontZ) / 2;
  const sideMidY = (glassYatZ(fWallZ) + glassYatZ(fFrontZ)) / 2 - beamDrop - beamH / 2;
  const sideXs = (connectRightX != null) ? [fX1 - 0.04] : [fX0 + 0.04, fX1 - 0.04]; // 오른쪽 측면 보 생략
  for (const sx of sideXs) {
    const sideBeam = new THREE.Mesh(new THREE.BoxGeometry(0.08, beamH, sideLen), 썬룸Frame);
    sideBeam.position.set(sx, sideMidY, sideMidZ);
    sideBeam.rotation.x = -tilt;
    sideBeam.castShadow = true;
    sideBeam.receiveShadow = false;
    scene.add(sideBeam);
    frameLocal.push(sideBeam);
  }
  // 렉산(경사 지붕) 프레임은 둘레(테두리) 보만 둔다 — 내부 격자는 두꺼워 내부가 안 보이므로 생략.

  // 지지 기둥(프레임 선 위, 지면~보 밑면).
  //  · 안방(connectRightX): 땅 기둥 3개(앞·측면중앙·집벽쪽) — 모두 건물 외곽선(fX1=8.5) 안쪽 0.1로 인셋(거실 데크 말뚝·집 말뚝열과 정렬, 한 직선). 정면 3m 무주.
  //  · 거실: 전면 3 + 양측 중앙 2 + 폴딩도어 집벽쪽 양 끝 2 = 7개(데크 위라 그대로).
  const postW = 0.12;
  const 안방PostX = fX1 - 0.1;   // 안방 땅 기둥 X열: 건물 외곽선 안쪽 0.1(중심선이 아니라 기준선 안쪽)
  const postPlaces = (connectRightX != null)
    ? [[안방PostX, fFrontZ], [안방PostX, sideMidZ], [안방PostX, fWallZ]]
    : [[fX0, fFrontZ], [(fX0 + fX1) / 2, fFrontZ], [fX1, fFrontZ], [fX0, sideMidZ], [fX1, sideMidZ], [fX0, fWallZ], [fX1, fWallZ]];
  // 땅에 서는 기둥(개방형 썬룸)은 각 기둥 밑에 시스템 말뚝기초(집·데크와 동일, KC금강)를 박고 그 위에 얹는다.
  // 데크 위 기둥은 데크 기초가 받치므로 별도 기초 불필요.
  const postBaseY = deckTopY0;   // 썬룸 기초 상단(0.4m·집보다 0.1m 낮음) — 땅 기둥/데크 기둥 동일 높이로 통일
  const groundPosts = [];      // 땅 기둥 위치(바닥 도면 말뚝 표시에 사용)
  postPlaces.forEach(([px, pz], i) => {
    const topY = glassYatZ(pz) - beamDrop - beamH;
    if (postsToGround) {
      // 말뚝·두부·라벨은 기초 그룹으로 분류 → 기초 뷰에서도 집·데크와 동일하게 보임(썬룸 토글 무관)
      captureInto(foundationLocal, () => {
        systemPile(px, pz, postBaseY);   // 강관 말뚝 + 두부 보강판(집·데크 기초와 동일 종류)
        if (i === 0) label('기둥 시스템말뚝기초', px, postBaseY + 0.3, pz - 0.4, 0.24);
      });
      groundPosts.push([px, pz]);
    }
    frameLocal.push(box({ x: px - postW / 2, z: pz - postW / 2, w: postW, d: postW, y: postBaseY, h: topY - postBaseY, mat: 썬룸Frame }));
  });

  // ── 썬룸 물받이(앞단 처마 홈통) + (옵션) 왼쪽(고-X) 모서리 기둥 우수관 ──
  if (withGutter) {
    const gutterMat = materials.gutter || new THREE.MeshLambertMaterial({ color: 0x9aa1a8 });
    const gx0 = (connectRightX != null) ? connectRightX : fX0;
    const gutterY = yAtFront - 0.13;                          // 앞단(최저) 지붕 가장자리 바로 아래
    box({ x: gx0, z: frontZ - 0.11, w: fX1 - gx0, d: 0.12, y: gutterY, h: 0.10, mat: gutterMat });   // 앞단 처마 홈통(가로)
    if (withDownspout) {
      const dpx = fX1 - 0.035;                               // 왼쪽(고-X) 모서리 기둥
      box({ x: dpx, z: frontZ - 0.06, w: 0.07, d: frameInset + 0.08, y: gutterY - 0.04, h: 0.06, mat: gutterMat });   // 홈통 → 모서리 기둥 연결관
      box({ x: dpx, z: fFrontZ - 0.08, w: 0.07, d: 0.07, y: groundTopY, h: (gutterY - 0.04) - groundTopY, mat: gutterMat });   // 모서리 기둥 따라 지면까지 수직 우수관
      label('썬룸 우수관(왼쪽 모서리)', fX1 + 0.5, (gutterY + groundTopY) / 2 + 0.3, fFrontZ, 0.26);
    }
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
      frameLocal.push(box({ x: flatX0, z: z - barW / 2, w: fw, d: barW, y: flatFrameY, h: barH, mat: 썬룸Frame }));
    }
    for (const x of [flatX0, fX1, xMid]) {                  // 좌·우 + 십자 세로
      frameLocal.push(box({ x: x - barW / 2, z: fFrontZ, w: barW, d: fd, y: flatFrameY, h: barH, mat: 썬룸Frame }));
    }
  }

  // 썬룸 외벽 — 다누몰 포시즌 자바라(폴리카보네이트 접이식 폴딩 창)로 3면(전면·양측) 시공.
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
    const wallBaseY = deckTopY0;                                // 창벽 하단 = (낮춘) 데크 상단
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

  // 폴딩도어(외벽 대안) — 거실 썬룸 3면. 맑은 유리 + 넓은 폴딩 패널(0.65m) + 다크 프레임 + 출입 손잡이.
  const _foldingStart = scene.children.length;
  if (withWalls) {
    const fdGlass = new THREE.MeshLambertMaterial({ color: 0xcfe6f0, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false });
    const fdDoorGlass = new THREE.MeshLambertMaterial({ color: 0x8aa9bb, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }); // 800 출입문짝: 같은 유리 계열 살짝 짙게(구별용)
    const fdFrame = new THREE.MeshLambertMaterial({ color: 0x3a3f45 });   // 폴딩 알루미늄 프레임(다크그레이)
    const glaze = 0.05, sillH = 0.1, mullW = 0.05, fdPanel = 0.65;        // 폴딩 패널 1짝 폭 0.65m
    const wallBaseY = deckTopY0;
    // 전면
    const frontTopY = wallTopAtZ(fFrontZ);
    box({ x: fX0, z: fFrontZ - glaze / 2, w: fX1 - fX0, d: glaze, y: wallBaseY + sillH, h: frontTopY - wallBaseY - sillH, mat: fdGlass, cast: false });
    box({ x: fX0, z: fFrontZ - 0.05, w: fX1 - fX0, d: 0.1, y: wallBaseY, h: sillH, mat: fdFrame });
    box({ x: fX0, z: fFrontZ - 0.05, w: fX1 - fX0, d: 0.1, y: frontTopY - 0.06, h: 0.06, mat: fdFrame });
    // 정면 — 왼쪽(=동=높은 X=fX1) 첫짝 = 800mm 출입문, 나머지 균등 → 오른쪽(fX0)으로 (왼→오 외측 접힘)
    const fdEntryW = 0.8;
    const fdRestW = (fX1 - fX0) - fdEntryW;
    const fdRestN = Math.max(1, Math.round(fdRestW / fdPanel));
    const fdMullX = [fX1, fX1 - fdEntryW];
    for (let j = 1; j <= fdRestN; j += 1) fdMullX.push(fX1 - fdEntryW - fdRestW * (j / fdRestN));
    for (const mx of fdMullX) {
      box({ x: mx - mullW / 2, z: fFrontZ - 0.07, w: mullW, d: 0.14, y: wallBaseY + sillH, h: frontTopY - wallBaseY - sillH, mat: fdFrame, cast: false });
    }
    box({ x: fX1 - fdEntryW + 0.025, z: fFrontZ - glaze / 2 - 0.02, w: fdEntryW - 0.05, d: glaze, y: wallBaseY + sillH, h: frontTopY - wallBaseY - sillH, mat: fdDoorGlass, cast: false });  // 800 출입문짝 살짝 짙게
    label('정면 왼쪽(동) 첫짝 = 800 출입문', fX1 - 0.4, wallBaseY + 1.45, fFrontZ - 0.25, 0.24);
    // 양측
    const sdEntryW = 0.8;   // 왼쪽(동) 측면 앞쪽 첫짝 = 800 출입문
    for (const sideX of [fX0, fX1]) {
      yzWallPrism({ x: sideX - glaze / 2, thickness: glaze, mat: fdGlass, points: [
        [fWallZ, wallBaseY + sillH], [fFrontZ, wallBaseY + sillH], [fFrontZ, wallTopAtZ(fFrontZ)], [fWallZ, wallTopAtZ(fWallZ)]
      ] });
      box({ x: sideX - 0.05, z: fFrontZ, w: 0.1, d: fWallZ - fFrontZ, y: wallBaseY, h: sillH, mat: fdFrame });
      if (sideX === fX1) {
        // 왼쪽(동) 측면 — 앞쪽(−Z) 첫짝 = 800 출입문, 나머지 균등 → 뒤(+Z 집벽)로 외측 접힘
        const sdRestL = (fWallZ - fFrontZ) - sdEntryW;
        const sdRestN = Math.max(1, Math.round(sdRestL / fdPanel));
        const sdMullZ = [fFrontZ, fFrontZ + sdEntryW];
        for (let j = 1; j <= sdRestN; j += 1) sdMullZ.push(fFrontZ + sdEntryW + sdRestL * (j / sdRestN));
        for (const mz of sdMullZ) {
          box({ x: sideX - 0.07, z: mz - mullW / 2, w: 0.14, d: mullW, y: wallBaseY + sillH, h: wallTopAtZ(mz) - wallBaseY - sillH, mat: fdFrame, cast: false });
        }
        box({ x: sideX - glaze / 2 - 0.02, z: fFrontZ + 0.025, w: glaze, d: sdEntryW - 0.05, y: wallBaseY + sillH, h: wallTopAtZ(fFrontZ) - wallBaseY - sillH, mat: fdDoorGlass, cast: false });  // 800 출입문짝 살짝 짙게
        label('왼쪽(동) 측면 앞 첫짝 = 800 출입문', sideX + 0.45, wallBaseY + 1.45, fFrontZ + 0.4, 0.24);
      } else {
        // 오른쪽(서, fX0) 측면 — 연통구(스토브 분할) 높이로 상·하 2등분: 아래 고정 / 위만 폴딩(밖으로 열림)
        const splitY = wallBaseY + deckFinishT + 0.55;   // 스토브 불연패널 상단과 동일선
        const sillY = wallBaseY + sillH;
        box({ x: sideX - 0.06, z: fFrontZ, w: 0.12, d: fWallZ - fFrontZ, y: splitY - 0.025, h: 0.05, mat: fdFrame, cast: false });   // 수평 분할 레일(연통구 높이)
        const sP = Math.max(2, Math.round((fWallZ - fFrontZ) / fdPanel));
        for (let i = 0; i <= sP; i += 1) {               // 위쪽(폴딩, 밖으로 열림): 분할선~지붕 세로 접이살
          const mz = fFrontZ + (fWallZ - fFrontZ) * (i / sP);
          box({ x: sideX - 0.07, z: mz - mullW / 2, w: 0.14, d: mullW, y: splitY, h: wallTopAtZ(mz) - splitY, mat: fdFrame, cast: false });
        }
        for (const ez of [fFrontZ, fWallZ]) {            // 아래쪽(고정): 세로 분할 없는 고정 유리 띠 — 끝단 세로 프레임만
          box({ x: sideX - 0.06, z: ez - mullW / 2, w: 0.12, d: mullW, y: sillY, h: splitY - sillY, mat: fdFrame, cast: false });
        }
        label('오른쪽(서) 측면 — 아래 고정 / 위 밖으로 열림(연통구 높이 2등분)', sideX - 0.4, splitY + 0.55, (fFrontZ + fWallZ) / 2, 0.24);
      }
    }
    // 출입문 손잡이 — 정면 왼쪽(동) 첫짝 800(걸쇠측) + 왼쪽 측면 앞쪽 800(걸쇠측 = 뒤쪽 모서리)
    box({ x: fX1 - 0.65, z: fFrontZ - 0.13, w: 0.045, d: 0.045, y: wallBaseY + 0.95, h: 0.28, mat: materials.handle });
    box({ x: fX1 - 0.13, z: fFrontZ + sdEntryW - 0.13, w: 0.045, d: 0.045, y: wallBaseY + 0.95, h: 0.28, mat: materials.handle });
  }
  foldingLocal.push(...scene.children.slice(_foldingStart));   // 폴딩도어 객체 별도 토글 그룹

  // 썬룸 바닥 — 포세린 타일 마감(건식). 데크 기초(0.4m·집보다 0.1m 낮음)+토대보 위에 마감층이 얹힌다.
  const deckTopY = deckTopY0 + deckFinishT;       // 데크 상단 = (낮춘) 기초 상단 + 마감 두께(집 바닥보다 26cm 낮음)
  const deckThickness = deckFinishT;             // 마감층만(하부 기초는 함수 밖에서 별도 생성)
  const deckEdge = postW / 2;                    // 기둥(프레임 선)이 데크 위에 완전히 얹히도록 기둥 바깥면까지 확장
  const dX0 = (connectRightX != null) ? connectRightX : fX0 - deckEdge; // 오른쪽: 연결 시 이웃 데크까지 이어 붙임
  const dX1 = fX1;                               // 고-X(안방쪽)는 개방부라 돌출 없이 유리벽 선까지만(데크 폭 = 5.5)
  const dWallZ = fWallZ;                          // 건물쪽은 벽에 붙임
  // deckDepth가 지정되면 건물 벽에서 그 거리까지만 데크를 깐다(부분 데크).
  const dFrontZ = (deckDepth != null) ? dWallZ - deckDepth : fFrontZ - deckEdge;
  if (withDeck) {                                  // 데크 바닥 마감(없는 썬룸은 지붕·기둥만)
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(dX1 - dX0, deckThickness, dWallZ - dFrontZ),
      materials.porcelainDeck
    );
    deck.position.set((dX0 + dX1) / 2, deckTopY - deckThickness / 2, (dFrontZ + dWallZ) / 2);
    deck.receiveShadow = true;
    scene.add(deck);
    deckLocal.push(deck, addGeometryEdges(deck, 0x9a9384));
  }

  // 썬룸 지붕/바닥 사이즈 표시 — 지붕은 경사면 길이, 바닥은 물매 반영한 수평투영(증축 신고 면적 기준)
  const roofMidZ = (wallZ + frontZ) / 2;
  if (withRoofPanel) {   // 지붕면을 그리는 썬룸만 라벨(단일 합치기 시 실제 패널 폭으로)
    label(`썬룸 지붕 ${Number(rpW.toFixed(2))}×${Number(roofSlopeLength.toFixed(2))}m (경사면)`, rpCx, glassYatZ(roofMidZ) + 0.34, roofMidZ, 0.3);
  }
  if (withDeck) {
    const floorW = fX1 - fX0;
    const floorL = (deckDepth != null) ? deckDepth : (fWallZ - fFrontZ); // 데크 깊이(부분 데크면 그 값)
    const floorArea = floorW * floorL;
    const floorLabelZ = (deckDepth != null) ? fWallZ - deckDepth / 2 : (fWallZ + fFrontZ) / 2;
    deckLocal.push(label(`썬룸 바닥(수평투영) ${Number(floorW.toFixed(2))}×${Number(floorL.toFixed(2))}m = ${floorArea.toFixed(1)}㎡`, (fX0 + fX1) / 2, firstFloorY + 0.06, floorLabelZ, 0.28));
  }

  // 기둥 높이 치수(앞단·집 벽쪽) — 두 썬룸가 같은 규격이라 한쪽에만 표기
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

  // 가장 짧은(앞단) 기둥 높이 — 기둥이 지면에 서는 개방형 썬룸용(가족방 앞). 왼쪽(높은 X) 기둥 바깥에 표기.
  if (withShortPostDim) {
    const fpTopY = glassYatZ(fFrontZ) - beamDrop - beamH;   // 앞단 보 밑면
    const fpH = fpTopY - postBaseY;                          // 지면(postBaseY)~보 밑면 = 가장 짧은 기둥
    const dimX2 = fX1 + 0.25;                                // 왼쪽 기둥 바깥으로 치수선
    box({ x: dimX2 - 0.018, z: fFrontZ - 0.018, w: 0.035, d: 0.035, y: postBaseY, h: fpH, mat: materials.dimension }); // 세로 치수선
    box({ x: dimX2 - 0.2, z: fFrontZ - 0.018, w: 0.4, d: 0.035, y: postBaseY, h: 0.035, mat: materials.dimension });   // 하단 틱(지면)
    box({ x: dimX2 - 0.2, z: fFrontZ - 0.018, w: 0.4, d: 0.035, y: fpTopY - 0.035, h: 0.035, mat: materials.dimension }); // 상단 틱
    label(`최저(앞단) 기둥 ${Number(fpH.toFixed(2))}m`, dimX2 + 0.35, postBaseY + fpH / 2, fFrontZ, 0.28);
  }

  // 썬룸 천장: 실링팬(옵션) + 양옆 조명(오른쪽 1, 왼쪽 1) — 추가된 평평한 프레임에 매단다
  const 썬룸CenterX = (fX0 + fX1) / 2;
  const 썬룸CenterZ = (fWallZ + fFrontZ) / 2;
  const 썬룸CeilY = withFlatFrame ? flatFrameY : glassYatZ(썬룸CenterZ) - 0.02;   // 평평한 프레임 밑면(없으면 경사 지붕 밑면)
  if (withFan) ceilingFan({ x: 썬룸CenterX, z: 썬룸CenterZ, ceilingY: 썬룸CeilY, drop: 0.25, bladeLength: 0.55 });
  const 썬룸LampMat = new THREE.MeshLambertMaterial({ color: 0xfff4cf, emissive: 0xffe39c, emissiveIntensity: 0.9 });
  for (const lampX of [썬룸CenterX - 1.3, 썬룸CenterX + 1.3]) {  // -:오른쪽(낮은 X), +:왼쪽(높은 X)
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.05, 16), materials.guard);
    housing.position.set(lampX, 썬룸CeilY - 0.025, 썬룸CenterZ);
    housing.castShadow = false;
    housing.receiveShadow = false;
    scene.add(housing);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.035, 16), 썬룸LampMat);
    lens.position.set(lampX, 썬룸CeilY - 0.06, 썬룸CenterZ);
    lens.castShadow = false;
    lens.receiveShadow = false;
    scene.add(lens);
  }

  // 썬룸 캠핑 가구 — 스노우피크 IGT 4칸/3칸(한쪽 사이드테이블) + 반고 햄프턴 DLX 의자
  const _furnStart = scene.children.length;
  if (withFurniture) {
    const tableZ = 썬룸CenterZ - 0.05;
    igtTable({ cx: 썬룸CenterX - 1.05, cz: tableZ, bays: 4, sideTableSide: -1, baseY: firstFloorY });
    igtTable({ cx: 썬룸CenterX + 1.25, cz: tableZ, bays: 3, sideTableSide: 1, baseY: firstFloorY });
    campingChair({ cx: 썬룸CenterX - 1.05, cz: tableZ - 0.72, faceAngle: 0, baseY: firstFloorY });
    campingChair({ cx: 썬룸CenterX - 1.05, cz: tableZ + 0.72, faceAngle: Math.PI, baseY: firstFloorY });
    campingChair({ cx: 썬룸CenterX + 1.25, cz: tableZ - 0.72, faceAngle: 0, baseY: firstFloorY });
    campingChair({ cx: 썬룸CenterX + 1.25, cz: tableZ + 0.72, faceAngle: Math.PI, baseY: firstFloorY });
    label('스노우피크 IGT(4·3칸) + 반고 햄프턴 DLX', 썬룸CenterX, firstFloorY + 1.15, tableZ + 0.05, 0.26);
  }
  extrasLocal.push(...scene.children.slice(_furnStart));

  // 추가물 분류: 데크 바닥/가구로 표시된 것 외 나머지는 모두 썬룸 구조물.
  const _deckSet = new Set(deckLocal);
  const _wallSet = new Set(wallLocal);
  const _foldingSet = new Set(foldingLocal);
  const _extrasSet = new Set(extrasLocal);
  const _foundationSet = new Set(foundationLocal);
  const _frameSet = new Set(frameLocal);
  for (const o of scene.children.slice(_addStart)) {
    if (_deckSet.has(o)) deckObjects.push(o);
    else if (_wallSet.has(o)) wallObjects.push(o);
    else if (_foldingSet.has(o)) foldingObjects.push(o);
    else if (_extrasSet.has(o)) extrasObjects.push(o);
    else if (_foundationSet.has(o)) foundationObjects.push(o);
    else if (_frameSet.has(o)) 썬룸FrameObjects.push(o);
    else 썬룸Objects.push(o);
  }

  return { dX0, dX1, dFrontZ, dWallZ, deckTopY, groundPosts };   // 데크 사각형(계단 배치) + 땅 기둥 말뚝 위치
}

// 데크 계단 — 데크 상단에서 지면까지 3계단(합성목). 가장자리 한 변을 따라 바깥으로 내려간다.
//  axis: 계단이 늘어선 축('x' 또는 'z'). span0~span1: 그 축 범위. edge: 수직축의 데크 가장자리.
//  outward: 가장자리에서 계단이 뻗는 방향(±1). steps: 계단 수.
function deckStairs({ axis, span0, span1, edge, outward, steps = 3, topY = deckTopY0 + deckFinishT, baseY = groundTopY, tread = 0.3, mat = materials.porcelainDeck }) {
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

// 썬룸 계단 프레임(스틸) — 경사로가 아니라 계단 단면(디딤판+챌판) 지그재그 스트링거 + 단별 폭방향 디딤보.
// deckStairs와 동일 파라미터/높이(steps 챌판 + steps-1 디딤). 기초가 낮아지면 topY가 자동 반영돼 늘 일치. 썬룸 골조 그룹.
function deckStairFrame({ axis, span0, span1, edge, outward, steps = 3, topY = deckTopY0 + deckFinishT, baseY = groundTopY, tread = 0.3 }) {
  const rise = (topY - baseY) / steps;
  const bw = 0.07;                        // 프레임 부재 단면
  const mat = materials.entryFrame;
  // 한 스트링거(s 위치)의 수평 디딤 부재(수직축 v0~v1, 높이 y)
  const horiz = (s, v0, v1, y) => {
    const lo = Math.min(v0, v1), len = Math.abs(v1 - v0) + bw;
    if (axis === 'x') 썬룸FrameObjects.push(box({ x: s - bw / 2, z: lo - bw / 2, w: bw, d: len, y, h: bw, mat, cast: false }));
    else 썬룸FrameObjects.push(box({ x: lo - bw / 2, z: s - bw / 2, w: len, d: bw, y, h: bw, mat, cast: false }));
  };
  // 수직 챌판 부재(수직축 위치 v, 높이 y0~y1)
  const vert = (s, v, y0, y1) => {
    if (axis === 'x') 썬룸FrameObjects.push(box({ x: s - bw / 2, z: v - bw / 2, w: bw, d: bw, y: y0, h: y1 - y0, mat, cast: false }));
    else 썬룸FrameObjects.push(box({ x: v - bw / 2, z: s - bw / 2, w: bw, d: bw, y: y0, h: y1 - y0, mat, cast: false }));
  };
  // 폭(span) 방향 가로 디딤보(양 스트링거 연결, 수직축 위치 v, 높이 y)
  const widthBar = (v, y) => {
    if (axis === 'x') 썬룸FrameObjects.push(box({ x: span0, z: v - bw / 2, w: span1 - span0, d: bw, y, h: bw, mat, cast: false }));
    else 썬룸FrameObjects.push(box({ x: v - bw / 2, z: span0, w: bw, d: span1 - span0, y, h: bw, mat, cast: false }));
  };
  // 지그재그 스트링거(양 끝 + 중간 ~1.5m 간격)
  const nS = Math.max(1, Math.round((span1 - span0) / 1.5));
  for (let k = 0; k <= nS; k += 1) {
    const s = span0 + (span1 - span0) * (k / nS);
    for (let i = 0; i < steps; i += 1) vert(s, edge + outward * i * tread, topY - (i + 1) * rise, topY - i * rise);            // 챌판 steps개(데크~지면)
    for (let i = 0; i < steps - 1; i += 1) horiz(s, edge + outward * i * tread, edge + outward * (i + 1) * tread, topY - (i + 1) * rise); // 디딤 steps-1개
  }
  for (let i = 0; i < steps - 1; i += 1) widthBar(edge + outward * (i + 1) * tread, topY - (i + 1) * rise);   // 단별 노징 디딤보
  widthBar(edge + outward * (steps - 1) * tread, baseY);   // 발치 디딤보
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

// 거실 앞(우측) 썬룸 — 우측 외벽끝(x=0) 고정, 안방쪽으로 늘려 폴딩벽·데크 폭 5.5m(fX1=5.5, 좌측 끝 x=5.7)
//   지붕면은 거실+안방을 덮는 단일 패널 하나로 그린다(전체 폭 8.9m, 중심 x=4.25 — −0.2~8.7).
const living썬룸 = 썬룸({ roofLowX: -0.2, roofW: 5.9, withFurniture: true, withPostDims: true, withGutter: true, roofPanelW: 8.9, roofPanelCenterX: 4.25 });
// 안방 앞(좌측) 썬룸 — 기둥·보·홈통만(개방형, 데크·지붕면 없음). 지붕면은 거실 썬룸의 단일 패널이 이미 덮음.
const 안방썬룸 = 썬룸({ roofLowX: 5.7, roofW: 3.0, withFurniture: false, withPostDims: false, withWalls: false, postsToGround: true, connectRightX: 5.5, withFan: false, withShortPostDim: true, withGutter: true, withDownspout: true, withDeck: false, withRoofPanel: false });

// 데크 기초 — 집과 동일한 시스템말뚝기초(말뚝 + 두부). 두부 위에 둘레 토대보(바닥 골조)가 얹히고, 그 위에 포세린·폴딩/외벽이 올라간다.
// 데크 기초 발자국 — 집 너비(0~8.5) 안으로 정렬(엣지 돌출 제거). 인접 데크 겹침을 없애 폭 합이 8.5가 되게.
const deckFootprints = [];
for (const p of [living썬룸]) {
  const fx0 = Math.max(p.dX0, 0);          // 거실쪽(담장) 끝: 집 기초선 밖으로 안 나가게
  const fx1 = Math.min(p.dX1, buildingW);  // 가족방쪽 끝: 집 너비(8.5) 안으로
  deckFootprints.push({ x: fx0, z: p.dFrontZ, w: fx1 - fx0, d: p.dWallZ - p.dFrontZ });
}
// 입체 데크 시스템말뚝기초 — 말뚝(두부) + 그 위 둘레 토대보. 바닥에선 숨김.
const sunroomSillH = 0.12;   // 썬룸 토대보(바닥 골조) 춤 — 폴딩도어·외벽이 떠 보이지 않게 받치는 둘레보
for (const f of deckFootprints) {
  captureInto(foundationObjects, () => {
    const m = 0.1;   // 둘레 토대보 밑에 말뚝이 오도록 가장자리 가까이 정렬
    pileFoundation(f.x + m, f.z + m, f.w - 2 * m, f.d - 2 * m, deckTopY0, { spacingX: 1.6, spacingZ: 1.7 });   // 말뚝은 집·안방과 동일하게 0.4m(상단 deckTopY0)까지
    foundationHeightDim(f.x - 0.18, f.z + 0.2, groundTopY, deckTopY0, '데크 기초 0.4m');
  });
  // 바닥 골조(토대보) — 데크 둘레 사각보(바닥 밑, 말뚝 상단과 만남). 폴딩도어·외벽이 이 위에 얹혀 더는 떠 보이지 않음. 썬룸 골조 그룹(골조/썬룸 토글).
  const sy = deckTopY0 - sunroomSillH;   // 토대보 하단(바닥 밑 0.12) — 상단은 deckTopY0(바닥 밑면)
  const bw = 0.1;                        // 토대보 폭
  const fx1 = f.x + f.w, fz1 = f.z + f.d;
  for (const z of [f.z, fz1]) 썬룸FrameObjects.push(box({ x: f.x, z: z - bw / 2, w: f.w, d: bw, y: sy, h: sunroomSillH, mat: materials.entryFrame, cast: false }));   // 앞·뒤(가로)
  for (const x of [f.x, fx1]) 썬룸FrameObjects.push(box({ x: x - bw / 2, z: f.z, w: bw, d: f.d, y: sy, h: sunroomSillH, mat: materials.entryFrame, cast: false }));   // 좌·우(세로)
}

// ── 바닥(평면도): 납작한 발자국 + 평면 치수 ─────────────────────────────────
const planY = 0.1, planH = 0.025;   // 지면 위 얇게(거의 평평)
// 기초 발자국(집 + 데크) — 회색
planObjects.push(box({ x: 0, z: buildingFrontZ, w: buildingW, d: buildingD, y: planY, h: planH, mat: materials.foundation, cast: false, name: 'ground' }));
for (const f of deckFootprints) {
  planObjects.push(box({ x: f.x, z: f.z, w: f.w, d: f.d, y: planY, h: planH, mat: materials.foundation, cast: false, name: 'ground' }));
}
// 독립기초(시스템말뚝) 위치 — 발자국 위에 어두운 점으로 표시(입체 기초 말뚝 격자와 동일 정렬)
const planMarkW = 0.22;
function planPileMark(px, pz) {   // 말뚝 두부 위치 마커(검정 — 영상의 두부 브래킷처럼)
  planObjects.push(box({ x: px - planMarkW / 2, z: pz - planMarkW / 2, w: planMarkW, d: planMarkW, y: planY + planH, h: 0.012, mat: materials.pileHead, cast: false, name: 'ground' }));
}
function planPileMarks(x0, z0, w, d, spacingX, spacingZ) {
  const { xs, zs } = pileGridCoords(x0, z0, w, d, spacingX, spacingZ);
  for (const px of xs) for (const pz of zs) planPileMark(px, pz);
}
planPileMarks(0.1, buildingFrontZ + 0.1, buildingW - 0.2, buildingD - 0.2, 1.7, 1.9);
for (const f of deckFootprints) planPileMarks(f.x + 0.1, f.z + 0.1, f.w - 0.2, f.d - 0.2, 1.6, 1.7);
// 안방 말뚝 3개(평면) — X는 그대로, Z 위·아래를 가이드라인(집 앞벽 −0.7 / 거실 데크 앞)에 딱 붙임.
{
  const abX = 안방썬룸.groundPosts[0][0];
  const abTop = buildingFrontZ, abBot = deckFootprints[0].z;
  for (const pz of [abTop, (abTop + abBot) / 2, abBot]) planPileMark(abX, pz);
}
// [TEMP] 가이드라인 빨강 표시: 안방앞(집 앞벽 z=−0.7) + 가장 아래(거실 데크 앞 z=deckFootprints[0].z)
const _gRed = new THREE.MeshBasicMaterial({ color: 0xff0000 });
for (const z of [buildingFrontZ, deckFootprints[0].z]) planObjects.push(box({ x: lotX0 - 0.6, z: z - 0.01, w: lotW + 1.2, d: 0.02, y: planY + planH + 0.04, h: 0.012, mat: _gRed, cast: false, name: 'ground' }));
// [TEMP] 안방 기둥 줄: 위(안방앞 z=−0.7)=초록, 아래(도면 좌하 z=거실데크앞)=파랑
const _bBlue = new THREE.MeshBasicMaterial({ color: 0x0000ff });
const _bGreen = new THREE.MeshBasicMaterial({ color: 0x00aa00 });
const _abX = 안방썬룸.groundPosts[0][0];
planObjects.push(box({ x: _abX - planMarkW / 2, z: buildingFrontZ - planMarkW / 2, w: planMarkW, d: planMarkW, y: planY + planH + 0.06, h: 0.012, mat: _bGreen, cast: false, name: 'ground' }));
planObjects.push(box({ x: _abX - planMarkW / 2, z: deckFootprints[0].z - planMarkW / 2, w: planMarkW, d: planMarkW, y: planY + planH + 0.06, h: 0.012, mat: _bBlue, cast: false, name: 'ground' }));
// [TEMP] 썬룸(거실 데크) 오른쪽 두 모서리 기둥(앞·뒤)을 주황으로 표시 — 색만, 크기 동일
const _bOrange = new THREE.MeshBasicMaterial({ color: 0xff8800 });
{
  const f = deckFootprints[0], ox = f.x + 0.1;
  for (const oz of [f.z + 0.1, f.z + f.d - 0.1]) planObjects.push(box({ x: ox - planMarkW / 2, z: oz - planMarkW / 2, w: planMarkW, d: planMarkW, y: planY + planH + 0.07, h: 0.012, mat: _bOrange, cast: false, name: 'ground' }));
}
// 3면 담장 발자국 — 우측 콘크리트(회베이지) + 뒤·좌측 생울타리(녹색). 담장 토글 시.
planBoundaryObjects.push(box({ x: lotX0 - 0.2, z: lotZ0, w: 0.2, d: lotD, y: planY, h: planH, mat: fenceMat, cast: false, name: 'ground' }));
planBoundaryObjects.push(box({ x: lotX0, z: lotZ1 - 0.5, w: lotW, d: 0.5, y: planY, h: planH, mat: materials.hedge, cast: false, name: 'ground' }));
planBoundaryObjects.push(box({ x: lotX1 - 0.5, z: lotZ0, w: 0.5, d: lotD, y: planY, h: planH, mat: materials.hedge, cast: false, name: 'ground' }));
// 평면 치수 — 가로(8.5m)는 위쪽, 세로(4m)는 양쪽, 이격 치수 + 모눈 가이드라인.
captureInto(planObjects, () => {
  const D = 0.55;   // 모든 평면 치수 라벨 동일 크기
  const dL = deckFootprints[0];   // 거실 데크 기초(안방 앞 데크 제거됨)
  // 가로 — 위쪽: 기초 8.5 / 가족방 측백 0.5 (거실 0.5는 아래쪽으로 이동)
  planDim('x', lotZ1 + 0.4, 0, buildingW, '8.5m', 1, D, 0.6);
  planDim('x', lotZ1 + 0.4, lotX1 - 0.5, lotX1, '측백 0.5m', 1, D, 0.6);                // 가족방 측백 0.5(좌상단) — 합계 0.95는 미표시
  // 세로 — 가족방(왼쪽) 건물 깊이 4 / 거실(오른쪽) 뒤 이격 합 1m + 건물 깊이 4 + 데크 깊이
  planDim('z', lotX1 + 0.35, buildingFrontZ, buildingBackZ, '4m', 1, D, 0.6);          // 가족방 건물 깊이
  planDim('z', lotX1 + 0.35, lotZ1 - 0.5, lotZ1, '측백 0.5m', 1, D, 0.6);              // 뒤(가로) 측백 0.5 — 좌상단(합계 1m은 우상단)
  planDim('z', lotX0 - 0.4, buildingBackZ, lotZ1, '1m', -1, D, 0.6);                    // 뒤 이격 합 1m(우상단)
  planDim('z', lotX0 - 0.4, buildingFrontZ, buildingBackZ, '4m', -1, D, 0.6);          // 거실 건물 깊이
  planDim('z', lotX0 - 0.4, dL.z, buildingFrontZ, `${dL.d.toFixed(1)}m`, -1, D, 0.6);   // 거실 데크 깊이(오른쪽 가장자리)
  // 아래쪽 가장자리: 거실 데크 폭 / 거실 이격 분할
  planDim('x', dL.z - 0.45, 0, dL.x + dL.w, `${dL.w.toFixed(1)}m`, -1, D, 0.6);        // 거실 데크 폭
  planDim('x', dL.z - 0.45, lotX0, 0, '0.5m', -1, D, 0.6);                             // 거실 이격 0.5(위쪽 → 아래쪽 이동)
  // 모눈 가이드라인 — 각 치수 끝점(X/Z)을 지나 전체로 얇게(드래프팅 보조선처럼)
  const gridMat = new THREE.MeshBasicMaterial({ color: 0x5b7185 });   // 회청색 보조선(무광 — 조명 영향 없이 또렷)
  const gw = 0.02, gy = 0.135, gh = 0.01;
  const gz0 = lotZ0 - 0.6, gz1 = lotZ1 + 0.6, gx0 = lotX0 - 0.6, gx1 = lotX1 + 0.6;
  for (const x of [lotX0, 0, buildingW, lotX1]) {
    box({ x: x - gw / 2, z: gz0, w: gw, d: gz1 - gz0, y: gy, h: gh, mat: gridMat, cast: false, name: 'ground' });
  }
  for (const z of [dL.z, buildingFrontZ, buildingBackZ, lotZ1]) {   // lotZ0(맨 아래) 가로 가이드라인 제거
    box({ x: gx0, z: z - gw / 2, w: gx1 - gx0, d: gw, y: gy, h: gh, mat: gridMat, cast: false, name: 'ground' });
  }
});

// 데크 계단 — 폴딩도어 출입문(정면·왼쪽 측면 앞) 앞 + 안방 측면 출입문 앞에만(각 0.8m 폭, 3계단)
const _stairStart = scene.children.length;
const stairW = sideDoorW;   // 0.8m — 안방 옆 계단과 같은 너비
// · 거실 데크 정면 전체 폭 계단(-z로 내려감) — 데크 좌우 끝까지 전체 길이
deckStairs({ axis: 'x', span0: living썬룸.dX0, span1: living썬룸.dX1, edge: living썬룸.dFrontZ, outward: -1 });
// · 거실 데크 왼쪽(동) 측면 전체 깊이 계단(+x로 내려감) — 앞단~집벽쪽 전체 길이
deckStairs({ axis: 'z', span0: living썬룸.dFrontZ, span1: living썬룸.dWallZ, edge: living썬룸.dX1, outward: 1 });
// · 안방 측면 출입문 앞 계단(고-X 벽에서 +x, 상단=firstFloorY)
deckStairs({ axis: 'z', span0: sideDoorZ, span1: sideDoorZ + sideDoorW, edge: buildingW, outward: 1, topY: firstFloorY });
deckObjects.push(...scene.children.slice(_stairStart));

// 썬룸 계단 프레임(스틸 스트링거) — 거실 데크 전면·측면 계단. 데크 계단과 동일 높이(낮춘 기초 자동 반영). 썬룸 골조 그룹.
deckStairFrame({ axis: 'x', span0: living썬룸.dX0, span1: living썬룸.dX1, edge: living썬룸.dFrontZ, outward: -1 });
deckStairFrame({ axis: 'z', span0: living썬룸.dFrontZ, span1: living썬룸.dWallZ, edge: living썬룸.dX1, outward: 1 });

// (마당 흰색 화분 2개 제거됨 — whitePlanter 호출 삭제)

// 썬룸 화목난로(캠핑용) — 측면 폴딩 "앞에서 3번째 짝"의 하부만 불연패널(연통홀), 상부는 기존 폴딩 유리 유지.
{
  const deckTop = groundTopY + deckFoundationH + deckFinishT;
  const fWallZ = buildingFrontZ;                          // -0.7 (집 벽쪽 끝)
  const roofRun = Math.sqrt(4.0 * 4.0 - 0.2 * 0.2);       // 썬룸 수평투영(폴딩 내부값과 동일 ≈3.995)
  const fFrontZ = (buildingFrontZ - roofRun) + 0.2;       // 폴딩 앞단(≈-4.50)
  const panelZ = (fWallZ - fFrontZ) / 6;                  // 측면 한 짝 폭(Z) ≈0.633
  const stZ = fFrontZ + 2.5 * panelZ;                    // 앞에서 3번째 짝 '중앙'
  const stX = 0.45;
  const splitH = 0.55;                                   // 분할선 높이(2등분 아님 — 연통 위로만)
  const flueY = deckTop + 0.30;                          // 연통 = 데크 바닥 + 30cm
  const _stoveStart = scene.children.length;
  // 착탈 카세트 — 하부 불연 패널 + 둘레 가스켓 프레임(빼고 끼우는 단위). 짝마다 독립 프레임 → 각각 따로 착탈.
  const drawCassette = (zc) => {
    const a = zc - panelZ / 2 + 0.012, d = panelZ - 0.024, b = a + d;
    box({ x: -0.05, z: a, w: 0.11, d: d, y: deckTop, h: splitH, mat: materials.soundWall });               // 카세트 패널 면(불연)
    box({ x: -0.07, z: a, w: 0.15, d: d, y: deckTop + splitH - 0.02, h: 0.04, mat: materials.entryFrame }); // 상부 프레임(분할선)
    box({ x: -0.09, z: a, w: 0.05, d: d, y: deckTop, h: 0.035, mat: materials.entryFrame });                // 하부 프레임
    box({ x: -0.09, z: a, w: 0.05, d: 0.035, y: deckTop, h: splitH, mat: materials.entryFrame });           // 앞측 세로 프레임
    box({ x: -0.09, z: b - 0.035, w: 0.05, d: 0.035, y: deckTop, h: splitH, mat: materials.entryFrame });   // 뒤측 세로 프레임(독립)
  };
  const z4 = fFrontZ + 3.5 * panelZ;     // 앞에서 4번째 짝 중앙
  drawCassette(stZ);                     // 3번째(현재 겨울=연통홀)
  drawCassette(z4);                      // 4번째(추가, 솔리드 — 연통 없음, 독립 착탈)
  box({ x: stX, z: stZ, w: 0.42, d: 0.42, y: deckTop, h: 0.5, mat: materials.openingEdge });                    // 화목난로
  box({ x: stX - 0.03, z: stZ - 0.24, w: 0.34, d: 0.02, y: deckTop + 0.12, h: 0.24, mat: materials.guard });    // 난로 도어
  const flueH = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 14), materials.guard);
  flueH.rotation.z = Math.PI / 2; flueH.position.set(0.1, flueY, stZ); flueH.castShadow = true; scene.add(flueH);
  // 연통 수직부 — 윗끝이 그 위치(z=stZ)의 썬룸 지붕면보다 1m 위로 오게 길이 산정.
  // 지붕면 높이는 썬룸 물매 파라미터(targetWallPostH 2.8 / targetFrontPostH 2.6 / beam)를 동일하게 재현.
  const _beamDrop = 0.04, _beamH = 0.12, _frameInset = 0.2, _slope = 4.0;
  const yAtWall = firstFloorY + 2.8 + _beamDrop + _beamH;
  const targetGlassAtFront = firstFloorY + 2.6 + _beamDrop + _beamH;
  let yAtFront = targetGlassAtFront;
  for (let i = 0; i < 40; i += 1) { const d = yAtWall - yAtFront; const run = Math.sqrt(_slope * _slope - d * d); yAtFront = targetGlassAtFront - _frameInset * d / run; }
  const roofFrontEdgeZ = buildingFrontZ - roofRun;
  const roofYatStZ = yAtWall + (yAtFront - yAtWall) * ((stZ - buildingFrontZ) / (roofFrontEdgeZ - buildingFrontZ));
  const flueBottom = flueY - 0.05;                         // 기존 하단(수평 연통 연결부)
  const flueTopTarget = roofYatStZ + 1.0;                  // 썬룸 지붕면 +1m
  const flueVLen = flueTopTarget - flueBottom;
  const flueV = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, flueVLen, 14), materials.guard);
  flueV.position.set(-0.22, (flueBottom + flueTopTarget) / 2, stZ); flueV.castShadow = true; scene.add(flueV);
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.16, 14), materials.openingEdge);
  hole.rotation.z = Math.PI / 2; hole.position.set(-0.02, flueY, stZ); scene.add(hole);
  label('화목난로 / 3번째 짝 하부 = 착탈 카세트 (겨울 연통홀 / 여름 솔리드 교체)', stX + 1.05, deckTop + 1.05, stZ, 0.24);
  label('4번째 짝 하부 = 착탈 카세트 (솔리드 · 독립 착탈)', stX + 1.05, deckTop + 0.78, z4, 0.24);
  썬룸Objects.push(...scene.children.slice(_stoveStart));
}

// 가족방 썬룸 아래 자갈 마당에 웨버 켈틀 그릴(지름 50cm) — 소품 그룹(전체일 때만 표시)
const _grillStart = scene.children.length;
{
  const gx = 7.0;                          // 가족방 썬룸 폭(5.6~8.5) 중앙
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

const _firstFixturesStart = scene.children.length;   // 외부 콘센트·부동수전·실내 계단 → 1층 그룹

// 거실 시스템도어 양옆 전면 외벽에 외부(방수) 콘센트 2개
{
  const livingSashEndX = livingYardSashX + yardSashW;   // 거실 도어 높은 X쪽 끝(2.825)
  const wallFaceZ = buildingFrontZ;                      // 전면 외벽 바깥면
  const outletY = firstFloorY + 0.32;
  const extOutlet = (ox) => {
    box({ x: ox - 0.065, z: wallFaceZ - 0.035, w: 0.13, d: 0.035, y: outletY, h: 0.15, mat: materials.counter });      // 커버 플레이트
    box({ x: ox - 0.045, z: wallFaceZ - 0.05, w: 0.09, d: 0.02, y: outletY + 0.03, h: 0.09, mat: materials.entryFrame }); // 소켓 면
  };
  extOutlet(livingYardSashX - 0.2);    // 도어 좌측(코너쪽)
  extOutlet(livingSashEndX + 0.2);     // 도어 우측(현관쪽)
  label('외부 콘센트', livingSashEndX + 0.2, outletY + 0.42, wallFaceZ - 0.2, 0.24);
}

// 가족방 왼쪽(도로측, 높은 X) 외벽에 외부 부동수전(동파방지 벽붙이형)
{
  const faucetX = buildingW;             // 외벽 바깥면(x=8.5)
  const faucetZ = 1.1;                    // 측면 출입문(z −0.3~0.5)에서 충분히 떨어진 솔리드 벽
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

firstFloorObjects.push(...scene.children.slice(_firstFixturesStart));   // 외부설비·실내 계단을 1층 그룹에 추가

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
const _firstFanStart = scene.children.length;
ceilingFan({ x: firstLivingX + firstLivingW / 2, z: insideZ0 + firstLivingD / 2, ceilingY: firstCeilingY });
ceilingFan({ x: firstFamilyX + firstFamilyW / 2, z: insideZ0 + firstFamilyD / 2, ceilingY: firstCeilingY });
firstFloorObjects.push(...scene.children.slice(_firstFanStart));   // 1층 거실·가족방 실링팬을 1층 그룹에 추가

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

// 뒤쪽(남측) 지붕에 태양광 3kW — 실물 모듈 8장(2열×4, 1.66×1.0m 가로형 ≈400W), 지붕 폭 중앙 정렬
{
  const solarMat = new THREE.MeshLambertMaterial({ color: 0x16264a });
  const roofSlopeRad = THREE.MathUtils.degToRad(roofSlopeDeg);
  const cosS = Math.cos(roofSlopeRad);
  const sinS = Math.sin(roofSlopeRad);
  const surfaceY = (z) => atticRidgeY - roofSlopeTan * (z - atticRidgeZ);
  const panelW = 1.66;   // X 폭(실물 모듈 가로)
  const panelL = 1.0;    // 경사 방향 길이
  const panelThk = 0.05;
  const gapX = 0.04;
  const gapZ = 0.04;
  const cols = 4;
  const rows = 2;        // 4 x 2 = 8장 × 약 400W ≈ 3.2kW
  const arrayW = cols * panelW + (cols - 1) * gapX;
  const arrayCenterX = buildingW / 2;   // 지붕 폭 중앙
  const startX = arrayCenterX - arrayW / 2 + panelW / 2;
  const rowStepZ = (panelL + gapZ) * cosS;
  const arrayCenterZ = 2.25;            // 용마루 아래~뒤 벽선 사이
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
  roofObjects.push(label('태양광 3kW (8장)', arrayCenterX, surfaceY(arrayCenterZ) + 0.55, arrayCenterZ, 0.3));
}

// 전기 콘센트 위치 표시 — 벽면에 흰 플레이트 + 콘센트 구멍(어두운 사각)을 붙인다.
//  axis: 벽의 법선 축('x'|'z'), sign: 실내 방향(+1|-1), y: 콘센트 중심 높이, gang: 구 수.
const outletPlateMat = new THREE.MeshLambertMaterial({ color: 0xf4f1e8 });
const outletSlotMat = new THREE.MeshLambertMaterial({ color: 0x2f3338 });

function outletMarker({ x, z, y, axis = 'z', sign = 1, gang = 2, note = null, collector = outletObjects }) {
  const plateW = 0.13;   // 벽면 따라 폭
  const plateH = 0.13;   // 높이
  const proud = 0.02;    // 벽에서 돌출
  const slot = 0.035;    // 구멍 한 변
  const slotT = 0.006;   // 구멍 두께(플레이트보다 살짝 더 돌출)
  const before = scene.children.length;
  if (axis === 'z') {
    box({ x: x - plateW / 2, z: sign > 0 ? z : z - proud, w: plateW, d: proud, y: y - plateH / 2, h: plateH, mat: outletPlateMat, cast: false, receive: false });
    const zs = sign > 0 ? z + proud : z - proud - slotT;
    for (let i = 0; i < gang; i += 1) {
      const off = (i - (gang - 1) / 2) * 0.05;
      box({ x: x + off - slot / 2, z: zs, w: slot, d: slotT, y: y - slot / 2, h: slot, mat: outletSlotMat, cast: false, receive: false });
    }
  } else {
    box({ x: sign > 0 ? x : x - proud, z: z - plateW / 2, w: proud, d: plateW, y: y - plateH / 2, h: plateH, mat: outletPlateMat, cast: false, receive: false });
    const xs = sign > 0 ? x + proud : x - proud - slotT;
    for (let i = 0; i < gang; i += 1) {
      const off = (i - (gang - 1) / 2) * 0.05;
      box({ x: xs, z: z + off - slot / 2, w: slotT, d: slot, y: y - slot / 2, h: slot, mat: outletSlotMat, cast: false, receive: false });
    }
  }
  if (note) {                          // 용도 라벨(실내 방향으로 살짝 띄움)
    const lx = axis === 'x' ? x + sign * 0.28 : x;
    const lz = axis === 'z' ? z + sign * 0.28 : z;
    label(note, lx, y + 0.3, lz, 0.24);
  }
  collector.push(...scene.children.slice(before));
}

const outletLowY = firstFloorY + 0.3;        // 일반 콘센트 높이
const outletCounterY = firstFloorY + 1.05;   // 주방 조리대 위 콘센트

// 1층 — 거실+주방
outletMarker({ x: 0.95, z: insideZ1, y: outletCounterY, axis: 'z', sign: -1 });   // 싱크대 상부
outletMarker({ x: 1.75, z: insideZ1, y: outletCounterY, axis: 'z', sign: -1 });
outletMarker({ x: insideX0, z: -0.1, y: outletLowY, axis: 'x', sign: 1 });        // 거실 좌측 외벽
outletMarker({ x: insideX0, z: 2.55, y: outletLowY, axis: 'x', sign: 1 });
outletMarker({ x: 2.7, z: insideZ0, y: outletLowY, axis: 'z', sign: 1 });         // 거실 전면벽
// 1층 — 가족방
outletMarker({ x: insideX1, z: -0.1, y: outletLowY, axis: 'x', sign: -1 });       // 도로측 외벽
outletMarker({ x: insideX1, z: 2.6, y: outletLowY, axis: 'x', sign: -1 });
outletMarker({ x: 5.6, z: insideZ1, y: outletLowY, axis: 'z', sign: -1 });        // 가족방 후면벽
outletMarker({ x: planLeftFamilyX, z: 1.6, y: outletLowY, axis: 'x', sign: 1 });  // 가족방 내벽
// 1층 — 계단하부 WC(세면대 옆, 방수형)
outletMarker({ x: stairHighXWallX, z: stairBathZ + 0.35, y: firstFloorY + 1.05, axis: 'x', sign: -1, gang: 1 });

// 1층 — 전동커튼용 콘센트(각 창 상부 측면, 모터 전원)
const curtainOutletY = firstFloorY + 1.95;
outletMarker({ x: livingYardSashX - 0.12, z: insideZ0, y: curtainOutletY, axis: 'z', sign: 1, gang: 1, note: '전동커튼' });   // 거실 전면 출입창
outletMarker({ x: familyWindowX - 0.12, z: insideZ0, y: curtainOutletY, axis: 'z', sign: 1, gang: 1 });                    // 안방 전면 창문
outletMarker({ x: livingRearWindowX - 0.12, z: insideZ1, y: curtainOutletY, axis: 'z', sign: -1, gang: 1 });                 // 거실 후면창
outletMarker({ x: familyRearWindowX - 0.12, z: insideZ1, y: curtainOutletY, axis: 'z', sign: -1, gang: 1 });                 // 가족방 후면창

// 1층 — 벽걸이 에어컨용 콘센트(거실 좌측 외벽 상부). 송풍을 +X로 보내 계단실 앞을 지나 가족방까지.
outletMarker({ x: insideX0, z: insideZ0 + 0.55, y: firstFloorY + 1.95, axis: 'x', sign: 1, note: '벽걸이 에어컨\n(가족방 송풍)' });

// 1층 — 냉장고용 콘센트(싱크대 옆 남는 공간, 후면벽 코너). 싱크대 끝(x≈2.4)~계단벽(x≈3.1) 사이.
outletMarker({ x: 2.97, z: insideZ1, y: firstFloorY + 1.7, axis: 'z', sign: -1, note: '냉장고' });

// 다락 — 다락방1·다락방2·복도(다락 표시 시에만 보임)
const atticWallY = secondY + secondFloorThickness;
const atticOutletY = atticWallY + 0.3;
outletMarker({ x: 1.0, z: insideZ1, y: atticOutletY, axis: 'z', sign: -1, collector: atticOutletObjects });            // 다락방1 후면
outletMarker({ x: insideX0, z: secondAtticZ + 0.4, y: atticOutletY, axis: 'x', sign: 1, collector: atticOutletObjects });
outletMarker({ x: 7.3, z: insideZ1, y: atticOutletY, axis: 'z', sign: -1, collector: atticOutletObjects });           // 다락방2 후면
outletMarker({ x: insideX1, z: secondAtticZ + 0.4, y: atticOutletY, axis: 'x', sign: -1, collector: atticOutletObjects });
outletMarker({ x: stairClearX + 0.3, z: insideZ0, y: atticOutletY, axis: 'z', sign: 1, collector: atticOutletObjects });  // 복도 전면

// 보이는 구조물을 화면(버튼 영역 제외 캔버스) 중앙에 꽉 차게 프레이밍한다.
// pos는 '보는 방향'으로만 쓰고 거리는 자동 계산하며, 줌 중심(target)을 경계구 중심에
// 둬서 확대해도 위/아래가 고르게 보이도록 한다.
const _fitBox = new THREE.Box3();
const _fitSphere = new THREE.Sphere();
const _fitDir = new THREE.Vector3();
function setView(pos) {
  scene.updateMatrixWorld(true);
  _fitBox.makeEmpty();
  scene.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    if (o.name === 'ground') return;                                 // 부지·자갈·도로 평면은 프레이밍에서 제외
    for (let p = o.parent; p; p = p.parent) if (!p.visible) return;  // 조상이 숨겨진 객체 제외
    _fitBox.expandByObject(o);
  });
  if (_fitBox.isEmpty()) return;
  _fitBox.getBoundingSphere(_fitSphere);
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const fitH = _fitSphere.radius / Math.sin(fov / 2);                 // 세로 기준 맞춤 거리
  const hfov = 2 * Math.atan(Math.tan(fov / 2) * camera.aspect);
  const fitW = _fitSphere.radius / Math.sin(hfov / 2);               // 가로 기준 맞춤 거리
  const dist = 1.06 * Math.max(fitH, fitW);
  _fitDir.set(pos[0], pos[1], pos[2]).sub(_fitSphere.center).normalize();
  camera.up.set(0, 1, 0);
  camera.position.copy(_fitSphere.center).addScaledVector(_fitDir, dist);
  controls.target.copy(_fitSphere.center);
  controls.update();
}

// 가시성 상태
//  · building: '기초' / '+1층' / '+다락' / '+지붕' 중 하나만 선택되는 건물 누적 뷰(집만 제어)
//    - 기초만(foundation)은 기초 슬래브만, +1층(first)부터 1층 골조·실내가 얹힘
//  · deckOn / 썬룸On / wallOn / accessoryOn: 데크·썬룸·외벽·악세사리 독립 on/off 토글
//    - 썬룸는 데크가 켜진 경우에만 가능(썬룸는 데크 위에 얹힘)
//    - 외벽(다누몰 자바라, 시공 업체 별도)은 썬룸가 켜진 경우에만 가능(외벽은 썬룸에 매달림)
//    - 악세사리(화분·의자·테이블·그릴)는 완전 독립 토글
const viewState = { building: 'plan', deckOn: false, 썬룸On: false, wallOn: false, foldingOn: false, accessoryOn: false, outletsOn: false, boundaryOn: true, frameMode: 'none' };  // frameMode: 'none' | 'steel' | 'wood' (상호배타)

function applyVisibility() {
  const { building, deckOn, 썬룸On, wallOn, foldingOn, accessoryOn, outletsOn, boundaryOn, frameMode } = viewState;
  const isPlan = building === 'plan';                           // 바닥(배치도): 도로·토지·3면담장·기초 바닥만
  const showFirst = building === 'first' || building === 'second' || building === 'all'; // 1층 표시(바닥·기초에선 숨김)
  const showAttic = building === 'second' || building === 'all'; // +다락·+지붕에서 다락 표시
  const showRoof = building === 'all';                          // 집 지붕은 +지붕에서만

  for (const item of firstFloorObjects) item.visible = showFirst;
  for (const item of secondFloorObjects) item.visible = showAttic;
  for (const item of roofObjects) item.visible = showRoof;
  for (const item of deckObjects) item.visible = deckOn && !isPlan;                  // 데크 마감: 바닥(배치도)에선 숨김
  for (const item of 썬룸Objects) item.visible = deckOn && 썬룸On && !isPlan;  // 썬룸는 데크 위에만
  for (const item of 썬룸FrameObjects) item.visible = (frameMode !== 'none' || (deckOn && 썬룸On)) && !isPlan; // 썬룸 철골(노출 스틸): 스틸/목골조 토글 또는 썬룸 토글
  for (const item of wallObjects) item.visible = deckOn && 썬룸On && wallOn && !isPlan; // 외벽은 썬룸 위에만
  for (const item of foldingObjects) item.visible = deckOn && 썬룸On && foldingOn && !isPlan; // 폴딩도어(외벽과 상호배타)
  for (const item of extrasObjects) item.visible = accessoryOn && !isPlan;           // 악세사리: 독립 토글
  for (const item of foundationObjects) item.visible = !isPlan;                      // 입체 기초: 바닥(평면도)에선 숨김
  for (const item of foundationDimObjects) item.visible = building === 'foundation'; // 기초·대지 가로/세로 치수: 기초 뷰에서만
  for (const item of planObjects) item.visible = isPlan;                             // 납작한 기초 발자국·평면 치수: 바닥에서만
  for (const item of planBoundaryObjects) item.visible = isPlan && boundaryOn;        // 납작한 담장 발자국: 바닥 + 담장 토글
  for (const item of boundaryObjects) item.visible = boundaryOn && !isPlan;          // 입체 담장·생울타리: 바닥에선 납작 버전으로 대체
  for (const item of outletObjects) item.visible = outletsOn && showFirst;          // 1층 콘센트: 독립 토글(기초만일 땐 숨김)
  for (const item of atticOutletObjects) item.visible = outletsOn && showAttic;     // 다락 콘센트: 다락 표시 시
  for (const item of steelFrameObjects) item.visible = frameMode === 'steel' && !isPlan;  // 스틸골조(상호배타)
  for (const item of woodFrameObjects) item.visible = frameMode === 'wood' && !isPlan;    // 목골조(상호배타)

  // 버튼 상태 반영
  document.querySelector('#viewPlan').classList.toggle('active', building === 'plan');
  document.querySelector('#viewFoundation').classList.toggle('active', building === 'foundation');
  document.querySelector('#viewFirst').classList.toggle('active', building === 'first');
  document.querySelector('#viewSecond').classList.toggle('active', building === 'second');
  document.querySelector('#viewAll').classList.toggle('active', building === 'all');
  document.querySelector('#toggleDeck').classList.toggle('active', deckOn);
  const 썬룸Btn = document.querySelector('#toggle썬룸');
  썬룸Btn.classList.toggle('active', deckOn && 썬룸On);
  썬룸Btn.disabled = !deckOn;            // 데크가 꺼져 있으면 썬룸 토글 불가
  const wallBtn = document.querySelector('#toggleWall');
  wallBtn.classList.toggle('active', deckOn && 썬룸On && wallOn);
  wallBtn.disabled = !(deckOn && 썬룸On);  // 썬룸가 꺼져 있으면 외벽 토글 불가
  const foldingBtn = document.querySelector('#toggleFolding');
  foldingBtn.classList.toggle('active', deckOn && 썬룸On && foldingOn);
  foldingBtn.disabled = !(deckOn && 썬룸On);  // 썬룸가 꺼져 있으면 폴딩도어 토글 불가
  document.querySelector('#toggleAccessory').classList.toggle('active', accessoryOn);
  document.querySelector('#toggleOutlet').classList.toggle('active', outletsOn);
  document.querySelector('#toggleBoundary').classList.toggle('active', boundaryOn);
  document.querySelector('#toggleSteelFrame').classList.toggle('active', frameMode === 'steel');
  document.querySelector('#toggleWoodFrame').classList.toggle('active', frameMode === 'wood');
}

// 바닥(배치도) 전용 카메라 — 대지 전체를 상부에서 내려다본다(도로·토지·담장·기초 바닥 한눈에).
function setPlanView() {
  camera.up.set(0, 1, 0);
  const cx = (lotX0 + lotX1) / 2;
  const cz = (lotZ0 + lotZ1) / 2;
  controls.target.set(cx, 0.2, cz);
  camera.position.set(cx, 17.0, cz - 2.4);   // 거의 수직 상부 시점(완전 수직은 피해 약간만 뒤로)
  controls.update();
}

document.querySelector('#viewPlan').addEventListener('click', () => {
  viewState.building = 'plan';
  applyVisibility();
  setPlanView();
});

document.querySelector('#viewFoundation').addEventListener('click', () => {
  viewState.building = 'foundation';
  applyVisibility();
  setView([4.25, 10.2, -5.0]);
});

document.querySelector('#viewFirst').addEventListener('click', () => {
  viewState.building = 'first';
  viewState.boundaryOn = false;   // 1층을 보면 담장 자동 해제
  applyVisibility();
  setView([4.25, 11.2, -5.0]);
});

document.querySelector('#viewSecond').addEventListener('click', () => {
  viewState.building = 'second';
  applyVisibility();
  setView([4.25, 12.2, -5.0]);
});

document.querySelector('#viewAll').addEventListener('click', () => {
  viewState.building = 'all';               // +지붕 = 집 지붕까지(데크·썬룸·악세사리는 각 토글 상태 유지)
  applyVisibility();
  setView([10.8, 6.8, -8.8]);
});

document.querySelector('#toggleDeck').addEventListener('click', () => {
  viewState.deckOn = !viewState.deckOn;
  if (!viewState.deckOn) viewState.썬룸On = false;   // 데크를 끄면 썬룸도 함께 off
  applyVisibility();
});

document.querySelector('#toggle썬룸').addEventListener('click', () => {
  if (!viewState.deckOn) return;            // 데크가 꺼져 있으면 썬룸 토글 불가
  viewState.썬룸On = !viewState.썬룸On;
  applyVisibility();
});

document.querySelector('#toggleWall').addEventListener('click', () => {
  if (!viewState.deckOn || !viewState.썬룸On) return;   // 썬룸가 꺼져 있으면 외벽 토글 불가
  viewState.wallOn = !viewState.wallOn;
  if (viewState.wallOn) viewState.foldingOn = false;       // 외벽 켜면 폴딩도어 자동 끔(상호배타)
  applyVisibility();
});

document.querySelector('#toggleFolding').addEventListener('click', () => {
  if (!viewState.deckOn || !viewState.썬룸On) return;   // 썬룸가 꺼져 있으면 폴딩도어 토글 불가
  viewState.foldingOn = !viewState.foldingOn;
  if (viewState.foldingOn) viewState.wallOn = false;       // 폴딩도어 켜면 외벽 자동 끔(상호배타)
  applyVisibility();
});

document.querySelector('#toggleAccessory').addEventListener('click', () => {
  viewState.accessoryOn = !viewState.accessoryOn;
  applyVisibility();
});

document.querySelector('#toggleOutlet').addEventListener('click', () => {
  viewState.outletsOn = !viewState.outletsOn;
  applyVisibility();
});

document.querySelector('#toggleBoundary').addEventListener('click', () => {
  viewState.boundaryOn = !viewState.boundaryOn;
  applyVisibility();
});

// 스틸골조/목골조 — 상호배타: 하나를 켜면 다른 하나는 자동 off(한 번에 한 구조만). 같은 버튼 재클릭 시 off.
document.querySelector('#toggleSteelFrame').addEventListener('click', () => {
  viewState.frameMode = viewState.frameMode === 'steel' ? 'none' : 'steel';
  applyVisibility();
});
document.querySelector('#toggleWoodFrame').addEventListener('click', () => {
  viewState.frameMode = viewState.frameMode === 'wood' ? 'none' : 'wood';
  applyVisibility();
});

applyVisibility();
setPlanView();   // 초기 화면 = 바닥(배치도) 평면도

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
