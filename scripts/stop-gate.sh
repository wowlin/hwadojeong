#!/bin/sh
# Stop 훅 게이트 — Claude가 '확인 안 하고 끝내기'를 구조적으로 막는다.
#
# 막는 구멍 두 개:
#  (1) src 코드를 고친 채 검증 없이 끝내기   → 유닛테스트 + 런타임 렌더 게이트
#  (2) 편집을 안 하고/평면만 보고 "맞다·됐다"고 단정하기(우기기) → 측면 렌더(높이·폭 가시) 강제
#
# 동작: 아래 조건 중 하나라도 걸리면 측면 렌더(shot-side.png)가 '최근(기본 240초)'에
#       생성됐는지 확인한다. 안 됐으면 종료를 차단(decision:block)하고 측면 확인을 요구한다.
#         A. src 에 커밋 안 된 변경이 있다(편집함)
#         B. 마지막 답변이 '기하 주제(계단/높이/폭/정렬/부채꼴/치수…)'에 대해 '완료/일치'를 단정한다
#       또한 src 가 dirty 면 유닛테스트·렌더 게이트도 돌려 실패 시 차단한다.
ROOT=/Users/aine/work/hwadojeong
cd "$ROOT" || exit 0

INPUT=$(cat 2>/dev/null)
TRANSCRIPT=$(printf '%s' "$INPUT" | jq -r '.transcript_path // empty' 2>/dev/null)

# --- src 변경 여부 ---
SRC_DIRTY=0
if ! git diff --quiet HEAD -- src 2>/dev/null || [ -n "$(git ls-files --others --exclude-standard src 2>/dev/null)" ]; then
  SRC_DIRTY=1
fi

# --- 마지막 답변 텍스트(최근 assistant 메시지들) ---
LAST=""
if [ -n "$TRANSCRIPT" ] && [ -f "$TRANSCRIPT" ]; then
  LAST=$(tail -n 80 "$TRANSCRIPT" 2>/dev/null | jq -r 'select(.type=="assistant") | (.message.content // []) | .[]? | select(.type=="text") | .text' 2>/dev/null | tail -n 80)
fi

# 완료/일치 단정 + 기하 주제가 동시에 있으면 '눈으로 확인'을 단정한 것으로 본다.
CLAIM=0; TOPIC=0
if printf '%s' "$LAST" | grep -Eq '맞췄|맞춰|맞습니다|맞다|맞아|이어져|연결돼|연결되|완료|됐습니다|됐어|정상|문제 ?없|이미 (맞|동일|같|되|충족)|동일합니다|일치|제대로|확인했|확인 ?완료|확인됨|읽었|보였|보임'; then CLAIM=1; fi
if printf '%s' "$LAST" | grep -Eq '계단|높이|폭|위치|정렬|부채꼴|치수|단높이|디딤|기하|좌표|간격|튀어|어긋'; then TOPIC=1; fi

NEED_SIDE=0
[ "$SRC_DIRTY" -eq 1 ] && NEED_SIDE=1
# 단순 질문(코드 변경 없음)에는 측면 렌더를 강제하지 않는다 — 편집했을 때(SRC_DIRTY)만 측면 확인 요구.
# (CLAIM·TOPIC는 위에서 계산만 하고 트리거엔 쓰지 않음: Q&A 반복 차단 방지)

# 코드 변경이 없으면 통과.
[ "$NEED_SIDE" -eq 0 ] && exit 0

fails=""

# --- (2) 측면 렌더 최신성: shot-side.png 가 최근 240초 내에 갱신됐는가 ---
SIDE="$ROOT/shot-side.png"
NOW=$(date +%s)
AGE=999999
if [ -f "$SIDE" ]; then
  MT=$(stat -f %m "$SIDE" 2>/dev/null || echo 0)
  AGE=$((NOW - MT))
fi
if [ "$AGE" -gt 240 ]; then
  fails="$fails [측면 렌더 미확인 — 평면 shot으로는 높이가 안 보인다. 'npm run shot:side' 를 돌려 shot-side.png 와 shot-side-corner.png 를 Read 로 직접 열어 높이·폭이 직선 계단과 맞는지 눈으로 확인하고 보고하라. ★이미지를 '열기만' 한 건 확인이 아니다 — 라벨·치수·부재가 작아서 안 읽히면 카메라 핸들 window.__cc 로 줌인하거나 영역을 나눠 확대 캡처해서 실제로 읽어라. 못 읽은 채 '확인했다/잘됐다/맞다'고 하면 거짓 보고다. 못 읽었으면 '확인 못 했다'고 말하라]"
fi

# --- (1) src dirty 면 유닛테스트 + 런타임 렌더 게이트 ---
if [ "$SRC_DIRTY" -eq 1 ]; then
  tout=$(npm test 2>&1)
  if [ $? -ne 0 ]; then
    fails="$fails [유닛테스트 실패: $(printf '%s' "$tout" | grep -E 'fail|✖|not ok' | head -4 | tr '\n' ' ')]"
  fi
  rout=$(npm run check:render 2>&1)
  if [ $? -ne 0 ]; then
    fails="$fails [렌더 게이트 실패: $(printf '%s' "$rout" | grep -E '✗|캔버스|에러|PAGEERROR|실패|백지' | head -4 | tr '\n' ' ')]"
  fi
fi

if [ -n "$fails" ]; then
  reason=$(printf '%s' "$fails" | sed 's/"/\\"/g' | tr '\n' ' ')
  printf '{"decision":"block","reason":"확인 안 하고 끝내려 함 — 사용자에게 검증을 떠넘기지 말고 직접 화면으로 확인하라.%s"}\n' "$reason"
fi
exit 0
