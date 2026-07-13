#!/usr/bin/env bash
# Stop 게이트 — eslint(미사용 import·변수·죽은 코드 등) 에러가 남아 있으면 종료를 차단한다.
# 세션·모델과 무관하게 "lint 0"을 강제하는 하네스 장치. 규칙 근거: CLAUDE.md §6.
cd /Users/aine/work/three-house || exit 0
out=$(npx eslint src 2>&1)
code=$?
# code==1: 린트 에러 존재 → 차단. code>=2: eslint 자체 오류(설정 등) → 세션 브릭 방지 위해 통과.
if [ "$code" = "1" ]; then
  n=$(printf '%s' "$out" | grep -oE "[0-9]+ problems?" | tail -1)
  jq -n --arg n "${n:-eslint 에러}" '{decision:"block", reason:("코드 품질 게이트: eslint "+$n+" 남음. 종료 전 `npx eslint src`를 0으로 만들어라 — 미사용 import·변수·죽은 코드를 전부 제거(숨기거나 넘기지 말 것). 근거: CLAUDE.md §6.")}'
  exit 0
fi
exit 0
