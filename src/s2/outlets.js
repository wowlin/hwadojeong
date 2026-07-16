// s2/outlets.js — 2·3층 기본 콘센트(각 층 '외벽' 토글 귀속) (s2 계단 모듈에서 분리).
// 실좌표는 s2Geo(계단 모듈이 채움) 공유 — 좌표 재계산 금지(단일 출처).
import { captureInto } from '../primitives.js';
import { outlet } from '../fixtures.js';
import { label } from '../labels.js';
import { interiorWall, interiorDoorW } from '../constants.js';
import { s2Geo, s2F3VanityD, s2F2AcZ0, s2WcSetback3 } from './constants.js';
import { s2Wall2Objects, s2Wall3Objects } from '../groups.js';

export function buildS2Outlets() {
  const { inX0, inX1, inZ0, inZ1, zB0, far2, far3, levels, liftZ0, wcFaceX, g2RoomW, RM_L, wcW3, corrX: s2CorrX } = s2Geo;
// ── s2 2·3층 기본 콘센트 — 각 층 '외벽'(s2Wall2/s2Wall3) 토글에 귀속. 방·화장실·복도 일반 높이(바닥+0.3m). ──
// 벽면에 붙는 커버 플레이트 + 소켓. face로 벽 방향 지정('+X'=低X벽서 실내 +X 돌출, '-X'=高X벽서 -X, '-Z'=高Z벽서 -Z).
const wallOutlet = (x, z, oy, face, heat = false) => outlet(x, z, oy, face, heat ? 'h' : 'n');   // fixtures.outlet 1벌(#7) 어댑터
// 2층 콘센트 — 안방(주방측 외벽), 화장실(홈리프트쪽 내벽).
captureInto(s2Wall2Objects, () => {
  const oy = levels[1] + 0.3;
  const abZ = ((inZ0 + 2.0) + ((zB0 - 0.20) - 0.70)) / 2;   // 안방 주방측 벽 — 침대(앞)와 이불장(뒤) 사이 빈 벽면
  wallOutlet(inX0, abZ, oy, '+X');
  // 앞 외벽(低Z) — 침대옆 낮은 장(서랍장) 옆, 책상 자리 각 1개
  const abDrwX = (inX0 + 2.0 + 0.40) + 0.2;                 // 침대옆 서랍장(폭 2.0+깊이 0.4) 방문쪽 끝 옆
  wallOutlet(abDrwX, inZ0, oy, '+Z');
  const abDeskX = inX1 - 0.5;                                // 책상 위 — 왼쪽 벽(안방 외벽)쪽으로 이동
  wallOutlet(abDeskX, inZ0, oy, '+Z');
  const oyC = levels[1] + 1.1;                              // 화장실 콘센트 = 세면대(싱크대와 동일) 상판 높이 바닥+1.1m
  const wcZ = inZ1 - 0.5 / 2;                                // 화장실 低X 내벽 — 세면대 중앙선에 맞춤(세면대 깊이 0.5)
  wallOutlet(wcFaceX, wcZ, oyC, '+X');
  wallOutlet(inX1 - 0.42, inZ1, oyC, '-Z', true);           // 좌변기 뒤(뒤 외벽 高Z) 중앙 — 변기 X중심 inX1-0.42. 전기온수기용 고전력(마젠타)
  // 뒤 분리벽(방쪽 면 zB0-0.20) — 주 출입문(방문)~붙박이장, 주 출입문~화장실 문 사이 각 1개
  const abWz = zB0 - 0.20;                                   // 분리벽 안방쪽 면
  const abOX0 = far2 + (1.2 - interiorDoorW) / 2, abOX1 = abOX0 + interiorDoorW;   // 방문 개구(옆벽 코드와 동일 출처)
  const abBdX0 = wcFaceX + 0.10;                            // 화장실 문 저X 끝
  const abClosetX1 = inX0 + 2.0;                            // 이불장(붙박이장) 방문쪽 끝
  const abX1 = (abClosetX1 + abOX0) / 2;                    // 방문~붙박이장 사이 중앙
  wallOutlet(abX1, abWz, oy, '-Z', true);                   // 전기 난방용(주황)
  label('난방용 콘센트', abX1, oy + 0.25, abWz - 0.2, 'mep');
  const abX2 = (abOX1 + abBdX0) / 2;                        // 방문~화장실 문 사이 중앙
  wallOutlet(abX2, abWz, oy, '-Z', true);                   // 전기 난방용(주황)
  // 냉장고 콘센트 — 냉장고(폭 0.545, 안방 외벽 高X 밀착) 뒤 분리벽, 냉장고 위 높이
  const abFridgeX = inX1 - 0.545 / 2;                       // 냉장고 중앙 x
  const oyF = levels[1] + 1.8;                              // 냉장고 높이 1.70 위
  wallOutlet(abFridgeX, abWz, oyF, '-Z');
  // 에어컨(냉난방기) 콘센트 — 실내기 옆(화장실 벽쪽 高Z 끝), 유닛 높이. 안방 외벽 高X
  const acLen = 1.003, acZ0 = s2F2AcZ0;                    // 실내기 위치 — 설치 코드(floor2)와 단일 출처(#10)
  const acOutletZ = acZ0 + acLen + 0.12;                   // 유닛 高Z 끝서 12cm 옆
  const oyAc = levels[1] + 2.1;                            // 실내기 높이(천장 근처)
  wallOutlet(inX1, acOutletZ, oyAc, '-X', true);           // 에어컨용 고전력(마젠타)
  // 뒤 복도 프로젝트창 아래(뒤 외벽 高Z) — 3층과 동일
  const corrX2o = s2CorrX;                                 // 뒤 복도 프로젝트창 X중앙 — s2Geo.corrX 단일 출처(#2)
  wallOutlet(corrX2o, inZ1, oy, '-Z');
});
// 3층 콘센트 — 게스트룸1(주방측 외벽), 게스트룸2(안방측 외벽), 화장실(홈리프트쪽 내벽), 복도(안방측 외벽).
captureInto(s2Wall3Objects, () => {
  const oy = levels[2] + 0.3;
  const g1Z = ((inZ0 + 2.0) + ((zB0 - interiorWall) - 0.8)) / 2;   // 게스트룸1 주방측 벽 — 매트(앞)와 붙박이장(뒤) 사이
  wallOutlet(inX0, g1Z, oy, '+X');
  const g2Z = (inZ0 + RM_L) - 0.4;                                 // 게스트룸2 안방측 외벽 — 매트 뒤쪽 빈 벽면
  wallOutlet(inX1, g2Z, oy, '-X');
  // 앞 외벽(inZ0) — 각 방 문쪽(복도측 옆벽) 가까이 콘센트 각 1개
  const gDoorInset = 0.3;                                          // 문쪽 옆벽 방쪽 면에서 콘센트까지 공통 여백
  const g1x = far3 - gDoorInset;                                   // 게스트룸1 옆벽(far3=방쪽 면)서 안쪽
  wallOutlet(g1x, inZ0, oy, '+Z', true);                           // 게스트룸1 앞벽 — 전기 난방용(주황)
  label('난방용 콘센트', g1x, oy + 0.25, inZ0 + 0.2, 'mep');
  const g2x = (inX1 - g2RoomW + 0.15) + gDoorInset;               // 게스트룸2 옆벽(gxL+두께0.15=방쪽 면)서 안쪽
  wallOutlet(g2x, inZ0, oy, '+Z', true);                           // 게스트룸2 앞벽 — 전기 난방용(주황)
  label('난방용 콘센트', g2x, oy + 0.25, inZ0 + 0.2, 'mep');
  // 문 있는 옆벽 — 문과 뒤 내벽 사이 중앙에 콘센트 각 1개
  const dUz0 = inZ0 + (RM_L - 2 * interiorDoorW) / 2;              // 방문 유닛 시작 z(옆벽 코드와 동일 출처)
  const dUmid = dUz0 + interiorDoorW, dUz1 = dUz0 + 2 * interiorDoorW;
  const g1DoorZ = (dUmid + (zB0 - interiorWall)) / 2;             // 게스트룸1: 문(앞쪽 절반) 뒤끝 ~ 계단실 분리벽 사이 중앙
  wallOutlet(far3, g1DoorZ, oy, '-X');                            // 옆벽 far3(방쪽 면), 실내 -X
  const g2gz1 = inZ0 + RM_L;                                       // 게스트룸2 화장실쪽 칸막이벽(내벽)
  const g2DoorZ = (dUz1 + (g2gz1 - 0.10)) / 2;                    // 게스트룸2: 문(뒤쪽 절반) 뒤끝 ~ 칸막이벽 방쪽 면 사이 중앙
  wallOutlet(inX1 - g2RoomW + 0.15, g2DoorZ, oy, '+X');          // 옆벽 gxL(방쪽 면), 실내 +X
  const oyC = levels[2] + 1.1;                                    // 화장실 콘센트 = 세면대(싱크대와 동일) 상판 높이 바닥+1.1m
  const wcZ = inZ1 - s2F3VanityD / 2;                            // 3층 화장실 低X 내벽 — 세면대 중앙선에 맞춤
  wallOutlet(inX1 - wcW3, wcZ, oyC, '+X');
  wallOutlet(inX1 - 0.42, inZ1, oyC, '-Z');                      // 좌변기 뒤(뒤 외벽 高Z) 중앙 — 변기 X중심 inX1-0.42
  const corrX = s2CorrX;                                          // 앞·뒤 복도 프로젝트창 X중앙 — s2Geo.corrX 단일 출처(#2)
  wallOutlet(corrX, inZ0, oy, '+Z');                              // 앞 복도 프로젝트창 아래(앞 외벽)
  wallOutlet(corrX, inZ1, oy, '-Z');                              // 뒤 복도 프로젝트창 아래(뒤 외벽)
  // 실외기실 콘센트 — 高Z 벽(화장실 앞벽) 실외기 옆. 방수형(옥외 IP54)·1구(바닥 물기 피해 높이 올림)
  const ecuRoomZ = liftZ0 + s2WcSetback3;                        // 실외기실 高Z 벽 = 화장실 앞벽(들임 폭 s2WcSetback3 공유)
  const ecuRoomX = inX1 - 0.4;                                   // 실외기실 깊이 중앙
  wallOutlet(ecuRoomX, ecuRoomZ, levels[2] + 1.1, '-Z');        // 실외기 전원·점검용 — 화장실 콘센트와 동일 높이(바닥+1.1m)
});
}
