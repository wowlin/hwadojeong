#!/bin/sh
# Stop 훅 게이트 — src 코드에 커밋 안 된 변경이 있으면 (1)유닛 테스트 (2)런타임 렌더 게이트를 돌리고,
# 하나라도 실패하면 종료를 차단(decision:block)한다.
# → 'Claude가 코드를 고친 뒤 테스트로 확인하지 않고 완료보고/사용자에게 검증 떠넘기기'를 하네스가 구조적으로 막는다.
ROOT=/Users/aine/work/three-house
cd "$ROOT" || exit 0

# src에 추적 변경도, 미추적 새 파일도 없으면(=클린/커밋됨) 통과.
if git diff --quiet HEAD -- src && [ -z "$(git ls-files --others --exclude-standard src)" ]; then
  exit 0
fi

fails=""

tout=$(npm test 2>&1)
if [ $? -ne 0 ]; then
  fails="$fails [유닛테스트 실패: $(printf '%s' "$tout" | grep -E 'fail|✖|not ok' | head -4 | tr '\n' ' ')]"
fi

rout=$(npm run check:render 2>&1)
if [ $? -ne 0 ]; then
  fails="$fails [렌더 게이트 실패: $(printf '%s' "$rout" | grep -E '✗|캔버스|에러|PAGEERROR|실패|백지' | head -4 | tr '\n' ' ')]"
fi

if [ -n "$fails" ]; then
  reason=$(printf '%s' "$fails" | sed 's/"/\\"/g')
  printf '{"decision":"block","reason":"코드를 수정한 채 끝내려 함 — 검증 미통과. 사용자에게 확인을 넘기지 말고 직접 고친 뒤 재검증하라.%s"}\n' "$reason"
fi
exit 0
