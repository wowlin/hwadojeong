#!/usr/bin/env bash
# Stop 게이트 — 이 집엔 '거실'이 없다(低X 앞공간 = 주방). 마지막 assistant 응답에 '거실'이 있으면
# 종료를 차단해 강제로 다시 답하게 한다. 기억/주의에 의존하지 않는 물리적 차단.
set -euo pipefail
input=$(cat)
tp=$(printf '%s' "$input" | jq -r '.transcript_path // empty' 2>/dev/null || true)
[ -n "${tp:-}" ] && [ -f "$tp" ] || exit 0
# 마지막 assistant 메시지의 text 파트만 추출(JSONL 슬럽)
last=$(jq -rs '
  [ .[] | select(.type=="assistant") ] | last // empty
  | (.message.content // []) | map(select(.type=="text") | .text) | join("\n")
' "$tp" 2>/dev/null || true)
if printf '%s' "$last" | grep -q "거실"; then
  jq -n '{decision:"block", reason:"금지어 \"거실\" 사용 감지. 이 집엔 거실이 없다 — 低X 앞공간은 반드시 \"주방\"이다. 응답에서 \"거실\"을 전부 \"주방\"으로 고쳐 다시 답하라."}'
  exit 0
fi
exit 0
