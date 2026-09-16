import { clamp } from "./image-view.js";
export function constrainRect(rect, width, height) {
  const w = clamp(rect.width, Math.min(300, width), width),
    h = clamp(rect.height, Math.min(220, height), height);
  return {
    width: w,
    height: h,
    left: clamp(rect.left, 0, width - w),
    top: clamp(rect.top, 0, height - h),
  };
}
export function resizeRect(start, edge, dx, dy, width, height) {
  let { left, top } = start,
    right = left + start.width,
    bottom = top + start.height;
  const minW = Math.min(300, width),
    minH = Math.min(220, height);
  if (edge.includes("e")) right = clamp(right + dx, left + minW, width);
  if (edge.includes("s")) bottom = clamp(bottom + dy, top + minH, height);
  if (edge.includes("w")) left = clamp(left + dx, 0, right - minW);
  if (edge.includes("n")) top = clamp(top + dy, 0, bottom - minH);
  return { left, top, width: right - left, height: bottom - top };
}
export function setupWindow(
  w,
  desktop,
  { photo = false, index = 0, texts = {} } = {},
) {
  const bar = w.querySelector(".titlebar"),
    maxButton = w.querySelector("[data-max]");
  let maximized = false,
    restore = null;
  const bounds = () => ({
    width: desktop.clientWidth,
    height: desktop.clientHeight,
  });
  const current = () => ({
    left: parseFloat(w.style.left) || 0,
    top: parseFloat(w.style.top) || 0,
    width: parseFloat(w.style.width) || w.offsetWidth,
    height: parseFloat(w.style.height) || w.offsetHeight,
  });
  const apply = (rect) => {
    const b = bounds(),
      r = constrainRect(rect, b.width, b.height);
    Object.assign(w.style, {
      left: r.left + "px",
      top: r.top + "px",
      width: r.width + "px",
      height: r.height + "px",
    });
  };
  const b = bounds();
  apply({
    left:
      b.width < 701 ? 12 : Math.min(b.width * 0.2 + index * 20, b.width - 340),
    top: b.width < 701 ? 18 : 40 + index * 18,
    width: photo ? 800 : 600,
    height: photo ? 650 : 500,
  });
  const toggle = () => {
    maximized = !maximized;
    w.classList.toggle("maximized", maximized);
    if (maximized) {
      restore = current();
      const b = bounds();
      apply({ left: 0, top: 0, ...b });
    } else apply(restore);
    maxButton.textContent = maximized ? "❐" : "□";
    maxButton.setAttribute(
      "aria-label",
      maximized ? texts.restore : texts.maximize,
    );
    maxButton.title = maxButton.getAttribute("aria-label");
  };
  maxButton.onclick = toggle;
  bar.ondblclick = (ev) => {
    if (!ev.target.closest("button")) toggle();
  };
  const drag = (handle, edge) => {
    handle.onpointerdown = (ev) => {
      if (
        ev.button !== 0 ||
        maximized ||
        (!edge && ev.target.closest("button"))
      )
        return;
      ev.preventDefault();
      const start = current(),
        x = ev.clientX,
        y = ev.clientY;
      handle.setPointerCapture(ev.pointerId);
      handle.onpointermove = (move) => {
        const b = bounds();
        apply(
          edge
            ? resizeRect(
                start,
                edge,
                move.clientX - x,
                move.clientY - y,
                b.width,
                b.height,
              )
            : {
                ...start,
                left: start.left + move.clientX - x,
                top: start.top + move.clientY - y,
              },
        );
      };
      const end = () => (handle.onpointermove = null);
      handle.onpointerup = end;
      handle.onpointercancel = end;
      handle.onlostpointercapture = end;
    };
  };
  drag(bar);
  for (const edge of ["n", "e", "s", "w", "ne", "nw", "se", "sw"]) {
    const h = document.createElement("div");
    h.className = "resize-handle resize-" + edge;
    h.dataset.edge = edge;
    h.setAttribute("aria-hidden", "true");
    if (edge === "se") {
      h.removeAttribute("aria-hidden");
      h.setAttribute("role", "button");
      h.tabIndex = 0;
      h.setAttribute("aria-label", texts.resize);
      h.title = texts.resize;
      h.onkeydown = (ev) => {
        const deltas = {
          ArrowRight: [20, 0],
          ArrowLeft: [-20, 0],
          ArrowDown: [0, 20],
          ArrowUp: [0, -20],
        };
        if (!deltas[ev.key] || maximized) return;
        ev.preventDefault();
        const [dx, dy] = deltas[ev.key],
          b = bounds();
        apply(resizeRect(current(), "se", dx, dy, b.width, b.height));
      };
    }
    w.append(h);
    drag(h, edge);
  }
  const observer = new ResizeObserver(() => {
    const b = bounds();
    apply(maximized ? { left: 0, top: 0, ...b } : current());
  });
  observer.observe(desktop);
  return () => observer.disconnect();
}
