const STEP = 0.05;
const WIDTH = 8.5;
const FRONT_Z = -0.7;
const BACK_Z = 3.3;
const DEPTH = BACK_Z - FRONT_Z;
const EXTERIOR = 0.2;
const INTERIOR = 0.1;
const insideX0 = EXTERIOR;
const insideZ0 = FRONT_Z + EXTERIOR;
const insideX1 = WIDTH - EXTERIOR;
const insideZ1 = BACK_Z - EXTERIOR;
const insideD = insideZ1 - insideZ0;
const stairRunW = 1.0;
const stairGap = INTERIOR;
const stairClearW = stairRunW * 2 + stairGap;
const sideRoomW = (insideX1 - insideX0 - stairClearW - INTERIOR * 2) / 2;
const firstLivingW = sideRoomW;
const firstFamilyW = sideRoomW;
const stairClearX = insideX0 + firstLivingW + INTERIOR;
const stairHighXRunX = stairClearX + stairRunW + stairGap;
const stairLowXWallX = stairClearX - INTERIOR;
const stairHighXWallX = stairClearX + stairClearW;
const stairHighXClearX = stairHighXWallX + INTERIOR;
const planLeftFamilyX = stairHighXClearX;
const firstFamilyD = insideD;
const yardSashW = 2.35;
const livingYardSashX = insideX0 + (firstLivingW - yardSashW) / 2;
const entryFrameOuterW = 1.0;
const entryGapStart = stairClearX + (stairClearW - entryFrameOuterW) / 2;
const entryGapEnd = entryGapStart + 1.0;
const interiorDoorW = 0.9;
const familyDoorZ = insideZ0;
const stairTreadDepth = 0.27;
const stairRiserCount = 16;
const lowerStraightTreadCount = 6;
const winderTreadCount = 3;
const upperStraightTreadCount = stairRiserCount - 1 - lowerStraightTreadCount - winderTreadCount;
const stairTurnD = stairRunW;
const stairTurnStart = insideZ1 - stairTurnD;
const stairFirstRunStart = stairTurnStart - stairTreadDepth * lowerStraightTreadCount;
const stairOpeningStart = stairTurnStart - stairTreadDepth * upperStraightTreadCount;
const stairBottomLandingD = stairOpeningStart - insideZ0;
const stairFirstRunEnd = stairTurnStart;
const stairBathDoorW = interiorDoorW;
const stairBathDoorX = stairHighXRunX + (stairRunW - stairBathDoorW) / 2;
const stairBathDoorEndX = stairBathDoorX + stairBathDoorW;
const familyYardSashX = stairHighXClearX + (firstFamilyW - yardSashW) / 2;
const secondRoom2X = stairHighXClearX;
const secondRoom2W = insideX1 - secondRoom2X;
const secondCorridorZ = insideZ0;
const secondCorridorD = stairBottomLandingD;
const secondAtticWallZ = secondCorridorZ + secondCorridorD;
const secondAtticZ = secondAtticWallZ + INTERIOR;
const secondAtticD = insideZ1 - secondAtticZ;
const secondRoom1DoorX = insideX0 + (firstLivingW - interiorDoorW) / 2;
const secondRoom2DoorX = secondRoom2X + (secondRoom2W - interiorDoorW) / 2;

function rect(x, z, w, d, name) {
  return { x, z, w, d, name };
}

function addHorizontalWithGaps(list, x, z, w, gaps, name, thickness = 0.08) {
  let cursor = x;
  for (const [start, end] of gaps.sort((a, b) => a[0] - b[0])) {
    if (start > cursor) list.push(rect(cursor, z, start - cursor, thickness, name));
    cursor = Math.max(cursor, end);
  }
  if (cursor < x + w) list.push(rect(cursor, z, x + w - cursor, thickness, name));
}

function addVerticalWithGaps(list, x, z, d, gaps, name, thickness = 0.08) {
  let cursor = z;
  for (const [start, end] of gaps.sort((a, b) => a[0] - b[0])) {
    if (start > cursor) list.push(rect(x, cursor, thickness, start - cursor, name));
    cursor = Math.max(cursor, end);
  }
  if (cursor < z + d) list.push(rect(x, cursor, thickness, z + d - cursor, name));
}

function contains(r, x, z) {
  return x >= r.x && x <= r.x + r.w && z >= r.z && z <= r.z + r.d;
}

function gridPoint([x, z]) {
  return [Math.round(x / STEP), Math.round(z / STEP)];
}

function key(ix, iz) {
  return `${ix},${iz}`;
}

function reachable(obstacles, start) {
  const [sx, sz] = gridPoint(start);
  const seen = new Set([key(sx, sz)]);
  const queue = [[sx, sz]];
  const isBlocked = (ix, iz) => {
    const x = ix * STEP;
    const z = iz * STEP;
    if (x < 0 || x > WIDTH || z < FRONT_Z - 0.6 || z > BACK_Z) return true;
    return obstacles.some((item) => contains(item, x, z));
  };

  if (isBlocked(sx, sz)) return seen;

  for (let i = 0; i < queue.length; i += 1) {
    const [ix, iz] = queue[i];
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = [ix + dx, iz + dz];
      const nextKey = key(...next);
      if (seen.has(nextKey) || isBlocked(...next)) continue;
      seen.add(nextKey);
      queue.push(next);
    }
  }

  return seen;
}

function check(name, obstacles, start, targets) {
  const seen = reachable(obstacles, start);
  const results = targets.map((target) => {
    const [ix, iz] = gridPoint(target.point);
    const reachable = seen.has(key(ix, iz));
    const ok = target.blocked ? !reachable : reachable;
    return { name: target.name, ok, reachable, blocked: Boolean(target.blocked), point: target.point };
  });
  return { floor: name, results };
}

const walls1 = [];
addHorizontalWithGaps(walls1, 0, FRONT_Z, 8.5, [
  [livingYardSashX, livingYardSashX + yardSashW],
  [entryGapStart, entryGapEnd],
  [familyYardSashX, familyYardSashX + yardSashW]
], 'front exterior', EXTERIOR);
walls1.push(rect(0, insideZ1, 8.5, EXTERIOR, 'rear exterior'));
walls1.push(rect(0, FRONT_Z, EXTERIOR, DEPTH, 'low-x exterior'));
walls1.push(rect(insideX1, FRONT_Z, EXTERIOR, DEPTH, 'high-x exterior'));
walls1.push(rect(stairLowXWallX, stairFirstRunStart, INTERIOR, stairFirstRunEnd - stairFirstRunStart, 'plan-right living/stair stepped wall'));
walls1.push(rect(stairLowXWallX, stairFirstRunEnd, INTERIOR, insideZ1 - stairFirstRunEnd, 'plan-right living-side stair turn wall'));
addVerticalWithGaps(walls1, stairHighXWallX, insideZ0, insideD, [
  [familyDoorZ, familyDoorZ + interiorDoorW]
], 'stair/family wall with family door only', INTERIOR);
addHorizontalWithGaps(walls1, stairHighXRunX, stairFirstRunStart, stairRunW, [
  [stairBathDoorX, stairBathDoorEndX]
], 'under-stair WC front wall with door', INTERIOR);

const walls2 = [];
walls2.push(rect(0, FRONT_Z, 8.5, EXTERIOR, 'front exterior'));
walls2.push(rect(0, insideZ1, 8.5, EXTERIOR, 'rear exterior'));
walls2.push(rect(0, FRONT_Z, EXTERIOR, DEPTH, 'low-x exterior'));
walls2.push(rect(insideX1, FRONT_Z, EXTERIOR, DEPTH, 'high-x exterior'));
addHorizontalWithGaps(walls2, insideX0, secondAtticWallZ, firstLivingW, [[secondRoom1DoorX, secondRoom1DoorX + interiorDoorW]], 'attic room1/corridor wall', INTERIOR);
addHorizontalWithGaps(walls2, secondRoom2X, secondAtticWallZ, secondRoom2W, [[secondRoom2DoorX, secondRoom2DoorX + interiorDoorW]], 'attic room2/corridor wall', INTERIOR);
walls2.push(rect(stairLowXWallX, secondAtticWallZ, INTERIOR, insideZ1 - secondAtticWallZ, 'room1/stair gable wall'));
walls2.push(rect(stairHighXWallX, secondAtticWallZ, INTERIOR, insideZ1 - secondAtticWallZ, 'room2/stair gable wall'));
walls2.push(rect(stairClearX, stairOpeningStart, stairHighXWallX - stairClearX, insideZ1 - stairOpeningStart, '2F stair opening has no floor'));
walls2.push(rect(stairClearX, stairOpeningStart - 0.03, stairHighXRunX - stairClearX, 0.06, 'front guard rail at stair opening'));

const checks = [
  check('1F public path', walls1, [entryGapStart + 0.5, FRONT_Z + 0.3], [
    { name: 'living+kitchen inside', point: [1.3, -0.4] },
    { name: 'stair front remaining area', point: [stairClearX + stairClearW / 2, -0.4] },
    { name: 'under-stair WC through entrance-facing front door', point: [stairHighXRunX + stairRunW / 2, stairFirstRunStart + 0.35] },
    { name: 'first stair tread access after front remaining area', point: [stairLowXWallX + 0.35, stairFirstRunStart + 0.05] },
    { name: 'family room entry side', point: [planLeftFamilyX + firstFamilyW / 2, -0.4] },
    { name: 'family room rear side after bathroom removal', point: [planLeftFamilyX + firstFamilyW / 2, insideZ1 - 0.35] }
  ]),
  check('1F yard-side sash exits', walls1, [livingYardSashX + yardSashW / 2, FRONT_Z - 0.25], [
    { name: 'enter living+kitchen through yard sash', point: [1.3, -0.4] },
    { name: 'reach stair front area from living sash', point: [3.75, -0.4] }
  ]),
  check('1F family yard-side sash exit', walls1, [familyYardSashX + yardSashW / 2, FRONT_Z - 0.25], [
    { name: 'enter family room through yard sash', point: [planLeftFamilyX + firstFamilyW / 2, -0.4] },
    { name: 'reach rear family room from family sash', point: [planLeftFamilyX + firstFamilyW / 2, insideZ1 - 0.35] }
  ]),
  check('2F walls only', walls2, [3.05, -0.4], [
    { name: '2F high-x stair arrival', point: [stairHighXRunX + stairRunW / 2, -0.1] },
    { name: '2F long corridor plan-right end', point: [0.45, -0.35] },
    { name: '2F long corridor center landing', point: [3.4, -0.35] },
    { name: '2F long corridor plan-left end', point: [8.05, -0.35] },
    { name: 'room1 inside', point: [1.7, secondAtticZ + 0.25] },
    { name: 'room1 rear side', point: [1.7, 2.6] },
    { name: 'room2 inside', point: [secondRoom2X + secondRoom2W / 2, secondAtticZ + 0.25] },
    { name: 'room2 rear side after removing WC', point: [secondRoom2X + secondRoom2W / 2, 2.6] },
    { name: 'stair opening is not treated as floor', point: [4.1, 1.0], blocked: true }
  ]),
];

let failed = false;
for (const group of checks) {
  console.log(group.floor);
  for (const result of group.results) {
    const status = result.ok ? 'OK' : (result.blocked ? 'REACHABLE-BUT-SHOULD-BE-BLOCKED' : 'BLOCKED');
    console.log(`  ${status} ${result.name} @ ${result.point.join(',')}`);
    if (!result.ok) failed = true;
  }
}

if (failed) process.exit(1);
