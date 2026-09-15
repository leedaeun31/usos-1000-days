const apps = [
  ["photos", "📁", "Photos"],
  ["notes", "📝", "Notes"],
  ["maps", "🗺️", "Our places"],
  ["terminal", "💻", "Terminal"],
  ["letter", "💌", "1000days.txt"],
  ["trash", "🗑️", "휴지통"],
];
let z = 10;
const wins = new Map();
const $ = (s) => document.querySelector(s);
const content = {
  welcome: `<div class="welcome"><span class="pill">UsOS ver. 1.0.0</span><div class="eyebrow">A LITTLE SPACE FOR TWO</div><h2>우리의 1000일을 열어볼까?</h2><p>좋아하는 순간들을 폴더에 모으고,<br>아껴둔 마음을 한 줄씩 적었어.<br>여기 있는 모든 건, 너와 나의 이야기야.</p><button class="primary" data-open="photos">📁 추억부터 구경하기</button><p style="font-size:12px;color:#aa91ae">지금은 샘플 이야기로 채워둔 공간이에요.</p></div>`,
  photos: `<span class="pill">OUR MEMORIES · 샘플 앨범</span><div class="cards">${[
    ["☕", "처음의 우리", "조금 서툴러서 더 좋았던 날."],
    ["🌊", "함께 본 바다", "바다보다 네 표정을 더 많이 봤어."],
    ["🌷", "별일 없던 주말", "산책하고, 웃고, 또 걷고."],
    ["🌙", "집에 가는 길", "조금만 더 같이 있고 싶던 밤."],
  ]
    .map(
      ([emoji, title, caption]) =>
        `<button class="photo" data-caption="${caption}"><div class="sample">${emoji}</div><p>${title}</p><small>클릭해서 메모 읽기 ↗</small></button>`,
    )
    .join(
      "",
    )}</div><p class="photo-detail" id="caption">사진이 들어오기 전, 작은 추억 카드들이 기다리고 있어요.</p>`,
  notes: `<span class="pill">마음의 메모장 · 샘플</span><article class="note"><h3>네가 좋은 이유 01.</h3><p>내 하루에서 가장 사소한 이야기도<br>재미있게 들어주는 사람이라서.</p></article><article class="note"><h3>고마웠던 순간</h3><p>해결책보다 내 편이 먼저 필요했던 날,<br>말없이 옆에 있어줘서 고마워.</p></article><article class="note"><h3>다음에도, 우리</h3><p>새로운 곳도 좋지만, 늘 가던 길을<br>너랑 한 번 더 걷고 싶어.</p></article>`,
  maps: `<span class="pill">우리의 장소 · 샘플</span><div class="places"><button class="active" data-places="past">함께 간 곳</button><button data-places="future">같이 가고 싶은 곳</button></div><div id="placelist"></div>`,
  terminal: `<div class="terminal"><div id="terminal-output"><p>UsOS shell [version 1.0.0]<br>Type 'help' to discover a little love.<br>──────────────────────────</p></div><form id="terminal-form"><label for="command">us@love:~$</label><input id="command" autocomplete="off" spellcheck="false" aria-label="터미널 명령어"></form></div>`,
  letter: `<span class="pill">TO. 내가 가장 좋아하는 사람 · 샘플 편지</span><article class="letter">안녕, 나의 가장 다정한 친구.<br><br>함께한 날이 천 번이나 쌓였네.<br>특별한 날도, 아무 일 없던 날도<br>네가 있어서 오래 기억하고 싶어졌어.<br><br>앞으로도 우리,<br>서툰 날엔 서로를 기다려주고<br>좋은 날엔 제일 먼저 서로를 찾자.<br><br>다음 천 일도 너랑 만들고 싶어.<br>늘 고맙고, 많이 좋아해. ♡</article><button class="primary" id="promise">♥ 다음 1000일도 함께하기</button><p id="promise-result" hidden>약속 저장 완료 ♡ 우리의 다음 버전을 기대해.</p>`,
  trash: `<div class="welcome"><div style="font-size:55px">🗑️</div><h2>휴지통이 비어 있어요.</h2><p>너랑 찍은 사진은 못 버리겠어서.<br>우리의 기억은 전부 보관 중 ♡</p></div>`,
};
function openApp(id) {
  $("#menu").hidden = true;
  if (wins.has(id)) {
    const w = wins.get(id);
    w.hidden = false;
    w.style.zIndex = ++z;
    return;
  }
  const app = apps.find((a) => a[0] === id) || [
    "welcome",
    "♥",
    "Welcome to UsOS",
  ];
  const w = document.createElement("section");
  w.className = "window";
  w.setAttribute("aria-label", app[2]);
  w.style.zIndex = ++z;
  w.style.left = `${Math.min(22 + wins.size * 3, 38)}%`;
  w.style.top = `${60 + wins.size * 18}px`;
  w.innerHTML = `<div class="titlebar"><b>${app[1]} &nbsp; ${app[2]}</b><div class="wincontrols"><button aria-label="창 최소화" data-min>−</button><button aria-label="창 닫기" data-close>×</button></div></div><div class="wincontent">${content[id]}</div><div class="winstatus">${id === "welcome" ? "all systems lovely ♡" : "UsOS / " + app[2]}<span style="float:right">with love ♥</span></div>`;
  $("#windows").append(w);
  wins.set(id, w);
  w.addEventListener("pointerdown", () => (w.style.zIndex = ++z));
  w.querySelector("[data-close]").onclick = () => {
    w.remove();
    wins.delete(id);
    renderTasks();
  };
  w.querySelector("[data-min]").onclick = () => {
    w.hidden = true;
  };
  w.querySelectorAll("[data-open]").forEach(
    (b) => (b.onclick = () => openApp(b.dataset.open)),
  );
  const bar = w.querySelector(".titlebar");
  bar.onpointerdown = (e) => {
    if (e.target.closest("button") || innerWidth < 701) return;
    const rect = w.getBoundingClientRect(),
      parent = $("main").getBoundingClientRect();
    const dx = e.clientX - rect.left,
      dy = e.clientY - rect.top;
    bar.setPointerCapture(e.pointerId);
    bar.onpointermove = (ev) => {
      w.style.left =
        Math.max(
          0,
          Math.min(parent.width - w.offsetWidth, ev.clientX - parent.left - dx),
        ) + "px";
      w.style.top =
        Math.max(
          0,
          Math.min(parent.height - 55, ev.clientY - parent.top - dy),
        ) + "px";
    };
    bar.onpointerup = () => (bar.onpointermove = null);
    bar.onlostpointercapture = () => (bar.onpointermove = null);
  };
  if (id === "photos")
    w.querySelectorAll("[data-caption]").forEach(
      (b) =>
        (b.onclick = () => ($("#caption").textContent = b.dataset.caption)),
    );
  if (id === "maps") {
    renderPlaces("past");
    w.querySelectorAll("[data-places]").forEach(
      (b) =>
        (b.onclick = () => {
          w.querySelectorAll("[data-places]").forEach((x) =>
            x.classList.toggle("active", x === b),
          );
          renderPlaces(b.dataset.places);
        }),
    );
  }
  if (id === "terminal")
    $("#terminal-form").onsubmit = (e) => {
      e.preventDefault();
      const input = $("#command"),
        cmd = input.value.trim();
      if (!cmd) return;
      const out = $("#terminal-output");
      if (cmd.toLowerCase() === "clear") out.replaceChildren();
      else {
        const p = document.createElement("p");
        const answers = {
          help: "help · whoami · uptime · love · future\nsudo hug · ls · cat gift.txt · clear",
          whoami: "내가 가장 좋아하는 사람 ♡",
          uptime: "너와 함께한 지 1000일. Happy anniversary!",
          love: "어떤 버전의 너라도, 나는 네 편이야.",
          future: "다음 천 일도 같이 걷고, 웃고, 만들어가기.",
          "sudo hug": "권한이 승인되었습니다. 옆 사람을 안아주세요.",
          "git status": "앞으로 함께할 일이 많이 남아 있습니다.",
          ls: "memories/  notes/  1000days.txt  .secret/",
          "cat gift.txt": "🎁 선물 힌트 자리야. 우리의 비밀이 곧 도착할 예정!",
        };
        p.textContent =
          "us@love:~$ " +
          cmd +
          "\n" +
          (answers[cmd.toLowerCase()] ||
            "아직 모르는 명령어야. help를 입력해 봐 ♡");
        out.append(p);
      }
      input.value = "";
      w.querySelector(".wincontent").scrollTop = 99999;
    };
  if (id === "letter")
    $("#promise").onclick = () => {
      $("#promise-result").hidden = false;
      $("#promise").textContent = "✓ 우리, 약속 완료";
    };
  renderTasks();
}
function renderPlaces(type) {
  const list =
    type === "past"
      ? [
          ["☕", "처음 마주 앉은 카페", "어색한 인사 뒤에 시작된 긴 이야기."],
          ["🌳", "자주 걷던 산책길", "목적지가 없어도 좋았던 길."],
        ]
      : [
          [
            "🌊",
            "바다가 보이는 작은 마을",
            "늦잠 자고, 바다 보고, 맛있는 거 먹기.",
          ],
          ["✨", "별이 쏟아지는 밤", "휴대폰은 잠시 넣고 하늘 보기."],
        ];
  $("#placelist").innerHTML = list
    .map(
      ([icon, name, note]) =>
        `<article class="place"><strong>${icon} ${name}</strong><span>${note}</span></article>`,
    )
    .join("");
}
function renderTasks() {
  $("#tasks").replaceChildren();
  wins.forEach((w, id) => {
    const b = document.createElement("button");
    b.textContent = (apps.find((a) => a[0] === id) || ["", "♥", "Welcome"])[2];
    b.onclick = () => openApp(id);
    $("#tasks").append(b);
  });
}
apps.forEach(([id, icon, name]) => {
  const b = document.createElement("button");
  b.className = "app-icon";
  b.innerHTML = `<span class="icon">${icon}</span><span>${name}</span>`;
  b.onclick = () => openApp(id);
  $("#desktop").append(b);
  const item = document.createElement("button");
  item.textContent = icon + " " + name;
  item.onclick = () => openApp(id);
  $("#menuapps").append(item);
});
$("#start").onclick = () => ($("#menu").hidden = !$("#menu").hidden);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    $("#menu").hidden = true;
    const top = [...wins.entries()]
      .filter(([, w]) => !w.hidden)
      .sort((a, b) => +b[1].style.zIndex - +a[1].style.zIndex)[0];
    if (top) {
      top[1].remove();
      wins.delete(top[0]);
      renderTasks();
    }
  }
});
function tick() {
  const now = new Date();
  $("#clock").textContent = now.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  $("time").textContent = now.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}
tick();
setInterval(tick, 30000);
openApp("welcome");
