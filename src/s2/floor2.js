// s2/floor2.js — 2층: 화장실(변기·샤워·세면대·온수기)·안방(침대·서랍장·이불장·냉장고·냉난방기·책상) (s2 계단 모듈에서 분리).
// 실좌표는 s2Geo(계단 모듈이 채움) 공유 — 좌표 재계산 금지(단일 출처).
import * as THREE from 'three';
import { scene } from '../scene.js';
import { materials } from '../materials.js';
import { box, captureInto } from '../primitives.js';
import { label } from '../labels.js';
import { chairFrameMat, toiletAtBack, fridge311AtBack } from '../fixtures.js';
import { interiorDoorW, interiorDoorH } from '../constants.js';
import { s2Geo, s2F2, s2WallInner, s2Floor2SlabT, s2Floor3SlabT, s2F2AcZ0 } from './constants.js';
import { s2Floor2Objects } from '../groups.js';

export function buildS2Floor2() {
  const { inX0, inX1, inZ0, inZ1, zB0, far2, levels, wcFaceX, wcSinkOff, placeMark, wF } = s2Geo;
  const inW = inX1 - inX0;
  const floor2T = s2Floor2SlabT, floor3T = s2Floor3SlabT;
captureInto(s2Floor2Objects, () => {
  box({ x: inX0, z: inZ0, w: inW, d: zB0 - inZ0, y: levels[1] - floor2T, h: floor2T, mat: materials.floorSlab });   // 런 앞쪽(저Z) 전체 폭
  box({ x: far2, z: zB0, w: inX1 - far2, d: inZ1 - zB0, y: levels[1] - floor2T, h: floor2T, mat: materials.floorSlab });   // 런 밴드: 계단실 끝부터 직사각으로 채움
  // 계단실 옆벽 — 1→2 상부런 오를 때 왼쪽(앞쪽·저Z) 열린 변. 2층 바닥~천장(3층 바닥 밑면)까지 15cm 두께. 끝(계단 도착·高X)에서 1.2m 더 연장.
  //   도착칸 1.2m 가운데에 표준 슬라이딩 포켓도어(0.9×2.1) — 왼쪽(低X)으로 슬라이드. 그쪽으로만 벽이 길게 이어져 포켓 공간이 있고, 高X쪽은 모서리라 포켓 불가.
  {
    const wz = zB0 - 0.20, wt = 0.20, wTop = (levels[2] - floor3T) - levels[1];   // 내력벽 20cm — 뒤(계단 개구부·+Z zB0)면 고정, 안방쪽(-Z)으로 키움
    const oX0 = far2 + (1.2 - interiorDoorW) / 2, oX1 = oX0 + interiorDoorW;            // 도착칸 방문 개구(1.2m 가운데, 폭 0.9)
    const bdW = s2F2.doorW, bdX0 = wcFaceX + s2WallInner, bdX1 = bdX0 + bdW;            // 화장실 문 — 안방에서 밀어 들어옴(안여닫이 +Z). 화장실 低X 벽(wcFaceX)서 내벽두께
    box({ x: inX0, z: wz, w: oX0 - inX0, d: wt, y: levels[1], h: wTop, mat: materials.wall });                       // 왼쪽 벽(低X·포켓 수납)
    box({ x: oX1, z: wz, w: bdX0 - oX1, d: wt, y: levels[1], h: wTop, mat: materials.wall });                        // 가운데 벽(방문~화장실문)
    box({ x: bdX1, z: wz, w: inX1 - bdX1, d: wt, y: levels[1], h: wTop, mat: materials.wall });                      // 오른쪽 벽(화장실문~안방 외벽)
    box({ x: oX0, z: wz, w: interiorDoorW, d: wt, y: levels[1] + interiorDoorH, h: wTop - interiorDoorH, mat: materials.wall });   // 방문 위 인방
    box({ x: bdX0, z: wz, w: bdW, d: wt, y: levels[1] + interiorDoorH, h: wTop - interiorDoorH, mat: materials.wall });            // 화장실문 위 인방
    // 표준 방문 — 계단(도착칸)쪽에서 앞방쪽(-Z)으로 열리는 여닫이 0.9×2.1. 경첩=高X(oX1) 모서리, 손잡이=低X 자유단.
    box({ x: oX0, z: wz, w: interiorDoorW, d: 0.04, y: levels[1], h: interiorDoorH, mat: materials.stdRoomDoor });   // 문짝(닫힘, 분리벽 방쪽 면=wz)
    box({ x: oX0 + 0.18, z: wz - 0.03, w: 0.05, d: 0.05, y: levels[1] + 1.02, h: 0.05, mat: materials.handle });           // 손잡이(低X 자유단, 계단쪽)
    const rswing = new THREE.Mesh(
      new THREE.CylinderGeometry(interiorDoorW, interiorDoorW, 0.02, 24, 1, false, Math.PI, Math.PI / 2),
      materials.swingSweepFaint,
    );
    rswing.position.set(oX1, levels[1] + 0.02, wz);   // PI~3PI/2 = -Z(앞방 열림)~-X(닫힘,벽). 경첩 高X
    scene.add(rswing);   // captureInto가 s2Floor2Objects로 자동 수집
    label('표준 방문', oX0 + interiorDoorW / 2, levels[1] + 1.0, wz + 0.025, 'opening');
    // 화장실 문짝 — 앞 분리벽에 폭 0.7. 안방서 밀면 화장실 안(+Z)으로 90° 열림. 경첩=低X(bdX0) 모서리.
    box({ x: bdX0, z: zB0 - 0.04, w: bdW, d: 0.04, y: levels[1], h: interiorDoorH, mat: materials.wcDoor });         // 문짝(닫힘, 분리벽)
    box({ x: bdX1 - 0.18, z: zB0 - 0.07, w: 0.05, d: 0.05, y: levels[1] + 1.02, h: 0.05, mat: materials.handle });   // 손잡이(高X 자유단, 앞방쪽)
    const bswing = new THREE.Mesh(
      new THREE.CylinderGeometry(bdW, bdW, 0.02, 24, 1, false, 0, Math.PI / 2),
      materials.swingSweep,
    );
    bswing.position.set(bdX0, levels[1] + 0.02, zB0);   // 0~PI/2 = +Z(안쪽 열림)~+X(닫힘,벽). 경첩 低X
    scene.add(bswing);   // captureInto가 s2Floor2Objects로 자동 수집
    label('화장실 문', bdX0 + bdW / 2, levels[1] + 1.4, zB0 - 0.05, 'opening');
  }
  // 화장실 低X 벽 — 홈리프트 高X(안방쪽)면에 밀착. 10cm, 바닥~천장. 홈리프트·층계참(低X)과 화장실(高X) 분리.
  box({ x: wcFaceX - 0.10, z: zB0, w: 0.10, d: inZ1 - zB0, y: levels[1], h: (levels[2] - floor3T) - levels[1], mat: materials.wall });
  placeMark(levels[1], false, inX1 - wcFaceX, wF);   // 2층 화장실 = 벽 뺀 실사용 바닥(화장실벽 안쪽 wcFaceX~안방외벽 × 분리벽 안쪽 zB0~뒤벽)
  // 2층 화장실 권장 배치 — 변기(3층과 수직정렬·위치 고정) · 샤워부스 · 세면대(벽수전·좌우 용품여유) · 50L 전기온수기(외벽 상부) · 세탁/건조 예정공간.
  //   막힌 변: 高X 안방 외벽(inX1)·뒤 외벽(inZ1)·低X 도착칸벽(far2+1.3). 문=앞 분리벽(앞방서 밀어 +Z).
  {
    const fy = levels[1], px1 = inX1, pz1 = inZ1, bz0 = zB0;
    // 변기 — 안방쪽-뒤(高X·高Z) 코너. 3층 변기와 X·Z 동일 오프셋 → 오수 입상관 직하(위치 고정). 중심 옆벽서 0.42m.
    toiletAtBack(px1, pz1, fy);   // fixtures 1벌(#12) — 3층 변기와 수직 정렬(오수관 직하)
    label('변기', px1 - 0.63, fy + 0.95, pz1 - 0.45, 'furniture');
    // 샤워부스 — 안방쪽-앞(高X·低Z) 코너. 변기와 함께 왼쪽(안방쪽) 습식존. 0.9×0.85 방수트레이(유리벽 없이 개방 — 변기앞 공간 확보).
    const shW = s2F2.showerW, shD = s2F2.showerD, shx = px1 - shW, shz = bz0;
    box({ x: shx, z: shz, w: shW, d: shD, y: fy, h: 0.06, mat: materials.shower });                       // 방수 트레이
    box({ x: px1 - 0.16, z: shz + 0.42, w: 0.06, d: 0.06, y: fy + 1.9, h: 0.08, mat: materials.handle });  // 샤워헤드(高X 외벽)
    label('샤워부스', shx + shW / 2, fy + 1.05, shz + shD / 2, 'furniture');
    // 세면대 — 변기 옆(3층처럼), 뒤 외벽(高Z)에 등 붙임. 변기와 표준 간격(중심 0.75m). 하부장 폭0.6·깊이0.5. 수전은 뒤 외벽 벽수전.
    const vW = s2F2.vanityW, vD = s2F2.vanityD, vx = inX1 - wcSinkOff, vz = pz1 - vD;
    box({ x: vx, z: vz, w: vW, d: vD, y: fy, h: 0.8, mat: materials.sinkCabinet });                       // 하부장
    box({ x: vx + 0.06, z: vz + 0.1, w: vW - 0.12, d: vD - 0.2, y: fy + 0.8, h: 0.04, mat: materials.sinkBasin });   // 세면볼
    box({ x: vx + vW / 2 - 0.03, z: pz1 - 0.12, w: 0.06, d: 0.10, y: fy + 1.0, h: 0.06, mat: materials.entryFrame });   // 벽수전(뒤 외벽서)
    label('세면대', vx + vW / 2, fy + 1.12, vz + vD / 2, 'furniture');
    // 50L 전기온수기 — 외벽(高Z 뒤) 상부, 변기 위 코너에 벽거치. 50L는 하부장에 숨기기엔 커 외벽 상부에 건다.
    const heater = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.55),
      materials.heaterGhost,
    );
    heater.position.set(px1 - 0.30, fy + 1.95, pz1 - 0.28);
    scene.add(heater);   // captureInto가 s2Floor2Objects로 자동 수집
    label(`전기온수기 ${s2F2.heaterL}L`, px1 - 0.5, fy + 2.3, pz1 - 0.3, 'mep');
  }
  // 안방(앞 트인 방) 크기 라벨 — 게스트룸처럼 실사용 바닥(앞 외벽 안쪽 ~ 분리벽 안쪽 zB0-0.20, 내력벽 20cm). 방 이름 색(연노랑)으로 흰색 치수와 구별.
  const abW = inW, abD = (zB0 - 0.20) - inZ0;
  label(`안방 ${abW.toFixed(2)}×${abD.toFixed(2)}m`, inX0 + abW / 2, levels[1] + 0.4, inZ0 + abD / 2, 'room');
  // 안방 침대 2.0×2.0 (높이 0.4m) — 주방쪽(低X) 외벽 + 앞 외벽(inZ0) 코너에 붙임(머리를 앞쪽으로, 3층 게스트룸1과 동일 방향).
  const bedZ0 = inZ0;
  box({ x: inX0, z: bedZ0, w: 2.0, d: 2.0, y: levels[1], h: 0.4, mat: materials.bed });
  label('침대 2.0×2.0m', inX0 + 1.0, levels[1] + 0.7, bedZ0 + 1.0, 'furniture');
  // 안방 베개 2개 — 머리맡=앞 외벽(低Z)쪽, 게스트룸1과 동일 위치.
  const abPillowMat = materials.pillowWhite;
  for (const cx of [inX0 + 0.5, inX0 + 1.3]) box({ x: cx - 0.35, z: bedZ0 + 0.07, w: 0.7, d: 0.4, y: levels[1] + 0.4, h: 0.1, mat: abPillowMat });
  // 안방 서랍장(낮은 장) — 높이 0.8m·깊이 0.4m. 침대 옆면(방문쪽·高X)에 붙여 침대 길이(2.0m)만큼 나란히.
  const drwD = 0.40;
  box({ x: inX0 + 2.0, z: bedZ0, w: drwD, d: 2.0, y: levels[1], h: 0.80, mat: materials.sinkCabinet });
  label('서랍장 h0.8·d0.4', inX0 + 2.0 + drwD / 2, levels[1] + 1.0, bedZ0 + 1.0, 'furniture');
  // 안방 이불장(붙박이장) — 뒤 계단실 분리벽(zB0-0.20)에 등 붙이고 방 앞(-Z)으로 깊이 0.7m. 침대와 같은 주방쪽 정렬·폭 2.0m. 게스트룸1 붙박이장과 동일 방향.
  const bdgD = 0.70, bdgW = 2.0, bdgH = 2.0;
  const bdgZ1 = zB0 - 0.20, bdgZ0 = bdgZ1 - bdgD;
  box({ x: inX0, z: bdgZ0, w: bdgW, d: bdgD, y: levels[1], h: bdgH, mat: materials.sinkCabinet });
  label(`이불장 ${bdgW.toFixed(1)}×${bdgD.toFixed(1)}m`, inX0 + bdgW / 2, levels[1] + bdgH + 0.3, bdgZ0 + bdgD / 2, 'furniture');
    // 안방 한문형 냉장고 — 1층 기존 냉장고와 동일(311L). 화장실 앞벽 왼쪽 끝(안방 외벽 高X 코너)에 등 붙임. 문=방(低Z)쪽.
    fridge311AtBack({ x0: inX1 - 0.545, backZ: zB0 - 0.20, y: levels[1] });   // fixtures 1벌(#12) — 문은 방 안으로 열림(경첩 안방 외벽쪽·손잡이 주방쪽)
  // 벽걸이 냉난방기(위니아 11평형 MRW11HSF, 실내기 1003×310×222) — 냉장고 위 왼쪽 벽(안방 외벽 高X)에 천장 가까이. 뒤(분리벽쪽)에 맞춰 앞(-Z)으로 뻗음. 토출 -X(실내).
  {
    const acLen = 1.003, acH = 0.310, acD = 0.222;
    const acZ0 = s2F2AcZ0;                             // 안방 좌측창 뒤(高Z) 끝에서 30cm 이격 — 콘센트(outlets)와 단일 출처(#10)
    const acY = levels[1] + 2.7 - 0.15 - acH;          // 천장고 2.7 밑 0.15 여유
    box({ x: inX1 - acD, z: acZ0, w: acD, d: acLen, y: acY, h: acH, mat: materials.wall });                                    // 본체(흰색)
    box({ x: inX1 - acD + 0.02, z: acZ0 + 0.06, w: acD - 0.04, d: acLen - 0.12, y: acY - 0.015, h: 0.025, mat: materials.openingEdge });   // 하부 토출 슬릿
    label('위니아 냉난방기 11평형 MRW11HSF', inX1 - 0.3, acY + 0.17, acZ0 + acLen / 2, 'mep');
  }
  // 안방 책상 — 앞쪽 벽(低Z)에 등 붙이고 왼쪽 벽(高X·안방 외벽)에 붙임. 길이 1.8m(X)·깊이 0.6m·높이 0.72m. 윗판+다리 4.
  {
    const dW = 1.8, dD = 0.6, dH = 0.72, dtop = 0.04, dleg = 0.06;
    const dx1 = inX1, dx0 = dx1 - dW;          // 오른끝=왼쪽 외벽(高X) 밀착
    const dz0 = inZ0;                            // 뒤끝=앞 외벽(低Z) 밀착
    box({ x: dx0, z: dz0, w: dW, d: dD, y: levels[1] + dH - dtop, h: dtop, mat: materials.woodFrame });   // 윗판
    for (const lx of [dx0 + 0.02, dx1 - 0.02 - dleg])
      for (const lz of [dz0 + 0.02, dz0 + dD - 0.02 - dleg])
        box({ x: lx, z: lz, w: dleg, d: dleg, y: levels[1], h: dH - dtop, mat: materials.woodFrame });   // 다리 4
    label(`책상 ${dW.toFixed(1)}×${dD.toFixed(1)}m`, dx0 + dW / 2, levels[1] + dH + 0.3, dz0 + dD / 2, 'furniture');
    // 책상 의자 — 책상 앞(+Z)에 두고 책상(−Z)을 향함. 좌판+등받이+다리 4. 좌판 0.45, 등받이 뒤(高Z)면.
    const cW = 0.45, seatH = 0.45, cLeg = 0.04, ccx = dx0 + dW / 2, ccz = dz0 + dD + 0.28;
    box({ x: ccx - cW / 2, z: ccz - cW / 2, w: cW, d: cW, y: levels[1] + seatH - 0.05, h: 0.05, mat: chairFrameMat });   // 좌판
    box({ x: ccx - cW / 2, z: ccz + cW / 2 - 0.04, w: cW, d: 0.04, y: levels[1] + seatH, h: 0.45, mat: chairFrameMat }); // 등받이(뒤·高Z)
    for (const lx of [ccx - cW / 2 + 0.02, ccx + cW / 2 - 0.02 - cLeg])
      for (const lz of [ccz - cW / 2 + 0.02, ccz + cW / 2 - 0.02 - cLeg])
        box({ x: lx, z: lz, w: cLeg, d: cLeg, y: levels[1], h: seatH - 0.05, mat: chairFrameMat });   // 다리 4
  }
  // 2층 층계참(도착칸)은 '계단' 토글에 포함 — 아래 s2Stair2Objects 블록에서 함께 그림(층 바닥과 분리).
});
}
