// view-state.js — 부품 표시 상태(view 객체) 단일 출처. notes(메모 필터)와 ui(가시성)가 공유.
// 가시성 상태
//  · building: '기초' / '+1층' / '+다락' / '+지붕' 중 하나만 선택되는 건물 누적 뷰(집만 제어)
//    - 기초만(foundation)은 기초 슬래브만, +1층(first)부터 1층 골조·실내가 얹힘
//  · deckOn / 썬룸On / wallOn / accessoryOn: 데크·썬룸·외벽·악세사리 독립 on/off 토글
//    - 썬룸는 데크가 켜진 경우에만 가능(썬룸는 데크 위에 얹힘)
//    - 외벽(다누몰 자바라, 시공 업체 별도)은 썬룸가 켜진 경우에만 가능(외벽은 썬룸에 매달림)
//    - 악세사리(화분·의자·테이블·그릴)는 완전 독립 토글
// building 시공 누적 단계: plan(배치도) → foundation(기초) → floorFrame(바닥틀) → floor(바닥재) → first(1층) → second(다락) → all(지붕)
// ── 부품 가시성(레이어 패널 방식) ───────────────────────────────────────────────
// 각 부품을 독립 체크박스 토글로 보이기/숨기기(완전 독립 — 누적 없음). 단일 출처 PARTS·CHECKS
// 테이블이 [객체배열 ↔ 상태 ↔ 체크박스]를 일괄 구동. 배치도·전체모델은 여러 부품을 한 번에
// 세팅하는 프리셋 뷰 버튼(부감/전체).
export const view = {
  // 기초 그룹
  plan: false,        // 배치도(부감) — 대지·도로·담장·말뚝·평면치수
  matFoundationFull: false,  // 매트기초(집+데크 50cm)
  // 집 그룹(내부구조 부품별)
  firstFloorFinish: false, // 집 1층 바닥재
  firstCeiling: false, // 집 1층 천장 설비(실링팬·에어컨·실외기)
  stair: false,       // ㄷ자 계단 본체
  firstWall: false,     // 1층 외벽('1층' 그룹 '외벽' 버튼)
  firstOutlet: false,   // 1층 콘센트('1층' 그룹 '콘센트' 버튼)
  atticExtWall: false,  // 다락 외벽('다락' 그룹 '외벽' 버튼)
  firstRoom: false,   // 1층 골조·실내
  bath: false,        // 화장실
  loft: false,        // 실제 다락 바닥(슬래브·방)
  atticInnerWall: false, // 다락 내벽
  roof: false,        // 지붕
  solar: false,       // 태양광(지붕에서 분리)
  // 썬룸 그룹 (악세사리는 '데크'에 합침)
  deck: false, folding: false, frame: false, sunRoof: false,   // frame=포치 골조(폴딩도어 지지), sunRoof=포치 징크 지붕
  // 참고(임시)
  hedge: false, fence: false,
  // 2층·다락 탭(s2)
  s2Foundation: false,   // s2 집 기초(온통 0.5m 슬래브 8×6)
  s2Wall1: false,        // s2 1층 외벽 — '1층' 그룹 '외벽' 버튼
  s2Wall2: false,        // s2 2층 외벽 — '2층' 그룹 '외벽' 버튼
  s2Wall3: false,        // s2 3층 외벽(박공 포함) — '3층' 그룹 '외벽' 버튼
  s2Ecu3: false,         // s2 3층 실외기(방열/배기 루버 그릴 + 벽 안쪽 실외기실) — '3층' 그룹 '실외기' 버튼
  s2Stair: false,        // 계단 버튼 — 1·2·3층 계단 전체(하부런+계단참+상부런) 한 토글, '전체' 그룹
  s2Floor1: false,       // s2 1층 바닥('1층' 버튼)
  s2Floor2: false,       // s2 2층 바닥('2층' 버튼)
  s2Floor3: false,       // s2 3층 바닥('3층' 버튼)
  s2Lift: false,         // s2 홈리프트 전체 샤프트 — '전체' 그룹 '홈리프트' 버튼(독립)
  s2Roof3: false,        // s2 지붕(징크 박공·처마·눈막이) — '3층' 그룹 '지붕' 버튼
  s2Solar3: false,       // s2 뒤 지붕 태양광 3kW — '3층' 그룹 '태양광' 버튼
  s2Furniture: false,    // s2 1층 가구(식탁·의자)
  s2Sink: false,         // s2 1층 싱크대(주방)
  s2Stove: false,        // s2 1층 화목난로(오른쪽 붉은 예약 구획) — '난로' 버튼
  s2Fan1: false,         // s2 1층 천장 실링팬 2개 — '실링팬' 버튼
  s2Fan2: false,         // s2 2층 방 천장 실링팬 2개 — '실링팬' 버튼
};

// 부품 → 객체배열 매핑(단일 출처). 배치도(부감)에선 모든 입체 부품을 숨김.
