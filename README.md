# aieoghl

휴대폰에 설치해서 쓰는 앱을 "바이브 코딩"으로 만들기 위한 프로젝트입니다.
[Expo](https://expo.dev) + React Native + TypeScript로 세팅되어 있으며, 실제 코드를 빌드하지 않고도
휴대폰의 **Expo Go** 앱으로 즉시 실행/미리보기가 가능합니다 (Mac 없이 iOS 테스트도 가능).

## 이 저장소에 이미 세팅된 것

- Expo + React Native + TypeScript 프로젝트 골격 (`App.tsx`, `app.json`, `index.ts`)
- `.gitignore` (node_modules, 빌드 산출물 등 제외)
- `AGENTS.md` / `CLAUDE.md` — Expo 공식 템플릿이 자동으로 넣어준, AI가 최신 Expo 문서를 참고하도록 하는 안내 파일
- `.claude/settings.json` — Expo 전용 Claude Code 플러그인 활성화

## 내 컴퓨터에서 로컬로 바이브 코딩하려면 (이 클라우드 세션과 별개로)

이 세션은 클라우드에 격리된 임시 컨테이너입니다. 내 실제 컴퓨터에서도 Claude Code로 작업하고 싶다면
아래를 로컬 컴퓨터에 설치하세요.

1. **Node.js (LTS, 20 이상 권장)** — https://nodejs.org 에서 설치
2. **Git** — https://git-scm.com
3. **Claude Code CLI** — 터미널에서:
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```
4. **휴대폰에 Expo Go 앱 설치** — 앱스토어/플레이스토어에서 "Expo Go" 검색 후 설치
5. 저장소 클론 후:
   ```bash
   git clone https://github.com/a-jehxx/aieoghl
   cd aieoghl
   npm install
   ```

## 앱 실행하고 휴대폰에서 미리보기

```bash
npm start
```

터미널에 QR 코드가 뜨면, 휴대폰의 **Expo Go 앱**으로 스캔하면 바로 내 폰에서 앱이 실행됩니다.
코드를 수정하면 자동으로 새로고침됩니다 (Fast Refresh).

- `npm run android` — 안드로이드 에뮬레이터/기기로 실행
- `npm run ios` — iOS 시뮬레이터로 실행 (Mac 필요, 실제 기기는 Expo Go로 충분)
- `npm run web` — 브라우저에서 실행

## 이제부터 바이브 코딩 하는 법

Claude Code(이 세션 또는 로컬 CLI)에게 "로그인 화면 만들어줘", "리스트에 스와이프 삭제 추가해줘" 처럼
원하는 기능을 말로 설명하면 `App.tsx`를 비롯한 코드를 직접 작성/수정해 줍니다.
화면에 바로 반영되는지는 `npm start`로 띄운 뒤 Expo Go로 확인하면서 진행하면 됩니다.
