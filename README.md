# 화도정 — 주말주택 3D 개념 모형

Three.js로 만든 주말주택(화도정) 3D 개념 도면. 바닥(배치도)·기초·1층·다락·지붕을 토글로 쌓아 보고, 데크·썬룸·외벽·폴딩도어·골조·담장 등을 켜고 끌 수 있다.

## 🔗 라이브 데모

**<https://wowlin.github.io/hwadojeong/>**

`main` 브랜치에 push하면 GitHub Actions(`.github/workflows/deploy.yml`)가 빌드해 GitHub Pages로 자동 배포한다.

## 실행

```bash
npm install
npm run dev      # 개발 서버(http://127.0.0.1:5173)
npm run build    # dist/ 정적 빌드
npm test         # 문법·빌드·용어 회귀 하네스
```

## 방향 규약

도면 해석 방향은 [ORIENTATION.md](ORIENTATION.md)를 따른다(입구·데크 = 아래, 평면 좌 = 안방, 평면 우 = 주방).

## 문서

- [공사비 견적](docs/공사비-견적.md)
- [시공 메모](docs/시공-메모.md)
- [외벽 자재비](docs/외벽-자재비.md)

## 기초

**온통(매트)기초 0.5m** — 집+데크 전면 콘크리트 매트 슬래브 위에 집 바닥재와 데크 페데스탈+포세린이 올라간다. (구안이던 시스템 말뚝기초는 폐기 — 모델·코드에서 제거됨.)
