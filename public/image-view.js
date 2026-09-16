export const DEFAULT_VIEW = { fit: "cover", zoom: 1, x: 50, y: 50 };
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export function normalizeView(view = {}) {
  return {
    fit: view.fit === "contain" ? "contain" : "cover",
    zoom: clamp(Number.isFinite(view.zoom) ? view.zoom : 1, 0.5, 4),
    x: clamp(Number.isFinite(view.x) ? view.x : 50, 0, 100),
    y: clamp(Number.isFinite(view.y) ? view.y : 50, 0, 100),
  };
}
export function imageRect(width, height, naturalWidth, naturalHeight, value) {
  const view = normalizeView(value);
  const scale =
    (view.fit === "contain" ? Math.min : Math.max)(
      width / naturalWidth,
      height / naturalHeight,
    ) * view.zoom;
  const w = naturalWidth * scale,
    h = naturalHeight * scale;
  return {
    width: w,
    height: h,
    left: ((width - w) * view.x) / 100,
    top: ((height - h) * view.y) / 100,
  };
}
export function mountImageStage(stage, src, alt, value, onChange) {
  let view = normalizeView(value),
    rect;
  const img = document.createElement("img");
  img.src = src;
  img.alt = alt;
  img.draggable = false;
  img.className = "framed-image";
  stage.classList.add("image-stage");
  stage.replaceChildren(img);
  const draw = () => {
    if (!img.naturalWidth || !stage.clientWidth || !stage.clientHeight) return;
    rect = imageRect(
      stage.clientWidth,
      stage.clientHeight,
      img.naturalWidth,
      img.naturalHeight,
      view,
    );
    Object.assign(img.style, {
      width: rect.width + "px",
      height: rect.height + "px",
      left: rect.left + "px",
      top: rect.top + "px",
    });
  };
  const set = (next, notify = true) => {
    view = normalizeView(next);
    draw();
    if (notify) onChange?.({ ...view });
  };
  img.onload = draw;
  const observer = new ResizeObserver(draw);
  observer.observe(stage);
  const pointers = new Map();
  let pinchDistance = 0;
  const distance = () => {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  if (onChange) {
    stage.classList.add("interactive");
    stage.onpointerdown = (ev) => {
      if (ev.button !== 0) return;
      stage.setPointerCapture(ev.pointerId);
      pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (pointers.size === 2) pinchDistance = distance();
    };
    stage.onpointermove = (ev) => {
      const previous = pointers.get(ev.pointerId);
      if (!previous || !rect) return;
      const dx = ev.clientX - previous.x,
        dy = ev.clientY - previous.y;
      pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (pointers.size === 2) {
        const d = distance();
        if (pinchDistance > 0)
          set({ ...view, zoom: (view.zoom * d) / pinchDistance });
        pinchDistance = d;
        return;
      }
      if (pointers.size > 2) return;
      set({
        ...view,
        x:
          Math.abs(stage.clientWidth - rect.width) > 1
            ? view.x + (dx * 100) / (stage.clientWidth - rect.width)
            : view.x,
        y:
          Math.abs(stage.clientHeight - rect.height) > 1
            ? view.y + (dy * 100) / (stage.clientHeight - rect.height)
            : view.y,
      });
    };
    const end = (ev) => {
      pointers.delete(ev.pointerId);
      pinchDistance = 0;
    };
    stage.onpointerup = end;
    stage.onpointercancel = end;
    stage.onlostpointercapture = end;
    stage.onwheel = (ev) => {
      ev.preventDefault();
      set({ ...view, zoom: view.zoom * Math.exp(-ev.deltaY * 0.0015) });
    };
  }
  draw();
  return {
    set,
    get: () => ({ ...view }),
    destroy() {
      observer.disconnect();
      img.onload = null;
      stage.onpointerdown =
        stage.onpointermove =
        stage.onpointerup =
        stage.onpointercancel =
        stage.onlostpointercapture =
        stage.onwheel =
          null;
    },
  };
}
export function createImageEditor(src, alt, value, onChange, options = {}) {
  const root = document.createElement("div");
  root.className =
    "image-editor" + (options.wallpaper ? " wallpaper-editor" : "");
  const stage = document.createElement("div");
  root.append(stage);
  const controls = document.createElement("div");
  controls.className = "image-controls";
  root.append(controls);
  const texts = {
    fit: "사진 전체",
    fill: "영역 채우기",
    zoom: "확대·축소",
    x: "가로 위치",
    y: "세로 위치",
    reset: "위치 초기화",
    hint: "사진을 드래그해 위치를 옮기고, 휠 또는 슬라이더로 확대·축소하세요.",
    ...options.texts,
  };
  const inputs = {};
  let controller;
  const update = (view) => {
    for (const [key, input] of Object.entries(inputs)) {
      input.value = view[key];
      input.nextElementSibling.value =
        key === "zoom"
          ? Math.round(view[key] * 100) + "%"
          : Math.round(view[key]) + "%";
    }
    fitButton.setAttribute("aria-pressed", String(view.fit === "contain"));
    fillButton.setAttribute("aria-pressed", String(view.fit === "cover"));
    onChange?.(view);
  };
  const addButton = (text, callback) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = text;
    b.onclick = callback;
    controls.append(b);
    return b;
  };
  const fitButton = addButton(texts.fit, () =>
    controller.set({ ...DEFAULT_VIEW, fit: "contain" }),
  );
  const fillButton = addButton(texts.fill, () =>
    controller.set({ ...DEFAULT_VIEW, fit: "cover" }),
  );
  for (const [key, min, max, step] of [
    ["zoom", 0.5, 4, 0.01],
    ["x", 0, 100, 1],
    ["y", 0, 100, 1],
  ]) {
    const label = document.createElement("label");
    label.textContent = texts[key];
    const input = document.createElement("input");
    input.type = "range";
    input.min = min;
    input.max = max;
    input.step = step;
    input.setAttribute("aria-label", texts[key]);
    input.oninput = () =>
      controller.set({ ...controller.get(), [key]: Number(input.value) });
    const output = document.createElement("output");
    label.append(input, output);
    inputs[key] = input;
    controls.append(label);
  }
  addButton(texts.reset, () =>
    controller.set({ ...controller.get(), zoom: 1, x: 50, y: 50 }),
  );
  const hint = document.createElement("p");
  hint.className = "image-help";
  hint.textContent = texts.hint;
  root.append(hint);
  controller = mountImageStage(stage, src, alt, value, update);
  update(controller.get());
  return { root, destroy: controller.destroy };
}
