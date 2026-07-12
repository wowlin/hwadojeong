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

도면 해석 방향은 [ORIENTATION.md](ORIENTATION.md)를 따른다(입구·데크 = 아래, 평면 좌 = 가족방, 평면 우 = 주방).

## 문서

- [공사비 견적](docs/공사비-견적.md)
- [시공 메모](docs/시공-메모.md)
- [외벽 자재비](docs/외벽-자재비.md)

## 기초

KC금강컨테이너 주택용 **시스템 말뚝기초(독립기초)** — 강관 말뚝 격자 + 두부 보강판 위에 아연도금 베이스 프레임을 얹고, 그 위에 집 바닥재와 데크 포세린이 올라간다(통슬래브/매트기초 아님).
