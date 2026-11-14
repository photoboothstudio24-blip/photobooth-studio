import { applyPipeline, buildParams, ZERO_ADJ, type Adjust } from "./imaging";

export type LayoutId = "single" | "strip2" | "strip3" | "strip4" | "polaroid" | "collage";
export type Layer = { id: number; kind: "emoji" | "text"; value: string; x: number; y: number; size: number; rot: number; opacity: number };
export type Edit = {
  filterId: string; intensity: number; adj: Adjust;
  templateId: string; layout: LayoutId; bg: string; ink: string;
  borderW: number; borderColor: string; pad: number; gap: number; caption: string; layers: Layer[];
};

export const DEFAULT_EDIT: Edit = {
  filterId: "natural", intensity: 80, adj: { ...ZERO_ADJ },
  templateId: "everyday", layout: "strip3", bg: "#FFFFFF", ink: "#16131E",
  borderW: 0, borderColor: "#FFFFFF", pad: 20, gap: 10, caption: "PHOTOBOOTH STUDIO", layers: [],
};

let layerCounter = 0;
export const nextLayerId = () => ++layerCounter;

type Cell = { x: number; y: number; w: number; h: number };
export function geometry(layout: LayoutId, pad: number, gap: number): { W: number; H: number; cells: Cell[]; capY: number; capH: number } {
  const capH = layout === "polaroid" ? 110 : 70;
  if (layout === "single") {
    const W = 600, cw = W - 2 * pad, ch = (cw * 4) / 3;
    return { W, H: pad + ch + capH, cells: [{ x: pad, y: pad, w: cw, h: ch }], capY: pad + ch, capH };
  }
  if (layout === "polaroid") {
    const W = 480, cw = W - 2 * pad;
    return { W, H: pad + cw + capH, cells: [{ x: pad, y: pad, w: cw, h: cw }], capY: pad + cw, capH };
  }
  if (layout === "collage") {
    const W = 600, col = (W - 2 * pad - gap) / 2, lh = 2 * col + gap, rx = pad + col + gap;
    return { W, H: pad + lh + capH, cells: [{ x: pad, y: pad, w: col, h: lh }, { x: rx, y: pad, w: col, h: col }, { x: rx, y: pad + col + gap, w: col, h: col }], capY: pad + lh, capH };
  }
  const n = layout === "strip2" ? 2 : layout === "strip3" ? 3 : 4;
  const W = 360, cw = W - 2 * pad;
  const cells = Array.from({ length: n }, (_, i) => ({ x: pad, y: pad + i * (cw + gap), w: cw, h: cw }));
  const end = pad + n * cw + (n - 1) * gap;
  return { W, H: end + capH, cells, capY: end, capH };
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = url;
  });
}

export function cellCanvas(img: HTMLImageElement, w: number, h: number, filterId: string, intensity: number, adj: Adjust): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  const s = Math.max(c.width / img.naturalWidth, c.height / img.naturalHeight);
  const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
  ctx.drawImage(img, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh);
  applyPipeline(c, buildParams(filterId, intensity, adj));
  return c;
}

/** Synchronous: draws the whole composition. Same code for preview (scale 1) and export (scale >= 1). */
export function renderComposition(canvas: HTMLCanvasElement, e: Edit, images: HTMLImageElement[], scale: number, cache?: Map<string, HTMLCanvasElement>) {
  const g = geometry(e.layout, e.pad, e.gap);
  const w = Math.round(g.W * scale), h = Math.round(g.H * scale);
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = e.bg;
  ctx.fillRect(0, 0, w, h);
  g.cells.forEach((c, i) => {
    const img = images.length ? images[i % images.length] : null;
    if (!img) {
      ctx.fillStyle = "rgba(128,128,128,.25)";
      ctx.fillRect(c.x * scale, c.y * scale, c.w * scale, c.h * scale);
      return;
    }
    const key = `${img.src}|${Math.round(c.w * scale)}x${Math.round(c.h * scale)}|${e.filterId}|${e.intensity}|${JSON.stringify(e.adj)}`;
    let cc = cache?.get(key);
    if (!cc) {
      cc = cellCanvas(img, c.w * scale, c.h * scale, e.filterId, e.intensity, e.adj);
      cache?.set(key, cc);
    }
    ctx.drawImage(cc, c.x * scale, c.y * scale);
    if (e.borderW > 0) {
      ctx.strokeStyle = e.borderColor;
      ctx.lineWidth = e.borderW * scale;
      const o = (e.borderW * scale) / 2;
      ctx.strokeRect(c.x * scale + o, c.y * scale + o, c.w * scale - 2 * o, c.h * scale - 2 * o);
    }
  });
  const font = `"Bricolage Grotesque", system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (e.caption.trim()) {
    ctx.fillStyle = e.ink;
    ctx.font = `700 ${(e.layout === "polaroid" ? 28 : 20) * scale}px ${font}`;
    ctx.fillText(e.caption, (g.W / 2) * scale, (g.capY + g.capH / 2) * scale, (g.W - 2 * e.pad) * scale);
  }
  e.layers.forEach((l) => {
    ctx.save();
    ctx.translate(l.x * g.W * scale, l.y * g.H * scale);
    ctx.rotate((l.rot * Math.PI) / 180);
    ctx.globalAlpha = l.opacity;
    ctx.font = `${l.kind === "text" ? "700 " : ""}${l.size * g.W * scale}px ${font}`;
    ctx.fillStyle = e.ink;
    ctx.fillText(l.value, 0, 0);
    ctx.restore();
  });
}

/** Keeps exported pixels under a safe limit for mobile browsers. */
export function safeScale(layout: LayoutId, pad: number, gap: number, want: number) {
  const g = geometry(layout, pad, gap);
  return Math.max(1, Math.min(want, Math.sqrt(16_000_000 / (g.W * g.H))));
}
