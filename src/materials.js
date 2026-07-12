// 재질(머티리얼) 단일 출처 — THREE + 텍스처 생성기만 의존. 색 변경은 여기 한 곳에서.
import * as THREE from 'three';
import { makeGravelTexture, makeEarthTexture, makePorcelainDeckTexture } from './textures.js';

export const materials = {
  site: new THREE.MeshLambertMaterial({ color: 0xa3814f }),   // 흙색(부지 지면)
  yard: new THREE.MeshLambertMaterial({ color: 0x76a96b }),
  road: new THREE.MeshLambertMaterial({ color: 0xcfd8e3 }),
  hedge: new THREE.MeshLambertMaterial({ color: 0x2f7d45 }),
  foundation: new THREE.MeshLambertMaterial({ color: 0xb8b8ad }),         // 집 기초(0.5m) — 따뜻한 회색
  matFoundation: new THREE.MeshLambertMaterial({ color: 0x9a988e }),      // 온통기초(매트 슬래브) — 콘크리트 회색(말뚝기초 배경보다 진하게)
  deckFoundation: new THREE.MeshLambertMaterial({ color: 0xb3d3ef }),     // 데크 기초(0.4m) 배경 — 연한 하늘색(말뚝 두부 청색과 또렷이 구별되게 연하게)
  pile: new THREE.MeshLambertMaterial({ color: 0x7d8186 }),          // 강관 말뚝(아연도금)
  pileHead: new THREE.MeshLambertMaterial({ color: 0x2c3036 }),      // 두부 헤드 브래킷(검정) — 스틸 골조가 볼트 체결되는 부분
  deckPileHead: new THREE.MeshLambertMaterial({ color: 0x4a86b0 }),  // 데크 기초 두부 — 또렷한 청색(집 검정 두부와 명확 구분)
  floorFinish: new THREE.MeshLambertMaterial({ color: 0xa0785a }),   // 바닥(바닥 시공 10cm) — 골조 위, 1층 마감 아래
  dimension: new THREE.MeshLambertMaterial({ color: 0x111827 }),
  wall: new THREE.MeshLambertMaterial({ color: 0xffffff }),
  wallSide: new THREE.MeshLambertMaterial({ color: 0x9f917f }),
  exteriorWall: new THREE.MeshLambertMaterial({ color: 0xe4ded2, transparent: true, opacity: 0.58, depthWrite: false }),
  exteriorWallMark: new THREE.MeshLambertMaterial({ color: 0xff8a5c }),   // 계단 화면 외벽 자리 표시(주황) — 외벽이 안 그려지는 화면에서 공간 경계 인지용
  wallTop: new THREE.MeshLambertMaterial({ color: 0x8f8374 }),
  kitchen: new THREE.MeshLambertMaterial({ color: 0xfff3c4 }),
  bed: new THREE.MeshLambertMaterial({ color: 0xbed8ff }),
  bath: new THREE.MeshLambertMaterial({ color: 0xbff3ef }),
  toilet: new THREE.MeshLambertMaterial({ color: 0xcbd34a }),
  vanity: new THREE.MeshLambertMaterial({ color: 0x99a13a }),
  shower: new THREE.MeshLambertMaterial({ color: 0xcbd34a }),
  stair: new THREE.MeshLambertMaterial({ color: 0xd9cffb }),
  stairFront: new THREE.MeshLambertMaterial({ color: 0xbfe3a0 }),
  stairRoom: new THREE.MeshLambertMaterial({ color: 0xf3c19b }),   // 계단실 바닥 구분색(연주황) — 주방·안방·계단앞과 구별
  hall: new THREE.MeshLambertMaterial({ color: 0xeeeeee }),
  landing: new THREE.MeshLambertMaterial({ color: 0xffd166 }),
  floorSlab: new THREE.MeshLambertMaterial({ color: 0xc9a877 }),   // 각 층 바닥(2·3층 층참) — 계단참(노랑)과 구별되는 마루색
  clearZone: new THREE.MeshLambertMaterial({ color: 0x2ec4b6, transparent: true, opacity: 0.4, depthWrite: false }),   // 가구 둘레 여유 이동공간 표시(반투명 청록) — 바닥색과 구별
  leftZone: new THREE.MeshLambertMaterial({ color: 0xd84a3b, transparent: true, opacity: 0.42, depthWrite: false }),   // 왼쪽 예약 공간(반투명 붉은색)
  showerFloor: new THREE.MeshLambertMaterial({ color: 0x2f6fd8, transparent: true, opacity: 0.5, depthWrite: false }),   // 2층 샤워욕실 자리(반투명 파랑)
  wcFloor: new THREE.MeshLambertMaterial({ color: 0x9b5de5, transparent: true, opacity: 0.5, depthWrite: false }),       // 3층 변기·세면대 자리(반투명 보라)
  wetFloor: new THREE.MeshLambertMaterial({ color: 0x4a8fa6 }),   // 방수 바닥 마감(실외기실 등 — 청회색 방수 코팅)
  insulPlane: new THREE.MeshLambertMaterial({ color: 0xffcc00, transparent: true, opacity: 0.55, depthWrite: false }),   // 내단열 보충 면 표시(실외기실 = 새 외벽선, 노랑)
  s3Room1: new THREE.MeshLambertMaterial({ color: 0x8ecae6, transparent: true, opacity: 0.45, depthWrite: false }),      // 3층 방1 바닥(반투명 하늘)
  s3Room2: new THREE.MeshLambertMaterial({ color: 0xa7d96b, transparent: true, opacity: 0.45, depthWrite: false }),      // 3층 방2 바닥(반투명 연두)
  stairUpZone1: new THREE.MeshLambertMaterial({ color: 0xf9c74f, transparent: true, opacity: 0.5, depthWrite: false }),  // 1층 계단참(홈리프트 앞) 자리(계단참 계열 노랑) — 다른 용도 불가
  stairUpZone2: new THREE.MeshLambertMaterial({ color: 0xf3a712, transparent: true, opacity: 0.5, depthWrite: false }),  // 2층 계단 올라오는·3층 오르는 자리(계단참 계열 호박색) — 다른 용도 불가
  stairUpZone3: new THREE.MeshLambertMaterial({ color: 0xe85d2f, transparent: true, opacity: 0.5, depthWrite: false }),  // 3층 계단 올라오는 자리(주황) — 다른 용도 불가
  s3Hall: new THREE.MeshLambertMaterial({ color: 0xcfcfcf, transparent: true, opacity: 0.4, depthWrite: false }),        // 3층 복도·홀 바닥(반투명 회색)
  s3Door: new THREE.MeshLambertMaterial({ color: 0xff3b30 }),                                                            // 문 위치 표시(빨강 막대)
  s3WallZone: new THREE.MeshLambertMaterial({ color: 0x6b4f3a, transparent: true, opacity: 0.6, depthWrite: false }),   // 3층 계단실 옆 벽으로 쓸 구간 표시(반투명 진갈색)
  s3Path: new THREE.MeshLambertMaterial({ color: 0xff9f1c, transparent: true, opacity: 0.9, depthWrite: false }),        // 방→화장실 동선(주황)
  loftHeadFill: new THREE.MeshLambertMaterial({ color: 0x7fbf9b }),   // 1층계단 위 헤드룸 한계까지 메운 다락바닥 — 일반 다락바닥(노랑)과 구별(청록)
  stairWall: new THREE.MeshLambertMaterial({ color: 0xf2f0e8 }),
  landingRiser: new THREE.MeshLambertMaterial({ color: 0x4a90d9 }),   // 1층 계단참 직전 챌판 — 구별용 파랑
  stairSpineWall: new THREE.MeshLambertMaterial({ color: 0x8fb0cc }),   // 두 런 사이 칸막이벽 — 디딤판·세로막이와 구별되는 청색
  guard: new THREE.MeshLambertMaterial({ color: 0x374151 }),
  sinkCabinet: new THREE.MeshLambertMaterial({ color: 0xd8c7a4 }),
  counter: new THREE.MeshLambertMaterial({ color: 0xf8fafc }),
  sinkBasin: new THREE.MeshLambertMaterial({ color: 0xb7c7d7 }),
  fridge: new THREE.MeshLambertMaterial({ color: 0xc5ccd2 }),   // LG 디오스 일반냉장고(스테인리스 실버)
  fridgeDoor: new THREE.MeshLambertMaterial({ color: 0xaeb6bd }), // 냉장고 문짝(본체보다 약간 어두운 실버)
  entry: new THREE.MeshLambertMaterial({ color: 0xffdfbd }),
  deck: new THREE.MeshLambertMaterial({ color: 0xcaa46a }),
  door: new THREE.MeshLambertMaterial({ color: 0x31a354 }),
  interiorDoor: new THREE.MeshLambertMaterial({ color: 0x7a4f32 }),
  interiorDoorLanding: new THREE.MeshLambertMaterial({ color: 0x9c6b45 }),   // 계단형 문 중 계단참 아래 부분 — 약간 다른(밝은) 갈색
  wcDoor: new THREE.MeshLambertMaterial({ color: 0xc2ccd0 }),
  pocketDoor: new THREE.MeshLambertMaterial({ color: 0x8b5f3d }),
  stdRoomDoor: new THREE.MeshLambertMaterial({ color: 0x2f9e8f }),   // 표준 방문(슬라이딩 0.9×2.1) 전용색 — 어디 쓰여도 같은 표준 크기임을 색으로 구별
  entryDoor: new THREE.MeshLambertMaterial({ color: 0x4f3422 }),
  entryFrame: new THREE.MeshLambertMaterial({ color: 0x2f343a }),
  outlet: new THREE.MeshLambertMaterial({ color: 0x22c55e }),   // 일반 콘센트 색(녹색)
  outletSocket: new THREE.MeshLambertMaterial({ color: 0x11803a }),   // 일반 콘센트 소켓 면(어두운 녹색)
  heatOutlet: new THREE.MeshLambertMaterial({ color: 0xff2fb0 }),   // 고전력 콘센트 기본 색상(마젠타) — 일반(녹색)과 구별
  heatOutletSocket: new THREE.MeshLambertMaterial({ color: 0x9c0060 }),   // 고전력 콘센트 소켓 면(어두운 마젠타)
  inductionOutlet: new THREE.MeshLambertMaterial({ color: 0x9b4dff }),   // 인덕션 직결 정션박스 색(보라)
  windowFrame: new THREE.MeshLambertMaterial({ color: 0xffffff }),   // 창·문틀 흰색(폴딩도어·뒤 작은문·좌측 싱크대창 제외 전 창틀)
  handle: new THREE.MeshLambertMaterial({ color: 0xd4af37 }),
  glass: new THREE.MeshLambertMaterial({ color: 0x9ed0e8, transparent: true, opacity: 0.55 }),
  interiorGlassWall: new THREE.MeshLambertMaterial({ color: 0xd7e6e3, transparent: true, opacity: 0.32, depthWrite: false }),
  soundWall: new THREE.MeshLambertMaterial({ color: 0xcfc6b4 }),   // 방음벽(솔리드): 스틸스터드+암면+석고2겹
  openingEdge: new THREE.MeshLambertMaterial({ color: 0x8f6f35 }),
  gable: new THREE.MeshLambertMaterial({ color: 0xf8fafc, side: THREE.DoubleSide }),
  roof: new THREE.MeshLambertMaterial({ color: 0x565c64, side: THREE.DoubleSide }),   // 징크(그래파이트 그레이) 지붕 260T
  roofEdge: new THREE.MeshLambertMaterial({ color: 0x515966, side: THREE.DoubleSide })
};

// 텍스처 기반 재질
materials.gravel = new THREE.MeshLambertMaterial({ map: makeGravelTexture() });          // 파쇄석(앞마당)
materials.site = new THREE.MeshLambertMaterial({ map: makeEarthTexture() });             // 흙(부지)
materials.porcelainDeck = new THREE.MeshLambertMaterial({ map: makePorcelainDeckTexture() });  // 포세린 타일 데크

// 골조 재질(목재 톤)
materials.woodFrame = new THREE.MeshLambertMaterial({ color: 0xc69c6d });   // 목골조(중목·경량목) 목재 마감
materials.deckFloorFrame = new THREE.MeshLambertMaterial({ color: 0xb5793f });   // 데크 바닥 골조(장선) — 목재 갈색(집과 구분)
materials.deckStairFrame = new THREE.MeshLambertMaterial({ color: 0x5b5f66 });   // 데크 계단 프레임(앞·왼쪽 직선) — 짙은 회색(데크 둘레 틀과 구분)
materials.deckFanFrame = new THREE.MeshLambertMaterial({ color: 0x4a78a8 });   // 계단 사이 부채꼴 연결부 — 파랑(직선 계단·데크와 구분)
materials.firstExtWall = new THREE.MeshLambertMaterial({ color: 0xcdd5dc, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false });   // 1층 외벽 — 반투명(내부 보이게)
materials.gravel = new THREE.MeshLambertMaterial({ color: 0x9a948c });   // 파쇄석 바닥(전실) — 회색 자갈
materials.conceptWall = new THREE.MeshLambertMaterial({ color: 0xcdd6df, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false });   // 신축안 둘레벽 — 반투명(내부 구역 보이게)
materials.stairInnerWall = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false });   // 계단실 양쪽 내벽 — 반투명(계단·1층 공유)
