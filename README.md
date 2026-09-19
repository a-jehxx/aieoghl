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

Firebase 설정 없이도(또는 설정과 별개로) 메인 화면의 "체험하기" 버튼을 누르면 샘플 집으로 모든 기능을 바로 써볼 수 있습니다. 체험 모드는 Firebase를 전혀 읽거나 쓰지 않고, 종료하면 초기 상태로 돌아갑니다.

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

## Firebase Hosting에 배포하기

폰에서 "홈 화면에 추가"로 진짜 설치하려면 HTTPS 주소가 필요합니다. Firebase Hosting(무료 Spark 요금제)에 배포하세요.

```bash
npm install -g firebase-tools   # 한 번만
firebase login                  # 브라우저에서 Google 계정 로그인
firebase use --add              # 이 프로젝트가 쓸 Firebase 프로젝트 선택
npm run build                   # dist/ 생성
firebase deploy --only hosting,database
```

배포가 끝나면 터미널에 `https://<프로젝트id>.web.app` 형태의 주소가 나옵니다. 이 주소를 폰 Chrome에서 열면 설치 배너(또는 Chrome 메뉴 → 홈 화면에 추가)로 앱처럼 설치할 수 있습니다.
Cloud Functions나 Blaze(종량제) 요금제는 쓰지 않으므로 Spark(무료) 요금제 그대로 배포됩니다.

### 배포 후 점검 목록

- [ ] 배포된 주소를 열면 오류 없이 메인 화면이 뜬다.
- [ ] 새 집을 만들고 도면·가구·보관함 사진을 올린 뒤 새로고침해도 남아 있다.
- [ ] 다른 기기(또는 다른 브라우저 탭)에서 같은 주소를 열면 방금 한 변경이 실시간으로 보인다.
- [ ] 와이파이를 끄면 "인터넷 연결이 필요해요" 배너가 뜨고 수정이 막힌다.
- [ ] "체험하기"를 눌러 샘플 집이 열리고, 검색·깜빡임 안내까지 동작한다. "종료"를 누르면 빈 상태로 돌아간다.
- [ ] 폰 Chrome에서 주소를 열고 "홈 화면에 추가"로 설치한 뒤, 아이콘을 눌러 주소창 없이 열린다.
- [ ] F12 → Application 탭에서 Manifest·Service Worker가 정상으로 인식된다(로컬 `npm run preview` 기준).

## 현재 상태

Firebase(Realtime Database)에 연결되어 실제로 저장됩니다. `.env`를 설정하지 않으면 로컬(메모리) 저장으로 자동 대체되며, 이 경우 새로고침하면 데이터가 초기화됩니다. 체험하기 모드는 항상 별도의 로컬 저장소를 씁니다.
가족 공유 코드 생성·보기 화면과 보안 규칙 강화는 이후 단계에서 추가할 예정입니다.
