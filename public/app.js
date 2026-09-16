import {
  escapeHtml as e,
  iconHtml,
  isImage,
  normalizeContent,
} from "./content-model.js";
import { mountImageStage, createImageEditor } from "./image-view.js";
import { setupWindow } from "./window-manager.js";
let backgroundStage = null,
  photoDialog = null;
let data,
  z = 10;
const wins = new Map();
const $ = (s) => document.querySelector(s);
const lines = (s) => e(s).replaceAll("\n", "<br>");
const desktopIds = ["photos", "notes", "maps", "terminal", "letter", "trash"];
const originalFavicon = document.querySelector('link[rel="icon"]').href;
function renderDesktop(next) {
  data = normalizeContent(next);
  document.title = data.site.title;
  document.querySelector('meta[name="description"]').content =
    data.site.description;
  document.querySelector('link[rel="icon"]').href = isImage(
    data.site.faviconImage,
  )
    ? data.site.faviconImage
    : originalFavicon;
  $("header").innerHTML =
    `<b>${e(data.site.brand)}</b><span>${e(data.site.subtitle)}</span><span class="top-right">${e(data.site.connection)} <time></time></span>`;
  $(".wallpaper").innerHTML =
    `<span>${e(data.site.eyebrow)}</span><h1>${e(data.site.heading)}<span>${e(data.site.tagline)}</span></h1><p>${lines(data.site.intro)}</p><div class="badge">${e(data.site.badge)}</div>`;
  $(".sticky").innerHTML =
    `<small>${e(data.site.stickyTitle)}</small><p>${lines(data.site.stickyBody)}</p><span>${e(data.site.stickyFooter)}</span>`;
  $(".desktop-footer").textContent = data.site.footer;
  $("#start").innerHTML =
    `${e(data.site.start)} <span>${e(data.ui.menuSymbol)}</span>`;
  $(".tray").innerHTML = `${e(data.site.tray)} <span id="clock"></span>`;
  $("#menu>b").textContent = data.site.menu;
  const main = $("main");
  backgroundStage?.destroy();
  document.querySelector("#wallpaper-photo")?.remove();
  if (isImage(data.site.wallpaperImage)) {
    const layer = document.createElement("div");
    layer.id = "wallpaper-photo";
    layer.setAttribute("aria-hidden", "true");
    main.prepend(layer);
    backgroundStage = mountImageStage(
      layer,
      data.site.wallpaperImage,
      "",
      data.site.wallpaperView,
    );
  }
  wins.forEach((w) => w.cleanup?.());
  photoDialog?.close();
  wins.clear();
  $("#windows").replaceChildren();
  $("#desktop").replaceChildren();
  $("#menuapps").replaceChildren();
  $("#desktop").setAttribute("aria-label", data.ui.desktopLabel);
  desktopIds.forEach((id) => {
    const a = data.apps[id];
    const b = document.createElement("button");
    b.className = "app-icon";
    b.innerHTML = `<span class="icon">${iconHtml(a.icon)}</span><span>${e(a.name)}</span>`;
    b.onclick = () => openApp(id);
    $("#desktop").append(b);
    const menu = document.createElement("button");
    menu.innerHTML = `${iconHtml(a.icon)} ${e(a.name)}`;
    menu.onclick = () => openApp(id);
    $("#menuapps").append(menu);
  });
  const admin = document.createElement("a");
  admin.href = "admin.html";
  admin.textContent = data.ui.adminLink;
  admin.className = "admin-link";
  $("#menuapps").append(admin);
  tick();
  renderTasks();
  openApp("welcome");
}
function body(id) {
  const v = data[id];
  switch (id) {
    case "welcome":
      return `<div class="welcome"><span class="pill">${e(v.version)}</span><div class="eyebrow">${e(v.eyebrow)}</div><h2>${e(v.heading)}</h2><p>${lines(v.body)}</p><button class="primary" data-open="photos">${e(v.button)}</button><p class="small-hint">${lines(v.hint)}</p></div>`;
    case "photos":
      return `<span class="pill">${e(v.label)}</span><div class="cards">${v.items.map((p, i) => `<button class="photo" data-photo="${i}" aria-label="${e(p.title + " · " + data.ui.viewPhoto)}"><div class="sample">${isImage(p.image) ? "" : iconHtml(p.icon)}</div><p>${e(p.title)}</p></button>`).join("")}</div><p class="gallery-hint">${e(v.hint)}</p><p class="photo-detail" id="caption">${e(v.empty)}</p>`;
    case "notes":
      return `<span class="pill">${e(v.label)}</span>${v.items.map((n) => `<article class="note"><h3>${e(n.title)}</h3><p>${lines(n.body)}</p></article>`).join("")}`;
    case "maps":
      return `<span class="pill">${e(v.label)}</span><div class="places"><button class="active" data-places="past">${e(v.pastLabel)}</button><button data-places="future">${e(v.futureLabel)}</button></div><div id="placelist"></div>`;
    case "terminal":
      return `<div class="terminal"><div id="terminal-output"><p>${e(v.intro)}</p></div><form id="terminal-form"><label for="command">${e(v.prompt)}</label><input id="command" autocomplete="off" spellcheck="false" aria-label="${e(data.ui.commandLabel)}"></form></div>`;
    case "letter":
      return `<span class="pill">${e(v.label)}</span><article class="letter">${lines(v.body)}</article><button class="primary" id="promise">${e(v.button)}</button><p id="promise-result" hidden>${e(v.result)}</p>`;
    case "trash":
      return `<div class="welcome"><div class="trash-icon">${iconHtml(v.icon)}</div><h2>${e(v.heading)}</h2><p>${lines(v.body)}</p></div>`;
  }
}
function openApp(id) {
  $("#menu").hidden = true;
  if (wins.has(id)) {
    const w = wins.get(id);
    w.hidden = false;
    w.style.zIndex = ++z;
    return;
  }
  const a = data.apps[id],
    w = document.createElement("section");
  w.className = "window";
  w.setAttribute("aria-label", a.name);
  w.style.zIndex = ++z;
  w.style.left = `${Math.min(22 + wins.size * 3, 38)}%`;
  w.style.top = `${60 + wins.size * 18}px`;
  w.innerHTML = `<div class="titlebar"><b>${iconHtml(a.icon)} &nbsp; ${e(a.name)}</b><div class="wincontrols"><button aria-label="${e(data.ui.minimize)}" data-min>${e(data.ui.minimizeSymbol)}</button><button aria-label="${e(data.ui.maximize)}" title="${e(data.ui.maximize)}" data-max>□</button><button aria-label="${e(data.ui.close)}" data-close>${e(data.ui.closeSymbol)}</button></div></div><div class="wincontent">${body(id)}</div><div class="winstatus">${e(id === "welcome" ? data.ui.welcomeStatus : data.ui.statusPrefix + a.name)}<span style="float:right">${e(data.ui.statusLove)}</span></div>`;
  $("#windows").append(w);
  wins.set(id, w);
  const cleanups = [
    setupWindow(w, $("main"), {
      photo: id === "photos",
      index: wins.size - 1,
      texts: data.ui,
    }),
  ];
  w.cleanup = () => cleanups.forEach((cleanup) => cleanup());
  w.addEventListener("pointerdown", () => (w.style.zIndex = ++z));
  w.querySelector("[data-close]").onclick = () => {
    w.cleanup();
    w.remove();
    wins.delete(id);
    renderTasks();
  };
  w.querySelector("[data-min]").onclick = () => (w.hidden = true);
  w.querySelectorAll("[data-open]").forEach(
    (b) => (b.onclick = () => openApp(b.dataset.open)),
  );
  if (id === "photos")
    w.querySelectorAll("[data-photo]").forEach((b) => {
      const p = data.photos.items[Number(b.dataset.photo)];
      if (isImage(p.image)) {
        const stage = mountImageStage(
          b.querySelector(".sample"),
          p.image,
          p.title,
          p.imageView,
        );
        cleanups.push(stage.destroy);
      }
      b.onclick = () => {
        $("#caption").textContent = p.caption;
        if (isImage(p.image)) showPhoto(p, b);
      };
    });
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
    $("#terminal-form").onsubmit = (event) => {
      event.preventDefault();
      const input = $("#command"),
        cmd = input.value.trim();
      if (!cmd) return;
      const out = $("#terminal-output");
      if (cmd.toLowerCase() === "clear") out.replaceChildren();
      else {
        const p = document.createElement("p");
        p.textContent =
          data.terminal.prompt +
          " " +
          cmd +
          "\n" +
          (data.terminal.commands.find(
            (c) => c.command.toLowerCase() === cmd.toLowerCase(),
          )?.reply ?? data.terminal.unknown);
        out.append(p);
      }
      input.value = "";
      w.querySelector(".wincontent").scrollTop = 99999;
    };
  if (id === "letter")
    $("#promise").onclick = () => {
      $("#promise-result").hidden = false;
      $("#promise").textContent = data.letter.done;
    };
  renderTasks();
}
function showPhoto(photo, trigger) {
  const dialog = document.createElement("dialog");
  photoDialog = dialog;
  dialog.className = "photo-viewer";
  dialog.setAttribute("aria-label", photo.title || data.ui.viewPhoto);
  const top = document.createElement("div");
  top.className = "viewer-title";
  const title = document.createElement("h2");
  title.textContent = photo.title;
  const close = document.createElement("button");
  close.textContent = data.ui.closeSymbol;
  close.setAttribute("aria-label", data.ui.close);
  close.onclick = () => dialog.close();
  top.append(title, close);
  dialog.append(top);
  const editor = createImageEditor(
    photo.image,
    photo.title,
    { fit: "contain", zoom: 1, x: 50, y: 50 },
    null,
    {
      texts: {
        fit: data.ui.photoFit,
        fill: data.ui.photoFill,
        zoom: data.ui.photoZoom,
        x: data.ui.photoX,
        y: data.ui.photoY,
        reset: data.ui.photoReset,
        hint: data.ui.photoHelp,
      },
    },
  );
  const caption = document.createElement("p");
  caption.className = "viewer-caption";
  caption.textContent = photo.caption;
  dialog.append(editor.root, caption);
  document.body.append(dialog);
  dialog.onclose = () => {
    editor.destroy();
    dialog.remove();
    photoDialog = null;
    trigger.focus();
  };
  dialog.addEventListener("cancel", (event) => event.stopPropagation());
  dialog.showModal();
}
function renderPlaces(type) {
  $("#placelist").innerHTML = data.maps[type]
    .map(
      (p) =>
        `<article class="place"><strong>${iconHtml(p.icon)} ${e(p.title)}</strong><span>${lines(p.body)}</span></article>`,
    )
    .join("");
}
function renderTasks() {
  $("#tasks").replaceChildren();
  wins.forEach((w, id) => {
    const b = document.createElement("button");
    b.textContent = data.apps[id].name;
    b.onclick = () => openApp(id);
    $("#tasks").append(b);
  });
}
$("#start").onclick = () => ($("#menu").hidden = !$("#menu").hidden);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (photoDialog?.open) return;
    $("#menu").hidden = true;
    const top = [...wins.entries()]
      .filter(([, w]) => !w.hidden)
      .sort((a, b) => +b[1].style.zIndex - +a[1].style.zIndex)[0];
    if (top) {
      top[1].cleanup?.();
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
try {
  const response = await fetch("content.json", { cache: "no-store" });
  if (!response.ok) throw new Error("콘텐츠를 불러오지 못했습니다.");
  renderDesktop(await response.json());
  setInterval(tick, 30000);
} catch (error) {
  const message = document.createElement("p");
  message.className = "load-error";
  message.textContent = "콘텐츠를 불러오지 못했어요. 새로고침해주세요.";
  $("#windows").append(message);
}
if (new URLSearchParams(location.search).has("preview")) {
  window.addEventListener("message", (event) => {
    if (
      event.origin !== location.origin ||
      event.source !== parent ||
      event.data?.type !== "usos-preview"
    )
      return;
    renderDesktop(event.data.content);
  });
  parent.postMessage({ type: "usos-preview-ready" }, location.origin);
}
