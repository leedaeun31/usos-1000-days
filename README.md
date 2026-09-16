# UsOS · 우리의 1000일

크림색·연보라·연핑크의 레트로 데스크톱 웹 프로젝트입니다.
VS Code에서 이 폴더를 열고 수정합니다. 현재 사진 카드와 문구는 샘플입니다.

## 실행

VS Code의 터미널에서 `npm run dev`를 실행하고 http://127.0.0.1:4175 를 엽니다.
PowerShell 실행 정책 때문에 npm 명령이 막히면 `npm.cmd run dev`를 사용합니다.
외부 패키지가 없어서 npm install은 필요 없습니다.
파일 저장 후 브라우저를 새로고침하면 수정 내용을 볼 수 있습니다.
VS Code의 '터미널 → 작업 실행 → UsOS: 실행'으로도 시작할 수 있습니다.

## 수정하는 파일

- `public/index.html`: 바탕화면 구조, 제목, 기본 문구
- `public/style.css`: 색상, 글꼴, 창과 모바일 화면 디자인
- `public/app.js`: 사진 카드, 편지, 메모, 장소 목록, 터미널 및 창 동작
- `public/`: 실제 사진 등 배포에 포함할 파일을 넣는 폴더

## 배포 파일

`npm run check`로 JavaScript 문법을 확인한 후 `npm run build`를 실행합니다.
`dist/`에 만들어진 결과물이 배포 대상입니다. 수정은 public에서 합니다.
`npm run preview`로 배포 결과를 로컬에서 확인할 수 있습니다.

## 현재 기능

앱 열기·닫기·최소화, 데스크톱에서 창 드래그, 작업표시줄, 추억 카드의 메모,
샘플 편지, 장소 목록, 숨은 터미널 명령어를 지원합니다.
Places는 현재 장소 목록이며 실제 지도 연동은 아직 없습니다.
관리자 페이지에서 사진 업로드와 콘텐츠 편집, GitHub 저장 및 자동 배포를 지원합니다.
관리자 인증에는 이 저장소의 Contents 쓰기 권한이 있는 GitHub 토큰을 사용합니다.
실제 기념일 자동 계산과 방문자 로그인 기능은 아직 없습니다.
약속 버튼 상태는 새로고침하면 초기화됩니다.

## 창과 사진 조절

- 창의 가장자리·모서리를 드래그하면 크기가 바뀝니다. 오른쪽 아래 조절점은 방향키로도 조절할 수 있습니다.
- 제목 표시줄의 □ 버튼 또는 제목 표시줄 더블클릭으로 최대화·복원합니다.
- 사용자 화면에서 사진 카드를 누르면 사진 설명만 표시합니다. 확대·축소와 위치 조절 기능은 관리자 페이지에서만 제공합니다.
- 관리자 페이지의 사진첩에서 각 사진의 확대 비율·위치를 조절하고 발행하면 앨범에 적용됩니다. 바탕화면 배경 사진도 같은 방식으로 조절합니다.
- ‘사진 전체’는 사진이 잘리지 않게 맞추고, ‘영역 채우기’는 여백 없이 채웁니다. 사진을 드래그하거나 가로·세로 위치 슬라이더를 사용합니다.
- 사진 원본을 자르지 않고 표시 설정만 저장합니다. 기존 사진과 이전 초안에는 기본 표시 설정이 자동 적용됩니다.

## GitHub Pages로 배포

GitHub 계정 `leedaeun31`에 연결되어 있습니다.

- 웹사이트: https://leedaeun31.github.io/usos-1000-days/
- 소스 저장소: https://github.com/leedaeun31/usos-1000-days
- 배포 상태: https://github.com/leedaeun31/usos-1000-days/actions

`.github/workflows/deploy.yml`이 main 브랜치 변경을 감지해 문법 확인 → 빌드 → 배포를 실행합니다.
샘플로 구성된 현재 프로젝트는 공개 저장소와 공개 웹사이트로 배포됩니다.

최초 배포 후 다시 수정할 때는 VS Code 터미널에서 다음을 실행합니다.

```sh
npm run check
npm run build
git add public scripts package.json README.md .github .vscode .gitignore
git commit -m "Update UsOS"
git push origin main
```

VS Code의 소스 제어 화면에서 변경 내용을 커밋하고 '변경 내용 동기화'를 눌러도 됩니다.
배포 진행 상황은 GitHub 저장소의 Actions 탭에서 확인합니다.
공식 안내: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
