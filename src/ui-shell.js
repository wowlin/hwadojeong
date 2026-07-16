// ui-shell.js — 버튼·탭·설계메모 패널 DOM 셸(순수 마크업, 의존 0) — scene.js가 부팅 시 1회 설치.
// 원래 scene.js에 박혀 있던 마크업을 분리(마크업↔바인딩 분열 해소). ui.js가 직접 담지 않는 이유:
//   ui.js는 scene(camera·controls)을 import해서, 셸을 ui.js에 두면 순환 참조로 설치 시점이 scene 초기화보다 늦어진다.
// 토글(버튼) 추가 = ① 여기 <button id> ② ui.js 바인딩(SEG_KEYS·S1_TOGGLES·bindSegButton) ③ groups.js 그룹.
export function installShell() {
  const app = document.querySelector('#app');
  app.innerHTML = `
    <main class="shell">
      <aside class="sidebar">
        <nav class="scheme-tabs">
          <button id="tabS2" type="button" class="scheme-tab active" data-scheme="s2">3층</button>
          <button id="tabS1" type="button" class="scheme-tab" data-scheme="s1">단층</button>
        </nav>
        <section class="menu-group" data-scheme="s2">
          <h2 class="menu-title">지붕·태양광</h2>
          <div class="seg-row" role="group" aria-label="지붕·태양광">
            <button type="button" class="seg-btn" id="bF3Roof">지붕</button>
            <button type="button" class="seg-btn" id="bF3Solar">태양광</button>
          </div>
        </section>
        <section class="menu-group" data-scheme="s2">
          <h2 class="menu-title">공통</h2>
          <div class="seg-row" role="group" aria-label="공통 계단·홈리프트">
            <button type="button" class="seg-btn" id="bStair">계단</button>
            <button type="button" class="seg-btn" id="bLift">홈리프트</button>
          </div>
        </section>
        <section class="menu-group" data-scheme="s2">
          <h2 class="menu-title">3층</h2>
          <div class="seg-row" role="group" aria-label="3층 외벽·바닥·실외기">
            <button type="button" class="seg-btn" id="bF3Wall">외벽</button>
            <button type="button" class="seg-btn" id="bF3Floor">바닥</button>
            <button type="button" class="seg-btn" id="bF3Ecu">실외기</button>
          </div>
        </section>
        <section class="menu-group" data-scheme="s2">
          <h2 class="menu-title">2층</h2>
          <div class="seg-row" role="group" aria-label="2층 외벽·바닥·실링팬">
            <button type="button" class="seg-btn" id="bF2Wall">외벽</button>
            <button type="button" class="seg-btn" id="bF2Floor">바닥</button>
            <button type="button" class="seg-btn" id="bF2Fan">실링팬</button>
          </div>
        </section>
        <section class="menu-group" data-scheme="s2">
          <h2 class="menu-title">1층</h2>
          <div class="seg-row" role="group" aria-label="1층 외벽·실링팬">
            <button type="button" class="seg-btn" id="bF1Wall">외벽</button>
            <button type="button" class="seg-btn" id="bF1Fan">실링팬</button>
          </div>
          <div class="seg-row" role="group" aria-label="1층 식탁·주방·난로">
            <button type="button" class="seg-btn" id="bF1Furniture">식탁</button>
            <button type="button" class="seg-btn" id="bF1Sink">주방</button>
            <button type="button" class="seg-btn" id="bF1Stove">난로</button>
          </div>
          <div class="seg-row" role="group" aria-label="1층 바닥">
            <button type="button" class="seg-btn" id="bF1Floor">바닥</button>
          </div>
        </section>
        <section class="menu-group" data-scheme="s1">
          <h2 class="menu-title">지붕</h2>
          <div class="seg-row" role="group" aria-label="지붕·태양광">
            <button type="button" class="seg-btn" id="bRoof">지붕</button>
            <button type="button" class="seg-btn" id="bSolar">태양광</button>
          </div>
        </section>
        <section class="menu-group" data-scheme="s1">
          <h2 class="menu-title">다락</h2>
          <div class="seg-row" role="group" aria-label="다락 바닥·내벽·외벽">
            <button type="button" class="seg-btn" id="bLoft">바닥</button>
            <button type="button" class="seg-btn" id="bAtticInnerWall">내벽</button>
            <button type="button" class="seg-btn" id="bAtticExtWall">외벽</button>
          </div>
        </section>
        <section class="menu-group" data-scheme="s1">
          <h2 class="menu-title">포치</h2>
          <div class="seg-row" role="group" aria-label="포치 데크·폴딩">
            <button type="button" class="seg-btn" id="bDeck">데크</button>
            <button type="button" class="seg-btn" id="bFolding">폴딩</button>
            <button type="button" class="seg-btn" id="bSunRoof">지붕</button>
          </div>
          <div class="seg-row" role="group" aria-label="포치 프레임">
            <button type="button" class="seg-btn" id="bFrame">프레임</button>
          </div>
        </section>
        <section class="menu-group" data-scheme="s1">
          <h2 class="menu-title">1층</h2>
          <div class="seg-row" role="group" aria-label="외벽·콘센트">
            <button type="button" class="seg-btn" id="bFirstWall">외벽</button>
            <button type="button" class="seg-btn" id="bFirstOutlet">콘센트</button>
          </div>
          <div class="seg-row" role="group" aria-label="천장·화장실·계단">
            <button type="button" class="seg-btn" id="bFirstCeiling">천장</button>
            <button type="button" class="seg-btn" id="bBath">화장실</button>
            <button type="button" class="seg-btn" id="bS1Stair">계단</button>
          </div>
          <div class="seg-row" role="group" aria-label="바닥">
            <button type="button" class="seg-btn" id="bFirstFloorFinish">바닥</button>
          </div>
        </section>
        <section class="menu-group" data-scheme="shared">
          <h2 class="menu-title">기본</h2>
          <div class="seg-row" role="group" aria-label="기초">
            <button type="button" class="seg-btn" id="bF1Foundation" data-scheme="s2">기초</button>
            <button type="button" class="seg-btn" id="bMatFull" data-scheme="s1">기초</button>
          </div>
          <div class="seg-row" role="group" aria-label="담장">
            <button type="button" class="seg-btn" id="bHedge">측백담장</button>
            <button type="button" class="seg-btn" id="bFence">옆집담장</button>
          </div>
        </section>
      </aside>
      <section class="stage-wrap">
        <div id="stage" aria-label="주말주택 3D 개념 모형"></div>
      </section>
      <aside class="notes">
        <h2 class="notes-title">설계 메모</h2>
        <div id="noteBody" class="note-body"></div>
      </aside>
    </main>
  `;
}
