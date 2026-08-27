# 나만의 어학학습기

구글 드라이브의 `Audio` 폴더에 mp3를 넣으면, 웹페이지에서 자동으로 목록이 뜨고
듣기 · 3초 앞뒤 이동 · 일시정지 · 따라 말하기 녹음 · 받아쓰기 메모를 할 수 있는
1인용 어학학습기입니다. PC·모바일 브라우저에서 동작하고, 홈 화면에 앱처럼 설치할 수 있습니다.

- **연동 폴더**: 내 드라이브 → `0820-폴더` → `Audio`
  (폴더 ID `1s4unsga_O2BOG5wvzr7t-CkA3XVEAmsB` — `app.js`에 이미 입력됨)
- **로그인**: 내 구글 계정 (읽기 전용 권한 `drive.readonly`)
- **저장**: 녹음과 메모는 저장하지 않음 (페이지를 닫으면 사라짐)

---

## 설치 순서 (처음 한 번, 약 15~20분)

### 0. GitHub 계정  ✅ 완료

- 사용자명: **`kkh-alt`** (이메일 / Free 플랜)
- 앱 주소는 이렇게 됩니다: **`https://kkh-alt.github.io/langlab/`**

### 1. GitHub 저장소 + Pages

1. <https://github.com/new> → **Repository name: `langlab`**, **Public**, 나머지 기본값 → **Create repository**.
2. 만든 저장소 화면에서 **uploading an existing file** 링크 (또는 **Add file ▸ Upload files**) 클릭.
3. `c:\Users\gilbut\Downloads\0820\langlab\` 안의 파일 **7개**를 창으로 드래그:
   `index.html`, `app.js`, `styles.css`, `manifest.webmanifest`, `sw.js`, `icon.svg`, `README.md`
4. 아래 **Commit changes** 클릭.
5. **Settings ▸ Pages** → *Build and deployment* → Source: **Deploy from a branch**
   → Branch: **main** / **/(root)** → **Save**.
6. 1~2분 뒤 페이지 상단에 주소가 뜹니다:
   **`https://kkh-alt.github.io/langlab/`** ← 앱 주소.

### 2. 구글 클라우드에서 OAuth 클라이언트 ID 발급

<https://console.cloud.google.com/> 접속 (앱을 쓸 그 구글 계정으로).

1. 상단 프로젝트 선택 → **새 프로젝트** → 이름 아무거나 → 만들기.
2. **API 및 서비스 ▸ 라이브러리** → `Google Drive API` 검색 → **사용 설정**.
3. **API 및 서비스 ▸ OAuth 동의 화면**
   - User Type: **외부(External)** → 만들기
   - 앱 이름, 사용자 지원 이메일, 개발자 연락처 이메일만 채우고 저장하며 계속
   - **범위(Scopes)**: 아무것도 추가하지 않고 다음 (범위는 코드에서 요청함)
   - **테스트 사용자**: **+ ADD USERS** 로 본인 구글 이메일 추가 → 저장
   - (게시 상태는 "테스트"로 둬도 됩니다. 아래 참고)
4. **API 및 서비스 ▸ 사용자 인증 정보** → **+ 사용자 인증 정보 만들기** → **OAuth 클라이언트 ID**
   - 애플리케이션 유형: **웹 애플리케이션**
   - **승인된 JavaScript 원본** 에 아래를 추가 (경로 `/langlab/` 없이 **출처만**):
     - `https://kkh-alt.github.io`
     - (선택) 로컬 테스트용 `http://localhost:8000`
   - **승인된 리디렉션 URI**: 비워 둠 (필요 없음)
   - 만들기 → 나오는 **클라이언트 ID** 복사 (`...apps.googleusercontent.com`)

### 3. 클라이언트 ID를 코드에 넣기

`app.js` 맨 위:

```js
const CONFIG = {
  CLIENT_ID: 'YOUR_CLIENT_ID.apps.googleusercontent.com',  // ← 여기에 붙여넣기
```

수정 후 다시 커밋/업로드(push). GitHub Pages가 자동으로 갱신됩니다.

### 4. 열어서 로그인

1. 폰이나 PC 브라우저에서 `https://kkh-alt.github.io/langlab/` 접속.
2. **구글로 로그인** → 계정 선택.
3. "**Google에서 확인하지 않은 앱**" 경고가 나오면
   → **고급(Advanced)** → **(안전하지 않음)＜앱 이름＞(으)로 이동** → 허용.
   (내가 만든 개인 앱이라 정상입니다. 테스트 사용자로 등록된 내 계정만 통과됩니다.)
4. `Audio` 폴더의 mp3가 이름 오름차순으로 목록에 뜹니다. 항목을 누르면 재생.
5. 홈 화면에 추가: 크롬 메뉴 ▸ "앱 설치" / 사파리 공유 ▸ "홈 화면에 추가".

---

## 사용법

| 버튼 | 동작 | 단축키(PC) |
|---|---|---|
| ⏪ -3초 | 3초 뒤로 | ← |
| ▶ / ⏸ | 재생 / 일시정지 | Space |
| ⏩ +3초 | 3초 앞으로 | → |
| ● 녹음 | 녹음 시작, 다시 누르면 정지 | R |
| ▶ 내 녹음 듣기 | 방금 녹음 재생 | — |

- 모든 버튼은 클릭·터치 모두 동작합니다.
- 재생바를 드래그하면 원하는 위치로 이동합니다.
- 맨 아래 칸에 받아쓰기/메모를 할 수 있습니다. (저장되지 않음)
- **음원 추가**: 드라이브 `Audio` 폴더에 mp3를 넣고, 앱에서 **↻ 새로고침**.
  파일명을 `01`, `02` … 처럼 앞자리를 맞추면 정렬이 깔끔합니다.

---

## 참고 / 한계

- **재로그인**: OAuth 동의 화면을 "테스트"로 두면 로그인 세션이 주기적으로 만료돼
  가끔 다시 로그인해야 합니다. 자주 거슬리면 동의 화면을 **게시(Production)** 하세요.
  (`drive.readonly`는 민감 범위라 "확인되지 않은 앱" 경고 자체는 남지만 사용에는 문제 없음.)
- **비공개 유지**: 앱은 내 계정으로만 로그인되고 `Audio` 폴더는 계속 비공개입니다.
- **저장 안 함**: 녹음 파일과 메모는 브라우저 메모리에만 있다가 페이지를 닫으면 사라집니다.
  (원하면 나중에 "드라이브에 녹음 업로드" / "메모 자동저장" 기능을 추가할 수 있습니다.)
- **큰 파일**: 음원을 통째로 받아서 재생하므로 한 파일이 수십 MB를 넘으면 로딩이 느릴 수 있습니다.
- **로컬에서 빠르게 보기**: 이 폴더에서
  `python -m http.server 8000` 실행 후 `http://localhost:8000` 접속
  (단, 2번에서 `http://localhost:8000` 을 승인된 원본에 넣어둬야 로그인됨).
