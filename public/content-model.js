export const sections = {
  site: "바탕화면",
  apps: "앱 이름과 아이콘",
  welcome: "환영 창",
  photos: "사진첩",
  notes: "메모",
  maps: "장소",
  terminal: "터미널",
  letter: "기념일 편지",
  trash: "휴지통",
  ui: "버튼·상태 표시",
};
export const labels = {
  title: "제목",
  description: "검색 설명",
  brand: "상단 로고 문구",
  subtitle: "상단 부제",
  connection: "연결 문구",
  eyebrow: "작은 영문 제목",
  heading: "큰 제목",
  tagline: "보조 제목",
  intro: "소개 문구",
  badge: "기념일 배지",
  stickyTitle: "메모지 제목",
  stickyBody: "메모지 내용",
  stickyFooter: "메모지 서명",
  footer: "바탕화면 하단 문구",
  start: "시작 버튼",
  tray: "작업표시줄 배지",
  menu: "시작 메뉴 제목",
  wallpaperImage: "바탕화면 배경 사진",
  faviconImage: "브라우저 탭 아이콘",
  icon: "아이콘 (이모지 또는 이미지)",
  name: "앱 이름",
  version: "버전 문구",
  body: "내용",
  button: "버튼 문구",
  hint: "안내 문구",
  label: "상단 라벨",
  empty: "기본 안내 문구",
  items: "항목",
  image: "사진",
  caption: "사진 설명",
  pastLabel: "함께 간 곳 탭",
  futureLabel: "가고 싶은 곳 탭",
  past: "함께 간 곳",
  future: "가고 싶은 곳",
  prompt: "입력 앞 문구",
  unknown: "알 수 없는 명령어 안내",
  commands: "명령어",
  command: "명령어",
  reply: "응답",
  done: "완료 버튼 문구",
  result: "완료 메시지",
  desktopLabel: "바탕화면 접근성 이름",
  minimize: "최소화 버튼 설명",
  close: "닫기 버튼 설명",
  minimizeSymbol: "최소화 기호",
  closeSymbol: "닫기 기호",
  menuSymbol: "시작 메뉴 기호",
  welcomeStatus: "환영 창 하단 상태",
  statusPrefix: "앱 창 하단 접두사",
  statusLove: "앱 창 하단 서명",
  commandLabel: "터미널 입력 설명",
  adminLink: "관리자 링크 문구",
};
export const templates = {
  "photos.items": { icon: "♡", image: "", title: "새로운 추억", caption: "" },
  "notes.items": { title: "새 메모", body: "" },
  "maps.past": { icon: "📍", title: "새 장소", body: "" },
  "maps.future": { icon: "📍", title: "새 장소", body: "" },
  "terminal.commands": { command: "new", reply: "" },
};
export function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
export function isImage(value) {
  return (
    typeof value === "string" &&
    (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value) ||
      /^images\/[a-zA-Z0-9_.-]+$/.test(value))
  );
}
export function iconHtml(value) {
  return isImage(value)
    ? `<img class="custom-icon" src="${escapeHtml(value)}" alt="">`
    : escapeHtml(value);
}
export function validateContent(value, reference) {
  if (JSON.stringify(value).length > 16 * 1024 * 1024)
    throw new Error("사진을 포함한 전체 용량은 16MB 이하로 줄여주세요.");
  const walk = (v, r, path = "") => {
    if (typeof r === "string") {
      if (typeof v !== "string")
        throw new Error(`${path}: 문자열이 필요합니다.`);
      const key = path.split(".").at(-1);
      if (
        ["image", "wallpaperImage", "faviconImage"].includes(key) &&
        v &&
        !isImage(v)
      )
        throw new Error(`${path}: PNG·JPEG·WebP 이미지를 업로드해주세요.`);
      return;
    }
    if (Array.isArray(r)) {
      if (!Array.isArray(v) || v.length > 100)
        throw new Error(`${path}: 항목은 100개까지 가능합니다.`);
      v.forEach((item, i) =>
        walk(item, r[0] || templates[path], `${path}.${i}`),
      );
      return;
    }
    if (!v || typeof v !== "object" || Array.isArray(v))
      throw new Error(`${path}: 잘못된 형식입니다.`);
    for (const k of Object.keys(r)) walk(v[k], r[k], path ? `${path}.${k}` : k);
    for (const k of Object.keys(v))
      if (!Object.hasOwn(r, k))
        throw new Error(`${path}: 알 수 없는 항목 ${k}`);
  };
  walk(value, reference);
  return value;
}
