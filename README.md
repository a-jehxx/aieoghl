# HSM — 집 물건 보관 관리 웹앱

집 안 물건을 어디에 뒀는지 도면과 사진으로 기록해두고, 이름으로 검색해서 위치를 찾는 모바일 웹앱입니다.
React + TypeScript + Vite + Tailwind CSS + zustand로 만들었습니다.

프로젝트 규칙과 데이터 모델은 [`CLAUDE.md`](./CLAUDE.md)를 참고하세요.

## 로컬에서 실행하기

```bash
npm install
npm run dev
```

터미널에 나오는 주소(기본 `http://localhost:5173`)를 브라우저에서 열면 됩니다.

## 같은 와이파이에 있는 휴대폰에서 확인하기

```bash
npm run dev -- --host
```

터미널에 표시되는 `Network` 주소(예: `http://192.168.0.x:5173`)를 휴대폰 Chrome 브라우저 주소창에 입력해서 접속합니다.
접속 후 브라우저 메뉴에서 "홈 화면에 추가"를 하면 앱처럼 사용할 수 있습니다.

## 빌드

```bash
npm run build
npm run preview
```

## 현재 상태

지금은 화면 골격과 로컬(메모리) 데이터 저장만 구현되어 있습니다. 새로고침하면 데이터가 초기화됩니다.
Firebase 연결(실제 저장)은 이후 단계에서 추가할 예정입니다.
