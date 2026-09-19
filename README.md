# HSM — 집 물건 보관 관리 웹앱

집 안 물건을 어디에 뒀는지 도면과 사진으로 기록해두고, 이름으로 검색해서 위치를 찾는 모바일 웹앱입니다.
React + TypeScript + Vite + Tailwind CSS + zustand로 만들었습니다.

프로젝트 규칙과 데이터 모델은 [`CLAUDE.md`](./CLAUDE.md)를 참고하세요.

## Firebase 설정

이 앱은 Firebase(Realtime Database + 익명 로그인)를 사용합니다. `.env.example`을 복사해 `.env`를 만들고,
Firebase 콘솔의 웹 앱 설정값을 채워 넣으세요.

```bash
cp .env.example .env
```

`.env`가 없거나 값이 비어 있으면 앱은 자동으로 로컬(메모리) 저장을 사용합니다(새로고침하면 데이터가 사라짐).

### 보안 규칙 배포

`database.rules.json`에 Realtime Database 규칙이 있습니다(지금은 로그인한 사용자만 접근 가능한 임시 규칙).

- Firebase CLI로 배포: `firebase deploy --only database` (사전에 `firebase login`, `firebase use <프로젝트id>` 필요)
- 또는 Firebase 콘솔 → Realtime Database → Rules 탭에 `database.rules.json` 내용을 붙여넣고 게시

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

Firebase(Realtime Database)에 연결되어 실제로 저장됩니다. `.env`를 설정하지 않으면 로컬(메모리) 저장으로 자동 대체되며, 이 경우 새로고침하면 데이터가 초기화됩니다.
가족 공유 코드와 보안 규칙 강화는 이후 단계에서 추가할 예정입니다.
