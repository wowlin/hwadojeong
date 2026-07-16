// notes.js — 우측 설계 메모(NOTES)와 렌더(updateNotes). 수치는 전부 코드 상수·s2Geo에서 ${} 파생(§5-2).
import { fmtDim } from './primitives.js';
import { view } from './view-state.js';
import { s1DeckFurn, deckRoofBcrArea } from './s1/deck.js';
import { stairGeom, stairParams } from './s1/stair.js';
import { hedgeH, fenceH } from './site.js';
import {
  buildingW, buildingD, buildingBackZ, groundTopY, matFoundationH, roofThickness,
  hedgeThickness, zincFinishT, roofSlopeDeg,
} from './constants.js';
import { lotX0, lotZ1, stairLowXRunX, stairHighXRunX } from './layout.js';
import {
  S2_STAIR, s2W, s2D, s2BackZ, s2WallT, _wBase, F3, roofY, s2Geo,
  s2RoofPitch, s2RoofEaveOver, s2RoofSideOver, s2SnowGuardT, s2Solar,
  s2LandingW, s2LiftW, s2LiftD, s2LiftInW, s2LiftInD, s2LiftModel, s2WallInner,
  s2F2, s2F3VanityW, s2F3VanityD, s2F3VanityH, s2F3HeaterL,
  s2WcSinkGap, s2WcSinkClear, s2WcToiletOff, s2RoofUnderY, s2FrontStair, s2RearStair,
} from './s2/constants.js';

const mm = (v) => Math.round(v * 1000);                // m → mm 정수(메모 표기용) — 전 메모 공용 헬퍼 1벌(#20)
const lotArea = 161;                                   // 대지면적(㎡, 잡종지 등기 실측 — 장암리 639-25) — 두 도면 개요가 공유(#19). 모델 부재 아님(등기값)

// 우측 설계 메모 — 모듈별 추가 설명. 현재 보이는 모듈에 해당하는 메모만 메뉴 순서로 표시.
export const NOTES = {
  get roof() {                                             // s1 지붕 경사 — 실물 상수 연동(J-⑦ 수리: 옛 '32도' 문구는 s2 지붕과 혼동된 오기, 실물은 33°)
    return { title: '지붕', body: `- 박공 지붕 경사는 ${roofSlopeDeg}도(실물 상수 연동).\n  (태양광 설치: 28~34도가 최적 경사대)` };
  },
  get deck() {                                             // 데크 가구·화목난로 — 실측값은 s1DeckFurn(단일 출처)에서 파생
    const f = s1DeckFurn;
    return { title: '데크', body: [
      '［데크 가구］',
      `· 식탁        ${f.nTables}개 (윗판 ${fmtDim(f.tW)}×${fmtDim(f.tD)}m)`,
      '· 의자        반고 햄프턴 DLX (테이블당 앞·뒤 2개)',
      '· 화목난로 영역   데크 우측(주방쪽) 예약 구획',
      '',
      '［화목난로 · 착탈 카세트］',
      '· 3번째 짝 하부   착탈 카세트 (겨울 연통홀 / 여름 솔리드 교체)',
      '· 4번째 짝 하부   착탈 카세트 (솔리드 · 독립 착탈)',
    ].join('\n') };
  },
  get stair() {                                            // s1 계단 사양 — ㄷ자(돌음 회전·평참 없음) 계단. 모두 계단 상수(stairParams·stairGeom)서 자동 계산
    const g = stairGeom(stairParams);
    const { W, R, T, N, fy, nWind, nLand, nL, nU, loftY, treadH, nosing, turnD } = g;
    const floorH = loftY - fy;                             // 1층 층고(= 다락 바닥 높이)
    return { title: '계단', body: [
      '［계단］ ㄷ자 · 돌음 회전(평참 없음) · 뒤벽 턴',
      `· 단높이      ${mm(R)} mm`,
      `· 디딤 깊이    ${mm(T)} mm`,
      `· 디딤판      ${mm(T + nosing)} × ${mm(W)} mm  (계단코 포함, 두께 ${mm(treadH)})`,
      `· 계단코      ${mm(nosing)} mm`,
      `· 런 폭       ${mm(W)} mm`,
      `· 런 사이 틈   ${mm(stairHighXRunX - stairLowXRunX - W)} mm`,   // 실제 틈 = 양쪽 벽에 붙은 두 런 사이 남는 폭(벽 두께차로 stairGap과 다름)
      `· 1층→다락    ${mm(floorH)} mm / ${N}단`,
      '',
      '［단 구성］ 아래→위',
      `· 하부 곧은계단   ${nL}단`,
      `· 하부 돌음(90°)  ${nWind}단`,
      `· 상부 돌음(90°)  ${nLand}단`,
      `· 상부 곧은계단   ${nU}단`,
      '· 다락 진입      1단',
      '',
      '［턴존(돌음 회전)］',
      `· 크기  ${mm(W)} × ${mm(turnD)} mm  (런 폭 × 턴존 깊이)`,
    ].join('\n') };
  },
  get s2Roof3() {
    const deg = Math.round(s2RoofPitch * 180 / Math.PI);
    return { title: '지붕 (징크 박공)', body: [
      `- 마감: 오리지널징크(티타늄아연). 단열 ${mm(roofThickness)} mm + 그 위 징크 ${mm(zincFinishT)} mm = 총 ${mm(roofThickness + zincFinishT)} mm.`,   // J-⑤ 수리 — 옛 문구가 총두께를 단열값(260)으로 오서술
      `- 경사 ${deg}° 박공, 용마루는 너비(X) 방향.`,
      `- 처마: 앞·뒤 ${fmtDim(s2RoofEaveOver)} m, 좌·우 ${fmtDim(s2RoofSideOver)} m 내밈.`,
      `- 눈막이(스노우가드): 양 슬로프 처마 근처 가로바 ${s2SnowGuardT.length}줄 — 쌓인 눈이 한꺼번에 미끄러지지 않게.`,
    ].join('\n') };
  },
  get s2Solar3() {
    const deg = Math.round(s2RoofPitch * 180 / Math.PI);
    const n = s2Solar.cols * s2Solar.rows, kw = n * s2Solar.wattEach / 1000;
    return { title: `태양광 ${fmtDim(kw)} kW`, body: [
      `- 뒤쪽(남측) 지붕 슬로프에 설치. 모듈 ${n}장(가로 ${s2Solar.cols} × 세로 ${s2Solar.rows}, 약 ${s2Solar.wattEach} W) ≈ ${fmtDim(kw)} kW.`,
      `- 한전 상계(역송) 연계. 박공 ${deg}°는 태양광 최적 경사대(28~34°) 안.`,
    ].join('\n') };
  },
  get s2Wall3() {                                          // 박공 외벽 envelope — 높이·각도(기초 상단 기준, 단일 출처서 계산)
    const deg = s2RoofPitch * 180 / Math.PI;                 // 박공 각도 단일 출처(s2RoofPitch)에서 읽음
    const rise = (s2D / 2) * Math.tan(s2RoofPitch);          // 처마→용마루 상승(깊이 절반 × tan(박공각))
    const wallH = roofY - _wBase;                            // 앞뒤벽: 기초 상단~처마
    const peakH = wallH + rise;                              // 좌우 꼭지점: 기초 상단~용마루
    return { title: '외벽 · 박공지붕', body: [
      `- 박공지붕 경사: ${Math.round(deg)}°`,
      `- 앞뒤벽 높이(기초 상단~처마): ${fmtDim(wallH)} m`,
      `- 좌우 꼭지점 높이(기초 상단~용마루): ${fmtDim(peakH)} m`,
      `- 용마루가 처마보다 ${fmtDim(rise)} m 높음 (깊이 ${fmtDim(s2D)} m의 절반 × tan${Math.round(deg)}°)`,
    ].join('\n') };
  },
  get s2Floor1() {                                         // 1층 바닥 — 마감 재질 + 정면·뒤 옥외 계단 사양(계단 상수서 자동 계산)
    const rise = matFoundationH + S2_STAIR.slabT;                    // 지면~1층 바닥 윗면(정면·뒤 계단 공통 상승)
    const fRis = rise / s2FrontStair.steps, rRis = rise / s2RearStair.steps;
    return { title: '1층 바닥', body: [
      '［바닥 마감］',
      '· 페데스탈(높이조절 받침) + 포세린 타일',
      '· 건식 시스템',
      '',
      '［정면 옥외 계단］ 집 너비 전체',
      `· 너비    ${fmtDim(s2W)} m`,
      `· 단 수    ${s2FrontStair.steps}단`,
      `· 단높이   ${fmtDim(fRis)} m`,
      `· 디딤    ${fmtDim(s2FrontStair.tread)} m`,
      '· 마감    포세린 타일',
      '',
      '［뒤 출입문 옥외 계단］',
      `· 폭     ${fmtDim(s2RearStair.width)} m`,
      `· 단 수    ${s2RearStair.steps}단`,
      `· 단높이   ${fmtDim(rRis)} m`,
      `· 디딤    ${fmtDim(s2RearStair.tread)} m`,
      '· 마감    포세린 타일',
    ].join('\n') };
  },
  s2Sink: { title: '주방', body: [
    '［전기온수기］',
    '· 경동나비엔 ESW560-30U (30리터)',
    '· 싱크대 아래 설치',
    '· 전용 콘센트(고전력·마젠타) — 하부장 안 낮은 높이',
    '',
    '［인덕션］',
    '· 직결(하드와이어) — 콘센트 아님',
    '· 전선 인출구(정션박스·보라) — 싱크 옆 하부장 안',
  ].join('\n') },
  get s2Stair() {                                          // 계단 사양 + 1층 계단참 아래 옷장 — 모두 계단 상수서 자동 계산
    const { T, R, W, g, tTh, floorH, nosing, rTh, usTh, nUpper, landingSteps } = S2_STAIR;
    const wF = 2 * W + g;                                  // 계단참 깊이(두 런 + 틈)
    const n1 = Math.round(floorH[0] / R), n2 = Math.round(floorH[1] / R);   // 비행별 단 수
    const nL = n1 - landingSteps - nUpper[0];              // 1→2 하부런 단 수(계단참 먹는 단·상부런 수 모두 S2_STAIR)
    const width = W - rTh;                                 // 옷장 너비: 우측 외벽 안쪽~계단참 챌판(챌판 두께 제외)
    const depth = W + usTh;                                // 옷장 깊이: 문 앞면~뒤벽 안쪽(계단아래 문 두께 포함)
    const height = (nL + 1) * R - tTh;                     // 옷장 높이: 1층 바닥~계단참 하부
    return { title: '계단', body: [
      '［계단］ 좌우런 · 우측벽 스위치백',
      `· 단높이      ${mm(R)} mm`,
      `· 디딤 깊이    ${mm(T)} mm`,
      `· 디딤판      ${mm(T + nosing)} × ${mm(W)} mm  (계단코 포함, 두께 ${mm(tTh)})`,
      `· 런 폭       ${mm(W)} mm`,
      `· 런 사이 틈   ${mm(g)} mm`,
      `· 1→2층      ${mm(floorH[0])} mm / ${n1}단`,
      `· 2→3층      ${mm(floorH[1])} mm / ${n2}단`,
      '',
      '［참 크기］',
      `· 계단참(스위치백)  ${mm(W)} × ${mm(wF)} mm`,
      `· 층계참(도착칸)   ${mm(s2LandingW)} × ${mm(wF)} mm`,
      '',
      '［계단참 아래 옷장］ 쌍여닫이',
      `· 너비  ${mm(width)} mm  (외벽~챌판)`,
      `· 깊이  ${mm(depth)} mm  (문~뒤벽)`,
      `· 높이  ${mm(height)} mm  (바닥~계단참 밑)`,
    ].join('\n') };
  },
  get s2Lift() {                                           // 홈리프트 — 기준 제품·내외경·운행. 치수는 s2Lift* 상수서 파생
    const rise = roofY - (groundTopY + matFoundationH + S2_STAIR.slabT);   // 운행 높이(1층 바닥 윗면~처마)
    return { title: '홈리프트', body: [
      `［기준 제품］ ${s2LiftModel}`,
      '',
      '［크기］ 깊이 × 문면 폭',
      `· 내경(탑승)  ${fmtDim(s2LiftInW)} × ${fmtDim(s2LiftInD)} m`,
      `· 외경(샤프트) ${fmtDim(s2LiftW)} × ${fmtDim(s2LiftD)} m`,
      '',
      '［배치·운행］',
      '· 문: 계단쪽(복도쪽) — 계단을 마주봄',
      '· 뒤 외벽에 등 붙임(층계참 옆·안방쪽)',
      `· 운행: 1층 바닥~처마 관통 ${fmtDim(rise)} m (1~3층)`,
    ].join('\n') };
  },
  get s2Floor2() {                                         // 2층 — 화장실·앞방 크기. 그리기 실좌표(s2Geo)·모듈 상수서 자동 계산
    const { inX0, inX1, inZ0, inZ1, wF } = s2Geo;            // 그리기가 실제로 쓴 좌표(단일 출처)
    const { wcFaceX } = s2Geo;                                    // 화장실 低X 안쪽면 — 그리기 실좌표(s2Geo) 단일 출처(재계산 사본 제거)
    const bathW = inX1 - wcFaceX, bathD = wF;                // 화장실 실사용: 화장실벽 안쪽~안방 외벽 · 분리벽 안쪽~뒤벽
    const roomW = inX1 - inX0, roomD = (inZ1 - inZ0) - wF - s2WallInner;   // 앞방: 분리벽 앞 전체(전폭 × 앞 외벽~분리벽)
    const landW = s2LandingW, landD = wF;                    // 층계참(도착칸): 계단 끝~화장실 벽 · 분리벽~뒤 외벽
    return { title: '2층 — 화장실 · 안방', body: [
      `- 층계참(계단 올라와 방 들기 전 평평한 바닥, 벽 뺀): ${fmtDim(landW)} × ${fmtDim(landD)} m`,
      `- 화장실(벽 뺀 실사용 바닥): ${fmtDim(bathW)} × ${fmtDim(bathD)} m`,
      `- 안방(벽으로 분리, 길쭉): ${fmtDim(roomW)} × ${fmtDim(roomD)} m`,
      '',
      `[화장실 배치] 좌(안방쪽)=습식·우(주방쪽)=건식 분리. 문=앞 분리벽(안방서 밀어 +Z, 폭 ${fmtDim(s2F2.doorW)}, 도착칸쪽 벽서 ${fmtDim(s2WallInner)}). 앞벽 ${fmtDim(s2WallInner)} m.`,
      `- 변기: 안방쪽-뒤 코너(3층 변기와 수직정렬·오수관 직하). 중심 옆벽서 ${fmtDim(s2WcToiletOff)} m.`,
      `- 샤워부스: 안방쪽-앞 코너 ${fmtDim(s2F2.showerW)}×${fmtDim(s2F2.showerD)} m(유리벽 없이 개방 — 변기앞 공간 확보, 변기와 같은 왼쪽 습식존).`,
      `- 세면대: 변기 옆(3층처럼), 뒤 외벽에 등 붙임. 폭 ${fmtDim(s2F2.vanityW)}·깊이 ${fmtDim(s2F2.vanityD)} m. 변기와 중심 간격 ${fmtDim(s2WcSinkGap)} m. 벽수전(외벽서).`,
      `- 전기온수기 ${s2F2.heaterL} L: 외벽(뒤) 상부 벽거치(${s2F2.heaterL} L는 하부장에 숨기기엔 큼).`,
    ].join('\n') };
  },
  get s2Floor3() {                                         // 3층 — 계단앞(계단실 단열) 문 요구사항. 계단 상수·박공 단면서 자동 계산
    const W = S2_STAIR.W, wF = 2 * W + S2_STAIR.g;          // 계단 런 폭 · 계단참 깊이
    const inZ1 = s2BackZ - s2WallT, zB0 = inZ1 - wF;        // 계단실 앞면(개구 시작 Z)
    const floorY = F3 + S2_STAIR.slabT;                     // 3층 바닥 표면
    const hFront = s2RoofUnderY(zB0) - floorY;              // 개구 천장고 — 앞쪽(低Z, 데크쪽) 높은 끝
    const hStair = s2RoofUnderY(zB0 + W) - floorY;          // 개구 천장고 — 계단쪽(高Z) 낮은 끝
    return { title: '3층 — 계단앞 문(계단실 단열)', body: [
      '[요구사항] 문이 열리면 계단 너비와 똑같이 트여, 문이 없을 때와 같은 크기의 홀이 생겨야 한다.',
      `- 너비: 계단 런 폭과 동일 ${fmtDim(W)} m (양옆 문틀·벽이 폭을 잠식하지 않음 — 개구 순폭 = 계단 폭)`,
      `- 높이: 상인방 없이 바닥~천장(박공 경사 밑선) 전체. 경사라 앞쪽(데크쪽) ${fmtDim(hFront)} m ~ 계단쪽 ${fmtDim(hStair)} m.`,
      '- 즉 문틀·인방으로 막지 말 것. 열리면 개구 전체가 비어 계단실과 한 칸처럼 통해야 한다.',
      '',
      '[화장실 건식 세면대]',
      '- 위치: 3층 화장실 안, 뒤 외벽에 등 붙임(변기 옆). 세면대가 들어온 만큼 화장실을 주방쪽으로 넓혀 벽·문을 이동.',
      `- 변기↔세면대 중심 간격 ${fmtDim(s2WcSinkGap)} m(주택 욕실 표준). 주방쪽 벽·문은 복도쪽으로 더 빼 문이 열려도 세면대에 안 닿게 ${fmtDim(s2WcSinkClear)} m 여유.`,
      `- 하부장 ${fmtDim(s2F3VanityW)}×${fmtDim(s2F3VanityD)} m · 높이 ${fmtDim(s2F3VanityH)} m + 세면볼`,
      '- 수전: 세탁기 수도처럼 뒤 외벽에서 나오는 벽수전.',
      `- 하부장 안에 경동 나비엔 전기온수기 ${s2F3HeaterL} L 설치.`,
    ].join('\n') };
  },
  get hedge() {                                            // 측백담장 — 높이·두께는 코드(hedgeH·hedgeThickness)서 파생.
    return { title: '측백담장', body: [
      '- 측백나무 생울타리(상록)',
      `- 높이 ${fmtDim(hedgeH)} m · 두께 ${fmtDim(hedgeThickness)} m`,
    ].join('\n') };
  },
  get fence() {                                            // 옆집담장 — 높이는 코드(fenceH)서 파생.
    return { title: '옆집담장', body: [
      '- 우측 콘크리트 경계벽',
      `- 높이 ${fmtDim(fenceH)} m`,
    ].join('\n') };
  },
  get siteOverview() {                                     // 대지·지역 개요 + 건폐/용적 검토 — 항상 기본 표시. 숫자는 코드(s2W·s2D·이격 상수)서 파생.
    const floors = 3;                                      // 지상 층수
    const bldgArea = s2W * s2D;                            // 건축면적(1층 발자국)
    const totalArea = bldgArea * floors;                  // 연면적(전 층 합)
    const bcr = (bldgArea / lotArea) * 100;               // 건폐율
    const far = (totalArea / lotArea) * 100;              // 용적률
    const sideGap = -lotX0;                                // 옆집(주방측) 이격 = 집 외벽~옆 경계(파생)
    const rearGap = lotZ1 - s2BackZ;                      // 뒤 이격 = 집 뒤벽~후면 경계(파생)
    return { title: '대지 개요', body: [
      '[대지 · 지역]',
      '- 주소: 경기 포천시 이동면 장암리 639-25',
      `- 대지면적: ${lotArea} ㎡ (지목 잡종지 → 건축 후 ‘대’)`,
      '- 용도지역: 계획관리지역 + 성장관리계획구역',
      `- 이격거리: 도로(건축선) 1.0 m · 옆 ${sideGap.toFixed(1)} m · 뒤 ${rearGap.toFixed(1)} m`,
      '',
      '[규모 검토]',
      `- 건물: ${s2W}×${s2D.toFixed(1)} m · 지상 ${floors}층`,
      `- 건축면적 ${bldgArea.toFixed(0)} ㎡ · 연면적 ${totalArea.toFixed(0)} ㎡`,
      `- 건폐율: ${bcr.toFixed(1)} %  (한도 50 %)`,
      `- 용적률: ${far.toFixed(1)} %  (한도 125 %)`,
      '',
      '* 성장관리계획상 층수·높이 가이드라인은 포천시청 도시과(031-538-2114) 확인 필요.',
    ].join('\n') };
  },
  get siteOverviewS1() {                                   // 대지·지역 개요(1층+다락 안) — s1 도면 상단 상시 표시. 숫자는 코드(building*·deckRoof·이격 상수)서 파생.
    const houseArea = buildingW * buildingD;               // 집 건축면적(외벽 중심선 수평투영)
    const deckRoofArea = deckRoofBcrArea;                  // 포치(데크 지붕) 건축면적 — 외곽 기둥 중심선 안쪽(§119① 2호)
    const bldgArea = houseArea + deckRoofArea;            // 건축면적 = 집 + 포치(지붕 덮인 기둥 안쪽 전부)
    const floorArea = houseArea;                           // 연면적 = 1층 바닥만(다락·개방 포치는 바닥면적 비산입)
    const bcr = (bldgArea / lotArea) * 100;               // 건폐율
    const far = (floorArea / lotArea) * 100;              // 용적률
    const sideGap = -lotX0;                                // 옆집(주방측) 이격 = 집 외벽~옆 경계(파생)
    const rearGap = lotZ1 - buildingBackZ;                 // 뒤 이격 = 집 뒤벽~후면 경계(파생)
    return { title: '대지 개요', body: [
      '[대지 · 지역]',
      '- 주소: 경기 포천시 이동면 장암리 639-25',
      `- 대지면적: ${lotArea} ㎡ (지목 잡종지 → 건축 후 ‘대’)`,
      '- 용도지역: 계획관리지역 + 성장관리계획구역',
      `- 이격거리: 도로(건축선) 1.0 m · 옆 ${sideGap.toFixed(1)} m · 뒤 ${rearGap.toFixed(1)} m`,
      '',
      '[규모 검토]',
      `- 건물: ${buildingW}×${buildingD.toFixed(1)} m · 지상 1층 + 다락`,
      `- 건축면적: 집 ${houseArea.toFixed(1)} + 포치 ${deckRoofArea.toFixed(1)} = ${bldgArea.toFixed(1)} ㎡`,
      `- 건폐율: ${bcr.toFixed(1)} %  (한도 50 %)`,
      `- 연면적: ${floorArea.toFixed(1)} ㎡ (1층, 다락·포치 비산입)`,
      `- 용적률: ${far.toFixed(1)} %  (한도 125 %)`,
      '',
      '* 포치 건축면적 = 기둥으로 받친 지붕 → 외곽 기둥 중심선 안쪽 수평투영(§119① 2호). 개방 포치라 연면적엔 미산입.',
      '* 성장관리계획상 층수·높이 가이드라인은 포천시청 도시과(031-538-2114) 확인 필요.',
    ].join('\n') };
  },
  get s2Foundation() {                                     // 기초 — '기초' 토글 시. 두께는 코드(matFoundationH)서 파생.
    const slabH = matFoundationH;                                   // 온통기초(매트 슬래브) 두께
    return { title: '기초', body: [
      '[기초]',
      `- 형식: 온통기초(매트 슬래브) · ${s2W}×${s2D.toFixed(1)} m 전면`,
      `- 기초 두께: ${slabH.toFixed(2)} m (지면 위)`,
    ].join('\n') };
  },
};
const NOTE_ORDER = ['stair', 'roof', 'deck', 'hedge', 'fence', 's2Foundation', 's2Floor1', 's2Sink', 's2Stair', 's2Lift', 's2Floor2', 's2Floor3', 's2Wall3', 's2Roof3', 's2Solar3'];   // NOTES에 실제 있는 키만(죽은 키 13개 제거 — 새 메모 추가 시 여기와 NOTES 둘 다)
export function updateNotes(currentScheme) {
  const body = document.querySelector('#noteBody');
  if (!body) return;
  const active = NOTE_ORDER.filter((k) => (k === 'plan' ? view.plan : (!view.plan && view[k])) && NOTES[k]);
  // 대지 개요 — 도면(s1·s2)마다 시작 배치도든 입체든, 토글과 무관하게 항상 맨 위에 표시
  if (currentScheme === 's2' && NOTES.siteOverview) active.unshift('siteOverview');
  else if (currentScheme === 's1' && NOTES.siteOverviewS1) active.unshift('siteOverviewS1');
  if (!active.length) { body.innerHTML = '<p class="note-empty">이 화면에 대한 메모가 아직 없습니다.</p>'; return; }
  body.innerHTML = active.map((k) => `<section class="note-item"><h3>${NOTES[k].title}</h3><div class="note-text">${NOTES[k].body}</div></section>`).join('');
}
