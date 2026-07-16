// s2/floor3.js — 3층: 화장실(벽·문·변기·건식 세면대·온수기)·게스트룸1/2(방문·칸막이·붙박이장·매트리스) (s2 계단 모듈에서 분리).
// 실좌표는 s2Geo(계단 모듈이 채움) 공유 — 좌표 재계산 금지(단일 출처).
import * as THREE from 'three';
import { scene } from '../scene.js';
import { materials } from '../materials.js';
import { box, captureInto } from '../primitives.js';
import { label } from '../labels.js';
import { yzWallPrism } from '../builders.js';
import { pocketDoorVertical, horizontalWallWithGaps } from '../openings.js';
import { interiorWall, interiorDoorW, interiorDoorH } from '../constants.js';
import {
  S2_STAIR, s2Geo, s2F3VanityW, s2F3VanityD, s2F3VanityH, s2F3HeaterL,
  s2Floor3SlabT, s2RoofUnderY, s2RidgeZ,
} from './constants.js';
import { s2Floor3Objects } from '../groups.js';

export function buildS2Floor3() {
  const { inX0, inX1, inZ0, inZ1, zB0, far3, levels, liftZ0, liftD, g2RoomW, RM_L, wcW3, wcSinkOff, placeMark } = s2Geo;
  const { W } = S2_STAIR;
  const inW = inX1 - inX0;
  const floor3T = s2Floor3SlabT;
captureInto(s2Floor3Objects, () => {
  box({ x: inX0, z: inZ0, w: inW, d: zB0 - inZ0, y: levels[2] - floor3T, h: floor3T, mat: materials.floorSlab });   // 런 앞쪽(저Z) 전체 폭
  box({ x: far3, z: zB0, w: inX1 - far3, d: inZ1 - zB0, y: levels[2] - floor3T, h: floor3T, mat: materials.floorSlab });   // 런 밴드: 계단실 끝부터 직사각으로 채움
  const wcSetback3 = 0.4;                     // 3층 화장실 문 있는 앞벽(복도쪽 低Z)을 뒤로 들여 앞 복도·실외기실 확보 — 깊이 축소(단일 출처). 깊이 = liftD−0.4
  placeMark(levels[2], true, wcW3, liftD - wcSetback3);   // 3층 화장실 = 뒤쪽벽 따라 wcW3(X) × 왼쪽벽 따라 liftD−0.4(Z, 앞벽 0.4m 들임)
  const g1ClosetD = 0.8;                                                                                             // 붙박이장 깊이(단일 출처) — 게스트룸1 치수·장이 함께 참조
  const g1W = far3 - inX0, g1D = (zB0 - interiorWall - g1ClosetD) - inZ0;                                             // 게스트룸1 실사용 바닥 — 폭=옆벽(far3)~외벽, 깊이=앞 외벽~붙박이장 앞면(계단실 분리벽서 0.8m)
  label(`게스트룸1 ${g1W.toFixed(2)}×${g1D.toFixed(2)}m`, inX0 + g1W / 2, levels[2] + 0.4, inZ0 + g1D / 2, 'room');   // 게스트룸1(연두) — 벽 두께·붙박이장 뺀 실사용 바닥
  const g2W = g2RoomW - 0.15, g2D = RM_L - interiorWall;                                                              // 게스트룸2 실사용 바닥 — 폭=옆벽(15cm) 뺌, 깊이=뒤 칸막이벽(10cm) 뺌
  label(`게스트룸2 ${g2W.toFixed(2)}×${g2D.toFixed(2)}m`, inX1 - g2RoomW / 2, levels[2] + 0.4, inZ0 + RM_L / 2, 'room');   // 게스트룸2(회색) — 벽 두께 뺀 실사용 바닥
  // 보라색 화장실(왼쪽-뒤 코너) — 홈리프트 뒤(高X면)·복도쪽(홈리프트 끝선) 벽으로 둘러 막고, 복도(低Z)에서 문으로 진입.
  //   막힌 변: 좌측벽 inX1(高X)·뒤벽 inZ1(高Z)·홈리프트벽(低X)·복도벽(低Z). 문 = 복도벽(低Z)에서 안(+Z)으로 열림(2층 화장실문과 동일).
  {
    const fy = levels[2], px1 = inX1, pz1 = inZ1, px0 = inX1 - wcW3, pz0 = liftZ0 + wcSetback3;   // pz0 = 문 있는 앞벽 — 뒤로 0.2m 들임(복도 확보)
    // 변기 — 뒤벽(高Z)에 물탱크 붙이고 앞(低Z) 착석. 옆벽(좌측 高X)에서 0.2m 띄움(문 스윙 안 닿게, 안 붙게).
    box({ x: px1 - 0.64, z: pz1 - 0.1, w: 0.44, d: 0.1, y: fy, h: 0.5, mat: materials.toilet });    // 물탱크
    box({ x: px1 - 0.62, z: pz1 - 0.55, w: 0.4, d: 0.45, y: fy, h: 0.34, mat: materials.toilet });  // 양변기
    label('권장 화장실', px1 - 0.63, fy + 0.95, pz1 - 0.45, 'furniture');
    // 홈리프트 뒤(高X면) 벽 — 低X 경계(px0)에 안쪽면 맞추고 몸통은 홈리프트쪽(-X)으로. 바닥~박공 밑선, 앞끝(pz0)~뒤벽(pz1) 전체. 문 없음.
    const wx = px0 - 0.10;
    yzWallPrism({ x: wx, thickness: 0.10, mat: materials.wall, points: [[pz0, fy], [pz1, fy], [pz1, s2RoofUnderY(pz1)], [pz0, s2RoofUnderY(pz0)]] });
    // 복도쪽 벽(低Z 면, z=pz0=홈리프트 끝선) — 10cm, 복도면(pz0)에 바깥면 맞추고 몸통은 화장실 안(+Z)으로 넣어 복도로 안 튀어나오게. 문 개구만 비움. 박공 밑선까지(pz0 일정 → 높이 일정).
    const dW = 0.7, dH = 2.0, wTop = s2RoofUnderY(pz0), dx0 = px0 + 0.10, dx1 = dx0 + dW;   // 문 = 2층 화장실문과 동일 위치(홈리프트쪽 벽에서 0.10)
    box({ x: px0, z: pz0, w: dx0 - px0, d: 0.10, y: fy, h: wTop - fy, mat: materials.wall });           // 문 低X쪽 벽(홈리프트쪽)
    box({ x: dx1, z: pz0, w: px1 - dx1, d: 0.10, y: fy, h: wTop - fy, mat: materials.wall });           // 문 高X쪽 벽(안방쪽 외벽까지)
    box({ x: dx0, z: pz0, w: dW, d: 0.10, y: fy + dH, h: wTop - (fy + dH), mat: materials.wall });      // 문 위 인방
    // 출입문 — 복도벽(低Z) 폭 0.7. 복도서 밀면 화장실 안(+Z)으로 90° 열림. 경첩=低X(dx0, 홈리프트쪽) 모서리, 손잡이=高X(dx1) 자유단. (2층 화장실문과 동일)
    box({ x: dx0, z: pz0, w: dW, d: 0.04, y: fy, h: dH, mat: materials.wcDoor });                       // 문짝(닫힘, 복도면 pz0)
    box({ x: dx1 - 0.18, z: pz0 - 0.05, w: 0.05, d: 0.05, y: fy + 1.02, h: 0.05, mat: materials.handle });     // 손잡이(高X 자유단, 복도쪽)
    const swing = new THREE.Mesh(
      new THREE.CylinderGeometry(dW, dW, 0.02, 24, 1, false, 0, Math.PI / 2),
      materials.swingSweep,
    );
    swing.position.set(dx0, fy + 0.02, pz0);   // 0~PI/2 = +Z(안쪽 열림)~+X(닫힘,벽). 경첩=低X(dx0)
    scene.add(swing);   // captureInto가 s2Floor3Objects로 자동 수집
    label('화장실 문', dx0 + dW / 2, fy + 1.4, pz0 - 0.05, 'opening');
  }
  // 건식 세면대 — 화장실 안, 뒤(외벽 高Z)에 등 붙임. 문 스윙(주방쪽 低X)을 비키고 변기(안방쪽 高X) 사이에 둠.
  //   수전은 세탁기 수도처럼 뒤 외벽에서 나오고, 하부장 안에 경동 나비엔 전기온수기 15L 설치.
  {
    const fy = levels[2], vW = s2F3VanityW, vD = s2F3VanityD, vH = s2F3VanityH;
    const vx = inX1 - wcSinkOff;                 // 화장실 안 — 변기와 표준 간격(중심 0.75m) 고정. 주방쪽 벽(px0)이 더 빠져도 세면대는 제자리 → 문 스윙이 비킴
    const vz = inZ1 - vD;                        // 뒤(高Z) 외벽에 등 붙임
    box({ x: vx, z: vz, w: vW, d: vD, y: fy, h: vH, mat: materials.sinkCabinet });                              // 하부장
    box({ x: vx + 0.08, z: vz + 0.06, w: vW - 0.16, d: vD - 0.12, y: fy + vH, h: 0.04, mat: materials.sinkBasin });   // 세면볼
    box({ x: vx + vW / 2 - 0.03, z: inZ1 - 0.10, w: 0.06, d: 0.10, y: fy + vH + 0.18, h: 0.06, mat: materials.entryFrame });   // 벽수전(뒤 외벽에서 나옴 — 세탁기 수도식)
    // 하부장 안 경동 나비엔 전기온수기 15L — 반투명 표시(가구 안에 들어감)
    const heater = new THREE.Mesh(
      new THREE.BoxGeometry(0.30, 0.42, 0.30),
      materials.heaterGhost,
    );
    heater.position.set(vx + vW - 0.20, fy + 0.23, vz + vD - 0.20);
    scene.add(heater);   // captureInto가 s2Floor3Objects로 자동 수집
    label('세면대(건식)', vx + vW / 2, fy + vH + 0.5, vz + 0.1, 'furniture');
    label(`전기온수기 ${s2F3HeaterL}L`, vx + 0.18, fy + 0.55, vz + 0.05, 'mep');
  }
  // 3층 층계참(도착칸)은 '계단' 토글에 포함 — 아래 s2Stair2Objects 블록에서 함께 그림(층 바닥과 분리).
  const pktWallT = 0.15;      // 포켓도어 벽 두께 15cm — 게스트룸1 옆벽도 같은 선상·같은 두께(단일 출처)
  const fy3 = levels[2];
  // x벽(far3·gxL) 한 구간(za~zb)을 바닥(또는 인방 by)부터 박공 밑선까지 세움 — 구간 안 용마루(s2RidgeZ)는 꼭지점으로 꺾음
  const xWallSeg = (x, za, zb, by) => {
    const pts = [[za, by], [zb, by], [zb, s2RoofUnderY(zb)]];
    if (za < s2RidgeZ && s2RidgeZ < zb) pts.push([s2RidgeZ, s2RoofUnderY(s2RidgeZ)]);
    pts.push([za, s2RoofUnderY(za)]);
    yzWallPrism({ x, thickness: pktWallT, mat: materials.wall, points: pts });
  };
  // 마주보는 두 방문(게스트룸1 옆벽 far3 ↔ 게스트룸2 옆벽 gxL) — 전체폭 1.8(표준 개구 0.9 + 문짝 주차 0.9)로 같은 위치(마주봄).
  //   둘 다 각 방에서 '오른→왼' 슬라이드 → 두 방이 서로 반대편을 보므로 열린 구멍이 한쪽은 앞·한쪽은 뒤로 어긋나 서로 안 보임.
  const dUnitW = 2 * interiorDoorW, dTopY = fy3 + interiorDoorH;
  const dUz0 = inZ0 + (RM_L - dUnitW) / 2;         // 문 유닛 시작 z — 짧아진 게스트룸2 벽 길이(RM_L=inZ0~gz1) 안 가운데. 두 문이 함께 앞으로, 게스트룸2 문이 뒤벽에 안 물리게
  const dUmid = dUz0 + interiorDoorW;              // 유닛 가운데(개구/포켓 경계)
  const dUz1 = dUz0 + dUnitW;                      // 유닛 끝
  // 게스트룸1(연두) 옆벽 — far3 선상·15cm. 구멍=앞쪽 절반[dUz0,dUmid](문짝은 +Z 포켓으로 주차). 앞·뒤 막힌벽 + 개구 위 인방.
  xWallSeg(far3, inZ0, dUz0, fy3);
  xWallSeg(far3, dUz0, dUmid, dTopY);
  xWallSeg(far3, dUmid, zB0, fy3);
  pocketDoorVertical(far3 + pktWallT, dUz0, fy3, interiorDoorH, 1, interiorDoorW, materials.stdRoomDoor);
  label('표준 방문', far3, fy3 + 1.0, dUz0 + interiorDoorW / 2, 'opening');
  // 계단실 분리벽 — 3층을 계단 구멍(아래 개방 포치까지 뚫림)과 막아 벌레·냉난방 차단. 윗선은 박공지붕 밑선에 맞춤. 계단으로 올라서는 면에 포켓도어 1개.
  {
    const fy = levels[2], t = interiorWall, pt = pktWallT;                                                                 // pt = 포켓도어 벽 두께 15cm(문짝 수납) — 게스트룸1 옆벽과 단일 출처
    // ① 계단실 옆 내벽(주방쪽 보는 면) — 계단 구멍 앞면(zB0) 따라, 우측벽(inX0)~도착끝(far3). 포켓도어 벽 두께만큼 더 늘려 모서리를 ㄱ자로 채움. 막힌 벽. 윗면=그 z의 지붕 밑선(평탄).
    horizontalWallWithGaps(inX0, zB0 - t, far3 + pt - inX0, fy, [], s2RoofUnderY(zB0) - fy, t, materials.wall);
    // ② 계단 올라서는 면 내벽(포켓도어 벽, 두께 pt) — 도착끝(far3) 따라 앞(zB0)~뒤벽(inZ1). 벽은 3층 바닥 위(far3 바깥)에 세워 계단 발판을 침범하지 않음. 윗선은 박공 경사를 따라 기울고(yzWallPrism), 올라서는 칸에 포켓도어 1개.
    const dZ = zB0, dZ1 = zB0 + W;                                                                                          // 개구 = 계단 도착칸(폭 W) 전체 — 계단 너비와 동일
    const doorTopY = fy + interiorDoorH;
    yzWallPrism({ x: far3, thickness: pt, mat: materials.wall, points: [[dZ, doorTopY], [dZ1, doorTopY], [dZ1, s2RoofUnderY(dZ1)], [dZ, s2RoofUnderY(dZ)]] }); // 문 위 인방(문틀~지붕)
    yzWallPrism({ x: far3, thickness: pt, mat: materials.wall, points: [[dZ1, fy], [inZ1, fy], [inZ1, s2RoofUnderY(inZ1)], [dZ1, s2RoofUnderY(dZ1)]] });        // 문 뒤쪽 벽(바닥~지붕, 포켓 수납)
    pocketDoorVertical(far3 + pt, dZ, fy, interiorDoorH, 1, W);                                                            // 포켓도어(폭 W=계단 너비) — 뒤쪽 벽 속으로 슬라이드
    label('계단실 단열 포켓도어', far3, fy + 1.0, dZ + W / 2, 'opening');
  }
  // 게스트룸1 붙박이장 — 계단실 분리벽(뒤·高Z)에 등 붙이고 방 앞(-Z)으로 깊이 0.8m 나옴. 폭=우측 외벽(inX0)~옆벽(far3) 방 전체. 높이 2.4m(박공 밑선 아래).
  {
    const fy = levels[2], clD = g1ClosetD, clH = 2.4;
    const clZ1 = zB0 - interiorWall, clZ0 = clZ1 - clD;   // 계단실 분리벽 방쪽 면 ~ 장 앞면
    const clX0 = inX0, clW = far3 - inX0;                 // 폭 = 방 전체 폭(우측 외벽~옆벽)
    box({ x: clX0, z: clZ0, w: clW, d: clD, y: fy, h: clH, mat: materials.sinkCabinet });
    label(`붙박이장 ${clW.toFixed(2)}×${clD.toFixed(2)}m`, clX0 + clW / 2, fy + clH + 0.3, clZ0 + clD / 2, 'furniture');
  }
  // 게스트룸2(회색) 칸막이벽 — 안방 외벽(inX1)·앞 외벽(inZ0)이 두 변을 막고, 트인 두 변에 칸막이. '회색' 자리(배경) 안쪽으로 세움.
  {
    const fy = levels[2], gxL = inX1 - g2RoomW, gz1 = inZ0 + RM_L;   // 회색 자리 저X 변(게스트룸1쪽, 복도 1.0m)·高Z 변(화장실쪽)
    // ① 화장실쪽 벽(高Z 변, z=gz1) — 10cm, 방 안쪽(-Z)으로. X: 저X 변(gxL)~안방 외벽(inX1). 그 z의 박공 밑선 높이(평탄).
    box({ x: gxL, z: gz1 - 0.10, w: inX1 - gxL, d: 0.10, y: fy, h: s2RoofUnderY(gz1) - fy, mat: materials.wall });
    // ② 다른쪽 벽(저X 변, x=gxL, 게스트룸1쪽) — 15cm, 방 안쪽(+X)으로. Z: 앞 외벽(inZ0)~화장실쪽 벽(gz1).
    //   마주보는 표준 방문: 구멍=뒤쪽 절반[dUmid,dUz1](문짝은 -Z 포켓으로 주차) → 게스트룸1 구멍(앞쪽)과 어긋나 서로 안 보임. 앞·뒤 막힌벽 + 개구 위 인방.
    xWallSeg(gxL, inZ0, dUmid, fy);
    xWallSeg(gxL, dUmid, dUz1, dTopY);
    xWallSeg(gxL, dUz1, gz1, fy);
    pocketDoorVertical(gxL + pktWallT, dUmid, fy, interiorDoorH, -1, interiorDoorW, materials.stdRoomDoor);
    label('표준 방문', gxL, fy + 1.0, dUmid + interiorDoorW / 2, 'opening');
  }
  // 게스트룸 매트리스(베이지·두께 10cm, 앞쪽 외벽에 머리·옆벽에 붙임) — 게스트룸1: 2.0×1.8 1개 / 게스트룸2: 2.0×1.1 2개(좌우 옆벽)
  {
    const fy = levels[2], mH = 0.1;
    const mMat = materials.mattress;
    const pMat = materials.pillow;
    const mattress = (x0, z0, w, d, txt) => { box({ x: x0, z: z0, w, d, y: fy, h: mH, mat: mMat }); label(txt, x0 + w / 2, fy + mH + 0.15, z0 + d / 2, 'furniture'); };
    const pillow = (cx) => box({ x: cx - 0.35, z: inZ0 + 0.07, w: 0.7, d: 0.4, y: fy + mH, h: 0.1, mat: pMat });   // 매트 위·앞벽(低Z)쪽 머리맡
    // 게스트룸1(低X·주방쪽) 더블 — 앞 외벽(低Z)에 머리, 주방쪽 옆벽(低X)에 붙임. 폭1.8(X)×길이2.0(Z). 베개 2개
    const m1W = 1.8, m1L = 2.0;
    mattress(inX0, inZ0, m1W, m1L, '매트리스 2.0×1.8m');
    pillow(inX0 + 0.5); pillow(inX0 + 1.3);
    // 게스트룸2(高X·안방쪽) 싱글 2개 — 앞 외벽(低Z)에 머리, 좌우 옆벽에 각 1개. 폭1.1(X)×길이2.0(Z). 각 베개 1개
    const m2W = 1.1, m2L = 2.0;
    mattress(inX1 - 2 * m2W - 0.1, inZ0, m2W, m2L, '매트리스 2.0×1.1m');   // 안방 외벽쪽으로 나란히(안쪽·옆벽매트와 10cm 간격)
    pillow(inX1 - 1.5 * m2W - 0.1);
    mattress(inX1 - m2W, inZ0, m2W, m2L, '매트리스 2.0×1.1m');      // 안방 외벽쪽 옆벽
    pillow(inX1 - m2W / 2);
  }
});
}
