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
사진 업로드·서버 저장·실제 기념일 계산·로그인 기능은 아직 없습니다.
약속 버튼 상태는 새로고침하면 초기화됩니다.

## GitHub Pages로 배포

GitHub 계정은 `leedaeun31`을 사용합니다. 최초 연결과 배포는 GitHub 인증 후 진행합니다.
`.github/workflows/deploy.yml`이 main 브랜치 변경을 감지해 문법 확인 → 빌드 → 배포를 실행합니다.
샘플로 구성된 현재 프로젝트는 공개 저장소와 공개 웹사이트로 배포할 수 있습니다.

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
