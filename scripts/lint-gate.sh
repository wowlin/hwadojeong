#!/usr/bin/env bash
# Stop 게이트 — eslint(미사용 import·변수·죽은 코드 등) 에러가 남아 있으면 종료를 차단한다.
# 세션·모델과 무관하게 "lint 0"을 강제하는 하네스 장치. 규칙 근거: CLAUDE.md §6.
cd /Users/aine/work/three-house || exit 0
out=$(npx eslint src scripts test 2>&1)
code=$?
# code==1: 린트 에러 존재 → 차단. code>=2: eslint 자체 오류(설정 파손 등) → 세션 브릭 방지 위해 통과하되 경고를 남긴다(게이트 무단 개방 감지).
if [ "$code" = "1" ]; then
  n=$(printf '%s' "$out" | grep -oE "[0-9]+ problems?" | tail -1)
  jq -n --arg n "${n:-eslint 에러}" '{decision:"block", reason:("코드 품질 게이트: eslint "+$n+" 남음. 종료 전 `npx eslint src scripts test`를 0으로 만들어라 — 미사용 import·변수·죽은 코드를 전부 제거(숨기거나 넘기지 말 것). 근거: CLAUDE.md §6.")}'
  exit 0
fi
if [ "$code" -ge 2 ]; then
  jq -n --arg o "$(printf '%s' "$out" | tail -3)" '{hookSpecificOutput:{hookEventName:"Stop",additionalContext:("⚠ lint-gate: eslint 자체 오류(설정 파손 의심, exit≥2) — 게이트가 검사 없이 열렸다. 원인: "+$o)}}'
  exit 0
fi
exit 0
