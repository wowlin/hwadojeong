---
name: model-edit
description: src/ 모델 코드 편집 절차 — 편집→검증→커밋 파이프라인. "화면: 요청" 형식 또는 src/ 모델 코드 편집이 필요한 모든 작업에서 자동 트리거.
triggers:
  - "화면:"
  - src/ 모델 코드 편집이 필요한 작업
---

# src/ 모델 코드 편집 절차

## 파일 지도 (어디를 고치나)
- s1(1층+다락+데크): `src/s1/floor1.js`(1층)·`attic.js`(다락)·`roof.js`(지붕·태양광)·`deck.js`(썬룸·데크)·`plan.js`(평면)·`stair.js`(계단)
- s2(3층): `src/s2/constants.js`(제원)·`stair.js`(계단·기초·홈리프트)·`floor2.js`·`floor3.js`·`outlets.js`·`interior.js`(1층 실내)·`walls.js`(외벽·창)·`roof.js`
- 공유: `src/site.js`(대지·담장)·`labels.js`(라벨·치수)·`openings.js`(문·창·벽)·`fixtures.js`(반복 부품)·`materials.js`(색)·`constants.js`/`layout.js`(치수)·`notes.js`(메모)·`ui-shell.js`(버튼 마크업)·`ui.js`(토글·가시성)·`view-state.js`
- `src/main.js` = 오케스트레이터(파이프라인 호출 순서만 — 호출 순서 변경 금지)

## 순서 (생성-검증 패턴)

### 1. 요청 파싱
- "화면: 요청" 형식이면 → 화면 = 콜론 앞, 작업 = 콜론 뒤
- 아니면 → 작업 내용에서 대상 파악

### 2. 편집 (매 줄마다 체크리스트)
편집할 줄을 정한 뒤, **코드를 치기 전에**:
1. 이 줄이 요청에 명시된 대상인가? → No면 멈추고 묻는다
2. 요청 문장에 이 변경을 뒷받침하는 단어가 있는가? → No면 멈추고 묻는다
3. 이 변경을 안 하면 요청한 것 자체가 불가능한가? → No면 묻고 멈춤

### 3. 검증 (§1 단일 출처 + 선택적 verifier)
- **단순·국소 편집**: `npm test`(문법·빌드)만. 통과 → 4단계. (CLAUDE.md §1·§4)
- **범위 위험 편집만** verifier 서브에이전트 호출 — 값·파라미터 분기, 공용 함수 수정 등 의도 밖 부재까지 바뀔 수 있을 때:
```
Agent(subagent_type="verifier", model="opus", prompt="요청: {원문}, 화면: {화면명}")
```
- **PASS** → 4단계로
- **FAIL** → 위반 줄 되돌리고 재편집 또는 사용자에게 묻기
- 렌더/시각 확인은 하지 않는다(사용자 몫, §1).

### 4. 커밋
묻지 않고 즉시:
```
git add src [기타 변경 파일]
git commit -m "한글 요약"
```

### 5. 위반 추적 갱신
`~/.claude/projects/-Users-aine-work-three-house/memory/violation-tracking.md`의 요청 수 +1, 위반이 있었으면 내역 추가.
