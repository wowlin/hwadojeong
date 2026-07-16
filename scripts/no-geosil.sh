#!/usr/bin/env bash
# Stop 게이트 — 이 집엔 '거실'이 없다(低X 앞공간 = 주방). 이번 턴의 assistant 응답 '전체'에 '거실'이 있으면
# 종료를 차단해 강제로 다시 답하게 한다. (구판은 마지막 메시지 1개만 검사 — 같은 턴 앞쪽 메시지 누수, §5-9 수리)
set -euo pipefail
input=$(cat)
tp=$(printf '%s' "$input" | jq -r '.transcript_path // empty' 2>/dev/null || true)
[ -n "${tp:-}" ] && [ -f "$tp" ] || exit 0
hit=$(python3 - "$tp" <<'PY'
import json, sys
msgs = []
for line in open(sys.argv[1], encoding='utf-8'):
    line = line.strip()
    if not line: continue
    try: msgs.append(json.loads(line))
    except Exception: pass
def is_real_user(m):
    if m.get('type') != 'user': return False
    c = (m.get('message') or {}).get('content')
    if isinstance(c, str): return True
    if isinstance(c, list):
        has_text = any(isinstance(p, dict) and p.get('type') == 'text' for p in c)
        has_tool = any(isinstance(p, dict) and p.get('type') == 'tool_result' for p in c)
        return has_text and not has_tool
    return False
last_u = max((i for i, m in enumerate(msgs) if is_real_user(m)), default=-1)
texts = []
for m in msgs[last_u + 1:]:
    if m.get('type') != 'assistant': continue
    for p in ((m.get('message') or {}).get('content') or []):
        if isinstance(p, dict) and p.get('type') == 'text': texts.append(p.get('text') or '')
print('1' if any('거실' in t for t in texts) else '0')
PY
)
if [ "$hit" = "1" ]; then
  jq -n '{decision:"block", reason:"금지어 \"거실\" 사용 감지(이번 턴 응답 전체 검사). 이 집엔 거실이 없다 — 低X 앞공간은 반드시 \"주방\"이다. 응답에서 \"거실\"을 전부 \"주방\"으로 고쳐 다시 답하라."}'
  exit 0
fi
exit 0
