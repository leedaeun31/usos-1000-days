import {
  sections,
  labels,
  templates,
  isImage,
  validateContent,
  normalizeContent,
} from "./content-model.js";
import { createImageEditor } from "./image-view.js";
import { GitHubStore } from "./github-store.js";
const $ = (s) => document.querySelector(s);
let data,
  reference,
  store = null,
  section = "site",
  dirty = false,
  busy = false;
const get = (path) => path.split(".").reduce((v, key) => v[key], data);
let imageEditors = [];
function set(path, value) {
  const parts = path.split("."),
    key = parts.pop();
  get(parts.join("."))[key] = value;
  dirty = true;
}
function notice(message, error = false) {
  $("#notice").textContent = message;
  $("#notice").classList.toggle("error", error);
}
function state() {
  document
    .querySelectorAll(".toolbar button")
    .forEach((b) => (b.disabled = !data || busy));
  $("#publish").disabled = !store || busy || !data;
  $("#login button").disabled = busy;
  $("#logout").disabled = busy;
  $("#editor").inert = busy;
  $("#sections").inert = busy;
}
function button(text, handler, className = "") {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = text;
  b.className = className;
  b.onclick = handler;
  return b;
}
function element(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
}
function render() {
  imageEditors.forEach((editor) => editor.destroy());
  imageEditors = [];
  const editor = $("#editor");
  editor.replaceChildren(element("h2", sections[section]));
  fields(data[section], section, editor);
  $("#sections")
    .querySelectorAll("button")
    .forEach((b) =>
      b.classList.toggle("active", b.dataset.section === section),
    );
}
function fields(obj, path, parent) {
  for (const [key, value] of Object.entries(obj)) {
    if (["imageView", "wallpaperView"].includes(key)) continue;
    const full = path + "." + key;
    if (Array.isArray(value)) {
      const wrap = element("div");
      wrap.append(element("h3", (labels[key] || key) + ` (${value.length})`));
      value.forEach((item, i) => {
        const card = element("article", undefined, "group"),
          head = element("div", undefined, "group-head");
        head.append(
          element("strong", item.title || item.command || `항목 ${i + 1}`),
        );
        const up = button("↑", () => {
          [value[i - 1], value[i]] = [value[i], value[i - 1]];
          dirty = true;
          render();
        });
        up.disabled = i === 0;
        up.setAttribute("aria-label", `항목 ${i + 1} 위로`);
        const down = button("↓", () => {
          [value[i + 1], value[i]] = [value[i], value[i + 1]];
          dirty = true;
          render();
        });
        down.disabled = i === value.length - 1;
        down.setAttribute("aria-label", `항목 ${i + 1} 아래로`);
        head.append(
          up,
          down,
          button(
            "삭제",
            () => {
              value.splice(i, 1);
              dirty = true;
              render();
            },
            "remove",
          ),
        );
        card.append(head);
        fields(item, full + "." + i, card);
        wrap.append(card);
      });
      const add = button("+ 항목 추가", () => {
        value.push(structuredClone(templates[full]));
        dirty = true;
        render();
      });
      add.disabled = value.length >= 100;
      wrap.append(add);
      parent.append(wrap);
      continue;
    }
    if (value && typeof value === "object") {
      parent.append(
        element(
          "h3",
          data.apps[key]?.name || labels[key] || key,
          "nested-title",
        ),
      );
      fields(value, full, parent);
      continue;
    }
    const wrap = element("div", undefined, "field"),
      label = element("label", labels[key] || key);
    const media = ["image", "wallpaperImage", "faviconImage", "icon"].includes(
      key,
    );
    const id = "field-" + full;
    label.htmlFor = id;
    wrap.append(label);
    if (!media || key === "icon") {
      const input = document.createElement(
        ["body", "caption", "reply", "intro", "hint", "stickyBody"].includes(
          key,
        )
          ? "textarea"
          : "input",
      );
      input.id = id;
      input.value = isImage(value) && key === "icon" ? "" : value;
      input.oninput = () => set(full, input.value);
      if (key === "icon") input.placeholder = "예: 💜";
      wrap.append(input);
    }
    if (media) {
      if (isImage(value)) {
        if (key === "image" || key === "wallpaperImage") {
          const viewPath =
            path + "." + (key === "image" ? "imageView" : "wallpaperView");
          let ready = false;
          const editor = createImageEditor(
            value,
            obj.title || labels[key],
            get(viewPath),
            (view) => {
              if (ready) set(viewPath, view);
            },
            { wallpaper: key === "wallpaperImage" },
          );
          ready = true;
          wrap.append(editor.root);
          imageEditors.push(editor);
        } else {
          const img = document.createElement("img");
          img.src = value;
          img.alt = labels[key] || "선택한 이미지";
          img.className = "image-preview";
          wrap.append(img);
        }
      }
      const actions = element("div", undefined, "media-actions");
      const upload = document.createElement("input");
      upload.type = "file";
      upload.accept = "image/png,image/jpeg,image/webp";
      upload.id = key === "icon" ? id + "-upload" : id;
      upload.setAttribute("aria-label", (labels[key] || key) + " 업로드");
      upload.onchange = async () => {
        const file = upload.files[0];
        if (!file) return;
        busy = true;
        state();
        try {
          notice("사진 크기를 맞추고 있어요…");
          const result = await compressImage(
            file,
            key === "icon" || key === "faviconImage",
          );
          const before = get(full);
          set(full, result);
          try {
            validateContent(data, reference);
          } catch (error) {
            set(full, before);
            throw error;
          }
          render();
          notice("이미지가 준비됐어요. 미리보기 후 발행해 주세요.");
        } catch (error) {
          notice(error.message, true);
        } finally {
          busy = false;
          state();
        }
      };
      actions.append(
        upload,
        button("이미지 지우기", () => {
          set(full, "");
          render();
        }),
      );
      wrap.append(
        actions,
        element(
          "small",
          "PNG·JPG·WebP · 파일당 15MB까지 선택 가능. 웹용 크기로 자동 압축해요.",
        ),
      );
    }
    parent.append(wrap);
  }
}
async function compressImage(file, icon) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new Error("PNG·JPG·WebP 파일을 선택해 주세요.");
  if (file.size > 15 * 1024 * 1024)
    throw new Error("사진은 15MB 이하로 선택해 주세요.");
  const bitmap = await createImageBitmap(file);
  try {
    const max = icon ? 128 : 1600,
      ratio = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    canvas
      .getContext("2d")
      .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/webp", 0.82);
  } finally {
    bitmap.close();
  }
}
async function draftDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("usos-admin", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("drafts");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () =>
      reject(new Error("이 브라우저에서 초안 저장을 사용할 수 없어요."));
  });
}
async function draft(mode, value) {
  const db = await draftDB();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("drafts", value ? "readwrite" : "readonly"),
        s = tx.objectStore("drafts"),
        req = value ? s.put(value, "content") : s.get("content");
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () =>
        reject(new Error("초안 저장 공간이 부족하거나 사용할 수 없어요."));
      tx.onabort = tx.onerror;
    });
  } finally {
    db.close();
  }
}
$("#save-draft").onclick = async () => {
  try {
    validateContent(data, reference);
    await draft("write", {
      content: structuredClone(data),
      savedAt: new Date().toISOString(),
      head: store?.head || null,
    });
    dirty = false;
    notice("이 기기에 초안을 저장했어요. 사이트에는 아직 반영되지 않았어요.");
  } catch (error) {
    notice(error.message, true);
  }
};
$("#restore").onclick = async () => {
  try {
    const saved = await draft("read");
    if (!saved) throw new Error("이 기기에 저장된 초안이 없어요.");
    if (dirty && !confirm("현재 편집 내용을 초안으로 바꿀까요?")) return;
    validateContent(saved.content, reference);
    data = normalizeContent(saved.content);
    dirty = true;
    render();
    notice(
      saved.head && store && saved.head !== store.head
        ? "초안을 불러왔어요. 저장 이후 원본이 달라졌을 수 있으니 변경 내용을 확인해 주세요."
        : "초안을 불러왔어요. 미리보기 후 발행할 수 있어요.",
    );
  } catch (error) {
    notice(error.message, true);
  }
};
function preview() {
  $("#preview").contentWindow.postMessage(
    { type: "usos-preview", content: data },
    location.origin,
  );
}
$("#preview-button").onclick = () => {
  $("#preview-panel").hidden = false;
  preview();
  $("#preview-panel").scrollIntoView({ behavior: "smooth", block: "start" });
};
$("#close-preview").onclick = () => ($("#preview-panel").hidden = true);
window.addEventListener("message", (event) => {
  if (
    event.origin === location.origin &&
    event.source === $("#preview").contentWindow &&
    event.data?.type === "usos-preview-ready" &&
    data
  )
    preview();
});
$("#login").onsubmit = async (event) => {
  event.preventDefault();
  const token = $("#token").value.trim();
  if (!token) {
    notice("GitHub 저장용 토큰을 입력해 주세요.", true);
    return;
  }
  busy = true;
  state();
  const candidate = new GitHubStore(token);
  $("#token").value = "";
  try {
    await candidate.login();
    const latest = normalizeContent(await candidate.load());
    validateContent(latest, reference);
    store?.logout();
    store = candidate;
    if (!dirty) data = latest;
    $("#auth-status").textContent =
      "leedaeun31 연결됨 · 저장하고 발행할 수 있어요.";
    $("#login").hidden = true;
    $("#logout").hidden = false;
    render();
    notice(
      dirty
        ? "계정이 연결됐어요. 현재 편집 내용을 유지했어요."
        : "계정이 연결됐고 최신 내용을 불러왔어요.",
    );
  } catch (error) {
    candidate.logout();
    notice(error.message, true);
  } finally {
    busy = false;
    state();
  }
};
$("#logout").onclick = () => {
  store?.logout();
  store = null;
  $("#login").hidden = false;
  $("#logout").hidden = true;
  $("#auth-status").textContent =
    "연결이 해제됐어요. 편집 내용은 그대로 유지돼요.";
  state();
};
$("#reload").onclick = async () => {
  if (dirty && !confirm("저장하지 않은 편집 내용을 최신 내용으로 바꿀까요?"))
    return;
  busy = true;
  state();
  try {
    const latest = normalizeContent(
      store ? await store.load() : await fetchContent(),
    );
    validateContent(latest, reference);
    data = latest;
    dirty = false;
    render();
    notice("최신 내용을 불러왔어요.");
  } catch (error) {
    notice(error.message, true);
  } finally {
    busy = false;
    state();
  }
};
$("#publish").onclick = async () => {
  if (!store || busy) return;
  busy = true;
  state();
  try {
    validateContent(data, reference);
    notice("사진과 문구를 GitHub에 저장하고 있어요…");
    const sha = await store.publish(structuredClone(data));
    dirty = false;
    notice(
      "GitHub 저장 완료. 자동 배포가 시작돼요. 반영에는 보통 1~2분이 걸려요.",
    );
    const link = element("a", "배포 진행 확인 ↗");
    link.href = "https://github.com/leedaeun31/usos-1000-days/actions";
    link.target = "_blank";
    link.rel = "noopener";
    $("#notice").append(document.createElement("br"), link);
    await draft("write", {
      content: structuredClone(data),
      savedAt: new Date().toISOString(),
      head: sha,
    }).catch(() => {});
  } catch (error) {
    notice(error.message, true);
  } finally {
    busy = false;
    state();
  }
};
async function fetchContent() {
  const res = await fetch("content.json", { cache: "no-store" });
  if (!res.ok) throw new Error("내용을 불러오지 못했어요. 새로고침해 주세요.");
  return normalizeContent(await res.json());
}
window.addEventListener("beforeunload", (event) => {
  if (dirty || busy) {
    event.preventDefault();
    event.returnValue = "";
  }
});
try {
  data = await fetchContent();
  reference = structuredClone(data);
  for (const [key, title] of Object.entries(sections)) {
    const b = button(title, () => {
      section = key;
      render();
    });
    b.dataset.section = key;
    $("#sections").append(b);
  }
  render();
  state();
  notice(
    "편집할 항목을 선택해 주세요. 초안과 미리보기는 로그인 없이 사용할 수 있어요.",
  );
} catch (error) {
  notice(error.message, true);
}
