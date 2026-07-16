#!/usr/bin/env bash
# Stop 게이트 — "사용자가 보는 곳에 반영됐는가".
# 사용자는 dev 서버(127.0.0.1:5173)로 보고, 그 서버는 항상 LIVE 체크아웃의 작업 트리를 서빙한다.
# 워크트리·다른 브랜치에만 있는 편집은 사용자에겐 '없는 것'이다 — 그 상태로 "확인해 주세요"라고 끝내면
# 사용자가 옛 화면을 보고 "안 됐는데?"라고 다시 부르게 된다(실제 발생). 그걸 세션·모델 무관하게 막는다.
# 규칙 근거: CLAUDE.md §1-1.
set -uo pipefail
LIVE=/Users/aine/work/three-house

input=$(cat)
cwd=$(printf '%s' "$input" | jq -r '.cwd // empty' 2>/dev/null || true)
[ -n "${cwd:-}" ] || exit 0

# LIVE에서 직접 작업 중이면 편집이 곧 사용자 화면 → 검사 불필요.
case "$cwd" in
  */.claude/worktrees/*) ;;
  *) exit 0 ;;
esac
[ -d "$cwd" ] || exit 0

block() { jq -n --arg r "$1" '{decision:"block", reason:$r}'; exit 0; }

# 같은 저장소의 워크트리가 맞는지(공유 object DB) 확인 — 아니면 판단 불가, 통과.
common=$(git -C "$cwd" rev-parse --git-common-dir 2>/dev/null) || exit 0
liveCommon=$(git -C "$LIVE" rev-parse --git-common-dir 2>/dev/null) || exit 0
[ "$(cd "$cwd" && cd "$common" && pwd)" = "$(cd "$LIVE" && cd "$liveCommon" && pwd)" ] || exit 0

# ① 워크트리에 미커밋 src/ 편집이 남아 있으면 반영 자체가 불가능한 상태.
if ! git -C "$cwd" diff --quiet -- src/ 2>/dev/null || ! git -C "$cwd" diff --cached --quiet -- src/ 2>/dev/null; then
  block "반영 게이트: 워크트리에 미커밋 src/ 편집이 남아 있다. 사용자는 dev 서버(=$LIVE 체크아웃)로 보므로 지금 화면엔 이 편집이 없다. 커밋 → LIVE 브랜치 위로 rebase → \`git -C $LIVE merge --ff-only <브랜치>\` 로 반영하고, dev 서버가 새 코드를 서빙하는지 확인한 뒤 보고하라. 근거: CLAUDE.md §1-1."
fi

head=$(git -C "$cwd" rev-parse HEAD 2>/dev/null) || exit 0
liveHead=$(git -C "$LIVE" rev-parse HEAD 2>/dev/null) || exit 0

# ② 내 커밋이 이미 LIVE 브랜치에 들어 있으면 통과(LIVE가 그 뒤로 더 나가도 ancestor라 통과).
git -C "$cwd" merge-base --is-ancestor "$head" "$liveHead" 2>/dev/null && exit 0

# ③ 아직 안 들어갔다 — 단 이 워크트리가 src/를 건드리지 않았다면(문서·설정 전용) 검사 대상 아님.
base=$(git -C "$cwd" merge-base "$head" "$liveHead" 2>/dev/null) || exit 0
if git -C "$cwd" diff --quiet "$base" "$head" -- src/ 2>/dev/null; then exit 0; fi

branch=$(git -C "$cwd" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "<브랜치>")
liveBranch=$(git -C "$LIVE" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "<LIVE 브랜치>")
block "반영 게이트: 브랜치 '$branch'의 src/ 변경이 사용자가 보는 체크아웃($LIVE, 현재 '$liveBranch')에 아직 없다. 사용자는 dev 서버로 보므로 지금 화면엔 옛 코드가 그대로다 — 이 상태로 '확인해 주세요'라고 끝내지 마라. \`git -C $cwd rebase $liveBranch\` → \`git -C $LIVE merge --ff-only $branch\` 로 반영하고 \`curl -s http://127.0.0.1:5173/src/<파일>\`로 서빙을 확인한 뒤 보고하라. 근거: CLAUDE.md §1-1."
