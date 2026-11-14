export type Adjust = { brightness: number; contrast: number; saturation: number; exposure: number; temperature: number; sharpness: number; blur: number; vignette: number; grain: number };
export type Params = Adjust & { sepia: number; gray: number; hue: number };

export const ZERO_ADJ: Adjust = { brightness: 0, contrast: 0, saturation: 0, exposure: 0, temperature: 0, sharpness: 0, blur: 0, vignette: 0, grain: 0 };
export const ZERO_PARAMS: Params = { ...ZERO_ADJ, sepia: 0, gray: 0, hue: 0 };

export const ADJUST_FIELDS: { key: keyof Adjust; label: string; min: number; max: number }[] = [
  { key: "brightness", label: "Brightness", min: -100, max: 100 },
  { key: "contrast", label: "Contrast", min: -100, max: 100 },
  { key: "saturation", label: "Saturation", min: -100, max: 100 },
  { key: "exposure", label: "Exposure", min: -100, max: 100 },
  { key: "temperature", label: "Temperature", min: -100, max: 100 },
  { key: "sharpness", label: "Sharpness", min: 0, max: 100 },
  { key: "blur", label: "Blur", min: 0, max: 10 },
  { key: "vignette", label: "Vignette", min: 0, max: 100 },
  { key: "grain", label: "Grain", min: 0, max: 100 },
];

/** Numeric presets; same ids as FILTERS in data.ts. Values are scaled by intensity. */
export const FILTER_PRESETS: Record<string, Partial<Params>> = {
  vintage: { sepia: 35, contrast: 5, saturation: 30, hue: -8, brightness: -3, grain: 20, vignette: 25 },
  retro: { sepia: 25, saturation: 60, contrast: 10, hue: -18, vignette: 15 },
  film: { contrast: 15, saturation: -15, sepia: 15, brightness: 2, grain: 30 },
  polaroid: { contrast: -5, brightness: 10, saturation: 20, sepia: 20, vignette: 20 },
  bw: { gray: 100, contrast: 10 },
  sepia: { sepia: 90 },
  "soft-contrast": { contrast: -10, brightness: 5, saturation: -10 },
  cinematic: { contrast: 20, saturation: -10, hue: -12, brightness: -8, vignette: 35 },
  warm: { sepia: 20, saturation: 20, hue: -10, brightness: 4, temperature: 25 },
  cool: { saturation: 5, hue: 15, brightness: 3, temperature: -25 },
  natural: { contrast: 4, saturation: 6 },
  y2k: { saturation: 70, contrast: 10, hue: 10, brightness: 8 },
  dreamy: { brightness: 12, contrast: -12, saturation: 20, blur: 1 },
  pastel: { saturation: -30, brightness: 15, contrast: -10 },
  "soft-pink": { sepia: 30, hue: -60, saturation: 30, brightness: 8 },
  fade: { contrast: -20, brightness: 10, saturation: -20 },
  "high-contrast": { contrast: 50, saturation: 20 },
  "soft-blur": { blur: 1.5, brightness: 4 },
};

export function buildParams(filterId: string, intensity: number, adj: Adjust): Params {
  const preset = FILTER_PRESETS[filterId] ?? {};
  const k = intensity / 100;
  const out: Params = { ...ZERO_PARAMS };
  (Object.keys(preset) as (keyof Params)[]).forEach((key) => {
    out[key] = (preset[key] ?? 0) * k;
  });
  (Object.keys(adj) as (keyof Adjust)[]).forEach((key) => {
    out[key] += adj[key];
  });
  return out;
}

function hash(n: number) {
  n = (n ^ 61) ^ (n >>> 16);
  n = n + (n << 3);
  n = n ^ (n >>> 4);
  n = Math.imul(n, 0x27d4eb2d);
  n = n ^ (n >>> 15);
  return (n >>> 0) / 4294967296;
}

/** Pure per-pixel pass (RGBA). Deterministic, so preview and export match. */
export function processPixels(data: Uint8ClampedArray, w: number, h: number, p: Params) {
  const exp = 2 ** (p.exposure / 100);
  const c = p.contrast * 2.55;
  const cf = (259 * (c + 255)) / (255 * (259 - c));
  const bAdd = p.brightness * 2.55;
  const sat = 1 + p.saturation / 100;
  const sep = p.sepia / 100;
  const gr = p.gray / 100;
  const t = p.temperature * 0.6;
  const vig = p.vignette / 100;
  const grain = (p.grain / 100) * 40;
  const rad = (p.hue * Math.PI) / 180;
  const cs = Math.cos(rad);
  const sn = Math.sin(rad);
  const m = [
    0.213 + cs * 0.787 - sn * 0.213, 0.715 - cs * 0.715 - sn * 0.715, 0.072 - cs * 0.072 + sn * 0.928,
    0.213 - cs * 0.213 + sn * 0.143, 0.715 + cs * 0.285 + sn * 0.14, 0.072 - cs * 0.072 - sn * 0.283,
    0.213 - cs * 0.213 - sn * 0.787, 0.715 - cs * 0.715 + sn * 0.715, 0.072 + cs * 0.928 + sn * 0.072,
  ];
  const cx = w / 2;
  const cy = h / 2;
  const maxD = Math.hypot(cx, cy) || 1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      let r = data[i] * exp;
      let g = data[i + 1] * exp;
      let b = data[i + 2] * exp;
      r = (r - 128) * cf + 128 + bAdd + t;
      g = (g - 128) * cf + 128 + bAdd;
      b = (b - 128) * cf + 128 + bAdd - t;
      let lum = 0.299 * r + 0.587 * g + 0.114 * b;
      r = lum + (r - lum) * sat;
      g = lum + (g - lum) * sat;
      b = lum + (b - lum) * sat;
      if (sep > 0) {
        const sr = 0.393 * r + 0.769 * g + 0.189 * b;
        const sg = 0.349 * r + 0.686 * g + 0.168 * b;
        const sb = 0.272 * r + 0.534 * g + 0.131 * b;
        r += (sr - r) * sep;
        g += (sg - g) * sep;
        b += (sb - b) * sep;
      }
      if (gr > 0) {
        lum = 0.299 * r + 0.587 * g + 0.114 * b;
        r += (lum - r) * gr;
        g += (lum - g) * gr;
        b += (lum - b) * gr;
      }
      if (p.hue !== 0) {
        const nr = m[0] * r + m[1] * g + m[2] * b;
        const ng = m[3] * r + m[4] * g + m[5] * b;
        const nb = m[6] * r + m[7] * g + m[8] * b;
        r = nr; g = ng; b = nb;
      }
      if (vig > 0) {
        const d = Math.hypot(x - cx, y - cy) / maxD;
        const f = Math.max(0, 1 - vig * d * d * 1.3);
        r *= f; g *= f; b *= f;
      }
      if (grain > 0) {
        const n = (hash(i) - 0.5) * grain;
        r += n; g += n; b += n;
      }
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }
}

export function sharpen(data: Uint8ClampedArray, w: number, h: number, amount: number) {
  const src = new Uint8ClampedArray(data);
  const k = (amount / 100) * 0.8;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      for (let ch = 0; ch < 3; ch++) {
        const v = src[i + ch];
        const edge = 4 * v - src[i + ch - 4] - src[i + ch + 4] - src[i + ch - w * 4] - src[i + ch + w * 4];
        data[i + ch] = v + k * edge;
      }
    }
  }
}

export function applyPipeline(canvas: HTMLCanvasElement, p: Params) {
  if (Object.values(p).every((v) => v === 0)) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  if (p.blur > 0) {
    const s = 1 / (1 + p.blur * 1.5);
    const tmp = document.createElement("canvas");
    tmp.width = Math.max(1, Math.round(w * s));
    tmp.height = Math.max(1, Math.round(h * s));
    const tc = tmp.getContext("2d");
    if (tc) {
      tc.imageSmoothingQuality = "high";
      tc.drawImage(canvas, 0, 0, tmp.width, tmp.height);
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(tmp, 0, 0, w, h);
    }
  }
  const img = ctx.getImageData(0, 0, w, h);
  processPixels(img.data, w, h, p);
  if (p.sharpness > 0) sharpen(img.data, w, h, p.sharpness);
  ctx.putImageData(img, 0, 0);
}
